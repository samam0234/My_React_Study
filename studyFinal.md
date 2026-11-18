# studyFinal — 심화 응용: 운영 가능한 게시판 서비스

> 🎯 **목표**: [studyMidpoint](./studyMidpoint.md)의 게시판 + 로그인에 study11~18의 결과를 합쳐, **React + Spring Boot + PostgreSQL**로 실제 백엔드·테스트·CI 파일·Docker·AI 기능까지 갖춘 **운영 가능한 서비스**를 완성하고, **직접 실행한 결과만** 기록한다.

- 이전: [study18.md](./study18.md) — AI 연동·MCP
- 결과 코드: [`TSX_study/final`](./TSX_study/final) ([README](./TSX_study/final/README.md)), [`backend-spring/`](./backend-spring) ([README](./backend-spring/README.md)), [`board-mcp/`](./board-mcp), [`docker-compose.yml`](./docker-compose.yml), [`.github/`](./.github)
- 원본 보존: `TSX_study/project`(midpoint)와 `JSX_study/*`는 **수정하지 않았습니다.** 기존 `Spring_Boot_Study`(별도 저장소)도 수정하지 않았고, 노션 Spring Boot 페이지의 "공통 API 스펙 v1 맞춤" 항목을 이 저장소의 새 `backend-spring`에 처음부터 반영했습니다.

> 📌 **이 문서의 규칙**: 실행해서 확인한 것만 "완료"로 적습니다. 실행하지 못한 것은 이유와 함께 "미완료/미측정"으로 남겼습니다 (6.4절과 부록).

---

## 1. 목표

| 항목 | 최종 목표 | 결과 |
|---|---|---|
| 서비스 | 로그인·글 작성·댓글·즐겨찾기 + AI 기능 | 구현 (2절) |
| 백엔드 | **Spring Boot + PostgreSQL**, 공통 API 스펙 v1 | `backend-spring` 구현, JUnit **45개**(Testcontainers PostgreSQL 16) |
| 품질 | 타입·린트·포맷, 단위·통합·E2E | strict 타입, oxlint 0, Prettier, 테스트 **83** + E2E **19**(+cors 2, docker 22) |
| 운영 | 에러 경계·로깅·보안 점검 | 구현, `npm audit` 조치 (모니터링 서비스는 미적용) |
| 배포 | Docker + 외부 자동 배포 | compose(web+api+db) 구동·검증 **완료**, **외부 배포는 미완료** |
| AI | 백엔드 `/api/ai/chat`·SSE, MCP | 구현·모의 모델로 검증, **실제 API 호출은 미실행** |

### 합친 결과 한눈에

| study | 산출물 | 위치 |
|---|---|---|
| 6·7 | Spring Boot API 연결, JWT·`persist`·인터셉터, CORS, 역할(Role) | `backend-spring/`, `final/src/api`, `store/authStore.ts` |
| 8 | 폴더 구조, `.env`, `config.ts`, `@/` 별칭 | `final/` 전반 |
| 9·15 | Vitest·RTL·MSW·Playwright, JUnit·Testcontainers | `final/src/**/*.test.*`, `final/e2e/`, `backend-spring/src/test` |
| 10·17 | 빌드, Dockerfile, Nginx, compose, CI 파일 | `final/Dockerfile`, `final/nginx/`, `backend-spring/Dockerfile`, 루트 `docker-compose.yml`, `.github/` |
| 11 | TanStack Query (+ Redux Toolkit 비교 구현) | `final/src/queries/posts.ts`, `store/redux/` |
| 12 | 라우트 `lazy`, `memo`, `staleTime`, 번들 측정 | `final/src/App.tsx` 등 |
| 13 | Tailwind v4, 반응형, 다크 모드 토글, 접근성 | `final/src/index.css`, `App.css`, `ThemeToggle` |
| 14 | strict, zod, oxlint, Prettier | 설정 파일, `npm run check` |
| 16 | Error Boundary, `ApiError`, logger, CSP, Spring 보안 필터 | `final/src/components`, `api/errors.ts`, `lib/logger.ts`, `nginx/`, `security/` |
| 18 | `/api/ai/chat`·SSE, `useSummary`, "AI로 다듬기", MCP(HTTP) | `backend-spring/…/ai`, `final/src/api/ai.ts`, `board-mcp/` |

