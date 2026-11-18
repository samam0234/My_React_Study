import { defineConfig } from '@playwright/test'

// Docker 스택(Nginx + 백엔드 + ai-proxy 모의)을 대상으로 같은 E2E 를 돌린다 (study17).
// 먼저 저장소 루트에서 `docker compose up -d --build` 를 실행해 http://localhost:8080 을 띄워 둔다.
// 서버 상태(메모리)가 시드 그대로여야 하므로 실행 전 `docker compose restart backend` 를 권장한다.
export default defineConfig({
  testDir: 'e2e',
  testMatch: /(board|docker)\.spec\.ts/,
  workers: 1,
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080' },
})
