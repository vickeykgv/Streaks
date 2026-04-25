import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--bg-overlay)] backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'z-[var(--z-modal)] w-[calc(100vw-2rem)]',
          sizes[size],
          'max-h-[min(88vh,760px)] overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-surface shadow-lg',
          'outline-none',
          'animate-zoom-in-95',
        )}>
          {title && (
            <div className="mb-4 flex items-start justify-between px-5 pt-5">
              <div>
                <Dialog.Title className="text-lg font-extrabold font-sans text-[var(--text-primary)]">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="text-sm text-[var(--text-secondary)] mt-1">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 -mr-1 rounded-md hover:bg-surface2">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
          )}
          <div className="flex max-h-[inherit] min-h-0 flex-col">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
