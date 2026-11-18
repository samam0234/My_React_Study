# study6 — DB·API 연동

> 🎯 **목표**: axios 인스턴스와 `useFetch` 훅으로 API를 호출해 목록·상세·CRUD를 만들고, 공통 API 스펙 v1에 맞춘 백엔드(Spring Boot)에 CORS를 적용해 연결한다.

- 이전: [study5.md](./study5.md) — 폼·입력·검증
- 다음: [study7.md](./study7.md) — 인증·보안 기초
- 실습 코드: [`api/client.js`](./JSX_study/demo/src/api/client.js), [`api/posts.js`](./JSX_study/demo/src/api/posts.js), [`hooks/useFetch.js`](./JSX_study/demo/src/hooks/useFetch.js), [`PostListPage.jsx`](./JSX_study/demo/src/pages/PostListPage.jsx), [`TSX_study/project/src/api/`](./TSX_study/project/src/api)

> ✅ **실제 코드와 검증**: 이 문서의 API 층·CRUD·프록시·CORS는 [`TSX_study/final/src/api`](./TSX_study/final/src/api)에, 그 상대인 **Spring Boot + PostgreSQL 백엔드는 [`backend-spring/`](./backend-spring)** 에 구현했고(공통 API 스펙 v1), 실제 브라우저(Playwright)와 JUnit(Testcontainers PostgreSQL)으로 검증했습니다. 아래 "실제 구현·검증 결과"를 먼저 보세요. (기존 `TSX_study/project`, `JSX_study/*`, `Spring_Boot_Study`는 수정하지 않았습니다.)

---

## 📖 이론

### 6.1 프론트엔드는 DB에 직접 붙지 않는다

```text
React(브라우저) ──HTTP/JSON──▶ 백엔드 API ──▶ DB
```

브라우저 코드는 누구나 볼 수 있으므로 DB 접속 정보를 넣을 수 없습니다. 프론트가 하는 일은 **API 호출 → 응답 → 상태 반영**입니다. "DB 연동"은 곧 "API 연동"입니다.

### 6.2 REST와 HTTP 메소드

| 동작 | 메소드 | 경로(스펙 v1) | 성공 코드 |
|---|---|---|---|
| 목록 | GET | `/api/posts?page=1&limit=10` | 200 |
| 상세 | GET | `/api/posts/{id}` | 200 |
| 작성 | POST | `/api/posts` | 201 |
| 수정 | PATCH | `/api/posts/{id}` | 200 |
| 삭제 | DELETE | `/api/posts/{id}` | 204 (본문 없음) |

(출처: 노션 "HTTP · REST · API 설계" — 게시판 공통 API 스펙 v1)

### 6.3 데이터 요청의 3가지 상태

데이터를 비동기로 받아오는 화면은 **로딩 / 에러 / 빈 상태 / 성공** 4가지를 모두 화면에 명시해야 합니다. 노션의 구조 원칙("에러/로딩/빈 상태를 UI에 명시하기")과 같습니다.

### 6.4 axios 인스턴스

`axios.create({ baseURL, timeout })`로 만든 인스턴스를 한 곳에 두고, 모든 요청이 그걸 거치게 합니다. 이후 인증 헤더·에러 처리(study7)를 **이 한 곳**에 모읍니다.

### 6.5 CORS

브라우저는 **출처(프로토콜+도메인+포트)가 다른 서버**의 응답을 기본적으로 막습니다. `http://localhost:5173`(Vite) → `http://localhost:8080`(Spring)은 포트가 달라 다른 출처입니다. 해결은 **백엔드가 허용 헤더를 내려주는 것**이고, 개발 중에는 Vite 프록시로 같은 출처처럼 보이게 우회할 수도 있습니다.

---

## 🛠️ 실기

### 1. axios 인스턴스 — [`api/client.js`](./JSX_study/demo/src/api/client.js)

```js
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
})
```

| 줄 | 설명 |
|---|---|
| 5 | `baseURL`: 이후 `get('/posts')`가 `https://…/posts`가 됨. **백엔드가 바뀌면 이 줄만 수정** |
| 6 | 5초 안에 응답이 없으면 에러 → 로딩이 무한히 이어지지 않게 |

현재는 공개 목업 API(JSONPlaceholder)입니다. 쓰기 요청(POST/PATCH/DELETE)은 성공 응답만 흉내 내고 **실제 데이터는 바뀌지 않습니다.**

### 2. API 함수 — [`api/posts.js`](./JSX_study/demo/src/api/posts.js)

