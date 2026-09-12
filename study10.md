# study10 (고급 기술 구현 5) — TypeScript 전환, 기업형 폴더 구조, CORS 연동

마지막 "고급" 단계입니다. 지금까지 JS로 만들어온 `demo/` 전체를 TypeScript로 전환하고, 지금까지 자연스럽게 쌓여온 폴더 구조를 "기업형 구조"로 정리한 뒤, 실제 백엔드와 연동할 때 반드시 마주치는 **CORS** 개념을 정리합니다.

```
- [x] Vite + React + JS 후 TS로 전환                   (이번 문서 — 체크리스트 완전히 완료!)
- [x] 함수 컴포넌트, props, children
- [x] useState / useEffect / useRef
- [x] 리스트 렌더링과 key
- [x] React Router 중첩 라우팅
- [x] 폼 상태 다루기 + API 연동 (axios / fetch)
- [x] Context 또는 Zustand로 전역 상태 (로그인)
- [x] 백엔드(Django/FastAPI/Nest/Spring) 와 CORS 연동    (개념 정리 — 실제 백엔드는 studyFinal에서 목업으로 대체)
```

대응하는 실습 프로젝트: [`demo/`](./demo) — 모든 `.jsx`/`.js` 파일을 `.tsx`/`.ts`로 전환

---

## 1. JS → TS 전환 절차

### 1.1 패키지 설치

```bash
npm install -D typescript @types/react @types/react-dom @types/node
```

### 1.2 설정 파일 추가

Vite는 `--template react-ts`로 처음부터 TS 프로젝트를 만들 수도 있지만, 이번엔 **이미 만든 JS 프로젝트를 나중에 전환**하는 실무에 더 흔한 시나리오를 실습했습니다. 새 `react-ts` 템플릿을 참고용으로 하나 만들어서 설정 파일 3개를 그대로 가져왔습니다.

```
demo/
├─ tsconfig.json         # tsconfig.app.json / tsconfig.node.json을 가리키기만 하는 진입점
├─ tsconfig.app.json      # src/ 코드에 적용되는 설정 (JSX, 브라우저 lib 등)
└─ tsconfig.node.json     # vite.config.ts 자체에 적용되는 설정 (Node 환경)
```

앱 코드용 설정과 빌드 설정용 설정을 분리하는 이유: `vite.config.ts`는 Node.js 환경에서 실행되고 `src/` 코드는 브라우저 환경을 대상으로 하므로, 사용 가능한 전역 타입(`lib`)이 서로 다르기 때문입니다.

### 1.3 파일 확장자 변경

```bash
# 컴포넌트/페이지: .jsx → .tsx (JSX 문법을 쓰는 파일)
# 나머지 로직: .js → .ts
mv src/App.jsx src/App.tsx
mv src/main.jsx src/main.tsx
mv src/components/*.jsx → *.tsx  (전체)
mv src/pages/*.jsx → *.tsx        (전체)
mv src/api/*.js src/hooks/*.js src/store/*.js src/data/*.js → *.ts
mv vite.config.js vite.config.ts
```

`index.html`의 진입점도 `main.jsx` → `main.tsx`로 바꿔줘야 합니다.

### 1.4 빌드 스크립트 변경

```diff
- "build": "vite build",
+ "build": "tsc -b && vite build",
```

Vite는 내부적으로 esbuild로 TS를 "타입 검사 없이 그냥 지워서" 빠르게 변환합니다 (즉 `vite build`만으로는 **타입 에러가 있어도 빌드가 성공**할 수 있음). 그래서 `tsc -b`(TypeScript 컴파일러의 타입 검사만 수행, `noEmit: true`라 실제 JS 파일은 안 만듦)를 먼저 실행해 타입 에러를 걸러내고, 통과하면 `vite build`로 실제 번들을 만드는 2단계 구성이 표준입니다.

## 2. 실제로 타입을 붙이며 배운 것들