## 2. 기능 확장

| 영역 | midpoint | final | 상태 |
|---|---|---|---|
| 데이터 | JSONPlaceholder 읽기 | 스펙 v1 API, 서버 검색 `q`·페이지(`meta.totalPages`), URL이 상태의 원본 | ✅ |
| 글 | 조회 | 작성·수정·삭제, 작성자만 수정/삭제 UI(관리자는 삭제 가능, 서버가 403으로 최종 검사) | ✅ |
| 댓글 | 조회 | 작성·삭제 | ✅ |
| 로그인 | 가짜 | 가입·로그인(JWT 1시간), 새로고침 유지, 401/403 처리, 중복 이메일 `EMAIL_TAKEN` | ✅ |
| 즐겨찾기 | 메모리 | `persist`(localStorage) | ✅ (서버 저장은 아님) |
| 마이페이지 | `게시글 #N` | 글 제목 표시(`useQueries`), 삭제된 글 안내 | ✅ |
| 서버 상태 | `useFetch` | TanStack Query (캐시·재시도·무효화) | ✅ |
| 화면 | 직접 CSS | Tailwind(반응형·다크 모드 토글), 접근성 | ✅ (MUI·shadcn은 미적용) |
| 에러 | 화면별 문구 | Error Boundary, `ApiError`, 서버 `fields`를 폼 필드 아래에 표시, 404 라우트 | ✅ |
| AI | 없음 | 글 요약 스트리밍, 글쓰기 "AI로 다듬기", MCP(읽기 전용 도구 2개 + 리소스) | ✅ 모의 모델로 검증 |

### 실제 구현 순서

| 단계 | 한 일 | 확인 |
|---|---|---|
| 0 | `TSX_study/project`를 `final/`로 복사 (원본 보존) | — |
| 1 | 품질 기반: `strict`, 별칭, Prettier, `check` 스크립트 | `npm run check` |
| 2 | `config.ts`·`.env.*`, `apiClient` 인터셉터, `ApiError`, zod 타입 | typecheck |
| 3 | 인증: persist, 로그인·가입, `SessionWatcher`, `ProtectedRoute` | 테스트·E2E |
| 4 | TanStack Query 훅 + 목록·상세·폼·마이페이지 | 테스트 |
| 5 | Tailwind·접근성·Error Boundary·lazy·다크 모드 | `vite build` |
| 6 | **Spring Boot 백엔드**(Flyway·PostgreSQL·JWT·스펙 v1·AI) 작성 | `./gradlew test` 45개 |
| 7 | `useSummary`·`api/ai.ts`·"AI로 다듬기", `board-mcp`(HTTP) | 각 테스트 |
| 8 | 테스트 작성(MSW) → 버그 수정 → Playwright(실제 PostgreSQL+Spring+Vite) | 83 + E2E 19 |
| 9 | CORS 직접 호출 검증 | `e2e:cors` |
| 10 | Dockerfile·Nginx·compose·CI 파일 → 빌드·기동 | `e2e:docker` 22개 |
| 11 | `npm audit` 조치, 문서·노션 기록 | — |

### 구조 (실제)

```text
react/
├─ TSX_study/final/          ← 프론트 (src 구조는 final/README.md)
├─ backend-spring/           ← Spring Boot 4 + JPA + Flyway + PostgreSQL (공통 API 스펙 v1, 테스트 45)
├─ board-mcp/                ← 읽기 전용 MCP 서버 (Streamable HTTP, Bearer 인증, 테스트 6)
├─ docker-compose.yml, .env.example, .mcp.json
└─ .github/workflows/ci.yml, deploy.yml, dependabot.yml   (작성만, GitHub 미실행)
```

