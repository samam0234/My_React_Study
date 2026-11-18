import type { FallbackProps } from 'react-error-boundary'

// 렌더링 중 던져진 오류가 앱 전체를 하얗게 만들지 않도록 라우트 영역만 이 화면으로 대체한다 (study16).
// 운영에서는 내부 메시지·스택을 보여 주지 않는다.
export default function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error)
  return (
    <div role="alert" className="card grid gap-2">
      <p className="font-medium">문제가 발생했습니다.</p>
      {import.meta.env.DEV ? (
        <pre className="text-xs whitespace-pre-wrap">{message}</pre>
      ) : (
        <p className="text-sm">잠시 후 다시 시도해 주세요.</p>
      )}
      <div>
        <button className="btn" onClick={resetErrorBoundary}>
          다시 시도
        </button>
      </div>
    </div>
  )
}
