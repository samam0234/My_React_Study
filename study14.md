# study14 — TypeScript·타입·정적 분석

> 🎯 **목표**: tsconfig 옵션의 의미를 이해하고, API 응답·props·스토어에 타입을 적용하며, 린트(oxlint)·포매터(Prettier)·타입 검사를 스크립트와 자동 검사로 묶는다.

- 이전: [study13.md](./study13.md) — 생태계 라이브러리
- 다음: [study15.md](./study15.md) — 고급 테스트·CI
- 대상 코드: [`TSX_study/project`](./TSX_study/project) — [`tsconfig.app.json`](./TSX_study/project/tsconfig.app.json), [`types.ts`](./TSX_study/project/src/types.ts), [`useFetch.ts`](./TSX_study/project/src/hooks/useFetch.ts), [`.oxlintrc.json`](./TSX_study/project/.oxlintrc.json)

> ✅ **실제 코드와 검증**: [`TSX_study/final`](./TSX_study/final)에 `strict: true`(+ `noUncheckedIndexedAccess`)를 **처음부터** 켜고, zod 스키마로 타입을 만들고, `npm run check`(타입 검사 + oxlint + Prettier)를 통과시켰습니다. 기존 `TSX_study/project`는 `strict`가 꺼진 채 그대로입니다. husky/lint-staged와 type-aware 린트는 적용하지 않았습니다.

---

## 📖 이론

### 14.1 TypeScript가 주는 것

- 컴파일(빌드) 단계에서 **타입 오류를 차단**: 빠진 prop, 잘못된 필드, `null` 접근
- 에디터 자동완성·리팩터링 안전성
- 타입은 **실행 시에는 사라집니다.** 서버가 약속과 다른 JSON을 주면 런타임 오류가 납니다 → 필요하면 `zod` 같은 런타임 검증

### 14.2 정적 분석 3종

| 도구 | 잡는 것 | 이 저장소 |
|---|---|---|
| **타입 검사** (`tsc`) | 타입 오류 | `tsc -b` (build에 포함) |
| **린터** | 버그 패턴·규칙 위반 (Hook 규칙 등) | `oxlint` |
| **포매터** | 들여쓰기·따옴표 등 **스타일 통일** | (아직 없음 → Prettier 추가) |

린터는 "잘못될 수 있는 코드", 포매터는 "보기 좋은 모양"을 다룹니다. 역할이 달라 같이 씁니다.

---

## 🛠️ 실기

### 1. `tsconfig.app.json` 줄별 설명

[`tsconfig.app.json`](./TSX_study/project/tsconfig.app.json)

| 옵션 | 의미 |
|---|---|
| `"target": "es2023"`, `"lib": ["ES2023","DOM"]` | 사용할 JS 기능과 DOM 타입 |
| `"module": "esnext"`, `"moduleResolution": "bundler"` | Vite 같은 번들러 방식의 모듈 해석 |
| `"types": ["vite/client"]` | `import.meta.env`, 이미지 import 등 Vite 전용 타입 |
| `"jsx": "react-jsx"` | JSX 변환 방식 (React import 불필요) |
| `"noEmit": true` | `tsc`는 **검사만** 하고 파일을 만들지 않음 (변환은 Vite) |
| `"allowImportingTsExtensions": true` | `import './App.tsx'`처럼 **확장자를 적는 import 허용** — 이 저장소가 import에 `.ts/.tsx`를 쓰는 이유 |
| `"verbatimModuleSyntax": true` | 타입만 import할 때 **`import type`을 강제** (예: `import type { Post } from '../types.ts'`) |
| `"erasableSyntaxOnly": true` | 컴파일 후 코드가 필요한 문법(`enum`, 생성자 매개변수 프로퍼티 등) **금지** → 타입을 지우기만 해도 JS가 되는 문법만 허용 |
| `"noUnusedLocals"` / `"noUnusedParameters"` | 안 쓰는 변수·매개변수가 있으면 **오류** (build 실패) |
| `"noFallthroughCasesInSwitch"` | switch의 `break` 누락 방지 |
| `"skipLibCheck": true` | 라이브러리 `.d.ts` 검사를 건너뛰어 속도 확보 |

