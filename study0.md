# study0 — React 시작 전 기초 이론

이 문서는 실습(코드 작성) 이전에, React에서 앞으로 나올 용어와 개념을 미리 이해하기 위한 문서입니다.
[Vue.js 학습](../vue.js/study0.md)을 먼저 마친 상태를 전제로, **Vue와 다른 점 위주로** 정리했습니다.

```
- [ ] Vite + React + JS 후 TS로 전환
- [ ] 함수 컴포넌트, props, children
- [ ] useState / useEffect / useRef
- [ ] 리스트 렌더링과 key
- [ ] React Router 중첩 라우팅
- [ ] 폼 상태 다루기 + API 연동 (axios / fetch)
- [ ] Context 또는 Zustand로 전역 상태 (로그인)
- [ ] 백엔드(Django/FastAPI/Nest/Spring) 와 CORS 연동
```

---

## 0. React는 "라이브러리"다 — Vue와의 첫 번째 차이

Vue는 라우팅(Vue Router), 상태관리(Pinia), 빌드 도구(Vite 연동)까지 공식 팀이 하나로 묶어서 제공하는 **프레임워크**에 가깝습니다.

React는 다릅니다. React 자체는 **"UI를 그리는 라이브러리"** 하나만 담당합니다.

- 라우팅 → `react-router-dom` (서드파티, 사실상 표준)
- 상태관리 → `Context API`(내장) 또는 `Zustand`/`Redux`(서드파티)
- 프로젝트 생성 도구 → `Vite`(Vue와 동일하게 사용 가능)

**그래서 React 생태계는 "선택지가 많다"는 게 특징입니다.** 같은 문제(라우팅, 전역 상태)를 푸는 라이브러리가 여러 개 있고, 팀/회사마다 조합이 다릅니다. 이 학습 로드맵에서는 실무에서 가장 흔한 조합(`react-router-dom` + `Context` 또는 `Zustand`)을 다룹니다.

## 1. Virtual DOM — Vue와 원리는 같다

Vue와 React 둘 다 **Virtual DOM**을 씁니다. 원리는 동일합니다.

> 상태가 바뀌면, 실제 DOM을 직접 조작하지 않고 "가상의 DOM(JS 객체)"을 새로 만들어 이전 것과 비교(diffing)한 뒤, **달라진 부분만** 실제 DOM에 반영한다.

차이는 "누가 화면을 다시 그릴지 결정하는 단위"입니다.

- **Vue**: 반응형 데이터(`ref`) 하나하나가 "이 데이터를 쓰는 화면 부분"을 정밀하게 추적합니다. 그래서 컴포넌트의 일부만 콕 집어 갱신하는 경향이 있습니다.
- **React**: 상태(`useState`)가 바뀌면 **그 상태를 가진 컴포넌트 함수 전체가 다시 실행**됩니다(리렌더링). 그 결과로 나온 Virtual DOM을 이전 것과 비교해서 실제 DOM 변경은 최소화하지만, "컴포넌트 함수가 다시 호출된다"는 점 자체는 Vue보다 자주 일어납니다.

이 차이 때문에 React에서는 "왜, 언제 리렌더링되는가"를 이해하는 것이 실무에서 중요한 주제입니다 (이후 `useMemo`, `useCallback`, 상태 관리 라이브러리 선택 등과 연결됩니다).

## 2. JSX — Vue의 `<template>`에 대응

### 2.1 JSX란

**J**ava**S**cript **X**ML. HTML처럼 생겼지만 사실은 **JS 코드로 변환되는 문법**입니다.

```jsx
const element = <h1>안녕하세요</h1>
```

이 코드는 빌드 시점에 Babel(트랜스파일러)이 아래와 같은 순수 JS 함수 호출로 변환합니다.

```js
const element = React.createElement('h1', null, '안녕하세요')
```

즉 **JSX = "HTML처럼 생긴 JS"**이지 별도의 템플릿 언어가 아닙니다. Vue의 `<template>`은 컴파일러가 별도로 파싱하는 "템플릿 문법"이지만, JSX는 그냥 JS 표현식이라서 **JS 문법을 100% 그대로 쓸 수 있다**는 게 핵심 차이입니다.

### 2.2 Vue 템플릿 문법 → JSX 대응표

| Vue 템플릿 | React JSX | 비고 |
|---|---|---|
| `{{ message }}` | `{message}` | 둘 다 "여기 JS 표현식을 넣어라"는 뜻. JSX는 중괄호 하나 |
| `:src="imageUrl"` (v-bind) | `src={imageUrl}` | React는 속성값도 그냥 `{}`로 표현식 삽입 |
| `@click="handler"` (v-on) | `onClick={handler}` | 이벤트명이 camelCase (`onClick`, `onChange`) |
| `v-if="cond"` | `{cond && <p>...</p>}` 또는 `{cond ? <A/> : <B/>}` | React는 전용 디렉티브가 없고 **JS 연산자**로 표현 |
| `v-for="item in items" :key="..."` | `{items.map(item => <li key={item.id}>...</li>)}` | 배열의 `.map()` 메서드를 그대로 사용 |
| `class="..."` | `className="..."` | `class`는 JS 예약어라서 못 씀 |
| `v-model="value"` | `value={value} onChange={e => setValue(e.target.value)}` | React는 양방향 바인딩 문법이 없음 → 직접 값+핸들러 연결("Controlled Component") |

