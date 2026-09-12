import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../auth/fakeAuth.js'

// study6: 실제 서버 인증 없이, 버튼 클릭만으로 "로그인됨" 상태를 만드는 목업 로그인 페이지.
function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // ProtectedRoute가 넘겨준 "원래 가려던 경로" (없으면 /mypage로 기본값)
  const from = location.state?.from?.pathname || '/mypage'

  function handleLogin() {
    login()
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
