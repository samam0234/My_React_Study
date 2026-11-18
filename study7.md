# study7 — 인증·보안 기초

> 🎯 **목표**: 보호된 라우트와 Zustand 로그인 상태를 **실제 로그인 API**에 연결하고, 토큰 저장·새로고침 유지(`persist`)·401/403 처리(axios 인터셉터)를 구현한다.

- 이전: [study6.md](./study6.md) — DB·API 연동
- 다음: [study8.md](./study8.md) — 구조화·재사용
- 실습 코드: [`store/authStore.ts`](./TSX_study/project/src/store/authStore.ts), [`components/ProtectedRoute.tsx`](./TSX_study/project/src/components/ProtectedRoute.tsx), [`pages/LoginPage.tsx`](./TSX_study/project/src/pages/LoginPage.tsx)

> ✅ **실제 코드와 검증**: 로그인 API 연결·`persist`·인터셉터(401/403)·보호된 라우트·작성자/관리자 UI는 [`TSX_study/final`](./TSX_study/final)에, **인증·인가의 서버 쪽(JWT·BCrypt·401/403·역할)은 [`backend-spring/`](./backend-spring)** 에 구현하고 Vitest·JUnit·Playwright로 검증했습니다. 아래 "실제 구현·검증 결과"를 먼저 보세요.

---

## 📖 이론

### 7.1 인증(Authentication) vs 인가(Authorization)

| 구분 | 질문 | 예 |
|---|---|---|
| 인증 | "당신은 누구인가?" | 로그인, 토큰 검증 |
| 인가 | "이 일을 해도 되는가?" | 내 글만 수정/삭제 (403) |

### 7.2 토큰 방식 (스펙 v1)

```text
POST /api/auth/login  { email, password }
 → 200 { data: { user: {...}, accessToken: "eyJ..." } }
이후 모든 요청: Authorization: Bearer <accessToken>
```

- 토큰 만료 1시간(학습용은 7일까지 허용), 실패 시 `401 UNAUTHORIZED` / 로그인 실패는 `401 INVALID_CREDENTIALS`, 남의 글 수정은 `403 FORBIDDEN`.
- 같은 도메인 풀스택이면 `httpOnly` 쿠키도 가능하지만, 이 React SPA 학습에서는 **Bearer 토큰**을 기준으로 합니다.

### 7.3 토큰을 어디에 두나

| 위치 | 장점 | 위험 |
|---|---|---|
| 메모리(Zustand 상태만) | 새로고침하면 사라져 XSS 노출 최소 | 새로고침마다 재로그인 |
| `localStorage` (persist) | 새로고침 유지, 구현 쉬움 | **XSS에 취약** — 스크립트가 읽을 수 있음 |
| `httpOnly` 쿠키 | JS에서 못 읽음 → XSS 안전 | CSRF 대책·CORS 설정 필요 |

학습 단계에서는 `localStorage`(persist)를 쓰되, 그 위험을 알고 **study16**에서 보완 방법(CSP, 짧은 만료, 쿠키 전환)을 다룹니다. 노션 기록에 따르면 Spring_Boot_Study의 `project/client`도 토큰을 `localStorage`에 두고 매 요청 Bearer로 붙이는 방식입니다.

### 7.4 프론트 권한 처리의 한계

버튼을 숨기고 라우트를 막는 것은 **UX**일 뿐입니다. 진짜 권한 검사는 **서버**(401/403)가 합니다. 프론트는 "서버가 거절하면 어떻게 보여줄지"를 책임집니다.

---

## 🛠️ 실기

### 1. 현재 저장소의 로그인 — 가짜 로그인

[`authStore.ts`](./TSX_study/project/src/store/authStore.ts)

```ts
interface AuthState { user: User | null; login: (u: User) => void; logout: () => void }

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null }),
}))
```

[`LoginPage.tsx:38-45`](./TSX_study/project/src/pages/LoginPage.tsx)

```tsx
function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  setSubmitted(true)
  if (!isValid) return
  login({ name: form.email.split('@')[0], email: form.email })   // 서버 없이 바로 로그인 처리
  navigate(from, { replace: true })
}
```

