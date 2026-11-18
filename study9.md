# study9 — 테스트·디버깅

> 🎯 **목표**: 브라우저·React DevTools로 문제를 추적하고, Vitest + React Testing Library로 검증 로직·훅·화면을 테스트하며, 자주 나는 오류의 원인을 구분한다.

- 이전: [study8.md](./study8.md) — 구조화·재사용
- 다음: [study10.md](./study10.md) — 배포·정리
- 대상 코드: [`LoginFormPractice.jsx`](./JSX_study/demo/src/components/LoginFormPractice.jsx), [`authStore.ts`](./TSX_study/project/src/store/authStore.ts), [`useFetch.ts`](./TSX_study/project/src/hooks/useFetch.ts), [`PostCard.tsx`](./TSX_study/project/src/components/PostCard.tsx)

> ✅ **실제 코드와 검증**: 프런트의 Vitest + React Testing Library + MSW 테스트(83개)와 백엔드의 JUnit 5 + MockMvc + Testcontainers 테스트(45개)를 **작성하고 실행**했습니다. 아래 "실제 구현·검증 결과"를 먼저 보세요. `TSX_study/project`, `JSX_study/*`에는 여전히 테스트가 없습니다.

---

## 📖 이론

### 9.1 디버깅 도구

| 도구 | 용도 |
|---|---|
| 브라우저 Console | 에러·경고 첫 줄부터 읽기. 스택에서 **내 코드** 줄 찾기 |
| Network 탭 | 요청 URL·상태 코드·응답 본문·헤더, CORS/OPTIONS 확인 |
| Application 탭 | `localStorage`(persist 값), 쿠키 확인 |
| React DevTools (확장) | Components 트리·props·state 보기, Profiler로 리렌더 측정 |
| `console.log` / `debugger` | 값 추적, Sources 탭에서 중단점 |
| `StrictMode` | 개발 중 부작용(두 번 실행)을 일부러 드러내 버그를 찾음 |
| `oxlint` | 훅 규칙 위반 등을 정적으로 검사 ([`.oxlintrc.json`](./TSX_study/project/.oxlintrc.json): `react/rules-of-hooks`) |

### 9.2 테스트 종류 (기초 구간은 아래 2가지)

| 종류 | 대상 | 도구 |
|---|---|---|
| 단위(unit) | 순수 함수, 스토어, 훅 | Vitest |
| 컴포넌트(integration) | 화면이 사용자 행동에 반응하는지 | Vitest + React Testing Library |

(E2E, CI, 커버리지는 [study15](./study15.md))

### 9.3 Testing Library 철학

"**구현이 아니라 사용자가 보는 것**을 테스트한다." → `getByRole('button', { name: '로그인' })`처럼 **접근성 역할·라벨 텍스트**로 찾고, state 값이나 CSS 클래스는 직접 검사하지 않습니다. 이렇게 하면 리팩터링해도 테스트가 덜 깨집니다.

---

## 🛠️ 실기

### 1. 디버깅 실습 — 일부러 버그를 만들고 추적하기

1. `useFetch`의 `ignore = true` cleanup을 주석 처리 → 페이지를 빠르게 연속 이동하며 Network 탭에서 **느린 응답이 최신 화면을 덮는지** 관찰 (확인 후 원복)
2. `onClick={setPage(2)}`로 바꿔 `Too many re-renders` 에러의 스택에서 **내 컴포넌트 줄**을 찾기
3. React DevTools → Components에서 `PostListPage`의 `page` state를 직접 바꿔 보기
4. Profiler로 `AuthStatus`(`renderCount` 표시, [`AuthStatus.jsx`](./JSX_study/demo/src/components/AuthStatus.jsx))의 리렌더 횟수 확인

### 2. Vitest + React Testing Library 설치 (노션 체크 항목)

`TSX_study/project`와 같은 프로젝트에서 **복사본으로 연습**하거나 새 브랜치에서 진행하세요.

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

