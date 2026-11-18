# study11 — 상태·데이터 흐름 심화

> 🎯 **목표**: 직접 만든 `useFetch`를 TanStack Query로 교체하고, Redux Toolkit으로 전역 상태를 다시 만들어 **서버 상태와 클라이언트 상태를 구분**한다.

- 이전: [studyMidpoint.md](./studyMidpoint.md)
- 다음: [study12.md](./study12.md) — 성능 최적화
- 교체 대상: [`hooks/useFetch.ts`](./TSX_study/project/src/hooks/useFetch.ts) (40줄), [`store/authStore.ts`](./TSX_study/project/src/store/authStore.ts)

> ✅ **실제 코드와 검증**: TanStack Query는 [`TSX_study/final`](./TSX_study/final)에 구현·테스트·E2E로 확인했고, **Redux Toolkit도 같은 로그인 상태를 slice로 다시 만들어 테스트**했습니다(앱에는 연결하지 않은 비교 구현). 라이브러리 버전: `@tanstack/react-query` 5.x, `@reduxjs/toolkit` 2.x + `react-redux` 9.x, Zustand 5.0.

---

## 📖 이론

### 11.1 상태는 두 종류

| 종류 | 예 | 특징 | 도구 |
|---|---|---|---|
| **서버 상태** | 게시글 목록, 댓글, 내 프로필 | 원본이 서버에 있음. 오래될 수 있음(stale). 캐시·재요청·동기화가 필요 | **TanStack Query** |
| **클라이언트 상태** | 로그인 토큰, 모달 열림, 필터 UI, 테마 | 원본이 브라우저 안 | `useState` / Zustand / **Redux Toolkit** |

`useFetch`는 "서버 상태를 `useState`에 복사"해서 쓰는 방식이라 **캐시, 중복 요청 제거, 재시도, 포커스 시 갱신, 쓰기 후 갱신**을 모두 직접 만들어야 합니다.

### 11.2 TanStack Query 핵심 개념

| 개념 | 설명 |
|---|---|
| `queryKey` | 캐시의 **주소**. `['posts', { page, q }]`처럼 요청을 결정하는 값을 모두 넣음 |
| `queryFn` | 데이터를 가져오는 함수 (기존 `fetchPosts` 재사용) |
| `staleTime` | 이 시간 동안은 "신선" → 재요청 안 함 |
| `gcTime` | 사용하는 곳이 없어진 캐시를 메모리에 남기는 시간 |
| `useMutation` | 쓰기(POST/PATCH/DELETE) |
| `invalidateQueries` | 캐시를 "오래됨"으로 표시 → 활성 쿼리는 즉시 재요청 |
| `placeholderData: keepPreviousData` | 페이지 이동 중 **이전 페이지 데이터를 유지**해 화면이 깜빡이지 않게 |

### 11.3 Redux Toolkit 핵심

| 개념 | 설명 |
|---|---|
| `configureStore` | 스토어 생성 |
| `createSlice` | `name` + `initialState` + `reducers` → 액션 생성자와 리듀서를 한 번에 |
| `useSelector` / `useDispatch` | 값 읽기 / 액션 보내기 |
| Immer 내장 | 리듀서 안에서 `state.user = …`처럼 "직접 변경"처럼 쓰지만 내부적으로 불변 업데이트 |

### 11.4 Zustand vs Redux Toolkit

| | Zustand | Redux Toolkit |
|---|---|---|
| 보일러플레이트 | 적음 (훅 하나) | 중간 (slice, store, Provider, 타입 훅) |
| 규칙 강제 | 느슨 | 강함 (액션·리듀서·미들웨어 구조) |
| Provider | 불필요 | 필요 |
| 강점 | 간단·빠른 시작 | 대규모 코드베이스 표준, 도구(Redux DevTools) 생태계 |

**기준**: 서버에서 받은 데이터는 **스토어에 복사하지 않고** Query에 맡깁니다. 스토어에는 로그인 세션·UI 상태처럼 **서버가 모르는 상태**만 둡니다.

---

