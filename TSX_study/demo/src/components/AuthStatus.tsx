import { useRef } from 'react'
import { useAuthStore } from '../store/authStore.ts'

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