### 공통 API 스펙 v1 반영 (노션 "HTTP · REST · API 설계" + Spring Boot 페이지의 6항목)

| 스펙 | 구현 | 확인 |
|---|---|---|
| 경로 `/api/...`, `/health`만 접두어 없음 | ✅ | `PlatformApiTest` |
| 응답 `{data}` / `{data, meta}`, 페이지 1부터, `limit` 기본 10·최대 50, `q`, `sort` (`createdAt`/`-createdAt`/`-commentCount`) | ✅ | `PostApiTest` |
| 오류 `{error:{code,message,fields,requestId}}`, 코드 11종(+AI 2종), `X-Request-Id`, 응답 `Content-Type: application/json; charset=utf-8` | ✅ `@RestControllerAdvice` + 필터 | `PostApiTest`·`PlatformApiTest`, E2E |
| `DELETE /api/posts/{id}` 인가: 스펙은 작성자만 | ✅ 작성자 + (확장) **관리자 `role=admin`** 삭제 — 노션 인증·인가의 역할(Role) 항목. 수정(PATCH)은 작성자만 | `PostApiTest`(관리자), E2E |
| POST 201 + `Location`, DELETE 204, 수정은 PATCH만 | ✅ | 〃 |
| Bearer JWT 1시간, 비밀은 `JWT_SECRET` 환경 변수 (prod 필수) | ✅ | `AuthApiTest` |
| CORS는 `CORS_ORIGIN` 환경 변수(와일드카드 없음) | ✅ | `PlatformApiTest`, `e2e:cors` |
| `/api-docs`(OpenAPI), `/swagger-ui.html` | ✅ springdoc | `PlatformApiTest` |
| DB: PostgreSQL, `TEXT[]` tags, `JSONB` meta, `TIMESTAMPTZ`, soft delete, FK 인덱스 | ✅ Flyway `V1__init.sql` | `psql`로 6개 테이블 확인 |
| 입력 크기 제한 413 `PAYLOAD_TOO_LARGE`, 로그인 시도 제한 `RATE_LIMITED` | ✅ (단일 인스턴스 메모리) | `PlatformApiTest`·`AuthApiTest` |

## 3. 성능·보안 점검

### 성능 (직접 측정한 것만)

| 지표 | midpoint | final | 측정 방법 |
|---|---|---|---|
| 초기 로드 JS (gzip) | 103.44 kB | **142.71 kB** (메인 125.69 + 공용 17.02) | `vite build` 출력 |
| 라우트 lazy 청크 합계 (gzip) | 없음 | 약 10.2 kB가 초기 로드에서 빠짐 | 〃 |
| CSS (gzip) | 1.18 kB | 4.12 kB | 〃 |
| LCP / 리렌더 수 / 요청 수 | **미측정** | **미측정** | Lighthouse·Profiler·Network 사용 안 함 |

해석은 [study12](./study12.md). 기능을 더한 만큼 초기 JS가 늘었고, 이 규모에서 코드 분할의 효과는 작습니다. `memo`/`useCallback`은 적용했지만 **효과를 측정하지 않았습니다.** DB 쪽은 JPA 쿼리에서 N+1을 재현·측정하지 않았습니다.

### 보안 점검