### 2.1 Props 타입 — `interface`

```tsx
interface FruitCardProps {
  fruit: StockFruit
}

function FruitCard({ fruit }: FruitCardProps) {
  /* ... */
}
```

JS에서는 `FruitCard`에 엉뚱한 모양의 객체를 넘겨도(`inStock` 대신 `stock`이라고 오타를 내도) 실행해봐야 알 수 있었지만, TS에서는 **컴파일 시점에 바로** 에러를 알려줍니다.

### 2.2 여러 컴포넌트가 공유하는 타입 — `types.ts`

```ts
// types.ts
export interface StockFruit {
  id: number
  name: string
  inStock: boolean
}
```

`FruitListPractice`, `FruitInventoryPractice`, `FruitCard`가 전부 이 타입을 가져다 씁니다. Vue 프로젝트라면 JSDoc이나 별도 `.d.ts`로 비슷한 걸 했겠지만, TS는 이런 도메인 타입 공유가 언어 차원에서 자연스럽습니다.

### 2.3 제네릭 — `useFetch<T>`

```ts
export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  // ...
  return { data, loading, error }
}
```

```tsx
const { data: posts } = useFetch<Post[]>(() => fetchPosts({ page, limit }), [page])
// posts의 타입이 자동으로 Post[] | null 로 추론됨
```

study7에서 만든 커스텀 훅은 원래 "아무 데이터나" 다룰 수 있게 설계했습니다. **제네릭(`<T>`)**은 "이 훅을 실제로 호출하는 쪽에서 T가 뭔지 알려주면, 반환값의 타입도 그에 맞게 정해진다"는 뜻입니다 — 훅 코드 자체는 한 번만 작성하고, 쓰는 곳마다 다른 타입으로 안전하게 재사용할 수 있습니다.

### 2.4 Zustand 스토어 타입

```ts
export interface User {
  name: string
  email: string
}

interface AuthState {
  user: User | null
  login: (userData: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null }),
}))
```

`create<AuthState>()`처럼 스토어의 "모양"을 미리 선언해두면, 이후 `useAuthStore((state) => state.user)`라고 쓸 때 `user`의 타입이 자동으로 `User | null`로 추론됩니다.

### 2.5 TS가 실제로 버그를 잡아준 순간 — `MyPage.tsx`

```tsx
function MyPage() {
  const user = useAuthStore((state) => state.user) // 타입: User | null

  // user.name  ← 이렇게 바로 쓰면 타입 에러!
  // "user가 null일 수도 있는데 확인 안 했잖아" 라고 컴파일러가 경고함

  if (!user) return null // 방어 코드를 강제로 추가하게 됨

  return <p>{user.name}님, 환영합니다.</p>
}
```

JS 버전(study8, study9)에서는 "`ProtectedRoute`를 거쳤으니 `user`는 항상 있을 것"이라고 **암묵적으로 가정**하고 `user.name`을 바로 썼습니다. 실제로는 문제가 없었지만, 코드만 봐서는 그 가정이 어디에도 적혀있지 않았습니다. TS로 바꾸자 `user: User | null` 타입이 이 가정을 **강제로 드러내고**, null 체크를 안 하면 컴파일이 안 되게 만들었습니다. "우연히 안전한 코드"가 "타입으로 보장된 안전한 코드"가 되는 것 — 이게 TS 도입의 실질적인 이득 중 하나입니다.

### 2.6 이 프로젝트의 특이한 점 — `.ts`/`.tsx` 확장자를 import에 직접 씀

```ts
import { fetchPosts, type Post } from '../api/posts.ts'
```

일반적인 TS 예제에서는 확장자 없이 `from '../api/posts'`라고 쓰는 경우가 많지만, 이 프로젝트는 study1부터 `from './FruitCard.jsx'`처럼 **명시적 확장자**를 쓰는 스타일을 유지해왔습니다. `tsconfig.app.json`의 `moduleResolution: "bundler"` + `allowImportingTsExtensions: true` 조합 덕분에 `.ts`/`.tsx`를 직접 써도 됩니다 (단, `noEmit: true`인 프로젝트에서만 가능 — Vite처럼 tsc가 직접 JS를 만들지 않고 번들러가 처리하는 구조라 가능한 방식입니다).

