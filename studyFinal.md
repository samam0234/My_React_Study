# studyFinal — 종합 실습: 미니 게시판 웹사이트 (React + TypeScript)

study0부터 study10까지 하나씩 익혔던 개념을 전부 합쳐서, `demo/`가 아닌 **새 프로젝트** [`project/`](./project)에 작지만 실제로 동작하는 웹사이트를 만들었습니다. [Vue.js 학습의 studyFinal](../vue.js/studyFinal.md)에서 만든 미니 게시판과 같은 소재(JSONPlaceholder)를 React + TypeScript로 재구현했습니다 (Notion 학습 목표의 예제 1번).

```
- [x] Vite + React + TS 프로젝트 생성                 (처음부터 TS로 시작 — study1/study10)
- [x] 함수 컴포넌트, props, children                  (study1, study4)
- [x] useState / useEffect / useRef                   (study2, study3)
- [x] 리스트 렌더링과 key                              (study2)
- [x] React Router 라우팅 (목록 → 상세)                (study5)
- [x] 폼 상태 다루기 + API 연동 (axios)                (study4, study7)
- [x] Zustand로 전역 상태 (로그인 + 즐겨찾기)          (study9)
- [x] TypeScript, 기업형 폴더 구조                     (study10)
- [x] 로그인 후 보호된 라우트                          (study6, study8 — Notion 예제 2)
- [x] 페이지네이션 목록                                (study7 — Notion 예제 3)
```

---

## 1. 왜 `demo/`가 아니라 `project/`를 새로 만들었나

`demo/`는 각 개념을 **하나씩 떼어놓고** 실습하기 위해 한 화면에 실습 컴포넌트를 계속 쌓아온 "연습장"이었습니다. `studyFinal`의 목적은 "이 개념들을 실제 서비스에서 어떻게 **조합**해서 쓰는지" 감을 잡는 것이므로, 처음부터 하나의 완결된 웹사이트 구조로 새로 설계했습니다. 또한 study10에서 배운 대로 **처음부터 TypeScript(`--template react-ts`)로 생성**해서, "JS로 만들고 나중에 전환"이 아니라 "새 프로젝트는 처음부터 TS로 시작"하는 실무에 더 흔한 흐름도 함께 실습했습니다.

```bash
npm create vite@latest project -- --template react-ts
cd project
npm install react-router-dom axios zustand
```

## 2. 사이트 소개: 미니 게시판 (Mini Board)

JSONPlaceholder(study7에서 쓴 그 API)의 게시글/댓글 데이터를 이용한 간단한 게시판입니다.

| 기능 | 대응하는 study |
|---|---|
| 게시글 목록 (검색, 즐겨찾기 필터, 페이지네이션) | study2(리스트/필터), study7(axios/페이지네이션) |
| 게시글 카드 컴포넌트 분리 (콜백 props) | study4 |
| 목록 → 상세 페이지 라우팅 | study5 |
| 로그인 폼 (Controlled Component + 검증) | study4 |
| 로그인 여부 + 즐겨찾기 전역 상태 공유 | study8, study9 |
| 로그인 후 보호된 마이페이지 | study6 |
| 게시글 상세 + 댓글 병렬 요청 | study3(useEffect 응용), study7(Promise.all) |
| 타입 정의 전체 | study10 |

## 3. 프로젝트 구조

```
project/
├─ tsconfig.json / tsconfig.app.json / tsconfig.node.json
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx                      # 라우터 설정
│  ├─ App.css / index.css
│  ├─ types.ts                     # Post, Comment, User 타입
│  ├─ api/
│  │  ├─ client.ts                 # axios 인스턴스
│  │  └─ posts.ts                  # fetchPosts, fetchPostDetail
│  ├─ hooks/
│  │  └─ useFetch.ts               # study7/10에서 만든 훅 재사용
│  ├─ store/
│  │  ├─ authStore.ts              # 로그인 상태 (Zustand)
│  │  └─ favoritesStore.ts         # 즐겨찾기 상태 (Zustand)
│  ├─ components/
│  │  ├─ AppHeader.tsx             # 네비게이션 + 로그인 상태 표시
│  │  ├─ PostCard.tsx              # 게시글 카드 (콜백 props)
│  │  └─ ProtectedRoute.tsx        # 보호된 라우트
│  └─ pages/
│     ├─ PostListPage.tsx          # '/' 목록
│     ├─ PostDetailPage.tsx        # '/posts/:id' 상세
│     ├─ LoginPage.tsx             # '/login'
│     └─ MyPage.tsx                # '/mypage' (보호됨)
```

study0 7장에서 예고했던 `api/` + `components/` + `hooks/` + `pages/` + `store/` 구조가 그대로 적용되었습니다. `demo/`의 `data/`(목업 데이터)는 이번엔 전부 실제 API 응답으로 대체되어서 필요 없어졌습니다.

