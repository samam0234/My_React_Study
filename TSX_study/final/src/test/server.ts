import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ALL, comment, post, mina } from './fixtures'

// 공통 API 스펙 v1 모양의 기본 응답. 각 테스트는 server.use(...)로 필요한 부분만 덮어쓴다 (study15).
export const apiError = (status: number, code: string, message: string, fields?: object) =>
  HttpResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}), requestId: 'req-1' } },
    { status },
  )

export const handlers = [
  http.get('*/api/posts', ({ request }) => {
    const sp = new URL(request.url).searchParams
    const page = Number(sp.get('page') ?? 1)
    const limit = Number(sp.get('limit') ?? 10)
    const q = (sp.get('q') ?? '').toLowerCase()
    const filtered = ALL.filter((p) => p.title.toLowerCase().includes(q))
    const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
    return HttpResponse.json({
      data: filtered.slice((page - 1) * limit, page * limit),
      meta: { page, limit, total: filtered.length, totalPages },
    })
  }),
  http.get('*/api/posts/:id', ({ params }) => {
    const id = Number(params.id)
    return id >= 1 && id <= 25
      ? HttpResponse.json({ data: post(id) })
      : apiError(404, 'NOT_FOUND', '게시글을 찾을 수 없습니다.')
  }),
  http.get('*/api/posts/:id/comments', ({ params }) =>
    HttpResponse.json({ data: Number(params.id) === 1 ? [comment(1, 1)] : [] }),
  ),
  http.post('*/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    return body.email === 'mina@example.com' && body.password === 'password123'
      ? HttpResponse.json({ data: { user: mina, accessToken: 'token-mina' } })
      : apiError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.')
  }),
]

export const server = setupServer(...handlers)
