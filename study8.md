# study8 (고급 기술 구현 3) — Context API로 전역 로그인 상태 관리

study6에서 `localStorage` + 함수 3개(`isLoggedIn`, `login`, `logout`)로 로그인 여부만 흉내냈습니다. 이번엔 React 내장 도구인 **Context API**로 정식 전환해서, 여러 컴포넌트가 하나의 로그인 상태(사용자 정보 포함)를 실시간으로 공유하게 만듭니다.

```
- [x] Vite + React + JS 프로젝트 생성
- [x] 함수 컴포넌트, props, children
- [x] useState / useEffect / useRef
- [x] 리스트 렌더링과 key
- [x] React Router 중첩 라우팅
- [x] 폼 상태 다루기 + API 연동 (axios / fetch)
- [x] Context로 전역 상태 (로그인)                     (Zustand 비교는 study9)
- [ ] 백엔드와 CORS 연동
```

대응하는 실습 프로젝트: [`demo/`](./demo)

---

## 1. Props Drilling 복습 — 왜 전역 상태가 필요한가

study0 7장, Vue study7에서 다룬 것과 같은 문제입니다: 로그인 여부는 헤더(`AuthStatus`), 로그인 폼(`LoginPage`), 마이페이지(`MyPage`)처럼 **부모-자식 관계가 아닌 컴포넌트들**이 동시에 알아야 합니다. props만으로 전달하려면 관계없는 중간 컴포넌트들까지 계속 props를 전달만 하는 "props drilling"이 생깁니다.

## 2. Context 만들기 — `createContext` / `Provider`

```jsx
// context/AuthContext.jsx
import { createContext, useContext, useState } from 'react'

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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth는 <AuthProvider> 내부에서만 사용할 수 있습니다.')
  }
  return ctx
}
```

### 2.1 세 조각으로 이해하기

| 조각 | 역할 | Vue(Pinia) 대응 |
|---|---|---|
| `createContext(null)` | "이런 종류의 전역 상태 상자가 있다"를 선언 | `defineStore('auth', ...)` |
| `<AuthContext.Provider value={...}>` | 실제 값(`value`)을 이 태그로 감싼 하위 트리 전체에 공급 | (Pinia는 `app.use(pinia)`로 앱 전체에 한 번만 설치, 별도 Provider 불필요) |
| `useContext(AuthContext)` | 하위 트리 어디서든 그 값을 꺼내 쓰기 | `useAuthStore()` |

- **Provider로 감싼 범위 안에서만** `useContext`가 값을 받을 수 있습니다. 이 실습에서는 `<AuthProvider>`가 `<BrowserRouter>`까지 포함해서 앱 전체를 감쌌기 때문에, 모든 페이지가 `useAuth()`를 쓸 수 있습니다.
- **`useAuth`로 한 번 더 감싼 이유**: 컴포넌트마다 `useContext(AuthContext)`를 직접 부르게 하면, Provider 없이 실수로 쓰였을 때 `ctx`가 `null`이라 "어디서" 잘못됐는지 알기 어려운 에러가 납니다. 커스텀 훅 안에서 미리 체크하면 에러 메시지가 훨씬 명확해집니다 — 이것도 실무에서 흔한 관례입니다.

## 3. App 전체에 Provider 씌우기

