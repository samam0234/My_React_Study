import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="grid gap-2">
      <h2 className="text-xl font-bold">페이지를 찾을 수 없습니다 (404)</h2>
      <p>
        <Link to="/" className="underline">
          목록으로 돌아가기
        </Link>
      </p>
    </section>
  )
}
