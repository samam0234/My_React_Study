import type { ReactNode } from 'react'

interface Props {
  kind: 'loading' | 'error' | 'empty'
  children: ReactNode
  action?: ReactNode
}

// 로딩/에러/빈 상태를 화면에 명시한다 (노션 구조 원칙). 스크린 리더에는 role 로 알린다.
export default function StateMessage({ kind, children, action }: Props) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={kind === 'error' ? 'card error-text' : 'card text-slate-600 dark:text-slate-300'}
    >
      <p>{children}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
