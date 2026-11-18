import { Link, NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { logoutRequest } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import ThemeToggle from './ThemeToggle'

const navClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'rounded-lg px-3 py-1.5 text-sm hover:bg-slate-200 dark:hover:bg-slate-700',
    isActive && 'font-semibold underline',
  )

// 로그인 상태를 구독하는 전역 헤더. 같은 authStore 를 보므로 로그인/로그아웃이 즉시 반영된다 (study8).
export default function AppHeader() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
        <Link to="/" className="text-lg font-bold">
          미니 게시판
        </Link>
        <nav aria-label="주 메뉴" className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={navClass}>
            목록
          </NavLink>
          {user && (
            <>
              <NavLink to="/posts/new" className={navClass}>
                글쓰기
              </NavLink>
              <NavLink to="/mypage" className={navClass}>
                마이페이지
              </NavLink>
            </>
          )}
          {user ? (
            <>
              <span className="px-2 text-sm text-slate-600 dark:text-slate-300">
                👤 {user.nickname}님
              </span>
              <button
                className="btn"
                onClick={() => {
                  void logoutRequest() // 서버에 알림(204). 토큰 방식이라 서버에 지울 세션은 없다
                  logout()
                  navigate('/')
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>
                로그인
              </NavLink>
              <NavLink to="/signup" className={navClass}>
                회원가입
              </NavLink>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
