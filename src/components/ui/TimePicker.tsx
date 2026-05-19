import { useState, useRef, useEffect } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value?: string             // 'HH:mm'
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minuteStep?: number        // default 5
}

function format12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export function TimePicker({
  value, onChange, placeholder = 'Pick a time', className, disabled, minuteStep = 5,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const parsed = value ? value.split(':').map(Number) : [9, 0]
  const [hour, setHour] = useState(parsed[0] ?? 9)
  const [minute, setMinute] = useState(parsed[1] ?? 0)
  const hourRef = useRef<HTMLDivElement>(null)
  const minRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number)
      if (!Number.isNaN(h)) setHour(h)
      if (!Number.isNaN(m)) setMinute(m)
    }
  }, [value])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      const hEl = hourRef.current?.querySelector<HTMLButtonElement>(`[data-h="${hour}"]`)
      const mEl = minRef.current?.querySelector<HTMLButtonElement>(`[data-m="${minute}"]`)
      if (hEl) hEl.scrollIntoView({ block: 'center' })
      if (mEl) mEl.scrollIntoView({ block: 'center' })
    })
  }, [open, hour, minute])

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) => i * minuteStep)

  const commit = (h: number, m: number) => {
    const v = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    onChange?.(v)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex w-full items-center justify-between gap-2 rounded-xl px-3.5 h-11',
            'font-sans text-[14px] font-semibold text-left',
            'transition-[border-color,box-shadow] duration-150 outline-none',
            'focus:ring-2 focus:ring-[var(--color-brand-500)]/30 focus:border-[var(--color-brand-500)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
          }}
        >
          <span>{value ? format12(value) : placeholder}</span>
          <Clock size={15} className="text-[var(--text-tertiary)] shrink-0" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-[var(--z-modal)] rounded-2xl p-3 animate-zoom-in-95 outline-none"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
            width: 220,
          }}
        >
          <div className="flex gap-2">
            {/* Hours */}
            <div className="flex-1 flex flex-col">
              <span className="font-sans font-bold text-[10px] uppercase text-[var(--text-tertiary)] text-center mb-1">Hr</span>
              <div
                ref={hourRef}
                className="rounded-xl overflow-y-auto"
                style={{ maxHeight: 192, background: 'var(--bg-surface-2)', scrollbarWidth: 'thin' }}
              >
                {hours.map(h => {
                  const active = h === hour
                  const h12 = h % 12 || 12
                  const period = h >= 12 ? 'PM' : 'AM'
                  return (
                    <button
                      key={h}
                      data-h={h}
                      type="button"
                      onClick={() => { setHour(h); commit(h, minute) }}
                      className="w-full px-3 py-1.5 font-sans text-[13px] font-semibold transition-colors text-left"
                      style={{
                        background: active ? 'var(--color-brand-500)' : 'transparent',
                        color: active ? 'var(--text-on-brand)' : 'var(--text-primary)',
                      }}
                    >
                      {h12} {period}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1 flex flex-col">
              <span className="font-sans font-bold text-[10px] uppercase text-[var(--text-tertiary)] text-center mb-1">Min</span>
              <div
                ref={minRef}
                className="rounded-xl overflow-y-auto"
                style={{ maxHeight: 192, background: 'var(--bg-surface-2)', scrollbarWidth: 'thin' }}
              >
                {minutes.map(m => {
                  const active = m === minute
                  return (
                    <button
                      key={m}
                      data-m={m}
                      type="button"
                      onClick={() => { setMinute(m); commit(hour, m) }}
                      className="w-full px-3 py-1.5 font-sans text-[13px] font-semibold transition-colors text-center"
                      style={{
                        background: active ? 'var(--color-brand-500)' : 'transparent',
                        color: active ? 'var(--text-on-brand)' : 'var(--text-primary)',
                      }}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {value && (
            <button
              type="button"
              onClick={() => { onChange?.(''); setOpen(false) }}
              className="w-full mt-2 h-9 rounded-lg font-sans text-[12px] font-bold transition-colors hover:bg-[var(--bg-surface-2)]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Clear
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
