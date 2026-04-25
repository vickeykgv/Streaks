import type { Recurrence } from '@/types'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface RecurrencePickerProps {
  value: Recurrence
  onChange: (r: Recurrence) => void
}

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const setType = (type: Recurrence['type']) => {
    if (type === 'daily') onChange({ type: 'daily' })
    else if (type === 'weekly') onChange({ type: 'weekly', daysOfWeek: [1] })
    else onChange({ type: 'custom', interval: 2 })
  }

  const toggleDay = (dow: number) => {
    const current = value.daysOfWeek ?? []
    const next = current.includes(dow)
      ? current.filter(d => d !== dow)
      : [...current, dow].sort()
    if (next.length === 0) return
    onChange({ ...value, daysOfWeek: next })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Type selector */}
      <div className="flex rounded-xl overflow-hidden border border-[var(--border-subtle)]">
        {(['daily', 'weekly', 'custom'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className="flex-1 py-2.5 font-sans font-bold text-[13px] transition-colors capitalize"
            style={{
              background: value.type === t ? 'var(--color-brand-500)' : 'var(--bg-surface)',
              color: value.type === t ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Weekly day picker */}
      {value.type === 'weekly' && (
        <div className="flex gap-1.5">
          {DAYS.map((d, i) => {
            const selected = (value.daysOfWeek ?? []).includes(i)
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                aria-label={DAY_LABELS[i]}
                className="flex-1 h-9 rounded-lg font-sans font-bold text-[12px] transition-all active:scale-90"
                style={{
                  background: selected ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                  color: selected ? '#fff' : 'var(--text-secondary)',
                  border: selected ? 'none' : '1px solid var(--border-subtle)',
                }}
              >
                {d}
              </button>
            )
          })}
        </div>
      )}

      {/* Custom interval */}
      {value.type === 'custom' && (
        <div className="flex items-center gap-2.5">
          <span className="font-sans font-semibold text-[14px] text-[var(--text-secondary)]">Every</span>
          <input
            type="number"
            min={1}
            max={90}
            value={value.interval ?? 2}
            onChange={e => onChange({ ...value, interval: Math.max(1, Math.min(90, parseInt(e.target.value) || 1)) })}
            className="w-20 h-10 rounded-xl px-3 font-sans font-bold text-[15px] text-center text-[var(--text-primary)] bg-surface border border-[var(--border-subtle)] outline-none focus:border-[var(--color-brand-500)]"
          />
          <span className="font-sans font-semibold text-[14px] text-[var(--text-secondary)]">days</span>
        </div>
      )}
    </div>
  )
}
