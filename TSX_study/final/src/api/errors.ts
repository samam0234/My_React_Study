import { isAxiosError } from 'axios'

/** 공통 API 스펙 v1 의 오류 본문 */
export interface ApiErrorBody {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string[]>
    requestId?: string
  }
}

// erasableSyntaxOnly 때문에 생성자 매개변수 프로퍼티(constructor(public x))를 쓸 수 없다 (study14, 16).
export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, string[]>
  requestId?: string

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string[]>,
    requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    if (fields) this.fields = fields
    if (requestId) this.requestId = requestId
  }
}

/** axios 오류 → 화면이 다루기 쉬운 ApiError 한 형태 */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  if (isAxiosError<ApiErrorBody>(err)) {
    const body = err.response?.data?.error
    if (err.response && body?.code) {
      return new ApiError(
        err.response.status,
        body.code,
        body.message ?? '요청에 실패했습니다.',
        body.fields,
        body.requestId,
      )
    }
    if (err.response) {
      // 스펙을 따르지 않는 서버(예: Spring 기존 API는 { message })
      const legacy = (err.response.data as { message?: string } | undefined)?.message
      return new ApiError(
        err.response.status,
        `HTTP_${err.response.status}`,
        legacy ?? '요청에 실패했습니다.',
      )
    }
    if (err.code === 'ECONNABORTED') return new ApiError(0, 'TIMEOUT', '서버 응답이 너무 느립니다.')
    return new ApiError(0, 'NETWORK', '서버에 연결할 수 없습니다.')
  }
  return new ApiError(
    0,
    'UNKNOWN',
    err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
  )
}
