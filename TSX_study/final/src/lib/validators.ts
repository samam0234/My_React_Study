import { z } from 'zod'

// 서버(스펙 v1)와 같은 규칙을 클라이언트에서도 검사한다. 검증은 편의일 뿐 — 최종 판단은 서버 (study5).
export const loginSchema = z.object({
  // 로그인은 형식 검사를 서버에 맡긴다 (Spring flavor 는 이메일 대신 username 을 쓴다)
  email: z.string().trim().min(1, '이메일을 입력하세요.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
})

export const signupSchema = z.object({
  email: z.string().regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, '올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
  nickname: z
    .string()
    .trim()
    .min(2, '닉네임은 2~20자로 입력하세요.')
    .max(20, '닉네임은 2~20자로 입력하세요.'),
})

export const postSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력하세요.').max(200, '제목은 200자 이하로 입력하세요.'),
  body: z
    .string()
    .trim()
    .min(1, '본문을 입력하세요.')
    .max(10000, '본문은 10000자 이하로 입력하세요.'),
})

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, '댓글을 입력하세요.')
    .max(1000, '댓글은 1000자 이하로 입력하세요.'),
})

export type FieldErrors = Record<string, string[]>

/** zod 검증 결과 → { 필드: [메시지] }. 오류가 없으면 빈 객체 */
export function validate<T>(schema: z.ZodType<T>, input: unknown): FieldErrors {
  const result = schema.safeParse(input)
  if (result.success) return {}
  const errors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '_')
    ;(errors[key] ??= []).push(issue.message)
  }
  return errors
}
