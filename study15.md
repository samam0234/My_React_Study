# study15 — 고급 테스트·CI

> 🎯 **목표**: 단위·통합(MSW)·E2E(Playwright) 테스트를 역할별로 나누어 작성하고, 커버리지를 확인하며, GitHub Actions로 `typecheck → lint → test → build`를 자동 실행한다.

- 이전: [study14.md](./study14.md) — TypeScript·정적 분석
- 다음: [study16.md](./study16.md) — 보안·운영 심화
- 선행: [study9.md](./study9.md)의 Vitest + React Testing Library 설정 (이 문서는 그 설정이 되어 있다고 가정)

> ✅ **실제 코드와 검증**: MSW 통합 테스트, Playwright E2E(**실제 PostgreSQL + Spring Boot 기동**), Spring의 Testcontainers 통합 테스트, 커버리지를 **작성하고 실행**했습니다. CI 워크플로 파일([`.github/workflows/ci.yml`](./.github/workflows/ci.yml))은 작성했지만 **GitHub Actions에서는 한 번도 실행하지 않았습니다**(로컬에서 같은 명령을 각각 실행해 확인).

---

## 📖 이론

### 15.1 테스트 피라미드

```text
        ▲  E2E (Playwright)      적게 — 실제 브라우저, 느리지만 현실적
       ▲▲▲  통합 (RTL + MSW)     중간 — 화면 + API 응답 흐름
     ▲▲▲▲▲▲  단위 (Vitest)       많이 — 함수·스토어·훅, 빠름
```

| 층 | 무엇을 검증 | 이 프로젝트의 예 |
|---|---|---|
| 단위 | 입력→출력이 명확한 로직 | `validate`, `favoritesStore.toggle`, `useFetch` |
| 통합 | 여러 조각이 함께 동작 | 목록 페이지가 로딩→목록→페이지 이동을 보여줌 |
| E2E | 사용자 시나리오 전체 | 로그인 → 보호 페이지 → 즐겨찾기 → 로그아웃 |

### 15.2 API를 어떻게 다루나 — MSW

통합 테스트에서 실제 서버를 부르면 느리고 불안정합니다. **MSW(Mock Service Worker)** 는 네트워크 요청 단계에서 가로채 가짜 응답을 줍니다. `axios.get`을 모킹(`vi.mock`)하는 것보다 **실제 요청 코드까지 통과**시켜서 더 현실적입니다.

### 15.3 CI란

코드를 올릴 때마다 서버(GitHub Actions)가 **같은 명령을 자동으로** 실행해 깨졌는지 알려 주는 것. 내 PC에서만 되는 문제를 막습니다.

---

## 🛠️ 실기

### 1. 통합 테스트 — MSW로 목록 페이지

```bash
npm i -D msw
```

```ts
// src/test/server.ts
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('https://jsonplaceholder.typicode.com/posts', ({ request }) => {
    const page = Number(new URL(request.url).searchParams.get('_page') ?? 1)
    return HttpResponse.json(
      Array.from({ length: 10 }, (_, i) => ({ id: (page - 1) * 10 + i + 1, userId: 1, title: `글 ${(page - 1) * 10 + i + 1}`, body: '' })),
    )
  }),
]
export const server = setupServer(...handlers)
```

```ts
// src/test/setup.ts 에 추가
import { server } from './server'
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))   // 정의 안 된 요청은 실패 → 실수 발견
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

```tsx
// src/pages/PostListPage.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PostListPage from './PostListPage'

it('목록을 불러와 보여주고, 다음 페이지로 이동한다', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter><PostListPage /></MemoryRouter>)

  expect(screen.getByText('불러오는 중...')).toBeInTheDocument()          // 로딩
  expect(await screen.findByText('글 1')).toBeInTheDocument()             // 성공

  await user.click(screen.getByRole('button', { name: /다음/ }))
  expect(await screen.findByText('글 11')).toBeInTheDocument()            // 2페이지
})

