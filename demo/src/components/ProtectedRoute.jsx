import { Navigate, useLocation } from 'react-router-dom'
import { isLoggedIn } from '../auth/fakeAuth.js'

// study6: 보호된 라우트 패턴. 로그인 안 되어 있으면 /login으로 리다이렉트.
// "원래 가려던 곳"을 state로 같이 넘겨서, 로그인 성공 후 그 페이지로 돌려보낼 수 있게 한다.
function ProtectedRoute({ children }) {
  const location = useLocation()

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
