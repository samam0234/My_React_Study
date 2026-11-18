import { defineConfig } from '@playwright/test'

// CORS 직접 호출 검증 (study6): 프록시 없이 브라우저가 다른 출처(:8101)의 Spring API 를 직접 호출한다.
// 백엔드는 CORS_ORIGIN 허용 목록의 출처에만 Access-Control-Allow-Origin 을 내려준다.
export default defineConfig({
  testDir: 'e2e',
  testMatch: /cors\.spec\.ts/,
  globalTeardown: './e2e/global-teardown.ts',
  workers: 1,
  use: { baseURL: 'http://localhost:5175' },
  webServer: [
    {
      command: 'node scripts/start-backend.mjs',
      env: { PORT: '8101', CORS_ORIGIN: 'http://localhost:5175' },
      url: 'http://localhost:8101/health',
      reuseExistingServer: false,
      timeout: 240_000,
      stdout: 'pipe',
    },
    {
      command: 'npx vite --port 5175 --strictPort',
      env: { VITE_API_BASE_URL: 'http://localhost:8101' },
      url: 'http://localhost:5175',
      reuseExistingServer: false,
    },
  ],
})
