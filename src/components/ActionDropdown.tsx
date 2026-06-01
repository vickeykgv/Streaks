import { useState, useRef, useEffect, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface ActionItem {
  label: string
  icon?: ReactNode
  onClick: () => void
}

interface ActionDropdownProps {
  items: ActionItem[]
}

export function ActionDropdown({ items }: ActionDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!items.length) return null
  const [primary, ...rest] = items
  const hasMore = rest.length > 0

  return (
    <div ref={ref} className="relative flex" style={{ boxShadow: 'var(--shadow-glow)', borderRadius: 16 }}>
      {/* Primary action */}
      <button
        onClick={primary.onClick}
        className="flex items-center gap-1.5 pl-4 pr-3 h-10 font-sans font-bold text-[13px] shrink-0 text-white transition-all active:opacity-80"
        style={{
          background: 'var(--color-brand-500)',
          borderRadius: hasMore ? '16px 0 0 16px' : '16px',
        }}
      >
        {primary.icon}
        <span>{primary.label}</span>
      </button>

      {hasMore && (
        <>
          <div className="w-px h-10 shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }} />
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center justify-center w-9 h-10 text-white transition-all active:opacity-80"
            style={{
              background: 'var(--color-brand-500)',
              borderRadius: '0 16px 16px 0',
            }}
            aria-label="More actions"
          >
            <ChevronDown
              size={13}
              strokeWidth={2.5}
              style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s ease' }}
            />
          </button>
        </>
      )}

      {open && hasMore && (
        <div
          className="absolute right-0 top-full mt-2 min-w-[200px] rounded-[18px] overflow-hidden z-50"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <button
            onClick={() => { primary.onClick(); setOpen(false) }}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
          >
            {primary.icon && <span className="shrink-0">{primary.icon}</span>}
            <span className="font-sans font-bold text-[13px]" style={{ color: 'var(--color-brand-500)' }}>
              {primary.label}
            </span>
          </button>
          <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {rest.map((item, i) => (
              <button
                key={i}
                onClick={() => { item.onClick(); setOpen(false) }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
              >
                {item.icon && <span className="shrink-0 text-[var(--text-secondary)]">{item.icon}</span>}
                <span className="font-sans font-semibold text-[13px] text-[var(--text-primary)]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
