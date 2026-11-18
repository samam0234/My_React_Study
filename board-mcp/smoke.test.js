import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { createHttpServer } from './server.js'

const TOKEN = 'test-service-token-0123456789'
let api, mcp, mcpUrl, client

before(async () => {
  // 게시판 API(스펙 v1) 흉내
  api = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    const url = new URL(req.url, 'http://x')
    const now = new Date().toISOString()
    if (url.pathname === '/api/posts') {
      return res.end(JSON.stringify({
        data: [{ id: 1, title: '첫 글', author: { id: 1, nickname: 'mina' }, commentCount: 2, createdAt: now }],
        meta: { page: 1, totalPages: 1, total: 1, q: url.searchParams.get('q') ?? undefined },
      }))
    }
    if (url.pathname === '/api/posts/1') {
      return res.end(JSON.stringify({ data: { id: 1, title: '첫 글', author: { nickname: 'mina' }, tags: ['intro'], body: '본문입니다' } }))
    }
    res.statusCode = 404
    res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' } }))
  })
  await new Promise((r) => api.listen(0, r))
  mcp = createHttpServer({ apiBase: `http://localhost:${api.address().port}`, serviceToken: TOKEN })
  await new Promise((r) => mcp.listen(0, r))
  mcpUrl = new URL(`http://localhost:${mcp.address().port}/mcp`)

  client = new Client({ name: 'smoke', version: '1.0.0' })
  await client.connect(new StreamableHTTPClientTransport(mcpUrl, { requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } } }))
})
after(async () => {
  await client.close()
  mcp.close()
  api.close()
})

const text = (r) => r.content.map((c) => c.text).join('')

describe('board-mcp (Streamable HTTP /mcp)', () => {
  it('인증: 토큰이 없거나 틀리면 401, 올바르면 통과', async () => {
    const noAuth = await fetch(mcpUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    assert.equal(noAuth.status, 401)
    const wrong = await fetch(mcpUrl, { method: 'POST', headers: { Authorization: 'Bearer nope', 'Content-Type': 'application/json' }, body: '{}' })
    assert.equal(wrong.status, 401)
    assert.equal((await fetch(new URL('/health', mcpUrl))).status, 200)
  })

  it('읽기 전용 도구 두 개(search_posts, get_post)와 리소스 board://stats 를 노출한다', async () => {
    const { tools } = await client.listTools()
    assert.deepEqual(tools.map((t) => t.name).sort(), ['get_post', 'search_posts'])
    assert.ok(tools.every((t) => t.description))
    const { resources } = await client.listResources()
    assert.deepEqual(resources.map((r) => r.uri), ['board://stats'])
  })

  it('search_posts: 검색 결과를 텍스트로 돌려준다', async () => {
    const r = await client.callTool({ name: 'search_posts', arguments: { q: '첫', limit: 5 } })
    assert.match(text(r), /#1 첫 글 — mina \(댓글 2\)/)
    assert.match(text(r), /전체 1건/)
  })

  it('get_post: 본문을 돌려주고, 없는 글은 isError', async () => {
    assert.match(text(await client.callTool({ name: 'get_post', arguments: { post_id: 1 } })), /본문입니다/)
    const missing = await client.callTool({ name: 'get_post', arguments: { post_id: 999 } })
    assert.equal(missing.isError, true)
    assert.match(text(missing), /게시글을 찾을 수 없습니다/)
  })

  it('입력 범위를 벗어나면 거부한다 (limit 최대 20)', async () => {
    const r = await client.callTool({ name: 'search_posts', arguments: { q: 'x', limit: 999 } }).catch((e) => ({ isError: true, content: [{ text: String(e) }] }))
    assert.equal(r.isError, true)
  })

  it('board://stats 리소스를 읽을 수 있다', async () => {
    const r = await client.readResource({ uri: 'board://stats' })
    assert.match(r.contents[0].text, /글 수: 1/)
  })
})
