import { useState } from 'react'
import { useFetch } from '../hooks/useFetch.ts'
import { fetchPosts } from '../api/posts.ts'
import { useFavoritesStore } from '../store/favoritesStore.ts'
import { useAuthStore } from '../store/authStore.ts'
import PostCard from '../components/PostCard.tsx'
import type { Post } from '../types.ts'

const LIMIT = 10

// studyFinal: study2(리스트+필터) + study7(axios/페이지네이션) + study9(Zustand)를 한 화면에 결합.
function PostListPage() {
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)

  const user = useAuthStore((state) => state.user)
  const favoritePostIds = useFavoritesStore((state) => state.favoritePostIds)
  const toggleFavorite = useFavoritesStore((state) => state.toggle)

  const { data: posts, loading, error } = useFetch<Post[]>(
    () => fetchPosts({ page, limit: LIMIT }),
    [page],
  )

  function handleToggleFavorite(postId: number) {
    if (!user) {
      alert('즐겨찾기는 로그인 후 이용할 수 있습니다.')
      return
    }
    toggleFavorite(postId)
  }

  if (loading) return <p>불러오는 중...</p>
  if (error) return <p className="error-text">게시글을 불러오지 못했습니다: {error.message}</p>
  if (!posts || posts.length === 0) return <p>게시글이 없습니다.</p>

  const filteredPosts = posts
    .filter((post) => post.title.includes(keyword.trim()))
    .filter((post) => !showOnlyFavorites || favoritePostIds.includes(post.id))

  return (
    <section className="practice">
      <div className="actions">
        <input
          type="text"
          placeholder="제목 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button
          className={showOnlyFavorites ? 'active' : ''}
          onClick={() => setShowOnlyFavorites((prev) => !prev)}
        >
          {showOnlyFavorites ? '전체 보기' : '즐겨찾기만 보기'}
        </button>
      </div>

      {filteredPosts.length === 0 ? (
        <p>조건에 맞는 게시글이 없습니다.</p>
      ) : (
        <ul className="fruit-list">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isFavorite={favoritePostIds.includes(post.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </ul>
      )}

      <div className="actions" style={{ marginTop: 12 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          ← 이전
        </button>
        <span>{page} 페이지</span>
        <button disabled={posts.length < LIMIT} onClick={() => setPage((p) => p + 1)}>
          다음 →
        </button>
      </div>
    </section>
  )
}

export default PostListPage