| 점검 | 결과 | 근거 |
|---|---|---|
| `dangerouslySetInnerHTML` / `href={입력}` 없음, 본문·AI 출력은 텍스트 출력 | ✅ | pages.test (`<img onerror>` 본문이 `img`를 만들지 않음) |
| `VITE_` 변수·`dist/`·저장소에 비밀 없음 | ✅ | `sk-ant-` 검색 0건, `.env.*`에 API 주소만 |
| 토큰 저장: `localStorage` + 만료 1시간 | ⚠️ **위험 인지, 수용** | XSS에 읽힐 수 있음 → CSP로 완화. `httpOnly` 쿠키·Refresh Token은 미구현 |
| `npm audit` | ✅ 런타임 0 | 개발 도구 `picomatch`는 breaking 수정만 있어 미적용(배포 코드에 불포함). board-mcp 0건. **Gradle 의존성 취약점 점검은 미실행** |
| CORS 허용 출처가 허용 목록만 (`*` 금지) | ✅ | `PlatformApiTest`, `e2e:cors` |
| 보안 헤더·CSP (Nginx) | ✅ | `e2e:docker` — CSP 위반 0, 헤더 단언 |
| SQL 인젝션 방어(JPQL 바인딩 파라미터, 검색어의 `%`·`_`는 문자로 취급), 비밀번호는 해시로만 저장, 응답에 비밀번호 없음 | ✅ | `PostApiTest`(q 검색), `AuthApiTest` |
| 인가: 남의 글 수정·삭제 403, 비로그인 작성 401, 관리자 삭제 | ✅ | `PostApiTest`·`CommentApiTest`, E2E |
| 에러 응답에 스택·내부 정보 없음 | ✅ | `GlobalExceptionHandler`(500은 `INTERNAL`), `ErrorFallback` |
| 로그에 비밀번호·토큰 마스킹 | ✅ | lib.test |
| AI: 키는 서버에만, 입력 길이·호출 횟수·일일 토큰 한도, 출력은 텍스트로만 렌더링 | ✅ (모의 모델 기준) | `AiApiTest`·`AiLimitsTest` |
| 클라이언트 모니터링(Sentry 등), 로그인 후 `requestId` UI 표시 | ❌ 미적용 | — |

## 4. Docker·외부 배포

| 항목 | 상태 | 근거 |
|---|---|---|
| `Dockerfile`(멀티 스테이지·비 root), `.dockerignore`, `nginx/` (SPA fallback·API/SSE 프록시·캐시 정책·보안 헤더) | ✅ | `docker compose build` 성공 (web 94.4MB, api 669MB) |
| 로컬 컨테이너에서 `/posts/3` 새로고침 정상 | ✅ | `curl` 200, E2E |
| `docker compose up`: **web + api + db(PostgreSQL 16)**, healthcheck·볼륨·`.env` 분리 | ✅ | 헬스체크, `e2e:docker` 22개 |
| GitHub Actions로 ghcr.io 푸시 | ❌ 미실행 | [`deploy.yml`](./.github/workflows/deploy.yml) 작성만 |
| 외부 서비스(Vercel/Netlify/Render/VPS) 자동 배포, HTTPS | ❌ 미실행 | — |

| 기록 | 값 |
|---|---|
| 배포 URL | **없음** (외부 배포 미실행) |
| 프론트·API 구성 | 같은 도메인 `/api` 프록시 (Nginx → Spring Boot) — CORS 불필요 |
| 롤백 절차 | 미실행 (이미지 태그에 커밋 SHA를 남기도록 `deploy.yml`에 반영) |

## 5. 테스트 결과 (직접 실행한 결과)

