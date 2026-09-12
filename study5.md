# study5 — React Router 기본 라우팅 (목록 → 상세)

지금까지는 모든 실습이 한 화면(`/`)에 쌓여 있었습니다. 이번엔 `react-router-dom`을 붙여서 "페이지처럼 보이는 화면 전환"을 실습합니다.

```
- [x] Vite + React + JS 프로젝트 생성
- [x] 함수 컴포넌트, props, children
- [x] useState / useEffect / useRef
- [x] 리스트 렌더링과 key
- [x] React Router 기본 라우팅                        (중첩 라우팅 + 보호된 라우트는 study6)
- [x] 폼 상태 다루기
- [ ] Context 또는 Zustand로 전역 상태 (로그인)
- [ ] 백엔드와 CORS 연동
```

대응하는 실습 프로젝트: [`demo/`](./demo) — `react-router-dom` 설치, `pages/` 폴더 신설

---

## 1. 설치 및 기본 설정

```bash
npm install react-router-dom
```

Vue Router와 마찬가지로, React 자체 기능이 아니라 **서드파티 라이브러리**입니다 (study0 0장에서 짚은 "React는 라이브러리 조합" 특징이 처음 실제로 드러나는 지점).

## 2. 기존 `App.jsx`를 페이지 구조로 재구성

study1~4에서 `App.jsx`에 계속 쌓아온 실습 컴포넌트들을 `pages/HomeView.jsx`로 옮기고, `App.jsx`는 "어떤 URL에서 어떤 페이지를 보여줄지"만 담당하도록 바꿨습니다.

```
demo/src/
├─ App.jsx                    # 라우터 설정만 담당
├─ data/
│  └─ fruitCatalog.js          # 라우팅 실습용 목업 데이터
├─ pages/
│  ├─ HomeView.jsx             # '/' — study1~4 실습 모음
│  ├─ FruitCatalogPage.jsx     # '/fruits' — 목록
│  └─ FruitDetailPage.jsx      # '/fruits/:id' — 상세
└─ components/                 # 그대로 유지
```

Vue에서 `views/`(또는 `pages/`) 폴더에 라우트별 화면을 두던 것과 동일한 구조이고, study0 7장에서 미리 본 "기업형 폴더 구조"의 첫 조각이기도 합니다.

### `App.jsx`

```jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import HomeView from './pages/HomeView.jsx'
import FruitCatalogPage from './pages/FruitCatalogPage.jsx'
import FruitDetailPage from './pages/FruitDetailPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header>
          <nav className="actions">
            <Link to="/">홈</Link>
            <Link to="/fruits">과일 카탈로그</Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/fruits" element={<FruitCatalogPage />} />
            <Route path="/fruits/:id" element={<FruitDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
```

| Vue Router | React Router | 역할 |
|---|---|---|
| `createRouter({ history, routes })` | `<BrowserRouter>` | 라우터 자체를 앱에 씌움 (Vue는 설정 객체 + `app.use(router)`, React는 컴포넌트로 감싸기) |
| `routes` 배열의 `{ path, component }` | `<Route path=".." element={<../>} />` | 경로 ↔ 컴포넌트 매칭. React는 **컴포넌트로 라우트를 선언** |
| `<router-view />` | `<Routes>...</Routes>` (그 안의 `<Route>`들) | 현재 URL에 매칭되는 화면이 그려지는 자리 |
| `<router-link to="/">` | `<Link to="/">` | `<a>`를 대체, 새로고침 없이 이동 |
| `createWebHistory()` | `<BrowserRouter>`가 기본으로 이 방식 사용 | 실제 브라우저 주소(`/fruits/1`) 사용 |

**핵심 차이**: Vue Router는 라우트 설정을 **JS 객체 배열**로 별도 파일(`router/index.js`)에 정의하는 게 일반적이지만, React Router(v6 이후)는 `<Routes>`/`<Route>`를 **JSX 안에 직접** 씁니다. 라우트 자체도 "컴포넌트"라는 React의 일관된 철학이 여기까지 이어집니다.