`vite.config.ts` — `vitest/config`의 `defineConfig`로 바꿔 `test` 옵션을 같은 파일에 둡니다.

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',           // 브라우저 DOM 흉내
    globals: true,                  // describe/it/expect를 import 없이
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest'     // toBeInTheDocument 등 추가 matcher
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
afterEach(() => cleanup())                    // 테스트마다 렌더 결과 정리
```

```json
// package.json scripts
"test": "vitest",
"test:run": "vitest run"
```

TS에서 `globals: true`를 쓰면 `tsconfig.app.json`의 `types`에 `"vitest/globals"`를 추가해야 `describe`가 타입 오류를 내지 않습니다.

### 3. 단위 테스트 ① — 검증 함수 (study5의 `validate`)

[`LoginFormPractice.jsx`](./JSX_study/demo/src/components/LoginFormPractice.jsx)의 `validate`를 `validators.ts`로 분리했다고 가정합니다.

```ts
// src/lib/validators.test.ts
import { validateLogin } from './validators'

describe('validateLogin', () => {
  it('유효한 입력이면 오류가 없다', () => {
    expect(validateLogin({ email: 'a@b.com', password: 'password123' })).toEqual({})
  })
  it('이메일에 @가 없으면 email 오류', () => {
    expect(validateLogin({ email: 'ab.com', password: 'password123' }).email).toBeDefined()
  })
  it('비밀번호가 8자 미만이면 password 오류', () => {
    expect(validateLogin({ email: 'a@b.com', password: '1234567' }).password).toBeDefined()
  })
})
```

순수 함수라 렌더링도 모킹도 필요 없습니다. **검증 로직을 컴포넌트 밖으로 뺀 이유**가 여기서 드러납니다.

### 4. 단위 테스트 ② — Zustand 스토어

```ts
// src/store/authStore.test.ts
import { useAuthStore } from './authStore'

beforeEach(() => useAuthStore.setState({ user: null }))   // 테스트 간 상태 격리

it('login하면 user가 채워지고 logout하면 비워진다', () => {
  useAuthStore.getState().login({ name: 'mina', email: 'mina@example.com' })
  expect(useAuthStore.getState().user?.name).toBe('mina')

  useAuthStore.getState().logout()
  expect(useAuthStore.getState().user).toBeNull()
})
```

### 5. 훅 테스트 — `useFetch` ([`useFetch.ts`](./TSX_study/project/src/hooks/useFetch.ts))

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { useFetch } from './useFetch'

it('성공하면 data가 채워지고 loading이 false가 된다', async () => {
  const { result } = renderHook(() => useFetch(() => Promise.resolve('ok'), []))
  expect(result.current.loading).toBe(true)                 // 처음엔 로딩
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.data).toBe('ok')
  expect(result.current.error).toBeNull()
})

it('실패하면 error가 채워진다', async () => {
  const { result } = renderHook(() => useFetch(() => Promise.reject(new Error('boom')), []))
  await waitFor(() => expect(result.current.error?.message).toBe('boom'))
  expect(result.current.data).toBeNull()
})
```

### 6. 컴포넌트 테스트 — 로그인 폼과 `PostCard`

```tsx
// src/pages/LoginPage.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'

function setup() {
  render(<MemoryRouter><LoginPage /></MemoryRouter>)     // Link/navigate 필요 → 라우터로 감싸기
  return { user: userEvent.setup() }
}

it('제출 전에는 오류 문구가 없다', () => {
  setup()
  expect(screen.queryByText('올바른 이메일 형식이 아닙니다.')).not.toBeInTheDocument()
})

it('잘못된 입력으로 제출하면 오류가 표시된다', async () => {
  const { user } = setup()
  await user.type(screen.getByLabelText(/이메일/), 'not-an-email')
  await user.type(screen.getByLabelText(/비밀번호/), '123')
  await user.click(screen.getByRole('button', { name: '로그인' }))
  expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
  expect(screen.getByText('비밀번호는 8자 이상이어야 합니다.')).toBeInTheDocument()
})
```

```tsx
// src/components/PostCard.test.tsx — 콜백 props + 링크 이동 막기 검증
it('즐겨찾기 버튼은 콜백만 호출한다', async () => {
  const onToggle = vi.fn()
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <PostCard post={{ id: 1, userId: 1, title: '제목', body: '' }} isFavorite={false} onToggleFavorite={onToggle} />
    </MemoryRouter>,
  )
  await user.click(screen.getByRole('button', { name: '☆' }))
  expect(onToggle).toHaveBeenCalledWith(1)
})
```

