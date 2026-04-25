import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, Minus, Plus, Play, Pause, Star } from 'lucide-react'
import { entriesRepo } from '@/db/repos/entries'
import { isEntryComplete, deriveStatus } from '@/lib/measurement'
import { today } from '@/lib/dates'
import type { Habit, HabitEntry } from '@/types'

interface MeasurementControlProps {
  habit: Habit
  entry: HabitEntry | undefined
  onComplete?: () => void
}

export function MeasurementControl({ habit, entry, onComplete }: MeasurementControlProps) {
  const done = isEntryComplete(entry, habit)
  const color = done ? 'var(--color-done)' : habit.color

  const upsert = useCallback(async (patch: Partial<HabitEntry>) => {
    const merged = { ...(entry ?? {}), ...patch }
    const status = deriveStatus(merged, habit)
    const updated = await entriesRepo.upsert(habit.id, today(), { ...patch, status })
    if (status === 'done' && !isEntryComplete(entry, habit)) {
      onComplete?.()
    }
    return updated
  }, [entry, habit, onComplete])

  switch (habit.measurementType) {
    case 'checkbox':
      return <CheckboxCtrl done={done} color={color} onToggle={() => upsert({ status: done ? 'pending' : 'done' })} />
    case 'count':
      return (
        <CountCtrl
          value={entry?.value ?? 0}
          target={habit.target}
          unit={habit.unit}
          color={color}
          onChange={v => upsert({ value: v })}
        />
      )
    case 'duration':
      return (
        <DurationCtrl
          habitId={habit.id}
          valueMin={entry?.value ?? 0}
          target={habit.target}
          color={color}
          onUpdate={v => upsert({ value: v })}
        />
      )
    case 'rating':
      return (
        <RatingCtrl
          value={entry?.value ?? 0}
          color={color}
          onChange={v => upsert({ value: v, status: v > 0 ? 'done' : 'pending' })}
        />
      )
    case 'numeric':
      return (
        <NumericCtrl
          value={entry?.value}
          unit={habit.unit}
          color={color}
          onChange={v => upsert({ value: v })}
        />
      )
  }
}

// ─── Individual controls ──────────────────────────────────────────

function CheckboxCtrl({ done, color, onToggle }: { done: boolean; color: string; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={done ? 'Mark not done' : 'Mark done'}
      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-[200ms] ease-[var(--ease-spring)] active:scale-90"
      style={{
        border: `2px solid ${done ? color : 'var(--border-default)'}`,
        background: done ? color : 'transparent',
        boxShadow: done ? `0 0 0 6px ${color}18` : 'none',
      }}
    >
      {done && <Check size={22} color="#fff" strokeWidth={3} />}
    </button>
  )
}

function CountCtrl({ value, target, unit, color, onChange }: {
  value: number; target?: number; unit?: string; color: string; onChange: (v: number) => void
}) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0
  const complete = target != null && value >= target
  return (
    <div className="flex flex-col items-end gap-1.5 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-[10px] border border-[var(--border-subtle)] flex items-center justify-center active:scale-90 transition-transform"
        >
          <Minus size={16} color="var(--text-secondary)" />
        </button>
        <div className="min-w-[58px] text-center font-sans font-extrabold leading-none" style={{ color: complete ? color : 'var(--text-primary)' }}>
          <span className="text-[18px]">{value}</span>
          {target != null && <span className="text-[13px] font-semibold text-[var(--text-tertiary)]">/{target}</span>}
        </div>
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-[10px] flex items-center justify-center active:scale-90 transition-transform"
          style={{ border: `1.5px solid ${color}`, background: complete ? color : 'transparent' }}
        >
          <Plus size={16} color={complete ? '#fff' : color} />
        </button>
      </div>
      {target != null && (
        <div className="w-[124px] h-1 rounded-full bg-surface2 overflow-hidden">
          <div className="h-full rounded-full transition-[width] duration-[350ms]" style={{ width: `${pct}%`, background: color }} />
        </div>
      )}
      {unit && <span className="text-[11px] text-[var(--text-tertiary)] font-sans font-semibold">{unit}</span>}
    </div>
  )
}

function DurationCtrl({ habitId, valueMin, target, color, onUpdate }: {
  habitId: string; valueMin: number; target?: number; color: string; onUpdate: (v: number) => void
}) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(valueMin * 60) // seconds
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setElapsed(valueMin * 60)
  }, [habitId]) // reset on habit change

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(s => {
          const next = s + 1
          // update DB every 60 seconds
          if (next % 60 === 0) onUpdate(next / 60)
          return next
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (elapsed > 0) onUpdate(elapsed / 60)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalMin = elapsed / 60
  const pct = target ? Math.min(100, (totalMin / target) * 100) : 0
  const complete = target != null && totalMin >= target
  const mm = String(Math.floor(totalMin)).padStart(2, '0')
  const ss = String(Math.floor(elapsed % 60)).padStart(2, '0')

  return (
    <div className="flex flex-col items-end gap-1.5 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="font-sans font-extrabold text-[18px] tabular-nums leading-none" style={{ color: complete ? color : 'var(--text-primary)' }}>
          {mm}:{ss}
          {target != null && <span className="text-[13px] font-semibold text-[var(--text-tertiary)]">/{target}m</span>}
        </div>
        <button
          onClick={() => setRunning(r => !r)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-[200ms]"
          style={{ background: running ? color : 'transparent', border: `2px solid ${color}` }}
        >
          {running ? <Pause size={16} color="#fff" /> : <Play size={16} color={color} />}
        </button>
      </div>
      {target != null && (
        <div className="w-[124px] h-1 rounded-full bg-surface2 overflow-hidden">
          <div className="h-full rounded-full transition-[width] duration-[350ms]" style={{ width: `${pct}%`, background: color }} />
        </div>
      )}
    </div>
  )
}

function RatingCtrl({ value, color, onChange }: { value: number; color: string; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1 shrink-0">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n === value ? 0 : n)}
          className="p-0.5 transition-transform duration-[120ms] active:scale-90"
          aria-label={`Rate ${n}`}
        >
          <Star
            size={20}
            fill={n <= value ? color : 'none'}
            stroke={n <= value ? color : 'var(--border-default)'}
            strokeWidth={1.8}
          />
        </button>
      ))}
    </div>
  )
}

function NumericCtrl({ value, unit, color, onChange }: {
  value?: number; unit?: string; color: string; onChange: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ''))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const commit = () => {
    const n = parseFloat(draft)
    if (!isNaN(n)) onChange(n)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        className="w-[90px] h-10 rounded-xl text-right pr-2.5 font-sans font-extrabold text-[16px] outline-none text-[var(--text-primary)] bg-surface"
        style={{ border: `2px solid ${color}` }}
      />
    )
  }
  return (
    <button
      onClick={() => { setDraft(String(value ?? '')); setEditing(true) }}
      className="flex items-baseline gap-1 px-3.5 h-10 rounded-xl shrink-0"
      style={{ background: value ? `${color}15` : 'var(--bg-surface-2)' }}
    >
      <span className="font-sans font-extrabold text-[18px]" style={{ color: value ? color : 'var(--text-tertiary)' }}>
        {value ?? '—'}
      </span>
      {unit && <span className="text-xs text-[var(--text-secondary)] font-semibold">{unit}</span>}
    </button>
  )
}