| 종류 | 명령 | 결과 | 비고 |
|---|---|---|---|
| 타입·린트·포맷 | `npm run check` (final) | ✅ 통과 | oxlint 경고 0 |
| 단위·통합 | `npm run test:run` (final) | ✅ **83 / 83** | MSW — api 16, components 13, hooks 8, lib 8, pages 30, store 6, redux 2 |
| 커버리지 | `npm run coverage` | 문장 92.9% · 분기 81.4% · 함수 91.2% · 라인 94.9% | `main.tsx` 제외 |
| 백엔드 | `backend-spring` `./gradlew test` | ✅ **45 / 45** | JUnit 5 + MockMvc + **Testcontainers PostgreSQL 16** (Post 16 · Auth 8 · Comment 5 · Platform 8 · Ai 6 · AiLimits 2) |
| E2E (Chromium) | `npm run e2e` | ✅ **19 / 19** | 실제 PostgreSQL + Spring Boot(`bootJar`) + Vite |
| E2E: CORS 직접 호출 | `npm run e2e:cors` | ✅ 2 / 2 | 프록시 없이 다른 출처 호출 |
| E2E: Docker 스택 | `npm run e2e:docker` | ✅ **22 / 22** | Nginx·Spring·PostgreSQL, CSP·캐시·SSE 포함 |
| board-mcp | `board-mcp` `npm test` | ✅ 6 / 6 | Streamable HTTP, 인증 |
| 빌드 | `npm run build` (final) | ✅ | |
| CI | GitHub Actions | ❌ **미실행** | 로컬에서 같은 명령을 각각 실행해 확인 |

### 노션 "게시판 API 테스트 체크리스트" 7개 (백엔드)

| # | 항목 | 테스트 |
|---|---|---|
| 1 | 목록 200 + `meta` | `PostApiTest` |
| 2 | 없는 id → 404 `NOT_FOUND` | 〃 |
| 3 | 토큰 없이 작성 → 401 | 〃 |
| 4 | 제목 빈 값 → 400 `fields.title` | 〃 |
| 5 | 남의 글 수정·삭제 → 403 | 〃 |
| 6 | 중복 이메일 가입 → 409 `EMAIL_TAKEN` | `PostApiTest` |
| 7 | 삭제 204 후 조회 404 | `PostApiTest` |

### 테스트·검증 중 발견한 것

| 종류 | 내용 | 조치 |
|---|---|---|
| **앱 버그** | 삭제가 403일 때 `mutateAsync` 거부 미처리(`Unhandled Rejection`) | `try/catch` ([study9](./study9.md)) |
| **빌드 오류** | `@apply`를 쓴 별도 CSS에 `@reference "tailwindcss"` 누락 | 추가 ([study6](./study6.md)) |
| **스펙 불일치** | 엄격 대조 중 `Content-Type`에 `charset=utf-8`이 빠진 것을 발견(스펙 7절) | 필터에서 UTF-8 지정 + 테스트 추가 ([study6](./study6.md)) |
| **백엔드** | 테스트용 `application.properties`가 운영 설정을 덮어써 전체가 413 | `application-test.properties` + `@ActiveProfiles("test")` ([study6](./study6.md)) |
| **백엔드** | Jackson 3에서 `write-dates-as-timestamps` 속성이 유효하지 않음 / SSE 한글 깨짐 | 속성 제거 / `charset=UTF-8` 명시 ([study18](./study18.md)) |
| **연결 오류** | Windows에서 `gradlew.bat`을 못 찾음(상대 경로) | 절대 경로 ([study15](./study15.md)) |
| **취약점** | `follow-redirects`(런타임), board-mcp `zod` | 업데이트 ([study16](./study16.md)) |
| 테스트 오류 | `getByLabel`/`getByRole` **부분 일치**, 로그인 직후 이동으로 요청 취소 등 | `exact: true`, 로그인 성공 대기 ([study15](./study15.md)) |
| 설정 오류 | `docker compose config`가 꺼 둔 profile의 `${VAR:?}`도 평가 | `${VAR:-}` ([study17](./study17.md)) |

### 수동 시나리오

자동 E2E가 대신하는 것: 보호 라우트 복귀 · 새로고침 후 로그인 유지 · 글 작성/수정/삭제 · 남의 글 403 · 관리자 삭제 · 손상 토큰 401 · 404 · 모바일 폭 · 키보드 로그인 · 다크 모드 토글 · AI 요약(SSE).
**사람이 직접 하지 않은 것**: 실제 모바일 기기, 스크린 리더, 색 대비 점검, 실제 Claude API 응답 확인.

