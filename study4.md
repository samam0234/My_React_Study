# study4 — 콜백 props(자식→부모 통신) & 폼 상태(Controlled Component) 실습

컴포넌트를 잘게 쪼갤 때 반드시 필요한 "자식이 부모에게 알리는 방법"과, 실무에서 거의 항상 등장하는 "폼 상태 관리 + 검증"을 실습합니다.

```
- [x] Vite + React + JS 프로젝트 생성
- [x] 함수 컴포넌트, props, children
- [x] useState / useEffect / useRef
- [x] 리스트 렌더링과 key
- [ ] React Router 중첩 라우팅                        (study5, study6 예정)
- [x] 폼 상태 다루기                                  (API 연동은 study7 예정)
- [ ] Context 또는 Zustand로 전역 상태 (로그인)
- [ ] 백엔드와 CORS 연동
```

대응하는 실습 프로젝트: [`demo/`](./demo) — `LikeableFruitList.jsx`, `LoginFormPractice.jsx` 추가

---

## 1. 콜백 props — Vue의 `emit`을 React 방식으로

study0 5장에서 "React의 emit은 콜백 함수를 props로 내려주는 관례일 뿐"이라고 배웠습니다. 이번엔 실제로 두 단계(선택/좋아요)를 구현했습니다.

```jsx
function FruitLikeCard({ fruit, liked, onSelect, onToggleLike }) {
  function handleLikeClick(event) {
    event.stopPropagation()
    onToggleLike(fruit.id)
  }

  return (
    <li className="fruit-card" onClick={() => onSelect(fruit.id)}>
      <span className="name">{fruit.name}</span>
      <button className={liked ? 'active' : ''} onClick={handleLikeClick}>
        {liked ? '★ 좋아요 취소' : '☆ 좋아요'}
      </button>
    </li>
  )
}
```

```jsx
function LikeableFruitList() {
  const [likedIds, setLikedIds] = useState([])
  const [lastSelected, setLastSelected] = useState(null)

  function handleToggleLike(id) {
    setLikedIds((prev) =>
      prev.includes(id) ? prev.filter((likedId) => likedId !== id) : [...prev, id],
    )
  }

  function handleSelect(id) {
    setLastSelected(id)
  }

  return (
    // ...
    <FruitLikeCard
      fruit={fruit}
      liked={likedIds.includes(fruit.id)}
      onSelect={handleSelect}
      onToggleLike={handleToggleLike}
    />
  )
}
```

### 1.1 이름 짓는 관례 — `on케밥Something`

- 부모가 자식에게 내려주는 콜백 props는 관례상 **`on` + 동사**로 짓습니다 (`onSelect`, `onToggleLike`, `onLike` 등).
- 자식 내부에서 그 콜백을 부르는 함수는 관례상 **`handle` + 동사**로 짓습니다 (`handleLikeClick`).
- Vue의 `defineEmits(['like'])` + `emit('like', payload)`와 비교하면, React는 "이벤트 이름을 선언"하는 절차 없이 그냥 **함수를 하나 더 받는 것**뿐이라 더 단순하지만, 그만큼 이름 규칙을 팀 안에서 통일해두는 게 중요합니다.

### 1.2 "실제 상태 변경은 부모가 결정한다"

`FruitLikeCard`(자식)는 `likedIds`라는 상태 자체를 모릅니다. 그냥 `onToggleLike(fruit.id)`를 호출해서 "이 id를 토글해줘"라고 **요청만** 합니다. 실제로 배열에서 추가/제거하는 로직은 전부 `LikeableFruitList`(부모)의 `handleToggleLike`에 있습니다.

- 이 원칙 덕분에 `likedIds` 상태가 어디서, 어떻게 바뀌는지 **한 곳(부모)만 보면 알 수 있습니다.**
- study0 5장에서 다룬 "단방향 데이터 흐름"이 콜백 props까지 포함해서 완성되는 지점입니다: **데이터(liked)는 내려가고(prop), 의도(toggle 해달라는 요청)는 콜백으로 올라간다.**

### 1.3 `event.stopPropagation()` — 이벤트 버블링 차단

카드(`<li>`)에도 `onClick`이 있고, 그 안의 버튼에도 `onClick`이 있습니다. 버튼을 클릭하면 브라우저는 기본적으로 이벤트를 부모 요소로 **전파(버블링)**시키므로, 아무 조치가 없으면 좋아요 버튼을 눌러도 `onSelect`(카드 선택)까지 같이 실행됩니다.

```jsx
function handleLikeClick(event) {
  event.stopPropagation() // 여기서 버블링을 끊음
  onToggleLike(fruit.id)
}
```

이 패턴은 실무에서 "카드 전체는 클릭 시 상세 페이지로 이동하지만, 카드 안의 즐겨찾기 버튼은 페이지 이동 없이 그 자체로만 동작해야 하는" 경우(예: 게시글 카드 + 즐겨찾기 버튼)에 항상 등장합니다. studyFinal에서 라우팅과 결합해 다시 사용합니다.

