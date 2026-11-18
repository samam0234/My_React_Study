# study12 — 성능 최적화

> 🎯 **목표**: **측정 먼저, 최적화는 그 다음.** 번들 크기·리렌더·네트워크를 측정하고, 코드 분할·메모이제이션·쿼리 설정으로 개선한 뒤 전/후를 비교한다.

- 이전: [study11.md](./study11.md) — 상태·데이터 흐름 심화
- 다음: [study13.md](./study13.md) — 생태계 라이브러리
- 측정 대상: [`TSX_study/project`](./TSX_study/project)

> ✅ **실제 측정**: 번들 크기는 `TSX_study/project`(midpoint)와 `TSX_study/final`을 **직접 빌드해서** 기록했습니다(아래 표). **Lighthouse, React Profiler 리렌더 수, 요청 수는 측정하지 않았습니다** — 그 칸과 체크박스는 비워 두었습니다. 코드 분할·`memo`/`useCallback`은 적용했지만 `memo`의 효과는 측정하지 않았으므로 "효과 있음"이라고 주장하지 않습니다.

---

## 📖 이론

### 12.1 성능은 3곳에서 나온다

| 영역 | 무엇이 느려지나 | 측정 도구 |
|---|---|---|
| **번들/로딩** | JS 용량이 커서 첫 화면이 늦음 | `vite build` 출력, Network 탭, Lighthouse |
| **렌더링** | 불필요한 리렌더로 입력·스크롤이 버벅임 | React DevTools Profiler |
| **데이터/쿼리** | 같은 요청 반복, 직렬 요청, 큰 응답 | Network 탭, Query Devtools |

### 12.2 최적화 원칙

1. **측정 → 병목 확인 → 수정 → 다시 측정.** 느껴지는 대로 `useMemo`를 뿌리면 오히려 코드만 복잡해집니다.
2. 가장 효과가 큰 순서: ① 안 해도 되는 일을 안 한다(요청·렌더) ② 상태를 필요한 곳 가까이에 둔다 ③ 그래도 느리면 메모이제이션 ④ 큰 목록은 가상화
3. React 19 + React Compiler를 쓰면 메모이제이션을 자동화할 수 있습니다. 이 저장소의 [`TSX_study/project/README.md`](./TSX_study/project/README.md)에도 "React Compiler는 기본 비활성"이라 적혀 있습니다. 먼저 수동 방식의 원리를 이해한 뒤 도입 여부를 판단하세요.

### 12.3 리렌더가 일어나는 때

- 컴포넌트의 **state가 바뀜**
- **부모가 리렌더** (props가 같아도 자식 함수는 다시 호출됨)
- 구독하는 **Context 값 / 스토어 선택자 결과**가 바뀜

`React.memo`는 "props가 같으면 건너뛴다"입니다. 그런데 객체·함수 prop은 렌더마다 **새 참조**라서, `useMemo`/`useCallback`으로 참조를 안정시켜야 효과가 납니다.

---

## 🛠️ 실기

### 1. 기준선 측정 (최적화 전)

```bash
cd TSX_study/project
npm run build
```

터미널에 나오는 `dist/assets/*.js`, `*.css` 크기(원본/gzip)를 아래에 기록합니다.

| 지표 | 최적화 전 | 최적화 후 | 측정 방법 |
|---|---|---|---|
| JS 번들 크기 (gzip) | ____ kB | ____ kB | `vite build` 출력 |
| 초기 로드 JS 요청 수 | ____ | ____ | Network → JS 필터 |
| LCP (Lighthouse) | ____ s | ____ s | Chrome Lighthouse (`npm run preview` 주소에서) |
| 목록 입력 시 리렌더 수 | ____ | ____ | React DevTools Profiler |
| 목록 요청 수 (1→2→1 페이지 이동) | ____ | ____ | Network → Fetch/XHR |

> Lighthouse는 **dev 서버가 아니라** `npm run build && npm run preview` 결과로 측정해야 의미가 있습니다. dev 서버는 최적화되지 않은 코드를 서빙합니다.

### 2. 번들 분석

```bash
npx vite-bundle-visualizer     # 또는 rollup-plugin-visualizer 플러그인
```

