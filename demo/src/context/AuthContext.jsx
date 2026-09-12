import { createContext, useContext, useState } from 'react'

// study8: study6에서 localStorage 함수 3개로 흉내냈던 로그인 상태를
// 여러 컴포넌트가 공유할 수 있는 "진짜 전역 상태"로 승격시킨다.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  function login(userData) {
    setUser(userData)
  }

  function logout() {
    setUser(null)
  }

  const value = { user, isLoggedIn: user !== null, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Context를 직접 useContext(AuthContext)로 꺼내 쓰지 않고, 커스텀 훅으로 한 번 감싸는 관례.
// Provider 바깥에서 실수로 호출하면 바로 에러를 던져서 원인을 빨리 찾을 수 있게 한다.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth는 <AuthProvider> 내부에서만 사용할 수 있습니다.')
  }
  return ctx
}
