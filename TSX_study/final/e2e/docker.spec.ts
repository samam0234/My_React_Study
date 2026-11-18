import { expect, test } from '@playwright/test'

// 운영 이미지(Nginx)의 보안 헤더·CSP 가 앱을 깨뜨리지 않는지, SPA fallback 과 SSE 프록시가 동작하는지 확인한다.
test('CSP 위반 없이 주요 화면이 열리고, 새로고침(SPA fallback)과 보안 헤더가 정상이다', async ({
  page,
}) => {
  const violations: string[] = []
  page.on(
    'console',
    (m) => /Content Security Policy|Refused to/i.test(m.text()) && violations.push(m.text()),
  )
  page.on('pageerror', (e) => violations.push(e.message))

  const res = await page.goto('/posts/3') // 새로고침/직접 입력과 같은 상황: index.html 로 fallback 되어야 한다
  expect(res?.status()).toBe(200)
  expect(res?.headers()['content-security-policy']).toContain("default-src 'self'")
  expect(res?.headers()['x-frame-options']).toBe('DENY')
  expect(res?.headers()['x-content-type-options']).toBe('nosniff')
  await expect(page.getByRole('heading', { name: '샘플 글 3' })).toBeVisible()

  await page.goto('/login')
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
  expect(violations).toEqual([])
})

test('해시 파일명 자산은 오래 캐시(immutable), index.html 은 no-cache', async ({
  request,
  page,
}) => {
  await page.goto('/')
  const js = await page.evaluate(() =>
    [...document.scripts].map((s) => s.src).find((s) => s.includes('/assets/')),
  )
  expect(js).toBeTruthy()
  const asset = await request.get(js!)
  expect(asset.headers()['cache-control']).toContain('immutable')
  const index = await request.get('/')
  expect(index.headers()['cache-control']).toContain('no-cache')
})

test('같은 도메인 /api 프록시 (CORS 불필요) 와 헬스체크', async ({ request }) => {
  expect((await request.get('/healthz')).status()).toBe(200)
  const posts = await request.get('/api/posts?limit=2')
  expect(posts.status()).toBe(200)
  expect((await posts.json()).meta.limit).toBe(2)
  expect((await request.get('/api/nope')).status()).toBe(404)
})
