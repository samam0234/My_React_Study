import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface Props {
  children: ReactNode
}

// 로그인 안 했으면 원래 가려던 위치를 state.from 에 담아 /login 으로 보낸다 (study7).
export default function ProtectedRoute({ children }: Props) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}
