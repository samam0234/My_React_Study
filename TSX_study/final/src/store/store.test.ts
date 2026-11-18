import { useAuthStore } from './authStore'
import { useFavoritesStore } from './favoritesStore'
import { useToastStore } from './toastStore'
import { mina } from '@/test/fixtures'

describe('authStore (persist)', () => {
  it('setSession 하면 localStorage(board-auth)에 user·accessToken 만 저장된다', () => {
    useAuthStore.getState().setSession({ user: mina, accessToken: 'tok' })
    const saved = JSON.parse(localStorage.getItem('board-auth') ?? '{}')
    expect(saved.state).toEqual({ user: mina, accessToken: 'tok' }) // 함수는 저장되지 않는다
  })

  it('logout 하면 세션이 비워지고 저장값도 비워진다', () => {
    useAuthStore.getState().setSession({ user: mina, accessToken: 'tok' })
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().user).toBeNull()
    expect(JSON.parse(localStorage.getItem('board-auth') ?? '{}').state).toEqual({
      user: null,
      accessToken: null,
    })
  })

  it('저장된 값에서 복원된다 (새로고침 시나리오)', async () => {
    localStorage.setItem(
      'board-auth',
      JSON.stringify({ state: { user: mina, accessToken: 'saved' }, version: 0 }),
    )
    await useAuthStore.persist.rehydrate()
    expect(useAuthStore.getState().accessToken).toBe('saved')
    expect(useAuthStore.getState().user?.nickname).toBe('mina')
  })
})

describe('favoritesStore', () => {
  it('toggle 로 추가/제거하고 isFavorite 로 확인한다', () => {
    const s = useFavoritesStore.getState()
    s.toggle(3)
    s.toggle(7)
    expect(useFavoritesStore.getState().favoritePostIds).toEqual([3, 7])
    expect(useFavoritesStore.getState().isFavorite(3)).toBe(true)
    useFavoritesStore.getState().toggle(3)
    expect(useFavoritesStore.getState().favoritePostIds).toEqual([7])
  })

  it('즐겨찾기도 새로고침 후 복원된다', async () => {
    localStorage.setItem(
      'board-favorites',
      JSON.stringify({ state: { favoritePostIds: [5] }, version: 0 }),
    )
    await useFavoritesStore.persist.rehydrate()
    expect(useFavoritesStore.getState().favoritePostIds).toEqual([5])
  })
})

describe('toastStore', () => {
  it('push / dismiss', () => {
    useToastStore.getState().push('info', '안녕')
    const [t] = useToastStore.getState().toasts
    expect(t?.message).toBe('안녕')
    useToastStore.getState().dismiss(t!.id)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
