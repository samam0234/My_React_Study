import { useSummary } from '@/hooks/useSummary'
import { useAuthStore } from '@/store/authStore'
import type { Post } from '@/types'

// study18: 글 본문을 AI 프록시로 보내 요약을 스트리밍으로 표시한다. 결과는 텍스트로만 렌더링한다.
export default function SummaryPanel({ post }: { post: Post }) {
  const user = useAuthStore((s) => s.user)
  const { text, loading, error, run, cancel } = useSummary()

  return (
    <section aria-labelledby="ai-summary-title" className="card grid gap-2">
      <h3 id="ai-summary-title" className="font-semibold">
        AI 요약
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="btn"
          disabled={loading || !user}
          onClick={() => run(post.title, post.body)}
        >
          {loading ? '요약 중...' : 'AI 요약'}
        </button>
        {loading && (
          <button className="btn" onClick={cancel}>
            중단
          </button>
        )}
        {!user && <span className="text-xs text-slate-500">로그인 후 사용할 수 있습니다.</span>}
      </div>
      <div aria-live="polite">
        {error && <p className="error-text">{error}</p>}
        {text && <p className="whitespace-pre-wrap">{text}</p>}
      </div>
      {text && <p className="text-xs text-slate-500">AI가 생성한 요약이며 틀릴 수 있습니다.</p>}
    </section>
  )
}
