import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// study8: fakeAuth.login() 대신 Context의 login()을 사용. 사용자 정보(user 객체)까지 저장.
function LoginPage() {
  const { login } = useAuth()
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