## 4. 핵심 흐름 하나씩 짚어보기

### 4.1 스토어를 역할별로 분리 — `authStore` / `favoritesStore`

```ts
// store/authStore.ts
interface AuthState {
  user: User | null
  login: (userData: User) => void
  logout: () => void
}
export const useAuthStore = create<AuthState>()((set) => ({ /* ... */ }))
```

```ts
// store/favoritesStore.ts
interface FavoritesState {
  favoritePostIds: number[]
  toggle: (postId: number) => void
  isFavorite: (postId: number) => boolean
}
export const useFavoritesStore = create<FavoritesState>()((set, get) => ({ /* ... */ }))
```

study9에서는 스토어가 하나(`authStore`)뿐이었지만, 실제 앱은 보통 **관심사별로 스토어를 나눕니다.** 로그인 여부와 즐겨찾기 목록은 서로 다른 이유로 바뀌는 상태이므로 분리했습니다. Vue의 Pinia도 스토어를 여러 개(`stores/auth.js`, `stores/favorites.js`)로 나누는 게 일반적이라, Vue study7/studyFinal과 구조적으로 대응됩니다.

### 4.2 목록 페이지 — 검색 + 즐겨찾기 필터 + 페이지네이션 (`PostListPage.tsx`)

```tsx
const { data: posts, loading, error } = useFetch<Post[]>(
  () => fetchPosts({ page, limit: LIMIT }),
  [page],
)

const filteredPosts = posts
  .filter((post) => post.title.includes(keyword.trim()))
  .filter((post) => !showOnlyFavorites || favoritePostIds.includes(post.id))
```

- `useFetch`(study7/10)로 현재 페이지의 게시글을 불러오고, 그 결과를 **클라이언트 사이드에서** 검색어 + 즐겨찾기 조건으로 한 번 더 필터링합니다 (study2에서 배운 배열 필터링 응용).
- 페이지를 넘기면(`page` 변경) `useFetch`의 `deps`가 바뀌어 자동으로 새 페이지를 요청합니다.

### 4.3 게시글 카드 — 콜백 props + 라우팅 결합 (`PostCard.tsx`)

```tsx
function PostCard({ post, isFavorite, onToggleFavorite }: PostCardProps) {
  function handleFavoriteClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()      // Link의 페이지 이동을 막음
    event.stopPropagation()
    onToggleFavorite(post.id)
  }

  return (
    <Link to={`/posts/${post.id}`} className="fruit-card post-card">
      <span className="name">{post.title}</span>
      <button className={isFavorite ? 'active' : ''} onClick={handleFavoriteClick}>
        {isFavorite ? '★' : '☆'}
      </button>
    </Link>
  )
}
```

- 카드 전체가 `<Link>`(study5)라서 클릭하면 상세 페이지로 이동합니다.
- 즐겨찾기 버튼은 `event.preventDefault()`로 `Link`의 페이지 이동까지 막고, `event.stopPropagation()`으로 상위 요소로의 전파도 막은 뒤, `onToggleFavorite`(study4의 콜백 props 패턴)으로 부모에게만 "토글해달라"고 요청합니다.
- 실제 로그인 체크와 상태 변경은 부모(`PostListPage`)가 담당합니다:

```tsx
function handleToggleFavorite(postId: number) {
  if (!user) {
    alert('즐겨찾기는 로그인 후 이용할 수 있습니다.')
    return
  }
  toggleFavorite(postId)
}
```

`user`(study8/9의 Zustand 인증 상태)와 `favoritePostIds`가 **둘 다 전역 상태**이기 때문에, "로그인 안 한 사용자는 즐겨찾기를 못 누른다"는 규칙을 목록 페이지, 상세 페이지 어디서든 동일하게 적용할 수 있습니다.

### 4.4 게시글 상세 — 라우트 파라미터 + 병렬 fetch (`PostDetailPage.tsx`)

```tsx
const { id } = useParams<{ id: string }>()

const { data, loading, error } = useFetch<{ post: Post; comments: Comment[] }>(
  () => fetchPostDetail(id as string),
  [id],
)
```

```ts
// api/posts.ts
export async function fetchPostDetail(id: string) {
  const [postRes, commentsRes] = await Promise.all([
    apiClient.get<Post>(`/posts/${id}`),
    apiClient.get<Comment[]>(`/posts/${id}/comments`),
  ])
  return { post: postRes.data, comments: commentsRes.data }
}
```

- `useParams<{ id: string }>()`(study5)로 URL의 동적 파라미터를 읽고, `useFetch`의 `deps`에 `id`를 넣어서 **다른 글로 이동하면 자동으로 다시 요청**되게 했습니다.
- `Promise.all([...])`(study7의 확장): 게시글 본문과 댓글을 동시에 요청해서 기다리는 시간을 줄였습니다.

