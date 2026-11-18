import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// 시드 계정(Spring 의 APP_SEED=true): mina@example.com(홀수 글 작성자) / jun@example.com / admin@example.com, 비밀번호 password123
async function login(page: Page, email = 'mina@example.com', password = 'password123') {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: '로그인' }).click()
}

// 로그인 요청이 끝나기 전에 다른 페이지로 이동하면 요청이 취소되므로, 성공을 확인한 뒤 다음 동작으로 넘어간다.
async function loginOk(page: Page, email = 'mina@example.com') {
  await login(page, email)
  await expect(page.getByText(`${email.split('@')[0]}님`)).toBeVisible()
}

test.describe.configure({ mode: 'serial' })

test('목록: 10개씩 보이고 페이지 이동은 URL 에 반영된다', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('listitem')).toHaveCount(10)
  await page.getByRole('button', { name: /다음/ }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText('2 / 3 페이지')).toBeVisible()
})

test('검색: 서버 검색(q)과 URL 반영, 새로고침해도 유지', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('제목·본문 검색').fill('샘플 글 2')
  await expect(page).toHaveURL(/q=/)
  await expect(page.getByRole('listitem').first()).toContainText('샘플 글 2')
  await page.reload()
  await expect(page.getByLabel('제목·본문 검색')).toHaveValue('샘플 글 2')
})

test('비로그인으로 보호된 페이지에 가면 로그인 후 원래 위치로 돌아온다', async ({ page }) => {
  await page.goto('/mypage')
  await expect(page).toHaveURL(/\/login/)
  await page.getByLabel('이메일').fill('mina@example.com')
  await page.getByLabel('비밀번호').fill('password123')
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page).toHaveURL(/\/mypage/)
  await expect(page.getByRole('heading', { name: '마이페이지' })).toBeVisible()
})

test('로그인 실패는 이유를 숨기고, 새로고침해도 로그인이 유지된다 (persist)', async ({ page }) => {
  await login(page, 'mina@example.com', 'wrong-password')
  await expect(page.getByRole('alert')).toContainText('이메일 또는 비밀번호가 올바르지 않습니다.')
  await login(page)
  await expect(page.getByText('mina님')).toBeVisible()
  await page.reload()
  await expect(page.getByText('mina님')).toBeVisible()
  const saved = await page.evaluate(() => localStorage.getItem('board-auth'))
  expect(saved).toContain('accessToken')
})

test('글쓰기 → 목록 반영 → 수정 → 삭제 (작성자)', async ({ page }) => {
  await loginOk(page)
  await page.getByRole('link', { name: '글쓰기' }).first().click()
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByText('제목을 입력하세요.')).toBeVisible()

  await page.getByLabel('제목', { exact: true }).fill('E2E 글')
  await page.getByLabel('본문', { exact: true }).fill('E2E 본문')
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByRole('heading', { name: 'E2E 글' })).toBeVisible()

  await page.getByRole('link', { name: '수정' }).click()
  await page.getByLabel('제목', { exact: true }).fill('E2E 글 (수정)')
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByRole('heading', { name: 'E2E 글 (수정)' })).toBeVisible()

  await page.getByRole('button', { name: '삭제' }).click()
  await page.getByRole('button', { name: '삭제 확인' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('E2E 글 (수정)')).toHaveCount(0)
})

test('즐겨찾기: 새로고침 후에도 유지되고 마이페이지에 제목으로 나온다', async ({ page }) => {
  await loginOk(page)
  await page.goto('/')
  await page.getByRole('button', { name: '즐겨찾기', exact: true }).first().click()
  await page.reload()
  await expect(page.getByRole('button', { name: '즐겨찾기 해제' })).toHaveCount(1)
  await page.getByRole('link', { name: '마이페이지' }).click()
  await expect(page.getByText('즐겨찾기한 게시글 (1개)')).toBeVisible()
})

test('남의 글: 수정/삭제 버튼이 없고, 직접 DELETE 해도 403 (서버가 막는다)', async ({ page }) => {
  await loginOk(page, 'jun@example.com')
  await page.goto('/posts/1') // 글 1 의 작성자는 mina
  await expect(page.getByRole('heading', { name: '샘플 글 1' })).toBeVisible()
  await expect(page.getByRole('button', { name: '삭제' })).toHaveCount(0)
  const status = await page.evaluate(async () => {
    const token = JSON.parse(localStorage.getItem('board-auth')!).state.accessToken
    const res = await fetch('/api/posts/1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.status
  })
  expect(status).toBe(403)
})

test('401: 토큰이 손상되면 세션이 정리되고 로그인 화면으로 이동한다', async ({ page }) => {
  await loginOk(page)
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('board-auth')!)
    s.state.accessToken = 'broken.token.value'
    localStorage.setItem('board-auth', JSON.stringify(s))
  })
  await page.goto('/posts/new') // 새 로드 → 손상 토큰 복원
  await page.getByLabel('제목', { exact: true }).fill('x')
  await page.getByLabel('본문', { exact: true }).fill('y')
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('link', { name: '로그인' }).first()).toBeVisible()
})

