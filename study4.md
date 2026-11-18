# study4 — 라우팅·요청 처리

> 🎯 **목표**: React Router로 URL별 화면(목록→상세, 중첩 라우트)을 만들고, "URL 입력 → 라우터 매칭 → 컴포넌트 렌더 → API 요청 → 화면 갱신" 흐름을 설명할 수 있다.

- 이전: [study3.md](./study3.md) — 데이터 다루기
- 다음: [study5.md](./study5.md) — 폼·입력·검증
- 실습 코드: [`JSX_study/demo/src/App.jsx`](./JSX_study/demo/src/App.jsx), [`pages/`](./JSX_study/demo/src/pages)

---

## 📖 이론

### 4.1 SPA에서 "요청·응답"은 두 갈래

서버 렌더링 프레임워크와 달리 React SPA는 **페이지 요청이 한 번**(`index.html`)이고, 이후 URL 이동은 브라우저 주소만 바꾸고 JS가 화면을 교체합니다.

```text
① 브라우저가 /fruits/1 요청 → 서버가 항상 index.html 반환 (SPA fallback)
② main.jsx 실행 → <BrowserRouter>가 현재 URL 확인
③ <Routes>가 path와 매칭되는 <Route> 선택 → 해당 element(컴포넌트) 렌더
④ 컴포넌트가 필요하면 API 요청(axios) → 응답으로 상태 갱신 → 화면 다시 그림
```

- 화면 이동 = `<Link to="…">` / `navigate()` → **서버 요청 없음**
- 데이터 = API 호출 (study6)

### 4.2 핵심 API

| API | 용도 |
|---|---|
| `BrowserRouter` | History API 기반 라우터 (주소창에 `#` 없음) |
| `Routes` / `Route` | URL → 컴포넌트 매핑 |
| `Link` / `NavLink` | 새로고침 없는 이동 / 현재 경로면 active 표시 |
| `useParams` | `/fruits/:id`의 `id` 꺼내기 (항상 **문자열**) |
| `useNavigate` | 코드로 이동 (`navigate('/')`, `navigate(-1)`) |
| `Outlet` | 중첩 라우트의 자식이 그려지는 자리 |
| `Navigate` | 렌더링 중 즉시 리다이렉트 (보호된 라우트에 사용 → study7) |
| `useLocation` | 현재 위치·`state` 읽기 |

### 4.3 중첩 라우트

부모 라우트가 **공통 레이아웃**(제목, 탭)을, 자식이 **내용**을 담당합니다. 자식은 부모의 `<Outlet />` 자리에 그려집니다.

---

## 🛠️ 실기

### 1. 라우트 정의 — [`App.jsx`](./JSX_study/demo/src/App.jsx)

```jsx
<BrowserRouter>
  <div className="app">
    <header> ... <nav className="actions">
      <Link to="/">홈</Link>
      <Link to="/fruits">과일 카탈로그</Link>
      ...
    </nav></header>
    <main>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/fruits" element={<FruitCatalogPage />} />

        <Route path="/fruits/:id" element={<FruitDetailLayout />}>
          <Route index element={<FruitOverview />} />
          <Route path="reviews" element={<FruitReviews />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/posts" element={<PostListPage />} />
        <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      </Routes>
    </main>
  </div>
</BrowserRouter>
```

| 줄(원본) | 설명 |
|---|---|
| 17 | `BrowserRouter`는 앱 전체를 감싸야 `Link`·`useNavigate`가 동작 |
| 24~28 | 모든 페이지에서 보이는 헤더·네비는 `Routes` **밖**에 두면 라우트가 바뀌어도 유지됨 |
| 34~35 | `path="/"`, `path="/fruits"` 단순 매핑 |
| 38~41 | **중첩 라우트**. `/fruits/1` → `index`(개요), `/fruits/1/reviews` → 리뷰. 자식 `path`는 상대 경로 |
| 45~52 | `ProtectedRoute`로 감싼 라우트 (로그인 필요, → study7) |

### 2. 목록 → 상세 — [`FruitCatalogPage.jsx`](./JSX_study/demo/src/pages/FruitCatalogPage.jsx)

```jsx
<Link to={`/fruits/${fruit.id}`}>{fruit.name}</Link>
```

템플릿 리터럴로 URL을 조립합니다. `<a href>`를 쓰면 전체 새로고침이 일어나므로 내부 이동은 항상 `Link`.

### 3. 중첩 부모 — [`FruitDetailLayout.jsx`](./JSX_study/demo/src/pages/FruitDetailLayout.jsx)

