import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, signup } from '@/api/auth'
import { ApiError } from '@/api/errors'
import FormField from '@/components/FormField'
import { signupSchema, validate } from '@/lib/validators'
import type { FieldErrors } from '@/lib/validators'
import { useAuthStore } from '@/store/authStore'

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '', nickname: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()

  const bind = (key: keyof typeof form) => ({
    name: key,
    value: form[key],
    errors: errors[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    const clientErrors = validate(signupSchema, form)
    setErrors(clientErrors)
    setFormError(null)
    if (Object.keys(clientErrors).length) return

    setSubmitting(true)
    try {
      await signup(form)
      setSession(await login(form.email, form.password)) // 가입 직후 바로 로그인
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_TAKEN') {
        setErrors({ email: [err.message] })
      } else if (err instanceof ApiError && err.fields) {
        setErrors(err.fields)
      } else {
        setFormError(err instanceof Error ? err.message : '가입에 실패했습니다.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto grid max-w-sm gap-4" aria-labelledby="signup-title">
      <h2 id="signup-title" className="text-xl font-bold">
        회원가입
      </h2>
      <form onSubmit={handleSubmit} className="grid gap-3" noValidate>
        <FormField id="signup-email" label="이메일" autoComplete="email" {...bind('email')} />
        <FormField
          id="signup-nickname"
          label="닉네임"
          autoComplete="nickname"
          hint="2~20자"
          {...bind('nickname')}
        />
        <FormField
          id="signup-password"
          type="password"
          label="비밀번호"
          autoComplete="new-password"
          hint="8자 이상"
          {...bind('password')}
        />
        {formError && (
          <p role="alert" className="error-text">
            {formError}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? '가입 중...' : '가입하기'}
        </button>
      </form>
      <p className="text-sm">
        이미 계정이 있나요?{' '}
        <Link to="/login" className="underline">
          로그인
        </Link>
      </p>
    </section>
  )
}
