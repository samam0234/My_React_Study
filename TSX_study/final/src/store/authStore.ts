import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { LoginResult, User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  setSession: (result: LoginResult) => void
  logout: () => void
}

// study7: 새로고침해도 로그인이 유지되도록 persist. 저장 키는 board-auth.
// ⚠️ localStorage 는 XSS 에 읽힐 수 있다 — 운영에서는 짧은 만료 + CSP (study16).
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setSession: ({ user, accessToken }) => set({ user, accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'board-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }), // 함수는 저장하지 않는다
    },
  ),
)
