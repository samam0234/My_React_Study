# study0 — 환경 설정

> 🎯 **목표**: Node.js + Vite로 React 프로젝트를 만들고, 폴더 구조를 읽고, 개발 서버에서 첫 화면이 뜨는 것까지 확인한다.

- 이전: (시작)
- 다음: [study1.md](./study1.md) — Hello World와 기본 문법
- 이 문서의 실습 코드: [`JSX_study/demo`](./JSX_study/demo) (JavaScript + JSX). TypeScript 버전은 [`TSX_study/demo`](./TSX_study/demo)

---

## 📖 이론

### 0.1 React는 "프레임워크"가 아니라 "라이브러리"

React는 **화면(UI)을 만드는 부분**만 맡습니다. 라우팅(`react-router-dom`), HTTP 요청(`axios`), 전역 상태(`zustand`), 빌드(`vite`)는 각각 따로 골라 붙입니다. 그래서 "무엇을 설치했는지"가 곧 프로젝트의 구조입니다. 이 저장소의 선택은 아래와 같습니다. (출처: [`JSX_study/demo/package.json`](./JSX_study/demo/package.json))

| 역할 | 선택한 도구 | 버전(package.json 기준) |
|---|---|---|
| UI | `react`, `react-dom` | ^19.2.8 |
| 번들러·개발 서버 | `vite` + `@vitejs/plugin-react` | ^8.3.0 / ^6.1.1 |
| 라우팅 | `react-router-dom` | ^7.18.3 |
| HTTP | `axios` | ^1.20.0 |
| 전역 상태 | `zustand` | ^5.0.15 |
| 린트 | `oxlint` | ^1.81.0 |

### 0.2 Vite가 하는 일

- **개발 서버**: 코드를 저장하면 브라우저에 즉시 반영(HMR, Hot Module Replacement)합니다.
- **빌드**: `.jsx`/`.tsx`를 브라우저가 읽을 수 있는 JS로 묶어 `dist/` 폴더에 내보냅니다.
- 진입점은 `index.html` 하나입니다. 이 파일이 `src/main.jsx`를 불러오고, `main.jsx`가 React를 `#root`에 붙입니다.

### 0.3 핵심 용어

| 용어 | 한 줄 설명 |
|---|---|
| SPA | 페이지가 하나(`index.html`)이고, 화면 전환은 JS가 DOM을 바꿔서 처리 |
| 컴포넌트 | 화면 조각을 만드는 **함수**. 이름은 대문자로 시작 |
| JSX | JS 안에 HTML처럼 UI를 쓰는 문법 (`<h1>안녕</h1>`) |
| props | 부모가 자식에게 내려주는 읽기 전용 값 |
| state | 컴포넌트가 기억하는 값. 바뀌면 다시 그려짐 (`useState`) |
| Hook | `use`로 시작하는 React 함수 (`useState`, `useEffect` …) |
| Virtual DOM | 변경 전·후를 비교해 바뀐 부분만 실제 DOM에 반영하는 방식 |
| HMR | 저장하면 새로고침 없이 바뀐 모듈만 교체 |
| 번들러 | 흩어진 모듈을 배포용 파일로 묶는 도구 (Vite) |

---

## 🛠️ 실기

### 1. 설치 확인

```bash
node -v    # 18 이상 (이 저장소 README 기준)
npm -v
```

### 2. 프로젝트 생성

```bash
# JavaScript + JSX
npm create vite@latest demo -- --template react

# TypeScript + TSX (study14, TSX_study 용)
npm create vite@latest demo -- --template react-ts

cd demo
npm install
npm run dev     # 기본 http://localhost:5173
```

> ⚠️ 이 문서에 적은 명령은 설명용입니다. 저장소에는 이미 [`JSX_study/demo`](./JSX_study/demo)가 만들어져 있으므로, 처음부터 따라 해 보려면 **다른 폴더**에서 만드세요. (템플릿이 설치 시점에 따라 조금씩 달라질 수 있습니다.)

### 3. 만들어진 폴더 구조 (저장소 기준)

```text
JSX_study/demo/
├─ index.html          ← 유일한 HTML. #root + main.jsx 로딩
├─ package.json        ← 의존성·스크립트
├─ vite.config.js      ← Vite 설정 (react 플러그인)
├─ .oxlintrc.json      ← 린트 규칙
├─ public/             ← 그대로 복사되는 정적 파일 (favicon.svg)
└─ src/
   ├─ main.jsx         ← React 시작점
   ├─ App.jsx          ← 최상위 컴포넌트
   ├─ components/ pages/ hooks/ api/ store/ data/   ← 이후 study에서 추가
   └─ index.css, App.css
```

### 4. 코드 줄별 설명

#### 4.1 [`index.html`](./JSX_study/demo/index.html)