> 이 설정에는 `"strict": true`가 **명시되어 있지 않습니다.** (`strict`가 꺼져 있으면 `null` 검사가 느슨할 수 있음.) 실무에서는 `"strict": true`를 켜는 것이 일반적이므로, 켜 본 뒤 나오는 오류를 직접 고치는 것이 좋은 연습입니다. 켜기 전/후 오류 개수를 기록해 보세요.

`tsconfig.json`은 `references`로 `tsconfig.app.json`(앱 코드)과 `tsconfig.node.json`(`vite.config.ts`)을 나눕니다. `tsc -b`는 이 참조를 따라 **둘 다 검사**합니다.

### 2. 타입을 붙이는 4곳 (저장소 코드 기준)

**① 도메인 타입** — [`types.ts`](./TSX_study/project/src/types.ts)

```ts
export interface Post { id: number; userId: number; title: string; body: string }
export interface Comment { id: number; postId: number; name: string; email: string; body: string }
export interface User { name: string; email: string }
```

**② props** — [`PostCard.tsx:5-9`](./TSX_study/project/src/components/PostCard.tsx), [`ProtectedRoute.tsx:5-7`](./TSX_study/project/src/components/ProtectedRoute.tsx) (`children: ReactNode`)

**③ 이벤트** — [`LoginPage.tsx:29`](./TSX_study/project/src/pages/LoginPage.tsx): `ChangeEvent<HTMLInputElement>`, `FormEvent<HTMLFormElement>`

**④ 제네릭 훅** — [`useFetch.ts:10`](./TSX_study/project/src/hooks/useFetch.ts)

```ts
export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[]): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  ...
  setError(err instanceof Error ? err : new Error(String(err)))
```

| 줄 | 설명 |
|---|---|
| `<T>` | 호출할 때 `useFetch<Post[]>(...)`로 **결과 타입을 지정**. 같은 훅이 어떤 데이터에도 재사용됨 |
| `useState<T \| null>(null)` | 초기값 `null`이므로 "데이터 없음"까지 타입에 표현 → 사용하는 쪽이 `null` 처리를 강제당함 |
| `err instanceof Error ? …` | `catch`의 `err`는 `unknown`. **좁히기(narrowing)** 후 사용 |

`MyPage.tsx:10`의 `if (!user) return null`도 `User | null` 때문에 TS가 강제한 방어 코드입니다.

**API 응답 타입**: [`posts.ts`](./TSX_study/project/src/api/posts.ts)의 `apiClient.get<Post[]>(...)`처럼 **제네릭으로 응답 타입 지정**. 단, 이는 "그렇게 믿겠다"는 선언일 뿐 런타임 검증은 아닙니다.

### 3. 런타임 검증 — `zod` (API 응답·폼 공통)

```bash
npm i zod
```

```ts
import { z } from 'zod'

export const PostSchema = z.object({
  id: z.number(), userId: z.number(), title: z.string(), body: z.string(),
})
export type Post = z.infer<typeof PostSchema>           // 스키마에서 타입을 만든다 (한 곳에서 관리)

export async function fetchPosts(...): Promise<Post[]> {
  const res = await apiClient.get('/posts', { params })
  return z.array(PostSchema).parse(res.data)            // 약속과 다르면 즉시 오류
}
```

### 4. 린터 — `oxlint` (이미 설치됨)

[`.oxlintrc.json`](./TSX_study/project/.oxlintrc.json)