| 포인트 | 설명 |
|---|---|
| `MemoryRouter` | 테스트 환경에서 라우터 컨텍스트 제공 |
| `getByLabelText` / `getByRole` | 사용자 관점 쿼리. `LoginPage`의 `<label>이메일 <input/></label>` 구조를 그대로 활용 |
| `queryBy…` | **없음**을 검사할 때(없으면 `null`). `getBy…`는 없으면 에러 |
| `findBy…` / `waitFor` | 비동기로 나타나는 것 기다리기 |
| `vi.fn()` | 호출 여부·인자를 기록하는 가짜 함수 |

### 7. 실행

```bash
npm test          # 감시(watch) 모드
npm run test:run  # 한 번 실행하고 종료 (CI용)
```

---

## ✅ 실제 구현·검증 결과

### 프런트 (`TSX_study/final`) — `npm run test:run`: 7개 파일, **83개 통과**

**설정**: [`vite.config.ts`](./TSX_study/final/vite.config.ts)의 `test` 옵션(`environment: 'jsdom'`, `globals: true`, `setupFiles`), [`src/test/setup.ts`](./TSX_study/final/src/test/setup.ts)(jest-dom, `cleanup`, **MSW 서버 + `onUnhandledRequest: 'error'`**, 매 테스트 후 스토어·localStorage 초기화, jsdom에 없는 `matchMedia` 최소 구현), `tsconfig.app.json`의 `types`에 `vitest/globals`.

| 파일 | 개수 | 다루는 것 |
|---|---|---|
| [`lib/lib.test.ts`](./TSX_study/final/src/lib/lib.test.ts) | 8 | zod 검증, 로그 마스킹, 수정(작성자)·삭제(작성자/관리자) 권한 |
| [`store/store.test.ts`](./TSX_study/final/src/store/store.test.ts) | 6 | persist 저장·복원, 즐겨찾기 토글, 토스트 |
| [`store/redux/redux.test.tsx`](./TSX_study/final/src/store/redux/redux.test.tsx) | 2 | Redux Toolkit slice(순수 리듀서) + Provider 훅 (study11) |
| [`api/api.test.ts`](./TSX_study/final/src/api/api.test.ts) | 16 | 인터셉터(Bearer·401·403·네트워크), `ApiError` 변환, CRUD, AI(chat·스트림 401·한도 429) |
| [`hooks/hooks.test.tsx`](./TSX_study/final/src/hooks/hooks.test.tsx) | 8 | `useDebounce`(가짜 타이머), `useFetch`(경쟁 상태), `useSummary`(SSE 조각·오류 이벤트·401) |
| [`components/components.test.tsx`](./TSX_study/final/src/components/components.test.tsx) | 13 | Pagination, PostCard, ProtectedRoute, AppHeader, ErrorBoundary, FormField 접근성, 테마 토글 |
| [`pages/pages.test.tsx`](./TSX_study/final/src/pages/pages.test.tsx) | 30 | 목록(URL 상태·검색·오류 복구·즐겨찾기), 상세(XSS·삭제·403·관리자 삭제·댓글), 폼(서버 fields, AI로 다듬기), 로그인, 가입, 마이페이지, 앱 라우팅(lazy) |

**커버리지** (`npm run coverage`): 문장 92.9%, 분기 81.4%, 함수 91.2%, 라인 94.9%.

### 백엔드 (`backend-spring`) — `./gradlew test`: **45개 통과** (실제 PostgreSQL 16 컨테이너)

| 클래스 | 개수 | 다루는 것 |
|---|---|---|
| `PostApiTest` | 16 | 노션 체크리스트 7개 + Location·limit 상한·sort·q 이스케이프·댓글순·PATCH 부분·관리자·soft delete |
| `AuthApiTest` | 8 | 가입(BCrypt)·로그인·실패 동일 응답·429·`me`·위조/만료 토큰·로그아웃 |
| `CommentApiTest` | 5 | 작성·목록·`commentCount`·삭제 권한·글 삭제 후 404 |
| `PlatformApiTest` | 8 | `/health`·**응답 `Content-Type: application/json;charset=UTF-8`**·`X-Request-Id`·CORS·OpenAPI·413·500 비노출·JWT_SECRET 규칙 |
| `AiApiTest` / `AiLimitsTest` | 6 / 2 | 401·한 번에 받기·사용량 DB 저장·입력 검증·거절·SSE / 일일 한도·분당 제한 |

AAA(Arrange-Act-Assert) 형태로 쓰고, 테스트마다 고유 이메일을 써서 같은 DB를 공유해도 서로 간섭하지 않게 했습니다. 외부 의존(모델 API)은 `MockAiProvider`로 끊었습니다(노션: "mock / stub 으로 외부 의존 끊기").