```js
export async function fetchPosts({ page, limit }) {
  const res = await apiClient.get('/posts', {
    params: { _page: page, _limit: limit },
  })
  return res.data
}
```

- 컴포넌트는 `fetchPosts()`만 압니다. URL·쿼리 이름은 이 파일에 갇혀 있으므로 백엔드를 바꿔도 컴포넌트를 건드리지 않습니다.
- TSX 버전은 응답 타입이 붙고 `Promise.all`로 두 요청을 병렬 처리합니다 — [`TSX_study/project/src/api/posts.ts:16-23`](./TSX_study/project/src/api/posts.ts):

```ts
const [postRes, commentsRes] = await Promise.all([
  apiClient.get<Post>(`/posts/${id}`),
  apiClient.get<Comment[]>(`/posts/${id}/comments`),
])
return { post: postRes.data, comments: commentsRes.data }
```

게시글 본문과 댓글은 서로 의존하지 않으므로 **동시에** 요청해 대기 시간을 줄입니다.

### 3. 커스텀 훅 — [`hooks/useFetch.js`](./JSX_study/demo/src/hooks/useFetch.js)

```js
export function useFetch(fetcher, deps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const result = await fetcher()
        if (!ignore) setData(result)
      } catch (err) {
        if (!ignore) setError(err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, deps)

  return { data, loading, error }
}
```

| 줄(원본) | 설명 |
|---|---|
| 6~8 | "데이터/로딩/에러" 3상태를 한 훅으로 묶어 화면마다 반복하지 않음 |
| 11 | `ignore` 플래그: **오래된 요청의 결과가 최신 화면을 덮어쓰지 않게** (race condition 방지) |
| 14~15 | 요청 시작 때 로딩 켜고 이전 에러 제거 |
| 18~22 | 성공/실패/종료 모두 `ignore`를 확인한 뒤 반영 |
| 28~30 | cleanup: 의존성이 바뀌거나 언마운트되면 이전 요청을 "무효" 처리 |
| 32 | `deps`가 바뀌면 재요청 (페이지 번호, id 등) |

### 4. 화면에서 4가지 상태 표현 — [`PostListPage.jsx`](./JSX_study/demo/src/pages/PostListPage.jsx)

```jsx
const { data: posts, loading, error } = useFetch(() => fetchPosts({ page, limit: LIMIT }), [page, reloadKey])

if (loading) return ... <p>불러오는 중...</p>
if (error)   return ... <p className="error-text">게시글을 불러오지 못했습니다: {error.message}</p>
                         <button onClick={() => setReloadKey((k) => k + 1)}>다시 시도</button>
if (!posts || posts.length === 0) return ... <p>게시글이 없습니다.</p>
// 성공 → 목록 + 이전/다음
<button disabled={page === 1} ...>← 이전</button>
<button disabled={posts.length < LIMIT} ...>다음 →</button>
```

- `reloadKey`: 값이 바뀌면 `deps`가 바뀌어 **같은 페이지를 다시 요청**하는 "다시 시도" 트릭.
- JSONPlaceholder는 전체 개수를 주지 않으므로 "받은 개수 < LIMIT이면 마지막 페이지"로 판단합니다(스펙 v1의 `meta.totalPages`가 있으면 그것을 씁니다).

### 5. CRUD 만들기 (직접 구현 — 설명용 예제 코드)

저장소 코드는 조회(R) 중심입니다. 아래는 **쓰기 API 함수 + 화면 연동 예제**입니다. (스펙 v1 응답 형태 `{ data }` 기준. JSONPlaceholder에는 `{data}` 래퍼가 없으므로 응답 매핑 위치만 달라집니다.)

```ts
// api/posts.ts (추가 예제)
export interface PostInput { title: string; body: string }

export async function createPost(input: PostInput): Promise<Post> {
  const res = await apiClient.post<{ data: Post }>('/api/posts', input)
  return res.data.data                       // 201
}
export async function updatePost(id: number, patch: Partial<PostInput>): Promise<Post> {
  const res = await apiClient.patch<{ data: Post }>(`/api/posts/${id}`, patch)
  return res.data.data                       // 200
}
export async function deletePost(id: number): Promise<void> {
  await apiClient.delete(`/api/posts/${id}`) // 204, 본문 없음
}
```

