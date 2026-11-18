# study1 — Hello World와 기본 문법

> 🎯 **목표**: `App.jsx`에서 첫 화면을 띄우고, JSX의 기본 문법(표현식·속성·조건부·리스트·스타일)을 쓸 수 있다.

- 이전: [study0.md](./study0.md) — 환경 설정
- 다음: [study2.md](./study2.md) — 핵심 구조(컴포넌트)
- 실습 코드: [`JSX_study/demo`](./JSX_study/demo)

---

## 📖 이론

### 1.1 JSX란

JSX는 JS 안에 UI를 쓰는 문법입니다. 브라우저가 직접 읽는 것이 아니라 Vite(`@vitejs/plugin-react`)가 일반 JS 호출로 변환합니다. 결과적으로 JSX는 **"값(React 엘리먼트)을 만드는 표현식"** 입니다.

### 1.2 꼭 지켜야 하는 JSX 규칙

| 규칙 | 잘못된 예 | 올바른 예 |
|---|---|---|
| 루트는 하나 (여러 개면 Fragment) | `<h1/><p/>` | `<><h1/><p/></>` |
| 모든 태그를 닫는다 | `<input>` | `<input />` |
| `class` 대신 `className` | `class="box"` | `className="box"` |
| JS 값은 `{ }` 로 | `value=name` | `value={name}` |
| `style`은 객체 | `style="color:red"` | `style={{ color: 'red' }}` |
| 이벤트는 camelCase + 함수 | `onclick="f()"` | `onClick={f}` |

### 1.3 `{ }` 안에는 "표현식"만

- 쓸 수 있는 것: 변수, 함수 호출, 삼항(`a ? b : c`), `&&`, `map`
- 쓸 수 없는 것: `if` 문, `for` 문 (문장이므로) → 삼항·`&&`·`map`으로 대체

### 1.4 조건부 렌더링과 리스트

- 조건: `cond ? <A/> : <B/>` 또는 `cond && <A/>`
- 리스트: `array.map(item => <li key={item.id}>…</li>)` — **`key`는 형제 사이에서 유일하고 안정적인 값**(id)을 씁니다. 인덱스는 순서가 바뀌는 목록에서는 피합니다.

---

## 🛠️ 실기

### 1. 첫 화면 — Hello World

`src/App.jsx`를 아래처럼 바꿔 봅니다. (설명용 예제 코드 — 저장소의 [`App.jsx`](./JSX_study/demo/src/App.jsx)는 이후 단계의 라우팅이 들어간 상태입니다.)

```jsx
function App() {
  const name = 'React'
  const isMorning = new Date().getHours() < 12

  return (
    <div className="app">
      <h1>Hello, {name}!</h1>
      <p>{isMorning ? '좋은 아침입니다' : '좋은 하루 보내세요'}</p>
      <ul>
        {['사과', '바나나', '포도'].map((fruit) => (
          <li key={fruit}>{fruit}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
```

| 줄 | 설명 |
|---|---|
| 1 | 컴포넌트 = **대문자로 시작하는 함수**. 화면(JSX)을 `return` |
| 2~3 | 렌더링 전에 쓸 값은 `return` 위에서 계산 |
| 6 | 루트 요소 하나. 클래스는 `className` |
| 7 | `{name}` → 변수 값이 글자로 들어감 |
| 8 | 삼항 연산자로 조건부 렌더링 |
| 10~12 | `map`으로 리스트 렌더링. 값 자체가 유일하므로 `key={fruit}` |

### 2. 저장소 코드로 확인 — 고정 배열을 화면에 그리기

[`FruitListPractice.jsx`](./JSX_study/demo/src/components/FruitListPractice.jsx)

```jsx
const initialFruits = [
  { id: 1, name: '사과', inStock: true },
  { id: 2, name: '바나나', inStock: false },
  { id: 3, name: '포도', inStock: true },
]

function FruitListPractice() {
  return (
    <section className="practice">
      <h2>실습1: 과일 재고 목록 (함수 컴포넌트 / props / children)</h2>
      ...
      <ul className="fruit-list">
        {initialFruits.map((fruit) => (
          <FruitCard key={fruit.id} fruit={fruit} />
        ))}
      </ul>
    </section>
  )
}
```

| 줄 | 설명 |
|---|---|
| 5~9 | 상태가 아닌 **모듈 상수**. 이 단계에서는 값이 바뀌지 않으므로 `useState`가 필요 없음 (study3에서 상태로 승격) |
| 14 | 컴포넌트 밖에 선언한 상수는 렌더링마다 다시 만들어지지 않음 |
| 20~22 | `map`이 반환한 `<FruitCard>` 배열을 JSX 안에 `{ }`로 끼워 넣음. `key={fruit.id}`는 id라서 안전 |

### 3. 조건부 클래스 — 템플릿 리터럴

[`FruitCard.jsx:7`](./JSX_study/demo/src/components/FruitCard.jsx)

```jsx
<span className={`name${fruit.inStock ? '' : ' soldout'}`}>
```

재고가 없으면 `name soldout`, 있으면 `name`. **문자열을 조합해서 클래스를 바꾸는 가장 기본 패턴**입니다(클래스가 많아지면 `clsx` 같은 유틸을 씁니다 → study13).

### 4. 직접 해 볼 것

1. `Hello, {name}!`의 `name`을 `useState`가 아니라 **그냥 변수**로 두고 바꿔 보기 → 저장하면 화면이 바뀌는 이유(HMR=코드 교체)와, 클릭으로 바뀌지 않는 이유(상태가 아님)를 구분하기 → study3
2. `style={{ color: 'tomato', fontSize: 24 }}`로 제목을 꾸미기 (숫자는 `px`로 해석)
3. `<ul>` 안의 `key`를 일부러 지워 콘솔 경고를 확인하기

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| `Adjacent JSX elements must be wrapped in an enclosing tag` | 루트가 둘 이상 | `<>…</>` Fragment로 감싸기 |
| 콘솔 `Each child in a list should have a unique "key" prop` | `map`에 `key` 없음 | 항목의 유일한 값을 `key`로 |
| 화면에 `[object Object]` | 객체를 `{obj}`로 그대로 출력 | `obj.name`처럼 필드를 꺼내거나 `JSON.stringify` |
| `class` 때문에 경고 | HTML 습관 | `className` |
| `0`이 화면에 찍힘 | `{count && <p/>}`에서 `count`가 `0` | `{count > 0 && <p/>}` 또는 삼항 |
| `Objects are not valid as a React child` | 객체·Promise를 그대로 렌더링 | 문자열/숫자/엘리먼트로 변환 |

---

## ☐ 체크리스트

- [ ] `App.jsx`를 수정해 `Hello, React!` 화면을 띄웠다
- [ ] JSX 규칙 6가지(루트 1개, 태그 닫기, className, `{}`, style 객체, camelCase 이벤트)를 설명할 수 있다
- [ ] `{ }` 안에 `if`를 못 쓰고 삼항·`&&`를 쓰는 이유를 안다
- [ ] `map` + `key`로 리스트를 그렸고, key를 id로 쓰는 이유를 안다
- [ ] 조건부 클래스를 템플릿 리터럴로 적용했다
- [ ] `0 && <p/>` 함정을 설명할 수 있다

---

## ➡️ 다음 단계 연결

화면이 한 파일에 모두 들어 있으면 금방 커집니다. [study2](./study2.md)에서 **컴포넌트로 쪼개고**, props/children으로 데이터를 내려주는 구조를 직접 만듭니다.
