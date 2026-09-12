import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'

function MyPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <section className="practice">
      <h2>마이페이지 (보호된 라우트)</h2>
      <p>{user.name}님, 환영합니다. ({user.email})</p>
      <button onClick={handleLogout}>로그아웃</button>
    </section>
  )
}

export default MyPage
