import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LocationProbe } from './LocationProbe'
import { useAuthStore } from '@/store/authStore'
import { mina } from './fixtures'
import type { User } from '@/types'

export function loginAs(user: User = mina, accessToken = `token-${user.nickname}`) {
  useAuthStore.setState({ user, accessToken })
}

/** 테스트마다 새 QueryClient(캐시 격리, 재시도 없음)와 MemoryRouter 로 감싸서 렌더한다. */
export function renderRoute(
  ui: ReactElement,
  {
    path = '/',
    route = '/',
  }: { path?: string; route?: string | { pathname: string; state?: unknown } } = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
            <Route path="*" element={<p>이동함</p>} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  }
}