```tsx
// 작성 폼 제출 (study5의 폼 + 쓰기 API)
async function handleSubmit(e: FormEvent) {
  e.preventDefault()
  if (submitting) return
  setSubmitting(true)
  try {
    const created = await createPost({ title, body })
    navigate(`/posts/${created.id}`)         // 작성 후 상세로 이동
  } catch (err) {
    setSubmitError(extractMessage(err))      // study5 §5: error.fields 표시
  } finally {
    setSubmitting(false)
  }
}
```

삭제 후 목록을 갱신하는 방법은 두 가지입니다: ① `reloadKey`를 올려 재요청(간단), ② 서버 상태 캐시 무효화(`invalidateQueries`, → study11).

### 6. 실제 백엔드(Spring Boot + PostgreSQL) 연결 + CORS

백엔드는 [`backend-spring/`](./backend-spring)입니다. 프런트가 바꾸는 것은 **주소(환경 변수)뿐**입니다 — 노션 9개월차 체크리스트의 "프런트 코드 수정이 거의 없이 연결됐다"에 해당합니다.

**프런트 쪽 (3곳)**

```bash
# 1) .env.development — 비워 두면 같은 출처(/api)로 호출한다
VITE_API_BASE_URL=
```

```ts
// 2) api/client.ts — baseURL 만 환경 변수에서
export const apiClient = axios.create({ baseURL: config.apiBaseUrl, timeout: 8000 })

// 3) vite.config.ts — 개발 중에는 Vite 프록시가 /api 를 Spring(:8080)으로 중계 → 브라우저에는 같은 출처
const api = { target: env.DEV_PROXY_TARGET ?? 'http://localhost:8080', changeOrigin: true }
server: { port: 5173, proxy: { '/api': api } }
```

**백엔드 쪽 — 노션 Spring 페이지 "공통 API 스펙 v1 맞춤" 6항목**

| 항목 | `backend-spring`에서 | 확인 |
|---|---|---|
| 컨트롤러 경로에 `/api` 접두어 | `@RequestMapping("/api")`, `/api/auth/*` | PostApiTest |
| 목록을 `data`+`meta`(page **1부터**)로 | `PageResponse(data, meta)`, `PageRequest.of(page - 1, …)` | PostApiTest |
| `@RestControllerAdvice`로 `error.code/message/fields/requestId` | `GlobalExceptionHandler` | 모든 4xx 테스트 |
| 목록 기본 크기 10, 최대 50 | `limit` 기본 10, `Math.min(50, …)` | PostApiTest |
| JWT 시크릿을 환경 변수로 | `JWT_SECRET` (properties에 고정값 없음) | PlatformApiTest |
| PostgreSQL을 기본 DB로 | `application.properties` 기본이 PostgreSQL, Flyway 마이그레이션 | 모든 통합 테스트(Testcontainers) |

```java
// PostService — Spring 은 0부터, 스펙은 1부터: 한 곳에서 변환한다
int p = Math.max(1, page == null ? 1 : page);
int l = Math.min(50, Math.max(1, limit == null ? 10 : limit));
Pageable pageable = PageRequest.of(p - 1, l, order);
int totalPages = Math.max(1, (int) Math.ceil(result.getTotalElements() / (double) l));
```

```java
// GlobalExceptionHandler — 검증 실패는 필드별 메시지(fields)로, 500 은 내부 정보 없이 로그에만
@ExceptionHandler(MethodArgumentNotValidException.class)
ResponseEntity<ErrorBody> handleValidation(MethodArgumentNotValidException e, HttpServletRequest req) {
    Map<String, List<String>> fields = new LinkedHashMap<>();
    e.getBindingResult().getFieldErrors().forEach(fe ->
        fields.computeIfAbsent(fe.getField(), k -> new ArrayList<>()).add(fe.getDefaultMessage()));
    return body(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "입력값을 확인하세요.", fields, req);
}
```

**CORS** — 스펙 v1 §7: 허용 출처는 환경 변수 `CORS_ORIGIN`(개발: `http://localhost:5173`), 와일드카드 금지.

```java
// SecurityConfig
@Bean
CorsConfigurationSource corsConfigurationSource(AppProperties props) {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(props.cors().origins());           // CORS_ORIGIN (쉼표로 여러 개)
    config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-Id"));
    config.setExposedHeaders(List.of("X-Request-Id", "Location"));   // 브라우저 JS 가 읽을 수 있게
    config.setMaxAge(600L);                                     // 프리플라이트 결과 캐시
    ...
}
```

