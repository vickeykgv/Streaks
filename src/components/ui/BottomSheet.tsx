import { useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // iOS Safari: when the keyboard opens, the browser scrolls the layout
  // viewport upward instead of shrinking it. The visualViewport API gives us
  // the real visible rect so we can pin the panel to it.
  useEffect(() => {
    if (!open) return

    const vv = window.visualViewport
    if (!vv) return

    const reposition = () => {
      const el = contentRef.current
      if (!el) return
      el.style.top    = `${vv.offsetTop}px`
      el.style.height = `${vv.height}px`
    }

    // Lock body scroll so iOS doesn't shift the page under the panel
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    vv.addEventListener('resize', reposition)
    vv.addEventListener('scroll', reposition)
    reposition()

    return () => {
      vv.removeEventListener('resize', reposition)
      vv.removeEventListener('scroll', reposition)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--bg-overlay)] animate-fade-in" />
        <Dialog.Content
          ref={contentRef}
          className={cn(
            'fixed inset-x-0 top-0 z-[var(--z-modal)]',
            'flex flex-col bg-surface',
            'outline-none',
            'animate-slide-up',
          )}
          style={{ height: '100svh' }}
        >
          <Dialog.Title className="sr-only">{title ?? 'Create'}</Dialog.Title>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