```jsx
// App.jsx
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <header>
            <AuthStatus />
            {/* ...nav... */}
          </header>
          <main>
            <Routes>...</Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

`AuthProvider`가 `BrowserRouter`보다 바깥에 있어야, 라우팅으로 어떤 페이지를 보여주든 전부 같은 로그인 상태를 공유합니다.

## 4. 서로 다른 컴포넌트가 같은 상태를 구독

### 4.1 보호된 라우트 — study6 코드를 그대로 교체

```jsx
// components/ProtectedRoute.jsx
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()   // ← 유일하게 바뀐 줄 (기존엔 isLoggedIn() 함수 호출)
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}
```

study6에서 "`ProtectedRoute`가 `isLoggedIn()`이라는 인터페이스만 알면 되도록 격리해뒀다"고 설명했던 부분이 여기서 그대로 확인됩니다 — **로직 흐름은 전혀 안 바뀌고, 로그인 상태를 어디서 가져오는지만 바뀌었습니다.**

### 4.2 로그인 폼

```jsx
function LoginPage() {
  const { login } = useAuth()
  // ...
  function handleLogin() {
    login({ name: '테스트유저', email: 'test@example.com' })
    navigate(from, { replace: true })
  }
}
```

### 4.3 마이페이지

```jsx
function MyPage() {
  const { user, logout } = useAuth()
  return (
    <>
      <p>{user.name}님, 환영합니다. ({user.email})</p>
      <button onClick={() => { logout(); navigate('/') }}>로그아웃</button>
    </>
  )
}
```

### 4.4 헤더 — 부모/자식 관계가 전혀 없는 컴포넌트

```jsx
// components/AuthStatus.jsx
function AuthStatus() {
  const { isLoggedIn, user } = useAuth()
  return <p>{isLoggedIn ? `👤 ${user.name}님 로그인됨` : '로그인하지 않은 상태'}</p>
}
```

**핵심**: `LoginPage`, `MyPage`, `AuthStatus`는 서로 부모-자식이 아닌 완전히 다른 컴포넌트지만, 셋 다 `useAuth()`를 호출하면 **같은 Context 값**을 받습니다. 그래서 로그인 폼에서 로그인에 성공하는 순간, props나 콜백 없이도 헤더의 `AuthStatus`가 즉시 "로그인됨"으로 바뀝니다.

## 5. Context의 한계 — study9(Zustand) 예고

이번 실습에서는 문제가 없어 보이지만, Context에는 실무에서 자주 지적되는 특성이 있습니다.

> **`value`가 바뀌면, 그 Context를 구독(`useContext`)하는 모든 컴포넌트가 리렌더링됩니다.** 상태를 세분화하지 않고 하나의 Context에 여러 값을 몰아넣으면, 일부 값만 바뀌어도 관련 없는 컴포넌트까지 리렌더링될 수 있습니다.

지금은 `user` 하나뿐이라 문제가 안 보이지만, 앱이 커져서 Context 하나에 로그인 정보 + 테마 + 알림 등 여러 전역 상태가 섞이면 이 특성이 성능 문제로 이어질 수 있습니다. study9에서 **Zustand**로 같은 기능을 다시 구현하며 이 차이를 비교합니다.

## 6. 실행 확인

```bash
cd demo
npm run dev
```

- 로그아웃 상태에서 헤더에 "로그인하지 않은 상태"가 보이는지
- "마이페이지" 클릭 → `/login`으로 리다이렉트되는지 (study6과 동일한 흐름, 내부 구현만 Context로 교체됨)
- "테스트 계정으로 로그인" 클릭 → `/mypage`로 이동하며 "테스트유저님, 환영합니다"가 보이는지
- **헤더를 확인** → 로그인 폼을 직접 건드리지 않았는데도 "👤 테스트유저님 로그인됨"으로 바뀌어 있는지 (Context 공유 확인)
- "로그아웃" 클릭 → 헤더도 즉시 "로그인하지 않은 상태"로 돌아오는지
- 새로고침하면 로그인 상태가 초기화되는지 확인 (Context는 메모리에만 있으므로 당연한 결과 — 실무에서는 localStorage/서버 세션과 연동해서 해결하며, 이 저장소에서는 studyFinal에서 다시 다룹니다)

`npm run build`까지 에러 없이 되는 것을 확인했습니다.

## 7. 다음 단계 (study9 예정 — 고급 기술 구현 4)

- 같은 로그인 기능을 **Zustand**로 다시 구현
- Context와 Zustand의 리렌더링 차이를 직접 비교