**한 줄 요약**: Vue는 "전용 문법(디렉티브)"으로 처리하던 것을, React는 대부분 **순수 JS 문법(`&&`, `map`, 삼항연산자)**으로 처리합니다. 그래서 JSX를 잘 쓰려면 JS 배열/조건문에 익숙해야 합니다.

### 2.3 JSX 규칙 몇 가지

- 반드시 **하나의 루트 요소**로 감싸야 함 (여러 개를 나란히 반환 불가) → 감쌀 태그가 필요 없으면 `<>...</>` (Fragment) 사용
- 태그는 반드시 닫아야 함 (`<img />`, `<br />`처럼 self-closing도 슬래시 필수)
- 주석은 `{/* 이렇게 */}`

```jsx
function App() {
  return (
    <>
      <h1>제목</h1>
      <p>본문</p>
    </>
  )
}
```

## 3. 컴포넌트 = 그냥 함수

Vue의 `.vue` 파일(SFC)은 template/script/style이 한 파일에 있는 특수한 형식이었습니다. React는 다릅니다.

> **컴포넌트 = JSX를 반환하는 평범한 JS 함수.** 파일 확장자는 `.jsx`(또는 TS면 `.tsx`)이고, 특수 문법이 아니라 그냥 함수 선언/화살표 함수입니다.

```jsx
// 이것이 React 컴포넌트의 전부
function Greeting({ name }) {
  return <p>안녕하세요, {name}님</p>
}

export default Greeting
```

- 함수 이름은 **반드시 대문자로 시작**해야 함 (`greeting`이 아니라 `Greeting`) — 소문자면 React가 일반 HTML 태그(`<div>`처럼)로 착각합니다.
- 함수의 매개변수가 **props**입니다 (Vue의 `defineProps`와 대응). 구조분해(`{ name }`)로 바로 꺼내 쓰는 게 관례입니다.
- "SFC" 개념 자체가 없으므로 CSS는 별도 파일(`.css`)을 import하거나, CSS Module, styled-components 같은 방식을 씁니다.

## 4. 상태(state) — `ref`/`reactive` → `useState`

### 4.1 Hook이란?

`useState`, `useEffect`처럼 `use`로 시작하는 함수들을 **Hook**이라고 부릅니다. "함수 컴포넌트에 상태나 생명주기 같은 기능을 갈고리(hook)처럼 걸어준다"는 의미입니다.

Vue의 Composition API(`ref`, `computed`, `watch`, `onMounted`)를 이미 배웠다면 개념 자체는 낯설지 않습니다 — **"함수 안에서 특별한 함수를 호출해 상태/부수효과를 다룬다"**는 아이디어가 똑같습니다. React의 Hook이 먼저 나왔고, Vue 3 Composition API가 이 아이디어에 영향을 받았습니다.

### 4.2 `useState` 미리보기 (자세한 건 study2)

```jsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

Vue의 `ref`와 비교:

| Vue | React |
|---|---|
| `const count = ref(0)` | `const [count, setCount] = useState(0)` |
| 읽기: `count.value` (템플릿에선 `count`) | 읽기: `count` (그대로) |
| 쓰기: `count.value = 1` (직접 대입) | 쓰기: `setCount(1)` (**반드시 setter 함수 호출**, 직접 대입 금지) |

**가장 중요한 차이**: Vue는 `.value`에 새 값을 대입하면 Vue가 알아서 변경을 감지합니다. React는 `count = 1`처럼 변수에 직접 대입해도 **화면이 갱신되지 않습니다.** 반드시 `setCount(...)`라는 전용 함수를 호출해야만 "이 컴포넌트를 다시 렌더링해줘"라고 React에게 알릴 수 있습니다. (이유: 자세한 원리는 study2에서 리렌더링 개념과 함께 다룹니다.)

## 5. 단방향 데이터 흐름 — Vue와 동일한 원칙

React도 Vue처럼 **props는 부모 → 자식으로만 내려간다**는 원칙을 따릅니다. 자식이 부모 데이터를 바꾸고 싶으면 부모가 **함수를 props로 내려주고**, 자식은 그 함수를 호출하는 방식을 씁니다.

- Vue: `defineEmits`로 커스텀 이벤트를 "발생"시킴 (`emit('like')`)
- React: 이벤트라는 개념이 따로 없고, 그냥 **함수를 props로 전달**해서 자식이 호출 (`onLike()`처럼 이름 짓는 게 관례)

```jsx
// 부모
function Parent() {
  const [liked, setLiked] = useState(false)
  return <LikeButton onLike={() => setLiked(true)} />
}

