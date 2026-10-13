import { useState } from 'react'
import { fetchPosts } from '../api/posts.js'
import PostCard from '../components/PostCard.jsx'
import { useFetch } from '../hooks/useFetch.js'

function PostListPage() {
  const [keyword, setKeyword] = useState('')
  const { data: posts, loading, error } = useFetch(() => fetchPosts(), [])

  if (loading) return <p>불러오는 중...</p>
  if (error) return <p className="error-text">게시글을 불러오지 못했습니다: {error.message}</p>
  if (!posts || posts.length === 0) return <p>게시글이 없습니다.</p>

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(keyword.trim().toLowerCase()),
  )

  return (
    <section className="practice">
      <h2>게시글</h2>
      <div className="actions">
        <input
          type="text"
          placeholder="제목 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      {filteredPosts.length === 0 ? (
        <p>조건에 맞는 게시글이 없습니다.</p>
      ) : (
        <ul className="fruit-list">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </ul>
      )}
    </section>
  )
}

export default PostListPage
