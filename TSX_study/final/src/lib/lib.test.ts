import { logger, redact } from './logger'
import { canDelete, canEdit } from './permissions'
import { commentSchema, loginSchema, postSchema, signupSchema, validate } from './validators'
import { admin, jun, mina } from '@/test/fixtures'

describe('validate (zod → 필드별 메시지)', () => {
  it('유효하면 빈 객체', () => {
    expect(
      validate(signupSchema, { email: 'a@b.com', password: 'password123', nickname: 'mina' }),
    ).toEqual({})
  })

  it('회원가입: 이메일 형식, 비밀번호 8자, 닉네임 2~20자', () => {
    const e = validate(signupSchema, { email: 'nope', password: '1234567', nickname: 'a' })
    expect(e.email?.[0]).toMatch(/이메일/)
    expect(e.password?.[0]).toMatch(/8자/)
    expect(e.nickname?.[0]).toMatch(/2~20자/)
    expect(
      validate(signupSchema, {
        email: 'a@b.com',
        password: 'password123',
        nickname: 'x'.repeat(21),
      }).nickname,
    ).toBeDefined()
  })

  it('로그인: 빈 값만 막고 형식 판단은 서버에 맡긴다', () => {
    expect(validate(loginSchema, { email: '', password: '' })).toMatchObject({
      email: expect.any(Array),
      password: expect.any(Array),
    })
    expect(validate(loginSchema, { email: 'username-only', password: 'x' })).toEqual({})
  })

  it('글·댓글: 공백만 있으면 오류, 길이 상한', () => {
    expect(validate(postSchema, { title: '   ', body: 'x' }).title).toBeDefined()
    expect(validate(postSchema, { title: 'x'.repeat(201), body: 'x' }).title).toBeDefined()
    expect(validate(commentSchema, { body: ' ' }).body).toBeDefined()
    expect(validate(commentSchema, { body: '좋은 글' })).toEqual({})
  })
})

describe('logger.redact', () => {
  it('비밀번호·토큰을 중첩 객체까지 마스킹한다', () => {
    const out = redact({
      user: 'mina',
      password: 'secret',
      nested: { accessToken: 't', list: [{ Authorization: 'Bearer x' }] },
    })
    expect(JSON.stringify(out)).not.toMatch(/secret|Bearer|"t"/)
    expect(out).toMatchObject({ user: 'mina', password: '[REDACTED]' })
  })

  it('error() 는 메시지와 마스킹된 컨텍스트를 돌려준다', () => {
    const entry = logger.error(new Error('boom'), { password: 'p' })
    expect(entry.level).toBe('error')
    expect(entry.message).toBe('boom')
    expect(entry.context).toEqual({ password: '[REDACTED]' })
  })
})

describe('canEdit (작성자만 수정·삭제 UI)', () => {
  it('로그인 사용자와 작성자 id 가 같을 때만 true', () => {
    expect(canEdit(mina, { id: mina.id, nickname: 'mina' })).toBe(true)
    expect(canEdit(jun, { id: mina.id, nickname: 'mina' })).toBe(false)
    expect(canEdit(null, { id: mina.id, nickname: 'mina' })).toBe(false)
  })
})

describe('canDelete (작성자 또는 관리자)', () => {
  it('관리자는 남의 글도 삭제할 수 있지만 수정할 수는 없다', () => {
    const author = { id: mina.id, nickname: 'mina' }
    expect(canDelete(admin, author)).toBe(true)
    expect(canEdit(admin, author)).toBe(false)
    expect(canDelete(jun, author)).toBe(false)
    expect(canDelete(mina, author)).toBe(true)
    expect(canDelete(null, author)).toBe(false)
  })
})
