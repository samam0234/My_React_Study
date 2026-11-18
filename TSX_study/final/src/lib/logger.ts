// 구조화된 로거 (study16). 비밀번호·토큰은 로그에 남기지 않는다.
type Level = 'debug' | 'info' | 'warn' | 'error'

const SENSITIVE = ['password', 'accesstoken', 'authorization', 'token']

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[depth]'
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        SENSITIVE.includes(k.toLowerCase()) ? '[REDACTED]' : redact(v, depth + 1),
      ]),
    )
  }
  return value
}

export const logger = {
  log(level: Level, message: string, context?: unknown) {
    const entry = { level, message, context: redact(context), ts: new Date().toISOString() }
    if (import.meta.env.DEV) {
      const out = level === 'debug' ? 'log' : level
      console[out](entry)
    }
    // 운영: 여기서 모니터링 서비스(Sentry 등)나 수집 엔드포인트로 전송한다 (study16 §8).
    return entry
  },
  error(err: unknown, context?: unknown) {
    return this.log('error', err instanceof Error ? err.message : String(err), context)
  },
}
