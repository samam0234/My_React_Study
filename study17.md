# study17 — Docker·배포 자동화

> 🎯 **목표**: React 빌드(Nginx)와 Spring Boot, PostgreSQL을 **docker compose**로 묶어 한 번에 띄우고, GitHub Actions로 이미지를 레지스트리(ghcr.io)에 올려 외부 서비스에 **자동 배포**하는 과정을 이해하고 실행한다.

- 이전: [study16.md](./study16.md) — 보안·운영 심화
- 다음: [study18.md](./study18.md) — AI 연동·MCP
- 대상: 루트 [`docker-compose.yml`](./docker-compose.yml), [`backend-spring/Dockerfile`](./backend-spring/Dockerfile), [`TSX_study/final/Dockerfile`](./TSX_study/final/Dockerfile), [`TSX_study/final/nginx/`](./TSX_study/final/nginx)

> ✅ **실제 코드와 검증**: 위 파일들을 **작성하고 `docker compose build` / `up`으로 실행·검증**했습니다(Nginx → Spring Boot → PostgreSQL 전체 스택에 E2E 22개 통과). **ghcr.io 푸시와 외부 서비스 자동 배포, HTTPS는 하지 않았습니다**([`deploy.yml`](./.github/workflows/deploy.yml)은 작성만, 미실행). 아래 "실제 실행 결과"를 먼저 보세요.

---

## 📖 이론

### 17.1 왜 Docker로 묶나

"내 PC에서는 되는데"를 없애기 위해 **실행 환경까지 이미지 하나로 패키징**합니다. 빌드 도구가 큰 스택(Node, Java)은 **빌드 단계와 실행 단계를 나누는 멀티 스테이지**를 씁니다(노션 Docker 페이지). 최종 이미지에는 Node·Gradle·`node_modules`가 없어 작고 안전합니다.

| 용어 | 뜻 |
|---|---|
| 이미지 | 앱 + 런타임 + 설정을 굳힌 읽기 전용 틀 (`docker build`) |
| 컨테이너 | 이미지를 실행한 것. 지우면 안의 변경은 사라진다 → **볼륨** |
| compose | 여러 컨테이너(앱 + DB + Nginx)를 선언적으로 묶는 도구 |

### 17.2 배포 그림 (노션 "배포 · Nginx · CI/CD 기초")

```text
브라우저 ──HTTPS 443──▶ Nginx(web) ──┬─ /       → 정적 파일 (React 빌드 결과 dist/)
                                     └─ /api/   → api 컨테이너(Spring Boot :8080) ──▶ db 컨테이너(PostgreSQL :5432)
```

프론트와 API를 **같은 도메인**에 두면 **CORS가 필요 없고** 쿠키 인증도 그대로 동작합니다. 이때 프런트의 `VITE_API_BASE_URL`은 비워 둡니다(상대 경로 `/api`). **서비스 이름(`api`, `db`)이 곧 컨테이너 간 호스트 이름**이고, 컨테이너 안에서 `localhost`는 자기 자신입니다.

### 17.3 환경 변수와 비밀

| 위치 | 규칙 |
|---|---|
| Vite(`VITE_*`) | **빌드 때** 코드에 박힌다 → 공개 값만, 컨테이너 실행 시 바꿀 수 없음 (`ARG`로 주입) |
| Spring | `application.properties`의 `${ENV:기본값}`. 운영은 `SPRING_PROFILES_ACTIVE=prod` + `JWT_SECRET` 필수 |
| compose | 파일에는 `${DB_PASSWORD}`만 쓰고 값은 `.env`(git 제외), 키 이름만 `.env.example` |
| 이미지 | **비밀을 `ENV`나 `COPY .env`로 이미지에 굽지 않는다** — 이미지를 받은 사람은 누구나 꺼낼 수 있다 |

### 17.4 CI/CD

| 단계 | 내용 |
|---|---|
| CI | 테스트·빌드 확인 (study15) |
| 이미지 빌드·푸시 | 레지스트리(ghcr.io, Docker Hub)에 이미지 업로드 |
| CD | 서버/호스팅이 새 이미지를 받아 교체 (`docker compose pull && docker compose up -d`) |

---

## 🛠️ 실기