## 3. 목록 페이지 — `FruitCatalogPage.jsx`

```jsx
import { Link } from 'react-router-dom'
import { fruitCatalog } from '../data/fruitCatalog.js'

function FruitCatalogPage() {
  return (
    <ul className="fruit-list">
      {fruitCatalog.map((fruit) => (
        <li key={fruit.id} className="fruit-card">
          <Link to={`/fruits/${fruit.id}`}>{fruit.name}</Link>
          <span>{fruit.price.toLocaleString()}원</span>
        </li>
      ))}
    </ul>
  )
}
```

- study2에서 배운 `.map()` + `key`를 그대로 응용해서, 이번엔 각 항목이 **상세 페이지로 가는 링크**가 됩니다.
- `to={`/fruits/${fruit.id}`}`: 템플릿 리터럴로 동적 경로를 조합. Vue의 `:to="\`/products/${id}\`"`와 동일한 방식입니다.

## 4. 상세 페이지 — `useParams`, `useNavigate`

```jsx
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fruitCatalog } from '../data/fruitCatalog.js'

function FruitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fruit = fruitCatalog.find((f) => f.id === Number(id))

  if (!fruit) {
    return (
      <>
        <h2>존재하지 않는 과일입니다 (id: {id})</h2>
        <Link to="/fruits">← 목록으로</Link>
      </>
    )
  }

  return (
    <>
      <h2>{fruit.name}</h2>
      <p>{fruit.description}</p>
      <Link to="/fruits">← 목록으로 (Link)</Link>
      <button onClick={() => navigate(-1)}>← 뒤로가기 (useNavigate)</button>
    </>
  )
}
```

- `useParams()`: Vue의 `useRoute().params`에 대응. `<Route path="/fruits/:id">`에서 정의한 `:id`를 객체로 꺼내줍니다.
- **주의**: URL 파라미터는 항상 **문자열**입니다. `fruitCatalog`의 `id`는 숫자이므로 `Number(id)`로 변환해서 비교해야 합니다 (`===`는 타입까지 비교하는 엄격 비교라서, 변환을 빼먹으면 항상 매칭에 실패하는 흔한 실수).
- `useNavigate()`: Vue의 `useRouter()`(→ `router.push(...)`)에 대응. 코드로 페이지를 이동시키고 싶을 때 씁니다. `navigate(-1)`은 브라우저의 "뒤로가기"와 같은 동작입니다.
- **없는 id로 접근했을 때를 대비한 분기**도 넣었습니다 — 실무에서 상세 페이지는 항상 "데이터가 없을 수도 있다"는 경우를 처리해야 합니다 (study7에서 로딩/에러 상태와 함께 더 다룹니다).

## 5. 실행 확인

```bash
cd demo
npm run dev
```

- 상단 네비게이션에서 "과일 카탈로그" 클릭 → 주소가 `/fruits`로 바뀌고 새로고침 없이 목록이 보이는지
- 과일 이름 클릭 → 주소가 `/fruits/1`처럼 바뀌고 상세 내용이 보이는지
- 상세 페이지에서 "목록으로" 링크와 "뒤로가기" 버튼이 둘 다 정상 작동하는지
- 브라우저 주소창에 직접 `/fruits/999`(존재하지 않는 id) 입력 → "존재하지 않는 과일입니다" 화면이 뜨는지
- "홈" 링크로 돌아가서 study1~4 실습 컴포넌트들이 그대로 잘 보이는지 (페이지 이동에 영향받지 않는지)

개발 서버 기준으로 `/`, `/fruits`, `/fruits/1` 세 경로 모두 200 응답(SPA 히스토리 폴백)을 받는 것과, `npm run build`가 에러 없이 되는 것을 확인했습니다.

## 6. 다음 단계 (study6 예정 — 고급 기술 구현 1)

- 중첩 라우팅(`<Outlet />`)으로 공통 레이아웃 아래 여러 하위 페이지 구성
- 로그인하지 않으면 접근할 수 없는 **보호된 라우트(Protected Route)** 패턴