it('서버 오류면 에러 문구가 보인다', async () => {
  server.use(http.get('https://jsonplaceholder.typicode.com/posts', () => HttpResponse.error()))
  render(<MemoryRouter><PostListPage /></MemoryRouter>)
  expect(await screen.findByText(/불러오지 못했습니다/)).toBeInTheDocument()
})
```

| 포인트 | 설명 |
|---|---|
| `server.use(...)` | 특정 테스트에서만 응답을 바꿔 **에러·빈 상태·401** 시나리오 검증 |
| `findBy…` | 비동기로 나타날 때까지 대기 |
| `onUnhandledRequest: 'error'` | 테스트가 몰래 실제 네트워크를 호출하지 못하게 |
| 상태 격리 | 스토어(Zustand)는 `beforeEach`에서 `setState`로 초기화 |

TanStack Query(study11)를 쓴다면 테스트마다 **새 `QueryClient`**(`retry: false`)를 만들어 Provider로 감싸야 캐시가 테스트 사이에 새지 않습니다.

### 2. 보호된 라우트 통합 테스트

```tsx
it('비로그인으로 /mypage에 가면 로그인 화면으로 간다', () => {
  render(
    <MemoryRouter initialEntries={['/mypage']}>
      <Routes>
        <Route path="/login" element={<p>로그인 화면</p>} />
        <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
  )
  expect(screen.getByText('로그인 화면')).toBeInTheDocument()
})
```

### 3. E2E — Playwright

```bash
npm i -D @playwright/test
npx playwright install      # 브라우저 다운로드
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'npm run preview -- --port 4173', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI },
  use: { baseURL: 'http://localhost:4173' },
})
```

```ts
// e2e/favorite.spec.ts — 사용자 시나리오 하나
import { test, expect } from '@playwright/test'

