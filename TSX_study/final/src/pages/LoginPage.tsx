import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import { ApiError } from '@/api/errors'
import FormField from '@/components/FormField'
import { loginSchema, validate } from '@/lib/validators'
import type { FieldErrors } from '@/lib/validators'
import { useAuthStore } from '@/store/authStore'

interface LocationState {
  from?: { pathname: string; search?: string }
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  const state = useLocation().state as LocationState | null
  const from = state?.from ? `${state.from.pathname}${state.from.search ?? ''}` : '/'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    const clientErrors = validate(loginSchema, form)
    setErrors(clientErrors)
    setFormError(null)
    if (Object.keys(clientErrors).length) return

    setSubmitting(true)
    try {
      const result = await login(form.email.trim(), form.password)
      setSession(result)
      navigate(from, { replace: true }) // 원래 가려던 곳으로
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null
      if (apiError?.fields) setErrors(apiError.fields)
      setFormError(
        apiError?.code === 'INVALID_CREDENTIALS' ||
          apiError?.status === 401 ||
          apiError?.status === 403
          ? '이메일 또는 비밀번호가 올바르지 않습니다.' // 어느 쪽이 틀렸는지는 알려주지 않는다
          : (apiError?.message ?? '로그인에 실패했습니다. 잠시 후 다시 시도하세요.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto grid max-w-sm gap-4" aria-labelledby="login-title">
      <h2 id="login-title" className="text-xl font-bold">
        로그인
      </h2>
      <form onSubmit={handleSubmit} className="grid gap-3" noValidate>
        <FormField
          id="email"
          name="email"
          label="이메일"
          autoComplete="username"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          errors={errors.email}
        />
        <FormField
          id="password"
          name="password"
          type="password"
          label="비밀번호"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          errors={errors.password}
        />
        {formError && (
          <p role="alert" className="error-text">
            {formError}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? '로그인 중...' : '로그인'}
        </button>
      </form>
      <p className="text-sm">
        계정이 없나요?{' '}
        <Link to="/signup" className="underline">
          회원가입
        </Link>
      </p>
    </section>
  )
}
