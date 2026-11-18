import { memo } from 'react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { PostSummary } from '@/types'

interface Props {
  post: PostSummary
  isFavorite: boolean
  onToggleFavorite: (postId: number) => void
}

// study12: 부모(목록)가 검색어 입력 등으로 리렌더돼도 props 가 같으면 건너뛰도록 memo.
// 카드 전체는 상세로 가는 Link 이고, 별 버튼만 이동 없이 즐겨찾기를 토글한다 (study3).
function PostCard({ post, isFavorite, onToggleFavorite }: Props) {
  function handleFavoriteClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault() // Link 의 페이지 이동 취소
    event.stopPropagation()
    onToggleFavorite(post.id)
  }

  return (
    <li>
      <Link
        to={`/posts/${post.id}`}
        className="card flex items-center justify-between gap-3 hover:shadow-md"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{post.title}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {post.author.nickname} · 댓글 {post.commentCount}
          </span>
        </span>
        <button
          type="button"
          className={clsx('btn shrink-0', isFavorite && 'btn-primary')}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
          onClick={handleFavoriteClick}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </Link>
    </li>
  )
}

export default memo(PostCard)
