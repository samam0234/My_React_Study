import { create } from 'zustand'

interface FavoritesState {
  favoritePostIds: number[]
  toggle: (postId: number) => void
  isFavorite: (postId: number) => boolean
}

// authStore와 별개의 스토어로 분리 — "로그인 여부"와 "즐겨찾기 목록"은 각각 다른 이유로 바뀌므로
// 스토어를 하나로 몰지 않고 관심사별로 나눈다 (기업형 구조의 store/ 폴더가 커질 때의 기본 원칙).
export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  favoritePostIds: [],
  toggle: (postId) =>
    set((state) => ({
      favoritePostIds: state.favoritePostIds.includes(postId)
        ? state.favoritePostIds.filter((id) => id !== postId)
        : [...state.favoritePostIds, postId],
    })),
  isFavorite: (postId) => get().favoritePostIds.includes(postId),
}))
