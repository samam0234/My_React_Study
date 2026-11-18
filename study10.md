# study10 — 배포·정리 (기초 구간 총정리)

> 🎯 **목표**: 프로젝트를 빌드하고 `preview`로 확인한 뒤 외부에 배포하고(SPA fallback·환경 변수 포함), study0~9를 복습 문제로 점검한다.

- 이전: [study9.md](./study9.md) — 테스트·디버깅
- 다음: [studyMidpoint.md](./studyMidpoint.md) — 중간 응용
- 실습 대상: [`TSX_study/project`](./TSX_study/project) (`npm run build` = `tsc -b && vite build`)

---

## 📖 이론

### 10.1 빌드가 하는 일

| 단계 | 내용 |
|---|---|
| 타입 검사 | `tsc -b` — 타입 오류가 있으면 **빌드 실패** (TSX 프로젝트) |
| 번들링 | `vite build` — 모듈을 묶고 압축, 파일명에 **해시** 부여 (`assets/index-ab12cd.js`) |
| 결과물 | `dist/` — `index.html` + `assets/` + `public/`의 파일들 |

`dist/`는 **정적 파일**이라 Node 서버 없이 Nginx·CDN·정적 호스팅 어디든 올릴 수 있습니다. (`.gitignore`에 `dist`가 있어 커밋 대상이 아닙니다.)

### 10.2 배포 시 꼭 챙길 3가지

1. **SPA fallback**: `/posts/3`를 새로고침/직접 입력했을 때 `index.html`을 돌려줘야 함 (study4 §6)
2. **환경 변수**: 빌드 때 `.env.production`이 박힘. API 주소가 운영용인지 확인 (study8)
3. **API 연결**: 같은 도메인 + 프록시면 CORS 불필요, 다른 도메인이면 백엔드 CORS에 **배포된 프론트 주소** 등록 (study6)

### 10.3 어디에 올릴까 (노션 정리)

| 대상 | 맞는 것 | 메모 |
|---|---|---|
| Vercel | 정적 SPA | Git 연결만 하면 PR마다 미리보기 URL, HTTPS 자동 |
| Netlify | 정적 SPA | `_redirects`로 SPA 새로고침 처리 |
| Render | 백엔드(Spring Docker 등), PostgreSQL | 무료 플랜은 잠들었다 깨어나는 지연 |
| VPS + Docker compose | Nginx 구성 | 가장 많이 배우지만 서버 관리를 직접 (study17) |

---

## 🛠️ 실기

### 1. 빌드와 로컬 확인

```bash
cd TSX_study/project
npm install
npm run lint
npm run build      # tsc -b && vite build → dist/
npm run preview    # dist/를 로컬 서버로 확인 (기본 http://localhost:4173)
```

확인할 것:

1. 터미널에 출력되는 파일 크기(`dist/assets/*.js`)를 기록해 둔다 → study12의 비교 기준
2. `preview` 화면에서 `/posts/3`을 **새로고침** — 정상이면 preview 서버가 SPA fallback을 해 주는 중 (실제 호스팅에서는 설정이 필요)
3. 개발자 도구 Network에서 JS 파일명에 해시가 붙는지 확인

### 2. SPA fallback 설정 (호스팅별)

```text
# Netlify — public/_redirects  (빌드 시 dist/_redirects로 복사됨)
/*    /index.html   200
```

