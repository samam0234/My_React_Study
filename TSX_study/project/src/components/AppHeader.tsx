import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.ts'

// LoginPage/MyPage와 부모-자식 관계가 아닌 헤더. 같은 authStore를 구독하므로
// 로그인/로그아웃이 일어나는 즉시 여기도 갱신된다 (study8/9에서 배운 전역 상태 공유).
function AppHeader() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="app-header">
      <h1>미니 게시판</h1>
      <nav className="actions">
        <Link to="/">목록</Link>
        <Link to="/mypage">마이페이지</Link>
      </nav>
      <div className="auth-status">
        {user ? (
          <>
            <span>👤 {user.name}님</span>
            <button onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <Link to="/login">로그인</Link>
        )}
      </div>
    </header>
  )
}

export default AppHeader