> Vite 8은 번들러가 바뀐 버전입니다. 시각화 플러그인의 호환 여부는 사용하는 버전에서 확인하세요. 호환되지 않아도 `vite build`의 파일 크기 출력만으로 기준선 측정은 가능합니다.

볼 것: 큰 의존성이 무엇인가 → 정말 필요한가 → 일부만 import할 수 있는가 → 라우트별로 나눌 수 있는가.

### 3. 코드 분할 — 라우트 단위 `React.lazy`

현재 [`App.tsx:3-8`](./TSX_study/project/src/App.tsx)는 모든 페이지를 **정적 import**해서 첫 화면에 4개 페이지 코드가 모두 들어갑니다. 라우트별로 분리합니다 (설명용 예제).

```tsx
import { lazy, Suspense } from 'react'

const PostDetailPage = lazy(() => import('./pages/PostDetailPage.tsx'))
const MyPage = lazy(() => import('./pages/MyPage.tsx'))

<main>
  <Suspense fallback={<p>불러오는 중...</p>}>
    <Routes>
      <Route path="/" element={<PostListPage />} />          {/* 첫 화면은 정적 import 유지 */}
      <Route path="/posts/:id" element={<PostDetailPage />} />
      ...
    </Routes>
  </Suspense>
</main>
```

| 포인트 | 설명 |
|---|---|
| `lazy(() => import(...))` | 해당 라우트에 **처음 들어갈 때** 청크를 다운로드. 기본 export(`export default`)여야 함 (이 저장소의 페이지는 모두 default export) |
| `Suspense` | 청크 로딩 중 보여줄 화면 |
| 측정 | `build` 출력에 **청크 파일이 여러 개**로 나뉘고, 메인 JS 크기가 줄어드는지 비교 |
| 주의 | 너무 잘게 쪼개면 요청 수만 늘어남. 첫 화면·자주 가는 화면은 분리하지 않음 |

### 4. 리렌더 측정 — React DevTools Profiler

1. DevTools → Profiler → ⏺ 기록 시작 → 목록의 **검색 입력창에 글자 입력** → 정지
2. [`PostListPage.tsx`](./TSX_study/project/src/pages/PostListPage.tsx)에서 `keyword`가 바뀔 때마다 `PostCard` 10개가 전부 다시 렌더링되는지 확인 (회색=건너뜀, 색=렌더됨)
3. 원인: 부모의 state(`keyword`)가 바뀌면 자식 `PostCard`도 다시 호출됨. 게다가 `handleToggleFavorite`가 **매 렌더마다 새 함수**라 `memo`만으로는 부족

개선 (설명용 예제):

```tsx
// PostCard.tsx
export default memo(PostCard)

// PostListPage.tsx — 참조 안정화
const handleToggleFavorite = useCallback((postId: number) => {
  if (!useAuthStore.getState().user) { alert('즐겨찾기는 로그인 후 이용할 수 있습니다.'); return }
  toggleFavorite(postId)
}, [toggleFavorite])

const filteredPosts = useMemo(
  () => posts.filter((p) => p.title.includes(keyword.trim())).filter((p) => !showOnlyFavorites || favoritePostIds.includes(p.id)),
  [posts, keyword, showOnlyFavorites, favoritePostIds],
)
```

> 현재 `PostListPage`는 조기 `return` 뒤에 계산이 있어(`if (loading) return …`) **훅을 그 아래에 두면 Hook 규칙 위반**입니다. 훅은 모든 조기 `return`보다 위로 올려야 합니다. 이 함정은 study9 오류 노트와 같은 원리입니다.

**주의**: 10개짜리 목록에서는 효과가 거의 없을 수 있습니다. **Profiler에서 실제로 시간이 줄어든 것을 확인한 뒤에만** 유지하세요.

### 5. 상태 위치와 구독 범위 줄이기

