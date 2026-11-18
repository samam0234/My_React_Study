# study16 — 보안·운영 심화

> 🎯 **목표**: 프론트엔드 보안 위험(XSS·토큰·의존성·환경 변수)을 점검하고, 에러 경계·로깅·모니터링으로 운영 중 장애를 **감지하고 추적**할 수 있게 한다.

- 이전: [study15.md](./study15.md) — 고급 테스트·CI
- 다음: [study17.md](./study17.md) — Docker·배포 자동화
- 관련 코드: [`authStore.ts`](./TSX_study/project/src/store/authStore.ts), [`api/client.ts`](./TSX_study/project/src/api/client.ts), [`PostDetailPage.tsx`](./TSX_study/project/src/pages/PostDetailPage.tsx), [`main.tsx`](./TSX_study/project/src/main.tsx)

> ✅ **실제 코드와 검증**: 프런트의 Error Boundary·`ApiError`·로거·전역 오류 핸들러·Nginx 보안 헤더/CSP, **백엔드(Spring Security)의 인증·인가·입력 검증·오류 비노출·요청 제한**, `npm audit` 조치를 적용하고 실행했습니다. **Sentry·Web Vitals 같은 외부 모니터링은 적용하지 않았습니다**(예제 코드만).

---

## 📖 이론

### 16.1 프론트엔드 보안 점검 영역

| 위험 | 설명 | 대응 |
|---|---|---|
| **XSS** | 공격자의 스크립트가 내 페이지에서 실행됨 | React는 `{}` 출력을 **자동 이스케이프**. 위험 지점: `dangerouslySetInnerHTML`, `href={userInput}`(`javascript:`), 외부 HTML 삽입 |
| **토큰 탈취** | `localStorage`의 토큰을 XSS로 읽음 | XSS 방어(CSP) + 짧은 만료 + (가능하면) `httpOnly` 쿠키 (study7 §7.3) |
| **비밀 노출** | `VITE_` 변수는 번들에 박혀 공개됨 | 비밀은 백엔드에만 (study8) |
| **취약한 의존성** | npm 패키지의 알려진 취약점 | `npm audit`, 업데이트 자동화 |
| **CSRF** | 쿠키 인증에서 다른 사이트가 요청을 위조 | `SameSite`, CSRF 토큰 (Bearer 헤더 방식은 상대적으로 덜 해당) |
| **클릭재킹** | 내 페이지를 iframe에 숨겨 클릭 유도 | `X-Frame-Options`/CSP `frame-ancestors` |
| **민감 정보 로깅** | 비밀번호·토큰이 콘솔·로그에 남음 | 로그에서 제외 |

### 16.2 운영 관측 3요소

| | 질문 | 도구 |
|---|---|---|
| **로깅** | 무슨 일이 있었나? | 구조화된 로그 (+ `requestId`) |
| **모니터링** | 지금 문제가 있나? 얼마나 자주? | 에러 수집(Sentry 등), 성능 지표(Web Vitals) |
| **에러 처리** | 사용자에게 어떻게 보이나? | Error Boundary, 상태 코드별 화면 |

### 16.3 상태 코드별 사용자 경험 (스펙 v1)

| 상태 | code | 화면 처리 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 필드별 메시지 (`error.fields`) — study5 §5 |
| 401 | `UNAUTHORIZED` | 세션 정리 + 로그인 이동 — study7 인터셉터 |
| 403 | `FORBIDDEN` | "권한이 없습니다" 안내, 로그아웃 금지 |
| 404 | `NOT_FOUND` | 없는 자원 화면 |
| 409 | `EMAIL_TAKEN` | 폼의 해당 필드 오류 |
| 429 | `RATE_LIMITED` | "잠시 후 다시 시도" |
| 500 | `INTERNAL` | 일반 오류 화면 + `requestId` 안내 |

---

## 🛠️ 실기

### 1. 코드 점검 — 현재 저장소에서 확인하기

| 점검 | 방법 | 이 저장소 결과 |
|---|---|---|
| `dangerouslySetInnerHTML` 사용 | 검색 | 사용하지 않음 (게시글 본문은 [`PostDetailPage.tsx:47`](./TSX_study/project/src/pages/PostDetailPage.tsx)에서 `{post.body}`로 출력 → 자동 이스케이프) |
| 사용자 입력이 `href`에 들어가는가 | 검색 | 링크는 `/posts/${id}` 형태의 내부 경로 |
| 토큰 저장 | `authStore` 확인 | 토큰 없음 (가짜 로그인, 상태는 메모리) |
| 비밀을 `VITE_`에 넣었는가 | `.env*` 확인 | `.env` 파일 없음 |
| 콘솔 로그에 민감 정보 | `console.log` 검색 | 직접 확인 필요 |

