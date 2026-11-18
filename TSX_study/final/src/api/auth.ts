import { z } from 'zod'
import { LoginResultSchema, UserSchema } from '@/types'
import type { LoginResult, User } from '@/types'
import { apiClient } from './client'

export interface SignupInput {
  email: string
  password: string
  nickname: string
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await apiClient.post('/api/auth/login', { email, password })
  return z.object({ data: LoginResultSchema }).parse(res.data).data
}

export async function signup(input: SignupInput): Promise<User> {
  const res = await apiClient.post('/api/auth/signup', input)
  return z.object({ data: z.object({ user: UserSchema }) }).parse(res.data).data.user
}

/** 토큰 방식이라 서버에서 지울 세션은 없다. 서버에 알리기만 하고(204) 실패해도 로컬 로그아웃은 진행한다. */
export async function logoutRequest(): Promise<void> {
  await apiClient.post('/api/auth/logout').catch(() => undefined)
}
