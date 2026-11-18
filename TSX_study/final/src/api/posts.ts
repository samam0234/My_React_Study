import { z } from 'zod'
import { MetaSchema, PostSchema, PostSummarySchema } from '@/types'
import type { Meta, Post, PostSort, PostSummary } from '@/types'
import { apiClient } from './client'

export interface ListParams {
  page: number
  limit: number
  q?: string
  sort?: PostSort
}

export interface PostInput {
  title: string
  body: string
  tags?: string[]
}

const ListResponse = z.object({ data: z.array(PostSummarySchema), meta: MetaSchema })
const OneResponse = z.object({ data: PostSchema })

// 응답은 zod 로 검증한다: 서버가 약속(공통 API 스펙 v1)과 다른 JSON 을 주면 화면이 아니라 여기서 바로 실패 (study14).
export async function fetchPosts(
  params: ListParams,
): Promise<{ items: PostSummary[]; meta: Meta }> {
  const res = await apiClient.get('/api/posts', {
    params: { page: params.page, limit: params.limit, q: params.q || undefined, sort: params.sort },
  })
  const parsed = ListResponse.parse(res.data)
  return { items: parsed.data, meta: parsed.meta }
}

export async function fetchPost(id: number): Promise<Post> {
  const res = await apiClient.get(`/api/posts/${id}`)
  return OneResponse.parse(res.data).data
}

export async function createPost(input: PostInput): Promise<Post> {
  const res = await apiClient.post('/api/posts', input)
  return OneResponse.parse(res.data).data
}

export async function updatePost(id: number, patch: Partial<PostInput>): Promise<Post> {
  const res = await apiClient.patch(`/api/posts/${id}`, patch)
  return OneResponse.parse(res.data).data
}

export async function deletePost(id: number): Promise<void> {
  await apiClient.delete(`/api/posts/${id}`) // 204, 본문 없음
}