```json
{
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

| 규칙 | 설명 |
|---|---|
| `react/rules-of-hooks` (error) | 조건문 안에서 훅 호출 등 **Hook 규칙 위반을 오류로** (study9, 12의 함정을 정적으로 차단) |
| `react/only-export-components` (warn) | 컴포넌트 파일에서 컴포넌트가 아닌 것을 export하면 경고 (Fast Refresh 보호) |

```bash
npm run lint
```

타입 정보를 활용하는 규칙(type-aware)은 `oxlint-tsgolint`를 설치하고 `"options": { "typeAware": true }`를 켭니다 — [`TSX_study/project/README.md`](./TSX_study/project/README.md)에 안내가 있습니다. 규칙 이름·옵션은 설치한 버전의 문서로 확인하세요.

> 대안: ESLint + `typescript-eslint` + `eslint-plugin-react-hooks`. 이 저장소는 oxlint를 선택했습니다. 팀 규칙이 ESLint 기반이면 그쪽에 맞춥니다.

### 5. 포매터 — Prettier 추가

```bash
npm i -D prettier
```

```json
// .prettierrc
{ "semi": false, "singleQuote": true, "trailingComma": "all", "printWidth": 100 }
```

```json
// .prettierignore
dist
node_modules
package-lock.json
```

현재 코드 스타일(세미콜론 없음, 작은따옴표)과 맞춘 설정 예입니다. 처음 적용할 때는 **포맷만 바뀐 커밋을 따로** 분리합니다(COMMIT_GUIDE: 서로 다른 목적을 섞지 않기, `style:` 타입).

### 6. 스크립트로 묶기 + 자동 검사

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "typecheck": "tsc -b",
  "lint": "oxlint",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "check": "npm run typecheck && npm run lint && npm run format:check"
}
```

**커밋 전 자동 검사(선택)**

```bash
npm i -D husky lint-staged
npx husky init
```
```json
// package.json
"lint-staged": { "*.{ts,tsx}": ["oxlint", "prettier --write"] }
```

(`.husky/pre-commit`에 `npx lint-staged`.) CI에서도 `npm run check`를 실행하면 개인 설정과 무관하게 같은 기준을 강제합니다 → study15.

### 7. 직접 확인

1. `PostCard`에 `isFavorite`를 안 넘기고 빌드 → `tsc` 오류 확인 (study10 `FruitCard` 실험의 TSX 버전)
2. `useFetch<Post[]>`의 결과에서 `data.map`을 `null` 확인 없이 쓰면 오류가 나는지
3. 쓰지 않는 변수를 일부러 만들어 `noUnusedLocals` 오류 확인
4. `useEffect` 안에 조건부로 `useState`를 넣어 `oxlint`가 잡는지
5. `"strict": true`를 켜고 오류 개수 기록 후 하나씩 수정

---

## ✅ 실제 적용 결과 (`TSX_study/final`)

| 항목 | 위치 / 결과 |
|---|---|
| `strict: true`, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `noUnused*` | [`tsconfig.app.json`](./TSX_study/final/tsconfig.app.json) — `npm run typecheck`(`tsc -b`) 통과 |
| `paths: { "@/*": ["./src/*"] }` + Vite `resolve.alias` **양쪽** 설정 | `tsconfig.app.json`, [`vite.config.ts`](./TSX_study/final/vite.config.ts) |
| 타입은 zod 스키마에서 추론 (`z.infer`), API 응답은 런타임 검증 | [`types.ts`](./TSX_study/final/src/types.ts), `api/*.ts` |
| `ApiError`를 **생성자 매개변수 프로퍼티 없이** 선언 (`erasableSyntaxOnly` 때문) | [`api/errors.ts`](./TSX_study/final/src/api/errors.ts) |
| 린트 | `npm run lint` — oxlint **경고·오류 0** (한 번 `only-export-components` 경고가 나와 테스트 유틸을 파일 분리해 해결) |
| 포맷 | Prettier (`.prettierrc.json`: 세미콜론 없음, 작은따옴표, `printWidth: 100`), `format:check` 통과 |
| 한 번에 검사 | `npm run check` = typecheck + lint + format:check |
| 환경 변수 타입 | [`vite-env.d.ts`](./TSX_study/final/src/vite-env.d.ts) |

### 이 설정이 실제로 막아 준 것

