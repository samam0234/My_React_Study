import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Post } from '../types.ts'

interface PostCardProps {
  post: Post
  isFavorite: boolean
  onToggleFavorite: (postId: number) => void
}

// study4에서 배운 콜백 props + event.stopPropagation() 패턴을 라우팅(study5/6)과 결합.
// 카드 전체는 상세 페이지로 이동하는 Link이고, 즐겨찾기 버튼만 페이지 이동 없이 동작한다.
function PostCard({ post, isFavorite, onToggleFavorite }: PostCardProps) {
  function handleFavoriteClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault() // Link의 페이지 이동을 막음
    event.stopPropagation()
    onToggleFavorite(post.id)
  }

  return (
    <Link to={`/posts/${post.id}`} className="fruit-card post-card">
      <span className="name">{post.title}</span>
      <button className={isFavorite ? 'active' : ''} onClick={handleFavoriteClick}>
        {isFavorite ? '★' : '☆'}
      </button>
    </Link>
  )
}

export default PostCard
