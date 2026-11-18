import axios, { type AxiosError } from 'axios'
import { config } from '@/config'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { toApiError } from './errors'

export const UNAUTHORIZED_EVENT = 'app:unauthorized'

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 8000,
})

// 로그인·가입 요청의 401/409 는 "세션 만료"가 아니라 폼 오류다.
const isAuthForm = (url?: string) => /\/auth\/(login|signup)$/.test(url ?? '')

// 요청: 토큰이 있으면 Authorization 헤더를 붙인다. 컴포넌트 밖이라 훅 대신 getState() (study7).
apiClient.interceptors.request.use((req) => {
  const token = useAuthStore.getState().accessToken
  if (token) req.headers.Authorization = `Bearer ${token}`
  return req
})

// 응답: 401/403 을 한 곳에서 처리하고, 모든 오류를 ApiError 한 형태로 던진다.
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const apiError = toApiError(error)
    if (apiError.status === 401 && !isAuthForm(error.config?.url)) {
      if (useAuthStore.getState().accessToken) {
        useAuthStore.getState().logout() // 만료·위조 토큰 → 세션 정리
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT)) // 라우터가 로그인 화면으로 보낸다
      }
    } else if (apiError.status === 403) {
      // 로그인은 되어 있으나 권한 없음 → 로그아웃시키지 않고 안내만
      useToastStore.getState().push('error', '이 작업을 할 권한이 없습니다.')
    }
    return Promise.reject(apiError) // 호출한 쪽도 catch 할 수 있게 반드시 다시 던진다
  },
)
