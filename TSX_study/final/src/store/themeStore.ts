import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Theme = 'system' | 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  /** system → light → dark → system 순서로 돈다 (헤더의 토글 버튼) */
  cycle: () => void
}

const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }

// 노션 React 6개월차 3주차: "다크 모드 토글 하나 추가". 선택은 새로고침해도 유지(persist).
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      cycle: () => set({ theme: NEXT[get().theme] }),
    }),
    { name: 'board-theme', storage: createJSONStorage(() => localStorage) },
  ),
)

/** theme 과 OS 설정으로 실제 다크 여부를 계산한다. */
export function resolveDark(theme: Theme, prefersDark: boolean): boolean {
  return theme === 'dark' || (theme === 'system' && prefersDark)
}
