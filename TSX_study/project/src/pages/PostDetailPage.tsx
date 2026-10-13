import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch.ts'
import { fetchPostDetail } from '../api/posts.ts'
import { useFavoritesStore } from '../store/favoritesStore.ts'
import { useAuthStore } from '../store/authStore.ts'
import type { Comment, Post } from '../types.ts'

// studyFinal: study5(useParams) + study7(Promise.all 병렬 요청) 결합.
// id가 바뀌면(다른 글로 이동) useFetch의 deps에 id가 들어있어 자동으로 다시 요청한다.
function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const user = useAuthStore((state) => state.user)
  const favoritePostIds = useFavoritesStore((state) => state.favoritePostIds)
  const toggleFavorite = useFavoritesStore((state) => state.toggle)

  const { data, loading, error } = useFetch<{ post: Post; comments: Comment[] }>(
    () => fetchPostDetail(id as string),
    [id],
  )

  function handleToggleFavorite() {
    if (!data) return
    if (!user) {
      alert('즐겨찾기는 로그인 후 이용할 수 있습니다.')
      return
    }
    toggleFavorite(data.post.id)
  }

  if (loading) return <p>불러오는 중...</p>
  if (error) return <p className="error-text">게시글을 불러오지 못했습니다: {error.message}</p>
  if (!data) return <p>게시글을 찾을 수 없습니다.</p>

  const { post, comments } = data
  const isFavorite = favoritePostIds.includes(post.id)

  return (
    <section className="practice">
      <div className="actions">
        <h2>{post.title}</h2>
        <button className={isFavorite ? 'active' : ''} onClick={handleToggleFavorite}>
          {isFavorite ? '★ 즐겨찾기 취소' : '☆ 즐겨찾기'}
        </button>
      </div>
      <p>{post.body}</p>

      <h3>댓글 {comments.length}개</h3>
      <ul className="fruit-list">
        {comments.map((comment) => (
          <li key={comment.id} className="fruit-card">
            <div>
              <b>{comment.name}</b> ({comment.email})
              <p>{comment.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="actions">
        <Link to="/">← 목록으로 (Link)</Link>
        <button onClick={() => navigate(-1)}>← 뒤로가기</button>
      </div>
    </section>
  )
}

export default PostDetailPage
