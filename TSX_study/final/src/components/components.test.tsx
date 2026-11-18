import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from 'react-error-boundary'
import { MemoryRouter } from 'react-router-dom'
import { renderRoute, loginAs } from '@/test/utils'
import { summary } from '@/test/fixtures'
import { useToastStore } from '@/store/toastStore'
import { UNAUTHORIZED_EVENT } from '@/api/client'
import ErrorFallback from './ErrorFallback'
import FormField from './FormField'
import Pagination from './Pagination'
import PostCard from './PostCard'
import ProtectedRoute from './ProtectedRoute'
import SessionWatcher from './SessionWatcher'
import StateMessage from './StateMessage'
import Toaster from './Toaster'
import AppHeader from './AppHeader'
import ThemeToggle from './ThemeToggle'
import { useThemeStore } from '@/store/themeStore'

describe('Pagination', () => {
  it('첫 페이지에서는 이전, 마지막 페이지에서는 다음이 비활성화된다', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /이전/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /다음/ })).toBeEnabled()
    rerender(<Pagination page={3} totalPages={3} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /다음/ })).toBeDisabled()
  })

  it('클릭하면 이동할 페이지 번호로 onChange', async () => {
    const onChange = vi.fn()
    render(<Pagination page={2} totalPages={3} onChange={onChange} />)
    await userEvent.setup().click(screen.getByRole('button', { name: /다음/ }))
    expect(onChange).toHaveBeenCalledWith(3)
  })
})

describe('PostCard', () => {
  it('별 버튼은 콜백만 호출하고 상세로 이동하지 않는다', async () => {
    const onToggle = vi.fn()
    renderRoute(<PostCard post={summary(4)} isFavorite={false} onToggleFavorite={onToggle} />)
    await userEvent.setup().click(screen.getByRole('button', { name: '즐겨찾기' }))
    expect(onToggle).toHaveBeenCalledWith(4)
    expect(screen.getByTestId('location')).toHaveTextContent('/') // 이동 안 함
  })

  it('카드를 누르면 /posts/:id 로 이동, 즐겨찾기 상태는 aria-pressed 로 노출', async () => {
    renderRoute(<PostCard post={summary(4)} isFavorite onToggleFavorite={() => {}} />)
    expect(screen.getByRole('button', { name: '즐겨찾기 해제' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.setup().click(screen.getByText('글 4'))
    expect(screen.getByTestId('location')).toHaveTextContent('/posts/4')
  })
})

describe('ProtectedRoute', () => {
  const setup = () =>
    renderRoute(
      <ProtectedRoute>
        <p>비밀 화면</p>
      </ProtectedRoute>,
      { path: '/secret', route: '/secret' },
    )

  it('비로그인이면 /login 으로 보낸다', () => {
    setup()
    expect(screen.queryByText('비밀 화면')).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('로그인했으면 자식을 보여 준다', () => {
    loginAs()
    setup()
    expect(screen.getByText('비밀 화면')).toBeInTheDocument()
  })
})

describe('AppHeader', () => {
  it('비로그인: 로그인/회원가입 링크, 로그인: 닉네임·글쓰기·로그아웃', async () => {
    const { unmount } = render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '글쓰기' })).not.toBeInTheDocument()
    unmount()

    loginAs()
    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>,
    )
    expect(screen.getByText(/mina님/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '글쓰기' })).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: '로그아웃' }))
    expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument() // 즉시 반영
  })
})

describe('ErrorBoundary + ErrorFallback', () => {
  it('렌더 오류가 나도 앱 전체가 아니라 해당 영역만 오류 화면으로 바뀌고, 다시 시도할 수 있다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    let shouldThrow = true
    function Flaky() {
      if (shouldThrow) throw new Error('렌더 중 오류')
      return <p>복구됨</p>
    }
    render(
      <>
        <p>헤더는 살아 있다</p>
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => (shouldThrow = false)}>
          <Flaky />
        </ErrorBoundary>
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('문제가 발생했습니다')
    expect(screen.getByText('헤더는 살아 있다')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByText('복구됨')).toBeInTheDocument()
  })
})

describe('FormField / StateMessage / Toaster', () => {
  it('FormField: label 연결, 오류는 aria-invalid·aria-describedby 로 전달', () => {
    render(<FormField id="x" label="이름" errors={['필수입니다.']} />)
    const input = screen.getByLabelText('이름')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('필수입니다.')
  })

  it('StateMessage: 오류는 role=alert, 나머지는 status', () => {
    render(
      <>
        <StateMessage kind="error">실패</StateMessage>
        <StateMessage kind="loading">로딩</StateMessage>
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('실패')
    expect(screen.getByRole('status')).toHaveTextContent('로딩')
  })

  it('Toaster: 스토어에 쌓인 알림을 보여 주고 닫을 수 있다', async () => {
    render(<Toaster />)
    useToastStore.getState().push('error', '권한이 없습니다')
    expect(await screen.findByText('권한이 없습니다')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: '알림 닫기' }))
    expect(screen.queryByText('권한이 없습니다')).not.toBeInTheDocument()
  })
})

describe('SessionWatcher', () => {
  it('401 이벤트를 받으면 알림을 띄우고 /login 으로 보낸다', async () => {
    renderRoute(<SessionWatcher />, { path: '/mypage', route: '/mypage' })
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
    expect(await screen.findByText('이동함')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
    expect(useToastStore.getState().toasts[0]?.message).toMatch(/만료/)
  })
})

describe('ThemeToggle (다크 모드 토글)', () => {
  it('누를 때마다 시스템 → 라이트 → 다크 → 시스템으로 돌고, <html> 의 dark 클래스와 persist 에 반영된다', async () => {
    render(<ThemeToggle />)
    const html = document.documentElement
    const btn = () => screen.getByRole('button', { name: /테마 전환/ })
    expect(btn()).toHaveAccessibleName('테마 전환 (현재: 시스템)')
    expect(html).not.toHaveClass('dark') // 시스템 + OS 라이트(jsdom 기본)

    await userEvent.setup().click(btn())
    expect(useThemeStore.getState().theme).toBe('light')
    expect(html).not.toHaveClass('dark')

    await userEvent.setup().click(btn())
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(html).toHaveClass('dark')
    expect(JSON.parse(localStorage.getItem('board-theme')!).state.theme).toBe('dark') // 새로고침해도 유지

    await userEvent.setup().click(btn())
    expect(useThemeStore.getState().theme).toBe('system')
    expect(html).not.toHaveClass('dark')
  })
})
