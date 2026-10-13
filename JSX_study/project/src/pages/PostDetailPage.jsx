import { Link, useParams } from 'react-router-dom'
import { fetchPost } from '../api/posts.js'
import { useFetch } from '../hooks/useFetch.js'

function PostDetailPage() {
  const { id } = useParams()
  const { data: post, loading, error } = useFetch(() => fetchPost(id), [id])

  if (loading) return <p>불러오는 중...</p>
  if (error) return <p className="error-text">게시글을 불러오지 못했습니다: {error.message}</p>
  if (!post) return <p>게시글을 찾을 수 없습니다.</p>

  return (
    <section className="practice">
      <p>
        <Link to="/">목록으로</Link>
      </p>
      <h2>{post.title}</h2>
      <p className="post-body">{post.body}</p>
    </section>
  )
}

export default PostDetailPage
