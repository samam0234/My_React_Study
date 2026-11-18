import { z } from 'zod'
import { CommentSchema } from '@/types'
import type { Comment } from '@/types'
import { apiClient } from './client'

const ListResponse = z.object({ data: z.array(CommentSchema) })
const OneResponse = z.object({ data: CommentSchema })

export async function fetchComments(postId: number): Promise<Comment[]> {
  const res = await apiClient.get(`/api/posts/${postId}/comments`)
  return ListResponse.parse(res.data).data
}

export async function createComment(postId: number, body: string): Promise<Comment> {
  const res = await apiClient.post(`/api/posts/${postId}/comments`, { body })
  return OneResponse.parse(res.data).data
}

export async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete(`/api/comments/${commentId}`)
}