### 1. 백엔드 `backend-spring/Dockerfile` (멀티 스테이지, 비 root)

```dockerfile
# ---------- 1) 빌드 ----------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true   # 의존성 레이어 캐시
COPY src src
RUN ./gradlew --no-daemon bootJar -x test

# ---------- 2) 실행 ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -m app          # 비 root 로 실행
COPY --from=build /app/build/libs/board-api-1.0.0.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

| 줄 | 설명 |
|---|---|
| `COPY gradlew settings.gradle build.gradle` → `dependencies` → `COPY src` | **의존성 정의를 먼저** 복사해 다운로드 결과를 레이어 캐시로 재사용. 소스만 바뀌면 의존성은 다시 받지 않음 |
| `-x test` | 이미지 빌드에서는 테스트를 건너뜀(테스트는 CI가 이미 돌림 — Testcontainers는 이미지 빌드 안에서 Docker를 쓸 수 없음) |
| `eclipse-temurin:21-jre` | 실행 단계에는 JDK/Gradle이 없다. 소스는 로컬 JDK 26으로 작성했지만 `options.release = 21`이라 21 런타임에서 돈다 |
| `USER app` | 컨테이너가 침해돼도 root 권한이 아니다 |

### 2. 프런트 `TSX_study/final/Dockerfile` (Node 빌드 → Nginx)

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=""            # 비우면 같은 도메인의 /api (Nginx 가 프록시 → CORS 불필요)
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build                    # tsc -b && vite build

FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
```

각각 `.dockerignore`에 `node_modules`, `dist`, `build`, `.gradle`, `.env*`를 넣어 **내 PC의 OS용 패키지와 비밀 파일이 이미지에 들어가지 않게** 합니다.

### 3. `nginx/default.conf` — SPA fallback + API 프록시 + 캐시 + SSE

핵심만 (전체는 [`default.conf`](./TSX_study/final/nginx/default.conf)):

```nginx
resolver 127.0.0.11 valid=10s ipv6=off;   # Docker 내장 DNS
set $api_upstream http://api:8080;        # compose 서비스 이름

location / {                               # SPA: 없는 경로는 index.html (새로고침 404 방지)
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache" always;
    include /etc/nginx/snippets/security-headers.conf;
}
location /assets/ {                        # 파일명에 해시가 있어 오래 캐시해도 안전
    try_files $uri =404;
    expires 1y;
    add_header Cache-Control "public, immutable" always;
    include /etc/nginx/snippets/security-headers.conf;
}
location /api/ {                           # API → Spring Boot (원래 URI 유지)
    proxy_pass $api_upstream;
    proxy_set_header X-Forwarded-Proto $scheme;
    include /etc/nginx/snippets/security-headers.conf;
}
location /api/ai/ {                        # AI 스트리밍(SSE): 버퍼링을 꺼야 글자가 생성되는 대로 도착
    proxy_pass $api_upstream;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_read_timeout 120s;
    include /etc/nginx/snippets/security-headers.conf;
}
```

| 포인트 | 설명 |
|---|---|
| `try_files … /index.html` | study4 §6, study10의 SPA fallback |
| 변수 `proxy_pass` + `resolver` | 백엔드가 아직 없어도 Nginx는 **시작**되고 요청 시점에 해석(없으면 502). 고정 호스트면 `host not found in upstream`으로 시작 실패 |
| `/api/ai/` 별도 location | 노션: SSE는 `proxy_buffering off`. 더 구체적인 경로라 `/api/`보다 우선 |
| `security-headers.conf`를 **각 location에서 include** | location 안에 `add_header`가 하나라도 있으면 server 레벨 `add_header`는 **상속되지 않는다** |
| CSP | `default-src 'self'; script-src 'self'; style-src 'self'; …` — [`security-headers.conf`](./TSX_study/final/nginx/security-headers.conf) |

### 4. `docker-compose.yml` — 앱 + DB (노션 Docker 페이지의 패턴)