| 줄 | 코드 | 설명 |
|---|---|---|
| 5 | `<link rel="icon" ... href="/favicon.svg" />` | `public/favicon.svg`를 탭 아이콘으로 사용 (`public/`은 `/`로 접근) |
| 6 | `<meta name="viewport" ...>` | 모바일 화면 폭 맞춤 |
| 10 | `<div id="root"></div>` | React가 화면을 그려 넣을 빈 자리 |
| 11 | `<script type="module" src="/src/main.jsx">` | 진입 스크립트. `type="module"`이라 `import`를 쓸 수 있음 |

#### 4.2 [`src/main.jsx`](./JSX_study/demo/src/main.jsx)

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

| 줄 | 설명 |
|---|---|
| 1~2 | `StrictMode`는 개발 중 버그를 일찍 드러내는 도구, `createRoot`는 React 18+ 방식의 시작 함수 |
| 3 | CSS도 `import`로 가져옴 → Vite가 묶어 줌 |
| 4 | 최상위 컴포넌트. **JSX 프로젝트에서는 확장자 `.jsx`를 적어도 됨** |
| 6 | `#root` 요소를 찾아 React 루트로 만듦 (TS에서는 `!`가 필요: [`main.tsx:6`](./TSX_study/demo/src/main.tsx)) |
| 7~9 | `<App />`을 `StrictMode`로 감싸 렌더링. 개발 모드에서는 effect·렌더가 **일부러 두 번** 실행될 수 있음(→ study9) |

#### 4.3 [`vite.config.js`](./JSX_study/demo/vite.config.js)

```js
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
})
```

JSX를 변환해 주는 플러그인 한 줄이 전부입니다. 프록시·alias·환경 변수는 이후 study(6, 8, 9)에서 여기에 추가합니다.

#### 4.4 [`package.json`](./JSX_study/demo/package.json)의 scripts

| 스크립트 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 (`vite`) |
| `npm run build` | 배포용 빌드 → `dist/` (`vite build`) |
| `npm run preview` | 빌드 결과를 로컬에서 확인 (`vite preview`) |
| `npm run lint` | `oxlint` 실행 |

TSX 프로젝트에서는 build가 `tsc -b && vite build`로 바뀌어 **타입 검사가 먼저** 돌아갑니다 ([`TSX_study/demo/package.json`](./TSX_study/demo/package.json)).

### 5. 실행 확인 (직접 해 볼 것)

1. `npm install` 이 끝났는가 (`node_modules/` 생성)
2. `npm run dev` 후 터미널에 표시된 주소(`http://localhost:5173`)를 열면 화면이 뜨는가
3. `src/App.jsx`의 글자를 바꿔 저장하면 **새로고침 없이** 바뀌는가 (HMR)
4. `npm run build`가 에러 없이 끝나고 `dist/`가 생기는가

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| `npm create vite@latest demo --template react`로 템플릿이 적용되지 않음 | npm 버전에 따라 `--` 없이 넘기면 옵션이 vite에 전달되지 않음 | `npm create vite@latest demo -- --template react` 처럼 `--` 뒤에 옵션 |
| `Port 5173 is in use` | 다른 dev 서버가 켜져 있음 | 기존 서버 종료 또는 `npm run dev -- --port 5174` |
| `Cannot find module 'react'` | `npm install`을 안 함 / 다른 폴더에서 실행 | 프로젝트 루트(`package.json` 위치)에서 `npm install` |
| 화면이 하얗고 콘솔에 `Uncaught ...` | JSX 문법 오류, import 경로 오류 | 브라우저 개발자 도구(F12) Console 첫 에러부터 확인 |
| Windows PowerShell에서 스크립트 실행 차단 메시지 | 실행 정책 | `npm`은 보통 문제없음. 필요 시 Git Bash 또는 `cmd` 사용 |

---

## ☐ 체크리스트

- [ ] `node -v`, `npm -v`가 정상 출력된다
- [ ] Vite + React 프로젝트를 새로 만들고 `npm run dev`로 화면을 띄웠다
- [ ] `index.html` → `main.jsx` → `App.jsx` 순서로 화면이 그려지는 흐름을 말로 설명할 수 있다
- [ ] `public/`과 `src/`의 차이(정적 복사 vs 번들 대상)를 설명할 수 있다
- [ ] `dev` / `build` / `preview` / `lint` 스크립트가 각각 무엇인지 안다
- [ ] 핵심 용어(컴포넌트, JSX, props, state, Hook, Virtual DOM)를 한 줄씩 말할 수 있다
- [ ] 노션 학습 목표 "Vite + React + JS 후 TS로 전환"의 **첫 절반(Vite + React + JS)** 을 끝냈다

---

## ➡️ 다음 단계 연결

[study1](./study1.md)에서 `App.jsx`를 직접 고쳐 **첫 화면(Hello World)** 을 띄우고, JSX 문법(표현식 `{}`, 조건부 렌더링, 리스트)을 익힙니다.
