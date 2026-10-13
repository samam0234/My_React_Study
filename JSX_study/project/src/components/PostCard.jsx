import { Link } from 'react-router-dom'

function PostCard({ post }) {
  return (
    <li>
      <Link className="fruit-card post-card" to={`/posts/${post.id}`}>
        <span className="name">{post.title}</span>
        <span>#{post.id}</span>
      </Link>
    </li>
  )
}

export default PostCard
