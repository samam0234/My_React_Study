import { create } from 'zustand'

export interface Toast {
  id: number
  kind: 'info' | 'error'
  message: string
}

interface ToastState {
  toasts: Toast[]
  push: (kind: Toast['kind'], message: string) => void
  dismiss: (id: number) => void
}

let nextId = 1

// 화면 어디서든(인터셉터 포함) getState().push() 로 알림을 띄운다 — 휘발성이라 persist 하지 않는다.
export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (kind, message) => set((s) => ({ toasts: [...s.toasts, { id: nextId++, kind, message }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
