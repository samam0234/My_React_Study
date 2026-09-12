import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'

// study9: study8의 useAuth() 대신 Zustand 셀렉터로 필요한 값(user)만 구독.
function ProtectedRoute({ children }) {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