// 자식
function LikeButton({ onLike }) {
  return <button onClick={onLike}>좋아요</button>
}
```

즉 React의 "emit"은 **콜백 함수를 props로 내려주는 관례**일 뿐, 별도 문법이 없습니다.

## 6. Node.js / npm / Vite — Vue와 동일

이 부분은 [Vue study0의 0.4~0.5절](../vue.js/study0.md)에서 이미 다뤘고 React에서도 완전히 동일합니다.

- Node.js, npm, `package.json`, `node_modules` 개념 동일
- 번들러도 **Vite**를 그대로 사용 (`--template react`로 템플릿만 다르게 선택)

**실습 전 확인할 것**: 터미널에 `node -v`, `npm -v` 입력해서 버전 확인 (Node 18 이상 권장).

## 7. 기업형 프로젝트 구조 미리보기

Notion 학습 목표에 있는 "기업형으로 써 볼 구조"는 아래와 같은 폴더 구성을 의미합니다 (study10, studyFinal에서 실제로 적용).

```
src/
├─ api/          # 백엔드 호출 함수 모음 (axios 인스턴스, 엔드포인트별 함수)
├─ components/   # 여러 페이지에서 재사용하는 UI 조각
├─ hooks/        # 커스텀 훅 (useFetch, useAuth 등)
├─ pages/        # 라우트 하나당 화면 하나 (Vue의 views/에 대응)
├─ context/       # 전역 상태 (Context API / Zustand store)
└─ App.jsx
```

- **페이지 단위로 데이터 fetch 위치를 정한다**: 페이지 컴포넌트(`pages/PostList.jsx`)가 데이터를 가져오고, 하위 컴포넌트는 props로만 받는 구조를 기본으로 삼습니다.
- **에러/로딩/빈 상태를 항상 화면에 명시**: "로딩 중...", "에러 발생", "데이터 없음" 화면을 빼먹지 않는 습관 (study7에서 패턴화).

## 8. 학습 로드맵 (전체 목차)

| 문서 | 내용 |
|---|---|
| study0 (이 문서) | React 기초 이론, Vue와 비교 |
| study1 | Vite+React 프로젝트 생성, 명령어, JSX/컴포넌트/props 실습 |
| study2 | useState, 이벤트 핸들링, 리스트 렌더링(map+key), 조건부 렌더링 |
| study3 | useEffect, useRef, 커스텀 훅 맛보기 |
| study4 | 컴포넌트 분리(콜백 props), 폼 상태(Controlled Component)+검증 |
| study5 | React Router 기본 라우팅 (목록 → 상세) |
| study6 (고급1) | React Router 중첩 라우팅 + 보호된 라우트(Protected Route) |
| study7 (고급2) | axios/fetch API 연동, 커스텀 훅으로 추상화, 로딩/에러/빈 상태 |
| study8 (고급3) | Context API로 전역 로그인 상태 관리 |
| study9 (고급4) | Zustand로 전역 상태 관리 (Context와 비교) |
| study10 (고급5) | JS → TypeScript 전환, 기업형 폴더 구조, CORS 연동 |
| studyFinal | 지금까지 배운 것을 합쳐 미니 게시판 웹사이트 제작 |

각 단계는 이전 단계 위에 쌓이는 구조이므로 순서를 크게 건너뛰지 않는 걸 권장합니다.

---

## 부록: 용어 미니 사전 (Vue 대비 React 용어)

| 용어 | 한 줄 설명 |
|---|---|
| JSX | JS 안에서 HTML처럼 UI를 표현하는 문법 (컴파일되면 함수 호출이 됨) |
| Virtual DOM | 실제 DOM 대신 비교/계산에 쓰는 가상의 JS 객체 트리 |
| 컴포넌트 | JSX를 반환하는 함수. 이름은 대문자로 시작 |
| props | 부모→자식으로 내려주는 데이터(및 콜백 함수) |
| Hook | `use`로 시작하는, 함수 컴포넌트에 상태/부수효과를 부여하는 함수 |
| 리렌더링(re-render) | 상태가 바뀌어 컴포넌트 함수가 다시 실행되는 것 |
| Controlled Component | input의 값과 상태(state)를 직접 연결해 관리하는 방식 (v-model 대응) |
| Context API | React 내장 전역 상태 공유 기능 |
| Zustand | 서드파티 경량 전역 상태관리 라이브러리 (Pinia와 유사한 역할) |
| CORS | 브라우저가 다른 출처(도메인/포트)로의 API 요청을 제한하는 보안 정책, 백엔드에서 허용 설정 필요 |