test('댓글 작성/삭제와 AI 요약(모의 모델) 스트리밍', async ({ page }) => {
  await loginOk(page, 'jun@example.com')
  await page.goto('/posts/2')
  await page.getByLabel('댓글 쓰기').fill('E2E 댓글')
  await page.getByRole('button', { name: '댓글 등록' }).click()
  await expect(page.getByText('E2E 댓글')).toBeVisible()
  await page.getByRole('button', { name: 'jun의 댓글 삭제' }).click()
  await expect(page.getByText('E2E 댓글')).toHaveCount(0)

  await page.getByRole('button', { name: 'AI 요약' }).click()
  await expect(page.getByText(/모의 응답입니다/)).toBeVisible()
  await expect(page.getByText(/틀릴 수 있습니다/)).toBeVisible()
})

test('회원가입 → 자동 로그인, 중복 이메일은 이메일 칸 오류', async ({ page }) => {
  await page.goto('/signup')
  const email = `e2e${Date.now()}@example.com`
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('닉네임').fill('e2euser')
  await page.getByLabel('비밀번호').fill('password123')
  await page.getByRole('button', { name: '가입하기' }).click()
  await expect(page.getByText('e2euser님')).toBeVisible()

  await page.getByRole('button', { name: '로그아웃' }).click()
  await page.goto('/signup')
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('닉네임').fill('another')
  await page.getByLabel('비밀번호').fill('password123')
  await page.getByRole('button', { name: '가입하기' }).click()
  await expect(page.getByText('이미 사용 중인 이메일입니다.')).toBeVisible()
})

test('없는 경로는 404 화면, 없는 글은 안내 문구', async ({ page }) => {
  await page.goto('/no/such/path')
  await expect(page.getByText(/404/)).toBeVisible()
  await page.goto('/posts/99999')
  await expect(page.getByRole('alert')).toContainText('게시글을 찾을 수 없습니다.')
})

test('키보드만으로 로그인할 수 있다 (접근성)', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('이메일').focus()
  await page.keyboard.type('mina@example.com')
  await page.keyboard.press('Tab')
  await page.keyboard.type('password123')
  await page.keyboard.press('Enter')
  await expect(page.getByText('mina님')).toBeVisible()
})

test('모바일 폭(375px)에서도 가로 스크롤이 생기지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('listitem').first()).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(overflow).toBe(false)
})

test('다크 모드: OS 설정(prefers-color-scheme)에 따라 배경색이 바뀐다', async ({ page }) => {
  const bg = async (scheme: 'light' | 'dark') => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto('/')
    await expect(page.getByRole('listitem').first()).toBeVisible()
    return page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  }
  const light = await bg('light')
  const dark = await bg('dark')
  expect(light).not.toBe(dark)
})

test('반응형: 넓은 화면(md↑)에서는 목록이 2열 그리드가 된다', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await page.goto('/')
  const cols = await page
    .locator('ul.grid')
    .first()
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
  expect(cols).toBe(2)
  await page.setViewportSize({ width: 375, height: 800 })
  const mobileCols = await page
    .locator('ul.grid')
    .first()
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
  expect(mobileCols).toBe(1)
})

test('관리자는 남의 글을 삭제할 수 있다 (role=admin)', async ({ page }) => {
  // jun 이 글을 쓰고 로그아웃 → admin 이 로그인해 삭제
  await loginOk(page, 'jun@example.com')
  await page.getByRole('link', { name: '글쓰기' }).first().click()
  await page.getByLabel('제목', { exact: true }).fill('관리자 삭제 대상')
  await page.getByLabel('본문', { exact: true }).fill('본문')
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByRole('heading', { name: '관리자 삭제 대상' })).toBeVisible()
  const postUrl = page.url()
  await page.getByRole('button', { name: '로그아웃' }).click()

  await loginOk(page, 'admin@example.com')
  await page.goto(postUrl)
  await expect(page.getByRole('link', { name: '수정' })).toHaveCount(0) // 수정은 작성자만
  await page.getByRole('button', { name: '삭제' }).click()
  await page.getByRole('button', { name: '삭제 확인' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('관리자 삭제 대상')).toHaveCount(0)
})

test('AI로 다듬기: 제안이 뜨고 "본문에 적용"을 눌러야 반영된다 (모의 모델)', async ({ page }) => {
  await loginOk(page, 'jun@example.com')
  await page.getByRole('link', { name: '글쓰기' }).first().click()
  await page.getByLabel('본문', { exact: true }).fill('엉망인 문장')
  await page.getByRole('button', { name: 'AI로 다듬기' }).click()
  await expect(page.getByText(/모의 응답입니다/)).toBeVisible()
  await expect(page.getByLabel('본문', { exact: true })).toHaveValue('엉망인 문장')
  await page.getByRole('button', { name: '본문에 적용' }).click()
  await expect(page.getByLabel('본문', { exact: true })).toHaveValue(/모의 응답입니다/)
})

test('다크 모드 토글: 눌러서 바꾸면 배경색이 바뀌고 새로고침해도 유지된다', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const light = await bg()
  await page.getByRole('button', { name: /테마 전환/ }).click() // 시스템 → 라이트
  await page.getByRole('button', { name: /테마 전환/ }).click() // 라이트 → 다크
  await expect(page.locator('html')).toHaveClass(/dark/)
  const dark = await bg()
  expect(dark).not.toBe(light)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/) // persist
})

test('공통 헤더(스펙 v1 7절): JSON 응답은 charset=utf-8, X-Request-Id가 붙는다', async ({ request }) => {
  const res = await request.get('/api/posts?limit=1')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toMatch(/application\/json;\s*charset=utf-8/i)
  expect(res.headers()['x-request-id']).toBeTruthy()
})
