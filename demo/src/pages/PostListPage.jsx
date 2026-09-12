import { useState } from 'react'
import { useFetch } from '../hooks/useFetch.js'
import { fetchPosts } from '../api/posts.js'

const LIMIT = 5

// study7: axios + 커스텀 훅(useFetch) + 페이지네이션 + 로딩/에러/빈 상태를 한 화면에서 실습.
function PostListPage() {
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const { data: posts, loading, error } = useFetch(
    () => fetchPosts({ page, limit: LIMIT }),
    [page, reloadKey],
  )

  // 로딩 상태 — 화면에 반드시 명시 (study0 7장)
  if (loading) {
    return (
      <section className="practice">
        <h2>실습7: 게시글 목록 (axios + 페이지네이션)</h2>
        <p>불러오는 중...</p>
      </section>
    )
  }

  // 에러 상태 — 무엇이 잘못됐는지, 재시도 방법까지 안내
  if (error) {
    return (
      <section className="practice">
        <h2>실습7: 게시글 목록 (axios + 페이지네이션)</h2>
        <p className="error-text">
          게시글을 불러오지 못했습니다: {error.message}
        </p>
        <button onClick={() => setReloadKey((k) => k + 1)}>다시 시도</button>
      </section>
    )
  }

  // 빈 상태 — 데이터는 왔지만 항목이 0개인 경우
  if (!posts || posts.length === 0) {
    return (
      <section className="practice">
        <h2>실습7: 게시글 목록 (axios + 페이지네이션)</h2>
        <p>게시글이 없습니다.</p>
      </section>
    )
  }

  return (
    <section className="practice">
      <h2>실습7: 게시글 목록 (axios + 페이지네이션)</h2>
      <ul className="fruit-list">
        {posts.map((post) => (
          <li key={post.id} className="fruit-card">
            <span className="name">{post.title}</span>
          </li>
        ))}
      </ul>
      <div className="actions" style={{ marginTop: 12 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          ← 이전
        </button>
        <span>{page} 페이지</span>
        {/* JSONPlaceholder는 전체 개수를 안 알려주므로, 받아온 개수가 LIMIT보다 적으면 마지막 페이지로 간주 */}
        <button
          disabled={posts.length < LIMIT}
          onClick={() => setPage((p) => p + 1)}
        >
          다음 →
        </button>
      </div>
    </section>
  )
}

export default PostListPage
