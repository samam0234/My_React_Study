# study2 — useState / 이벤트 핸들링 / 리스트 렌더링과 key 실습

study1의 정적인 과일 목록을 `useState`로 "진짜 상태"로 바꿔서, 추가/삭제/토글이 되는 인터랙티브한 컴포넌트로 만듭니다.

```
- [x] Vite + React + JS 프로젝트 생성
- [x] 함수 컴포넌트, props, children
- [x] useState                                       (실습 컴포넌트로 확인)
- [ ] useEffect / useRef                             (study3 예정)
- [x] 리스트 렌더링과 key                             (동적 배열 + key 전략까지 확인)
- [ ] React Router 중첩 라우팅
- [ ] 폼 상태 다루기 + API 연동 (axios / fetch)
- [ ] Context 또는 Zustand로 전역 상태 (로그인)
- [ ] 백엔드와 CORS 연동
```

대응하는 실습 프로젝트: [`demo/`](./demo) — `FruitInventoryPractice.jsx`를 새로 추가 (study1의 `FruitListPractice`는 그대로 남겨서 "정적 props vs 동적 state" 대조가 되도록 함)

---

## 1. `useState` 기본 문법 복습 (study0 4.2절)

```jsx
const [fruits, setFruits] = useState(initialFruits)
```

- 배열 구조분해로 `[현재값, 값을 바꾸는 함수]`를 받습니다. 이름은 관례상 `[x, setX]`.
- `useState(initialFruits)`의 인자는 **최초 렌더링 시 딱 한 번만** 사용되는 초깃값입니다.
- Vue의 `ref([...])`와 비교하면: 읽을 때 `.value` 없이 바로 `fruits`를 쓰는 건 편하지만, 쓸 때는 `fruits.value = ...`처럼 직접 대입할 수 없고 **반드시 `setFruits(...)`를 호출**해야 합니다.

## 2. 왜 배열/객체를 직접 수정하면 안 되는가 — 불변성(Immutability)

Vue의 `reactive`/`ref`는 내부적으로 Proxy를 써서 `arr.push(x)`처럼 "직접 변경"해도 변화를 감지합니다. **React는 다릅니다.**

> React는 "이전 상태와 다른 새로운 값(객체/배열)이 들어왔는가"를 **주소값(참조) 비교**로 판단합니다. 기존 배열을 `.push()`로 직접 바꾸면 배열의 주소(참조)는 그대로이기 때문에, React 입장에서는 "안 바뀐 것"으로 보여서 화면이 갱신되지 않을 수 있습니다.

그래서 React에서 배열/객체 상태를 다룰 때는 **항상 새 배열/새 객체를 만들어서** `setState`에 넘깁니다.

```jsx
// ❌ 하지 말 것 — 기존 배열을 직접 변경
fruits.push(newFruit)
setFruits(fruits)

// ✅ 새 배열을 만들어서 전달
setFruits((prev) => [...prev, newFruit])
```

이 실습 컴포넌트에서 쓴 세 가지 불변 업데이트 패턴:

```jsx
// 추가: 스프레드 문법으로 "기존 요소 + 새 요소"의 새 배열
setFruits((prev) => [...prev, { id: nextId++, name, inStock: true }])

// 토글(일부만 수정): map으로 새 배열을 만들되, 해당 항목만 새 객체로 교체
setFruits((prev) =>
  prev.map((fruit) =>
    fruit.id === id ? { ...fruit, inStock: !fruit.inStock } : fruit,
  ),
)

// 삭제: filter로 해당 항목만 뺀 새 배열
setFruits((prev) => prev.filter((fruit) => fruit.id !== id))
```

- `{ ...fruit, inStock: !fruit.inStock }`: 객체 스프레드로 "기존 필드는 그대로 복사하고, `inStock`만 덮어쓴" **새 객체**를 만듭니다.
- `setFruits(prev => ...)`처럼 **함수를 넘기는 형태**(functional update)를 쓴 이유: 여러 이벤트가 짧은 시간에 겹쳐 발생해도 항상 "최신 상태"를 기준으로 계산하기 위함입니다. `setFruits([...fruits, x])`처럼 바깥의 `fruits` 변수를 직접 참조하면, 리렌더링 타이밍에 따라 오래된 값을 참조하는 버그가 생길 수 있습니다.

## 3. 이벤트 핸들링 — `onClick`

```jsx
<button onClick={addRandomFruit}>랜덤 과일 추가</button>
<button onClick={() => toggleStock(fruit.id)}>품절 처리</button>
```

