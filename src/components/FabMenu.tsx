import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

export interface FabMenuItem {
  label: string
  description?: string
  icon: ReactNode
  onClick: () => void
  color?: string
}

interface FabMenuProps {
  items: FabMenuItem[]
  title?: string
  subtitle?: string
}

function FabSheet({ open, onClose, items, title, subtitle }: FabMenuProps & { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
    } else {
      setShown(false)
      t = setTimeout(() => setMounted(false), 400)
    }
    return () => clearTimeout(t)
  }, [open])

  if (!mounted) return null

  const isOdd = items.length % 2 !== 0

  return createPortal(
    <>
      <div
        className="fixed inset-0"
        style={{
          zIndex: 30,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          opacity: shown ? 1 : 0,
          transition: 'opacity 0.34s ease',
        }}
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 rounded-t-[26px]"
        style={{
          zIndex: 31,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderBottom: 'none',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
          transform: shown ? 'translateY(0)' : 'translateY(104%)',
          transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div className="flex justify-center pt-2.5 pb-0.5">
          <div className="w-9 h-[3.5px] rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <div className="flex items-start justify-between px-5 pt-3 pb-3">
          <div>
            <p className="font-sans text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
              {title ?? 'What do you want to add?'}
            </p>
            {subtitle && (
              <p className="font-body text-[13px] text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center font-sans text-[14px] text-[var(--text-secondary)]"
            style={{ background: 'var(--bg-surface-2)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div
          className="grid grid-cols-2 gap-3 px-5"
          style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
        >
          {items.map(({ label, description, icon, onClick, color }, i) => {
            const isLastOdd = isOdd && i === items.length - 1
            return (
              <button
                key={i}
                type="button"
                onClick={() => { onClose(); setTimeout(() => onClick(), 360) }}
                className="flex flex-col items-start rounded-[16px] p-[15px] text-left transition-transform active:scale-[0.97]"
                style={{
                  gap: '5px',
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  gridColumn: isLastOdd ? 'span 2' : undefined,
                }}
              >
                <div
                  className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center"
                  style={{
                    marginBottom: 4,
                    background: color ? `color-mix(in srgb, ${color} 16%, transparent)` : 'var(--bg-surface)',
                    color: color ?? 'var(--color-brand-500)',
                  }}
                >
                  {icon}
                </div>
                <span className="font-sans text-[15px] font-semibold text-[var(--text-primary)]">{label}</span>
                {description && (
                  <span className="font-body leading-[1.3] text-[var(--text-tertiary)]" style={{ fontSize: '11.5px' }}>
                    {description}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </>,
    document.body,
  )
}

export function FabMenu({ items, title, subtitle }: FabMenuProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="lg:hidden fixed bottom-24 right-4 w-[56px] h-[56px] rounded-[18px] flex items-center justify-center z-20 transition-all duration-200"
        style={{
          background: 'var(--color-brand-500)',
          boxShadow: 'var(--shadow-fab)',
          transform: open ? 'scale(0.9) rotate(45deg)' : 'scale(1) rotate(0deg)',
        }}
        aria-label="Add"
      >
        <Plus size={24} strokeWidth={2.4} color="#fff" />
      </button>
      <FabSheet open={open} onClose={close} items={items} title={title} subtitle={subtitle} />
    </>
  )
}
