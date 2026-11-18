import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface FavoritesState {
  favoritePostIds: number[]
  toggle: (postId: number) => void
  isFavorite: (postId: number) => boolean
  clear: () => void
}

// authStore 와 별개의 스토어: "로그인 여부"와 "즐겨찾기"는 바뀌는 이유가 다르다 (study8).
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoritePostIds: [],
      toggle: (postId) =>
        set((state) => ({
          favoritePostIds: state.favoritePostIds.includes(postId)
            ? state.favoritePostIds.filter((id) => id !== postId)
            : [...state.favoritePostIds, postId],
        })),
      isFavorite: (postId) => get().favoritePostIds.includes(postId),
      clear: () => set({ favoritePostIds: [] }),
    }),
    {
      name: 'board-favorites',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ favoritePostIds: s.favoritePostIds }),
    },
  ),
)
