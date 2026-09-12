// study6: 아직 Context/Zustand(study8, study9)를 배우기 전이라, 가장 단순한 방법인
// localStorage로 "로그인 여부"만 흉내낸다. ProtectedRoute가 이 함수만 알면 되도록 격리해두면,
// 나중에 study8/study9에서 구현을 Context/Zustand로 바꿔도 ProtectedRoute 코드는 그대로 재사용 가능.
const STORAGE_KEY = 'demo-fake-auth'

export function isLoggedIn() {
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export function login() {
  localStorage.setItem(STORAGE_KEY, '1')
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
}