| 줄 | 설명 |
|---|---|
| 43 | **서버 호출이 없습니다.** 이메일에 `@`, 비밀번호 8자 이상이면 누구든 로그인 → 학습용. 실제 서비스라면 이 줄이 `POST /api/auth/login` 호출로 바뀜 |
| 44 | `from`(로그인 전에 가려던 곳)으로 `replace` 이동 — `replace`는 뒤로가기로 로그인 화면에 돌아오지 않게 함 |

[`ProtectedRoute.tsx`](./TSX_study/project/src/components/ProtectedRoute.tsx)

```tsx
const user = useAuthStore((state) => state.user)
const location = useLocation()
if (!user) return <Navigate to="/login" replace state={{ from: location }} />
return children
```

- `user`가 없으면 `/login`으로 보내면서 `state.from`에 **원래 가려던 위치**를 담습니다. 로그인 성공 시 `LoginPage`가 이를 꺼내 되돌려 보냅니다(`LoginPage.tsx:22-23`).
- 한계: 새로고침하면 Zustand 상태가 초기화되어 로그아웃됩니다 → §3에서 `persist`로 해결.

### 2. 로그인을 실제 API에 연결하기 (설명용 예제 코드)

**① 타입과 API 함수**

```ts
// types.ts (추가)
export interface AuthUser { id: number; email: string; nickname: string }
export interface LoginResult { user: AuthUser; accessToken: string }

// api/auth.ts
export async function loginApi(email: string, password: string): Promise<LoginResult> {
  const res = await apiClient.post<{ data: LoginResult }>('/api/auth/login', { email, password })
  return res.data.data
}
```

**② 스토어에 토큰 추가**

```ts
interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  setSession: (r: LoginResult) => void
  logout: () => void
}
```

**③ 로그인 화면 — 서버 응답 처리**

```tsx
async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault()
  setSubmitted(true)
  if (!isValid || submitting) return
  setSubmitting(true); setFormError(null)
  try {
    const result = await loginApi(form.email, form.password)
    setSession(result)
    navigate(from, { replace: true })
  } catch (err) {
    const code = (err as AxiosError<{ error: { code: string } }>).response?.data?.error?.code
    setFormError(code === 'INVALID_CREDENTIALS'
      ? '이메일 또는 비밀번호가 올바르지 않습니다.'   // 어느 쪽이 틀렸는지는 알려주지 않음
      : '로그인에 실패했습니다. 잠시 후 다시 시도하세요.')
  } finally {
    setSubmitting(false)
  }
}
```

### 3. Zustand `persist` — 새로고침해도 로그인 유지

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setSession: ({ user, accessToken }) => set({ user, accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'board-auth',                         // localStorage 키
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),   // 함수는 저장하지 않음
    },
  ),
)
```

| 항목 | 설명 |
|---|---|
| `persist(…, options)` | 상태가 바뀔 때마다 저장소에 쓰고, 앱 시작 시 복원 |
| `name` | 저장소 키. 브라우저 개발자 도구 → Application → Local Storage에서 확인 |
| `partialize` | 저장할 필드만 선택. **필요한 것만 저장**해서 노출을 줄임 |
| 즐겨찾기 | [`favoritesStore.ts`](./TSX_study/project/src/store/favoritesStore.ts)에도 같은 방식으로 적용 가능 (`favoritePostIds`만 저장) |

> 확인: 로그인 → 새로고침 → 헤더에 사용자 이름이 유지되는가? 로그아웃 → Local Storage의 `board-auth` 값이 비는가?

### 4. axios 인터셉터 — 401/403을 한 곳에서

`api/client.ts`에 **요청 인터셉터**(토큰 첨부)와 **응답 인터셉터**(오류 공통 처리)를 둡니다.

```ts
import axios, { AxiosError } from 'axios'
import { useAuthStore } from '../store/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
})

