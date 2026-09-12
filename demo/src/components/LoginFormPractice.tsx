import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react'

interface LoginForm {
  email: string
  password: string
}

type FormErrors = Partial<Record<keyof LoginForm, string>>

function validate({ email, password }: LoginForm): FormErrors {
  const errors: FormErrors = {}
  if (!email.includes('@')) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }
  if (password.length < 8) {
    errors.password = '비밀번호는 8자 이상이어야 합니다.'
  }
  return errors
}

function LoginFormPractice() {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [touched, setTouched] = useState<Partial<Record<keyof LoginForm, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null)

  const errors = validate(form)
  const isValid = Object.keys(errors).length === 0

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const { name } = event.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (!isValid) return

    setLoggedInEmail(form.email)
    setForm({ email: '', password: '' })
    setTouched({})
    setSubmitted(false)
  }

  function shouldShowError(field: keyof LoginForm) {
    return (touched[field] || submitted) && errors[field]
  }

  if (loggedInEmail) {
    return (
      <section className="practice">
        <h2>실습4-2: 로그인 폼 (Controlled Component)</h2>
        <p>✅ {loggedInEmail} 님, 로그인되었습니다.</p>
        <button onClick={() => setLoggedInEmail(null)}>로그아웃</button>
      </section>
    )
  }

  return (
    <section className="practice">
      <h2>실습4-2: 로그인 폼 (Controlled Component)</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            이메일{' '}
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </label>
          {shouldShowError('email') && (
            <p className="error-text">{errors.email}</p>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            비밀번호{' '}
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </label>
          {shouldShowError('password') && (
            <p className="error-text">{errors.password}</p>
          )}
        </div>
        <div className="actions" style={{ marginTop: 12 }}>
          <button type="submit">로그인</button>
        </div>
      </form>
    </section>
  )
}

export default LoginFormPractice
