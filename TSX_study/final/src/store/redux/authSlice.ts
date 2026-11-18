import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { LoginResult, User } from '@/types'

// 노션 "TanStack Query · Redux Toolkit": "로그인 상태를 Zustand 대신 Redux slice로 다시 만들기".
// 앱은 Zustand(`store/authStore.ts`)를 쓰고, 이 slice 는 같은 상태를 Redux Toolkit 으로 만들어 비교하기 위한 구현이다
// (앱에는 연결하지 않았다 — Provider·타입 훅 같은 보일러플레이트를 직접 확인하는 용도).
interface AuthState {
  user: User | null
  accessToken: string | null
}

const initialState: AuthState = { user: null, accessToken: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Immer 내장: 리듀서 안에서는 "직접 변경"처럼 쓰지만 불변 업데이트로 처리된다
    setSession(state, action: PayloadAction<LoginResult>) {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
    },
    logout(state) {
      state.user = null
      state.accessToken = null
    },
  },
})

export const { setSession, logout } = authSlice.actions
export default authSlice.reducer