> 위 결과는 **현재 코드 읽기 기준**이며 도구로 자동 검증한 것은 아닙니다. 직접 `Grep`/에디터 검색으로 다시 확인하세요. 실제 백엔드 로그인(study7)을 붙이면 토큰 저장 항목이 달라집니다.

위험한 예 (**하지 말 것**):

```tsx
<div dangerouslySetInnerHTML={{ __html: post.body }} />   // post.body에 <img onerror=…>가 있으면 실행됨
<a href={post.url}>링크</a>                                 // post.url이 "javascript:alert(1)"이면 위험
```

꼭 HTML을 보여줘야 하면 **DOMPurify**로 정제한 뒤 사용하고, URL은 `http(s)://`만 허용하도록 검사합니다.

### 2. 의존성 점검

```bash
npm audit                # 알려진 취약점 목록
npm audit fix            # 호환 범위 내 자동 수정 (결과는 diff로 확인)
npm outdated             # 오래된 패키지
```

- CI에 `npm audit --audit-level=high` 단계를 넣을 수 있습니다 (study15).
- GitHub Dependabot(저장소 설정)으로 업데이트 PR을 자동 생성할 수 있습니다.
- `npm audit`은 **개발 의존성의 취약점도 보고**합니다. 실제로 사용자에게 배포되는 코드에 영향이 있는지 판단하세요.

### 3. 보안 헤더·CSP (배포 단계에서 설정, study17 Nginx)

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; connect-src 'self' https://api.example.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'" always;
```

CSP는 **허용한 출처의 스크립트만 실행**하게 해 XSS 피해를 줄입니다. 엄격하게 시작해서(`default-src 'self'`) 필요한 출처를 하나씩 추가합니다. UI 라이브러리(study13)가 인라인 스타일을 쓰면 `style-src` 조정이 필요합니다. 값은 서비스마다 다르므로 브라우저 콘솔의 CSP 위반 메시지를 보며 조정하세요.

### 4. 에러 처리 ① — Error Boundary

렌더링 중 던져진 에러가 **앱 전체를 하얗게** 만들지 않도록 경계를 둡니다. 클래스 컴포넌트이거나 `react-error-boundary` 라이브러리를 씁니다.

```bash
npm i react-error-boundary
```

```tsx
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div role="alert">
      <p>문제가 발생했습니다.</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{import.meta.env.DEV ? error.message : '잠시 후 다시 시도해 주세요.'}</pre>
      <button onClick={resetErrorBoundary}>다시 시도</button>
    </div>
  )
}

// App.tsx — 라우트 영역을 감싸면 헤더는 살아 있고 본문만 대체됨
<ErrorBoundary FallbackComponent={ErrorFallback} onError={(e, info) => logger.error(e, info)}>
  <Routes>…</Routes>
</ErrorBoundary>
```

| 포인트 | 설명 |
|---|---|
| 잡는 범위 | **렌더링·생명주기 중** 에러. 이벤트 핸들러·비동기(`fetch`) 에러는 못 잡음 → `try/catch` / 아래 전역 핸들러 |
| 운영 화면 | 스택·내부 메시지를 사용자에게 노출하지 않음 (`import.meta.env.DEV`일 때만) |
| 위치 | 앱 최상위 1개 + 위험한 구역(차트, 외부 위젯)에 추가 |

### 5. 에러 처리 ② — API 오류를 한 형태로

스펙 v1의 오류 본문 `{ error: { code, message, fields, requestId } }`를 타입으로 만들고 axios 오류를 변환합니다.

```ts
// api/errors.ts
import { isAxiosError } from 'axios'

export interface ApiErrorBody { error: { code: string; message: string; fields?: Record<string, string[]>; requestId?: string } }

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string[]>, public requestId?: string) {
    super(message)
  }
}
```

> 위 `constructor(public …)`(생성자 매개변수 프로퍼티)는 study14의 `erasableSyntaxOnly: true` 설정에서 **오류**입니다. 이 저장소 설정에서는 필드를 따로 선언하세요:

```ts
export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, string[]>
  requestId?: string
  constructor(status: number, code: string, message: string, fields?: Record<string, string[]>, requestId?: string) {
    super(message)
    this.status = status; this.code = code; this.fields = fields; this.requestId = requestId
  }
}

