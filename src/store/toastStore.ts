import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: string
  message: string
  type: ToastType
  action?: ToastAction
  duration: number
}

interface ToastStore {
  toasts: Toast[]
  show: (message: string, opts?: { type?: ToastType; action?: ToastAction; duration?: number }) => string
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show(message, opts = {}) {
    const id = Math.random().toString(36).slice(2)
    const duration = opts.duration ?? (opts.action ? 5000 : 3500)
    set(s => ({ toasts: [...s.toasts, { id, message, type: opts.type ?? 'info', action: opts.action, duration }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), duration)
    return id
  },
  dismiss: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

export const toast = {
  success: (msg: string, action?: ToastAction) => useToastStore.getState().show(msg, { type: 'success', action }),
  error:   (msg: string, action?: ToastAction) => useToastStore.getState().show(msg, { type: 'error', action }),
  info:    (msg: string, action?: ToastAction) => useToastStore.getState().show(msg, { type: 'info', action }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
}