test('로그인 후 즐겨찾기하고 마이페이지에서 확인한다', async ({ page }) => {
  await page.goto('/mypage')                                    // 비로그인 → 로그인으로 리다이렉트
  await expect(page).toHaveURL(/\/login/)

  await page.getByLabel('이메일').fill('test@example.com')
  await page.getByLabel('비밀번호').fill('password123')
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page).toHaveURL(/\/mypage/)                      // 원래 가려던 곳으로 복귀

  await page.getByRole('link', { name: '목록' }).click()
  await page.getByRole('button', { name: '☆' }).first().click()
  await page.getByRole('link', { name: '마이페이지' }).click()
  await expect(page.getByText('즐겨찾기한 게시글 (1개)')).toBeVisible()
})
```

> 이 시나리오는 현재 `TSX_study/project`의 동작(가짜 로그인, 메모리 상태)과 UI 문구([`MyPage.tsx:17`](./TSX_study/project/src/pages/MyPage.tsx))에 맞췄습니다. 주의: `MyPage` 이동을 **클릭(`Link`)** 으로 해야 합니다. 페이지를 새로 로드(`goto`)하면 메모리 상태(로그인·즐겨찾기)가 초기화되기 때문입니다 (study7의 `persist`를 적용하면 달라짐).

E2E 원칙: **핵심 사용자 흐름 소수만**(로그인, 핵심 CRUD), 선택자는 `getByRole`/`getByLabel`로 안정적으로.

### 4. 커버리지

```bash
npm i -D @vitest/coverage-v8
```
```ts
// vite.config.ts 의 test 옵션에 추가
coverage: { provider: 'v8', reporter: ['text', 'html'], include: ['src/**/*.{ts,tsx}'], exclude: ['src/main.tsx', 'src/test/**'] }
```
```bash
npx vitest run --coverage      # coverage/index.html 열어보기
```

커버리지 숫자는 **빠진 곳을 찾는 도구**이지 목표가 아닙니다. 100%를 쫓기보다 "로그인·결제·삭제처럼 깨지면 곤란한 곳"을 먼저 채웁니다.

### 5. CI — GitHub Actions

이 저장소는 **한 저장소 안에 프로젝트가 여러 개**(`JSX_study/demo`, `JSX_study/project`, `TSX_study/demo`, `TSX_study/project`)이므로 `working-directory`를 지정합니다. 워크플로 파일 위치는 **저장소 루트**의 `.github/workflows/ci.yml`입니다. (노션 `ci.yml`을 이 구조에 맞게 조정)

```yaml
name: ci
on:
  push:
    branches: [master]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: TSX_study/project
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: TSX_study/project/package-lock.json
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:run
      - run: npm run build

  e2e:
    needs: test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: TSX_study/project
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: TSX_study/project/package-lock.json
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test
```

| 줄 | 설명 |
|---|---|
| `on.push.branches: [master]` | 이 저장소의 기본 브랜치는 `master` (노션 예시의 `main`과 다름) |
| `defaults.run.working-directory` | 모든 `run` 단계를 프로젝트 폴더에서 실행 |
| `cache` + `cache-dependency-path` | 하위 폴더의 `package-lock.json` 기준으로 npm 캐시 |
| `npm ci` | `package-lock.json` 그대로 **재현 가능한 설치** (`npm install`과 다름) |
| `needs: test` | 단위·통합이 통과해야 느린 E2E 실행 |
| 실패 시 | 빨간 ✗ 표시, PR 병합 전에 차단 (브랜치 보호 규칙과 함께) |

**비밀 값**은 저장소 Settings → Secrets에 넣고 `${{ secrets.NAME }}`로 참조합니다. 코드·워크플로 파일에 직접 쓰지 않습니다.

### 6. CI가 실패했을 때 읽는 순서

1. Actions 탭 → 실패한 job → 빨간 step의 로그 맨 아래 오류
2. **로컬에서 같은 명령 재현**: `npm ci && npm run typecheck && npm run lint && npm run test:run && npm run build`
3. "내 PC에서는 되는데" → Node 버전(22), `npm ci` vs `npm install`, 대소문자 파일명(Windows는 구분 안 함, Linux는 구분) 확인

---

## ✅ 실제 실행 결과

| 종류 | 명령 | 결과 |
|---|---|---|
| 타입·린트·포맷 | `npm run check` (final) | 통과 (경고 0) |
| 프런트 단위·통합 (Vitest + RTL + **MSW**) | `npm run test:run` | **7개 파일 83개 통과** — 정의되지 않은 요청은 `onUnhandledRequest: 'error'`로 실패 |
| 커버리지 | `npm run coverage` | 문장 92.9% · 분기 81.4% · 함수 91.2% · 라인 94.9% |
| **백엔드 통합 (JUnit 5 + MockMvc + Testcontainers PostgreSQL 16)** | `cd backend-spring && ./gradlew test` | **45개 통과** |
| E2E (Playwright, 실제 Chromium) | `npm run e2e` | **19개 통과** — `docker compose`의 PostgreSQL(:55432) → Spring Boot jar(:8100, 시드·AI 모의) → Vite를 [`start-backend.mjs`](./TSX_study/final/scripts/start-backend.mjs)와 Playwright가 직접 띄움 |
| E2E: CORS 직접 호출 | `npm run e2e:cors` | 2개 통과 |
| E2E: Docker 스택(Nginx+Spring+PostgreSQL) | `npm run e2e:docker` | **22개 통과** (`board.spec` 재사용 19 + 운영 이미지 전용 3) |
| board-mcp | `cd board-mcp && npm test` | 6개 통과 (Streamable HTTP로 실제 연결) |

**E2E가 다루는 시나리오** ([`e2e/board.spec.ts`](./TSX_study/final/e2e/board.spec.ts), 19개): 목록·페이지·검색(URL 반영) / 보호된 라우트 복귀 / 로그인 실패·persist / 글쓰기→수정→삭제 / 즐겨찾기 유지 / 남의 글 직접 DELETE 403 / 손상 토큰 401 / 댓글·AI 요약 / 가입(중복 이메일) / 404 / 키보드 로그인 / 모바일 폭 / 다크 모드(OS 설정) / 반응형 열 수 / **관리자 삭제** / **AI로 다듬기** / **다크 모드 토글 유지**.

### 노션 "테스트 기초" 학습 목표와 비교

| 노션 목표 | 상태 |
|---|---|
| 단위·통합·E2E 차이 설명 | 이 문서 이론 (개념) |
| Arrange-Act-Assert 패턴으로 단위 테스트 | ✅ (프런트·백엔드 테스트) |
| 게시판 API 통합 테스트 (성공 + 400 + 401 + 404) | ✅ `PostApiTest` 등 (체크리스트 7개 전부, [study6](./study6.md)) |
| mock / stub 으로 외부 의존 끊기 | ✅ `MockAiProvider`(모델 API), MSW(프런트의 API) |
| 테스트 DB 분리 (SQLite 메모리 또는 Testcontainers) | ✅ **Testcontainers PostgreSQL 16** — 운영과 같은 엔진·Flyway 마이그레이션 |
| Playwright로 로그인 → 글쓰기 E2E 1개 | ✅ (19개) |
| GitHub Actions에서 테스트 자동 실행 | ❌ 워크플로 작성만, **GitHub에서 미실행** |

### 실제로 겪은 문제

| 증상 | 원인 | 해결 |
|---|---|---|
| 로그인 직후 `page.goto('/')` 하면 로그인이 풀려 있음 | 로그인 요청이 끝나기 전에 이동해 요청이 취소됨 (경쟁 상태) | 로그인 성공(`mina님` 표시)을 기다린 뒤 다음 동작 (`loginOk` 헬퍼) |
| `getByRole('button', { name: '즐겨찾기' })`가 필터 버튼을 눌러 버림 | 이름 **부분 일치**("즐겨찾기만 보기") | `{ exact: true }` |
| 기본 `playwright test`가 CORS·Docker 전용 스펙까지 실행 | `testDir`가 `e2e/` 전체 | 기본 설정 `testIgnore`로 분리, 각자 설정 파일 |
| E2E 서버가 시작하지 못함 (`gradlew.bat` 못 찾음) | Windows에서 상대 이름 실행 | 절대 경로 |
| 통합 테스트끼리 데이터가 섞일까 걱정 | 컨테이너 하나를 공유 | 테스트마다 고유 이메일·제목 키 사용 |
| 목록 요청이 테스트에서 실제 네트워크로 나감 | 핸들러 누락 | `onUnhandledRequest: 'error'`로 즉시 발견 |

### CI 파일 (작성만, 미실행)

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) — 노션 "배포 · Nginx · CI/CD 기초"의 ci.yml 구조(테스트 → 빌드 → 이미지)를 이 저장소에 맞춘 것:

| job | 내용 |
|---|---|
| `backend` | JDK 21, `./gradlew test`(Testcontainers: ubuntu-latest에는 Docker 있음), `bootJar` |
| `frontend` | Node 22, `npm ci` → `npm run check` → `test:run` → `build` |
| `mcp` | `npm ci` → `npm test` |
| `e2e` | `needs: [backend, frontend]`, JDK+Node, Playwright 설치, `e2e`·`e2e:cors` (실패 시 trace 업로드) |
| `docker` | `docker compose build` |

기본 브랜치는 이 저장소의 `master`(노션 예시의 `main`과 다름), 하위 폴더라 `working-directory` 지정, `npm ci`. [`.github/dependabot.yml`](./.github/dependabot.yml)은 npm·gradle·actions 업데이트 PR 설정입니다.

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| MSW: `[MSW] Error: intercepted a request without a matching request handler` | 핸들러 URL 불일치 | 핸들러 URL(전체 주소)·메소드 확인 |
| 테스트 간 데이터가 섞임 | 스토어·QueryClient 상태 공유 | `beforeEach`에서 초기화, 테스트별 `QueryClient` |
| `act(...)` 경고 | 비동기 갱신 미대기 | `findBy…`/`waitFor` |
| 타임아웃 `Unable to find…` | 로딩이 끝나기 전 검사 | `await findBy…` |
| Playwright: 브라우저가 없음 | `playwright install` 누락 | 설치 명령 (CI는 `--with-deps`) |
| E2E가 가끔 실패 (flaky) | 고정 시간 대기·불안정 선택자 | 자동 대기 `expect(...)`, `getByRole` |
| CI에서만 실패 | 로컬과 환경 차이 (Node 버전, lock 파일, 대소문자) | Node 버전 고정, `npm ci`, 파일명 대소문자 확인 |
| CI가 시작도 안 함 | 워크플로 위치/문법 오류 | 루트 `.github/workflows/*.yml`, YAML 들여쓰기 |
| `npm ci` 실패: lock 불일치 | `package.json`만 수정하고 lock 미갱신 | 로컬에서 `npm install` 후 lock 커밋 |

---

## ☐ 체크리스트

- [ ] 단위/통합/E2E가 각각 무엇을 검증하는지 예를 들어 설명할 수 있다
- [x] MSW로 API를 가로채 **성공·에러** 시나리오를 통합 테스트로 작성했다
- [x] 보호된 라우트 리다이렉트를 `MemoryRouter`로 테스트했다
- [x] Playwright로 로그인→즐겨찾기 E2E를 1개 작성하고 통과시켰다
- [x] 커버리지 리포트에서 **빠진 핵심 로직**을 찾아 테스트를 추가했다
- [ ] `.github/workflows/ci.yml`을 만들고 `typecheck → lint → test → build`가 자동 실행된다 — **파일은 작성, GitHub에서는 미실행**
- [ ] `npm ci`와 `npm install`의 차이를 설명할 수 있다
- [ ] 테스트 결과(통과/실패 개수, 커버리지)를 studyFinal의 "테스트 결과" 표에 옮겨 적을 수 있다

---

## ➡️ 다음 단계 연결

자동 검사가 갖춰졌으니 [study16](./study16.md)에서 **보안 점검, 로깅, 모니터링, 에러 처리**로 운영 단계의 문제를 다룹니다.
