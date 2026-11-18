import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { fetchPost } from '@/api/posts'
import StateMessage from '@/components/StateMessage'
import { postKeys } from '@/queries/posts'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'

// ProtectedRoute 안쪽 화면. 즐겨찾기 글의 제목을 id 별 쿼리로 가져온다 (midpoint 의 "게시글 #N" 한계 해결).
export default function MyPage() {
  const user = useAuthStore((s) => s.user)
  const ids = useFavoritesStore((s) => s.favoritePostIds)
  const toggle = useFavoritesStore((s) => s.toggle)

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: postKeys.detail(id),
      queryFn: () => fetchPost(id),
      retry: false,
    })),
  })

  if (!user) return null // 타입상 User | null — ProtectedRoute 가 막지만 TS 가 강제하는 방어 코드

  return (
    <section className="grid gap-4" aria-labelledby="mypage-title">
      <h2 id="mypage-title" className="text-xl font-bold">
        마이페이지
      </h2>
      <p>
        {user.nickname}님, 환영합니다. ({user.email})
      </p>

      <h3 className="text-lg font-semibold">즐겨찾기한 게시글 ({ids.length}개)</h3>
      {ids.length === 0 ? (
        <StateMessage kind="empty">즐겨찾기한 게시글이 없습니다.</StateMessage>
      ) : (
        <ul className="grid gap-2">
          {ids.map((id, i) => {
            const r = results[i]
            return (
              <li key={id} className="card flex items-center justify-between gap-2">
                {r?.isPending ? (
                  <span>불러오는 중...</span>
                ) : r?.data ? (
                  <Link to={`/posts/${id}`} className="underline">
                    {r.data.title}
                  </Link>
                ) : (
                  <span className="text-slate-500">삭제되었거나 볼 수 없는 글 (#{id})</span>
                )}
                <button
                  className="btn"
                  aria-label={`즐겨찾기 해제 #${id}`}
                  onClick={() => toggle(id)}
                >
                  해제
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
