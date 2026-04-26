import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--bg-overlay)] backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[var(--z-modal)] w-[calc(100vw-2.5rem)] max-w-[340px] rounded-[26px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl outline-none animate-zoom-in-95">
          {/* Icon + text */}
          <div className="flex flex-col items-center text-center gap-3 mb-5">
            {danger && (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(229,9,20,0.12)', color: 'var(--color-overdue)' }}
              >
                <AlertTriangle size={22} strokeWidth={2} />
              </div>
            )}
            <Dialog.Title className="font-sans text-[17px] font-extrabold text-[var(--text-primary)] leading-tight">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="font-body text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-[260px]">
                {description}
              </Dialog.Description>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleConfirm}
              className="h-11 w-full rounded-[14px] font-sans text-[14px] font-extrabold text-white transition-opacity active:opacity-80"
              style={{ background: danger ? 'var(--color-overdue)' : 'var(--color-brand-500)' }}
            >
              {confirmLabel}
            </button>
            <button
              onClick={onClose}
              className="h-11 w-full rounded-[14px] font-sans text-[14px] font-bold text-[var(--text-secondary)] transition-opacity active:opacity-80"
              style={{ background: 'var(--bg-surface-2)' }}
            >
              Cancel
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
