# study5 — 폼·입력·검증

> 🎯 **목표**: Controlled Component로 사용자 입력을 상태와 연결하고, 유효성 검사·오류 표시·제출 처리까지 구현한다.

- 이전: [study4.md](./study4.md) — 라우팅·요청 처리
- 다음: [study6.md](./study6.md) — DB·API 연동
- 실습 코드: [`LoginFormPractice.jsx`](./JSX_study/demo/src/components/LoginFormPractice.jsx), [`LoginPage.tsx`](./TSX_study/project/src/pages/LoginPage.tsx)

---

## 📖 이론

### 5.1 Controlled Component

`<input>`의 값을 **React 상태가 소유**합니다.

```jsx
<input value={form.email} onChange={handleChange} name="email" />
```

- 화면에 보이는 값 = `form.email` (항상 상태와 일치)
- 입력할 때마다 `onChange` → 상태 갱신 → 리렌더링
- 반대인 Uncontrolled(`ref`로 필요할 때만 읽기)는 단순한 폼·파일 입력에서 씁니다.

### 5.2 입력 하나당 상태 하나? → 객체 + `name`

```jsx
const [form, setForm] = useState({ email: '', password: '' })
function handleChange(e) {
  const { name, value } = e.target
  setForm((prev) => ({ ...prev, [name]: value }))   // 계산된 속성명
}
```

### 5.3 검증 시점과 오류 표시

| 시점 | 설명 |
|---|---|
| 제출 시 | 가장 기본. 전체 검사 |
| 필드 이탈(blur) 후 | 입력 중에 빨간 글씨가 뜨지 않게 "건드린 필드"만 표시 |
| 입력 중 | 비밀번호 강도 등 즉시 피드백이 도움이 되는 경우 |

핵심 원칙: **오류는 상태가 아니라 `form`에서 계산한 파생 값**으로 둡니다. 따로 `errors` state를 동기화하면 어긋나기 쉽습니다.

### 5.4 두 종류의 오류

| 종류 | 누가 판단 | 예 |
|---|---|---|
| 클라이언트 검증 | 프론트 | 이메일에 `@` 없음, 비밀번호 8자 미만 |
| 서버 검증 | 백엔드 | 이미 가입된 이메일(409), 입력값 오류(400) → 응답을 화면에 표시 |

**클라이언트 검증은 편의일 뿐, 보안 장치가 아닙니다.** 서버도 반드시 검증합니다.

---

## 🛠️ 실기

### 1. 검증 함수 + 상태 — [`LoginFormPractice.jsx`](./JSX_study/demo/src/components/LoginFormPractice.jsx)

```jsx
function validate({ email, password }) {
  const errors = {}
  if (!email.includes('@')) errors.email = '올바른 이메일 형식이 아닙니다.'
  if (password.length < 8) errors.password = '비밀번호는 8자 이상이어야 합니다.'
  return errors
}

const [form, setForm] = useState({ email: '', password: '' })
const [touched, setTouched] = useState({})
const [submitted, setSubmitted] = useState(false)

const errors = validate(form)
const isValid = Object.keys(errors).length === 0
```

| 줄(원본) | 설명 |
|---|---|
| 3~12 | 검증은 **컴포넌트 밖의 순수 함수**. 입력 객체 → 오류 객체. 테스트하기 쉬움 (study9) |
| 17~20 | 상태는 3가지: 입력값, **건드린 필드**, 제출 시도 여부 |
| 22~23 | `errors`는 state가 아니라 **렌더링마다 계산**. `isValid`도 파생 값 |

### 2. 핸들러

```jsx
function handleBlur(event) {
  const { name } = event.target
  setTouched((prev) => ({ ...prev, [name]: true }))
}

function handleSubmit(event) {
  event.preventDefault()          // 브라우저 기본 제출(새로고침) 막기
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
```

| 줄(원본) | 설명 |
|---|---|
| 31~34 | `onBlur`에서 해당 필드를 touched로 표시 |
| 37 | `preventDefault`가 없으면 폼 제출로 **페이지가 새로고침**되어 상태가 사라짐 |
| 38~39 | 제출을 시도했다면 모든 오류를 보여주고, 유효하지 않으면 중단 |
| 41~44 | 성공 후 상태 초기화 |
| 47~49 | "건드렸거나 제출을 시도했을 때만" 오류 표시 — 첫 화면부터 빨간 글씨가 뜨지 않게 |

### 3. 오류 표시 JSX

```jsx
<input type="email" name="email" value={form.email}
       onChange={handleChange} onBlur={handleBlur} />
{shouldShowError('email') && <p className="error-text">{errors.email}</p>}
```