**프리플라이트(Preflight)**: JSON `POST`/`PATCH`/`DELETE`나 `Authorization` 헤더가 붙은 요청은 브라우저가 먼저 `OPTIONS`로 허용 여부를 묻습니다. 위 설정이 `OPTIONS`에 `Access-Control-Allow-Headers: authorization…`로 응답해야 실제 요청이 나갑니다. Network 탭에서 같은 URL이 두 번(OPTIONS → 본 요청) 보이면 정상입니다.

**쿠키 인증을 쓸 때 (`withCredentials`)**: 세션 쿠키로 로그인을 유지하는 백엔드라면 양쪽에 설정이 하나씩 더 필요합니다. 이 학습의 기본은 Bearer 토큰(study7)이라 필요 없습니다.

```js
// 프론트: 쿠키를 요청에 실어 보냄
export const apiClient = axios.create({ baseURL: 'http://localhost:8080', withCredentials: true })
```
```text
# 백엔드 응답 헤더 — 이때는 Allow-Origin 에 * 불가, 정확한 출처 명시 필요
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

> 개발 프록시는 **개발 서버 한정**입니다. 운영에서는 Nginx가 `/api`를 같은 도메인에서 Spring으로 프록시하므로 CORS가 필요 없습니다(study17).

### 7. 연결 확인 순서

1. `docker compose up -d db` → PostgreSQL이 `healthy`가 되는지
2. `cd backend-spring && APP_SEED=true ./gradlew bootRun` → 로그에 Flyway 마이그레이션과 시드 메시지
3. `curl localhost:8080/health` → `{"status":"ok"}`, `curl localhost:8080/api/posts?limit=2` → `data`+`meta`, 브라우저에서 `localhost:8080/swagger-ui.html`
4. `cd TSX_study/final && npm run dev` → 목록이 뜨는지, Network 탭의 요청 URL·상태 코드 확인
5. 콘솔에 `blocked by CORS policy`가 없는지 (프록시를 쓰면 CORS 자체가 일어나지 않음)

---

## ✅ 실제 구현·검증 결과

| 항목 | 위치 | 확인한 방법 (직접 실행) |
|---|---|---|
| **Spring Boot 백엔드** — 공통 API 스펙 v1 전체 (인증·글·댓글·AI) | [`backend-spring/`](./backend-spring) (Spring Boot 4.1.1, JPA, Flyway, PostgreSQL) | `./gradlew test` **45개 통과** — JUnit 5 + MockMvc + **Testcontainers 실제 PostgreSQL 16** |
| 스키마 | [`V1__init.sql`](./backend-spring/src/main/resources/db/migration/V1__init.sql) — 노션 PostgreSQL 페이지의 `users`/`posts`(`TEXT[]` 태그, `JSONB`, `TIMESTAMPTZ`, soft delete, FK 인덱스, 부분 인덱스) + `comments`, `ai_*` | Flyway 적용 + Hibernate `ddl-auto=validate` 통과 |
| axios 인스턴스 + 인터셉터 | [`api/client.ts`](./TSX_study/final/src/api/client.ts) | Vitest [`api.test.ts`](./TSX_study/final/src/api/api.test.ts) |
| CRUD 함수 + **zod 응답 검증** | [`api/posts.ts`](./TSX_study/final/src/api/posts.ts), `comments.ts`, `auth.ts` | 약속과 다른 응답이면 즉시 실패하는 테스트 포함 |
| 개발 프록시 | [`vite.config.ts`](./TSX_study/final/vite.config.ts) (`/api` → Spring :8080) | `npm run e2e` **19개 통과** — 실제 PostgreSQL + Spring + Vite |
| **CORS 직접 호출** | `SecurityConfig`의 `CORS_ORIGIN` 허용 목록, 프론트 `VITE_API_BASE_URL=http://localhost:8101` | `npm run e2e:cors` **2개 통과** — JSON POST 성공·`Allow-Origin` 일치·콘솔 CORS 오류 없음 / 허용 안 된 출처는 **403**, 허용된 출처의 프리플라이트는 200 |
| 전체 스택(Nginx → Spring → PostgreSQL) | 루트 [`docker-compose.yml`](./docker-compose.yml) | `npm run e2e:docker` **22개 통과** (study17) |

### 스펙 v1 적합 여부 (노션 "HTTP · REST · API 설계" 항목별)