```json
// Vercel — vercel.json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

```nginx
# Nginx
location / { try_files $uri $uri/ /index.html; }
```

### 3. 정적 SPA 외부 배포 (예: Vercel 또는 Netlify)

1. 저장소를 GitHub에 올림 (이 저장소의 프론트는 **하위 폴더**에 있으므로 호스팅 설정의 **Root Directory**를 `TSX_study/project`로 지정)
2. 호스팅에서 새 프로젝트 → 저장소 연결 → 프레임워크 `Vite`
3. Build command `npm run build`, Output directory `dist`
4. 환경 변수(`VITE_API_BASE_URL` 등)를 호스팅 설정에 입력 — **공개되어도 되는 값만**
5. 배포 → 발급된 URL에서 `/`, `/posts/3`(새로고침), `/login`을 확인
6. 백엔드가 있다면 **그 URL을 백엔드 CORS 허용 출처에 추가**

> 이 문서에서 실제 배포를 실행하지는 않았습니다. 위 절차는 노션 "배포 · Nginx · CI/CD 기초"의 표와 일반적인 호스팅 설정을 정리한 것이며, 각 호스팅의 화면 문구는 바뀔 수 있습니다.

### 4. 기초 구간 총정리 — study0~9 한 장 요약

| study | 핵심 | 대표 코드 |
|---|---|---|
| 0 환경 | Vite 프로젝트, `index.html → main → App` | [`main.jsx`](./JSX_study/demo/src/main.jsx) |
| 1 문법 | JSX 규칙, `{}` 표현식, `map`+`key` | [`FruitListPractice.jsx`](./JSX_study/demo/src/components/FruitListPractice.jsx) |
| 2 구조 | 컴포넌트, props, children | [`FruitCard.jsx`](./JSX_study/demo/src/components/FruitCard.jsx) |
| 3 데이터 | `useState`, 불변성, `useEffect`, `useRef`, 콜백 props | [`FruitInventoryPractice.jsx`](./JSX_study/demo/src/components/FruitInventoryPractice.jsx) |
| 4 라우팅 | Router, `useParams`, 중첩 `Outlet` | [`App.jsx`](./JSX_study/demo/src/App.jsx) |
| 5 폼 | Controlled, 검증 파생 값, touched | [`LoginFormPractice.jsx`](./JSX_study/demo/src/components/LoginFormPractice.jsx) |
| 6 API | axios 인스턴스, `useFetch`, CORS | [`useFetch.js`](./JSX_study/demo/src/hooks/useFetch.js) |
| 7 인증 | 보호 라우트, 토큰, persist, 인터셉터 | [`ProtectedRoute.tsx`](./TSX_study/project/src/components/ProtectedRoute.tsx) |
| 8 구조 | 폴더 계층, 스토어 분리, 환경 변수 | [`TSX_study/project/src`](./TSX_study/project/src) |
| 9 테스트 | DevTools, Vitest, RTL | (문서 예제) |

### 5. 복습 문제

<details>
<summary>문제 (먼저 직접 답해 본 뒤 아래 정답 확인)</summary>

1. `class` 대신 `className`을 쓰는 이유는?
2. `{ }` 안에 `if`를 쓸 수 없는 이유와 대안 두 가지는?
3. `fruits.push(x); setFruits(fruits)`가 화면을 갱신하지 못하는 이유는?
4. 의존성 배열 `[]`, `[a]`, 없음의 실행 시점 차이는?
5. `useRef`와 `useState`의 가장 큰 차이는?
6. `useParams`의 `id`를 숫자와 `===` 비교하면 항상 false인 이유는?
7. `NavLink`에 `end`를 안 쓰면 생기는 문제는?
8. 오류 메시지를 `errors` state로 따로 두지 말고 파생 값으로 계산해야 하는 이유는?
9. `useFetch`의 `ignore` 플래그는 어떤 문제를 막는가?
10. 로그인 실패 메시지가 "비밀번호가 틀렸습니다"가 아니라 "이메일 또는 비밀번호가 올바르지 않습니다"여야 하는 이유는?
11. `VITE_` 환경 변수에 API 비밀 키를 넣으면 안 되는 이유는?
12. 배포한 SPA에서 새로고침하면 404가 나는 이유와 해결은?

</details>

<details>
<summary>정답</summary>

1. `class`는 JS 예약어라서. JSX는 JS 안에서 해석되므로 DOM 속성 이름(`className`)을 씁니다.
2. `{ }`에는 **표현식**만 올 수 있고 `if`는 문장이라서. 삼항 연산자(`a ? b : c`), `&&`로 대체합니다(또는 `return` 위에서 계산).
3. React가 **참조 비교**로 변경 여부를 판단하는데 같은 배열 참조라 "안 바뀐 것"으로 봅니다. `setFruits(prev => [...prev, x])`.
4. `[]`: 마운트 후 1번, `[a]`: 처음 + `a`가 바뀔 때, 없음: 매 렌더링.
5. `ref.current`가 바뀌어도 **리렌더링이 일어나지 않습니다.** state는 바뀌면 다시 그립니다.
6. `useParams` 값은 항상 **문자열**입니다. `Number(id)`로 변환합니다.
7. `/fruits/1`이 `/fruits/1/reviews`에서도 active로 표시됩니다(접두 일치).
8. 둘을 동기화하다 어긋나기 쉽습니다. `form`에서 매번 계산하면 항상 일치합니다.
9. 요청 중 의존성이 바뀌거나 언마운트된 뒤, **오래된 응답이 최신 화면을 덮어쓰는 것**(race condition)을 막습니다.
10. 공격자에게 존재하는 이메일인지 알려주지 않기 위해(계정 열거 방지). 스펙 v1의 `INVALID_CREDENTIALS`도 이 원칙입니다.
11. 값이 빌드 결과(JS)에 그대로 들어가 누구나 볼 수 있어서. 비밀은 백엔드에만 둡니다.
12. `/posts/3`에 해당하는 실제 파일이 없어서. 서버에서 없는 경로를 `index.html`로 rewrite합니다(Nginx `try_files`, Netlify `_redirects`, Vercel `rewrites`).

</details>

---

## ✅ 실제 실행 결과 (`TSX_study/final` + `backend-spring`)

| 항목 | 결과 |
|---|---|
| `npm run build` (`tsc -b` + `vite build`, strict) | 성공 (용량은 [study12](./study12.md)의 측정 표) |
| 백엔드 `./gradlew bootJar` | 성공 (`board-api-1.0.0.jar`) |
| 로컬 Nginx 컨테이너 (`docker compose up`) | `/posts/3` **직접 접속·새로고침 200**(SPA fallback), `/healthz` 200, `/api/*`가 Spring으로 프록시, 없는 `/assets/*`는 404 |
| 같은 E2E를 Docker 스택(Nginx + Spring + PostgreSQL)에 실행 (`npm run e2e:docker`) | **22개 통과** (CSP 위반 없음 포함) |
| 이미지 | `react-web` 94.4MB (Nginx + 정적 파일), `react-api` 669MB (JRE 21 + Spring) |
| **외부 호스팅(Vercel/Netlify/Render) 배포** | **하지 않음** — 아래 노션 체크 항목은 미완료 |

### 배포 설정 파일 (실제 사용한 것)

- SPA fallback: [`nginx/default.conf`](./TSX_study/final/nginx/default.conf)의 `try_files $uri $uri/ /index.html`
- 환경 변수 분리: 프런트 [`.env.development`](./TSX_study/final/.env.development) / [`.env.production`](./TSX_study/final/.env.production) / [`.env.example`](./TSX_study/final/.env.example)(`VITE_` 접두어 = 공개), 백엔드 `application.properties` + `application-prod.properties`(`SPRING_PROFILES_ACTIVE=prod`, `JWT_SECRET` 필수) — 노션 배포 문서의 dev/prod 표와 같은 구성
- 정적 호스팅(Netlify/Vercel)에 올릴 때는 이 문서 §2의 `_redirects` / `vercel.json`을 `public/`에 추가하고 Root Directory를 `TSX_study/final`로 지정하세요 (이 저장소에는 아직 추가하지 않음). 이때 API는 별도 도메인이 되므로 **백엔드 `CORS_ORIGIN`에 배포 URL을 넣고** `VITE_API_BASE_URL`을 설정해야 합니다.

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| `npm run build`가 타입 오류로 실패 | `tsc -b`가 먼저 돌며 타입 검사 | 오류 메시지의 파일·줄 수정. `noUnusedLocals`로 안 쓰는 변수도 오류 |
| 배포 후 하얀 화면 + 404 (`/assets/...`) | `base` 경로 문제 (하위 경로 배포) | `vite.config`의 `base` 설정 확인 |
| 배포 후 새로고침 404 | SPA fallback 없음 | §2 설정 |
| 배포 후 API 호출 실패 (CORS) | 백엔드 CORS에 배포 URL 없음 / 개발용 Vite 프록시에 의존 | 백엔드 허용 출처 추가, 운영은 프록시 또는 CORS |
| 배포 후에도 `localhost:8080`으로 요청 | 개발용 `.env`가 빌드에 사용됨 | `.env.production` 확인, 호스팅 환경 변수 설정 |
| 모노레포 하위 폴더인데 빌드가 `package.json`을 못 찾음 | Root Directory 미지정 | 호스팅 설정에서 `TSX_study/project` 지정 |
| HTTPS 페이지에서 HTTP API 호출 차단(Mixed Content) | 운영 API가 `http://` | API도 HTTPS로 |

---

## ☐ 체크리스트

- [ ] `npm run build` → `npm run preview`로 `dist/`를 확인했다
- [ ] `tsc -b`가 빌드에 포함된 이유(타입 오류는 배포 전에 차단)를 안다
- [ ] SPA fallback이 필요한 이유와 Nginx/Netlify/Vercel 설정 중 하나를 적용했다
- [ ] `.env.production`의 API 주소가 운영용인지 확인했다
- [ ] 비밀이 `dist/` 안에 없는지 확인했다 (`VITE_` 변수 점검)
- [ ] study0~9 복습 문제 12개를 답을 보지 않고 풀어 봤다
- [ ] **(노션) 외부 배포까지** — 배포 URL에서 `/`, 상세(새로고침), `/login`이 동작한다 *(배포 후 URL 기록: ______________)* — **미완료**: 로컬 Docker 스택까지만 검증, 외부 URL은 없음 — **미완료**: 로컬 Docker 스택(Nginx+Spring+PostgreSQL)까지만 검증, 외부 URL은 없음

---

## ➡️ 다음 단계 연결

기초 구간(study0~10)을 끝냈습니다. [studyMidpoint](./studyMidpoint.md)에서 study0~10에서 배운 기능**만으로** 게시판 + 로그인 서비스를 완성합니다.
