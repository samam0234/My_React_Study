import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="app-header">
      <h1>JSX 미니 게시판</h1>
      <nav className="actions">
        <Link to="/">목록</Link>
      </nav>
      <div className="auth-status">
        {user ? (
          <>
            <span>{user.name}님</span>
            <button type="button" onClick={handleLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <Link to="/login">로그인</Link>
        )}
      </div>
    </header>
  )
}

export default AppHeader
