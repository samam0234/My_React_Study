// E2E 용 백엔드 기동 스크립트: (1) 격리된 PostgreSQL 컨테이너(docker compose, 프로젝트명 board-e2e, 포트 55432)를 띄우고
// (2) Spring Boot 를 빌드해서 실행한다. 종료는 Playwright 가 이 프로세스를 끝내고, DB 는 global-teardown 이 내린다.
import { execFileSync, spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const project = process.env.E2E_COMPOSE_PROJECT ?? 'board-e2e'
const dbPort = process.env.E2E_DB_PORT ?? '55432'
const port = process.env.PORT ?? '8100'
const isWin = process.platform === 'win32'
const composeFile = path.join(root, 'docker-compose.yml')

// 매번 깨끗한 DB 로 시작한다 (시드 계정 mina/jun/admin, 글 25개)
const dbEnv = { ...process.env, DB_PORT: dbPort }
execFileSync('docker', ['compose', '-p', project, '-f', composeFile, 'down', '-v'], {
  stdio: 'ignore',
  env: dbEnv,
})
execFileSync('docker', ['compose', '-p', project, '-f', composeFile, 'up', '-d', '--wait', 'db'], {
  stdio: 'inherit',
  env: dbEnv,
})

const backendDir = path.join(root, 'backend-spring')
// 상대 이름은 Windows 에서 현재 디렉터리 검색이 막혀 있을 수 있으므로 절대 경로로 부른다
const gradle = path.join(backendDir, isWin ? 'gradlew.bat' : 'gradlew')
execFileSync(gradle, ['bootJar', '--no-daemon', '-q'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: isWin,
})

// java 를 직접 실행해서 Playwright 가 프로세스를 끝내면 서버도 같이 끝나게 한다 (gradle bootRun 은 자식 JVM 이 남을 수 있다)
const jar = path.join(backendDir, 'build', 'libs', 'board-api-1.0.0.jar')
const child = spawn('java', ['-jar', jar], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port,
    DB_URL: `jdbc:postgresql://localhost:${dbPort}/board`,
    DB_USER: 'board',
    DB_PASSWORD: 'board',
    APP_SEED: 'true',
    JWT_SECRET: 'e2e-only-secret-e2e-only-secret-0123456789',
    AI_PROVIDER: 'mock', // E2E 는 실제 모델을 호출하지 않는다
    AI_REQUESTS_PER_MINUTE: '1000',
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5174',
  },
})
child.on('exit', (code) => process.exit(code ?? 0))