// 요청: 토큰이 있으면 매번 Authorization 헤더에 붙인다
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken     // 훅이 아니므로 getState()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 응답: 인증/권한 오류를 한 곳에서 처리
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ error?: { code?: string } }>) => {
    const status = error.response?.status
    if (status === 401) {
      useAuthStore.getState().logout()                  // 만료·위조 토큰 → 세션 정리
      if (location.pathname !== '/login') {
        location.assign(`/login?expired=1`)             // 로그인 화면으로
      }
    } else if (status === 403) {
      // 로그인은 되어 있으나 권한 없음 → 화면에서 안내 (토스트/알림)
      window.dispatchEvent(new CustomEvent('app:forbidden'))
    }
    return Promise.reject(error)                        // 호출한 쪽도 catch 할 수 있게 반드시 다시 던짐
  },
)
```

| 줄 | 설명 |
|---|---|
| `getState()` | 컴포넌트 밖(인터셉터)에서는 훅을 쓸 수 없으므로 Zustand의 `getState()`로 최신 상태를 읽음 |
| 401 처리 | 토큰이 없거나 만료/위조. **세션을 비우고 로그인으로**. 로그인 요청 자체의 `INVALID_CREDENTIALS`(401)까지 이 분기로 떨어지지 않게, 로그인 화면에서는 리다이렉트하지 않는 조건이 필요 |
| 403 처리 | 로그인은 되어 있으나 남의 글 수정/삭제 등. **로그아웃시키면 안 됨** — 안내만 |
| `Promise.reject` | 인터셉터가 오류를 삼키면 각 화면의 `catch`·로딩 종료가 동작하지 않음 |

> `location.assign` 대신 React Router의 `navigate`를 쓰고 싶다면 라우터 밖에서 쓸 수 있는 `router.navigate`(Data Router) 또는 이벤트로 알리는 방식으로 분리합니다. 위 예제는 가장 단순한 방식입니다.

### 5. 권한 UI — 내 글에만 수정/삭제 버튼

```tsx
const me = useAuthStore((s) => s.user)
const canEdit = me?.id === post.author.id
{canEdit && (<>
  <button onClick={onEdit}>수정</button>
  <button onClick={onDelete}>삭제</button>
</>)}
```

이 코드는 **버튼을 숨길 뿐**입니다. 개발자 도구로 직접 `DELETE`를 보내도 서버가 `403`으로 막아야 하며, 프론트는 §4의 403 처리로 안내합니다.

### 6. 실행 확인 시나리오

1. 로그아웃 상태로 `/mypage` 접속 → `/login`으로 이동하는가
2. 로그인 성공 → 원래 가려던 `/mypage`로 돌아오는가 (`from` state)
3. 새로고침 후에도 로그인이 유지되는가 (persist)
4. 개발자 도구에서 `accessToken`을 일부러 손상시킨 뒤 요청 → 401 → 로그인 화면으로 이동하는가
5. 남의 글 삭제 시도 → 403 안내가 뜨고 로그아웃되지는 않는가
6. Network 탭에서 요청 헤더에 `Authorization: Bearer …`가 붙는가

---

## ✅ 실제 구현·검증 결과

### 프런트 (`TSX_study/final`)

| 기능 | 구현 위치 | 검증 |
|---|---|---|
| 로그인·가입 API, 응답은 zod 검증, 서버 `error.fields`를 입력란에 표시 | [`api/auth.ts`](./TSX_study/final/src/api/auth.ts), [`LoginPage.tsx`](./TSX_study/final/src/pages/LoginPage.tsx), [`SignupPage.tsx`](./TSX_study/final/src/pages/SignupPage.tsx) | pages.test, E2E |
| 새로고침 후 로그인 유지 (Zustand `persist`, 키 `board-auth`, `partialize`) | [`store/authStore.ts`](./TSX_study/final/src/store/authStore.ts) | store.test, E2E |
| 요청 인터셉터 `Authorization: Bearer` / 응답 인터셉터 **401** 세션 정리 + 이벤트 → [`SessionWatcher`](./TSX_study/final/src/components/SessionWatcher.tsx)가 `/login`으로 | [`api/client.ts`](./TSX_study/final/src/api/client.ts) | api.test, components.test, E2E |
| 401이어도 **토큰이 없으면** 이벤트 없음(무한 리다이렉트 방지), 로그인·가입 요청의 401은 "세션 만료" 아님 | 〃 | api.test |
| **403**: 로그아웃하지 않고 토스트만 | 〃 + `toastStore` | api.test, pages.test, E2E "직접 DELETE → 403" |
| 로그인 실패 메시지는 이유를 숨김, 로그인 후 `state.from`으로 복귀 | LoginPage, `ProtectedRoute` | pages.test, E2E |
| 수정은 작성자만, **삭제는 작성자 또는 관리자**(`role`) — UI일 뿐 서버가 403 | [`lib/permissions.ts`](./TSX_study/final/src/lib/permissions.ts) | lib.test, pages.test, E2E "관리자는 남의 글을 삭제" |
| 로그아웃 시 서버에 `POST /api/auth/logout`(204) 알림 | [`AppHeader.tsx`](./TSX_study/final/src/components/AppHeader.tsx) | components.test |

### 서버 (`backend-spring`) — 노션 "인증 · 인가" / Spring 페이지의 구조 그대로

| 기능 | 구현 | 검증 (AuthApiTest·PostApiTest·CommentApiTest) |
|---|---|---|
| 가입 `409 EMAIL_TAKEN`, 검증 `fields`, **비밀번호는 BCrypt 해시로만 저장**(응답 어디에도 없음) | `AuthService`, `SecurityConfig.passwordEncoder` | DB에서 `$2…` 해시 확인 |
| 로그인 `INVALID_CREDENTIALS`: **없는 이메일과 틀린 비밀번호가 같은 응답** | `AuthService.login` | 두 응답 비교 |
| **로그인 시도 제한** `429 RATE_LIMITED` (같은 IP+이메일, 1분 N회) — 노션 "웹 보안 기초"의 무차별 대입 방지 | `RateLimiter` | 한도 후 올바른 비밀번호도 429 |
| JWT HS256, 만료 1시간, **시크릿은 환경 변수**(`JWT_SECRET`, 32바이트 이상·prod 필수) | `JwtService` | 만료·위조·타 시크릿 토큰 401, prod 시크릿 누락 시 기동 거부 |
| 필터 체인: `JwtAuthenticationFilter` → SecurityContext, 세션 `STATELESS`, CSRF 비활성(Bearer) | `SecurityConfig`, `JwtAuthenticationFilter` (탈퇴·삭제된 사용자의 토큰은 DB 조회로 거절) | 토큰 없이 보호 API → **401** |
| 401·403도 **스펙 v1 JSON**(`UNAUTHORIZED`/`FORBIDDEN` + `requestId`) | `ErrorWriter`, entry point/denied handler | 전 테스트 |
| **인가는 서비스 계층**에서(DB를 읽어 작성자 비교) — Guard는 401까지만 | `PostService.update/delete`, `CommentService.delete` | 남의 글 수정 **403**, 관리자는 삭제만 가능·수정 403 |
| 역할 `user`/`admin` (`users.role` CHECK 제약, 가입 API로는 admin 생성 불가) | `User.isAdmin`, `AuthUser` | 관리자 삭제 204 |

노션 9개월차 4주차 체크리스트: 토큰 없이 보호 API → 401 ✅, 권한이 없으면 403 ✅, 프런트 코드 수정이 거의 없이 연결 ✅(주소·환경 변수만), 컨트롤러·서비스 테스트 ✅.

### 노션 "인증 · 인가" 정리와의 연결

| 노션에서 정리한 원칙 | 이 구현에서 |
|---|---|
| 401과 403은 다르다 | 인터셉터: 401은 세션 정리, 403은 안내. 서버: 토큰 문제 401 / 남의 글 403 |
| 로그인 실패는 이유를 숨긴다 | `INVALID_CREDENTIALS` 한 가지 |
| `localStorage`는 XSS에 읽힌다 → SPA는 Bearer + 짧은 만료 | Bearer + `localStorage` + 만료 1시간. **위험을 알고 쓴 선택**, CSP는 study16·17 |
| 쿠키를 쓰면 CSRF를 생각한다 | Bearer 헤더 방식이라 해당 없음 |
| CORS는 서버가 허용 목록으로만 | `CORS_ORIGIN`, 와일드카드 없음 |
| 비밀값은 환경 변수 | `JWT_SECRET`, `DB_PASSWORD`, `ANTHROPIC_API_KEY` |
| 비밀번호 해시 | BCrypt (노션 표의 Spring 행과 동일) |

### 아직 하지 않은 것 (노션 "인증 · 인가"의 "아직 안 한 것")

- [ ] **Refresh Token** (접근 토큰 15분 + 리프레시 14일 httpOnly 쿠키, rotation, 로그아웃 시 폐기) — 지금 로그아웃은 토큰을 폐기하지 않는다(만료까지 유효)
- [ ] **OAuth 소셜 로그인** (Authorization Code + PKCE)
- [ ] **비밀번호 재설정·이메일 인증**
- [ ] 토큰을 `httpOnly` 쿠키로 옮기기 (`withCredentials` + CSRF 대책 필요)

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 새로고침하면 로그아웃됨 | Zustand 상태는 메모리 | `persist` 적용 |
| 새로고침 직후 보호된 페이지가 `/login`으로 튕김 | 비동기 스토리지(IndexedDB 등)를 쓰면 복원이 끝나기 전에 `ProtectedRoute`가 `user=null`로 판정 (`localStorage`는 동기라 보통 해당 없음) | 복원 완료 여부(`persist.hasHydrated()` / `onRehydrateStorage`)를 확인한 뒤 렌더 |
| 로그인 실패(401)인데 "세션 만료"로 이동 | 응답 인터셉터가 로그인 요청의 401까지 처리 | 로그인 요청은 제외하거나 로그인 화면에서는 리다이렉트하지 않음 |
| 401 후 무한 리다이렉트 | `/login`에서도 요청이 401 → 다시 `/login` | `pathname` 비교 후 이동 |
| 인터셉터에서 `Invalid hook call` | 컴포넌트 밖에서 `useAuthStore()` 호출 | `useAuthStore.getState()` |
| 모든 요청이 401 | 헤더 이름·접두어 오타 (`Bearer ` 뒤 공백) | `Authorization: Bearer <token>` 확인 |
| 로그인 후에도 CORS 오류 | `Authorization` 헤더가 `allowedHeaders`에 없음 | 백엔드 CORS 설정에 추가 (study6) |
| 비밀번호가 콘솔·로그에 출력됨 | 디버깅용 `console.log(form)` | 비밀번호는 절대 로그/저장하지 않음 |

---

## ☐ 체크리스트

- [ ] 인증과 인가의 차이를 예와 함께 설명할 수 있다
- [ ] `ProtectedRoute` + `state.from` 리다이렉트 흐름을 설명할 수 있다
- [ ] 현재 저장소 로그인이 "서버 없는 가짜 로그인"임을 알고, 실제 호출로 바꾸는 위치(`LoginPage` 43줄)를 안다
- [ ] 토큰 저장 위치 3가지의 장단점(특히 `localStorage`의 XSS 위험)을 설명할 수 있다
- [x] 로그인 실패 메시지가 이메일/비밀번호 중 무엇이 틀렸는지 알려주지 않게 처리했다
- [ ] 프론트의 권한 UI는 UX일 뿐 서버 검사가 진짜라는 점을 안다
- [x] **(노션) 로그인 실제 연결, Zustand `persist`로 새로고침 유지**
- [x] **(노션) 401/403 처리를 axios 인터셉터 한 곳에**

---

## ➡️ 다음 단계 연결

로그인·API·인터셉터가 늘어나면 파일이 흩어집니다. [study8](./study8.md)에서 **폴더 구조, 공통 모듈, 환경 변수 분리**로 정리합니다.
