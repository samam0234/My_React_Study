# React 학습 기록

Vue.js 학습을 마친 뒤 React로 넘어오며 정리한 학습 저장소입니다. **기초(study0~10) → 중간 응용(studyMidpoint) → 심화(study11~18) → 심화 응용(studyFinal)** 순서로 진행합니다. 각 문서는 *목표 → 📖 이론 → 🛠️ 실기 → 오류 노트 → ☐ 체크리스트 → 다음 단계* 구성입니다.

## 학습 문서

### 기초 구간

| 문서 | 주제 |
|---|---|
| [study0.md](./study0.md) | 환경 설정 (Node, Vite, 폴더 구조, 실행 확인, 핵심 용어) |
| [study1.md](./study1.md) | Hello World와 기본 문법 (JSX) |
| [study2.md](./study2.md) | 핵심 구조: 컴포넌트·props·children |
| [study3.md](./study3.md) | 데이터 다루기: state·이벤트·effect·ref |
| [study4.md](./study4.md) | 라우팅·요청 처리 (React Router) |
| [study5.md](./study5.md) | 폼·입력·검증 |
| [study6.md](./study6.md) | DB·API 연동 (axios, CRUD, CORS, Spring Boot + PostgreSQL 백엔드) |
| [study7.md](./study7.md) | 인증·보안 기초 (토큰, persist, 인터셉터) |
| [study8.md](./study8.md) | 구조화·재사용 (폴더 구조, 환경 변수) |
| [study9.md](./study9.md) | 테스트·디버깅 (Vitest, React Testing Library) |
| [study10.md](./study10.md) | 배포·정리, 기초 총정리와 복습 문제 |

### 중간 응용

| 문서 | 주제 |
|---|---|
| [studyMidpoint.md](./studyMidpoint.md) | study0~10만으로 게시판 + 로그인 완성 |

### 심화 구간

| 문서 | 주제 |
|---|---|
| [study11.md](./study11.md) | 상태·데이터 흐름 심화 (TanStack Query, Redux Toolkit) |
| [study12.md](./study12.md) | 성능 최적화 (측정과 함께) |
| [study13.md](./study13.md) | 생태계 라이브러리 (MUI, Tailwind, shadcn/ui) |
| [study14.md](./study14.md) | TypeScript·타입·정적 분석 (tsconfig, oxlint, Prettier) |
| [study15.md](./study15.md) | 고급 테스트·CI (MSW, Playwright, GitHub Actions) |
| [study16.md](./study16.md) | 보안·운영 심화 (에러 처리, 로깅, 모니터링) |
| [study17.md](./study17.md) | Docker·배포 자동화 |
| [study18.md](./study18.md) | AI 연동·MCP (Spring `/api/ai/chat`·SSE, MCP 서버) |

### 심화 응용

| 문서 | 주제 |
|---|---|
| [studyFinal.md](./studyFinal.md) | study11~18 + midpoint를 합쳐 운영 가능한 서비스 완성 |

## 학습 순서

1. [study0.md](./study0.md) ~ [study10.md](./study10.md) — 기초 (실습: [`JSX_study/demo`](./JSX_study/demo), 일부는 [`TSX_study`](./TSX_study) 코드 참조)
2. [studyMidpoint.md](./studyMidpoint.md) — 중간 응용 ([`TSX_study/project`](./TSX_study/project), 경량본 [`JSX_study/project`](./JSX_study/project))
3. [study11.md](./study11.md) ~ [study18.md](./study18.md) — 심화 (코드는 각 문서의 예제)
4. [studyFinal.md](./studyFinal.md) — 심화 응용

## 프로젝트

`demo`는 기초 실습, `project`는 응용 실습입니다. JSX 응용은 TSX 응용보다 짧습니다.

