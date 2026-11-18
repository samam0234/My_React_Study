# studyMidpoint — 중간 응용: 미니 게시판 + 로그인

> 🎯 **목표**: study0~10에서 배운 기능**만으로** 게시판(목록·상세·검색·페이지네이션·댓글·즐겨찾기)과 로그인(보호된 라우트)을 가진 작은 서비스를 완성한다.

- 이전: [study10.md](./study10.md) — 배포·정리
- 다음: [study11.md](./study11.md) — 상태·데이터 흐름 심화
- 결과 코드: [`TSX_study/project`](./TSX_study/project) (TSX 완성본, **이 문서 범위 그대로 — 수정하지 않음**), [`JSX_study/project`](./JSX_study/project) (JSX 경량본)
- 이 문서의 "확장 과제"(글 작성·삭제, 실제 로그인, 환경 변수, 테스트 등)와 한계 항목을 실제로 구현한 결과는 [`TSX_study/final`](./TSX_study/final)([studyFinal](./studyFinal.md))에 있습니다.

> 📌 **현재 상태**: `TSX_study/project`가 이 문서의 범위(조회 중심 + 가짜 로그인)를 이미 구현하고 있습니다. 이 문서는 그 결과를 **다시 만들 수 있는 순서**와 **완성 점검 기준**으로 정리하고, 아직 없는 기능(글 작성/삭제, 실제 로그인)은 "확장 과제"로 구분합니다. 확장 과제 코드는 저장소에 없고 이 문서와 study6·7의 예제로만 존재합니다.

---

## 1. 목표

| 항목 | 내용 |
|---|---|
| 서비스 | 미니 게시판 (Mini Board) |
| 사용자 | 비로그인: 읽기 / 로그인: 즐겨찾기, 마이페이지 |
| 데이터 | JSONPlaceholder 목업 API (실제 백엔드 연결은 확장 과제) |
| 사용 기술 | React 19, Vite, TypeScript, react-router-dom, axios, Zustand |
| 사용 범위 제한 | study0~10에서 다룬 것만. TanStack Query·UI 라이브러리·Docker 등은 사용하지 않는다 |

## 2. 기능 목록

### 필수 (TSX_study/project에 구현됨)

| # | 기능 | 배운 곳 | 위치 |
|---|---|---|---|
| F1 | 게시글 목록 + 로딩/에러/빈 상태 | study6 | [`PostListPage.tsx:34-36`](./TSX_study/project/src/pages/PostListPage.tsx) |
| F2 | 제목 검색 (현재 페이지 내) | study3 | [`PostListPage.tsx:38-40`](./TSX_study/project/src/pages/PostListPage.tsx) |
| F3 | 페이지네이션 (이전/다음) | study6 | [`PostListPage.tsx:74-82`](./TSX_study/project/src/pages/PostListPage.tsx) |
| F4 | 게시글 상세 + 댓글 (병렬 요청) | study4, 6 | [`PostDetailPage.tsx`](./TSX_study/project/src/pages/PostDetailPage.tsx), [`api/posts.ts:16`](./TSX_study/project/src/api/posts.ts) |
| F5 | 로그인 폼 + 검증 | study5 | [`LoginPage.tsx`](./TSX_study/project/src/pages/LoginPage.tsx) |
| F6 | 전역 로그인 상태, 헤더 반영 | study8 | [`authStore.ts`](./TSX_study/project/src/store/authStore.ts), [`AppHeader.tsx`](./TSX_study/project/src/components/AppHeader.tsx) |
| F7 | 즐겨찾기 토글 + "즐겨찾기만 보기" | study3, 8 | [`favoritesStore.ts`](./TSX_study/project/src/store/favoritesStore.ts), [`PostCard.tsx`](./TSX_study/project/src/components/PostCard.tsx) |
| F8 | 보호된 라우트 + 로그인 후 원래 위치로 복귀 | study7 | [`ProtectedRoute.tsx`](./TSX_study/project/src/components/ProtectedRoute.tsx) |
| F9 | 마이페이지 (즐겨찾기 목록) | study7 | [`MyPage.tsx`](./TSX_study/project/src/pages/MyPage.tsx) |

