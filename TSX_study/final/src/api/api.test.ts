import { http, HttpResponse } from 'msw'
import { server, apiError } from '@/test/server'
import { loginAs } from '@/test/utils'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { jun } from '@/test/fixtures'
import { apiClient, UNAUTHORIZED_EVENT } from './client'
import { ApiError, toApiError } from './errors'
import { createPost, deletePost, fetchPost, fetchPosts, updatePost } from './posts'
import { login, signup } from './auth'
import { createComment, deleteComment, fetchComments } from './comments'
import { chat, streamChat } from './ai'

describe('apiClient 인터셉터', () => {
  it('토큰이 있으면 Authorization: Bearer 를 붙이고, 없으면 붙이지 않는다', async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get('*/api/ping', ({ request }) => {
        seen.push(request.headers.get('authorization'))
        return HttpResponse.json({})
      }),
    )
    await apiClient.get('/api/ping')
    loginAs()
    await apiClient.get('/api/ping')
    expect(seen).toEqual([null, 'Bearer token-mina'])
  })

  it('401: 로그인 상태면 세션을 비우고 이벤트를 보낸다', async () => {
    server.use(http.get('*/api/secure', () => apiError(401, 'UNAUTHORIZED', '만료')))
    loginAs()
    const onEvent = vi.fn()
    window.addEventListener(UNAUTHORIZED_EVENT, onEvent)
    await expect(apiClient.get('/api/secure')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
    window.removeEventListener(UNAUTHORIZED_EVENT, onEvent)
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(onEvent).toHaveBeenCalledTimes(1)
  })

  it('401: 비로그인(토큰 없음)이면 이벤트 없이 오류만 던진다 — 무한 리다이렉트 방지', async () => {
    server.use(http.get('*/api/secure', () => apiError(401, 'UNAUTHORIZED', '로그인 필요')))
    const onEvent = vi.fn()
    window.addEventListener(UNAUTHORIZED_EVENT, onEvent)
    await expect(apiClient.get('/api/secure')).rejects.toBeInstanceOf(ApiError)
    window.removeEventListener(UNAUTHORIZED_EVENT, onEvent)
    expect(onEvent).not.toHaveBeenCalled()
  })

  it('로그인 요청의 401(INVALID_CREDENTIALS)은 세션 만료로 취급하지 않는다', async () => {
    loginAs()
    const onEvent = vi.fn()
    window.addEventListener(UNAUTHORIZED_EVENT, onEvent)
    await expect(login('x@y.z', 'bad')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    window.removeEventListener(UNAUTHORIZED_EVENT, onEvent)
    expect(onEvent).not.toHaveBeenCalled()
    expect(useAuthStore.getState().accessToken).toBe('token-mina')
  })

  it('403: 로그아웃하지 않고 안내 토스트만 띄운다', async () => {
    server.use(http.delete('*/api/posts/1', () => apiError(403, 'FORBIDDEN', '작성자만')))
    loginAs(jun)
    await expect(deletePost(1)).rejects.toMatchObject({ status: 403 })
    expect(useAuthStore.getState().accessToken).toBe('token-jun')
    expect(useToastStore.getState().toasts[0]?.message).toMatch(/권한/)
  })

  it('네트워크 오류는 NETWORK ApiError 로 바뀐다', async () => {
    server.use(http.get('*/api/down', () => HttpResponse.error()))
    await expect(apiClient.get('/api/down')).rejects.toMatchObject({ status: 0, code: 'NETWORK' })
  })
})

describe('toApiError', () => {
  it('스펙 v1 오류 본문 → status/code/message/fields/requestId', async () => {
    server.use(
      http.post('*/api/x', () => apiError(400, 'VALIDATION_ERROR', '확인', { title: ['필수'] })),
    )
    const err = await apiClient.post('/api/x').catch((e) => e)
    expect(err).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      fields: { title: ['필수'] },
      requestId: 'req-1',
    })
  })

  it('스펙을 따르지 않는 { message } 오류도 처리한다 (Spring 기존 API)', async () => {
    server.use(
      http.get('*/legacy', () =>
        HttpResponse.json({ message: '제목은 필수입니다.' }, { status: 400 }),
      ),
    )
    const err = await apiClient.get('/legacy').catch((e) => e)
    expect(err).toMatchObject({ status: 400, code: 'HTTP_400', message: '제목은 필수입니다.' })
  })

  it('알 수 없는 값도 ApiError 로', () => {
    expect(toApiError('이상한 값')).toBeInstanceOf(ApiError)
    expect(toApiError(new Error('boom')).message).toBe('boom')
  })
})

