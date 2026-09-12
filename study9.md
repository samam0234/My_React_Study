# study9 (고급 기술 구현 4) — Zustand로 전역 상태 관리 (Context와 비교)

study8의 로그인 기능을 이번엔 **Zustand**로 다시 구현합니다. 기능은 완전히 동일하게 유지하고, "코드가 얼마나 달라지는지"와 "리렌더링 방식이 어떻게 다른지"에 집중합니다.

```
- [x] Vite + React + JS 프로젝트 생성
- [x] 함수 컴포넌트, props, children
- [x] useState / useEffect / useRef
- [x] 리스트 렌더링과 key
- [x] React Router 중첩 라우팅
- [x] 폼 상태 다루기 + API 연동 (axios / fetch)
- [x] Zustand로 전역 상태 (로그인)                     (Context와 Zustand 둘 다 실습 완료)
- [ ] 백엔드와 CORS 연동
```

대응하는 실습 프로젝트: [`demo/`](./demo) — `context/AuthContext.jsx` 삭제, `store/authStore.js`로 교체

---

## 1. Zustand란

Vue의 Pinia와 같은 역할을 하는, React용 경량 전역 상태관리 라이브러리입니다. "Context + useReducer로 상태관리 라이브러리를 직접 구현하면 이런 모양이 된다"를 이미 만들어서 제공하는 느낌에 가깝습니다.

```bash
npm install zustand
```

## 2. 스토어 정의 — Context보다 훨씬 짧다

```js
// store/authStore.js
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null }),
}))
```

study8의 `AuthContext.jsx`(약 25줄: `createContext`, `AuthProvider` 컴포넌트, `useState`, `useAuth` 커스텀 훅)와 비교하면:

| | Context (study8) | Zustand (study9) |
|---|---|---|
| 코드량 | Provider 컴포넌트 + Context 객체 + 커스텀 훅 | `create(...)` 한 번 |
| 앱에 연결하는 절차 | `<AuthProvider>`로 트리를 감싸야 함 | **불필요** — 스토어 훅을 그냥 import해서 씀 |
| 상태 변경 | `setUser(...)` (컴포넌트 내부 state) | `set({...})` (스토어 내부, `login`/`logout` 액션으로 캡슐화) |
| Provider 유무 | 필수 | 없음 (모듈 자체가 전역 싱글턴) |

`create((set) => ({...}))`의 `set`은 Vue Pinia의 액션 안에서 상태를 바꾸는 것과 비슷한 역할이지만, React의 `setState`처럼 "기존 값과 병합(merge)"해줍니다.

## 3. Provider가 사라짐 — `App.jsx` 변화

```jsx
// study8 (Context)
<AuthProvider>
  <BrowserRouter>
    ...
  </BrowserRouter>
</AuthProvider>
```

```jsx
// study9 (Zustand) — 감싸는 태그가 하나 줄었다
<BrowserRouter>
  ...
</BrowserRouter>
```

Zustand 스토어(`useAuthStore`)는 컴포넌트 트리와 무관하게 **모듈 레벨에서 한 번만 생성되는 싱글턴**입니다. 그래서 "이 컴포넌트가 Provider 안에 있는지"를 신경 쓸 필요가 없고, 어떤 파일에서든 `import { useAuthStore } from '...'` 후 바로 호출하면 됩니다.

## 4. 셀렉터(selector) — 필요한 값만 구독

```jsx
// ProtectedRoute.jsx
const user = useAuthStore((state) => state.user)

// LoginPage.jsx — user 값 자체는 필요 없고 login 함수만 필요
const login = useAuthStore((state) => state.login)

// MyPage.jsx — 둘 다 필요하면 두 번 호출
const user = useAuthStore((state) => state.user)
const logout = useAuthStore((state) => state.logout)
```

`useAuthStore(selector)`처럼 **어떤 조각을 구독할지 함수로 지정**하는 것이 Zustand의 핵심 특징입니다.

