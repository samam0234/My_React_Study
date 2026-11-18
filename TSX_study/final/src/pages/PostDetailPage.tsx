import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import FormField from '@/components/FormField'
import StateMessage from '@/components/StateMessage'
import SummaryPanel from '@/components/SummaryPanel'
import { canDelete, canEdit } from '@/lib/permissions'
import { commentSchema, validate } from '@/lib/validators'
import type { FieldErrors } from '@/lib/validators'
import {
  useAddComment,
  useComments,
  useDeletePost,
  usePost,
  useRemoveComment,
} from '@/queries/posts'
import { ApiError } from '@/api/errors'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useToastStore } from '@/store/toastStore'

export default function PostDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = Number(idParam)
  const navigate = useNavigate()

  const user = useAuthStore((s) => s.user)
  const favoritePostIds = useFavoritesStore((s) => s.favoritePostIds)
  const toggleFavorite = useFavoritesStore((s) => s.toggle)

  const { data: post, isPending, isError, error, refetch } = usePost(id)
  const comments = useComments(id)
  const deletePost = useDeletePost()
  const addComment = useAddComment(id)
  const removeComment = useRemoveComment()

  const [confirming, setConfirming] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentErrors, setCommentErrors] = useState<FieldErrors>({})

  if (isPending) return <StateMessage kind="loading">불러오는 중...</StateMessage>
  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <StateMessage
        kind="error"
        action={
          notFound ? (
            <Link to="/" className="btn">
              목록으로
            </Link>
          ) : (
            <button className="btn" onClick={() => refetch()}>
              다시 시도
            </button>
          )
        }
      >
        {notFound ? '게시글을 찾을 수 없습니다.' : `게시글을 불러오지 못했습니다: ${error.message}`}
      </StateMessage>
    )
  }

  const isFavorite = favoritePostIds.includes(post.id)
  const mayEdit = canEdit(user, post.author)
  const mayDelete = canDelete(user, post.author) // 작성자 또는 관리자

  function handleFavorite() {
    if (!user) {
      useToastStore.getState().push('info', '즐겨찾기는 로그인 후 이용할 수 있습니다.')
      return
    }
    toggleFavorite(post!.id)
  }

  async function handleDelete() {
    try {
      await deletePost.mutateAsync(post!.id)
    } catch {
      return // 오류는 deletePost.error 로 화면에 표시한다 (처리하지 않으면 unhandled rejection)
    }
    useToastStore.getState().push('info', '글을 삭제했습니다.')
    navigate('/', { replace: true })
  }

  async function handleComment(e: FormEvent) {
    e.preventDefault()
    const errors = validate(commentSchema, { body: commentText })
    setCommentErrors(errors)
    if (Object.keys(errors).length) return
    try {
      await addComment.mutateAsync(commentText.trim())
      setCommentText('')
    } catch (err) {
      if (err instanceof ApiError && err.fields) setCommentErrors(err.fields)
    }
  }

  return (
    <article className="grid gap-4">
      <header className="grid gap-1">
        <h2 className="text-2xl font-bold">{post.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {post.author.nickname} · {new Date(post.createdAt).toLocaleString('ko-KR')}
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn" aria-pressed={isFavorite} onClick={handleFavorite}>
            {isFavorite ? '★ 즐겨찾기 취소' : '☆ 즐겨찾기'}
          </button>
          {mayEdit && (
            <Link to={`/posts/${post.id}/edit`} className="btn">
              수정
            </Link>
          )}
          {mayDelete &&
            (confirming ? (
              <>
                <button
                  className="btn btn-danger"
                  disabled={deletePost.isPending}
                  onClick={handleDelete}
                >
                  삭제 확인
                </button>
                <button className="btn" onClick={() => setConfirming(false)}>
                  취소
                </button>
              </>
            ) : (
              <button className="btn" onClick={() => setConfirming(true)}>
                삭제
              </button>
            ))}
        </div>
        {deletePost.isError && <p className="error-text">삭제 실패: {deletePost.error.message}</p>}
      </header>

      {/* 본문은 텍스트로만 출력한다 — React 가 자동 이스케이프 (XSS 방어, study16) */}
      <p className="whitespace-pre-wrap">{post.body}</p>

      {post.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label="태그">
          {post.tags.map((t) => (
            <li key={t} className="rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">
              #{t}
            </li>
          ))}
        </ul>
      )}

      <SummaryPanel post={post} />

      <section aria-labelledby="comments-title" className="grid gap-3">
        <h3 id="comments-title" className="text-lg font-semibold">
          댓글 {comments.data?.length ?? post.commentCount}개
        </h3>
        {comments.isPending ? (
          <StateMessage kind="loading">댓글을 불러오는 중...</StateMessage>
        ) : comments.isError ? (
          <StateMessage kind="error">댓글을 불러오지 못했습니다.</StateMessage>
        ) : comments.data.length === 0 ? (
          <StateMessage kind="empty">아직 댓글이 없습니다.</StateMessage>
        ) : (
          <ul className="grid gap-2">
            {comments.data.map((c) => (
              <li key={c.id} className="card flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{c.author.nickname}</p>
                  <p className="whitespace-pre-wrap">{c.body}</p>
                </div>
                {canDelete(user, c.author) && (
                  <button
                    className="btn"
                    aria-label={`${c.author.nickname}의 댓글 삭제`}
                    disabled={removeComment.isPending}
                    onClick={() => removeComment.mutate(c.id)}
                  >
                    삭제
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {user ? (
          <form onSubmit={handleComment} className="grid gap-2" noValidate>
            <FormField
              id="comment"
              as="textarea"
              label="댓글 쓰기"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              errors={commentErrors.body}
            />
            <div>
              <button className="btn btn-primary" type="submit" disabled={addComment.isPending}>
                {addComment.isPending ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-500">
            댓글은{' '}
            <Link
              to="/login"
              state={{ from: { pathname: `/posts/${post.id}` } }}
              className="underline"
            >
              로그인
            </Link>{' '}
            후 쓸 수 있습니다.
          </p>
        )}
      </section>

      <div>
        <button className="btn" onClick={() => navigate(-1)}>
          ← 뒤로가기
        </button>
      </div>
    </article>
  )
}