### 확장 과제 (study0~10 범위 안에서 더 해 볼 것)

| # | 기능 | 참고 |
|---|---|---|
| E1 | 글 작성·삭제 폼 (CRUD) | study5 폼 + study6 §5 |
| E2 | 실제 백엔드 로그인, 토큰, `persist`, 인터셉터 | study7 |
| E3 | `.env` 분리, 경로 별칭 | study8 |
| E4 | Vitest 테스트 (검증·스토어·`useFetch`·로그인 폼) | study9 |
| E5 | 404 라우트(`path="*"`) | study4 §5 |
| E6 | 외부 배포 | study10 |

## 3. 폴더 구조

```text
TSX_study/project/
├─ index.html
├─ package.json            ← scripts: dev / build(tsc -b && vite build) / lint / preview
├─ tsconfig.json           ← references: app + node
├─ tsconfig.app.json       ← 앱 코드용 (strict 계열 옵션)
├─ tsconfig.node.json      ← vite.config.ts용
├─ vite.config.ts
├─ .oxlintrc.json
└─ src/
   ├─ main.tsx             ← StrictMode + createRoot
   ├─ App.tsx              ← BrowserRouter + Routes (라우트 4개)
   ├─ types.ts             ← Post, Comment, User
   ├─ api/                 ← client.ts, posts.ts
   ├─ hooks/               ← useFetch.ts
   ├─ store/               ← authStore.ts, favoritesStore.ts
   ├─ components/          ← AppHeader.tsx, PostCard.tsx, ProtectedRoute.tsx
   └─ pages/               ← PostListPage / PostDetailPage / LoginPage / MyPage
```

라우트 ([`App.tsx:16-28`](./TSX_study/project/src/App.tsx)):

| 경로 | 화면 | 보호 |
|---|---|---|
| `/` | 목록 | — |
| `/posts/:id` | 상세 | — |
| `/login` | 로그인 | — |
| `/mypage` | 마이페이지 | `ProtectedRoute` |

## 4. 구현 순서 (다시 만든다면)

| 단계 | 할 일 | 사용한 study | 확인 |
|---|---|---|---|
| 1 | `react-ts` 템플릿 생성, 불필요 파일 정리 | study0 | `npm run dev` 화면 |
| 2 | `types.ts`: `Post`, `Comment`, `User` | study2, 8 | 타입 오류 없음 |
| 3 | `api/client.ts`, `api/posts.ts` | study6 | Network 탭에서 200 |
| 4 | `hooks/useFetch.ts` (로딩/에러/데이터 + `ignore`) | study6 | 로딩 문구 → 데이터 |
| 5 | `PostListPage` (목록 + 3상태) | study3, 6 | 10개 표시 |
| 6 | 검색, 페이지네이션 | study3, 6 | 이전/다음 비활성 경계 |
| 7 | `App.tsx` 라우팅 + `PostDetailPage` (`useParams`, `Promise.all`) | study4 | 목록→상세→뒤로 |
| 8 | `authStore` + `LoginPage` (검증, `from` 복귀) | study5, 7 | 로그인 성공/실패 |
| 9 | `AppHeader` (로그인 상태 공유, 로그아웃) | study8 | 즉시 갱신 |
| 10 | `ProtectedRoute` + `MyPage` | study7 | 비로그인 `/mypage` 차단 |
| 11 | `favoritesStore` + `PostCard` 콜백 props | study3 | 즐겨찾기 토글, 상세 이동과 분리 |
| 12 | 린트·빌드·(확장) 테스트·배포 | study9, 10 | `build` 성공 |

핵심 코드 한 줄 설명:

