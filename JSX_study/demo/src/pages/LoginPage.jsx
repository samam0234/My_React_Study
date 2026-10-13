import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'

// study9: Context의 useAuth().login 대신 스토어의 login 액션만 구독.
// 이 컴포넌트는 로그인 폼일 뿐 user 값 자체를 화면에 쓸 일이 없으므로, login만 선택한다.
function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/mypage'

  function handleLogin() {
    login({ name: '테스트유저', email: 'test@example.com' })
    navigate(from, { replace: true })
  }

  return (
    <section className="practice">
      <h2>로그인 (목업)</h2>
      <p>실제 인증 서버 없이, 버튼을 누르면 로그인된 것으로 처리합니다.</p>
      <button onClick={handleLogin}>테스트 계정으로 로그인</button>
    </section>
  )
}

export default LoginPage