### 2.7 `import type` — 값과 타입 분리해서 import

```ts
import type { ReactNode } from 'react'
import { fruitCatalog, type CatalogFruit } from '../data/fruitCatalog.ts'
```

`tsconfig.app.json`의 `verbatimModuleSyntax: true` 설정 때문에, "런타임에 실제로 존재하는 값"과 "컴파일 시점에만 존재하고 지워지는 타입"을 import 문에서 명확히 구분해야 합니다. `type` 키워드가 붙은 건 빌드 시 완전히 사라지고, 안 붙은 건 실제 JS로 남습니다.

## 3. 기업형 폴더 구조 최종 정리

study0 7장에서 예고했던 구조가 `demo/` 안에 자연스럽게 완성되었습니다.

```
demo/src/
├─ api/            # 백엔드 호출 함수 (axios 인스턴스 + 엔드포인트 함수)
│  ├─ client.ts
│  └─ posts.ts
├─ components/     # 여러 페이지에서 재사용하는 UI 조각
│  ├─ AuthStatus.tsx
│  ├─ ProtectedRoute.tsx
│  └─ ...
├─ hooks/          # 커스텀 훅
│  └─ useFetch.ts
├─ pages/          # 라우트 하나당 화면 하나
│  ├─ HomeView.tsx
│  ├─ FruitCatalogPage.tsx
│  └─ ...
├─ store/          # 전역 상태 (Zustand)
│  └─ authStore.ts
├─ data/           # (실습용 목업 데이터 — 실제로는 보통 api/ 응답으로 대체됨)
│  └─ fruitCatalog.ts
├─ types.ts        # 여러 곳에서 공유하는 도메인 타입
├─ App.tsx
└─ main.tsx
```

- **페이지(`pages/`)가 데이터 fetch를 담당**: `PostListPage`가 `useFetch`+`fetchPosts`를 직접 호출하고, 하위 컴포넌트는 필요하면 props로 데이터를 받는 구조를 유지했습니다.
- **`api/`는 axios/백엔드 URL을 아는 유일한 계층**: 컴포넌트는 `fetchPosts()`처럼 "무엇을 하는지"만 아는 함수를 부릅니다. 엔드포인트가 바뀌거나 백엔드가 바뀌어도 `api/` 폴더만 고치면 됩니다.

## 4. 백엔드 연동과 CORS

### 4.1 CORS가 뭔가

**CORS (Cross-Origin Resource Sharing)**: 브라우저가 "지금 열려있는 페이지의 출처(origin)"와 "요청을 보내는 서버의 출처"가 다르면, 기본적으로 그 응답을 막는 보안 정책입니다.

> **출처(origin)** = 프로토콜 + 도메인 + 포트. `http://localhost:5173`과 `http://localhost:8000`은 포트만 달라도 **다른 출처**입니다.

React 개발 서버(Vite, 보통 `:5173`)에서 백엔드 API 서버(Django/FastAPI/Nest/Spring, 보통 `:8000`이나 `:3000` 등)로 axios 요청을 보내면, 별다른 설정이 없는 한 브라우저 콘솔에 다음과 비슷한 에러가 뜹니다.

