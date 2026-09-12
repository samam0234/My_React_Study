import { useAuth } from '../context/AuthContext.jsx'

// study8: LoginPage/MyPage와 부모-자식 관계가 전혀 아닌 헤더 컴포넌트.
// 그런데도 같은 AuthContext를 구독하므로, 로그인 성공 즉시 여기도 갱신된다.
function AuthStatus() {
  const { isLoggedIn, user } = useAuth()

  return (
    <p style={{ textAlign: 'center', fontSize: 14 }}>
      {isLoggedIn ? `👤 ${user.name}님 로그인됨` : '로그인하지 않은 상태'}
    </p>
  )
}

export default AuthStatus
