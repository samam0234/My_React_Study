# study1 — Vite+React 프로젝트 생성 & JSX/컴포넌트/props/children 실습

study0에서 이론을 훑었으니, 실제로 프로젝트를 만들고 화면에 뭔가 그려봅니다.

```
- [x] Vite + React + JS 프로젝트 생성                (TS 전환은 study10)
- [x] 함수 컴포넌트, props, children                 (실습 컴포넌트로 확인)
- [ ] useState / useEffect / useRef                  (study2, study3 예정)
- [ ] 리스트 렌더링과 key                             (study2에서 상태와 함께 심화)
- [ ] React Router 중첩 라우팅
- [ ] 폼 상태 다루기 + API 연동 (axios / fetch)
- [ ] Context 또는 Zustand로 전역 상태 (로그인)
- [ ] 백엔드와 CORS 연동
```

대응하는 실습 프로젝트: [`demo/`](./demo)

---

## 1. 프로젝트 생성 명령어

```bash
npm create vite@latest demo -- --template react
cd demo
npm install
npm run dev
```

- `npm create vite@latest`: Vite 공식 스캐폴딩 CLI (Vue 때와 완전히 동일한 도구)
- `-- --template react`: 여러 템플릿 중 **React + JS** 조합을 선택 (TypeScript를 쓰려면 `react-ts`, study10에서 다룸)
- 결과적으로 `npx create-vite`가 실행되어 `demo/` 폴더에 프로젝트가 생성됩니다

```bash
npm run dev   # 개발 서버 실행, 기본 http://localhost:5173
npm run build # 프로덕션 빌드 (dist/ 생성)
```

## 2. 생성된 폴더 구조 (핵심만)

```
demo/
├─ index.html          # 진짜 진입점. <div id="root"></div> 하나만 있음
├─ vite.config.js
├─ package.json
├─ src/
│  ├─ main.jsx          # JS 진입점. React 앱을 만들어서 #root에 렌더링
│  ├─ App.jsx           # 최상위(루트) 컴포넌트
│  ├─ App.css / index.css
│  └─ assets/
```

Vue의 `main.js` + `App.vue` 구조와 정확히 대응합니다. 다만 `.vue` 파일이 없고 전부 `.jsx` 파일(=JS 함수)이라는 점이 study0에서 배운 차이입니다.

### `src/main.jsx` (자동 생성됨)

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- `createRoot(엘리먼트)`: Vue의 `createApp(App)`에 대응. React 18부터 쓰는 방식(예전엔 `ReactDOM.render`)
- `.render(<App />)`: `App` 컴포넌트를 실제로 그 자리에 그려 넣음 (Vue의 `.mount('#app')`에 대응)
- `<StrictMode>`: 개발 중에만 동작하는 안전장치. 컴포넌트를 일부러 두 번 실행해서 "부수효과가 안전하게 정리되는지" 등을 미리 잡아줌 (study3의 useEffect 클린업과 관련)

## 3. JSX 실습 — 함수 컴포넌트, props, children

study0에서 배운 개념을 실제 코드로 확인하기 위해 "과일 재고 목록"을 3개의 컴포넌트로 나눠서 만들었습니다 (Vue study1의 과일 목록 실습과 동일한 소재로 비교하기 쉽게 구성).

파일: [`demo/src/components/`](./demo/src/components)

### 3.1 `FruitListPractice.jsx` — 부모 컴포넌트

```jsx
import FruitCard from './FruitCard.jsx'

const initialFruits = [
  { id: 1, name: '사과', inStock: true },
  { id: 2, name: '바나나', inStock: false },
  { id: 3, name: '포도', inStock: true },
]

function FruitListPractice() {
  return (
    <section className="practice">
      <h2>실습1: 과일 재고 목록 (함수 컴포넌트 / props / children)</h2>
      <ul className="fruit-list">
        {initialFruits.map((fruit) => (
          <FruitCard key={fruit.id} fruit={fruit} />
        ))}
      </ul>
    </section>
  )
}

export default FruitListPractice
```

