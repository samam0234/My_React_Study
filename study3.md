# study3 — 데이터 다루기: 상태(state)·이벤트·Effect·ref

> 🎯 **목표**: `useState`로 바뀌는 데이터를 관리하고, `useEffect`/`useRef`로 렌더링 밖의 일(타이머, 포커스)을 다루며, 자식→부모 데이터 전달(콜백 props)까지 만든다.

- 이전: [study2.md](./study2.md) — 핵심 구조
- 다음: [study4.md](./study4.md) — 라우팅·요청 처리
- 실습 코드: [`FruitInventoryPractice.jsx`](./JSX_study/demo/src/components/FruitInventoryPractice.jsx), [`FruitSearchPractice.jsx`](./JSX_study/demo/src/components/FruitSearchPractice.jsx), [`LikeableFruitList.jsx`](./JSX_study/demo/src/components/LikeableFruitList.jsx)

---

## 📖 이론

### 3.1 `useState` — 바뀌면 다시 그려지는 값

```jsx
const [count, setCount] = useState(0)
setCount(count + 1)   // 반드시 setter로 — 직접 count = 1 은 화면이 안 바뀜
```

- 바뀌는 값 중 **화면에 영향이 있는 것**만 state로 둡니다.
- **다른 값에서 계산할 수 있는 것**은 state가 아니라 렌더링 중 계산(파생 값)입니다. (예: `visibleFruits`)

### 3.2 불변성 — 배열·객체는 "새로 만들어" 넘긴다

| 하고 싶은 일 | ❌ 직접 변경 | ✅ 새 값 |
|---|---|---|
| 추가 | `arr.push(x)` | `[...prev, x]` |
| 수정 | `arr[0].a = 1` | `prev.map(i => i.id===id ? {...i, a:1} : i)` |
| 삭제 | `arr.splice(i,1)` | `prev.filter(i => i.id !== id)` |
| 객체 필드 | `obj.name = 'x'` | `{ ...prev, name: 'x' }` |

React는 **이전 참조와 새 참조를 비교**해서 바뀌었는지 판단하기 때문입니다.

### 3.3 함수형 업데이트

이전 값에 기대는 변경은 `setX(prev => …)` 형태로 씁니다. 같은 렌더링 안에서 여러 번 호출해도 최신 값에 이어서 계산됩니다.

### 3.4 `useEffect` — 렌더링 밖의 일

| 의존성 배열 | 실행 시점 |
|---|---|
| 없음 | 렌더링마다 (거의 안 씀) |
| `[]` | 마운트 후 1번 (+ 언마운트 때 cleanup) |
| `[a, b]` | 처음 + `a` 또는 `b`가 바뀔 때마다 |

- **cleanup(return 함수)** 은 다음 effect 실행 직전/언마운트 때 실행됩니다. 타이머·구독·이벤트 리스너 해제에 씁니다.

### 3.5 `useRef`

- `ref.current`에 값을 두면 **바뀌어도 리렌더링이 일어나지 않습니다.**
- 용도 ① DOM 요소 직접 접근(`focus()`), ② 렌더링과 무관한 값 보관(타이머 id, 렌더 횟수).

### 3.6 상태 끌어올리기 + 콜백 props

자식이 부모의 상태를 바꾸고 싶으면, **부모가 변경 함수를 props로 내려줍니다.** (Vue의 `emit`에 해당하는 자리)

---

## 🛠️ 실기

### 1. 상태로 바꾼 재고 목록 — [`FruitInventoryPractice.jsx`](./JSX_study/demo/src/components/FruitInventoryPractice.jsx)

```jsx
const [fruits, setFruits] = useState(initialFruits)
const [showOnlyInStock, setShowOnlyInStock] = useState(false)

function addRandomFruit() {
  const name = fruitPool[Math.floor(Math.random() * fruitPool.length)]
  setFruits((prev) => [...prev, { id: nextId++, name, inStock: true }])
}

function toggleStock(id) {
  setFruits((prev) =>
    prev.map((fruit) => (fruit.id === id ? { ...fruit, inStock: !fruit.inStock } : fruit)),
  )
}

function removeFruit(id) {
  setFruits((prev) => prev.filter((fruit) => fruit.id !== id))
}

const visibleFruits = showOnlyInStock ? fruits.filter((fruit) => fruit.inStock) : fruits
```

| 줄(원본) | 설명 |
|---|---|
| 14~15 | 상태 2개: **원본 목록**, **필터 on/off**. 필터된 목록은 state로 두지 않음 |
| 17~21 | 추가 = 스프레드로 새 배열. `nextId`는 컴포넌트 밖의 `let`(렌더링과 무관한 id 발급) |
| 23~29 | 수정 = `map` 안에서 해당 항목만 새 객체로 교체 |
| 31~33 | 삭제 = `filter` |
| 39~41 | **파생 값**. `fruits`와 `showOnlyInStock`에서 매번 계산 → 따로 동기화할 필요 없음 |
| 57~59 | 빈 상태도 화면에 명시 (`표시할 과일이 없습니다.`) |
| 62 | 목록 `key`는 `fruit.id` — 삭제·추가 때 순서가 바뀌어도 항목 정체성 유지 |

### 2. effect와 ref — [`FruitSearchPractice.jsx`](./JSX_study/demo/src/components/FruitSearchPractice.jsx)

