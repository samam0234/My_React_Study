import { expect, test } from '@playwright/test'

test('프록시 없이 다른 출처의 Spring API 를 직접 호출: JSON POST 도 허용되고 콘솔에 CORS 오류 없음', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))
  const calls: string[] = []
  page.on('request', (r) => r.url().startsWith('http://localhost:8101') && calls.push(r.url()))

  await page.goto('/')
  await expect(page.getByRole('listitem')).toHaveCount(10) // 목록은 8101(다른 출처)에서 온다

  await page.getByRole('link', { name: '로그인' }).first().click()
  await page.getByLabel('이메일').fill('mina@example.com')
  await page.getByLabel('비밀번호').fill('password123')
  const loginResponse = page.waitForResponse(
    (r) => r.request().method() === 'POST' && r.url().endsWith('/api/auth/login'),
  )
  await page.getByRole('button', { name: '로그인' }).click()
  const res = await loginResponse
  await expect(page.getByText('mina님')).toBeVisible()
  // 브라우저가 응답을 JS 에 넘겨 준 이유: 서버가 허용 출처를 Allow-Origin 으로 돌려줬기 때문이다.
  expect(res.headers()['access-control-allow-origin']).toBe('http://localhost:5175')

  expect(calls.some((c) => c.includes('/api/posts'))).toBe(true)
  expect(consoleErrors.filter((e) => /CORS|blocked/i.test(e))).toEqual([])
})

test('허용되지 않은 출처의 요청은 서버가 거절한다 (Spring: 403 Invalid CORS request)', async ({
  request,
}) => {
  const denied = await request.get('http://localhost:8101/api/posts', {
    headers: { Origin: 'http://evil.example' },
  })
  expect(denied.status()).toBe(403)
  expect(denied.headers()['access-control-allow-origin']).toBeUndefined()
  // 허용된 출처는 통과하고 프리플라이트도 통과한다
  const ok = await request.fetch('http://localhost:8101/api/posts', {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5175',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  })
  expect(ok.status()).toBe(200)
  expect(ok.headers()['access-control-allow-headers']).toMatch(/authorization/i)
})
