import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useThemeStore } from '@/store/themeStore'
import { useToastStore } from '@/store/toastStore'
import { server } from './server'

// jsdom 에는 matchMedia 가 없다 — 테마(prefers-color-scheme) 테스트를 위한 최소 구현
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
})

// 정의되지 않은 요청은 실패시켜, 테스트가 몰래 실제 네트워크를 호출하지 못하게 한다.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
  // 스토어는 모듈 전역이라 테스트 사이에 상태가 새지 않도록 매번 초기화한다.
  useAuthStore.setState({ user: null, accessToken: null })
  useFavoritesStore.setState({ favoritePostIds: [] })
  useToastStore.setState({ toasts: [] })
  useThemeStore.setState({ theme: 'system' })
  document.documentElement.classList.remove('dark')
})

afterAll(() => server.close())
