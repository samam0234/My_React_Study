import { defineConfig } from '@playwright/test'

// E2E 는 실제 구성요소를 모두 띄워 브라우저로 확인한다:
//   PostgreSQL(docker compose, :55432) → Spring Boot(:8100, 공통 API 스펙 v1, AI 모의 모델) → Vite 개발 서버(:5174, /api 프록시)
const API_PORT = 8100
const WEB_PORT = 5174

export default defineConfig({
  testDir: 'e2e',
  testIgnore: /(cors|docker)\.spec\.ts/, // CORS 직접 호출·Docker 스택 검증은 별도 설정 (playwright.cors/docker.config.ts)
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: false, // 서버 상태(DB)를 공유하므로 직렬 실행
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${WEB_PORT}`, trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'node scripts/start-backend.mjs',
      env: { PORT: String(API_PORT), CORS_ORIGIN: `http://localhost:${WEB_PORT}` },
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: false,
      timeout: 240_000, // DB 컨테이너 + Gradle 빌드 + Spring 기동
      stdout: 'pipe',
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      env: { DEV_PROXY_TARGET: `http://localhost:${API_PORT}` },
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
    },
  ],
})
