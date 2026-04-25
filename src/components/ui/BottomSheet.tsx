import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--bg-overlay)] backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className={cn(
          'fixed bottom-0 left-0 right-0 z-[var(--z-modal)]',
          'max-h-[88vh] overflow-hidden rounded-t-[28px] bg-surface shadow-lg',
          'border-t border-[var(--border-subtle)]',
          'px-4 pb-4 pt-4',
          'outline-none',
          'animate-slide-up',
        )}>
          <div className="w-10 h-1 bg-[var(--border-default)] rounded-full mx-auto mb-4" />
          {title && (
            <Dialog.Title className="text-lg font-extrabold font-sans text-[var(--text-primary)] mb-4">
              {title}
            </Dialog.Title>
          )}
          <div className="flex min-h-0 flex-col">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