## 2. Controlled Component — Vue의 `v-model`을 직접 조립

### 2.1 왜 "직접 조립"해야 하는가

Vue는 `v-model="email"` 한 줄로 "값 표시 + 입력 시 갱신"을 자동으로 처리했습니다. study0 2.2절에서 짚었듯 **React에는 이런 양방향 바인딩 문법이 없습니다.** 대신 `value`와 `onChange`를 직접 연결합니다.

```jsx
<input
  type="email"
  name="email"
  value={form.email}
  onChange={handleChange}
/>
```

```jsx
function handleChange(event) {
  const { name, value } = event.target
  setForm((prev) => ({ ...prev, [name]: value }))
}
```

- `value={form.email}`: input에 표시될 값을 **React state가 결정**합니다 (input이 아니라 React가 "진짜 값"을 갖고 있다는 뜻 — 그래서 "Controlled(제어되는)" Component라고 부릅니다).
- `onChange={handleChange}`: 사용자가 타이핑할 때마다 `setForm`으로 state를 갱신합니다.
- `[name]: value`: **계산된 속성명(computed property name)** 문법으로, `name="email"`이면 `{ email: value }`가, `name="password"`면 `{ password: value }`가 되어 핸들러 함수 하나로 여러 input을 처리할 수 있습니다.
- **주의**: `value`만 넣고 `onChange`를 빼먹으면 input에 아무것도 입력할 수 없는 "읽기 전용" 필드가 되어버립니다 (React가 계속 이전 값으로 되돌리기 때문) — 초보자가 자주 만나는 에러(`You provided a value prop to a form field without an onChange handler`)입니다.

### 2.2 클라이언트 사이드 검증 — "제출 시" + "필드를 벗어났을 때"

```jsx
function validate({ email, password }) {
  const errors = {}
  if (!email.includes('@')) errors.email = '올바른 이메일 형식이 아닙니다.'
  if (password.length < 8) errors.password = '비밀번호는 8자 이상이어야 합니다.'
  return errors
}
```

```jsx
function shouldShowError(field) {
  return (touched[field] || submitted) && errors[field]
}
```

- `errors`는 **매 렌더링마다 새로 계산되는 파생 값**입니다 (Vue의 `computed`와 유사한 역할이지만, React는 캐싱 없이 렌더링마다 다시 계산하고, 계산 비용이 크면 study6 이후에 배울 `useMemo`로 최적화합니다).
- `touched`: 사용자가 한 번이라도 그 필드에서 벗어난 적(`onBlur`) 있는지 기록. 페이지에 들어오자마자 모든 칸에 빨간 에러가 뜨는 걸 막기 위한 UX 장치입니다.
- `submitted`: 제출 버튼을 눌렀다면, 아직 `touched`되지 않은 필드라도 에러를 보여줍니다.
- Vue study5에서 만든 것과 정확히 같은 패턴(touched/errors/shouldShowError)이며, 검증 로직 자체는 프레임워크와 무관한 순수 JS라는 것도 확인할 수 있습니다.

### 2.3 폼 제출 — `preventDefault`

```jsx
function handleSubmit(event) {
  event.preventDefault() // 브라우저 기본 동작(페이지 새로고침)을 막음
  setSubmitted(true)
  if (!isValid) return
  // ...
}
```

`<form onSubmit={handleSubmit}>`에서 `event.preventDefault()`를 호출하지 않으면, 브라우저가 폼을 실제로 서버에 제출하며 페이지가 새로고침되어 SPA의 상태가 전부 날아갑니다. Vue의 `@submit.prevent`가 자동으로 해주던 것을 React에서는 **직접 호출**해야 합니다.

## 3. 실행 확인

```bash
cd demo
npm run dev
```

**콜백 props 실습**

- 과일 카드를 클릭 → "마지막으로 선택한 카드" 문구가 바뀌는지
- 좋아요 버튼 클릭 → "선택됨" 문구는 그대로인데 좋아요 개수만 바뀌는지 (`stopPropagation` 확인)
- 좋아요를 다시 눌러 취소 → 개수가 다시 줄어드는지

**로그인 폼 실습**

- 아무것도 입력하지 않고 "로그인" 클릭 → 이메일/비밀번호 에러 메시지가 뜨는지
- 이메일 칸에 `@` 없이 입력 후 다른 칸으로 이동(blur) → 바로 에러가 뜨는지 (`touched` 확인)
- 올바른 이메일 + 8자 이상 비밀번호 입력 후 제출 → "로그인되었습니다" 화면으로 전환되는지
- "로그아웃" 클릭 → 다시 빈 폼으로 돌아오는지

`npm run build`로 프로덕션 빌드까지 에러 없이 되는 것을 확인했습니다.

## 4. 다음 단계 (study5 예정)

- `react-router-dom` 설치, 목록 → 상세 페이지 기본 라우팅
- `useParams`로 URL의 동적 파라미터 읽기, `Link`로 페이지 이동