## 6. 최종 회고

### 6.1 완성도 점검

- [x] 기능 확장 표의 항목을 구현했다 (MUI·shadcn은 제외)
- [x] `check`·테스트·E2E가 로컬에서 통과한다
- [ ] CI(GitHub Actions)가 녹색이다 — **실행하지 않음**
- [ ] 외부 URL에서 시나리오를 확인했다 — **외부 배포 없음**
- [x] 저장소 문서(README, study 문서)가 구현과 어긋나지 않게 갱신했다

### 6.2 이번 작업에서 배운 것 (6개 축)

- **데이터·상태(11)**: 서버 상태는 쿼리 키 설계(`['posts', ...]`)와 `invalidateQueries`가 핵심이었다. 조회 훅 41줄이 사라지는 것보다 경쟁 상태·캐시를 직접 구현하지 않아도 된다는 점이 컸다. 반대로 mutation에서 `mutateAsync`의 거부를 놓치면 실제 버그가 된다.
- **성능(12)**: 기능을 더하면 초기 JS가 약 +39 kB(gzip) 늘었고 라우트 분할이 줄인 것은 약 10 kB였다. **측정하지 않은 최적화(`memo`)는 효과를 주장하지 않기로** 했다.
- **UI·접근성(13)**: Tailwind v4는 별도 CSS의 `@apply`에 `@reference`가 필요하다. 접근성은 `label`·`aria-*`·키보드 E2E까지 했고 **색 대비는 못 봤다.**
- **타입·정적 분석(14)**: `strict` + `erasableSyntaxOnly` 때문에 생성자 매개변수 프로퍼티를 못 쓴다. 타입을 zod 스키마에서 만들면 응답 검증까지 한 곳에서 된다.
- **테스트·CI(9, 15)**: 프런트는 테스트가 앱 버그 1건을 잡았고, 나머지 실패는 대부분 **테스트 쪽 가정**(부분 일치 선택자, 경쟁 상태)이었다. 백엔드는 **Testcontainers로 진짜 PostgreSQL**에서 돌리니 JSONB·배열·soft delete가 모의 DB가 아닌 실제 동작으로 검증됐다. E2E를 Docker 스택에도 재사용하니 CSP·프록시 문제를 한 번에 확인했다.
- **보안·운영(16)**: Nginx에서는 `add_header` 상속 규칙과 `proxy_pass` 변수 사용(백엔드 없이 기동)을 겪었다. Spring에서는 JSON 401/403 응답을 직접 만들어야 공통 오류 형식이 지켜졌다.
- **배포(10, 17)**: 컨테이너까지는 검증했지만 외부 배포·CI 첫 실행은 하지 않았다.
- **AI·MCP(18)**: 키를 서버에만 두고 JWT·속도·일일 토큰 한도를 테스트했다. **실제 모델 응답은 확인하지 못했고**, tool use·Ollama·AI 앱에 MCP 연결도 하지 않았다.

### 6.3 선택 기준 기록

| 선택 | 이번 기준 |
|---|---|
| `useFetch` vs TanStack Query | 조회만이면 직접 만든 훅도 충분. 캐시·쓰기 후 갱신·재시도가 필요해지면 Query |
| Zustand vs Redux Toolkit | 로그인 상태를 둘 다 구현해 비교(Redux는 앱에 연결하지 않음). 이 규모에서는 보일러플레이트가 적은 Zustand |
| 직접 CSS vs MUI vs Tailwind | Tailwind만 적용. MUI·shadcn은 비교하지 못함 |
| `localStorage` vs `httpOnly` 쿠키 | `localStorage` 선택(SPA + Bearer + 만료 1시간). 위험은 CSP로 완화했을 뿐 해결은 아님 |
| JPA vs MyBatis | JPA(Spring Data) 선택. 둘을 비교하지는 않았고 N+1도 재현하지 않음 |
| API 키 위치 | 모델 키는 Spring 서버 환경 변수에만. AI 서버를 따로 두지 않고 같은 백엔드에 `/api/ai/*`로 |

