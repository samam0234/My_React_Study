import { useEffect } from 'react'
import clsx from 'clsx'
import { useToastStore } from '@/store/toastStore'

function ToastItem({ id, kind, message }: { id: number; kind: 'info' | 'error'; message: string }) {
  const dismiss = useToastStore((s) => s.dismiss)
  useEffect(() => {
    const t = setTimeout(() => dismiss(id), 4000)
    return () => clearTimeout(t)
  }, [id, dismiss])
  return (
    <div
      className={clsx(
        'card flex items-center justify-between gap-3 text-sm',
        kind === 'error' && 'border-red-300 dark:border-red-700',
      )}
    >
      <span>{message}</span>
      <button className="btn" aria-label="알림 닫기" onClick={() => dismiss(id)}>
        ✕
      </button>
    </div>
  )
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 bottom-4 z-50 grid max-w-sm gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  )
}
