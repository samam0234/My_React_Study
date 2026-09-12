# study3 — useEffect / useRef 실습

`useState`/이벤트 핸들링에 이어, 이번엔 "렌더링과 직접 관련 없는 일"을 다루는 두 Hook을 실습합니다.

```
- [x] Vite + React + JS 프로젝트 생성
- [x] 함수 컴포넌트, props, children
- [x] useState / useEffect / useRef                  (이번 문서로 전부 실습 완료)
- [x] 리스트 렌더링과 key
- [ ] React Router 중첩 라우팅
- [ ] 폼 상태 다루기 + API 연동 (axios / fetch)
- [ ] Context 또는 Zustand로 전역 상태 (로그인)
- [ ] 백엔드와 CORS 연동
```

대응하는 실습 프로젝트: [`demo/`](./demo) — `FruitSearchPractice.jsx` 추가

---

## 1. `useEffect` — Vue의 `onMounted`/`watch`에 대응

### 1.1 기본 형태

```jsx
useEffect(() => {
  // 실행할 부수효과(side effect)
  return () => {
    // (선택) 클린업 함수 — 다음 effect 실행 전, 또는 언마운트 시 호출
  }
}, [의존성_배열])
```

`useEffect`는 "**렌더링 이후에** 이 코드를 실행해라"는 뜻입니다. 화면을 그리는 것과 직접 관련 없는 일(콘솔 로그, 타이머, 네트워크 요청, DOM 직접 조작 등)을 여기서 처리합니다.

### 1.2 의존성 배열(두 번째 인자)에 따른 3가지 동작

| 의존성 배열 | 실행 시점 | Vue 대응 |
|---|---|---|
| 생략 | 매 렌더링마다 실행 | (Vue엔 정확히 대응하는 것 없음, 거의 안 씀) |
| `[]` (빈 배열) | **최초 마운트 시 딱 1번만** | `onMounted(() => {...})` |
| `[a, b]` | 마운트 시 + `a` 또는 `b`가 바뀔 때마다 | `watch([a, b], () => {...})` |

이번 실습에서는 뒤 두 가지를 모두 씁니다.

```jsx
// 마운트 시 1번만: input에 자동 포커스
useEffect(() => {
  console.log('[FruitSearchPractice] 마운트됨 → input에 자동 포커스')
  inputRef.current.focus()

  return () => {
    console.log('[FruitSearchPractice] 언마운트됨')
  }
}, [])
```

```jsx
// keyword가 바뀔 때마다: 디바운스 검색
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedKeyword(keyword)
  }, 300)

  return () => clearTimeout(timer)
}, [keyword])
```

### 1.3 클린업 함수 — "다음 실행 전에 뒷정리"

`return () => {...}`로 반환한 함수는:

1. **같은 effect가 다시 실행되기 직전** (의존성이 바뀌어서), 그리고
2. **컴포넌트가 화면에서 사라질 때(언마운트)**

에 호출됩니다. 디바운스 예제에서 클린업이 왜 필요한지 보면:

- 사용자가 "사" → "사과"로 빠르게 타이핑하면 `keyword`가 두 번 바뀌면서 `useEffect`도 두 번 실행됩니다.
- 클린업이 없다면 "사"에 대한 타이머와 "사과"에 대한 타이머가 **둘 다** 300ms 뒤에 실행되어, 화면이 잠깐 "사" 검색 결과로 깜빡였다가 "사과" 결과로 바뀌는 문제가 생깁니다.
- 클린업(`clearTimeout(timer)`)이 있으면, 새 타이핑이 들어올 때마다 이전 타이머를 취소하므로 **타이핑이 멈춘 뒤 300ms** 뒤에만 실제로 검색이 반영됩니다 — 이게 "디바운스"입니다.

**StrictMode와의 관계**: study1에서 본 `<StrictMode>`는 개발 모드에서 컴포넌트를 일부러 마운트→언마운트→재마운트 시켜봅니다. 그래서 개발 중에는 콘솔에 "마운트됨"이 두 번 찍히는 것처럼 보일 수 있는데, 이건 버그가 아니라 "클린업을 안 써서 생기는 문제를 미리 잡아내기 위한" 의도된 동작입니다. 클린업 함수를 제대로 작성했다면 실제 동작에는 문제가 없습니다.

