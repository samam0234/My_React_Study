import type { Comment, Post, PostSummary, User } from '@/types'

export const mina: User = { id: 1, email: 'mina@example.com', nickname: 'mina', role: 'user' }
export const jun: User = { id: 2, email: 'jun@example.com', nickname: 'jun', role: 'user' }
export const admin: User = { id: 3, email: 'admin@example.com', nickname: 'admin', role: 'admin' }

export function summary(id: number, over: Partial<PostSummary> = {}): PostSummary {
  return {
    id,
    title: `글 ${id}`,
    author: { id: mina.id, nickname: mina.nickname },
    commentCount: 0,
    createdAt: '2026-11-01T09:00:00Z',
    ...over,
  }
}

export function post(id: number, over: Partial<Post> = {}): Post {
  return {
    ...summary(id),
    body: `글 ${id}의 본문`,
    tags: [],
    updatedAt: '2026-11-01T09:00:00Z',
    ...over,
  }
}

export function comment(id: number, postId: number, over: Partial<Comment> = {}): Comment {
  return {
    id,
    postId,
    body: `댓글 ${id}`,
    author: { id: jun.id, nickname: jun.nickname },
    createdAt: '2026-11-01T10:00:00Z',
    ...over,
  }
}

export const ALL = Array.from({ length: 25 }, (_, i) => summary(i + 1))