## 🛠️ 실기

### 1. 설치와 Provider

```bash
npm i @tanstack/react-query
npm i -D @tanstack/react-query-devtools     # 선택: 캐시 상태 보기
```

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },   // 30초 신선, 실패 시 1회 재시도
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

### 2. `useFetch` → `useQuery` 교체 (노션 예제: 전·후 줄 수 비교)

**Before** — [`PostListPage.tsx:21-24`](./TSX_study/project/src/pages/PostListPage.tsx), 그리고 `useFetch.ts` 40줄

```tsx
const { data: posts, loading, error } = useFetch<Post[]>(
  () => fetchPosts({ page, limit: LIMIT }),
  [page],
)
```

**After**

```tsx
import { useQuery, keepPreviousData } from '@tanstack/react-query'

const { data: posts, isPending, isError, error, isPlaceholderData } = useQuery({
  queryKey: ['posts', { page, limit: LIMIT }],     // 쿼리 키 설계
  queryFn: () => fetchPosts({ page, limit: LIMIT }),
  placeholderData: keepPreviousData,               // 페이지 이동 시 이전 데이터 유지
})

if (isPending) return <p>불러오는 중...</p>
if (isError) return <p className="error-text">게시글을 불러오지 못했습니다: {error.message}</p>
if (posts.length === 0) return <p>게시글이 없습니다.</p>
```

| 줄 | 설명 |
|---|---|
| `queryKey` | `page`가 키에 있으므로 페이지마다 **별도 캐시**. 이전 페이지로 돌아가면 즉시 표시 |
| `isPending` | 데이터가 아직 없음(첫 로딩). 기존 `loading`에 해당 |
| `isError` / `error` | 기존 `error`. 실패 시 자동 재시도(`retry`) 후 에러 |
| `placeholderData` | 다음 페이지를 불러오는 동안 **직전 데이터를 보여줌** → 목록이 사라졌다 나타나는 깜빡임 제거. `isPlaceholderData`로 "지금은 이전 데이터" 표시 가능 |
| `ignore` 플래그 | 필요 없음 — 라이브러리가 경쟁 상태를 처리 |

**줄 수 비교** — 직접 세어 보세요 (예상 방향: 훅 파일 40줄이 사라지고 호출 4~6줄이 남음):

| 항목 | Before (`useFetch`) | After (`useQuery`) |
|---|---|---|
| 훅 구현 파일 | 40줄 ([`useFetch.ts`](./TSX_study/project/src/hooks/useFetch.ts)) | 0줄 (라이브러리) |
| 화면의 호출 | 4줄 | _____줄 |
| 직접 구현한 기능 | 로딩/에러/데이터, ignore | + 캐시, 재시도, 중복 제거, 포커스 갱신 |
| 추가된 의존성 | 0 | `@tanstack/react-query` |

### 3. 상세(두 요청 병렬) — 쿼리 키와 `enabled`

```tsx
const { data, isPending, isError, error } = useQuery({
  queryKey: ['post', id],
  queryFn: () => fetchPostDetail(id!),   // 기존 Promise.all 함수 그대로
  enabled: !!id,                          // id가 있을 때만 실행
})
```

쿼리 키 설계 원칙: **목록은 `['posts', 필터…]`, 단건은 `['post', id]`**. 이렇게 나누면 무효화 범위를 정확히 줄 수 있습니다.

### 4. 쓰기 후 목록 갱신 — `useMutation` + `invalidateQueries`

study6 §5의 `createPost` / `deletePost`를 사용합니다.

```tsx
const queryClient = useQueryClient()

const remove = useMutation({
  mutationFn: (id: number) => deletePost(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] })   // 'posts'로 시작하는 모든 캐시 무효화
  },
})

<button disabled={remove.isPending} onClick={() => remove.mutate(post.id)}>
  {remove.isPending ? '삭제 중...' : '삭제'}
</button>
{remove.isError && <p className="error-text">삭제 실패: {remove.error.message}</p>}
```

