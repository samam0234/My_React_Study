# study6 (고급 기술 구현 1) — 중첩 라우팅 & 보호된 라우트

여기부터는 "고급 기술 구현" 단계입니다. study5의 기본 라우팅에 두 가지를 더합니다: 한 페이지 안에 탭처럼 동작하는 **중첩 라우팅**, 그리고 로그인해야만 볼 수 있는 **보호된 라우트(Protected Route)**.

```
- [x] Vite + React + JS 프로젝트 생성
- [x] 함수 컴포넌트, props, children
- [x] useState / useEffect / useRef
- [x] 리스트 렌더링과 key
- [x] React Router 중첩 라우팅                        (이번 문서 — 체크리스트 완료!)
- [x] 폼 상태 다루기
- [ ] Context 또는 Zustand로 전역 상태 (로그인)         (study8, study9 예정)
- [ ] 백엔드와 CORS 연동
```

대응하는 실습 프로젝트: [`demo/`](./demo)

---

## 1. 중첩 라우팅 — `<Outlet />`

### 1.1 왜 필요한가

study5의 상세 페이지는 "개요"만 보여줬습니다. 실무에서는 상세 페이지 안에 **탭**(개요/리뷰/문의 등)이 있는 경우가 흔한데, 탭마다 매번 상단 정보(과일 이름, 가격)를 다시 그리는 컴포넌트를 따로 만들면 중복이 생깁니다. **중첩 라우팅**은 "공통 레이아웃은 부모 라우트가 한 번만 그리고, 달라지는 부분만 자식 라우트가 채워 넣는" 구조입니다.

### 1.2 라우트 트리 선언

```jsx
<Route path="/fruits/:id" element={<FruitDetailLayout />}>
  <Route index element={<FruitOverview />} />
  <Route path="reviews" element={<FruitReviews />} />
</Route>
```

- `<Route>` 안에 `<Route>`를 중첩하면 "부모 URL 아래의 하위 경로"가 됩니다. 위 코드는 `/fruits/:id`(개요, index)와 `/fruits/:id/reviews`(리뷰) 두 URL을 만듭니다.
- `index`: 부모 경로와 정확히 일치할 때(추가 세그먼트 없을 때) 보여줄 기본 자식. Vue Router의 `children: [{ path: '', component: ... }]`(빈 경로)에 대응합니다.

### 1.3 부모 레이아웃 — `FruitDetailLayout.jsx`

```jsx
function FruitDetailLayout() {
  const { id } = useParams()
  const fruit = fruitCatalog.find((f) => f.id === Number(id))

  return (
    <section>
      <h2>{fruit.name}</h2>
      <p>가격: {fruit.price.toLocaleString()}원</p>

      <nav>
        <NavLink to="." end>개요</NavLink>
        <NavLink to="reviews">리뷰</NavLink>
      </nav>

      <Outlet context={{ fruit }} />
    </section>
  )
}
```

- **`<Outlet />`**: Vue Router의 `<router-view />`와 정확히 같은 역할이지만, 이번엔 "앱 전체의 화면 자리"가 아니라 **이 레이아웃 컴포넌트 안에서 자식 라우트가 그려질 자리**입니다. `App.jsx`의 `<Routes>`(바깥쪽 router-view)와 `FruitDetailLayout` 안의 `<Outlet />`(중첩된 router-view)이 계층을 이룹니다.
- **`NavLink`**: `Link`의 확장판. 현재 URL과 일치하면 자동으로 `isActive`를 알려줘서 활성 탭 스타일을 줄 수 있습니다.
- **`end` prop**: `to="."`(현재 경로, 즉 `/fruits/1`)에 `end`를 안 붙이면 `/fruits/1/reviews`도 "이 링크와 일치"로 취급해서 "개요" 탭이 계속 활성화된 것처럼 보이는 버그가 생깁니다. `end`는 "정확히 이 경로일 때만 활성화"를 강제합니다.
- **`<Outlet context={{ fruit }} />`**: 자식 라우트에게 데이터를 내려주는 또 다른 방법. props가 아니라 **라우트 트리를 통해 전달**됩니다.

### 1.4 자식 라우트 — `useOutletContext`

```jsx
// FruitOverview.jsx
function FruitOverview() {
  const { fruit } = useOutletContext()
  return <p>{fruit.description}</p>
}
```

```jsx
// FruitReviews.jsx
function FruitReviews() {
  const { fruit } = useOutletContext()
  return (/* 리뷰 목록 */)
}
```

부모가 이미 `useParams()`로 `fruit`을 찾아뒀는데, 자식이 또 `useParams()` + `find()`를 반복하지 않도록 `useOutletContext()`로 **한 번 계산한 값을 재사용**했습니다. (참고: 이 패턴은 데이터가 간단할 때 편리하지만, 여러 단계로 깊어지면 study8의 Context API처럼 더 명시적인 전역 상태 도구를 쓰는 게 낫습니다.)

