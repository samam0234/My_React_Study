# TSX 심화 응용: 미니 게시판 (studyFinal)

[`TSX_study/project`](../project)(studyMidpoint, 조회 중심 + 가짜 로그인)를 바탕으로 study11~18의 내용을 **실제 코드로** 적용한 프로젝트입니다. 원본 `project`와 JSX 쪽 코드는 수정하지 않았습니다.

대표 조합 1번 **React + Spring Boot + PostgreSQL**의 프런트입니다. 백엔드는 [`../../backend-spring`](../../backend-spring)(공통 API 스펙 v1)이고, 이 프런트는 코드 수정 없이 그 API에 붙습니다.

## 기능

- 목록(서버 검색 `q`, 서버 페이지네이션, URL이 상태의 원본), 상세, 댓글 작성·삭제
- 회원가입·로그인(JWT), 새로고침 후 로그인 유지(Zustand `persist`), 보호된 라우트, 로그인 후 원래 위치 복귀
- 글 작성·수정·삭제(작성자 또는 관리자 — 서버가 403으로 최종 검사), 즐겨찾기(`persist`), 마이페이지(제목 표시)
- 401/403 처리를 axios 인터셉터 한 곳에서, 오류는 `ApiError` 한 형태로, 서버의 `fields`를 폼 필드 아래에 표시
- AI: 글 상세 "3줄 요약"(SSE 스트리밍), 글쓰기 "AI로 다듬기" — 모델 키는 Spring 백엔드에만 있음 (`POST /api/ai/chat`, `/api/ai/chat/stream`)
- Tailwind CSS(반응형 `sm:`/`md:`, **다크 모드 토글**), 접근성(label 연결, `aria-*`, 건너뛰기 링크, 키보드 조작)
- Error Boundary, 라우트 코드 분할(`lazy`), `memo`/`useCallback`
- 비교용 Redux Toolkit 구현(`store/redux/`, 앱은 Zustand 사용)

## 구조

```text
src/
├─ api/          client.ts(인터셉터) errors.ts(ApiError) posts.ts auth.ts comments.ts ai.ts(chat·SSE 스트림)
├─ queries/      posts.ts           TanStack Query 훅(쿼리 키 설계, mutation + invalidate)
├─ store/        authStore(persist) favoritesStore(persist) themeStore(persist) toastStore  redux/(비교용)
├─ hooks/        useDebounce useSummary(SSE) useFetch(study6~10에서 만든 "Before" 훅, 앱은 안 씀)
├─ components/   AppHeader ThemeToggle PostCard(memo) Pagination FormField StateMessage Toaster SessionWatcher ProtectedRoute ErrorFallback SummaryPanel
├─ pages/        PostList PostDetail PostForm Login Signup MyPage NotFound
├─ lib/          validators(zod) logger(redact) permissions
├─ test/         setup.ts server.ts(MSW) fixtures utils
├─ config.ts     환경 변수를 읽는 유일한 파일
└─ types.ts      zod 스키마 + 추론된 타입
e2e/             board.spec.ts cors.spec.ts docker.spec.ts global-teardown.ts
scripts/         start-backend.mjs   E2E 용: PostgreSQL(compose) + Spring Boot 를 띄운다
nginx/ Dockerfile .dockerignore
```

## 실행

Node.js 22 이상, JDK 21 이상, Docker가 필요합니다.

```bash
# 터미널 1: PostgreSQL + 백엔드 (데모 계정 mina@example.com / password123)
cd ../.. && docker compose up -d db
cd backend-spring && APP_SEED=true ./gradlew bootRun       # :8080  (Windows: set APP_SEED=true && gradlew.bat bootRun)
# 터미널 2: 프런트
cd ../TSX_study/final && npm install && npm run dev        # http://localhost:5173  (/api 는 Vite 프록시가 :8080 으로 중계)
```

키 없이도 AI 기능은 모의 응답으로 동작합니다. 실제 Claude를 쓰려면 백엔드 터미널에 `ANTHROPIC_API_KEY`를 설정합니다(프런트에는 두지 않습니다). 환경 변수는 [`.env.example`](./.env.example) 참고. `VITE_*` 값은 빌드 결과에 공개되므로 비밀을 넣지 않습니다.

전체를 컨테이너로: 저장소 루트에서 `docker compose up -d --build` → http://localhost:8080 (Nginx → Spring Boot → PostgreSQL).

## 명령

| 명령                        | 내용                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `npm run check`             | 타입 검사(`tsc -b`, strict) + 린트(oxlint) + 포맷 검사(Prettier)                                           |
| `npm run test:run`          | 단위·통합 테스트 (Vitest + React Testing Library + MSW) — 83개                                             |
| `npm run coverage`          | 커버리지 리포트                                                                                            |
| `npm run e2e`               | Playwright E2E 19개 — PostgreSQL(Docker)·Spring Boot(`bootJar`)·Vite를 직접 띄움 (`npx playwright install chromium` 필요) |
| `npm run e2e:cors`          | 프록시 없이 다른 출처 API를 직접 호출(CORS) 검증 (2개)                                                      |
| `npm run e2e:docker`        | Docker 스택(`docker compose up -d --build`, :8080) 대상 E2E (22개: CSP·캐시·SSE 포함)                      |
| `npm run build` / `preview` | 운영 빌드 / 로컬 확인                                                                                      |

## 알려진 한계

- 토큰은 `localStorage`에 저장합니다(XSS 위험은 [study7.md](../../study7.md), [study16.md](../../study16.md) 참고).
- 실제 Claude API는 호출해 보지 않았습니다(키 없음). 모의 모델로 검증했습니다.
- MUI·shadcn/ui, react-hook-form, Sentry는 적용하지 않았습니다(각 study 문서의 예제로만 존재). Redux Toolkit은 비교용으로만 구현했습니다.
- Lighthouse·Profiler 측정, GitHub Actions 실행, 외부 배포는 하지 않았습니다.
