import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from '@/App'
import { logger } from '@/lib/logger'

// 서버 상태 캐시 (study11): 30초 동안은 신선하다고 보고 같은 요청을 다시 보내지 않는다.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
})

// 전역 오류 핸들러 (study16): Error Boundary 가 못 잡는 이벤트 핸들러·Promise 오류도 기록한다.
window.addEventListener('error', (e) => logger.error(e.error ?? e.message))
window.addEventListener('unhandledrejection', (e) => logger.error(e.reason))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
