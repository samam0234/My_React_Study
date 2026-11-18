# backend-spring — 공통 API 스펙 v1 게시판 백엔드 (Spring Boot + PostgreSQL)

대표 조합 1번(React + **Spring Boot** + **PostgreSQL**)의 백엔드입니다. 노션 [HTTP · REST · API 설계](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e)의 **게시판 공통 API 스펙 v1**을 구현하며, 프런트([`TSX_study/final`](../TSX_study/final))가 코드 수정 없이 붙습니다.

> 기존 `Spring_Boot_Study`(`project/server`)는 수정하지 않았습니다. 노션 Spring Boot 페이지의 "공통 API 스펙 v1 맞춤" 6개 항목(`/api` 접두어, `data`+`meta`(page 1부터), `@RestControllerAdvice` 오류 형식, 목록 크기 10/최대 50, JWT 시크릿 환경 변수, PostgreSQL 기본)을 이 새 프로젝트에서 처음부터 지켰습니다.

## 구조 (Controller — Service — Repository)

```text
src/main/java/com/example/board/
├─ controller/   AuthController PostController AiController HealthController   (비즈니스 로직 없음)
├─ service/      AuthService PostService CommentService AiService RateLimiter  (트랜잭션·인가·검증)
├─ repository/   Spring Data JPA (JPQL 바인딩 파라미터)
├─ domain/       User Post Comment AiConversation AiMessage                    (엔티티는 응답에 노출하지 않음)
├─ dto/          Dtos (요청·응답 record)
├─ exception/    ApiException GlobalExceptionHandler(@RestControllerAdvice)
├─ security/     SecurityConfig JwtService JwtAuthenticationFilter RequestIdFilter PayloadSizeFilter ErrorWriter
├─ ai/           AiProvider AnthropicAiProvider(Anthropic Java SDK) MockAiProvider AiConfig
└─ config/       AppProperties SeedRunner
src/main/resources/db/migration/V1__init.sql   (Flyway — 노션 PostgreSQL 페이지의 스키마)
```

## 엔드포인트

| 메소드 | 경로 | 인증 | 성공 |
|---|---|---|---|
| GET | `/health` | — | 200 `{ "status": "ok" }` |
| POST | `/api/auth/signup` · `/api/auth/login` | — | 201 · 200 |
| POST | `/api/auth/logout` | 필요 | 204 |
| GET | `/api/auth/me` | 필요 | 200 |
| GET | `/api/posts` (`q`,`page`,`limit`,`sort`) · `/api/posts/{id}` | — | 200 |
| POST | `/api/posts` | 필요 | 201 + `Location` |
| PATCH | `/api/posts/{id}` | 작성자 | 200 |
| DELETE | `/api/posts/{id}` | 작성자 또는 관리자 | 204 (soft delete) |
| GET · POST | `/api/posts/{id}/comments` | — · 필요 | 200 · 201 |
| DELETE | `/api/comments/{id}` | 작성자 또는 관리자 | 204 |
| POST | `/api/ai/chat` · `/api/ai/chat/stream`(SSE) | 필요 | 200 |
| GET | `/api-docs`(OpenAPI 3), `/swagger-ui.html` | — | 200 |

오류는 모두 `{ "error": { "code", "message", "fields"?, "requestId" } }` 입니다 (`VALIDATION_ERROR` `BAD_REQUEST` `UNAUTHORIZED` `INVALID_CREDENTIALS` `FORBIDDEN` `NOT_FOUND` `EMAIL_TAKEN` `PAYLOAD_TOO_LARGE` `RATE_LIMITED` `AI_QUOTA_EXCEEDED` `AI_UNAVAILABLE` `INTERNAL`). 응답마다 `X-Request-Id`가 붙고 오류 본문의 `requestId`와 같은 값입니다.

## 실행

JDK 21 이상(로컬은 26으로 확인)과 Docker가 필요합니다.

```bash
# 1) PostgreSQL (루트의 docker-compose.yml 의 db 서비스)
docker compose up -d db                      # localhost:5432, DB/사용자/비밀번호 board/board/board
# 2) 서버 (데모 데이터: mina/jun/admin@example.com, 비밀번호 password123)
APP_SEED=true ./gradlew bootRun              # Windows: set APP_SEED=true && gradlew.bat bootRun
# 3) 프런트: cd ../TSX_study/final && npm install && npm run dev   → http://localhost:5173
```

| 환경 변수 | 기본 | 설명 |
|---|---|---|
| `DB_URL` `DB_USER` `DB_PASSWORD` | `jdbc:postgresql://localhost:5432/board`, board, board | PostgreSQL 접속 |
| `JWT_SECRET` | (없음) | 32바이트 이상. 비우면 개발용 임시 키(재시작하면 토큰 무효). **`SPRING_PROFILES_ACTIVE=prod`에서는 필수** |
| `JWT_TTL_SECONDS` | 3600 | 토큰 만료(스펙 v1: 1시간) |
| `CORS_ORIGIN` | `http://localhost:5173` | 허용 출처(쉼표로 여러 개). 와일드카드 없음 |
| `APP_SEED` | false | 데모 데이터 |
| `AI_PROVIDER` | (자동) | `anthropic` / `mock`. 비우면 `ANTHROPIC_API_KEY`가 있을 때만 anthropic |
| `ANTHROPIC_API_KEY` `AI_MODEL` | — , `claude-opus-5-5` | 모델 API 키(서버 환경 변수로만), 모델 ID |
| `AI_DAILY_TOKEN_LIMIT` `AI_REQUESTS_PER_MINUTE` | 200000, 10 | 사용자별 일일 토큰 한도, 분당 요청 수 |

## 테스트

```bash
./gradlew test        # 45개 — JUnit 5 + MockMvc + Testcontainers(PostgreSQL 16, Docker 필요)
```

노션 [테스트 기초](https://app.notion.com/p/40bd7dec5e2e814d951ac6a50aff5a8f)의 "게시판 API 테스트 체크리스트" 7개(목록 200/meta, 없는 id 404, 토큰 없이 작성 401, 제목 빈 값 400 `fields.title`, 남의 글 403, 중복 이메일 409 `EMAIL_TAKEN`, 삭제 204 후 404)를 포함해 인증·댓글·CORS·요청 ID·OpenAPI·413·AI(한도·스트리밍)를 검증합니다.

## 알려진 한계

- 실제 Anthropic API는 호출해 보지 않았습니다(키 없음). `AnthropicAiProvider`는 컴파일로만 검증했고, 테스트는 `MockAiProvider`로 합니다.
- 로그인 시도·AI 요청 제한은 단일 인스턴스 메모리 구현입니다(여러 인스턴스면 Redis 등 필요).
- Refresh Token, OAuth, 비밀번호 재설정, 이메일 인증은 없습니다. 토큰 로그아웃(폐기)도 없습니다(만료까지 유효).
