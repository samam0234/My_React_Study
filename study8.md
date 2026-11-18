# study8 — 구조화·재사용: 폴더 구조·공통 모듈·환경 변수

> 🎯 **목표**: 기업형 폴더 구조로 코드를 나누고, 공통 모듈(api·훅·스토어·타입)을 재사용하며, 개발/운영 환경 설정을 환경 변수로 분리한다.

- 이전: [study7.md](./study7.md) — 인증·보안 기초
- 다음: [study9.md](./study9.md) — 테스트·디버깅
- 실습 코드: [`TSX_study/project/src`](./TSX_study/project/src) (구조), [`JSX_study/project/src/context`](./JSX_study/project/src/context) (Context 방식)

---

## 📖 이론

### 8.1 기업형으로 써 볼 구조 (노션 원칙)

- `features/` **또는** `pages/` + `components/` + `hooks/` + `api/` 로 나눈다.
- **페이지 단위로 데이터 패칭 위치**를 정한다.
- 에러/로딩/빈 상태를 UI에 명시한다.

### 8.2 계층별 책임

| 폴더 | 책임 | 알아도 되는 것 |
|---|---|---|
| `api/` | HTTP 호출, URL, 응답 매핑 | axios, 백엔드 주소 (**유일하게** 알아야 함) |
| `hooks/` | 재사용 가능한 로직(`useFetch`) | 상태·effect |
| `store/` | 전역 상태 (Zustand) | 도메인 상태 |
| `components/` | 재사용 UI 조각 | props |
| `pages/` | 라우트 단위 화면, 데이터 패칭 | api·hooks·store 조합 |
| `types.ts` | 공유 타입 | — |

규칙: **의존 방향은 `pages → components/hooks/store → api`**. 하위가 상위를 import하지 않습니다.

### 8.3 전역 상태 선택 — Context vs Zustand

| | Context | Zustand |
|---|---|---|
| Provider | 필요 (`<AuthProvider>`) | 불필요 |
| 구독 단위 | value가 바뀌면 **구독한 모든 컴포넌트**가 리렌더 | 선택자(`selector`)로 **필요한 값만** 구독 |
| 컴포넌트 밖에서 접근 | 불가 | `getState()` 가능 (study7 인터셉터) |
| 적합 | 테마·언어처럼 드물게 바뀌는 값 | 로그인·장바구니 등 자주 쓰는 상태 |

### 8.4 환경 변수 (Vite)

| 파일 | 용도 |
|---|---|
| `.env` | 모든 모드 공통 |
| `.env.development` | `npm run dev` |
| `.env.production` | `npm run build` |
| `.env.local` | 내 PC 전용 (git 제외) |

- 브라우저에 노출되는 값은 **반드시 `VITE_` 접두어**. 코드에서는 `import.meta.env.VITE_…`.
- ⚠️ **빌드 때 값이 코드에 박힙니다.** 즉 **비밀(API 키, DB 비밀번호)은 절대 `VITE_`에 넣지 않습니다.** 브라우저에서 누구나 읽을 수 있습니다. (노션: "비밀은 코드·이미지에 없다. `.env.example`에 키 이름만 남긴다.")

---

## 🛠️ 실기

### 1. 현재 저장소의 구조 — [`TSX_study/project/src`](./TSX_study/project/src)

```text
src/
├─ api/          client.ts, posts.ts          ← axios 인스턴스 + 호출 함수
├─ components/   AppHeader.tsx, PostCard.tsx, ProtectedRoute.tsx
├─ hooks/        useFetch.ts                  ← 재사용 훅
├─ pages/        PostListPage.tsx, PostDetailPage.tsx, LoginPage.tsx, MyPage.tsx
├─ store/        authStore.ts, favoritesStore.ts
├─ types.ts                                   ← Post, Comment, User
├─ App.tsx                                    ← 라우트 정의
└─ main.tsx
```

### 2. 구조가 지켜지는지 코드로 확인

[`PostListPage.tsx:21-24`](./TSX_study/project/src/pages/PostListPage.tsx)

```tsx
const { data: posts, loading, error } = useFetch<Post[]>(
  () => fetchPosts({ page, limit: LIMIT }),
  [page],
)
```

- 페이지가 `hooks/useFetch` + `api/fetchPosts`를 **조합**합니다. 페이지는 axios도, URL도 모릅니다.
- [`AppHeader.tsx:7-8`](./TSX_study/project/src/components/AppHeader.tsx): 헤더는 로그인·페이지와 **부모-자식 관계가 아닌데도** 같은 `authStore`를 구독해 즉시 갱신됩니다.
- [`favoritesStore.ts:9-10`](./TSX_study/project/src/store/favoritesStore.ts) 주석: "로그인 여부"와 "즐겨찾기 목록"은 **바뀌는 이유가 달라 스토어를 분리**. 스토어를 하나로 몰지 않는 것이 `store/` 폴더가 커질 때의 기본 원칙.

### 3. Context 방식과 비교 — [`JSX_study/project`](./JSX_study/project/src/context)

```jsx
// context/AuthContext.jsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  function login(nextUser) { setUser(nextUser) }
  function logout() { setUser(null) }
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

// hooks/useAuth.js
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있습니다.')
  return value
}
```

| 포인트 | 설명 |
|---|---|
| 파일 분리 | `createContext`(`authContext.js`)와 Provider(`AuthContext.jsx`)를 나눈 이유: 컴포넌트 파일에서는 컴포넌트만 export해야 HMR/린트(`react/only-export-components`)가 안정적 |
| `useAuth` 가드 | Provider 밖에서 쓰면 즉시 명확한 에러 |
| `value={{ … }}` | 매 렌더링마다 새 객체 → 구독자가 불필요하게 리렌더될 수 있음(study12에서 `useMemo`로 완화) |

