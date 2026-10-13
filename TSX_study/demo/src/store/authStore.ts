import { create } from 'zustand'

export interface User {
  name: string
  email: string
}

interface AuthState {
  user: User | null
  login: (userData: User) => void
  logout: () => void
}

// study10: create<AuthState>()로 스토어의 모양(상태 + 액션)을 명시.
// 컴포넌트에서 useAuthStore((state) => state.user)라고 쓰면 user의 타입이 자동으로 User | null이 된다.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null }),
}))