## 2. `useRef` — 두 가지 용도

### 2.1 용도 1: DOM 요소 직접 참조

```jsx
const inputRef = useRef(null)

useEffect(() => {
  inputRef.current.focus()
}, [])

return <input ref={inputRef} ... />
```

- `useRef(null)`로 만든 `ref` 객체를 JSX 태그의 `ref` 속성에 연결하면, React가 렌더링 후 `inputRef.current`에 **실제 DOM 요소**를 넣어줍니다.
- Vue에서 `<input ref="myInput">` 후 `myInput.value.focus()`로 접근하는 것과 목적이 완전히 같습니다.

### 2.2 용도 2: "리렌더링을 유발하지 않는" 값 저장

```jsx
const renderCount = useRef(0)
renderCount.current += 1
```

- `useState`와 달리, `.current` 값을 바꿔도 **컴포넌트가 다시 렌더링되지 않습니다.**
- "화면에 보여줄 필요는 없지만 렌더링 사이에 기억해야 하는 값"(타이머 ID, 이전 값, 렌더링 횟수 카운트 등)에 적합합니다.
- 이 실습에서는 `renderCount.current`를 화면에 출력은 하지만, 그 값이 바뀌었다고 해서 화면이 다시 그려지는 게 아니라 **다른 상태(keyword 등)가 바뀌어 리렌더링될 때 "곁다리로" 최신 값이 같이 표시되는 것**입니다.

### 2.3 `useState` vs `useRef` 선택 기준

| 상황 | 선택 |
|---|---|
| 값이 바뀌면 화면에 반영되어야 함 | `useState` |
| 값이 바뀌어도 화면과 무관함 (타이머 ID, 이전 값 등) | `useRef` |
| DOM 요소에 직접 접근해야 함 (포커스, 스크롤, 크기 측정) | `useRef` |

## 3. 마운트/언마운트를 직접 눈으로 확인하기

클린업 함수는 "사라질 때 실행된다"는 걸 눈으로 보기 위해, `App.jsx`에 마운트/언마운트를 반복시키는 버튼을 추가했습니다.

```jsx
const [showSearch, setShowSearch] = useState(true)

// ...
<button onClick={() => setShowSearch((prev) => !prev)}>
  {showSearch ? '검색 컴포넌트 언마운트' : '검색 컴포넌트 다시 마운트'}
</button>
{showSearch && <FruitSearchPractice />}
```

`showSearch`가 `false`가 되는 순간 `<FruitSearchPractice />`는 JSX 트리에서 완전히 빠지고, React는 이를 "언마운트"로 처리해서 study3에서 등록한 클린업 함수(`console.log('언마운트됨')`)를 실행합니다. 다시 `true`로 바꾸면 새로 마운트되어 `useEffect`의 마운트 effect(자동 포커스)가 다시 실행됩니다.

## 4. 실행 확인

```bash
cd demo
npm run dev
```

브라우저 개발자 도구 콘솔을 열어둔 상태로:

- 페이지 로드 직후 → 검색 input에 자동으로 포커스가 가 있는지, 콘솔에 "마운트됨" 로그가 찍히는지
- 검색창에 빠르게 타이핑 → 결과 목록이 타이핑 중엔 안 바뀌다가, **타이핑을 멈추고 약 0.3초 뒤에** 갱신되는지 (디바운스 확인)
- "검색 컴포넌트 언마운트" 클릭 → 컴포넌트가 사라지고 콘솔에 "언마운트됨" 로그가 찍히는지
- 다시 "다시 마운트" 클릭 → 컴포넌트가 새로 나타나고 input에 다시 자동 포커스가 가는지 (마운트 effect 재실행 확인)
- "지금까지 N번 렌더링되었습니다" 문구의 숫자가 타이핑할 때마다 올라가는지 (매 리렌더링마다 `renderCount.current += 1`이 실행됨을 확인)

`npm run build`로 프로덕션 빌드까지 에러 없이 되는 것을 확인했습니다.

## 5. 다음 단계 (study4 예정)

- 콜백 props로 **자식 → 부모** 통신 패턴 실습 (Vue의 emit에 대응)
- Controlled Component로 로그인 폼 만들고, 클라이언트 사이드 검증 추가