같은 로그인 상태를 Zustand로 만든 것이 [`JSX_study/demo/src/store/authStore.js`](./JSX_study/demo/src/store/authStore.js)입니다. Provider 없이 같은 기능이 9줄로 끝납니다.

### 4. 환경 변수 분리 (설명용 예제)

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080

# .env.production
VITE_API_BASE_URL=/api            # 같은 도메인 + Nginx 프록시 (study17)

# .env.example   ← git에 올리는 것 (키 이름만)
VITE_API_BASE_URL=
```

`.gitignore`에는 이미 `*.local`이 있습니다 ([`TSX_study/project/.gitignore`](./TSX_study/project/.gitignore)). 비밀이 들어갈 수 있는 `.env.local`은 커밋되지 않습니다.

```ts
// src/config.ts — 환경 변수는 한 파일에서만 읽는다
const required = (key: string): string => {
  const v = import.meta.env[key] as string | undefined
  if (!v) throw new Error(`환경 변수 ${key}가 설정되지 않았습니다.`)
  return v
}
export const config = {
  apiBaseUrl: required('VITE_API_BASE_URL'),
  isProd: import.meta.env.PROD,
}
```

```ts
// api/client.ts
import { config } from '../config'
export const apiClient = axios.create({ baseURL: config.apiBaseUrl, timeout: 5000 })
```

TS에서 `import.meta.env.VITE_…`의 타입을 알려주려면 `src/vite-env.d.ts`에 선언합니다:

```ts
/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_API_BASE_URL: string }
interface ImportMeta { readonly env: ImportMetaEnv }
```

(현재 [`tsconfig.app.json`](./TSX_study/project/tsconfig.app.json)의 `types: ["vite/client"]`가 기본 타입을 제공합니다.)

### 5. 경로 별칭(alias) — 깊은 `../../..` 제거 (선택)

```ts
// vite.config.ts
import path from 'node:path'
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
})
```
```json
// tsconfig.app.json — compilerOptions 안
"baseUrl": ".", "paths": { "@/*": ["src/*"] }
```

이후 `import { useAuthStore } from '@/store/authStore'`처럼 씁니다. (shadcn/ui(study13)도 `@/` 별칭을 요구합니다.) `__dirname`은 `vite.config.ts` 실행 환경에서 쓸 수 있도록 `@types/node`가 필요하며 현재 프로젝트에는 이미 설치되어 있습니다.

### 6. `features/` 구조로 키우기

페이지가 늘면 "기술 종류"가 아니라 "기능 단위"로 묶는 방식이 편합니다.

```text
src/
├─ features/
│  ├─ posts/   api.ts, hooks.ts, PostCard.tsx, PostListPage.tsx, types.ts
│  └─ auth/    api.ts, store.ts, LoginPage.tsx, ProtectedRoute.tsx
├─ shared/     apiClient.ts, useFetch.ts, ui/…
└─ app/        App.tsx, routes.tsx
```

현재 규모(페이지 4개)에서는 `pages/` + `components/` 구조로 충분합니다. **"파일을 찾는 데 시간이 걸리기 시작할 때"** 옮기면 됩니다.

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| `import.meta.env.VITE_X`가 `undefined` | 접두어 `VITE_` 없음 / `.env` 수정 후 dev 서버 재시작 안 함 | 접두어 확인, 서버 재시작 |
| 운영 빌드에 개발 URL이 박힘 | 빌드 때 `.env.development`가 사용됨 | `npm run build`는 `production` 모드. 운영 값은 `.env.production` 또는 CI 변수로 주입 |
| 비밀 키가 번들(`dist/`)에 보임 | `VITE_` 변수에 비밀을 넣음 | 비밀은 백엔드에서만. 프론트에는 공개해도 되는 값만 |
| `Cannot find module '@/…'` | alias를 Vite에만 / tsconfig에만 설정 | **둘 다** 설정 |
| 순환 import로 `undefined` | `store`가 `api`를, `api`가 `store`를 서로 import | 의존 방향 정리, 필요하면 `getState()`를 호출 시점에 사용 (study7 인터셉터는 호출 시점에 읽으므로 안전) |
| Fast Refresh가 컴포넌트 파일에서 동작 안 함 | 컴포넌트 파일에서 훅·상수도 함께 export | 파일 분리 (`authContext.js` / `AuthContext.jsx`) |

---

## ☐ 체크리스트

- [ ] `api / hooks / store / components / pages / types` 각 폴더의 책임을 설명할 수 있다
- [ ] 페이지가 axios·URL을 직접 알지 않고 `api/` 함수를 호출하게 했다
- [ ] 스토어를 "바뀌는 이유"별로 나누는 기준을 설명할 수 있다
- [ ] Context와 Zustand를 같은 로그인 기능으로 구현해 보고 차이(Provider, 리렌더 범위, 컴포넌트 밖 접근)를 말할 수 있다
- [ ] `.env.development` / `.env.production` / `.env.example`을 만들고 `import.meta.env`로 `baseURL`을 분리했다
- [ ] `VITE_` 변수가 빌드 결과에 노출됨을 알고 비밀을 넣지 않는다
- [ ] (선택) `@/` 경로 별칭을 Vite와 tsconfig **양쪽**에 설정했다

---

## ➡️ 다음 단계 연결

구조가 잡혔으니 [study9](./study9.md)에서 **디버깅 도구와 테스트(Vitest + React Testing Library)** 로 이 구조가 깨지지 않는지 확인합니다.