- Context는 `useAuth()`를 호출하면 `{ user, isLoggedIn, login, logout }` **전체 객체**를 받았습니다. `value` 객체의 어느 한 조각이라도 바뀌면(엄밀히는 Provider가 리렌더링되어 `value`가 새 객체가 되면), 이 Context를 구독하는 **모든** 컴포넌트가 리렌더링 대상이 됩니다.
- Zustand는 `state => state.user`처럼 셀렉터로 콕 집은 값이 **실제로 바뀔 때만** 그 컴포넌트가 리렌더링됩니다. `LoginPage`는 `login` 함수만 구독하므로, `user`가 바뀌어도 `LoginPage`는 리렌더링되지 않습니다.

## 5. 리렌더링 횟수로 직접 확인하기

`AuthStatus.jsx`에 `useRef`(study3에서 배운 "리렌더링을 유발하지 않는 값 저장" 용도)로 렌더링 횟수를 표시해뒀습니다.

```jsx
function AuthStatus() {
  const user = useAuthStore((state) => state.user)
  const renderCount = useRef(0)
  renderCount.current += 1

  return <p>{user ? `👤 ${user.name}님 로그인됨` : '로그인하지 않은 상태'} (렌더링 {renderCount.current}회)</p>
}
```

`user`가 실제로 바뀔 때(로그인/로그아웃)만 이 숫자가 올라갑니다. 홈 화면에서 과일 목록에 좋아요를 누르거나 검색어를 입력하는 등 **로그인과 무관한 상태 변경**은 `AuthStatus`의 렌더링 횟수에 전혀 영향을 주지 않습니다 — 이는 Zustand 셀렉터 구독의 특징이자, study8에서 예고했던 "관련 없는 컴포넌트까지 리렌더링될 수 있는" Context의 잠재적 단점을 회피하는 방식입니다.

## 6. 언제 Context를, 언제 Zustand를 쓸까

| 상황 | 추천 |
|---|---|
| 상태 변경이 드물고, 범위가 좁음 (예: 테마 색상, 다국어 설정) | Context로 충분 |
| 자주 바뀌는 상태를 여러 컴포넌트가 세밀하게 구독해야 함 (예: 로그인 정보, 장바구니, 실시간 데이터) | Zustand(또는 Redux 등) |
| Provider로 감싸는 것 자체가 부담스러운 구조 (예: 컴포넌트 트리 바깥의 유틸 함수에서도 상태 접근 필요) | Zustand — 컴포넌트 트리 밖에서도 `useAuthStore.getState()`로 접근 가능 |
| 라이브러리 의존성을 최소화하고 싶음 | Context (React 내장) |

실무에서는 작은 프로젝트나 컴포넌트 국소적인 상태는 Context로, 앱 전역에서 자주 참조/변경되는 상태(로그인, 장바구니 등)는 Zustand 같은 전용 라이브러리로 분리하는 경우가 많습니다. Notion 학습 목표의 "Context 또는 Zustand로 전역 상태"라는 표현도 이런 "상황에 따라 선택"이라는 뉘앙스입니다.

## 7. 실행 확인

```bash
cd demo
npm run dev
```

study8과 동일한 시나리오로 동작이 똑같은지 확인합니다 (기능은 안 바뀌었으므로):

- 로그인 → 헤더(`AuthStatus`)가 즉시 갱신되는지
- 로그아웃 → 다시 "로그인하지 않은 상태"로 바뀌는지
- 추가로: 헤더의 "(렌더링 N회)" 숫자가 로그인/로그아웃 시에만 올라가고, 다른 실습 컴포넌트(예: 홈의 좋아요 버튼)를 조작할 때는 그대로인지 확인 — Zustand 셀렉터 구독의 효과를 직접 눈으로 확인하는 부분입니다.

`npm run build`까지 에러 없이 되는 것을 확인했습니다.

## 8. 다음 단계 (study10 예정 — 고급 기술 구현 5)

- JS → TypeScript 전환 (`tsconfig`, `.tsx`, props/스토어 타입 정의)
- 기업형 폴더 구조(`features` 또는 `pages` + `components` + `hooks` + `api`) 정리
- 백엔드와의 CORS 연동 개념
