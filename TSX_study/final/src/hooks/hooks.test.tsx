import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import SummaryPanel from '@/components/SummaryPanel'
import { loginAs } from '@/test/utils'
import { post } from '@/test/fixtures'
import { server } from '@/test/server'
import { useDebounce } from './useDebounce'
import { useFetch } from './useFetch'

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('값이 바뀐 뒤 delay 가 지나야 반영되고, 연속 변경은 마지막 값만 반영한다', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: 'a' },
    })
    rerender({ v: 'ab' })
    act(() => void vi.advanceTimersByTime(200))
    rerender({ v: 'abc' })
    act(() => void vi.advanceTimersByTime(200))
    expect(result.current).toBe('a') // 아직 반영 안 됨
    act(() => void vi.advanceTimersByTime(100))
    expect(result.current).toBe('abc')
  })
})

describe('useFetch (study6~10 의 직접 만든 훅)', () => {
  it('성공하면 data 가 채워지고 loading 이 false 가 된다', async () => {
    const { result } = renderHook(() => useFetch(() => Promise.resolve('ok'), []))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current).toMatchObject({ data: 'ok', error: null })
  })

  it('실패하면 error 가 채워진다 (Error 가 아닌 값도 Error 로)', async () => {
    const { result } = renderHook(() => useFetch(() => Promise.reject('문자열 오류'), []))
    await waitFor(() => expect(result.current.error?.message).toBe('문자열 오류'))
    expect(result.current.data).toBeNull()
  })

  it('deps 가 바뀌면 다시 요청하고, 오래된 응답은 최신 결과를 덮어쓰지 않는다(ignore)', async () => {
    let resolveFirst: (v: string) => void = () => {}
    const first = new Promise<string>((r) => (resolveFirst = r))
    const { result, rerender } = renderHook(
      ({ id }) => useFetch(() => (id === 1 ? first : Promise.resolve('두 번째')), [id]),
      {
        initialProps: { id: 1 },
      },
    )
    rerender({ id: 2 })
    await waitFor(() => expect(result.current.data).toBe('두 번째'))
    await act(async () => resolveFirst('첫 번째(늦게 도착)'))
    expect(result.current.data).toBe('두 번째')
  })
})

// 서버가 보내는 SSE 모양을 그대로 만들어 주는 헬퍼
function sse(events: string[], { split = false } = {}) {
  const enc = new TextEncoder()
  const payload = events.map((e) => `data: ${e}\n\n`).join('')
  return new ReadableStream({
    start(controller) {
      if (split) {
        // 이벤트 경계와 맞지 않게 임의 위치에서 쪼개 보낸다 (조각난 이벤트 처리 확인)
        controller.enqueue(enc.encode(payload.slice(0, 17)))
        controller.enqueue(enc.encode(payload.slice(17)))
      } else controller.enqueue(enc.encode(payload))
      controller.close()
    },
  })
}

describe('SummaryPanel / useSummary (SSE)', () => {
  it('비로그인이면 버튼이 비활성화된다', () => {
    render(<SummaryPanel post={post(1)} />)
    expect(screen.getByRole('button', { name: 'AI 요약' })).toBeDisabled()
  })

  it('스트림을 읽어 텍스트를 이어 붙이고, 이벤트가 조각나 와도 처리한다', async () => {
    loginAs()
    let auth: string | null = null
    server.use(
      http.post('*/api/ai/chat/stream', ({ request }) => {
        auth = request.headers.get('authorization')
        return new HttpResponse(
          sse([JSON.stringify({ text: '첫 ' }), JSON.stringify({ text: '요약' }), '[DONE]'], {
            split: true,
          }),
          {
            headers: { 'Content-Type': 'text/event-stream' },
          },
        )
      }),
    )
    render(<SummaryPanel post={post(1)} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'AI 요약' }))
    expect(await screen.findByText('첫 요약')).toBeInTheDocument()
    expect(auth).toBe('Bearer token-mina')
    expect(screen.getByText(/틀릴 수 있습니다/)).toBeInTheDocument()
  })

  it('서버가 error 이벤트를 보내면 화면에 표시한다', async () => {
    loginAs()
    server.use(
      http.post(
        '*/api/ai/chat/stream',
        () =>
          new HttpResponse(
            sse([
              JSON.stringify({
                error: { code: 'AI_UNAVAILABLE', message: '요약할 수 없는 내용입니다.' },
              }),
              '[DONE]',
            ]),
            { headers: { 'Content-Type': 'text/event-stream' } },
          ),
      ),
    )
    render(<SummaryPanel post={post(1)} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'AI 요약' }))
    expect(await screen.findByText('요약할 수 없는 내용입니다.')).toBeInTheDocument()
  })

  it('401 이면 로그인 안내 문구', async () => {
    loginAs()
    server.use(http.post('*/api/ai/chat/stream', () => new HttpResponse(null, { status: 401 })))
    render(<SummaryPanel post={post(1)} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'AI 요약' }))
    expect(await screen.findByText('로그인이 필요합니다.')).toBeInTheDocument()
  })
})