- 검색 입력(`keyword`)이 목록 전체를 다시 그린다면 → 입력창을 **별도 컴포넌트**로 빼고 디바운스된 값만 부모에 올림 (study3의 디바운스)
- Zustand는 **선택자로 필요한 값만** 구독: `useAuthStore((s) => s.user)`처럼. 스토어 전체를 구독하면(`useAuthStore()`) 어떤 값이 바뀌어도 리렌더됩니다. [`AuthStatus.jsx`](./JSX_study/demo/src/components/AuthStatus.jsx)의 `renderCount`가 이를 눈으로 확인하는 장치입니다.
- Context의 `value={{ user, login, logout }}`는 매 렌더마다 새 객체 → `useMemo`로 감싸거나 Zustand로 이동 ([`AuthContext.jsx:16`](./JSX_study/project/src/context/AuthContext.jsx))

### 6. 쿼리 최적화 (study11과 연결)

| 방법 | 효과 |
|---|---|
| `staleTime` 설정 | 같은 데이터 재요청 감소 |
| `Promise.all` / 병렬 쿼리 | 직렬 대기 제거 ([`posts.ts:18`](./TSX_study/project/src/api/posts.ts)) |
| 서버 페이지네이션(`page`, `limit`) | 큰 응답 방지 (이미 사용 중) |
| 검색 디바운스 | 입력마다 요청하지 않기 |
| 다음 페이지 미리 가져오기 `prefetchQuery` | 이동 체감 속도 |
| 서버 필터 `q` | 전체를 받아 클라이언트에서 거르는 대신 서버에서 |

```tsx
// 다음 페이지 prefetch (설명용)
useEffect(() => {
  queryClient.prefetchQuery({ queryKey: ['posts', { page: page + 1, limit: LIMIT }], queryFn: () => fetchPosts({ page: page + 1, limit: LIMIT }) })
}, [page, queryClient])
```

### 7. 큰 목록 — 가상화 (개념)

수백~수천 개 항목을 모두 DOM에 그리면 느립니다. `@tanstack/react-virtual` 같은 라이브러리로 **화면에 보이는 항목만** 렌더링합니다. 이 프로젝트처럼 10개씩 페이지네이션하면 필요 없고, "무한 스크롤"로 바꿀 때 검토합니다.

### 8. 이미지·정적 자원

- `public/`·`assets/`의 이미지는 용량 확인 (`JSX_study/demo/src/assets/hero.png` 등)
- `loading="lazy"`, 적절한 크기·포맷(WebP/AVIF)
- JS/CSS는 해시 파일명이라 **길게 캐시** 가능 (study17 Nginx `immutable`)

---

## ✅ 실제 측정 결과 (`npm run build` 출력, gzip)

| 지표 | midpoint (`TSX_study/project`) | final (`TSX_study/final`) | 비고 |
|---|---|---|---|
| 메인 JS | 317.69 kB (103.44) | **402.18 kB (125.69)** | final은 TanStack Query·zod·react-error-boundary·axios 등이 늘어남 |
| 공용 청크(`jsx-runtime`) | — (메인에 포함) | 47.77 kB (17.02) | Vite가 분리한 공유 모듈 |
| **초기 로드 JS 합계** | 317.69 kB (103.44) | **449.95 kB (142.71)** | 첫 화면(목록)에 필요한 JS |
| 라우트별 lazy 청크 | 없음 | PostDetail 6.04 (2.47) · MyPage 4.70 (2.14) · PostForm 2.99 (1.44) · Login 1.90 (1.10) · Signup 1.81 (1.03) · NotFound 0.36 (0.29) · validators 1.59 (0.85) · permissions 1.39 (0.87) | 합계 약 **10.2 kB(gzip)** 이 초기 로드에서 빠짐 |
| CSS | 3.12 kB (1.18) | 17.19 kB (4.12) | Tailwind 유틸리티 |

**해석**: 기능(서버 상태 캐시·검증·에러 경계·UI·AI)을 더한 대가로 초기 JS는 약 **+132 kB(gzip +39 kB)** 늘었습니다. 라우트 분할로 **약 10 kB(gzip)** 만 초기 로드에서 뺐을 뿐이라, 이 규모에서는 분할의 효과가 작습니다. 더 줄이려면 번들 분석으로 큰 의존성을 확인해야 합니다(아직 하지 않음). Redux Toolkit 비교 구현은 앱에서 import하지 않아 번들에 들어가지 않습니다.

