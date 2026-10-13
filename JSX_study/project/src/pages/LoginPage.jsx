import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitted, setSubmitted] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const emailValid = form.email.includes('@')
  const passwordValid = form.password.length >= 8
  const isValid = emailValid && passwordValid

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function fillTestAccount() {
    setForm({ email: 'test@example.com', password: 'password123' })
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    if (!isValid) return

    login({ name: form.email.split('@')[0], email: form.email })
    navigate('/', { replace: true })
  }

  return (
    <section className="practice">
      <h2>로그인</h2>
      <p>실제 인증 서버 없이, 이메일 형식과 비밀번호 8자 이상만 확인합니다.</p>
      <button type="button" onClick={fillTestAccount}>
        테스트 계정 채우기
      </button>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            이메일{' '}
            <input type="email" name="email" value={form.email} onChange={handleChange} />
          </label>
          {submitted && !emailValid && <p className="error-text">올바른 이메일 형식이 아닙니다.</p>}
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            비밀번호{' '}
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
          </label>
          {submitted && !passwordValid && (
            <p className="error-text">비밀번호는 8자 이상이어야 합니다.</p>
          )}
        </div>
        <div className="actions" style={{ marginTop: 12 }}>
          <button type="submit">로그인</button>
        </div>
      </form>
    </section>
  )
}

export default LoginPage
