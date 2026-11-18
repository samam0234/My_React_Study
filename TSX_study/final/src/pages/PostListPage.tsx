import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import Pagination from '@/components/Pagination'
import PostCard from '@/components/PostCard'
import StateMessage from '@/components/StateMessage'
import { useDebounce } from '@/hooks/useDebounce'
import { usePosts } from '@/queries/posts'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useToastStore } from '@/store/toastStore'
import { useCallback } from 'react'

const LIMIT = 10

// 검색어·페이지는 URL 이 원본이다(새로고침·공유·뒤로가기에 안전). 데이터는 TanStack Query 가 캐시한다.
export default function PostListPage() {
  const [sp, setSp] = useSearchParams()
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const q = sp.get('q') ?? ''

  const [input, setInput] = useState(q)
  const debounced = useDebounce(input, 300)
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  // 디바운스된 검색어가 바뀌면 URL 을 갱신하고 1페이지로
  useEffect(() => {
    setSp(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (debounced === (prev.get('q') ?? '')) return prev
        if (debounced) next.set('q', debounced)
        else next.delete('q')
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }, [debounced, setSp])

  const user = useAuthStore((s) => s.user)
  const favoritePostIds = useFavoritesStore((s) => s.favoritePostIds)
  const toggleFavorite = useFavoritesStore((s) => s.toggle)

  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = usePosts(
    q ? { page, limit: LIMIT, q } : { page, limit: LIMIT },
  )

  // 참조를 고정해 memo(PostCard)가 실제로 건너뛸 수 있게 한다 (study12)
  const handleToggle = useCallback(
    (postId: number) => {
      if (!useAuthStore.getState().user) {
        useToastStore.getState().push('info', '즐겨찾기는 로그인 후 이용할 수 있습니다.')
        return
      }
      toggleFavorite(postId)
    },
    [toggleFavorite],
  )

  function goTo(nextPage: number) {
    setSp((prev) => {
      const next = new URLSearchParams(prev)
      if (nextPage <= 1) next.delete('page')
      else next.set('page', String(nextPage))
      return next
    })
  }

  return (
    <section className="grid gap-4" aria-labelledby="list-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="list-title" className="text-xl font-bold">
          게시글
        </h2>
        {user && (
          <Link to="/posts/new" className="btn btn-primary">
            글쓰기
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="search">
          제목·본문 검색
        </label>
        <input
          id="search"
          type="search"
          className="input w-full sm:max-w-xs"
          placeholder="제목·본문 검색"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="button"
          className={clsx('btn', onlyFavorites && 'btn-primary')}
          aria-pressed={onlyFavorites}
          onClick={() => setOnlyFavorites((v) => !v)}
        >
          {onlyFavorites ? '전체 보기' : '즐겨찾기만 보기'}
        </button>
      </div>

      {isPending ? (
        <StateMessage kind="loading">불러오는 중...</StateMessage>
      ) : isError ? (
        <StateMessage
          kind="error"
          action={
            <button className="btn" onClick={() => refetch()}>
              다시 시도
            </button>
          }
        >
          게시글을 불러오지 못했습니다: {error.message}
        </StateMessage>
      ) : (
        <ListBody
          items={data.items}
          onlyFavorites={onlyFavorites}
          favorites={favoritePostIds}
          onToggle={handleToggle}
          dimmed={isPlaceholderData}
        />
      )}

      {data && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onChange={goTo}
          disabled={isFetching}
        />
      )}
    </section>
  )
}

function ListBody({
  items,
  onlyFavorites,
  favorites,
  onToggle,
  dimmed,
}: {
  items: import('@/types').PostSummary[]
  onlyFavorites: boolean
  favorites: number[]
  onToggle: (id: number) => void
  dimmed: boolean
}) {
  const visible = onlyFavorites ? items.filter((p) => favorites.includes(p.id)) : items
  if (items.length === 0) return <StateMessage kind="empty">게시글이 없습니다.</StateMessage>
  if (visible.length === 0) {
    return <StateMessage kind="empty">이 페이지에 즐겨찾기한 글이 없습니다.</StateMessage>
  }
  return (
    <ul className={clsx('grid gap-2 md:grid-cols-2', dimmed && 'opacity-60')}>
      {visible.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isFavorite={favorites.includes(post.id)}
          onToggleFavorite={onToggle}
        />
      ))}
    </ul>
  )
}