| 스펙 | 구현 | 테스트 |
|---|---|---|
| 경로 `/api/...`, `/health`(접두어 없음) | ✅ | PlatformApiTest, PostApiTest |
| 단건 `{ data }`, 목록 `{ data, meta }`, 로그인 `{ data: { user, accessToken } }` | ✅ | PostApiTest, AuthApiTest |
| 쿼리 `page`(기본 1) `limit`(기본 10, 1~50) `q`(제목·본문, 대소문자 무시) `sort`(`createdAt` `-createdAt` `-commentCount`) | ✅ (LIKE 와일드카드는 이스케이프) | PostApiTest |
| `POST` → 201 + `Location`, `DELETE` → 204 본문 없음, 수정은 `PATCH` 하나 | ✅ | PostApiTest |
| 오류 `{ error: { code, message, fields?, requestId } }` + 코드 `VALIDATION_ERROR` `BAD_REQUEST` `UNAUTHORIZED` `INVALID_CREDENTIALS` `FORBIDDEN` `NOT_FOUND` `EMAIL_TAKEN` `PAYLOAD_TOO_LARGE` `RATE_LIMITED` `INTERNAL` | ✅ 전부 | 각 테스트 |
| 시각 ISO 8601 UTC, 필드 camelCase, 응답에 비밀번호·해시 없음 | ✅ | PostApiTest, AuthApiTest |
| `X-Request-Id`(요청 값 유지/없으면 생성, 오류 `requestId`와 동일) | ✅ | PlatformApiTest |
| 응답 `Content-Type: application/json; charset=utf-8` (스펙 7절) | ✅ `RequestIdFilter`가 응답 인코딩을 UTF-8로 지정 | PlatformApiTest, E2E(실제 서버) |
| `CORS_ORIGIN` 환경 변수 | ✅ | PlatformApiTest, `e2e:cors` |
| `/api-docs`(OpenAPI 3) | ✅ springdoc | PlatformApiTest |
| 토큰 만료 1시간 | ✅ `JWT_TTL_SECONDS=3600` | AuthApiTest(만료·위조 토큰) |

### 노션 "테스트 기초" — 게시판 API 테스트 체크리스트 7개

| 항목 | 상태 |
|---|---|
| `GET /api/posts` → 200, `data` 배열, `meta.page/limit/total` | ✅ |
| `GET /api/posts/없는id` → 404 `NOT_FOUND` | ✅ |
| `POST /api/posts` 토큰 없이 → 401 | ✅ |
| `POST /api/posts` 제목 빈 값 → 400 `VALIDATION_ERROR` + `fields.title` | ✅ |
| `PATCH /api/posts/:id` 남의 글 → 403 | ✅ |
| `POST /api/auth/signup` 중복 이메일 → 409 `EMAIL_TAKEN` | ✅ |
| `DELETE /api/posts/:id` → 204, 다시 조회하면 404 | ✅ |

### 실제로 겪은 오류

| 증상 | 원인 | 해결 |
|---|---|---|
| 테스트가 전부 **413** | `src/test/resources/application.properties`가 main의 같은 이름 파일을 **가려서**(classpath 우선) 한도 설정이 사라짐 | `application-test.properties` + `@ActiveProfiles("test")`로 main 설정 위에 덮어쓰기 |
| 컨텍스트 로딩 실패 `Failed to convert … SerializationFeature [write-dates-as-timestamps]` | Spring Boot 4는 **Jackson 3** — `spring.jackson.serialization.*` 옛 키가 맞지 않음 | 해당 줄 삭제 (`Instant`는 기본이 ISO 8601) |
| 스펙 7절의 `Content-Type: application/json; charset=utf-8`이 없음(`application/json`만 나옴) — **스펙 대조 중 테스트로 발견** | Spring은 JSON 응답에 charset을 붙이지 않는 것이 기본 | 필터에서 `response.setCharacterEncoding("UTF-8")`. (`server.servlet.encoding.force` 속성만으로는 MockMvc 응답에 붙지 않았음) |
| SSE 본문의 한글이 깨져 보임 | 응답 Content-Type에 charset이 없어 기본 ISO-8859-1로 해석 | `text/event-stream;charset=UTF-8`을 명시 |
| `Message`가 `AiProvider.Message`로 해석되어 Anthropic SDK 타입 오류 | 중첩 타입 이름 충돌 | SDK 타입은 완전한 이름으로 |
| 삭제가 403일 때 `Unhandled Rejection: ApiError` | `await mutation.mutateAsync()`의 거부 미처리 (**테스트가 잡은 실제 버그**) | `try/catch`, 오류는 `mutation.error`로 표시 |
| `@apply` 빌드 오류 `Cannot apply unknown utility class` | Tailwind v4는 별도 CSS의 `@apply`에 `@reference` 필요 | [`App.css`](./TSX_study/final/src/App.css) 맨 위에 `@reference "tailwindcss";` |
| E2E에서 `gradlew.bat`을 못 찾음 | Windows에서 상대 이름은 현재 디렉터리 검색이 막혀 있을 수 있음 | 절대 경로로 호출 ([`start-backend.mjs`](./TSX_study/final/scripts/start-backend.mjs)) |
| Playwright `getByLabel('제목')`이 검색창에 입력됨 | 이름이 **부분 일치**("제목·본문 검색") + 전환 중 이전 화면이 잠깐 남음 | `{ exact: true }` |
| Playwright `waitForResponse`로 프리플라이트를 기다리다 타임아웃 | 브라우저의 프리플라이트는 Playwright 응답 이벤트에 노출되지 않음 | 본 요청(POST) 응답의 `Access-Control-Allow-Origin` 확인 |