```tsx
// PostCard.tsx:14-18 — 카드 전체는 Link, 별 버튼만 이동 없이 동작
function handleFavoriteClick(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()    // Link의 페이지 이동 취소
  event.stopPropagation()   // 부모 클릭 전파 차단
  onToggleFavorite(post.id)
}
```

```tsx
// PostListPage.tsx:26-32 — 비로그인이면 즐겨찾기 차단
function handleToggleFavorite(postId: number) {
  if (!user) { alert('즐겨찾기는 로그인 후 이용할 수 있습니다.'); return }
  toggleFavorite(postId)
}
```

## 5. 완성 체크리스트

### 기능

- [ ] 목록이 10개씩 표시되고, 로딩·에러·빈 상태가 각각 화면에 나온다
- [ ] 제목 검색이 동작한다 (한계: 현재 페이지 안에서만 검색됨)
- [ ] 이전/다음 버튼이 1페이지·마지막 페이지에서 비활성화된다
- [ ] 목록 카드 클릭 → 상세 이동, 상세에서 댓글이 표시된다
- [ ] 다른 글로 이동하면(id 변경) 상세가 다시 요청된다
- [ ] 로그인 검증 오류(이메일 형식, 비밀번호 8자)가 표시된다
- [ ] 로그인하면 헤더에 사용자 이름과 로그아웃 버튼이 나타난다
- [ ] 비로그인 상태로 `/mypage` 접근 시 `/login`으로 이동하고, 로그인 후 `/mypage`로 돌아온다
- [ ] 별 버튼은 상세 이동 없이 즐겨찾기만 토글한다. 비로그인이면 안내가 뜬다
- [ ] 마이페이지에 즐겨찾기 글 링크가 나온다

### 품질

- [ ] `npm run lint`에 오류가 없다
- [ ] `npm run build`(타입 검사 포함)가 통과한다
- [ ] 폴더 의존 방향(`pages → hooks/api/store`)을 지켰다
- [ ] 개발자 도구 콘솔에 에러·`key` 경고가 없다

### 알려진 한계 (확장 과제로 연결)

- [ ] 즐겨찾기·로그인은 **새로고침하면 사라진다** → study7 `persist`
- [ ] 로그인이 **서버 없는 가짜 로그인**이다 → study7 실제 연결
- [ ] 검색이 **현재 페이지 데이터에 대해서만** 동작한다 → 서버 `q` 파라미터 (스펙 v1)
- [ ] 글 작성·수정·삭제가 없다 → study6 §5
- [ ] 마이페이지는 `게시글 #N`처럼 id만 보여준다 (제목 없음)
- [ ] 테스트가 없다 → study9
- [ ] 배포하지 않았다 → study10

## 6. 회고 순서

1. **만든 것**: 완성된 기능을 9개 중 몇 개 직접 다시 구현했는가
2. **잘 된 것**: 구조(api/hooks/store 분리) 덕분에 쉬웠던 부분
3. **막힌 곳**: 오류 노트에 기록한 오류와 해결 과정 (study9의 도구로 어떻게 찾았나)
4. **데이터 흐름 그리기**: `PostListPage`에서 `useFetch → fetchPosts → axios → 응답 → state → 화면`을 한 장으로 그리기
5. **불편했던 것**: `useFetch`를 직접 만들며 느낀 한계(캐시 없음, 중복 요청, 재시도 없음) → **study11의 출발점**
6. **다음 목표 3개**: 예) 실제 백엔드 연결, 테스트, 외부 배포

회고 기록 칸:

```text
- 만든 것:
- 잘 된 것:
- 막힌 곳:
- useFetch의 한계:
- 다음 목표 3개:
```

---

## ➡️ 다음 단계 연결

중간 응용에서 느낀 한계(캐시·재시도·서버 상태 관리)를 [study11](./study11.md)에서 TanStack Query·Redux Toolkit으로 해결합니다.
