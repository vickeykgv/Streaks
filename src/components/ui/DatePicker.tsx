import { useState, useMemo } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, isSameMonth, isSameDay, isToday,
} from 'date-fns'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: string             // 'YYYY-MM-DD'
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: string
  maxDate?: string
}

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const WEEK_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function DatePicker({
  value, onChange, placeholder = 'Pick a date', className, disabled, minDate, maxDate,
}: DatePickerProps) {
  const selected = value ? parseISO(value + 'T12:00:00') : undefined
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState<Date>(selected ?? new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 })
    const arr: Date[] = []
    let d = start
    while (d <= end) {
      arr.push(d)
      d = addDays(d, 1)
    }
    return arr
  }, [viewMonth])

  const minD = minDate ? parseISO(minDate + 'T12:00:00') : undefined
  const maxD = maxDate ? parseISO(maxDate + 'T12:00:00') : undefined

  const pick = (d: Date) => {
    if (minD && d < minD) return
    if (maxD && d > maxD) return
    onChange?.(toISO(d))
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (o && selected) setViewMonth(selected) }}>
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
            color: selected ? 'var(--text-primary)' : 'var(--text-tertiary)',
          }}
        >
          <span>{selected ? format(selected, 'EEE, MMM d, yyyy') : placeholder}</span>
          <Calendar size={15} className="text-[var(--text-tertiary)] shrink-0" />
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
            width: 304,
          }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2 px-1">
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, -1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-surface-2)]"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} color="var(--text-secondary)" />
            </button>
            <span className="font-sans font-extrabold text-[14px] text-[var(--text-primary)]">
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-surface-2)]"
              aria-label="Next month"
            >
              <ChevronRight size={16} color="var(--text-secondary)" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 mb-1 px-1">
            {WEEK_LABELS.map((w, i) => (
              <div key={i} className="text-center font-sans font-bold text-[10px] uppercase text-[var(--text-tertiary)]">
                {w}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1 px-1">
            {days.map(d => {
              const inMonth = isSameMonth(d, viewMonth)
              const isSel   = selected && isSameDay(d, selected)
              const isTdy   = isToday(d)
              const disabledDay = (minD && d < minD) || (maxD && d > maxD)
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={disabledDay || undefined}
                  onClick={() => pick(d)}
                  className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center font-sans text-[13px] font-semibold transition-all',
                    'disabled:opacity-30 disabled:cursor-not-allowed',
                  )}
                  style={{
                    background: isSel
                      ? 'var(--color-brand-500)'
                      : isTdy
                      ? 'var(--bg-surface-2)'
                      : 'transparent',
                    color: isSel
                      ? 'var(--text-on-brand)'
                      : !inMonth
                      ? 'var(--text-tertiary)'
                      : isTdy
                      ? 'var(--color-brand-500)'
                      : 'var(--text-primary)',
                    boxShadow: isSel ? 'var(--shadow-glow)' : undefined,
                  }}
                >
                  {format(d, 'd')}
                </button>
              )
            })}
          </div>

          {/* Footer actions */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => pick(new Date())}
              className="flex-1 h-9 rounded-lg font-sans text-[12px] font-bold transition-colors hover:bg-[var(--bg-surface-2)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange?.(''); setOpen(false) }}
                className="flex-1 h-9 rounded-lg font-sans text-[12px] font-bold transition-colors hover:bg-[var(--bg-surface-2)]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Clear
              </button>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
