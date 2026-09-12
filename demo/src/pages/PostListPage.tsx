import { useState } from 'react'
import { useFetch } from '../hooks/useFetch.ts'
import { fetchPosts, type Post } from '../api/posts.ts'

const LIMIT = 5

function PostListPage() {
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const { data: posts, loading, error } = useFetch<Post[]>(
    () => fetchPosts({ page, limit: LIMIT }),
    [page, reloadKey],
  )

  if (loading) {
    return (
      <section className="practice">
        <h2>실습7: 게시글 목록 (axios + 페이지네이션)</h2>
        <p>불러오는 중...</p>
      </section>
    )
  }

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
