import { z } from 'zod'
import { config } from '@/config'
import { useAuthStore } from '@/store/authStore'
import { apiClient, UNAUTHORIZED_EVENT } from './client'
import { ApiError } from './errors'

// 노션 "AI 모델 연동 · MCP": 브라우저는 모델 API 를 직접 부르지 않는다. 내 백엔드(JWT 확인·사용량 한도)를 거친다.
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatUsage {
  inputTokens: number
  outputTokens: number
}

const ChatResponse = z.object({
  data: z.object({ text: z.string() }),
  meta: z
    .object({ usage: z.object({ inputTokens: z.number(), outputTokens: z.number() }) })
    .optional(),
})

/** 한 번에 받기: POST /api/ai/chat → { data: { text }, meta: { usage } } */
export async function chat(messages: ChatMessage[]): Promise<{ text: string; usage?: ChatUsage }> {
  const res = await apiClient.post('/api/ai/chat', { messages })
  const parsed = ChatResponse.parse(res.data)
  return { text: parsed.data.text, ...(parsed.meta ? { usage: parsed.meta.usage } : {}) }
}

/**
 * 스트리밍: POST /api/ai/chat/stream (SSE). EventSource 는 GET 만 되고 헤더(JWT)를 못 붙이므로
 * fetch + ReadableStream 으로 읽는다. 서버 이벤트: data: {"text":…} … data: [DONE], 오류는 data: {"error":{code,message}}.
 */
export async function streamChat(
  messages: ChatMessage[],
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = useAuthStore.getState().accessToken
  const url = new URL('/api/ai/chat/stream', config.apiBaseUrl || window.location.origin)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
    body: JSON.stringify({ messages }),
    ...(signal ? { signal } : {}),
  })

  if (!res.ok || !res.body) {
    // 스트림이 시작되기 전의 오류(401·400·429)는 일반 JSON 오류다
    const body = (await res.json().catch(() => null)) as {
      error?: { code?: string; message?: string }
    } | null
    if (res.status === 401 && token) {
      useAuthStore.getState().logout()
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
    }
    throw new ApiError(
      res.status,
      body?.error?.code ?? `HTTP_${res.status}`,
      body?.error?.message ??
        (res.status === 401 ? '로그인이 필요합니다.' : 'AI 요청에 실패했습니다.'),
    )
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) return
    buffer += value
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? '' // 덜 들어온 이벤트는 다음 조각과 합친다
    for (const ev of events) {
      const data = ev.replace(/^data:\s?/, '').trim()
      if (!data) continue
      if (data === '[DONE]') return
      const msg = JSON.parse(data) as { text?: string; error?: { code: string; message: string } }
      if (msg.error) throw new ApiError(0, msg.error.code, msg.error.message)
      if (msg.text) onText(msg.text)
    }
  }
}