describe('API 함수 (스펙 v1)', () => {
  it('fetchPosts: page/limit/q 를 보내고 { items, meta } 로 푼다', async () => {
    const { items, meta } = await fetchPosts({ page: 2, limit: 10 })
    expect(items).toHaveLength(10)
    expect(items[0]?.id).toBe(11)
    expect(meta).toMatchObject({ page: 2, total: 25, totalPages: 3 })
    expect(
      (await fetchPosts({ page: 1, limit: 10, q: '글 2' })).items.every((p) =>
        p.title.includes('글 2'),
      ),
    ).toBe(true)
  })

  it('응답이 스펙과 다르면 zod 가 즉시 실패한다', async () => {
    server.use(http.get('*/api/posts/1', () => HttpResponse.json({ data: { id: 'not-a-number' } })))
    await expect(fetchPost(1)).rejects.toThrow()
  })

  it('create / update / delete', async () => {
    server.use(
      http.post('*/api/posts', async ({ request }) =>
        HttpResponse.json(
          {
            data: {
              ...(await import('@/test/fixtures')).post(99),
              ...((await request.json()) as object),
            },
          },
          { status: 201 },
        ),
      ),
      http.patch('*/api/posts/1', async ({ request }) =>
        HttpResponse.json({
          data: {
            ...(await import('@/test/fixtures')).post(1),
            ...((await request.json()) as object),
          },
        }),
      ),
      http.delete('*/api/posts/1', () => new HttpResponse(null, { status: 204 })),
    )
    expect((await createPost({ title: '새 글', body: '본문' })).title).toBe('새 글')
    expect((await updatePost(1, { title: '수정' })).title).toBe('수정')
    await expect(deletePost(1)).resolves.toBeUndefined()
  })

  it('signup / comments', async () => {
    server.use(
      http.post('*/api/auth/signup', () =>
        HttpResponse.json({ data: { user: jun } }, { status: 201 }),
      ),
      http.post('*/api/posts/1/comments', () =>
        HttpResponse.json(
          {
            data: {
              id: 5,
              postId: 1,
              body: '새 댓글',
              author: { id: 2, nickname: 'jun' },
              createdAt: '2026-11-01T00:00:00Z',
            },
          },
          { status: 201 },
        ),
      ),
      http.delete('*/api/comments/5', () => new HttpResponse(null, { status: 204 })),
    )
    expect(
      (await signup({ email: 'jun@example.com', password: 'password123', nickname: 'jun' }))
        ?.nickname,
    ).toBe('jun')
    expect(await fetchComments(1)).toHaveLength(1)
    expect((await createComment(1, '새 댓글')).id).toBe(5)
    await expect(deleteComment(5)).resolves.toBeUndefined()
  })
})

describe('AI API (POST /api/ai/chat, /api/ai/chat/stream)', () => {
  it('chat: data.text 와 meta.usage 를 돌려준다', async () => {
    let body: unknown
    server.use(
      http.post('*/api/ai/chat', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({
          data: { text: '다듬은 글' },
          meta: { usage: { inputTokens: 5, outputTokens: 7 } },
        })
      }),
    )
    loginAs()
    expect(await chat([{ role: 'user', content: '안녕' }])).toEqual({
      text: '다듬은 글',
      usage: { inputTokens: 5, outputTokens: 7 },
    })
    expect(body).toEqual({ messages: [{ role: 'user', content: '안녕' }] })
  })

  it('한도 초과(429 AI_QUOTA_EXCEEDED)는 ApiError 로', async () => {
    server.use(
      http.post('*/api/ai/chat', () =>
        apiError(429, 'AI_QUOTA_EXCEEDED', '오늘의 AI 사용량 한도를 넘었습니다.'),
      ),
    )
    loginAs()
    await expect(chat([{ role: 'user', content: 'x' }])).rejects.toMatchObject({
      status: 429,
      code: 'AI_QUOTA_EXCEEDED',
    })
  })

  it('streamChat: 스트림 시작 전 401 이면 세션을 정리하고 이벤트를 보낸다', async () => {
    server.use(http.post('*/api/ai/chat/stream', () => apiError(401, 'UNAUTHORIZED', '만료')))
    loginAs()
    const onEvent = vi.fn()
    window.addEventListener(UNAUTHORIZED_EVENT, onEvent)
    await expect(streamChat([{ role: 'user', content: 'x' }], () => {})).rejects.toMatchObject({
      status: 401,
    })
    window.removeEventListener(UNAUTHORIZED_EVENT, onEvent)
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(onEvent).toHaveBeenCalledTimes(1)
  })
})