[`docker-compose.yml`](./docker-compose.yml)의 구조:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_DB: board, POSTGRES_USER: board, POSTGRES_PASSWORD: ${DB_PASSWORD:-board} }
    ports: ["${DB_PORT:-5432}:5432"]          # 로컬 개발용 — 운영에서는 ports 를 빼면 compose 내부에서만 보인다
    volumes: [db-data:/var/lib/postgresql/data]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U board -d board"], interval: 3s, retries: 20 }

  api:
    build: ./backend-spring
    environment:
      DB_URL: jdbc:postgresql://db:5432/board        # 호스트 이름 = 서비스 이름
      DB_PASSWORD: ${DB_PASSWORD:-board}
      JWT_SECRET: ${JWT_SECRET:-}                    # 운영에서는 필수
      CORS_ORIGIN: http://localhost:${WEB_PORT:-8080}
      APP_SEED: ${APP_SEED:-true}                    # 데모 데이터. 운영에서는 false
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}      # 비우면 AI 는 모의 응답
    depends_on: { db: { condition: service_healthy } }   # DB 가 준비된 뒤 시작

  web:
    build: { context: ./TSX_study/final, args: { VITE_API_BASE_URL: "" } }
    ports: ["${WEB_PORT:-8080}:80"]
    depends_on: [api]

  mcp:                                               # 선택: docker compose --profile mcp up -d
    profiles: ["mcp"]
    build: ./board-mcp
    environment: { BOARD_API_BASE: http://api:8080, MCP_SERVICE_TOKEN: ${MCP_SERVICE_TOKEN:-} }
    ports: ["${MCP_PORT:-8787}:8787"]

volumes:
  db-data:
```

- **포트** `"8080:80"` = 호스트:컨테이너. DB 포트는 개발·E2E에서만 연다.
- **볼륨** `db-data`는 데이터 보관(`docker compose down`은 볼륨을 남기고, `down -v`는 지운다).
- **`.env`**: 값은 `.env`(git 제외), 키 이름만 [`.env.example`](./.env.example). compose 파일에는 `${변수}`만 쓴다.
- E2E는 같은 파일의 `db`만 **별도 프로젝트명**(`board-e2e`, 포트 55432)으로 띄워 개발 DB와 섞이지 않게 합니다([`start-backend.mjs`](./TSX_study/final/scripts/start-backend.mjs)).

### 5. 로컬에서 실행·확인

```bash
cp .env.example .env            # 필요한 값만 채운다 (키가 없어도 데모는 동작: AI 는 모의 응답)
docker compose up -d --build    # → http://localhost:8080
docker compose ps               # db / api / web 이 healthy 인지
docker compose logs -f api
curl localhost:8080/healthz     # Nginx
curl localhost:8080/api/posts?limit=2   # Nginx → Spring → PostgreSQL
docker compose down -v          # 컨테이너와 볼륨 삭제 (주의: DB 데이터도 사라짐)
```

데모 계정(`APP_SEED=true`): `mina@example.com` / `jun@example.com` / `admin@example.com`, 비밀번호 `password123`. **운영에서는 `APP_SEED=false`와 새 `JWT_SECRET`을 반드시 설정**하고 `SPRING_PROFILES_ACTIVE=prod`로 실행합니다.

### 6. GitHub Actions — CI와 이미지 푸시 (작성만, 미실행)

- [`ci.yml`](./.github/workflows/ci.yml): backend / frontend / mcp → e2e → docker (study15).
- [`deploy.yml`](./.github/workflows/deploy.yml): `ci` 성공 후 `web`·`api`·`mcp` 이미지를 `ghcr.io/<저장소 소문자>/…:latest`와 커밋 SHA 태그로 푸시.

```yaml
permissions: { contents: read, packages: write }      # GITHUB_TOKEN 이 ghcr.io 에 쓸 수 있게
steps:
  - uses: docker/login-action@v3
    with: { registry: ghcr.io, username: "${{ github.actor }}", password: "${{ secrets.GITHUB_TOKEN }}" }
  - id: repo
    run: echo "name=$(echo '${{ github.repository }}' | tr 'A-Z' 'a-z')" >> "$GITHUB_OUTPUT"   # ghcr 이름은 소문자만
  - uses: docker/build-push-action@v6
    with: { context: ./backend-spring, push: true, tags: "ghcr.io/${{ steps.repo.outputs.name }}/api:${{ github.event.workflow_run.head_sha }}" }
```

SHA 태그를 남기면 이전 이미지로 **되돌릴 수 있습니다(롤백)**. 비밀(SSH 키 등)은 저장소 Settings → Secrets에만 둡니다.

### 7. 외부 서비스로 자동 배포 — 3가지 길 (노션)

| 대상 | 맞는 것 | 메모 |
|---|---|---|
| Vercel / Netlify | **정적 SPA만** | Git 연결만으로 자동 배포·PR 미리보기, HTTPS 자동. API는 별도 도메인 → **백엔드 `CORS_ORIGIN`에 배포 URL 추가**, `VITE_API_BASE_URL` 설정 |
| Render | Spring(Docker) + PostgreSQL | 무료 플랜은 잠들었다 깨어나는 지연. 환경 변수에 `DB_URL`·`JWT_SECRET` |
| VPS + Docker compose | 이 compose 그대로 + 호스트의 Nginx/HTTPS | 가장 많이 배우지만 서버 관리를 직접. `docker compose pull && docker compose up -d` |

노션의 "추천 첫 배포"는 **React + Spring Boot + PostgreSQL을 compose로 묶어 Render 또는 VPS에** 올리는 것입니다(이 문서의 스택과 같음).

### 8. 배포 후 확인

1. `https://도메인/` 접속, `/posts/3` **새로고침** 정상 (SPA fallback)
2. Network 탭에서 `/api/...`가 **같은 출처**로 나가는가 (CORS 오류 없음)
3. 로그인 → 글쓰기 → 목록 반영, 남의 글 삭제 시 403
4. `docker compose logs -f api web`에 오류 없음, 로그에 비밀번호·토큰 없음
5. 이전 이미지 태그로 되돌리는 방법을 알고 있는가

---

## ✅ 실제 실행 결과

| 항목 | 결과 |
|---|---|
| `docker compose build` | 성공: `react-web` **94.4MB**, `react-api` **669MB**(JRE 21 + Spring Boot) |
| `docker compose up -d` | `db`(PostgreSQL 16) → `api`(Flyway 마이그레이션·시드) → `web`(Nginx) 순서로 기동, 셋 다 healthy |
| `GET /healthz` (Nginx), `GET /posts/3` (직접 접속 = 새로고침) | 200 — SPA fallback |
| `GET /api/posts?limit=2` (Nginx → Spring → PostgreSQL) | 200, `meta.limit == 2` |
| 응답 헤더 | `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `index.html`은 `no-cache`, 해시 자산은 `immutable` |
| DB 확인 | `psql`로 6개 테이블(`users` `posts` `comments` `ai_conversations` `ai_messages` `flyway_schema_history`)과 E2E가 만든 행 확인 |
| `npm run e2e:docker` | **22개 통과** — 같은 E2E를 운영 이미지에 실행: CSP 위반 0, `immutable` 캐시, **AI 요약 SSE가 Nginx를 통해 스트리밍**됨, 관리자 삭제, 다크 모드 토글 |
| `docker compose config` | 문법 검증 통과 |

### 실제로 겪은 것

| 문제 | 해결 |
|---|---|
| 백엔드 컨테이너가 없을 때 `proxy_pass http://api:8080;`는 `host not found in upstream`으로 **Nginx 자체가 시작 실패** | `resolver 127.0.0.11` + `set $api_upstream …` + `proxy_pass $api_upstream;` (요청 시점 해석) |
| location 안에 `add_header`가 하나라도 있으면 server 레벨 `add_header`가 **상속되지 않음** | 보안 헤더를 `snippets/security-headers.conf`로 빼서 **각 location에서 include** |
| SSE가 한꺼번에 도착할 위험 | `/api/ai/` location에 `proxy_buffering off`, 서버 응답에 `X-Accel-Buffering: no` |
| `docker compose config`가 `MCP_SERVICE_TOKEN is missing` 오류 | `profiles`로 꺼 둔 서비스의 `${VAR:?}`도 **보간 단계에서 평가**됨 → `${VAR:-}`로 두고 MCP 서버가 시작 시 토큰 부재를 거절 |
| `ports`로 DB를 열어 둔 채 운영하는 실수 방지 | 파일에 "개발용, 운영에서는 ports 제거" 주석, E2E는 별도 프로젝트·포트 사용 |

### 하지 않은 것

- GitHub Actions 첫 실행, ghcr.io 이미지 푸시 ([`deploy.yml`](./.github/workflows/deploy.yml)은 소문자 변환 등 알려진 함정을 반영해 작성만 함)
- 외부 서비스(Vercel/Netlify/Render/VPS) 자동 배포, **HTTPS**(certbot), 롤백 절차 실행
- `SPRING_PROFILES_ACTIVE=prod`로 컨테이너 기동, 이미지 취약점 스캔, `api` 이미지 크기 줄이기(669MB — jlink/slim 이미지 미적용)

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| `npm ci` 단계 실패 (이미지 빌드) | `package-lock.json` 미복사/불일치 | lock 파일 포함해 복사, 로컬에서 갱신 후 커밋 |
| 이미지가 너무 큼 | 단일 스테이지, `node_modules`·Gradle 캐시 포함 | 멀티 스테이지 + `.dockerignore` |
| 컨테이너에서 새로고침 404 | `nginx.conf`의 `try_files` 누락 | §3 설정 |
| API가 `localhost:8080`으로 감 | 빌드 때 개발용 값이 박힘 | `ARG VITE_API_BASE_URL=""`, `.env.production` 확인 |
| 컨테이너 안에서 DB 접속 실패 (`Connection refused`) | `localhost`는 컨테이너 자신 | `DB_URL=jdbc:postgresql://db:5432/board` (서비스 이름) |
| `api`가 DB보다 먼저 떠서 죽음 | `depends_on`만으로는 "준비됨"을 보장하지 않음 | `healthcheck` + `condition: service_healthy` |
| 로그인할 때마다 토큰이 무효 | `JWT_SECRET`이 비어 재시작마다 임시 키 생성 | 환경 변수로 고정 (운영은 필수) |
| Actions: `denied: permission_denied: write_package` | `permissions.packages: write` 누락 | 권한 추가 |
| Actions: `repository name must be lowercase` | 소유자/저장소 이름에 대문자 | 소문자 변환 |
| `.env`가 이미지에 포함됨 | `.dockerignore` 누락 | `.env*` 추가 |
| Render 무료 플랜 첫 요청이 느림 | 유휴 후 재기동 | 정상 |
| `down -v` 후 데이터가 사라짐 | 볼륨까지 삭제 | 운영에서는 `down`만, 백업 확인 |

---

## ☐ 체크리스트

- [ ] 이미지와 컨테이너의 차이, 멀티 스테이지 빌드가 필요한 이유(최종 이미지에 빌드 도구 불필요)를 설명할 수 있다
- [x] `Dockerfile`(백엔드·프런트), `.dockerignore`, `nginx/`를 작성하고 `docker compose build`가 성공했다
- [x] 로컬 컨테이너에서 `/posts/3` 새로고침이 정상 동작한다 (SPA fallback)
- [x] `VITE_*`가 빌드 때 박힌다는 점과 `ARG`로 주입하는 방법을 안다
- [ ] 같은 도메인 + `/api` 프록시일 때 CORS가 필요 없는 이유를 설명할 수 있다
- [x] `docker-compose.yml`로 **web + api + db(PostgreSQL)** 를 함께 띄웠다 (healthcheck·볼륨·`.env` 분리 포함)
- [x] 컨테이너를 **비 root**로 실행하고 비밀을 이미지에 굽지 않았다 (`USER app`, `.dockerignore`, `${변수}`)
- [ ] GitHub Actions로 이미지를 ghcr.io에 푸시했다 — **미완료** (워크플로 파일만 작성)
- [ ] 외부 서비스(Vercel/Netlify/Render/VPS 중 하나)에 **push → 자동 배포**가 되도록 설정했다 — **미완료**
- [ ] 배포 URL: ______________ / 롤백 방법을 한 줄로 적었다
- [ ] 운영용 `prod` 프로파일 + 새 `JWT_SECRET` + `APP_SEED=false`로 기동해 봤다 — **미완료**

---

## ➡️ 다음 단계 연결

서비스를 배포할 수 있게 되었으니 [study18](./study18.md)에서 **AI 모델 API를 백엔드에 연동**하고, **MCP**로 AI가 이 서비스의 기능을 도구로 호출하는 기초를 다룹니다.
