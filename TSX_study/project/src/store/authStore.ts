import { create } from 'zustand'
import type { User } from '../types.ts'

interface AuthState {
  user: User | null
  login: (userData: User) => void
  logout: () => void
}

// study9에서 배운 Zustand 패턴 그대로. Provider 없이 어디서든 import해서 사용.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null }),
}))
