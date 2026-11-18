import { z } from 'zod'

// 타입은 스키마에서 만든다 (study14): 런타임 검증과 정적 타입을 한 곳에서 관리.
export const AuthorSchema = z.object({ id: z.number(), nickname: z.string() })

export const PostSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  author: AuthorSchema,
  commentCount: z.number(),
  createdAt: z.string(),
})

export const PostSchema = PostSummarySchema.extend({
  body: z.string(),
  tags: z.array(z.string()),
  updatedAt: z.string(),
})

export const CommentSchema = z.object({
  id: z.number(),
  postId: z.number(),
  body: z.string(),
  author: AuthorSchema,
  createdAt: z.string(),
})

export const MetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  q: z.string().optional(),
})

export const UserSchema = z.object({
  id: z.number(),
  email: z.string(),
  nickname: z.string(),
  role: z.enum(['user', 'admin']),
})

export const LoginResultSchema = z.object({ user: UserSchema, accessToken: z.string() })

export type Author = z.infer<typeof AuthorSchema>
export type PostSummary = z.infer<typeof PostSummarySchema>
export type Post = z.infer<typeof PostSchema>
export type Comment = z.infer<typeof CommentSchema>
export type Meta = z.infer<typeof MetaSchema>
export type User = z.infer<typeof UserSchema>
export type LoginResult = z.infer<typeof LoginResultSchema>

export type PostSort = 'createdAt' | '-createdAt' | '-commentCount'
