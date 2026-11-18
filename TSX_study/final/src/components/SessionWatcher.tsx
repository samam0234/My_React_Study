import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UNAUTHORIZED_EVENT } from '@/api/client'
import { useToastStore } from '@/store/toastStore'

// 인터셉터(컴포넌트 밖)가 401 을 만나면 이벤트를 보내고, 라우터 안의 이 컴포넌트가 로그인 화면으로 이동시킨다.
export default function SessionWatcher() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    function onUnauthorized() {
      useToastStore.getState().push('info', '로그인이 만료되었습니다. 다시 로그인하세요.')
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true, state: { from: location } })
      }
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [navigate, location])

  return null
}