```
Access to XMLHttpRequest at 'http://localhost:8000/api/posts' from origin
'http://localhost:5173' has been blocked by CORS policy: No
'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 4.2 해결 — 백엔드가 허용 헤더를 내려줘야 함

CORS는 **요청을 보내는 프론트엔드가 아니라, 응답하는 백엔드가 해결해야 하는 문제**입니다. 백엔드가 응답에 아래와 같은 헤더를 포함시키면 브라우저가 허용합니다.

```
Access-Control-Allow-Origin: http://localhost:5173
```

프레임워크별 설정 예시 (개념만 — 실제 코드는 각 프레임워크 문서 참고):

| 백엔드 | 설정 방법(개념) |
|---|---|
| Django | `django-cors-headers` 패키지 설치 후 `CORS_ALLOWED_ORIGINS`에 프론트 주소 등록 |
| FastAPI | `CORSMiddleware` 추가, `allow_origins=["http://localhost:5173"]` |
| NestJS | `app.enableCors({ origin: 'http://localhost:5173' })` |
| Spring | `@CrossOrigin(origins = "http://localhost:5173")` 또는 전역 `WebMvcConfigurer` 설정 |

### 4.3 프리플라이트(Preflight) 요청

`POST`/`PUT`/`DELETE`나 `Content-Type: application/json` 같은 "단순하지 않은" 요청을 보내면, 브라우저는 실제 요청 전에 `OPTIONS` 메서드로 **먼저 물어봅니다** ("이 출처에서 이런 요청을 보내도 되나요?"). 백엔드가 `OPTIONS` 요청에도 올바른 CORS 헤더로 응답해야, 그 다음에야 진짜 요청(`POST` 등)이 나갑니다. 로그인 폼(study4)처럼 JSON을 `POST`하는 요청은 대부분 이 프리플라이트를 거칩니다.

### 4.4 쿠키 기반 인증이라면 — `credentials`

세션 쿠키로 로그인 상태를 유지하는 백엔드라면 양쪽에 설정이 하나씩 더 필요합니다.

```js
// axios 쪽 (프론트)
export const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true, // 쿠키를 요청에 실어 보냄
})
```

```
# 백엔드 응답 헤더
Access-Control-Allow-Origin: http://localhost:5173   # * 불가능, 정확한 출처 명시 필요
Access-Control-Allow-Credentials: true
```

### 4.5 개발 중 임시 우회 — Vite 프록시

당장 백엔드의 CORS 설정을 바꿀 권한이 없거나, 개발 중에만 간단히 우회하고 싶다면 Vite의 프록시 기능을 씁니다.

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000', // /api로 오는 요청을 백엔드로 대신 전달
    },
  },
})
```

이렇게 하면 브라우저 입장에서는 **항상 같은 출처(`localhost:5173`)에만 요청하는 것**처럼 보이고, Vite 개발 서버가 뒤에서 실제 백엔드로 중계해줍니다. 단, 이건 **개발 서버 한정** 트릭이라 프로덕션 배포 시에는 결국 백엔드의 정식 CORS 설정이나 리버스 프록시(Nginx 등)가 필요합니다.

## 5. 실행 확인

```bash
cd demo
npm install
npm run build   # tsc -b (타입 검사) && vite build
npm run dev
```

- `npm run build` 실행 시 타입 에러 없이 통과하는지 (일부러 `FruitCard`에 `fruit={{ id: 1 }}`처럼 필드가 빠진 객체를 넘겨보고, 빌드가 실패하는지 확인해보면 TS의 효과를 체감할 수 있습니다 — 확인 후 원래 코드로 되돌리기)
- study1~9에서 확인했던 모든 시나리오(과일 목록, 검색, 로그인, 라우팅, API 페이지네이션)가 TS 전환 후에도 동일하게 동작하는지
- 브라우저 콘솔에 타입 관련 경고나 에러가 없는지

## 6. 다음 단계 (studyFinal)

지금까지 만든 모든 요소를 새 프로젝트(`project/`)에 모아서 미니 게시판 웹사이트를 완성합니다:

- Vue.js 학습에서 만든 미니 게시판을 React + TypeScript로 재구현
- 로그인 후에만 접근 가능한 보호된 라우트
- 페이지네이션이 적용된 게시글 목록
- 지금까지 배운 기업형 폴더 구조 그대로 적용
