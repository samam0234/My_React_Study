// 노션 "AI 모델 연동 · MCP" §8: 내 게시판을 MCP 서버로 노출한다.
//   - 배포한 웹 서버에 붙일 때는 Streamable HTTP (/mcp). 인증은 필수(Authorization: Bearer <MCP_SERVICE_TOKEN>).
//   - 도구: search_posts(q, limit), get_post(post_id) — 모두 읽기 전용. 리소스: board://stats.
//   - 데이터는 게시판 백엔드(Spring Boot, 공통 API 스펙 v1)의 공개 읽기 API 에서 가져온다.
import { createServer } from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { z } from 'zod'

const asText = (text) => ({ content: [{ type: 'text', text }] })
const asError = (err) => ({ isError: true, content: [{ type: 'text', text: `오류: ${err.message}` }] })

export function createBoardMcp({ apiBase }) {
  const base = apiBase.replace(/\/$/, '')

  async function getJson(pathAndQuery) {
    const res = await fetch(`${base}${pathAndQuery}`, { signal: AbortSignal.timeout(8000) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(`API ${res.status}: ${json?.error?.message ?? res.statusText}`)
    return json
  }

  const server = new McpServer({ name: 'board', version: '1.0.0' })

  // 최소 권한: 읽기 전용 도구만 노출한다. 쓰기·삭제 도구는 사용자 확인 절차를 설계한 뒤에 추가한다.
  server.registerTool(
    'search_posts',
    {
      title: '게시글 검색',
      description: '게시판 글을 제목·내용으로 검색한다(읽기 전용). 최대 20개.',
      inputSchema: {
        q: z.string().max(100).describe('검색어'),
        limit: z.number().int().min(1).max(20).default(10).describe('가져올 개수(최대 20)'),
      },
    },
    async ({ q, limit }) => {
      try {
        const qs = new URLSearchParams({ q, limit: String(limit), page: '1' })
        const { data, meta } = await getJson(`/api/posts?${qs}`)
        const lines = data.map((p) => `#${p.id} ${p.title} — ${p.author.nickname} (댓글 ${p.commentCount})`)
        return asText(`${lines.join('\n') || '(결과 없음)'}\n\n전체 ${meta.total}건 중 ${data.length}건`)
      } catch (err) {
        return asError(err)
      }
    },
  )

  server.registerTool(
    'get_post',
    {
      title: '게시글 조회',
      description: '글 하나를 id로 가져온다(읽기 전용). 본문과 태그를 돌려준다.',
      inputSchema: { post_id: z.number().int().min(1).describe('게시글 id') },
    },
    async ({ post_id }) => {
      try {
        const { data: p } = await getJson(`/api/posts/${post_id}`)
        return asText(`#${p.id} ${p.title}\n작성자: ${p.author.nickname}\n태그: ${p.tags.join(', ') || '없음'}\n\n${p.body}`)
      } catch (err) {
        return asError(err)
      }
    },
  )

  server.registerResource(
    'stats',
    'board://stats',
    { title: '게시판 통계', description: '게시판 통계(글 수, 오늘 작성 수).', mimeType: 'text/plain' },
    async (uri) => {
      const { data, meta } = await getJson('/api/posts?page=1&limit=50&sort=-createdAt')
      const today = new Date().toISOString().slice(0, 10)
      const todayCount = data.filter((p) => String(p.createdAt).startsWith(today)).length
      return {
        contents: [
          {
            uri: uri.href,
            text: `글 수: ${meta.total}\n오늘 작성 수: ${todayCount}${meta.total > 50 ? ' (최근 50개 기준)' : ''}`,
          },
        ],
      }
    },
  )

  return server
}

const bearerOk = (header, token) => {
  if (!token) return false
  const expected = Buffer.from(`Bearer ${token}`)
  const given = Buffer.from(header ?? '')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** Streamable HTTP 서버. 요청마다 서버·트랜스포트를 새로 만드는 stateless 방식(세션 없음). */
export function createHttpServer({ apiBase, serviceToken }) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (req.method === 'GET' && url.pathname === '/health') {
      res.setHeader('Content-Type', 'application/json')
      return res.end('{"status":"ok"}')
    }
    if (url.pathname !== '/mcp') {
      res.statusCode = 404
      return res.end()
    }
    // 원격 MCP 서버는 인터넷에 열리므로 인증이 필수다 (노션 §8-5). 토큰이 없거나 틀리면 401.
    if (!bearerOk(req.headers.authorization, serviceToken)) {
      res.statusCode = 401
      res.setHeader('WWW-Authenticate', 'Bearer')
      res.setHeader('Content-Type', 'application/json')
      return res.end('{"error":{"code":"UNAUTHORIZED","message":"토큰이 없거나 올바르지 않습니다."}}')
    }
    if (req.method !== 'POST') {
      res.statusCode = 405 // stateless 모드에서는 GET(SSE 스트림)·DELETE(세션 종료)를 지원하지 않는다
      res.setHeader('Allow', 'POST')
      return res.end()
    }
    const chunks = []
    for await (const c of req) chunks.push(c)
    let body
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      res.statusCode = 400
      return res.end()
    }
    const server = createBoardMcp({ apiBase })
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    res.on('close', () => {
      transport.close()
      server.close()
    })
    await server.connect(transport)
    await transport.handleRequest(req, res, body)
  })
}

// 직접 실행했을 때만 서버를 시작한다 (테스트에서 import 해도 부작용 없음)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const serviceToken = process.env.MCP_SERVICE_TOKEN ?? ''
  if (serviceToken.length < 16) {
    console.error('MCP_SERVICE_TOKEN(16자 이상의 긴 랜덤 값)이 필요합니다. 인증 없는 MCP 서버는 시작하지 않습니다.')
    process.exit(1)
  }
  const apiBase = process.env.BOARD_API_BASE ?? 'http://localhost:8080'
  const port = Number(process.env.PORT ?? 8787)
  createHttpServer({ apiBase, serviceToken }).listen(port, () =>
    console.error(`board-mcp listening on :${port}/mcp (API: ${apiBase})`),
  )
}
