import type { InputHTMLAttributes, ReactNode } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string
  label: string
  errors?: string[] | undefined
  as?: 'input' | 'textarea'
  hint?: ReactNode
}

// label 연결(htmlFor/id), 오류는 aria-invalid + aria-describedby 로 스크린 리더에 전달 (study13 접근성)
export default function FormField({ id, label, errors, as = 'input', hint, ...rest }: Props) {
  const invalid = !!errors?.length
  const describedBy = invalid ? `${id}-error` : undefined
  const common = {
    id,
    'aria-invalid': invalid || undefined,
    'aria-describedby': describedBy,
    className: 'input',
  }
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea
          {...common}
          rows={8}
          {...(rest as unknown as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input {...common} {...rest} />
      )}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {invalid && (
        <p id={describedBy} className="error-text">
          {errors.join(' ')}
        </p>
      )}
    </div>
  )
}
