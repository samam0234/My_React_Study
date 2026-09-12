import { useNavigate } from 'react-router-dom'
import { logout } from '../auth/fakeAuth.js'

// study6: 로그인된 사용자만 볼 수 있는 화면 (ProtectedRoute로 감싸서 노출).
function MyPage() {
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <section className="practice">
      <h2>마이페이지 (보호된 라우트)</h2>
      <p>이 화면은 로그인된 사용자만 볼 수 있습니다.</p>
      <button onClick={handleLogout}>로그아웃</button>
    </section>
  )
}

export default MyPage
