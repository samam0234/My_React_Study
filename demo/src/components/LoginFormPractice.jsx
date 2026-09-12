import { useState } from 'react'

function validate({ email, password }) {
  const errors = {}
  if (!email.includes('@')) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }
  if (password.length < 8) {
    errors.password = '비밀번호는 8자 이상이어야 합니다.'
  }
  return errors
}

// study4-2: Controlled Component 실습. input의 value와 상태를 직접 연결하고,
// 클라이언트 사이드 검증(제출 시 + 필드를 벗어났을 때)을 적용.
function LoginFormPractice() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loggedInEmail, setLoggedInEmail] = useState(null)

  const errors = validate(form)
  const isValid = Object.keys(errors).length === 0

  function handleChange(event) {
    const { name, value } = event.target
    // 객체 상태도 스프레드로 새 객체를 만들어 업데이트 (study2에서 배운 불변성 패턴)
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleBlur(event) {
    const { name } = event.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  function handleSubmit(event) {
    event.preventDefault() // 브라우저 기본 폼 제출(새로고침) 막기
    setSubmitted(true)
    if (!isValid) return

    setLoggedInEmail(form.email)
    setForm({ email: '', password: '' })
    setTouched({})
    setSubmitted(false)
  }

  function shouldShowError(field) {
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
