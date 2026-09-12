import { create } from 'zustand'

// study9: study8의 AuthContext와 같은 기능(로그인 상태 공유)을 Zustand로 재구현.
// Provider로 감쌀 필요 없이, 이 훅을 아무 컴포넌트에서나 바로 import해서 쓸 수 있다.
export const useAuthStore = create((set) => ({
  user: null,
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null }),
}))
