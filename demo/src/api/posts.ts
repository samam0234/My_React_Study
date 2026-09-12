import { apiClient } from './client.ts'

// 백엔드(JSONPlaceholder)가 실제로 내려주는 필드 모양을 타입으로 명시
export interface Post {
  id: number
  userId: number
  title: string
  body: string
}

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
