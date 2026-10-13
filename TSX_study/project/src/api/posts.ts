import { apiClient } from './client.ts'
import type { Comment, Post } from '../types.ts'

interface FetchPostsParams {
  page: number
  limit: number
}

export async function fetchPosts({ page, limit }: FetchPostsParams): Promise<Post[]> {
  const res = await apiClient.get<Post[]>('/posts', {
    params: { _page: page, _limit: limit },
  })
  return res.data
}

export async function fetchPostDetail(id: string): Promise<{ post: Post; comments: Comment[] }> {
  // study7에서 배운 Promise.all: 게시글 본문과 댓글을 동시에 요청해서 기다리는 시간을 줄임
  const [postRes, commentsRes] = await Promise.all([
    apiClient.get<Post>(`/posts/${id}`),
    apiClient.get<Comment[]>(`/posts/${id}/comments`),
  ])
  return { post: postRes.data, comments: commentsRes.data }
}