```jsx
const inputRef = useRef(null)
const renderCount = useRef(0)

useEffect(() => {                         // ① 마운트 1회
  inputRef.current.focus()
  return () => { console.log('언마운트됨') }
}, [])

useEffect(() => {                         // ② keyword 변경 시 디바운스
  const timer = setTimeout(() => setDebouncedKeyword(keyword), 300)
  return () => clearTimeout(timer)
}, [keyword])

renderCount.current += 1
```

| 줄(원본) | 설명 |
|---|---|
| 9~10 | `inputRef`는 DOM 접근용, `renderCount`는 렌더링과 무관한 값 |
| 13~21 | `[]` → 마운트 직후 1번 포커스. return 함수는 **언마운트 때** 실행 |
| 24~31 | `keyword`가 바뀔 때마다 300ms 타이머를 건다. **다음 입력이 들어오면 cleanup이 이전 타이머를 취소** → 입력이 멈춘 뒤에만 반영(디바운스) |
| 34 | ref는 값이 바뀌어도 리렌더링을 일으키지 않음. 화면의 "N번 렌더링" 문구로 체감 |
| 36 | `debouncedKeyword`로 검색. 입력값(`keyword`)과 검색 반영값을 **분리**한 것이 핵심 |

> 💡 `StrictMode`(개발 모드)에서는 effect가 마운트 → 언마운트 → 마운트로 한 번 더 도는 것처럼 보일 수 있습니다. cleanup이 제대로 짝을 이루는지 확인하는 장치입니다.

### 3. 자식 → 부모 — [`LikeableFruitList.jsx`](./JSX_study/demo/src/components/LikeableFruitList.jsx)

```jsx
function FruitLikeCard({ fruit, liked, onSelect, onToggleLike }) {
  function handleLikeClick(event) {
    event.stopPropagation()          // 카드 클릭(onSelect)까지 번지지 않게
    onToggleLike(fruit.id)
  }
  return (
    <li className="fruit-card" onClick={() => onSelect(fruit.id)}>
      ...
      <button className={liked ? 'active' : ''} onClick={handleLikeClick}>
```

```jsx
const [likedIds, setLikedIds] = useState([])
function handleToggleLike(id) {
  setLikedIds((prev) =>
    prev.includes(id) ? prev.filter((likedId) => likedId !== id) : [...prev, id])
}
```

| 포인트 | 설명 |
|---|---|
| 상태 위치 | `likedIds`는 **부모**에 있음. 자식은 id만 알려주고, 어떻게 바꿀지는 부모가 결정 |
| `stopPropagation` | 버튼 클릭이 부모 `<li onClick>`까지 올라가는 이벤트 버블링을 차단 |
| 상태 모양 | 객체 배열이 아니라 **id 배열**만 저장 → 중복 정보 없음. (같은 패턴이 TSX 프로젝트의 [`favoritesStore.ts:11-20`](./TSX_study/project/src/store/favoritesStore.ts)로 이어짐) |

### 4. 직접 해 볼 것

1. `FruitInventoryPractice`의 `removeFruit`를 `fruits.splice(...)` 후 `setFruits(fruits)`로 바꿔 보고, 화면이 안 바뀌는 이유를 불변성으로 설명하기 (확인 후 원복)
2. `debounce` 시간을 1000ms로 바꿔 입력→반영 지연을 체감하기
3. `[]`를 지운 effect(의존성 배열 없음)에 `console.log`를 넣어 **렌더링마다** 실행되는 것을 확인하기

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 값을 바꿨는데 화면이 그대로 | 배열·객체를 직접 변경 | 새 배열·객체를 만들어 setter에 전달 |
| `Too many re-renders` | 렌더링 중에 `setX()` 호출 (`onClick={setX(1)}`) | `onClick={() => setX(1)}` |
| effect가 무한 반복 | effect 안에서 의존성 값을 set하고, 그 값이 의존성 배열에 있음 | 의존성 재검토, 함수형 업데이트, 파생 값으로 대체 |
| 이전 값이 계속 찍힘 (stale closure) | 이벤트/타이머가 오래된 렌더의 값을 캡처 | `setX(prev => …)` 또는 의존성에 포함 |
| 언마운트 후 `setState` 경고/잘못된 반영 | 비동기 완료가 늦음 | cleanup에서 `ignore` 플래그 (study6 `useFetch`) |
| 클릭 시 부모 핸들러까지 실행 | 이벤트 버블링 | `event.stopPropagation()` |
| `inputRef.current`가 `null` | 마운트 전에 접근 | effect/이벤트 핸들러 안에서 접근 |

---

## ☐ 체크리스트

- [ ] 어떤 값이 state이고 어떤 값이 **파생 값**인지 구분해 코드를 짤 수 있다
- [ ] 추가·수정·삭제를 불변성을 지켜(`spread`/`map`/`filter`) 구현했다
- [ ] `setX(prev => …)` 함수형 업데이트를 써야 하는 경우를 안다
- [ ] `useEffect`의 의존성 배열 3가지(없음 / `[]` / `[a]`) 차이를 설명할 수 있다
- [ ] cleanup 함수로 타이머를 정리하는 디바운스를 구현했다
- [ ] `useRef`가 `useState`와 다른 점(리렌더링 여부)을 설명할 수 있다
- [ ] 콜백 props + `stopPropagation`으로 자식→부모 통신을 구현했다

---

## ➡️ 다음 단계 연결

지금까지는 한 화면 안의 데이터였습니다. [study4](./study4.md)에서는 **URL에 따라 화면이 바뀌는 라우팅**과, 요청이 들어와 화면이 그려지기까지의 흐름을 다룹니다.