## 2. 보호된 라우트(Protected Route)

### 2.1 목표

로그인하지 않은 사용자가 `/mypage`에 접근하면 자동으로 `/login`으로 보내고, 로그인에 성공하면 원래 가려던 페이지로 되돌려 보냅니다.

### 2.2 임시 인증 상태 — `auth/fakeAuth.js`

Context API(study8)와 Zustand(study9)를 아직 배우지 않았으므로, 지금은 가장 단순한 방법으로 로그인 여부를 흉내냅니다.

```js
const STORAGE_KEY = 'demo-fake-auth'

export function isLoggedIn() {
  return localStorage.getItem(STORAGE_KEY) === '1'
}
export function login() {
  localStorage.setItem(STORAGE_KEY, '1')
}
export function logout() {
  localStorage.removeItem(STORAGE_KEY)
}
```

**의도적으로 이렇게 격리한 이유**: `ProtectedRoute`가 "로그인 여부를 어떻게 판단하는지" 구체적인 방법(localStorage)을 몰라도 되게, `isLoggedIn()`이라는 **함수 인터페이스**만 의존하게 만들었습니다. study8/study9에서 이 내부 구현을 Context/Zustand로 바꿔도 `ProtectedRoute` 코드는 손댈 필요가 없다는 걸 이후 문서에서 확인합니다.

### 2.3 `ProtectedRoute.jsx`

```jsx
function ProtectedRoute({ children }) {
  const location = useLocation()

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
```

- **`children` prop 활용**: study0에서 다룬 `children`이 여기서 다른 방식으로 쓰입니다 — "보호하고 싶은 페이지 컴포넌트를 그대로 감싸는" 래퍼(wrapper) 패턴입니다.
- **`<Navigate />`**: "렌더링되는 순간 다른 경로로 리다이렉트하라"는 뜻의 컴포넌트. `useNavigate()`를 이벤트 핸들러 밖(렌더링 도중)에서 쓰기 애매할 때 이 방식을 씁니다.
- **`replace`**: 브라우저 히스토리에 `/login`을 "새 항목"으로 쌓지 않고 현재 항목을 대체합니다. 이게 없으면 로그인 후 뒤로가기를 눌렀을 때 다시 리다이렉트 루프에 빠질 수 있습니다.
- **`state={{ from: location }}`**: "원래 어디로 가려고 했는지"를 로그인 페이지에 전달합니다.

### 2.4 라우트에 적용

```jsx
<Route
  path="/mypage"
  element={
    <ProtectedRoute>
      <MyPage />
    </ProtectedRoute>
  }
/>
```

### 2.5 로그인 후 원래 페이지로 복귀 — `LoginPage.jsx`

```jsx
function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/mypage'

  function handleLogin() {
    login()
    navigate(from, { replace: true })
  }

  return <button onClick={handleLogin}>테스트 계정으로 로그인</button>
}
```

`ProtectedRoute`가 `state.from`으로 넘겨준 위치를 꺼내서, 로그인 성공 시 그 경로로 이동합니다. `location.state?.from?.pathname`처럼 **옵셔널 체이닝(`?.`)**을 쓴 이유: `/login`에 직접 접속한 경우(리다이렉트를 거치지 않은 경우) `location.state`가 아예 없을 수 있기 때문입니다.

## 3. 실행 확인

```bash
cd demo
npm run dev
```

**중첩 라우팅**

- `/fruits/1` 접속 → "개요" 탭이 활성화된 채로 설명이 보이는지
- "리뷰" 탭 클릭 → URL이 `/fruits/1/reviews`로 바뀌고, 상단의 이름/가격은 그대로인 채 아래 내용만 리뷰 목록으로 바뀌는지 (레이아웃 재사용 확인)
- 탭을 전환할 때마다 활성 탭 스타일이 정확히 하나만 켜지는지 (`end` prop 확인)

**보호된 라우트**

- 로그아웃 상태에서 "마이페이지" 링크 클릭 → 자동으로 `/login`으로 이동하는지
- "테스트 계정으로 로그인" 클릭 → 원래 가려던 `/mypage`로 이동하며 마이페이지 내용이 보이는지
- 마이페이지에서 "로그아웃" 클릭 → 홈으로 이동하고, 다시 "마이페이지" 링크를 눌렀을 때 또 로그인 페이지로 튕기는지

`npm run build`까지 에러 없이 되는 것을 확인했습니다.

## 4. 다음 단계 (study7 예정 — 고급 기술 구현 2)

- `axios`/`fetch`로 실제 API 연동, 커스텀 훅(`useFetch`)으로 데이터 요청 로직 재사용
- 로딩/에러/빈 상태를 항상 명시하는 패턴 (study0 7장에서 예고한 내용)
