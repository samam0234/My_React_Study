import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createComment, deleteComment, fetchComments } from '@/api/comments'
import { createPost, deletePost, fetchPost, fetchPosts, updatePost } from '@/api/posts'
import type { ListParams, PostInput } from '@/api/posts'

// 쿼리 키 설계 (study11): 목록은 ['posts','list',필터], 단건은 ['posts','detail',id], 댓글은 ['posts','comments',id].
// 모두 'posts'로 시작하므로 invalidateQueries({ queryKey: ['posts'] }) 한 번으로 관련 캐시를 전부 무효화할 수 있다.
export const postKeys = {
  all: ['posts'] as const,
  list: (p: ListParams) => ['posts', 'list', p] as const,
  detail: (id: number) => ['posts', 'detail', id] as const,
  comments: (id: number) => ['posts', 'comments', id] as const,
}

export function usePosts(params: ListParams) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => fetchPosts(params),
    placeholderData: keepPreviousData, // 페이지 이동 중 이전 목록 유지
  })
}

export function usePost(id: number) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => fetchPost(id),
    enabled: Number.isFinite(id),
    retry: (count, err) =>
      !(err instanceof Error && 'status' in err && err.status === 404) && count < 1,
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PostInput) => createPost(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.all }),
  })
}

export function useUpdatePost(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<PostInput>) => updatePost(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.all }),
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.all }),
  })
}

export function useComments(postId: number) {
  return useQuery({
    queryKey: postKeys.comments(postId),
    queryFn: () => fetchComments(postId),
    enabled: Number.isFinite(postId),
  })
}

export function useAddComment(postId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => createComment(postId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.all }), // 목록의 commentCount 도 바뀐다
  })
}

export function useRemoveComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.all }),
  })
}
