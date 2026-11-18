import type { Author, User } from '@/types'

/**
 * 수정은 작성자만. 이는 UX 일 뿐이고 진짜 검사는 서버(403)가 한다 (study7, 노션 "웹 보안 기초": 권한 검사 누락).
 */
export function canEdit(user: User | null, author: Author): boolean {
  return !!user && user.id === author.id
}

/** 삭제는 작성자 또는 관리자(role=admin). */
export function canDelete(user: User | null, author: Author): boolean {
  return !!user && (user.id === author.id || user.role === 'admin')
}