```jsx
const { id } = useParams()
const fruit = fruitCatalog.find((f) => f.id === Number(id))
if (!fruit) { return (<section ...><h2>존재하지 않는 과일입니다 (id: {id})</h2> ... ) }

<NavLink to="." end className={({ isActive }) => (isActive ? 'active' : '')}>개요</NavLink>
<NavLink to="reviews" className={({ isActive }) => (isActive ? 'active' : '')}>리뷰</NavLink>
<Outlet context={{ fruit }} />
```

| 줄(원본) | 설명 |
|---|---|
| 7~8 | `useParams`의 값은 **문자열**이라 `Number(id)`로 변환 후 비교 (`===` 타입까지 비교하므로 필수) |
| 10~17 | 없는 id는 에러가 아니라 **"없음" 화면**을 명시 (study0 이론의 빈 상태 원칙) |
| 26 | `to="."` + `end` : `end`가 없으면 `/fruits/1`이 `/fruits/1/reviews`에서도 active로 보임 |
| 35 | `Outlet context`로 자식에게 값을 전달 |

자식 쪽 [`FruitOverview.jsx`](./JSX_study/demo/src/pages/FruitOverview.jsx): `const { fruit } = useOutletContext()` 로 받습니다. props 전달과 달리 **라우트 트리를 통해** 전달됩니다.

### 4. 요청·응답 흐름 확인 — 개발자 도구

1. 브라우저 F12 → **Network** 탭 → `Doc`(문서)와 `Fetch/XHR` 필터를 번갈아 선택
2. 주소창에 `http://localhost:5173/fruits/2` 를 직접 입력해 Enter → `localhost` 문서 요청 1건(= `index.html`)
3. 화면의 `Link`를 눌러 `/fruits/3`으로 이동 → **문서 요청 없음**, URL만 변경 (SPA 이동)
4. `게시글 목록 (API)`(`/posts`)로 이동 → `Fetch/XHR`에 `jsonplaceholder.typicode.com/posts?_page=…` 요청이 표시됨

### 5. 404(없는 경로) 처리 — 직접 추가해 볼 것

```jsx
// Routes 맨 아래에 추가 (설명용 코드)
<Route path="*" element={<p>페이지를 찾을 수 없습니다. <Link to="/">홈으로</Link></p>} />
```

`*`는 위에서 매칭되지 않은 모든 경로를 받습니다. 순서에 상관없이 **가장 구체적인 경로가 우선**합니다.

### 6. 새로고침하면 404가 나는 이유 (배포 시 주의)

개발 서버(`vite`)는 자동으로 `index.html`을 돌려주지만, 일반 정적 서버에서는 `/fruits/1`에 해당하는 **실제 파일이 없어** 404가 납니다. 해결은 "없는 경로는 `index.html`로 보내기"(SPA fallback) — study10, study17에서 Nginx `try_files`, Netlify `_redirects`로 설정합니다.

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| `useNavigate() may be used only in the context of a <Router>` | `BrowserRouter` 밖에서 라우터 훅 사용 | `BrowserRouter`를 더 바깥으로 |
| 상세 페이지에서 항상 "없음" | `useParams`는 문자열인데 숫자와 `===` 비교 | `Number(id)` 변환 |
| 개요 탭이 항상 active | `NavLink`에 `end` 없음 | `<NavLink to="." end>` |
| 자식 라우트가 안 보임 | 부모에 `<Outlet />` 없음 | 부모 JSX에 `Outlet` 추가 |
| 링크 클릭 시 페이지 전체가 깜빡임 | `<a href>` 사용 | `<Link to>` |
| 새로고침/직접 입력 시 배포 환경에서만 404 | SPA fallback 미설정 | 서버에서 `index.html`로 rewrite |
| `Absolute route path ... nested under path ...` 경고 | 자식 `path`를 `/`로 시작 | 자식은 상대 경로(`reviews`) |

---

## ☐ 체크리스트

- [ ] 주소 변경(SPA 이동)과 데이터 요청(API)이 서로 다른 요청임을 Network 탭으로 확인했다
- [ ] `Routes`/`Route`/`Link`/`useParams`로 목록→상세 이동을 구현했다
- [ ] `useParams` 값이 문자열이라 변환이 필요함을 안다
- [ ] 중첩 라우트(`Outlet`, `index`, 상대 경로)를 구현했다
- [ ] `NavLink`의 `end`가 필요한 이유를 설명할 수 있다
- [ ] 없는 경로(`path="*"`)와 없는 id를 각각 화면으로 처리했다
- [ ] 정적 서버에서 새로고침 404가 나는 이유와 해결 방향(SPA fallback)을 안다

---

## ➡️ 다음 단계 연결

[study5](./study5.md)에서는 **사용자 입력(폼)** 을 받아 상태와 연결하고, 유효성 검사 결과를 화면에 보여 줍니다.