| 포인트 | 설명 |
|---|---|
| `invalidateQueries(['posts'])` | 접두 일치. `['posts', {page:1}]`, `['posts', {page:2}]` 모두 오래됨으로 표시, 화면에 보이는 것은 즉시 재요청 |
| `isPending` | 쓰기 진행 중 → 버튼 비활성화(중복 클릭 방지) |
| 낙관적 업데이트(심화) | `onMutate`에서 캐시를 먼저 수정하고 실패하면 `onError`에서 되돌림 — 체감 속도는 빠르나 코드가 늘어남 |

### 5. 캐시와 stale 시간 관찰하기

1. `@tanstack/react-query-devtools`의 `<ReactQueryDevtools />`를 `QueryClientProvider` 안에 추가
2. 목록 1페이지 → 2페이지 → 다시 1페이지: Network 탭에 **요청이 다시 나가는가?** (`staleTime: 30_000`이면 30초 안에는 나가지 않음)
3. `staleTime: 0`으로 바꾸고 같은 동작 → 이동할 때마다 백그라운드 재요청
4. 브라우저 탭을 다른 곳에 갔다가 돌아오기 → 포커스 시 자동 재요청(`refetchOnWindowFocus`) 관찰

### 6. Redux Toolkit — 로그인 상태를 slice로 다시 만들기

```bash
npm i @reduxjs/toolkit react-redux
```

```ts
// store/authSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '../types'

interface AuthState { user: User | null }
const initialState: AuthState = { user: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<User>) { state.user = action.payload },   // Immer: 직접 변경처럼 작성
    logout(state) { state.user = null },
  },
})
export const { login, logout } = authSlice.actions
export default authSlice.reducer
```

