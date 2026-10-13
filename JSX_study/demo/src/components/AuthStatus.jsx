import { useRef } from 'react'
import { useAuthStore } from '../store/authStore.js'

// study9: Provider 없이, 스토어에서 필요한 값(user)만 선택적으로 구독.
// renderCount로 "이 컴포넌트가 실제로 몇 번 리렌더링되는지" 눈으로 확인한다.
function AuthStatus() {
  const user = useAuthStore((state) => state.user)
  const renderCount = useRef(0)
  renderCount.current += 1

  return (
    <p style={{ textAlign: 'center', fontSize: 14 }}>
      {user ? `👤 ${user.name}님 로그인됨` : '로그인하지 않은 상태'}
      {' '}(렌더링 {renderCount.current}회)
    </p>
  )
}

export default AuthStatus