### 4.5 로그인 → 헤더로 상태 전파 (`LoginPage.tsx`, `AppHeader.tsx`)

```tsx
// LoginPage.tsx
function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  setSubmitted(true)
  if (!isValid) return

  login({ name: form.email.split('@')[0], email: form.email })
  navigate(from, { replace: true })
}
```

```tsx
// AppHeader.tsx
const user = useAuthStore((state) => state.user)
// ...
{user ? <span>👤 {user.name}님</span> : <Link to="/login">로그인</Link>}
```

- 폼 검증(study4)을 통과하면 `login(...)`을 호출하고, `location.state.from`(study6에서 배운 리다이렉트 목적지 기억)으로 원래 가려던 페이지로 돌아갑니다.
- `AppHeader`는 `LoginPage`와 부모-자식 관계가 전혀 아니지만, 같은 `useAuthStore()`를 구독하므로 로그인 성공 즉시 상태가 반영됩니다 (study8/9).

### 4.6 보호된 마이페이지 (`MyPage.tsx`)

```tsx
function MyPage() {
  const user = useAuthStore((state) => state.user)
  const favoritePostIds = useFavoritesStore((state) => state.favoritePostIds)

  if (!user) return null // study10: User | null 타입이 강제하는 방어 코드

  return (/* 사용자 정보 + 즐겨찾기한 게시글 목록 */)
}
```

`/mypage` 라우트를 `<ProtectedRoute>`(study6/8/9)로 감쌌기 때문에, 로그인하지 않은 사용자는 이 컴포넌트에 도달하기도 전에 `/login`으로 리다이렉트됩니다.

## 5. 실행 방법

```bash
cd project
npm install
npm run build   # tsc -b && vite build — 타입 에러 없이 통과하는지 먼저 확인
npm run dev
```

## 6. 직접 확인해볼 시나리오

1. **목록 페이지**: 검색창에 아무 단어나 입력 → 실시간으로 목록이 좁혀지는지
2. **로그인 없이 즐겨찾기 시도**: 별표 클릭 → "로그인 후 이용할 수 있습니다" 알림이 뜨는지
3. **로그인**: `/login`에서 "테스트 계정 채우기" → 로그인 → 원래 있던 페이지(또는 홈)로 자동 이동하고 헤더에 이름이 뜨는지
4. **로그인 후 즐겨찾기**: 여러 게시글에 별표 클릭 → "즐겨찾기만 보기" 체크 → 즐겨찾기한 것만 보이는지
5. **상세 페이지**: 카드 클릭 → 상세 페이지로 이동, 댓글 목록까지 보이는지, "목록으로"/"뒤로가기"로 돌아가는지
6. **상세 페이지에서 즐겨찾기**: 상세 페이지에서도 즐겨찾기 토글이 목록 페이지와 상태를 공유하는지 (Zustand 확인)
7. **페이지네이션**: "다음"/"이전"으로 페이지를 넘겨도 검색/필터 UI가 그대로 유지되는지
8. **보호된 라우트**: 로그아웃 상태에서 "마이페이지" 클릭 → `/login`으로 튕기고, 로그인 후 다시 "마이페이지"에 들어가면 즐겨찾기 목록이 보이는지
9. **로그아웃**: 헤더에서 로그아웃 → 즐겨찾기 버튼이 다시 막히는지

## 7. 아쉬운 점 / 더 발전시킨다면 (다음 학습 방향)

- **새로고침하면 로그인/즐겨찾기 상태가 날아감**: Zustand 상태가 메모리에만 있어서 새로고침하면 초기화됩니다. `zustand/middleware`의 `persist`를 쓰면 `localStorage`와 쉽게 연동할 수 있습니다.
- **실제 로그인 서버가 없음**: JSONPlaceholder는 진짜 인증을 하지 않으므로, 이메일 형식과 비밀번호 길이만 확인합니다. 실전에서는 서버 인증, JWT 토큰 발급/저장, study10에서 다룬 CORS 설정이 필요합니다.
- **검색이 현재 페이지 안에서만 동작**: 서버가 검색 쿼리 파라미터를 지원한다면, 클라이언트 필터링 대신 `fetchPosts({ page, limit, keyword })`처럼 서버에 검색을 위임하는 게 더 정확합니다.
- **테스트 코드가 없음**: 지금까지는 빌드 성공(타입 검사)과 개발 서버 수동 확인으로만 검증했습니다. Vitest + React Testing Library로 자동화된 테스트를 작성하는 것이 다음 단계로 좋은 주제입니다.

---

여기까지가 이 저장소의 React 학습 로드맵입니다. `study0.md`부터 `studyFinal.md`까지 순서대로 따라오면, Vue 3와 비교하며 React의 핵심 개념(JSX, Hook, 라우팅, API 연동, 전역 상태, TypeScript)을 이론 → 개별 실습 → 종합 프로젝트 순으로 익힐 수 있도록 구성했습니다.