### 적용했지만 측정하지 않은 것

| 적용 | 위치 | 상태 |
|---|---|---|
| 라우트 `lazy` + `Suspense` | [`App.tsx`](./TSX_study/final/src/App.tsx) | 청크가 나뉘는 것은 빌드 출력으로 확인 |
| `React.memo(PostCard)` + `useCallback` 핸들러(참조 고정) | [`PostCard.tsx`](./TSX_study/final/src/components/PostCard.tsx), [`PostListPage.tsx`](./TSX_study/final/src/pages/PostListPage.tsx) | **Profiler로 효과를 확인하지 않음** — 10개짜리 목록에서는 차이가 없을 수 있음 |
| `staleTime: 30s`, `keepPreviousData`, 검색 디바운스 300ms | [`main.tsx`](./TSX_study/final/src/main.tsx), `useDebounce` | 요청 수 비교는 안 함 |
| 검색어·페이지를 URL에 두어 상태 복제 제거 | PostListPage | — |
| 서버: 목록의 댓글 수를 글마다 쿼리하지 않고 한 번에 집계 (N+1 회피), `@EntityGraph`로 작성자 함께 조회, 부분 인덱스 | `PostService`, `PostRepository`, `V1__init.sql` | **쿼리 로그·`EXPLAIN`으로 확인하지 않음** |

### 측정하지 않은 것 (표의 빈칸)

| 지표 | 상태 |
|---|---|
| LCP (Lighthouse) | **미측정** |
| 검색 입력 시 리렌더 수 (Profiler) | **미측정** |
| 1→2→1 페이지 이동 시 요청 수 | **미측정** |
| 번들 시각화(어떤 의존성이 큰가) | **미측정** — Vite 8 호환 여부 미확인 |
| 서버 쿼리 실행 계획(`EXPLAIN ANALYZE`) | **미측정** |

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| `memo`를 썼는데 여전히 리렌더 | 객체·함수 prop이 매번 새 참조 | `useCallback`/`useMemo`, 또는 prop 구조 단순화 |
| `Rendered fewer hooks than expected` | `useMemo`를 조기 `return` 아래에 둠 | 훅은 최상단 |
| `lazy`에서 `Element type is invalid` | 모듈이 default export가 아님 | `export default` 또는 `.then(m => ({ default: m.X }))` |
| 첫 로딩에서 하얀 화면 | `Suspense` 없음 | `Suspense`로 감싸기 |
| 최적화 후 오히려 느려짐 | 가벼운 컴포넌트에 `memo`/`useMemo` 남발 | Profiler로 확인 후 제거 |
| Lighthouse 점수가 dev에서 낮음 | dev 서버는 비최적화 | `build` + `preview`로 측정 |
| 개발 모드에서 렌더/요청이 두 번 | StrictMode | 정상 (프로덕션 빌드에서는 한 번) |

---

## ☐ 체크리스트

- [x] 최적화 **전** 기준값(번들 크기·요청 수·리렌더 수)을 기록했다 — **번들 크기만** 기록 (요청 수·리렌더 수는 미측정)
- [ ] 번들에서 가장 큰 의존성을 확인했다
- [x] 라우트 단위 `lazy` + `Suspense`를 적용하고 청크가 나뉘는 것을 확인했다
- [ ] Profiler로 불필요한 리렌더를 찾아 `memo`/`useCallback`/`useMemo`로 줄였고, **개선을 수치로 확인**했다
- [ ] 훅은 조기 `return` 위에 두어야 하는 이유를 설명할 수 있다
- [ ] Zustand 선택자와 Context 리렌더 범위의 차이를 설명할 수 있다
- [ ] `staleTime`·prefetch·병렬 요청으로 요청 수를 줄이고 전/후를 비교했다
- [ ] 위 표의 "최적화 후" 칸을 모두 채웠다

---

## ➡️ 다음 단계 연결

성능을 확인했으니 [study13](./study13.md)에서 **UI 라이브러리(MUI·Tailwind·shadcn/ui)** 를 붙여 화면을 빠르게 정돈합니다. (UI 라이브러리가 번들 크기에 주는 영향도 이 문서의 측정법으로 확인해 보세요.)