- `initialFruits`는 그냥 평범한 JS 배열 — study0에서 말한 "JSX는 JS일 뿐"이라는 게 여기서 체감됩니다.
- `{initialFruits.map(...)}`: Vue의 `v-for="fruit in fruits"`에 대응하는 자리. **디렉티브가 아니라 배열의 `.map()` 메서드**를 그대로 씁니다.
- `key={fruit.id}`: study0 2.2절에서 다룬 그 `key`. React가 리스트의 각 항목을 추적하는 식별자로, `id`처럼 고유하고 안정적인 값을 써야 합니다 (배열 index를 key로 쓰면 안 되는 이유는 study2에서 상태가 들어갈 때 더 와닿습니다).
- `<FruitCard fruit={fruit} />`: **props 전달**. Vue의 `:fruit="fruit"`와 완전히 같은 역할이고, 문법만 `:` 대신 `{}`를 씁니다.
- 아직 `useState`를 쓰지 않았기 때문에 이 배열은 절대 바뀌지 않는 **고정 데이터**입니다. 인터랙션(추가/삭제)은 study2에서 다룹니다.

### 3.2 `FruitCard.jsx` — props를 받는 자식 컴포넌트

```jsx
import FruitBadge from './FruitBadge.jsx'

function FruitCard({ fruit }) {
  return (
    <li className="fruit-card">
      <span className={`name${fruit.inStock ? '' : ' soldout'}`}>
        {fruit.name}
      </span>
      <FruitBadge soldout={!fruit.inStock}>
        {fruit.inStock ? '재고 있음' : '품절'}
      </FruitBadge>
    </li>
  )
}

export default FruitCard
```

- `function FruitCard({ fruit })`: 매개변수 자리에서 **구조분해**로 바로 `fruit`을 꺼냅니다. 원래는 `function FruitCard(props)`이고 `props.fruit`으로 접근해야 하지만, 구조분해가 관례입니다.
- `className={...}`: study0에서 짚은 `class` → `className` 차이. 백틱(템플릿 리터럴)으로 조건부 클래스를 조합하는 것도 흔한 패턴입니다 (Vue의 `:class="{ soldout: !fruit.inStock }"` 객체 문법과 목적은 같음).
- `<FruitBadge soldout={!fruit.inStock}>...</FruitBadge>`: 여는 태그와 닫는 태그 **사이의 내용**이 `FruitBadge`의 `children`으로 전달됩니다.

### 3.3 `FruitBadge.jsx` — `children` 실습

```jsx
function FruitBadge({ soldout, children }) {
  return (
    <span className={`badge${soldout ? ' soldout' : ''}`}>{children}</span>
  )
}

export default FruitBadge
```

- `children`은 **React가 자동으로 넣어주는 특별한 prop**입니다. 별도로 선언하지 않아도, JSX 태그 사이에 쓴 내용이 알아서 `props.children`으로 전달됩니다.
- Vue의 `<slot />`과 목적이 같습니다: "이 컴포넌트를 감싸 쓰는 쪽에서 내용물을 채워 넣는다."
- 이번 실습에서는 문자열(`'재고 있음'`, `'품절'`)만 넘겼지만, `children`에는 다른 JSX 엘리먼트도 그대로 넘길 수 있습니다 (예: 아이콘 + 텍스트 조합).

### 3.4 컴포넌트 트리로 정리

```
App
└─ FruitListPractice   (배열을 갖고 있음, .map()으로 반복)
   └─ FruitCard × 3     (fruit 객체 하나를 props로 받음)
      └─ FruitBadge      (soldout prop + children으로 문구를 받음)
```

데이터는 위에서 아래로만 흐릅니다 (study0 5장, 단방향 데이터 흐름). 지금은 콜백 props(자식→부모 통신)가 없어서 화살표가 한 방향뿐이지만, study4에서 자식이 부모에게 이벤트를 알리는 패턴을 추가합니다.

## 4. 실행 확인

```bash
cd demo
npm run dev
```

- `http://localhost:5173` 접속 → "실습1: 과일 재고 목록" 섹션이 보이는지 확인
- 사과/포도는 "재고 있음" 배지, 바나나는 취소선 + "품절" 배지(다른 스타일)로 보이는지 확인
- 브라우저 개발자 도구 콘솔에 에러가 없는지 확인

터미널에서는 개발 서버를 띄운 뒤 `curl -s http://localhost:5173/`로 200 응답과 `<div id="root">`가 포함된 HTML을 받는지, `npm run build`가 에러 없이 `dist/`를 생성하는지까지 확인했습니다.

## 5. 다음 단계 (study2 예정)

- `useState`로 위 과일 목록을 진짜 "상태"로 바꾸기 (추가/삭제/재고 토글)
- 이벤트 핸들링(`onClick`)으로 버튼 인터랙션 추가
- 상태가 배열/객체일 때 **불변성을 지키며 업데이트**하는 방법 (Vue와 가장 다른 포인트 중 하나)
