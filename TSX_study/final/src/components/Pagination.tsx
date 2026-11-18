interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
  disabled?: boolean
}

export default function Pagination({ page, totalPages, onChange, disabled }: Props) {
  return (
    <nav aria-label="페이지 이동" className="flex items-center justify-center gap-3">
      <button className="btn" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
        ← 이전
      </button>
      <span aria-live="polite">
        {page} / {totalPages} 페이지
      </span>
      <button
        className="btn"
        disabled={disabled || page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        다음 →
      </button>
    </nav>
  )
}
