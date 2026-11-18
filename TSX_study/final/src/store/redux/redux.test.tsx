import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { mina } from '@/test/fixtures'
import authReducer, { logout, setSession } from './authSlice'
import { makeStore, useAppDispatch, useAppSelector } from './store'

describe('Redux Toolkit 로그인 slice (Zustand authStore 와 같은 상태, 비교용)', () => {
  it('리듀서: setSession → 세션 저장, logout → 비움 (순수 함수라 스토어 없이 테스트)', () => {
    const logged = authReducer(undefined, setSession({ user: mina, accessToken: 'tok' }))
    expect(logged).toEqual({ user: mina, accessToken: 'tok' })
    expect(authReducer(logged, logout())).toEqual({ user: null, accessToken: null })
  })

  it('configureStore + useAppSelector/useAppDispatch: 컴포넌트가 dispatch 로 상태를 바꾼다', async () => {
    function Panel() {
      const user = useAppSelector((s) => s.auth.user)
      const dispatch = useAppDispatch()
      return (
        <div>
          <p>{user ? `${user.nickname}님` : '로그아웃 상태'}</p>
          <button onClick={() => dispatch(setSession({ user: mina, accessToken: 't' }))}>
            로그인
          </button>
          <button onClick={() => dispatch(logout())}>로그아웃</button>
        </div>
      )
    }
    const store = makeStore()
    render(
      <Provider store={store}>
        <Panel />
      </Provider>,
    )
    expect(screen.getByText('로그아웃 상태')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: '로그인' }))
    expect(screen.getByText('mina님')).toBeInTheDocument()
    expect(store.getState().auth.accessToken).toBe('t')
    await userEvent.setup().click(screen.getByRole('button', { name: '로그아웃' }))
    expect(screen.getByText('로그아웃 상태')).toBeInTheDocument()
  })
})