### 테스트가 실제로 잡은 것·실수한 것

| 발견 | 종류 | 조치 |
|---|---|---|
| 삭제가 403이면 `Unhandled Rejection` | **앱 버그** (`mutateAsync` 거부 미처리) | `handleDelete`에 `try/catch` |
| 모든 통합 테스트가 413 | 설정 실수: 테스트의 `application.properties`가 main 설정을 **가림** | `application-test.properties` + `@ActiveProfiles("test")` |
| SSE 본문 한글 깨짐 | **서버 버그**: Content-Type에 charset 없음 | `text/event-stream;charset=UTF-8` |
| `rehydrate` 테스트 실패 | 테스트 오류: `setState`도 persist에 저장되어 값이 덮임 | 저장소에 직접 값을 넣고 복원 |
| ErrorBoundary 테스트에서 "첫 렌더만 실패"가 통과하지 않음 | 테스트 오류: React 19는 동시 렌더 실패 시 동기 렌더로 **한 번 더 시도** | 플래그로 제어하고 `onReset`에서 해제 |
| `toHaveTextContent('/posts/1')`가 `/posts/1/edit`에도 통과 | 테스트 오류: 부분 일치 | `textContent`를 `toBe`로 정확히 비교 |

> 같은 전략의 확장(MSW, Playwright, CI)은 [study15](./study15.md).

---

## 🐞 오류 노트 — 자주 나는 React 오류

| 증상 | 원인 | 해결 |
|---|---|---|
| `Too many re-renders` | 렌더링 중 `setState` 호출, `onClick={fn()}` | `onClick={() => fn()}` |
| `Each child in a list should have a unique "key"` | `key` 없음/중복 | 안정적인 id |
| `Rendered more hooks than during the previous render` / Hook 규칙 경고 | 조건문·반복문 안에서 훅 호출, 훅 앞 `return` | 훅은 항상 최상단에서 같은 순서로 (oxlint의 `rules-of-hooks`가 잡아줌) |
| `Cannot update a component while rendering a different component` | 렌더링 중 다른 컴포넌트 상태 변경 | effect/이벤트 핸들러로 이동 |
| effect가 두 번 실행됨 | 개발 모드 `StrictMode` | cleanup이 짝을 이루는지 확인(정상 동작) |
| `Maximum update depth exceeded` | effect가 의존성 값을 바꾸며 무한 반복 | 의존성/조건 재검토 |
| 이전 상태 값이 계속 보임 | stale closure | 함수형 업데이트, 의존성 추가 |
| 테스트에서 `Unable to find an element with the role…` | 이름/역할 불일치 | `screen.debug()`로 DOM 출력, `getByRole('button', { name: … })` 이름 확인 |
| 테스트 경고 `not wrapped in act(...)` | 비동기 상태 갱신을 기다리지 않음 | `await user.…`, `findBy…`, `waitFor` 사용 |
| `useNavigate() may be used only in the context of a <Router>` (테스트) | 라우터 없이 렌더 | `MemoryRouter`로 감싸기 |
| `ReferenceError: describe is not defined` | `globals: true` 미설정 또는 타입 미설정 | 설정/`vitest/globals` 추가, 또는 명시적 import |

---

## ☐ 체크리스트

- [ ] Console → Network → React DevTools 순서로 문제를 좁히는 방법을 설명할 수 있다
- [ ] 일부러 만든 버그(Too many re-renders 등)를 스택에서 내 코드 줄까지 추적했다
- [ ] `StrictMode`에서 effect가 두 번 도는 이유를 안다
- [ ] 단위 테스트와 컴포넌트 테스트의 차이를 설명할 수 있다
- [x] 순수 함수(검증)·스토어·훅 각각에 테스트를 1개 이상 작성했다
- [x] `getByRole` / `getByLabelText`로 사용자 관점에서 요소를 찾았다
- [x] `npm run test:run`이 통과하는 것을 확인했다 — final 83개, backend-spring `./gradlew test` 45개
- [x] **(노션) Vitest + React Testing Library 테스트** — 83개 통과, 라인 커버리지 94.9%

---

## ➡️ 다음 단계 연결

[study10](./study10.md)에서 `build` → `preview`로 배포 파일을 만들고, **외부에 배포**한 뒤 기초 구간을 총정리합니다.