export function toApiError(err: unknown): ApiError {
  if (isAxiosError<ApiErrorBody>(err) && err.response?.data?.error) {
    const { code, message, fields, requestId } = err.response.data.error
    return new ApiError(err.response.status, code, message, fields, requestId)
  }
  if (isAxiosError(err) && !err.response) return new ApiError(0, 'NETWORK', '서버에 연결할 수 없습니다.')
  return new ApiError(0, 'UNKNOWN', '알 수 없는 오류가 발생했습니다.')
}
```

응답 인터셉터(study7)에서 `Promise.reject(toApiError(error))`로 던지면, 모든 화면이 같은 형태의 오류를 다룹니다. 500일 때는 `requestId`를 화면에 보여 주면 사용자가 문의할 때 백엔드 로그와 연결할 수 있습니다.

### 6. 에러 처리 ③ — 전역 핸들러

```ts
// main.tsx
window.addEventListener('error', (e) => logger.error(e.error ?? e.message))
window.addEventListener('unhandledrejection', (e) => logger.error(e.reason))   // 처리 안 된 Promise 거부
```

### 7. 로깅 — 구조화된 로거 + requestId

```ts
// lib/logger.ts
type Level = 'debug' | 'info' | 'warn' | 'error'
const SENSITIVE = ['password', 'accessToken', 'authorization']

function redact(value: unknown): unknown {
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) =>
      [k, SENSITIVE.includes(k.toLowerCase()) ? '[REDACTED]' : redact(v)]))
  }
  return value
}

