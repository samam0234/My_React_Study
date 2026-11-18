import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useToastStore } from '@/store/toastStore'
import { admin, comment, jun, mina, post } from '@/test/fixtures'
import { apiError, server } from '@/test/server'
import { loginAs, renderRoute } from '@/test/utils'
import LoginPage from './LoginPage'
import MyPage from './MyPage'
import PostDetailPage from './PostDetailPage'
import PostFormPage from './PostFormPage'
import PostListPage from './PostListPage'
import SignupPage from './SignupPage'

const user = () => userEvent.setup()

describe('PostListPage', () => {
  it('로딩 → 10개 목록, 페이지 이동은 URL(?page=)에 반영된다', async () => {
    renderRoute(<PostListPage />)
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
    expect(await screen.findByText('글 1')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(10)

    await user().click(screen.getByRole('button', { name: /다음/ }))
    expect(await screen.findByText('글 11')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('?page=2')
    expect(screen.getByText('2 / 3 페이지')).toBeInTheDocument()
  })

  it('URL 의 q·page 로 시작하면 그 상태로 보여 준다 (새로고침·공유에 안전)', async () => {
    renderRoute(<PostListPage />, { route: '/?q=글 2&page=1' })
    expect(await screen.findByText('글 20')).toBeInTheDocument()
    expect(screen.queryByText('글 1')).not.toBeInTheDocument()
    expect(screen.getByLabelText('제목·본문 검색')).toHaveValue('글 2')
  })

  it('검색어를 입력하면 디바운스 후 서버 검색(q)으로 바뀌고 1페이지로 돌아간다', async () => {
    renderRoute(<PostListPage />, { route: '/?page=2' })
    await screen.findByText('글 11')
    await user().type(screen.getByLabelText('제목·본문 검색'), '글 25')
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/q=/), {
      timeout: 2000,
    })
    expect(await screen.findByText('글 25')).toBeInTheDocument()
    expect(screen.queryByText('글 11')).not.toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).not.toMatch(/page=/)
  })

  it('검색 결과가 없으면 빈 상태 문구', async () => {
    renderRoute(<PostListPage />, { route: '/?q=없는검색어' })
    expect(await screen.findByText('게시글이 없습니다.')).toBeInTheDocument()
  })

  it('서버 오류면 에러 문구와 다시 시도 버튼, 누르면 복구된다', async () => {
    let fail = true
    server.use(
      http.get('*/api/posts', ({ request }) => {
        if (fail) return apiError(500, 'INTERNAL', '서버 오류')
        return HttpResponse.json(
          {
            data: [
              {
                id: 1,
                title: '복구된 글',
                author: { id: 1, nickname: 'mina' },
                commentCount: 0,
                createdAt: 'x',
              },
            ],
            meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
          { headers: { 'x-url': request.url } },
        )
      }),
    )
    renderRoute(<PostListPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('불러오지 못했습니다')
    fail = false
    await user().click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByText('복구된 글')).toBeInTheDocument()
  })

  it('즐겨찾기: 비로그인이면 안내 토스트, 로그인하면 토글되고 "즐겨찾기만 보기"로 거른다', async () => {
    renderRoute(<PostListPage />)
    await screen.findByText('글 1')
    await user().click(screen.getAllByRole('button', { name: '즐겨찾기' })[0]!)
    expect(useToastStore.getState().toasts[0]?.message).toMatch(/로그인/)
    expect(useFavoritesStore.getState().favoritePostIds).toEqual([])
  })

  it('로그인 상태의 즐겨찾기 토글 + 필터', async () => {
    loginAs()
    renderRoute(<PostListPage />)
    await screen.findByText('글 1')
    await user().click(screen.getAllByRole('button', { name: '즐겨찾기' })[2]!)
    expect(useFavoritesStore.getState().favoritePostIds).toEqual([3])
    await user().click(screen.getByRole('button', { name: '즐겨찾기만 보기' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('글 3')).toBeInTheDocument()
  })

  it('로그인했을 때만 글쓰기 버튼이 보인다', async () => {
    renderRoute(<PostListPage />)
    await screen.findByText('글 1')
    expect(screen.queryByRole('link', { name: '글쓰기' })).not.toBeInTheDocument()
  })
})

describe('PostDetailPage', () => {
  const route = (id: number) => ({ path: '/posts/:id', route: `/posts/${id}` })

  it('본문·태그·댓글을 보여 주고, 본문은 HTML 로 해석하지 않는다(XSS)', async () => {
    server.use(
      http.get('*/api/posts/1', () =>
        HttpResponse.json({
          data: post(1, { body: '<img src=x onerror=alert(1)>', tags: ['intro'] }),
        }),
      ),
    )
    renderRoute(<PostDetailPage />, route(1))
    expect(await screen.findByRole('heading', { name: '글 1' })).toBeInTheDocument()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument() // 문자 그대로 출력
    expect(document.querySelector('img')).toBeNull()
    expect(screen.getByText('#intro')).toBeInTheDocument()
    expect(await screen.findByText('댓글 1')).toBeInTheDocument()
  })

  it('없는 글은 404 안내', async () => {
    renderRoute(<PostDetailPage />, route(999))
    expect(await screen.findByRole('alert')).toHaveTextContent('게시글을 찾을 수 없습니다.')
  })

  it('작성자에게만 수정·삭제 버튼이 보인다 (UI 일 뿐, 진짜 검사는 서버 403)', async () => {
    loginAs(jun)
    const { unmount } = renderRoute(<PostDetailPage />, route(1))
    await screen.findByRole('heading', { name: '글 1' })
    expect(screen.queryByRole('link', { name: '수정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
    unmount()

    loginAs(mina)
    renderRoute(<PostDetailPage />, route(1))
    await screen.findByRole('heading', { name: '글 1' })
    expect(screen.getByRole('link', { name: '수정' })).toBeInTheDocument()
  })

  it('관리자는 남의 글에 삭제 버튼이 보이지만 수정 링크는 없다', async () => {
    loginAs(admin)
    renderRoute(<PostDetailPage />, route(1))
    await screen.findByRole('heading', { name: '글 1' })
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '수정' })).not.toBeInTheDocument()
  })

  it('삭제: 한 번 더 확인한 뒤 DELETE 요청하고 목록으로 이동한다', async () => {
    loginAs(mina)
    let deleted = false
    server.use(
      http.delete('*/api/posts/1', () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderRoute(<PostDetailPage />, route(1))
    await screen.findByRole('heading', { name: '글 1' })
    await user().click(screen.getByRole('button', { name: '삭제' }))
    expect(deleted).toBe(false) // 아직 요청 안 함
    await user().click(screen.getByRole('button', { name: '삭제 확인' }))
    await waitFor(() => expect(deleted).toBe(true))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/))
    expect(useToastStore.getState().toasts[0]?.message).toMatch(/삭제/)
  })

  it('삭제가 403 이면 오류 문구가 보이고 이동하지 않으며 로그아웃되지 않는다', async () => {
    loginAs(mina)
    server.use(http.delete('*/api/posts/1', () => apiError(403, 'FORBIDDEN', '작성자만')))
    renderRoute(<PostDetailPage />, route(1))
    await screen.findByRole('heading', { name: '글 1' })
    await user().click(screen.getByRole('button', { name: '삭제' }))
    await user().click(screen.getByRole('button', { name: '삭제 확인' }))
    expect(await screen.findByText(/삭제 실패/)).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/posts/1')
    expect(useAuthStore.getState().accessToken).not.toBeNull()
  })

  it('댓글 작성: 빈 값은 클라이언트 검증, 정상 값은 POST 후 목록 갱신', async () => {
    loginAs(jun)
    const list = [comment(1, 1)]
    server.use(
      http.get('*/api/posts/1/comments', () => HttpResponse.json({ data: list })),
      http.post('*/api/posts/1/comments', async ({ request }) => {
        const { body } = (await request.json()) as { body: string }
        const c = comment(2, 1, { body })
        list.push(c)
        return HttpResponse.json({ data: c }, { status: 201 })
      }),
    )
    renderRoute(<PostDetailPage />, route(1))
    await screen.findByText('댓글 1')
    await user().click(screen.getByRole('button', { name: '댓글 등록' }))
    expect(screen.getByText('댓글을 입력하세요.')).toBeInTheDocument()
    await user().type(screen.getByLabelText('댓글 쓰기'), '새로 쓴 댓글')
    await user().click(screen.getByRole('button', { name: '댓글 등록' }))
    expect(await screen.findByText('새로 쓴 댓글')).toBeInTheDocument()
  })

  it('비로그인이면 댓글 입력 대신 로그인 안내', async () => {
    renderRoute(<PostDetailPage />, route(1))
    await screen.findByRole('heading', { name: '글 1' })
    expect(screen.queryByLabelText('댓글 쓰기')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument()
  })
})

describe('PostFormPage', () => {
  it('작성: 빈 제출은 클라이언트 검증 오류, 서버 오류(fields)는 입력란 아래에 표시', async () => {
    loginAs()
    server.use(
      http.post('*/api/posts', () =>
        apiError(400, 'VALIDATION_ERROR', '확인', { title: ['1~200자로 입력하세요.'] }),
      ),
    )
    renderRoute(<PostFormPage />, { path: '/posts/new', route: '/posts/new' })
    await user().click(screen.getByRole('button', { name: '저장' }))
    expect(screen.getByText('제목을 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('본문을 입력하세요.')).toBeInTheDocument()

    await user().type(screen.getByLabelText('제목'), 't')
    await user().type(screen.getByLabelText('본문'), 'b')
    await user().click(screen.getByRole('button', { name: '저장' }))
    expect(await screen.findByText('1~200자로 입력하세요.')).toBeInTheDocument()
    expect(screen.getByLabelText('제목')).toHaveAttribute('aria-invalid', 'true')
  })

  it('AI로 다듬기: 제안을 보여 주고 "본문에 적용"을 눌러야 반영된다', async () => {
    loginAs()
    server.use(
      http.post('*/api/ai/chat', () =>
        HttpResponse.json({
          data: { text: '다듬어진 본문입니다.' },
          meta: { usage: { inputTokens: 3, outputTokens: 4 } },
        }),
      ),
    )
    renderRoute(<PostFormPage />, { path: '/posts/new', route: '/posts/new' })
    expect(screen.getByRole('button', { name: 'AI로 다듬기' })).toBeDisabled() // 본문이 비어 있으면 비활성
    await user().type(screen.getByLabelText('본문', { exact: true }), '엉망인 문장')
    await user().click(screen.getByRole('button', { name: 'AI로 다듬기' }))
    expect(await screen.findByText('다듬어진 본문입니다.')).toBeInTheDocument()
    expect(screen.getByLabelText('본문', { exact: true })).toHaveValue('엉망인 문장') // 아직 적용 전
    await user().click(screen.getByRole('button', { name: '본문에 적용' }))
    expect(screen.getByLabelText('본문', { exact: true })).toHaveValue('다듬어진 본문입니다.')
  })

  it('AI 한도를 넘으면(429) 오류 문구를 보여 준다', async () => {
    loginAs()
    server.use(
      http.post('*/api/ai/chat', () =>
        apiError(429, 'AI_QUOTA_EXCEEDED', '오늘의 AI 사용량 한도를 넘었습니다.'),
      ),
    )
    renderRoute(<PostFormPage />, { path: '/posts/new', route: '/posts/new' })
    await user().type(screen.getByLabelText('본문', { exact: true }), '글')
    await user().click(screen.getByRole('button', { name: 'AI로 다듬기' }))
    expect(await screen.findByText('오늘의 AI 사용량 한도를 넘었습니다.')).toBeInTheDocument()
  })

  it('작성 성공하면 새 글 상세로 이동한다', async () => {
    loginAs()
    server.use(
      http.post('*/api/posts', () =>
        HttpResponse.json({ data: post(99, { title: '새 글' }) }, { status: 201 }),
      ),
    )
    renderRoute(<PostFormPage />, { path: '/posts/new', route: '/posts/new' })
    await user().type(screen.getByLabelText('제목'), '새 글')
    await user().type(screen.getByLabelText('본문'), '본문')
    await user().click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/posts/99'))
  })

  it('수정: 기존 값이 채워지고 작성자가 아니면 상세로 돌려보낸다', async () => {
    loginAs(mina)
    const { unmount } = renderRoute(<PostFormPage />, {
      path: '/posts/:id/edit',
      route: '/posts/1/edit',
    })
    expect(await screen.findByDisplayValue('글 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('글 1의 본문')).toBeInTheDocument()
    unmount()

    loginAs(jun)
    renderRoute(<PostFormPage />, { path: '/posts/:id/edit', route: '/posts/1/edit' })
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/posts/1'))
  })
})

describe('LoginPage', () => {
  const fill = async (email: string, password: string) => {
    if (email) await user().type(screen.getByLabelText('이메일'), email)
    if (password) await user().type(screen.getByLabelText('비밀번호'), password)
    await user().click(screen.getByRole('button', { name: '로그인' }))
  }

  it('빈 값 제출은 검증 오류만 보이고 요청하지 않는다', async () => {
    renderRoute(<LoginPage />, { path: '/login', route: '/login' })
    await fill('', '')
    expect(screen.getByText('이메일을 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 입력하세요.')).toBeInTheDocument()
  })

  it('성공하면 세션이 저장되고(persist), 로그인 전에 가려던 곳(state.from)으로 돌아간다', async () => {
    renderRoute(<LoginPage />, {
      path: '/login',
      route: { pathname: '/login', state: { from: { pathname: '/mypage' } } },
    })
    await fill('mina@example.com', 'password123')
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/mypage'))
    expect(useAuthStore.getState().accessToken).toBe('token-mina')
    expect(JSON.parse(localStorage.getItem('board-auth')!).state.accessToken).toBe('token-mina')
  })

  it('실패하면 어느 쪽이 틀렸는지 알려주지 않는 메시지를 보여 준다', async () => {
    renderRoute(<LoginPage />, { path: '/login', route: '/login' })
    await fill('mina@example.com', 'wrong-password')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '이메일 또는 비밀번호가 올바르지 않습니다.',
    )
    expect(useAuthStore.getState().user).toBeNull()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })
})

describe('SignupPage', () => {
  it('클라이언트 검증 → 중복 이메일(409)은 이메일 칸 오류 → 성공하면 자동 로그인', async () => {
    renderRoute(<SignupPage />, { path: '/signup', route: '/signup' })
    await user().click(screen.getByRole('button', { name: '가입하기' }))
    expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
    expect(screen.getByText('비밀번호는 8자 이상이어야 합니다.')).toBeInTheDocument()

    server.use(
      http.post('*/api/auth/signup', () =>
        apiError(409, 'EMAIL_TAKEN', '이미 사용 중인 이메일입니다.'),
      ),
    )
    await user().type(screen.getByLabelText('이메일'), 'mina@example.com')
    await user().type(screen.getByLabelText('닉네임'), 'mina')
    await user().type(screen.getByLabelText('비밀번호'), 'password123')
    await user().click(screen.getByRole('button', { name: '가입하기' }))
    expect(await screen.findByText('이미 사용 중인 이메일입니다.')).toBeInTheDocument()

    server.use(
      http.post('*/api/auth/signup', () =>
        HttpResponse.json({ data: { user: mina } }, { status: 201 }),
      ),
    )
    await user().click(screen.getByRole('button', { name: '가입하기' }))
    await waitFor(() => expect(useAuthStore.getState().user?.nickname).toBe('mina'))
  })
})

describe('MyPage', () => {
  it('즐겨찾기 글의 제목을 보여 주고, 삭제된 글은 안내하며, 해제할 수 있다', async () => {
    loginAs()
    useFavoritesStore.setState({ favoritePostIds: [1, 999] })
    renderRoute(<MyPage />, { path: '/mypage', route: '/mypage' })
    expect(await screen.findByRole('link', { name: '글 1' })).toBeInTheDocument()
    expect(await screen.findByText(/삭제되었거나 볼 수 없는 글 \(#999\)/)).toBeInTheDocument()
    expect(screen.getByText('즐겨찾기한 게시글 (2개)')).toBeInTheDocument()
    await user().click(screen.getByRole('button', { name: '즐겨찾기 해제 #999' }))
    expect(useFavoritesStore.getState().favoritePostIds).toEqual([1])
  })

  it('즐겨찾기가 없으면 빈 상태', () => {
    loginAs()
    renderRoute(<MyPage />, { path: '/mypage', route: '/mypage' })
    expect(screen.getByText('즐겨찾기한 게시글이 없습니다.')).toBeInTheDocument()
  })
})

describe('App (라우팅 + lazy + Suspense)', () => {
  const renderApp = (route: string) =>
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    )

  it('비로그인으로 /mypage 에 가면 로그인 화면이 나온다', async () => {
    renderApp('/mypage')
    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
  })

  it('없는 경로는 404 화면, 헤더는 유지', async () => {
    renderApp('/no/such/page')
    expect(await screen.findByText(/404/)).toBeInTheDocument()
    expect(within(screen.getByRole('banner')).getByText('미니 게시판')).toBeInTheDocument()
  })

  it('로그인 → 목록 → 상세로 흐른다', async () => {
    loginAs()
    renderApp('/')
    await user().click(await screen.findByText('글 3'))
    expect(await screen.findByRole('heading', { name: '글 3' })).toBeInTheDocument()
  })
})
