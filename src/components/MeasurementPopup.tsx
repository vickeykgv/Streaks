import { useState } from 'react'
import { Star, Minus, Plus, X } from 'lucide-react'
import { entriesRepo } from '@/db/repos/entries'
import { tasksRepo } from '@/db/repos/tasks'
import { deriveStatus } from '@/lib/measurement'
import type { Habit, HabitEntry, Task } from '@/types'

interface Props {
  habit?: Habit
  entry?: HabitEntry
  task?: Task
  date: string
  onClose: () => void
}

export function MeasurementPopup({ habit, entry, task, date, onClose }: Props) {
  const item = (habit ?? task)!
  const initialValue = entry?.value ?? (task?.progress ?? 0)
  const [value, setValue] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (habit) {
        const merged = { ...(entry ?? {}), value }
        const status = deriveStatus(merged as HabitEntry, habit)
        await entriesRepo.upsert(habit.id, date, { value, status })
      } else if (task) {
        const isDone = task.target ? value >= task.target : value > 0
        await tasksRepo.update(task.id, {
          progress: value,
          status: isDone ? 'done' : 'pending',
          completedAt: isDone ? Date.now() : undefined,
        })
      }
    } finally {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl p-5 flex flex-col gap-5"
        style={{ background: 'var(--bg-surface)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'var(--border-default)' }} />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[24px] shrink-0"
            style={{ background: `${item.color}22` }}
          >
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-extrabold text-[17px] truncate" style={{ color: 'var(--text-primary)' }}>
              {item.title}
            </p>
            <p className="font-body text-[12px] capitalize" style={{ color: 'var(--text-tertiary)' }}>
              {item.measurementType}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-surface-2)' }}>
            <X size={14} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Input based on type */}
        <div className="py-2">
          {item.measurementType === 'count' && (
            <CountInput value={value} onChange={setValue} target={item.target} unit={item.unit} color={item.color} />
          )}
          {item.measurementType === 'duration' && (
            <DurationInput value={value} onChange={setValue} target={item.target} unit={item.unit} color={item.color} />
          )}
          {item.measurementType === 'rating' && (
            <RatingInput value={value} onChange={setValue} color={item.color} />
          )}
          {item.measurementType === 'numeric' && (
            <NumericInput value={value} onChange={setValue} target={item.target} unit={item.unit} color={item.color} />
          )}
        </div>

        <button type="button" onClick={handleSave} disabled={saving}
          className="w-full h-12 rounded-2xl font-sans font-extrabold text-[15px] text-white disabled:opacity-60"
          style={{ background: 'var(--color-brand-500)' }}>
          {saving ? 'Saving…' : 'Log & Complete'}
        </button>
      </div>
    </div>
  )
}

// ─── Count input ──────────────────────────────────────────────────────────────
function CountInput({ value, onChange, target, unit, color }: {
  value: number; onChange: (v: number) => void; target?: number; unit?: string; color: string
}) {
  const complete = target != null && value >= target
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-8">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
          className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center active:scale-90 transition-transform"
          style={{ borderColor: 'var(--border-default)' }}>
          <Minus size={22} color="var(--text-secondary)" />
        </button>
        <div className="text-center min-w-[80px]">
          <div className="font-sans font-extrabold text-[56px] leading-none"
            style={{ color: complete ? color : 'var(--text-primary)' }}>
            {value}
          </div>
          {target != null && (
            <div className="font-body text-[13px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
              of {target} {unit ?? 'times'}
            </div>
          )}
        </div>
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: complete ? color : 'transparent', border: `2px solid ${color}` }}>
          <Plus size={22} color={complete ? '#fff' : color} />
        </button>
      </div>
      {target != null && (
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
          <div className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${Math.min(100, (value / target) * 100)}%`, background: color }} />
        </div>
      )}
    </div>
  )
}

// ─── Duration input ───────────────────────────────────────────────────────────
function DurationInput({ value, onChange, target, unit, color }: {
  value: number; onChange: (v: number) => void; target?: number; unit?: string; color: string
}) {
  const complete = target != null && value >= target
  const presets = [5, 10, 15, 20, 30, 45, 60]
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-center">
        <div className="font-sans font-extrabold text-[56px] leading-none"
          style={{ color: complete ? color : 'var(--text-primary)' }}>
          {value}
        </div>
        <div className="font-body text-[13px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {unit ?? 'minutes'}{target != null && ` of ${target}`}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {presets.map(m => (
          <button key={m} type="button" onClick={() => onChange(m)}
            className="h-9 px-4 rounded-xl font-sans font-bold text-[13px] transition-all active:scale-90"
            style={{
              background: value === m ? color : 'var(--bg-surface-2)',
              color: value === m ? '#fff' : 'var(--text-secondary)',
            }}>
            {m}m
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 w-full">
        <span className="font-body text-[13px] shrink-0" style={{ color: 'var(--text-tertiary)' }}>Custom:</span>
        <input type="number" min={0} value={value || ''} placeholder="0"
          onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="flex-1 h-10 rounded-xl px-3 font-sans font-bold text-[14px] text-center outline-none"
          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1.5px solid var(--border-subtle)' }} />
        <span className="font-body text-[13px] shrink-0" style={{ color: 'var(--text-tertiary)' }}>
          {unit ?? 'min'}
        </span>
      </div>
    </div>
  )
}

// ─── Rating input ─────────────────────────────────────────────────────────────
function RatingInput({ value, onChange, color }: {
  value: number; onChange: (v: number) => void; color: string
}) {
  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Perfect']
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n === value ? 0 : n)}
            className="transition-transform active:scale-90">
            <Star size={48} fill={n <= value ? color : 'none'}
              stroke={n <= value ? color : 'var(--border-default)'} strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <p className="font-sans font-bold text-[14px]"
        style={{ color: value > 0 ? color : 'var(--text-tertiary)' }}>
        {value > 0 ? labels[value] : 'Tap a star to rate'}
      </p>
    </div>
  )
}

// ─── Numeric input ────────────────────────────────────────────────────────────
function NumericInput({ value, onChange, target, unit, color }: {
  value: number; onChange: (v: number) => void; target?: number; unit?: string; color: string
}) {
  const complete = target != null && value >= target
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <input type="number" min={0} value={value || ''} placeholder="0"
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-40 h-16 rounded-2xl text-center font-sans font-extrabold text-[36px] outline-none"
          style={{
            background: 'var(--bg-surface-2)',
            color: complete ? color : 'var(--text-primary)',
            border: `2px solid ${complete ? color : 'var(--border-subtle)'}`,
          }} />
        {unit && (
          <span className="font-sans font-bold text-[20px]" style={{ color: 'var(--text-secondary)' }}>{unit}</span>
        )}
      </div>
      {target != null && (
        <p className="font-body text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          Target: {target} {unit ?? ''}
        </p>
      )}
    </div>
  )
}