`cond && <p>`는 `cond`가 문자열(오류 메시지)이거나 `undefined`일 때 안전합니다. (숫자 0이 올 수 있는 곳에서는 study1의 함정 주의)

### 4. TSX 버전과 비교 — [`LoginPage.tsx`](./TSX_study/project/src/pages/LoginPage.tsx)

```tsx
const emailValid = form.email.includes('@')
const passwordValid = form.password.length >= 8
const isValid = emailValid && passwordValid

function handleChange(event: ChangeEvent<HTMLInputElement>) { ... }
function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  setSubmitted(true)
  if (!isValid) return
  login({ name: form.email.split('@')[0], email: form.email })
  navigate(from, { replace: true })
}
```

- 이벤트 타입(`ChangeEvent<HTMLInputElement>`, `FormEvent<HTMLFormElement>`)을 지정해 `event.target.name` 같은 접근이 타입 안전해집니다.
- 이 프로젝트의 검증은 "이메일에 `@` 포함 + 비밀번호 8자 이상"이 전부입니다. **서버 검증 응답을 표시하는 부분은 아직 없습니다** (study7에서 연결).

### 5. 서버 오류를 폼에 표시하기 (직접 확장할 것 — 설명용 코드)

노션의 공통 API 스펙 v1은 검증 실패를 `400 VALIDATION_ERROR` + `error.fields`로 돌려줍니다.

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "입력값을 확인하세요.",
             "fields": { "email": ["이미 사용 중인 이메일입니다."] } } }
```

```jsx
const [serverErrors, setServerErrors] = useState({})

async function handleSubmit(e) {
  e.preventDefault()
  setSubmitted(true)
  if (!isValid) return
  try {
    await signup(form)                       // study6/7에서 만드는 API 함수
  } catch (err) {
    const fields = err.response?.data?.error?.fields
    if (fields) setServerErrors(fields)      // { email: ['…'] }
    else alert('요청에 실패했습니다.')
  }
}

{serverErrors.email?.map((m) => <p key={m} className="error-text">{m}</p>)}
```

확인: ① 서버 오류 필드가 입력란 아래에 뜨는가 ② 입력을 바꾸면 서버 오류를 지우는가(`setServerErrors({})`) ③ 제출 중 버튼을 비활성화했는가(중복 제출 방지).

### 6. 직접 해 볼 것

1. `LoginFormPractice`에 "비밀번호 확인" 필드를 추가하고, 두 값이 다를 때 오류 표시
2. 제출 중(`submitting`) 상태를 만들어 버튼을 비활성화하고 `로그인 중...` 문구 표시
3. 이메일 입력 중 즉시 검증으로 바꿔 보고, blur 기반과의 UX 차이를 비교

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 입력이 안 됨(글자가 안 써짐) | `value`만 주고 `onChange` 없음 | `onChange`로 상태 갱신 |
| `A component is changing an uncontrolled input to be controlled` | 초기값이 `undefined` | 초기 상태를 `''`로 |
| 제출하면 화면이 새로고침됨 | `preventDefault()` 누락 | `handleSubmit` 맨 앞에 추가 |
| 한 필드 입력 시 다른 필드가 사라짐 | `setForm({ [name]: value })`로 덮어씀 | `{ ...prev, [name]: value }` |
| 에러가 첫 화면부터 뜸 | `touched`/`submitted` 조건 없음 | `shouldShowError` 패턴 |
| 체크박스가 반영 안 됨 | `value` 대신 `checked`를 써야 함 | `checked={form.agree}`, `e.target.checked` |
| 숫자 입력이 문자열 | `e.target.value`는 항상 문자열 | `Number(value)` 변환 |

---

## ☐ 체크리스트

- [ ] Controlled Component의 정의와 `value` + `onChange` 쌍을 설명할 수 있다
- [ ] 객체 상태 + `[name]: value`로 입력 여러 개를 한 핸들러로 처리했다
- [ ] 검증 함수를 컴포넌트 밖 순수 함수로 분리했다
- [ ] 오류를 state가 아닌 파생 값으로 계산했다
- [ ] `touched` / `submitted`로 오류 표시 시점을 제어했다
- [ ] `preventDefault`가 필요한 이유를 안다
- [ ] 클라이언트 검증과 서버 검증의 역할 차이를 설명할 수 있다
- [ ] 서버의 `error.fields`를 폼에 표시하는 코드를 작성했다 (섹션 5)

---

## ➡️ 다음 단계 연결

폼으로 받은 값을 [study6](./study6.md)에서 **백엔드 API로 보내 CRUD**를 만들고, 공통 API 스펙에 맞춰 Spring Boot에 연결합니다.