### 하지 않은 것

- Spring `prod` 프로파일로 실제 기동해 보기 (JWT_SECRET 필수 동작은 단위 테스트로만 확인)
- JPA와 MyBatis 비교, N+1을 **일부러 재현**해 고치기 (목록에서는 댓글 수를 한 번에 세도록 구현했지만 재현·측정은 하지 않음)
- 기존 `Spring_Boot_Study`의 `project/server`를 스펙 v1에 맞추기 (이 저장소의 새 백엔드로 대신함)

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| `blocked by CORS policy: No 'Access-Control-Allow-Origin' header` | 백엔드가 해당 출처를 허용하지 않음 | 백엔드 CORS에 `http://localhost:5173` 추가 (개발은 Vite 프록시도 가능) |
| `Network Error` (콘솔엔 CORS 없음) | 백엔드 꺼짐 / 포트 오타 / HTTPS·HTTP 혼용 | 백엔드 기동·포트 확인 |
| 요청이 `OPTIONS`에서 403/404 | 서버가 프리플라이트를 처리하지 않음 | `OPTIONS` 허용, `allowedHeaders`에 `Authorization` 포함 |
| `Cannot read properties of undefined (reading 'map')` | 스펙 v1은 `res.data.data`가 배열인데 `res.data`를 그대로 사용 | 응답 구조에 맞춰 `res.data.data` |
| 응답은 오는데 화면이 안 바뀜 | 이전 요청 결과가 늦게 도착 | `ignore` 플래그(useFetch) 확인 |
| `timeout of 5000ms exceeded` | 서버 지연/무응답 | 서버 확인, 필요 시 timeout 조정·재시도 UI |
| 첫 페이지가 계속 빈 값 | 백엔드는 0부터, 프론트는 1부터 | 어느 한쪽에서 변환 (스펙은 1부터) |
| 쓰기 후 JSONPlaceholder 목록이 그대로 | 목업 API는 실제로 저장하지 않음 | 정상. 실제 백엔드에서 확인 |

---

## ☐ 체크리스트

- [ ] 프론트가 DB에 직접 붙지 않고 API를 거치는 이유를 설명할 수 있다
- [x] `axios.create`로 인스턴스를 만들고 `baseURL`·`timeout`을 설정했다
- [ ] `useFetch`의 `ignore` 플래그가 해결하는 문제(오래된 응답 덮어쓰기)를 설명할 수 있다
- [x] 로딩 / 에러(+다시 시도) / 빈 상태 / 성공을 모두 화면에 표시했다
- [x] 페이지네이션(이전/다음, 첫·마지막 페이지 비활성화)을 구현했다
- [x] 작성·수정·삭제(POST/PATCH/DELETE) 함수와 화면 연동을 만들었다
- [ ] `Promise.all`로 서로 독립인 요청을 병렬 처리했다
- [ ] CORS의 원인(출처 불일치)과 해결(백엔드 허용 헤더 / 개발용 Vite 프록시)을 구분해 설명할 수 있다
- [x] **(노션) 대표 조합 1번(React + Spring Boot + PostgreSQL)의 Spring API에 연결, CORS 적용** — `backend-spring`(PostgreSQL)에 프록시·CORS 직접 호출 둘 다 연결·검증. ※ 노션이 말하는 기존 `Spring_Boot_Study` 서버가 아니라 이 저장소의 새 Spring 백엔드

---

## ➡️ 다음 단계 연결

API를 호출할 수 있게 되었으니 [study7](./study7.md)에서 **로그인을 실제 API에 연결**하고, 토큰 저장·새로고침 유지(Zustand `persist`)·401/403 처리(axios 인터셉터)를 다룹니다.