export const logger = {
  log(level: Level, message: string, context?: unknown) {
    const entry = { level, message, context: redact(context), ts: new Date().toISOString(), url: location.pathname }
    if (import.meta.env.DEV) console[level === 'debug' ? 'log' : level](entry)
    else if (level === 'error' || level === 'warn') navigator.sendBeacon?.('/api/client-logs', JSON.stringify(entry))   // 서버가 받는 엔드포인트가 있을 때
  },
  error(err: unknown, context?: unknown) { this.log('error', err instanceof Error ? err.message : String(err), context) },
}
```

| 포인트 | 설명 |
|---|---|
| `redact` | 비밀번호·토큰이 로그에 남지 않게 마스킹 |
| 운영에서는 `console.log` 남발 금지 | 사용자 브라우저 콘솔은 수집되지 않음. 수집이 필요하면 서버/모니터링 서비스로 전송 |
| `requestId` | 스펙 v1은 응답 헤더 `X-Request-Id`와 오류 본문 `requestId`가 **같은 값**. 로그에 함께 남기면 프론트 오류 ↔ 백엔드 로그를 연결 |

### 8. 모니터링

**에러 수집 (예: Sentry)**

```bash
npm i @sentry/react
```

```ts
import * as Sentry from '@sentry/react'
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,          // DSN은 공개되어도 되는 값 (프로젝트 식별용)
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
})
```

- `ErrorBoundary`와 `unhandledrejection`에서 `Sentry.captureException(err)` 전송
- 릴리스·소스맵을 함께 올리면 **압축된 스택이 원래 코드 줄로 복원**됨 (소스맵을 공개 배포하지 않도록 주의)
- 개인정보(이메일 등)를 보내지 않도록 `beforeSend`에서 제거

**성능 지표 (Web Vitals)**

```ts
import { onLCP, onINP, onCLS } from 'web-vitals'
onLCP(console.log); onINP(console.log); onCLS(console.log)   // 운영에서는 수집 서버로 전송
```

**가용성**: 외부 업타임 점검(예: 주기적으로 `GET /health` 호출) + 실패 시 알림.

### 9. 운영 점검 체크 표 (배포 전 훑어보기)

| 영역 | 확인 |
|---|---|
| 번들 | 비밀이 없는가 (`dist/`에서 키워드 검색) |
| HTTPS | 모든 요청이 HTTPS인가 (Mixed Content 없음) |
| 쿠키/토큰 | 저장 방식과 만료 시간 합의 |
| CORS | 허용 출처가 배포 URL만인가 (`*` 금지) |
| 에러 화면 | 스택·내부 정보가 보이지 않는가 |
| 로그 | 비밀번호·토큰 마스킹 |
| 의존성 | `npm audit` high 이상 없음 |

---

## ✅ 실제 적용·점검 결과

### 노션 "웹 보안 기초"의 주요 취약점과 대응 — 이 프로젝트에서

| 취약점 | 이 프로젝트의 대응 | 근거 |
|---|---|---|
| **SQL 인젝션** | 모든 쿼리가 JPA/JPQL **바인딩 파라미터**. 검색어 `q`는 LIKE 와일드카드(`% _ \`)를 이스케이프해 바인딩 | PostApiTest (`q=%`가 전체를 매칭하지 않음) |
| **XSS** | React 자동 이스케이프, `dangerouslySetInnerHTML` 없음. 모델 출력도 텍스트로만 렌더링. Nginx CSP `script-src 'self'` | pages.test (`<img onerror>` 본문이 `img`를 만들지 않음), `e2e:docker`(CSP 위반 0) |
| **CSRF** | 쿠키 세션이 아니라 Bearer 헤더 방식 + Spring `csrf` 비활성 (해당 없음) | 설계 |
| **권한 검사 누락(IDOR)** | 수정·삭제는 **서버의 서비스 계층**에서 작성자(또는 관리자) 확인 → 403. UI 숨김은 UX일 뿐 | PostApiTest(남의 글 수정·삭제), E2E(직접 `DELETE` → 403) |
| **인증 약점** | **BCrypt 해시**, 로그인 시도 제한(429), 실패 이유 숨김, JWT 만료 1시간·시크릿 환경 변수 | AuthApiTest |
| **민감 정보 노출** | DTO로만 응답(엔티티·`password_hash` 비노출), 500은 `INTERNAL` + 내부 정보 없음(로그에만), 모델 오류 내부 메시지 비노출 | PostApiTest, PlatformApiTest |
| 파일 업로드 | 해당 기능 없음 | — |
| **보안 설정 오류** | CORS 허용 도메인 명시(와일드카드 없음), `prod` 프로파일에서 Swagger UI 끔·JWT_SECRET 필수 | PlatformApiTest, `e2e:cors` |
| **취약한 의존성** | `npm audit`(아래 표), Dependabot 설정 파일 | 직접 실행 |
| **비밀값 노출** | `.gitignore`에 `.env`, `.env.example`만 커밋, `VITE_`에 비밀 없음, 시크릿은 환경 변수 | 코드 검토 |

### 노션 "배포 전 점검표" 7개

| 항목 | 상태 |
|---|---|
| 모든 SQL이 바인딩 또는 ORM | ✅ |
| 사용자 입력을 HTML로 그대로 렌더링하는 곳 없음 | ✅ |
| 수정·삭제 API에 소유자 확인 | ✅ |
| 비밀번호 해시, 로그인 시도 제한 | ✅ |
| CORS 허용 도메인 명시, 디버그 모드 꺼짐 | ✅ (prod 프로파일 설정, **prod로 실제 기동은 안 해 봄**) |
| HTTPS + 보안 헤더 | ⚠️ 보안 헤더 ✅(Nginx CSP·`X-Frame-Options` 등, `e2e:docker`로 확인), **HTTPS는 미적용**(로컬 HTTP) |
| `.env`는 Git에 없음, 의존성 audit 통과 | ✅ / 아래 표 |

### 프런트·운영 쪽 적용

| 항목 | 위치 | 검증 |
|---|---|---|
| Error Boundary로 라우트 영역만 오류 화면으로 대체, 헤더 유지, "다시 시도" | [`App.tsx`](./TSX_study/final/src/App.tsx), [`ErrorFallback.tsx`](./TSX_study/final/src/components/ErrorFallback.tsx) (운영에서는 내부 메시지 숨김) | components.test |
| 오류를 `ApiError`(status/code/message/fields/requestId) 한 형태로 | [`api/errors.ts`](./TSX_study/final/src/api/errors.ts) | api.test |
| 상태 코드별 화면: 400(필드 오류) / 401(세션 정리) / 403(안내) / 404 / 409 / 429(AI 한도) / 네트워크 | 각 페이지·인터셉터 | pages.test, E2E |
| 구조화 로거 + **비밀번호·토큰 마스킹** | [`lib/logger.ts`](./TSX_study/final/src/lib/logger.ts) | lib.test |
| 전역 핸들러 `error`, `unhandledrejection` | [`main.tsx`](./TSX_study/final/src/main.tsx) | 코드만 (자동 테스트 없음) |
| 보안 헤더 + **CSP**, 해시 자산 immutable 캐시, `index.html` no-cache | [`nginx/`](./TSX_study/final/nginx) | `npm run e2e:docker` — CSP 위반 콘솔 메시지 0, 응답 헤더 단언 |
| 서버 `requestId`·`X-Request-Id`(오류 본문과 동일), 413 본문 크기 제한 | `RequestIdFilter`, `PayloadSizeFilter` | PlatformApiTest |

### `npm audit` 점검 (직접 실행한 결과)

| 대상 | 발견 | 조치 |
|---|---|---|
| `TSX_study/final` (**런타임**) | `follow-redirects 1.16.0~1.16.1` **high 1건** (axios의 하위 의존성) | `npm audit fix` → 1.16.3, 런타임 기준 **0건** |
| `TSX_study/final` (개발 도구) | `picomatch` ReDoS **high** (vitest 등 도구 체인, `--omit=dev` 기준 0) | 수정이 `vitest@3.1.4`(다운그레이드, breaking)를 요구해 **적용하지 않음** — 배포 코드에는 불포함 |
| `board-mcp` | `zod < 4.6.6` **high 1건** | `zod ^4.6.7`로 올리고 테스트 6개 재통과 → **0건** |
| **Gradle 의존성(backend-spring)** | **미점검** (OWASP dependency-check 등 미사용) | — |

### 하지 않은 것

- Sentry 등 에러 수집, `web-vitals`, 업타임 점검 (예제 코드만 문서에 있음)
- `requestId`를 오류 화면에 표시 (`ApiError`는 보관하지만 UI는 아직 보여 주지 않음)
- HTTPS(certbot 등), 토큰의 `httpOnly` 쿠키 전환, Refresh Token
- Spring `prod` 프로파일 실기동, Gradle 의존성 취약점 점검
- 프롬프트 인젝션 **공격 시나리오 테스트**(시스템 프롬프트·role 제한·입력 길이 제한만 적용)

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| Error Boundary가 이벤트 핸들러 오류를 못 잡음 | 경계는 렌더링 중 오류만 처리 | 핸들러는 `try/catch` + 상태로 오류 표시 |
| 운영에서 스택이 압축되어 읽을 수 없음 | 소스맵 없음 | 모니터링 서비스에 소스맵 업로드 (공개 서버에는 노출 금지) |
| `constructor(public status…)` 컴파일 오류 | `erasableSyntaxOnly` | 필드 선언 + 생성자 대입 (§5) |
| CSP 적용 후 화면이 깨짐 | 인라인 스크립트/스타일·외부 폰트 차단 | 콘솔의 CSP 위반 메시지에 맞춰 허용 목록 조정 |
| `Mixed Content` 차단 | HTTPS 페이지에서 HTTP API | API를 HTTPS로 |
| `npm audit`이 수정 불가 취약점을 보고 | 간접 의존성 | 영향 범위 판단, 상위 패키지 업데이트 대기/대체 |
| 로그에 토큰이 남음 | 요청 객체 전체를 로깅 | `redact`, `Authorization` 헤더 제외 |
| 에러가 너무 많이 쌓임 (Sentry 과금) | 같은 오류 반복·봇 | 샘플링, 무시 규칙, 필터 |

---

## ☐ 체크리스트

- [x] XSS 위험 지점(`dangerouslySetInnerHTML`, `href={입력}`)을 저장소에서 검색해 점검했다
- [ ] 토큰 저장 방식(`localStorage` vs `httpOnly` 쿠키)의 위험과 보완책을 설명할 수 있다
- [x] `VITE_` 변수에 비밀이 없고 `dist/`에도 없는 것을 확인했다
- [x] `npm audit`을 실행하고 결과를 분류(영향 있음/없음)했다
- [x] Error Boundary로 라우트 영역을 감싸고, 렌더 오류 시 헤더는 유지되는 것을 확인했다
- [x] API 오류를 `ApiError` 한 형태로 변환하고 상태 코드별 화면(400/401/403/404/500)을 만들었다
- [x] `error` / `unhandledrejection` 전역 핸들러를 달았다
- [x] 로거가 비밀번호·토큰을 마스킹한다
- [ ] 에러 수집(Sentry 등)을 연결하고 일부러 낸 오류가 수집되는 것을 확인했다
- [ ] `requestId`로 프론트 오류와 백엔드 로그를 연결하는 흐름을 설명할 수 있다

---

## ➡️ 다음 단계 연결

운영 점검 항목을 갖췄으니 [study17](./study17.md)에서 **Docker 이미지로 묶고 외부 서비스에 자동 배포**합니다.
