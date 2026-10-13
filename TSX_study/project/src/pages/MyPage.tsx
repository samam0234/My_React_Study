import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.ts'
import { useFavoritesStore } from '../store/favoritesStore.ts'

// ProtectedRoute를 거쳐야만 도달하는 화면 (study6/8/9에서 배운 보호된 라우트 + 전역 상태 결합).
function MyPage() {
  const user = useAuthStore((state) => state.user)
  const favoritePostIds = useFavoritesStore((state) => state.favoritePostIds)

  if (!user) return null // 타입상 User | null이라 TS가 강제하는 방어 코드 (study10)

  return (
    <section className="practice">
      <h2>마이페이지</h2>
      <p>{user.name}님, 환영합니다. ({user.email})</p>

      <h3>즐겨찾기한 게시글 ({favoritePostIds.length}개)</h3>
      {favoritePostIds.length === 0 ? (
        <p>즐겨찾기한 게시글이 없습니다.</p>
      ) : (
        <ul className="fruit-list">
          {favoritePostIds.map((postId) => (
            <li key={postId} className="fruit-card">
              <Link to={`/posts/${postId}`}>게시글 #{postId}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default MyPage
