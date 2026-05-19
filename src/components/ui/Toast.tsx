import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'

const styles = {
  success: {
    gradient: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
    border: 'rgba(34,197,94,0.3)',
    icon: <CheckCircle2 size={14} strokeWidth={2.5} color="#4ade80" />,
  },
  error: {
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)',
    border: 'rgba(239,68,68,0.3)',
    icon: <XCircle size={14} strokeWidth={2.5} color="#fca5a5" />,
  },
  info: {
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)',
    border: 'rgba(249,115,22,0.3)',
    icon: <AlertCircle size={14} strokeWidth={2.5} color="#fdba74" />,
  },
}

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const s = styles[t.type]
        return (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl pointer-events-auto animate-slide-in-bottom"
            style={{
              background: s.gradient,
              border: `1px solid ${s.border}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
              minWidth: 180,
              maxWidth: 280,
            }}
          >
            {s.icon}
            <span className="font-sans text-[12px] font-semibold text-white flex-1 leading-tight">
              {t.message}
            </span>
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); dismiss(t.id) }}
                className="font-sans text-[12px] font-extrabold text-white uppercase tracking-wide px-2 py-1 rounded-md hover:bg-white/15 transition-colors shrink-0"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="text-white/50 hover:text-white transition-colors shrink-0 ml-1"
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