- `noUncheckedIndexedAccess`: 테스트에서 `array[0]`이 `T | undefined`라 `?.`/`!`를 의식적으로 써야 했다.
- `erasableSyntaxOnly`: `constructor(public status: number …)` 형태가 오류 → 필드를 따로 선언.
- Vite 설정에서 `loadEnv`는 `vitest/config`가 아니라 `vite`에서 가져와야 한다는 타입 오류.
- E2E 파일의 `page.evaluate` 안 `document`/`window` 사용이 `tsconfig.node.json`(`lib`에 DOM 없음)에서 오류 → `lib`에 `"DOM"` 추가.

### 하지 않은 것

- `strict`를 **끈 상태에서 켠 상태로** 바꿀 때의 오류 개수 측정 (처음부터 켰으므로 전·후 비교 없음)
- husky + lint-staged, type-aware 린트(`oxlint-tsgolint`), ESLint 병행

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| `TS5097: An import path can only end with a '.tsx' extension when 'allowImportingTsExtensions' is enabled` | 확장자 포함 import인데 옵션 꺼짐 | `allowImportingTsExtensions` (이 저장소는 켜져 있음, 번들러 모드 전용) |
| `'X' is a type and must be imported using a type-only import when 'verbatimModuleSyntax'…` | 타입을 값처럼 import | `import type { X }` 또는 `import { type X }` |
| `This syntax is not allowed when 'erasableSyntaxOnly' is enabled` | `enum`, `constructor(private x)` 사용 | 유니온 리터럴 타입(`'a' \| 'b'`), `as const` 객체 사용 |
| `Object is possibly 'null'` | `User \| null` 등을 확인 없이 사용 | 조기 `return`, `?.`, 좁히기 |
| `'x' is declared but its value is never read` | `noUnusedLocals` | 사용하거나 제거 |
| `catch (err)`의 `err`가 `unknown` | TS 기본(권장) | `err instanceof Error` 확인 후 사용 |
| `any`로 도망가기 | 빠른 해결 | `unknown` + 좁히기, 또는 정확한 타입 작성 |
| `as` 타입 단언으로 오류만 숨김 (`location.state as LocationState`) | 런타임 보증 없음 ([`LoginPage.tsx:22`](./TSX_study/project/src/pages/LoginPage.tsx)) | `?.`로 방어(이 코드는 `state?.from?.pathname || '/'`로 방어 중), 가능하면 검증 |
| Prettier와 린터 규칙 충돌 | 스타일 규칙이 겹침 | 스타일은 Prettier에 맡기고 린터는 버그 규칙 위주로 |
| `tsc -b`가 `vite.config.ts`에서 실패 | `tsconfig.node.json` 범위 문제 (`@types/node`, `types: ["node"]`) | `@types/node` 설치 확인 |

---

## ☐ 체크리스트

- [ ] `tsconfig.app.json`의 `allowImportingTsExtensions` / `verbatimModuleSyntax` / `erasableSyntaxOnly` / `noUnused*`의 의미를 각각 설명할 수 있다
- [ ] 타입이 "실행 시에는 사라진다"는 점과 그래서 런타임 검증(`zod`)이 필요한 경우를 설명할 수 있다
- [x] props, 이벤트, 제네릭 훅(`useFetch<T>`), 스토어(`create<State>()`)에 타입을 직접 붙였다
- [ ] `strict: true`를 켜 보고 나온 오류를 수정했다 (전: ___개 → 후: 0개) — `final`은 처음부터 `strict`라 전·후 비교는 하지 않음
- [x] `npm run lint`를 실행하고 `rules-of-hooks`가 잡는 사례를 확인했다
- [x] Prettier를 설치하고 `format` / `format:check` 스크립트를 만들었다
- [x] `check` 스크립트 하나로 타입·린트·포맷을 한 번에 검사한다
- [ ] (선택) husky + lint-staged로 커밋 전 자동 검사를 걸었다

---

## ➡️ 다음 단계 연결

품질 검사를 사람이 기억해서 돌리지 않도록, [study15](./study15.md)에서 **단위·통합·E2E 테스트와 CI 자동화**로 묶습니다.