### 6.4 미완료·다음 목표

- [ ] 외부 배포(Vercel/Netlify/Render/VPS) + 배포 URL 기록, HTTPS, GitHub Actions 첫 실행·ghcr 푸시
- [ ] `SPRING_PROFILES_ACTIVE=prod`로 실제 기동, Gradle 의존성 취약점 점검
- [ ] 실제 Claude API 호출(키 설정 후), `usage`·비용 확인
- [ ] tool use(챗봇 위젯), Ollama(`AI_PROVIDER=ollama`), Claude Code·앱에서 `board` MCP 도구 호출
- [ ] MUI·shadcn/ui 적용·비교, react-hook-form
- [ ] Lighthouse·Profiler 측정, 색 대비 점검
- [ ] Refresh Token, OAuth, 비밀번호 재설정 (노션 "인증 · 인가"의 아직 안 한 것), JPA N+1 재현
- [ ] Sentry 등 에러 수집, `requestId` 화면 표시

---

## 부록: 노션 체크 항목 달성 현황

노션 React 페이지 "실제 백엔드 연결 (조합 코스)"와 하위 페이지 항목입니다.

| 노션 항목 | 문서 | 상태 |
|---|---|---|
| 대표 조합 1번(React + Spring Boot + PostgreSQL)의 Spring API에 연결, CORS 적용 | [study6](./study6.md) | ✅ `backend-spring`(PostgreSQL 16)에 연결, 프록시·CORS 직접 호출 모두 확인 |
| 로그인 실제 연결, Zustand `persist`로 새로고침 유지 | [study7](./study7.md) | ✅ |
| 401/403 처리를 axios 인터셉터 한 곳에 | [study7](./study7.md) | ✅ |
| Vitest + React Testing Library 테스트 | [study9](./study9.md) | ✅ 83개 |
| 외부 배포까지 | [study10](./study10.md), [study17](./study17.md) | ❌ 로컬 Docker(compose)까지 |
| TanStack Query: 목록 조회·쿼리 키·로딩/에러/빈 상태·`useMutation`+invalidate·캐시/stale | [study11](./study11.md) | ✅ |
| Redux Toolkit: `configureStore`·`createSlice`·`useSelector`, 로그인을 Redux slice로 | [study11](./study11.md) | ✅ 비교 구현(앱에는 연결하지 않음) |
| MUI (목록·폼·모달), 테마, shadcn/ui | [study13](./study13.md) | ❌ 미구현 |
| Tailwind 반응형, 다크 모드 | [study13](./study13.md) | ✅ |
| 접근성 기본 (키보드·label·색 대비) | [study13](./study13.md) | ⚠️ 색 대비 미검사 |

### "각 프레임워크 응용하기" 조합마다 체크할 것 (React + Spring Boot 기준)

| 항목 | 상태 |
|---|---|
| 백엔드가 공통 스펙 8절 "고칠 것"을 반영했다 | ✅ 새로 만든 `backend-spring`이 처음부터 반영 (기존 `Spring_Boot_Study`는 수정하지 않음) |
| 프론트가 JSONPlaceholder가 아니라 이 백엔드에 붙는다 (CORS 또는 프록시) | ✅ 프록시·CORS 직접 호출 둘 다 확인 |
| 새로고침해도 로그인이 유지된다 | ✅ |
| SQLite가 아니라 실제 DB를 쓴다 (compose) | ✅ PostgreSQL 16 (compose `db`, 테스트는 Testcontainers) |
| 남의 글 수정·삭제 403, 비로그인 작성 401을 테스트로 확인했다 | ✅ `PostApiTest`·`CommentApiTest`·E2E |
| 외부에서 접속 가능한 URL이 있다 | ❌ |