- `onClick={addRandomFruit}`: 함수 **참조**를 그대로 전달 (괄호 없음! `onClick={addRandomFruit()}`이면 렌더링 시점에 즉시 실행되어버림)
- `onClick={() => toggleStock(fruit.id)}`: 인자를 넘겨야 할 때는 화살표 함수로 감싸서 "클릭 시에 실행될 함수"를 새로 만들어 전달
- Vue의 `@click="addRandomFruit"` / `@click="toggleStock(fruit.id)"`와 하는 일은 같지만, Vue 템플릿 컴파일러는 인자가 있어도 알아서 처리해주는 반면 React(JSX)는 **순수 JS이므로 괄호 유무 차이가 그대로 함수 실행 여부를 결정**한다는 점이 실무에서 자주 하는 실수 포인트입니다.

## 4. 조건부 렌더링 — `&&`, 삼항연산자

```jsx
{visibleFruits.length === 0 ? (
  <p>표시할 과일이 없습니다.</p>
) : (
  <ul className="fruit-list">...</ul>
)}
```

```jsx
<button className={showOnlyInStock ? 'active' : ''}>
  {showOnlyInStock ? '전체 보기' : '재고 있는 것만 보기'}
</button>
```

- Vue의 `v-if`/`v-else`(study0 2.6절과 연결)를 JS의 **삼항연산자**로 표현했습니다.
- "조건이 참일 때만 무언가를 보여주고, 거짓이면 아예 안 보여준다"처럼 `else`가 없는 경우는 `조건 && <컴포넌트 />` 형태를 흔히 씁니다 (이 실습에서는 삼항연산자로 통일했지만 study4의 로그인 폼 실습에서 `&&` 패턴을 씁니다).

## 5. 리스트 렌더링과 `key` — 왜 index를 쓰면 안 되는가

study0/study1에서 `key`는 "React가 리스트 항목을 추적하는 식별자"라고 배웠습니다. 이번 실습처럼 **항목이 추가/삭제되는 동적 리스트**에서 그 중요성이 드러납니다.

```jsx
{visibleFruits.map((fruit) => (
  <li key={fruit.id} className="fruit-card">...</li>
))}
```

- `key={fruit.id}`: 고유하고 절대 안 바뀌는 값 (배열 순서가 바뀌어도 각 과일의 id는 그대로) → **올바른 선택**
- 만약 `key={index}`를 썼다면: "포도"를 삭제해서 배열이 `[사과, 바나나]`가 되면, React는 "인덱스 1 = 바나나였다가 → 인덱스 1 = (원래 인덱스 2였던) 포도"로 착각하기 쉽습니다. 그 결과 각 `<li>`에 연결된 내부 상태(예: 입력 중이던 텍스트, 포커스, 애니메이션)가 엉뚱한 항목으로 튀는 버그가 생길 수 있습니다.
- **결론**: key는 "배열에서 몇 번째냐"가 아니라 "이 데이터가 무엇이냐"를 나타내는 값이어야 합니다. 서버에서 받은 데이터라면 대부분 고유 id가 있으므로 그것을 씁니다.

## 6. 두 컴포넌트 나란히 놓고 비교

`App.jsx`에 study1의 `FruitListPractice`(정적)와 study2의 `FruitInventoryPractice`(동적)를 나란히 렌더링해서 차이를 눈으로 비교할 수 있게 했습니다.

| | FruitListPractice (study1) | FruitInventoryPractice (study2) |
|---|---|---|
| 데이터 | 컴포넌트 바깥의 고정 배열 | `useState`로 감싼 상태 |
| 변경 | 불가능 (다시 렌더링해도 항상 동일) | 버튼 클릭으로 추가/토글/삭제 |
| 목적 | JSX/props/children 문법 자체에 집중 | 상태 변경 → 리렌더링 흐름 체감 |

## 7. 실행 확인

```bash
cd demo
npm run dev
```

- "랜덤 과일 추가" 클릭 → 목록에 새 항목이 늘어나는지
- "품절 처리"/"재입고" 클릭 → 취소선 스타일과 버튼 문구가 바뀌는지
- "재고 있는 것만 보기" 클릭 → 품절 항목이 숨겨지는지, 버튼에 `active` 스타일이 붙는지
- "삭제" 클릭 → 항목이 목록에서 완전히 제거되는지
- 모든 항목을 지웠을 때 "표시할 과일이 없습니다" 문구가 뜨는지 (조건부 렌더링 확인)

`npm run build`로 프로덕션 빌드까지 에러 없이 되는 것을 확인했습니다.

## 8. 다음 단계 (study3 예정)

- `useEffect`로 컴포넌트가 화면에 나타날 때/특정 값이 바뀔 때 부수효과 실행하기
- `useRef`로 DOM 요소 직접 참조하기 (예: input 자동 포커스)
- Vue의 `onMounted`/`watch`와 다시 한번 비교
