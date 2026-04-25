import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { cn } from '@/lib/utils'

const icons = {
  success: <CheckCircle size={16} className="text-[var(--color-done)] shrink-0" />,
  error:   <XCircle    size={16} className="text-[var(--color-overdue)] shrink-0" />,
  info:    <Info       size={16} className="text-brand-500 shrink-0" />,
}

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3',
            'bg-[#1a1917] dark:bg-[var(--bg-surface-2)] text-white rounded-xl shadow-lg',
            'pointer-events-auto',
            'animate-slide-in-bottom',
          )}
        >
          {icons[t.type]}
          <span className="text-sm font-medium font-body flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-white/50 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
