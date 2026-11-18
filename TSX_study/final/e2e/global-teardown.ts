import { execFileSync } from 'node:child_process'
import path from 'node:path'

// E2E 가 끝나면 격리된 PostgreSQL 컨테이너(board-e2e)와 볼륨을 지운다.
export default function globalTeardown() {
  const composeFile = path.resolve(import.meta.dirname, '../../../docker-compose.yml')
  try {
    execFileSync(
      'docker',
      [
        'compose',
        '-p',
        process.env.E2E_COMPOSE_PROJECT ?? 'board-e2e',
        '-f',
        composeFile,
        'down',
        '-v',
      ],
      { stdio: 'ignore', env: { ...process.env, DB_PORT: process.env.E2E_DB_PORT ?? '55432' } },
    )
  } catch {
    // docker 가 없거나 이미 내려간 경우는 무시
  }
}
