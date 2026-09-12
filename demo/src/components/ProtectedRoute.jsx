import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// study8: study6의 localStorage 기반 isLoggedIn() 대신 Context의 useAuth()를 사용.
// ProtectedRoute를 사용하는 쪽(App.jsx)은 이 내부 구현이 바뀐 걸 전혀 신경 쓸 필요가 없다.
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