- [`JSX_study/demo`](./JSX_study/demo): JavaScript + JSX 기초 실습 (과일 목록·검색·로그인 폼·라우팅·API·Zustand)
- [`JSX_study/project`](./JSX_study/project): JSX 응용. 목록, 상세, 검색, 로그인만 있는 미니 게시판 (Context 사용)
- [`TSX_study/demo`](./TSX_study/demo): 기초 실습을 TypeScript로 전환한 결과 (JSX 원본은 수정하지 않음)
- [`TSX_study/project`](./TSX_study/project): TSX 응용 (페이지네이션, 즐겨찾기, 댓글, 보호된 마이페이지) — studyMidpoint의 결과물 (수정하지 않음)
- [`TSX_study/final`](./TSX_study/final): **studyFinal의 프런트.** midpoint를 복사해 실제 백엔드 연결, TanStack Query, `persist`·인터셉터, Tailwind(다크 모드), 테스트(Vitest 83개·Playwright), Docker, AI 요약·다듬기까지 적용 ([README](./TSX_study/final/README.md))
- [`backend-spring/`](./backend-spring): **Spring Boot 4 + JPA + Flyway + PostgreSQL** 백엔드. 공통 API 스펙 v1 구현, JWT, `/api/ai/chat`·SSE (JUnit 45개, Testcontainers) ([README](./backend-spring/README.md))
- [`board-mcp/`](./board-mcp): 게시판 읽기 전용 MCP 서버 (Streamable HTTP `/mcp`, Bearer 인증, 테스트 6개)
- [`docker-compose.yml`](./docker-compose.yml) (db PostgreSQL + api Spring + web Nginx, 선택 `mcp`), [`.github/`](./.github) (CI·배포·Dependabot — 작성만, GitHub 미실행), [`.mcp.json`](./.mcp.json)

> study11~18의 문서는 위 코드의 **실행 결과**(통과 개수, 측정값)와 **미완료 항목**을 `✅ 실제 …` 절에 구분해 적어 두었습니다. MUI·shadcn/ui, Sentry, 외부 배포, 실제 Claude API 호출, tool use·Ollama는 구현·실행하지 않았습니다(Redux Toolkit은 비교용으로만 구현).

## 실행 방법

Node.js 18 이상이 필요합니다. (`TSX_study/final`과 백엔드는 Node 22, JDK 21 이상, Docker)

```bash
cd JSX_study/demo       # JSX 기초
# cd JSX_study/project  # JSX 응용
# cd TSX_study/demo     # TSX 기초
# cd TSX_study/project  # TSX 응용 (studyMidpoint)
# cd TSX_study/final    # 심화 응용 (studyFinal) — 백엔드를 먼저: docker compose up -d db && cd backend-spring && APP_SEED=true ./gradlew bootRun
npm install
npm run dev             # 개발 서버 (기본 http://localhost:5173)
npm run build
```

`TSX_study/final`의 테스트·E2E·Docker 명령은 [`TSX_study/final/README.md`](./TSX_study/final/README.md)를 참고하세요. (전체 스택: `docker compose up --build` → http://localhost:8080)

## 기술 스택

React 19, Vite, TypeScript, react-router-dom, axios, Zustand, oxlint

`TSX_study/final` 추가: TanStack Query, zod, Tailwind CSS v4, Vitest, React Testing Library, MSW, Playwright, Prettier, Docker/Nginx, Redux Toolkit(비교용)

`backend-spring`: Spring Boot 4, Spring Data JPA(Hibernate), Flyway, PostgreSQL 16, Spring Security + jjwt, springdoc, Anthropic Java SDK, JUnit 5 + Testcontainers. `board-mcp`: MCP TypeScript SDK

문서에만 예제로 있는 것(구현 안 함): MUI, shadcn/ui, Sentry

## 에이전트 / 커밋 규칙

- 공통 규칙: [.agent/AGENTS.md](./.agent/AGENTS.md)
- 커밋 가이드: [.agent/COMMIT_GUIDE.md](./.agent/COMMIT_GUIDE.md)
