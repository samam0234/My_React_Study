import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.ts'

function MyPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  // ProtectedRoute를 거쳐야만 이 화면에 도달하므로 user는 항상 존재하지만,
  // 타입 상으로는 User | null이므로 방어적으로 한 번 더 확인한다.
  if (!user) return null

  return (
    <section className="practice">
      <h2>마이페이지 (보호된 라우트)</h2>
      <p>{user.name}님, 환영합니다. ({user.email})</p>
      <button onClick={handleLogout}>로그아웃</button>
    </section>
  )
}

export default MyPage