```ts
// store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import auth from './authSlice'

export const store = configureStore({ reducer: { auth } })
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

```tsx
// main.tsx — <Provider store={store}>로 감싸기
// 사용 — AppHeader.tsx (Zustand 버전과 비교)
const user = useAppSelector((s) => s.auth.user)           // 기존: useAuthStore((s) => s.user)
const dispatch = useAppDispatch()
<button onClick={() => dispatch(logout())}>로그아웃</button>   // 기존: logout()
```

| 비교 | Zustand ([`authStore.ts`](./TSX_study/project/src/store/authStore.ts)) | Redux Toolkit |
|---|---|---|
| 파일 | 1개 15줄 | `authSlice.ts` + `store/index.ts` + Provider |
| 액션 | `login(user)` 직접 호출 | `dispatch(login(user))` |
| 컴포넌트 밖 접근 | `useAuthStore.getState()` | `store.getState()` / `store.dispatch()` |
| 규칙 | 자유 | 액션/리듀서 구조 강제 |

타 프레임워크 대응(Pinia, RxJS 서비스 등)과의 비교는 이 문서 범위가 아니므로 생략합니다.

### 7. 서버 상태와 전역 상태를 섞지 않는 기준 (정리)

- [ ] 서버가 원본인가? → **Query** (스토어에 복사 금지)
- [ ] 새로고침 후에도 유지? 서버가 모르는 값? → Zustand/Redux (+`persist`)
- [ ] 한 컴포넌트에서만 쓰나? → `useState`
- [ ] 즐겨찾기(`favoritesStore`)는? → 서버에 저장하지 않으면 클라이언트 상태(Zustand/Redux), 서버에 저장하면 **Query + Mutation**

### 8. 비동기 처리 점검 — 취소와 경쟁 상태

- Query는 쿼리 키가 바뀌면 이전 요청의 결과를 현재 화면에 반영하지 않습니다.
- 직접 `fetch`를 쓸 때는 `AbortController`로 이전 요청을 취소합니다.

```ts
useEffect(() => {
  const controller = new AbortController()
  fetch(url, { signal: controller.signal }).then(/* … */).catch((e) => { if (e.name !== 'AbortError') throw e })
  return () => controller.abort()
}, [url])
```

---

## ✅ 실제 구현 결과 (`TSX_study/final`)

### TanStack Query

| 항목 | 위치 |
|---|---|
| `QueryClientProvider` + 기본 옵션 (`staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false`) | [`main.tsx`](./TSX_study/final/src/main.tsx) |
| 쿼리 키 설계: 목록 `['posts','list',{page,limit,q}]`, 단건 `['posts','detail',id]`, 댓글 `['posts','comments',id]` — 모두 `'posts'`로 시작 | [`queries/posts.ts`](./TSX_study/final/src/queries/posts.ts) |
| 목록: `useQuery` + `placeholderData: keepPreviousData` (페이지 이동 중 이전 목록 유지·흐리게) | `usePosts`, [`PostListPage.tsx`](./TSX_study/final/src/pages/PostListPage.tsx) |
| 로딩·에러(+`refetch`)·빈 상태를 쿼리 결과(`isPending`, `isError`)로 표시 | PostListPage, PostDetailPage |
| `useMutation` 작성·수정·삭제·댓글 + `invalidateQueries({ queryKey: ['posts'] })` | `useCreatePost` 등 |
| 404는 재시도하지 않음(`retry` 함수) | `usePost` |
| `useQueries`로 즐겨찾기 글 제목을 id별로 조회 | [`MyPage.tsx`](./TSX_study/final/src/pages/MyPage.tsx) |
| 클라이언트 상태는 Zustand (`authStore`, `favoritesStore`, `toastStore`, `themeStore`) — **서버 데이터는 스토어에 복사하지 않음** | `store/` |

**검증**: pages.test(목록·페이지 이동·검색·오류 후 재시도·삭제/댓글 뒤 목록 갱신), E2E(글쓰기→목록 반영→수정→삭제). 테스트마다 새 `QueryClient`(`retry: false`)로 캐시를 격리했습니다.

### Redux Toolkit (비교 구현, 앱에는 미연결)

| 항목 | 위치 |
|---|---|
| `createSlice` — `setSession`, `logout` (Immer: 직접 변경처럼 쓰는 불변 업데이트) | [`store/redux/authSlice.ts`](./TSX_study/final/src/store/redux/authSlice.ts) |
| `configureStore`, `RootState`/`AppDispatch`, 타입 붙은 `useAppSelector`/`useAppDispatch` (`withTypes`) | [`store/redux/store.ts`](./TSX_study/final/src/store/redux/store.ts) |
| 테스트: 순수 리듀서 + `<Provider>` 아래 컴포넌트가 `dispatch`로 상태 변경 | [`redux.test.tsx`](./TSX_study/final/src/store/redux/redux.test.tsx) (2개) |

### 줄 수 비교 (직접 센 값)

| 항목 | Before | After |
|---|---|---|
| 서버 데이터 조회 훅 | [`hooks/useFetch.ts`](./TSX_study/final/src/hooks/useFetch.ts) **41줄** (로딩·에러·데이터·`ignore`) | 0줄 (라이브러리) + 목록 호출 `usePosts` 8줄 |
| 같은 파일에 담긴 기능 | 조회만 | 조회 + 작성·수정·삭제·댓글 mutation + 캐시 무효화 (`queries/posts.ts` 전체 **79줄**) |
| 새로 얻은 것 | — | 캐시, 같은 키 요청 중복 제거, 재시도, 이전 데이터 유지, 쓰기 후 자동 갱신 |
| 로그인 전역 상태 | Zustand [`authStore.ts`](./TSX_study/final/src/store/authStore.ts) **28줄** (persist 포함, Provider 없음) | Redux Toolkit `authSlice.ts` 32줄 + `store.ts` 13줄 = **45줄** (persist 미포함, `<Provider>` 필요) |

> "조회 훅" 41줄은 사라지지만 쓰기·캐시 무효화까지 포함한 파일은 더 큽니다. **줄 수가 아니라 직접 구현해야 하는 정확성 문제(경쟁 상태·캐시·재시도)가 줄어든다**는 점이 차이입니다.

### Zustand vs Redux Toolkit — 이번 구현에서 본 차이

| | Zustand | Redux Toolkit |
|---|---|---|
| 상태 읽기·변경 | `useAuthStore((s) => s.user)`, `logout()` 직접 호출 | `useAppSelector`, `dispatch(logout())` |
| 보일러플레이트 | 스토어 파일 하나 | slice + store + 타입 훅 + `<Provider>` |
| 규칙 강제 | 자유 | 액션·리듀서 구조 강제, 순수 리듀서라 테스트 쉬움 |
| 컴포넌트 밖 접근 | `useAuthStore.getState()` (인터셉터에서 사용) | `store.getState()`/`store.dispatch()` (스토어 인스턴스가 필요) |
| persist | `persist` 미들웨어 한 줄 | 별도 라이브러리(redux-persist) — **이번에 만들지 않음** |
| 이 프로젝트의 선택 | ✅ 사용 중 | 비교용 |

### 아직 하지 않은 것

- 낙관적 업데이트(`onMutate`/`onError` 롤백)
- 캐시/stale 동작의 정량 측정 (Network 탭 요청 수 비교는 하지 않음)
- Redux에 persist 적용, 앱 전체를 Redux로 전환

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| `No QueryClient set, use QueryClientProvider` | Provider 밖에서 `useQuery` | `main.tsx`에서 감싸기 |
| 페이지를 바꿔도 같은 데이터 | `queryKey`에 `page`가 없음 | 요청을 결정하는 값은 **모두** 키에 포함 |
| 쓰기 후 목록이 안 바뀜 | `invalidateQueries` 누락 / 키 불일치 | 같은 접두(`['posts']`)로 무효화 |
| 화면이 계속 재요청함 | `staleTime: 0`(기본값) + 포커스 갱신 | 서비스 특성에 맞게 `staleTime` 설정 |
| v4 코드 복붙 시 `isLoading`이 의도와 다름 / `keepPreviousData: true` 옵션 오류 | v5에서 `isPending`, `placeholderData: keepPreviousData`로 변경 | 설치한 메이저 버전 문서 확인 |
| `useDispatch`/`useSelector` 타입이 `unknown` | 타입 훅 미사용 | `useAppDispatch`, `useAppSelector` 사용 |
| `could not find react-redux context value` | `<Provider>` 누락 | `main.tsx`에서 감싸기 |
| 상태 객체에 함수·Promise 저장 경고 (직렬화) | Redux는 직렬화 가능한 값 권장 | 함수는 상태에 넣지 않기 |

---

## ☐ 체크리스트

- [ ] 서버 상태와 클라이언트 상태의 차이를 예와 함께 설명할 수 있다
- [x] `useFetch`로 직접 구현하던 것 중 TanStack Query가 대신해 주는 것을 4가지 이상 말할 수 있다
- [x] 진행 전·후 코드 줄 수를 비교해 표에 기록했다
- [x] **(노션) TanStack Query: `useQuery`로 게시판 목록 조회, 쿼리 키 설계(`['posts', {page, q}]`)**
- [x] **(노션) 로딩·에러·빈 상태를 쿼리 결과로 표시**
- [x] **(노션) `useMutation`으로 글 작성·삭제 후 목록 쿼리 무효화(invalidate)**
- [x] **(노션) 캐시와 stale 시간, 페이지네이션에서 이전 데이터 유지** — `staleTime` 설정과 `keepPreviousData`는 적용·테스트함 (요청 수 정량 비교는 안 함)
- [x] **(노션) Redux Toolkit: `configureStore`, `createSlice`, `useSelector`/`useDispatch`**
- [x] **(노션) 로그인 상태를 Zustand 대신 Redux slice로 다시 만들기** — 비교 구현(앱 미연결)
- [x] **(노션) 서버 상태와 전역 상태를 섞지 않는 기준 정리** (§7)
- [x] Zustand와 Redux Toolkit의 보일러플레이트·규칙 강제 정도를 비교해 기록했다

---

## ➡️ 다음 단계 연결

데이터를 효율적으로 가져오게 되었으니 [study12](./study12.md)에서 **렌더링·쿼리·번들 크기를 실제로 측정**하며 최적화합니다.
