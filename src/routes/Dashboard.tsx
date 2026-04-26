import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bell, Plus, AlertCircle, Search, Briefcase, Home, ChevronDown, Check, MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { format, parseISO, subDays, addDays } from 'date-fns'
import { useDashboard } from '@/hooks/useDashboard'
import { MeasurementPopup } from '@/components/MeasurementPopup'
import { habitsRepo } from '@/db/repos/habits'
import { entriesRepo } from '@/db/repos/entries'
import { tasksRepo } from '@/db/repos/tasks'
import { computeStreak } from '@/lib/streaks'
import { isEntryComplete } from '@/lib/measurement'
import { copy } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import type { Habit, HabitEntry, Task, World } from '@/types'

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, gradient, progress,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  gradient?: string
  progress?: number
}) {
  return (
    <div
      className="glass-panel rounded-[26px] p-4"
      style={gradient
        ? { background: gradient, boxShadow: 'var(--shadow-glow)', border: 'none' }
        : { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }
      }
    >
      <div
        className="font-sans text-[10px] font-bold uppercase tracking-[0.5px] mb-1.5"
        style={{ color: gradient ? 'color-mix(in srgb, var(--text-on-brand) 76%, transparent)' : 'var(--text-tertiary)' }}
      >
        {label}
      </div>
      <div
        className="font-sans font-extrabold text-[24px] leading-none tracking-tight"
        style={{ color: gradient ? 'var(--text-on-brand)' : 'var(--text-primary)' }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="font-body text-[11px] mt-1.5"
          style={{ color: gradient ? 'color-mix(in srgb, var(--text-on-brand) 76%, transparent)' : 'var(--text-secondary)' }}
        >
          {sub}
        </div>
      )}
      {progress != null && (
        <div className="mt-2.5 h-1 rounded-full overflow-hidden"
          style={{ background: gradient ? 'color-mix(in srgb, var(--text-on-brand) 18%, transparent)' : 'var(--bg-surface-2)' }}>
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%`, background: gradient ? 'var(--text-on-brand)' : 'var(--color-brand-500)' }}
          />
        </div>
      )}
    </div>
  )
}

// ─── World switcher ───────────────────────────────────────────────────────────
function WorldSwitcher({ world, onChange }: { world: World; onChange: (w: World) => void }) {
  return (
    <div
      className="glass-panel flex rounded-2xl p-[4px] gap-1"
      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}
    >
      {(['personal', 'professional'] as World[]).map(w => {
        const active = world === w
        return (
          <button
            key={w}
            onClick={() => onChange(w)}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[14px] font-sans font-bold text-[13px] transition-all duration-150 whitespace-nowrap"
            style={{
              background: active ? 'var(--color-brand-500)' : 'transparent',
              color: active ? 'var(--text-on-brand)' : 'var(--text-tertiary)',
              boxShadow: active ? 'var(--shadow-glow)' : 'none',
            }}
          >
            {w === 'personal'
              ? <Home size={12} strokeWidth={active ? 2.5 : 2} />
              : <Briefcase size={12} strokeWidth={active ? 2.5 : 2} />
            }
            <span className="capitalize">{w}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Calendar strip ───────────────────────────────────────────────────────────
function CalendarStrip({ selectedDate, onSelect }: {
  selectedDate: string
  onSelect: (date: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const days = useMemo(() =>
    Array.from({ length: 29 }, (_, i) => format(addDays(new Date(), i - 14), 'yyyy-MM-dd')),
  [])

  // Scroll selected day into center
  useEffect(() => {
    if (!scrollRef.current) return
    const idx = days.indexOf(selectedDate)
    if (idx < 0) return
    requestAnimationFrame(() => {
      const container = scrollRef.current!
      const child = container.children[idx] as HTMLElement
      if (!child) return
      container.scrollLeft = child.offsetLeft - container.offsetWidth / 2 + child.offsetWidth / 2
    })
  }, [selectedDate, days])

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto px-4"
      style={{ scrollbarWidth: 'none' } as React.CSSProperties}
    >
      {days.map(date => {
        const d = parseISO(date + 'T12:00:00')
        const isSelected = date === selectedDate
        const isToday = date === todayStr

        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelect(date)}
            className="flex flex-col items-center gap-0.5 rounded-[22px] py-2.5 shrink-0 w-[56px] transition-all duration-150 active:scale-95"
            style={{
              background: isSelected ? 'var(--color-brand-500)' : 'var(--bg-surface)',
              border: isToday && !isSelected
                ? '1.5px solid var(--color-brand-500)'
                : `1px solid ${isSelected ? 'transparent' : 'var(--border-subtle)'}`,
              boxShadow: isSelected ? 'var(--shadow-glow)' : 'var(--shadow-xs)',
            }}
          >
            <span
              className="font-sans font-bold text-[10px] uppercase"
              style={{ color: isSelected ? 'color-mix(in srgb, var(--text-on-brand) 74%, transparent)' : 'var(--text-tertiary)' }}
            >
              {format(d, 'EEE')}
            </span>
            <span
              className="font-sans font-extrabold text-[20px] leading-none mt-0.5"
              style={{ color: isSelected ? 'var(--text-on-brand)' : isToday ? 'var(--color-brand-500)' : 'var(--text-primary)' }}
            >
              {format(d, 'd')}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Weekly chart (right panel) ───────────────────────────────────────────────
function WeeklyChart() {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd')
  const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'))

  const entries = useLiveQuery(() => entriesRepo.getForDateRange(startDate), [startDate])
  const habits = useLiveQuery(() => habitsRepo.getAll(false), []) ?? []
  const total = habits.length

  if (!entries) return null

  const bars = last7.map(date => {
    const done = entries.filter(e => e.date === date && e.status === 'done').length
    return { date, pct: total > 0 ? done / total : 0, isToday: date === todayStr }
  })

  const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div>
      <p className="font-sans font-extrabold text-[11px] uppercase tracking-[0.4px] text-[var(--text-tertiary)] mb-3">
        This Week
      </p>
      <div className="flex items-end gap-1.5" style={{ height: '72px' }}>
        {bars.map(({ date, pct, isToday }) => {
          const dow = new Date(date + 'T12:00:00').getDay()
          const barH = pct > 0 ? `${Math.round(pct * 100)}%` : '5px'
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end" style={{ height: '54px' }}>
                <div
                  className="w-full rounded-t-[4px] rounded-b-[2px]"
                  style={{
                    height: barH,
                    background: isToday
                      ? 'var(--color-brand-500)'
                      : pct > 0
                      ? 'var(--color-brand-400)'
                      : 'var(--bg-surface-2)',
                    opacity: isToday ? 1 : pct > 0 ? 0.65 : 1,
                    minHeight: '5px',
                  }}
                />
              </div>
              <span
                className="font-sans text-[9px] font-bold"
                style={{ color: isToday ? 'var(--color-brand-500)' : 'var(--text-tertiary)' }}
              >
                {DAY_INITIALS[dow]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Top streaks (right panel) ────────────────────────────────────────────────
function TopStreaks() {
  const streakData = useLiveQuery(async () => {
    const habits = await habitsRepo.getAll(false)
    const withStreaks = await Promise.all(habits.map(async h => {
      const entries = await entriesRepo.getForHabit(h.id)
      return { id: h.id, title: h.title, color: h.color, icon: h.icon, streak: computeStreak(entries) }
    }))
    return withStreaks.filter(h => h.streak > 0).sort((a, b) => b.streak - a.streak).slice(0, 5)
  }, [])

  if (!streakData || streakData.length === 0) return null

  return (
    <div>
      <p className="font-sans font-extrabold text-[11px] uppercase tracking-[0.4px] text-[var(--text-tertiary)] mb-3">
        Streaks
      </p>
      <div className="flex flex-col gap-2.5">
        {streakData.map(h => (
          <div key={h.id} className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[14px]"
              style={{ background: `${h.color}1a` }}
            >
              {h.icon}
            </div>
            <span className="flex-1 font-sans font-semibold text-[12px] text-[var(--text-primary)] truncate min-w-0">
              {h.title}
            </span>
            <span className="font-sans font-extrabold text-[12px] shrink-0" style={{ color: 'var(--color-streak)' }}>
              🔥{h.streak}d
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Type chip ────────────────────────────────────────────────────────────────
function TypeChip({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span className="font-sans font-bold text-[10px] px-2 py-0.5 rounded-full leading-none"
      style={{ background: bg, color }}>
      {label}
    </span>
  )
}

// ─── Measurement progress chip ────────────────────────────────────────────────
function MeasurementChip({ habit, entry }: { habit: Habit; entry: HabitEntry | undefined }) {
  const v = entry?.value ?? 0
  const t = habit.target
  const u = habit.unit ?? ''
  let label = ''
  switch (habit.measurementType) {
    case 'count':    label = `${v}/${t ?? '?'} ${u || 'times'}`; break
    case 'duration': label = `${v}/${t ?? '?'} ${u || 'min'}`; break
    case 'rating':   label = v > 0 ? `${'★'.repeat(v)}${'☆'.repeat(5 - v)}` : '☆☆☆☆☆'; break
    case 'numeric':  label = `${v > 0 ? v : '—'}${u ? ' ' + u : ''}`; break
    default:         return null
  }
  return (
    <span className="font-sans font-bold text-[10px] px-2 py-0.5 rounded-full leading-none"
      style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
      {label}
    </span>
  )
}

// ─── Task measurement chip ────────────────────────────────────────────────────
function TaskMeasurementChip({ task }: { task: Task }) {
  const v = task.progress ?? 0
  const t = task.target
  const u = task.unit ?? ''
  let label = ''
  switch (task.measurementType) {
    case 'count':    label = `${v}/${t ?? '?'} ${u || 'times'}`; break
    case 'duration': label = `${v}/${t ?? '?'} ${u || 'min'}`; break
    case 'rating':   label = v > 0 ? `${v}/5 ★` : '0/5 ★'; break
    case 'numeric':  label = `${v > 0 ? v : '—'}${u ? ' ' + u : ''}`; break
    default:         return null
  }
  if (!label) return null
  return (
    <span className="font-sans font-bold text-[10px] px-2 py-0.5 rounded-full leading-none"
      style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
      {label}
    </span>
  )
}

// ─── Today row (unified habit + task) ────────────────────────────────────────
type TodayItem =
  | { kind: 'habit'; habit: Habit; entry: HabitEntry | undefined; sortKey: string }
  | { kind: 'task'; task: Task; sortKey: string }

function TodayRow({ item, onTap }: { item: TodayItem; onTap: (item: TodayItem) => void }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const isHabit = item.kind === 'habit'
  const id    = isHabit ? item.habit.id    : item.task.id
  const color = isHabit ? item.habit.color : item.task.color
  const icon  = isHabit ? item.habit.icon  : item.task.icon
  const title = isHabit ? item.habit.title : item.task.title
  const done  = isHabit
    ? isEntryComplete(item.entry, item.habit)
    : item.task.status === 'done'

  const handleView   = () => { setMenuOpen(false); navigate(isHabit ? `/habits/${id}` : `/tasks/${id}`) }
  const handleEdit   = () => { setMenuOpen(false); navigate(`/edit/${isHabit ? 'habit' : 'task'}/${id}`) }
  const handleDelete = async () => {
    setMenuOpen(false)
    if (!window.confirm(`Delete "${title}"?`)) return
    if (isHabit) await habitsRepo.delete(id)
    else await tasksRepo.delete(id)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="glass-panel flex items-center gap-3 px-3.5 py-3.5 rounded-[24px] cursor-pointer active:scale-[0.99] transition-transform select-none"
      style={{
        background: done ? 'var(--color-done-bg)' : 'var(--bg-surface)',
        border: done ? '1px solid #22c55e28' : '1px solid var(--border-subtle)',
        position: 'relative',
        zIndex: menuOpen ? 10 : undefined,
      }}
      onClick={() => onTap(item)}
      onKeyDown={e => e.key === 'Enter' && onTap(item)}
    >
      {/* Icon with done overlay */}
      <div
        className="relative w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 text-[24px]"
        style={{ background: `${color}22` }}
      >
        {icon}
        {done && (
          <div
            className="absolute inset-0 rounded-[18px] flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.78)' }}
          >
            <Check size={20} color="#fff" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Title + chips */}
      <div className="flex-1 min-w-0">
        <p
          className="font-sans font-bold text-[15px] leading-tight truncate"
          style={{
            color: done ? 'var(--text-tertiary)' : 'var(--text-primary)',
            textDecoration: done ? 'line-through' : 'none',
            textDecorationColor: 'var(--color-done)',
          }}
        >
          {title}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {isHabit
            ? <TypeChip label="Habit" bg="rgba(99,102,241,0.12)" color="var(--color-brand-500)" />
            : <TypeChip label="Task"  bg="rgba(249,115,22,0.12)"  color="var(--color-streak)" />
          }
          {isHabit && item.habit.measurementType !== 'checkbox' && (
            <MeasurementChip habit={item.habit} entry={item.entry} />
          )}
          {!isHabit && item.task.measurementType !== 'checkbox' && (
            <TaskMeasurementChip task={item.task} />
          )}
          {isHabit && item.habit.reminderTime && (
            <TypeChip label={item.habit.reminderTime} bg="var(--bg-surface-2)" color="var(--text-tertiary)" />
          )}
          {!isHabit && item.task.dueTime && (
            <TypeChip label={item.task.dueTime} bg="var(--bg-surface-2)" color="var(--text-tertiary)" />
          )}
          {!isHabit && item.task.priority === 'high' && !done && (
            <TypeChip label="High" bg="rgba(239,68,68,0.1)" color="var(--color-overdue)" />
          )}
        </div>
      </div>

      {/* Completion checkbox */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onTap(item) }}
        className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90"
        style={{
          border: `2px solid ${done ? 'var(--color-done)' : 'var(--border-default)'}`,
          background: done ? 'var(--color-done)' : 'transparent',
          boxShadow: done ? '0 0 0 3px rgba(34,197,94,0.18)' : 'none',
        }}
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
      >
        {done && <Check size={15} color="#fff" strokeWidth={3} />}
      </button>

      {/* 3-dot action menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: menuOpen ? 'var(--bg-surface-2)' : 'transparent' }}
          aria-label="More actions"
        >
          <MoreVertical size={17} color="var(--text-tertiary)" />
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1 z-50 rounded-2xl overflow-hidden min-w-[152px]"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.40)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleView}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors font-sans text-[13px] font-semibold hover:bg-[var(--bg-surface-2)]"
              style={{ color: 'var(--text-primary)' }}
            >
              <Eye size={14} /> View
            </button>
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors font-sans text-[13px] font-semibold hover:bg-[var(--bg-surface-2)]"
              style={{ color: 'var(--text-primary)' }}
            >
              <Pencil size={14} /> Edit
            </button>
            <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors font-sans text-[13px] font-semibold hover:bg-[var(--bg-surface-2)]"
              style={{ color: 'var(--color-overdue)' }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const openCreateComposer = useAppStore(s => s.openCreateComposer)
  const [search, setSearch] = useState('')
  const [overdueOpen, setOverdueOpen] = useState(true)
  const [world, setWorld] = useState<World>(() =>
    (localStorage.getItem('dashboard-world') as World) ?? 'personal'
  )
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [popupItem, setPopupItem] = useState<TodayItem | null>(null)

  const switchWorld = (w: World) => {
    setWorld(w)
    localStorage.setItem('dashboard-world', w)
  }

  const {
    todayStr,
    todaysHabits, pendingHabits, doneHabits, entryMap,
    overdueTasks, pendingTasks, doneTasks, upcomingTasks,
    doneToday, totalToday, isLoading,
  } = useDashboard(world, selectedDate)

  const bestStreak = useLiveQuery(async () => {
    const habits = await habitsRepo.getAll(false)
    if (habits.length === 0) return 0
    const streaks = await Promise.all(habits.map(async h => {
      const entries = await entriesRepo.getForHabit(h.id)
      return computeStreak(entries)
    }))
    return Math.max(0, ...streaks)
  }, []) ?? 0

  const pct = totalToday ? Math.round((doneToday / totalToday) * 100) : 0
  const allDone = totalToday > 0 && doneToday === totalToday
  const hour = new Date().getHours()
  const greeting = hour < 12 ? copy.greetingMorning : hour < 18 ? copy.greetingAfternoon : copy.greetingEvening
  const dateStr = format(new Date(), 'EEEE, MMMM d')
  const isViewingToday = selectedDate === todayStr

  // Filtered pending lists (search applies to both habits and tasks)
  const filteredPendingHabits = search
    ? pendingHabits.filter(h => h.title.toLowerCase().includes(search.toLowerCase()))
    : pendingHabits
  const filteredPendingTasks = search
    ? pendingTasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : pendingTasks

  // Unified today list: pending (sorted by time) then done
  const allTodayItems: TodayItem[] = [
    ...filteredPendingHabits.map(h => ({
      kind: 'habit' as const, habit: h, entry: entryMap.get(h.id),
      sortKey: `0_${h.reminderTime ?? '99:99'}`,
    })),
    ...filteredPendingTasks.map(t => ({
      kind: 'task' as const, task: t,
      sortKey: `0_${t.dueTime ?? '99:99'}`,
    })),
    ...doneHabits.map(h => ({
      kind: 'habit' as const, habit: h, entry: entryMap.get(h.id),
      sortKey: `1_${h.reminderTime ?? '99:99'}`,
    })),
    ...doneTasks.map(t => ({
      kind: 'task' as const, task: t,
      sortKey: `1_${t.dueTime ?? '99:99'}`,
    })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey))

  // Tap handler for the completion circle
  const handleItemTap = async (item: TodayItem) => {
    if (item.kind === 'habit') {
      const done = isEntryComplete(item.entry, item.habit)
      if (done) {
        // Un-complete: reset entry to pending
        await entriesRepo.upsert(item.habit.id, selectedDate, { status: 'pending', value: 0 })
      } else if (item.habit.measurementType === 'checkbox') {
        await entriesRepo.upsert(item.habit.id, selectedDate, { status: 'done' })
      } else {
        setPopupItem(item)
      }
    } else {
      const done = item.task.status === 'done'
      if (done) {
        await tasksRepo.update(item.task.id, { status: 'pending', completedAt: undefined })
      } else if (item.task.measurementType === 'checkbox') {
        await tasksRepo.complete(item.task.id)
      } else {
        setPopupItem(item)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent animate-spin" />
      </div>
    )
  }

  // Section label changes based on selected date
  const sectionLabel = isViewingToday
    ? 'Today'
    : format(parseISO(selectedDate + 'T12:00:00'), 'MMM d')

  return (
    <div className="min-h-screen bg-app">

      {/* ══════════════════════════════════════════════════════════════
          STICKY HEADER
      ══════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[rgba(var(--bg-app-rgb),0.72)] backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 pt-3 lg:px-6">

          {/* Mobile logo mark */}
          <div
            className="lg:hidden w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-[var(--shadow-glow)]"
            style={{ background: 'var(--color-brand-500)' }}
          >
            <span className="font-sans font-extrabold text-[13px] text-[var(--text-on-brand)]">S</span>
          </div>

          {/* Date + greeting */}
          <div className="flex-1 min-w-0">
            <p className="section-kicker leading-none">{dateStr}</p>
            <p className="font-sans font-extrabold text-[16px] lg:text-[18px] text-[var(--text-primary)] tracking-tight leading-snug truncate mt-0.5">
              {greeting}
            </p>
          </div>

          {/* Search — desktop only */}
          <div
            className="hidden lg:flex items-center gap-2 px-3 h-10 rounded-2xl w-[220px] shrink-0 glass-panel"
            style={{ background: 'var(--bg-surface)' }}
          >
            <Search size={13} color="var(--text-tertiary)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent font-sans text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </div>

          {/* World switcher — desktop only */}
          <div className="hidden lg:flex shrink-0">
            <WorldSwitcher world={world} onChange={switchWorld} />
          </div>

          {/* Bell */}
          <button
            className="glass-panel shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--bg-surface)' }}
            aria-label="Notifications"
          >
            <Bell size={15} color="var(--text-secondary)" />
          </button>

          {/* New button — desktop only */}
          <button
            onClick={() => openCreateComposer('habit', world)}
            className="hidden lg:flex items-center gap-1.5 px-4 h-10 rounded-2xl text-[var(--text-on-brand)] font-sans font-bold text-[13px] shrink-0 transition-transform active:scale-95"
            style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            New
          </button>
        </div>

        {/* Calendar strip — always visible in header */}
        <div className="px-4 pt-3 lg:hidden">
          <div className="glass-panel flex items-center gap-2 rounded-2xl px-3 h-11">
            <Search size={14} color="var(--text-tertiary)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search habits and tasks..."
              className="flex-1 bg-transparent font-sans text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </div>
        </div>

        <div className="pb-3 pt-3">
          <CalendarStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
        </div>
      </header>

      {/* ── Mobile: world switcher + compact summary bar ───────────── */}
      <div className="lg:hidden px-4 pt-3 pb-2 flex flex-col gap-2">
        <WorldSwitcher world={world} onChange={switchWorld} />

        {/* Slim progress + stats strip */}
        <div
          className="glass-panel rounded-2xl px-4 py-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          {/* Top row: label + streak + pct */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans font-extrabold text-[13px]" style={{ color: 'var(--text-primary)' }}>
              {allDone && totalToday > 0 ? '🎉 All done!' : `${doneToday} of ${totalToday} done`}
            </span>
            <div className="flex items-center gap-2.5">
              {bestStreak > 0 && (
                <span className="font-sans font-bold text-[12px]" style={{ color: 'var(--color-streak)' }}>
                  🔥{bestStreak}d
                </span>
              )}
              <span
                className="font-sans font-extrabold text-[12px] px-2 py-0.5 rounded-full"
                style={{
                  background: allDone && totalToday > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.12)',
                  color: allDone && totalToday > 0 ? 'var(--color-done)' : 'var(--color-brand-500)',
                }}
              >
                {pct}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${pct}%`,
                background: allDone && totalToday > 0 ? '#22c55e' : 'var(--color-brand-500)',
              }}
            />
          </div>

          {/* Bottom row: habits · tasks · overdue */}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3px]" style={{ color: 'var(--text-tertiary)' }}>
              Habits {doneHabits.length}/{todaysHabits.length}
            </span>
            <span className="w-px h-3 shrink-0" style={{ background: 'var(--border-subtle)' }} />
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3px]" style={{ color: 'var(--text-tertiary)' }}>
              Tasks {doneTasks.length}/{doneTasks.length + pendingTasks.length}
            </span>
            {overdueTasks.length > 0 && (
              <>
                <span className="w-px h-3 shrink-0" style={{ background: 'var(--border-subtle)' }} />
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3px]" style={{ color: 'var(--color-overdue)' }}>
                  {overdueTasks.length} overdue
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop: hero panel ─────────────────────────────────────── */}
      <div className="hidden lg:block px-6">
        <div className="hero-panel rounded-[28px] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="section-kicker mb-2">{world === 'personal' ? 'Personal flow' : 'Professional focus'}</div>
              <p className="m-0 font-sans text-[20px] font-extrabold tracking-tight text-[var(--text-primary)]">
                {allDone && totalToday > 0 ? 'Everything is moving.' : `${pct}% of today's plan is done.`}
              </p>
              <p className="m-0 mt-1 font-body text-[13px] text-[var(--text-secondary)]">
                {overdueTasks.length > 0
                  ? `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'} still need attention.`
                  : 'Keep the streak warm with one more completion.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          STAT CARDS — desktop only
      ══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:grid px-6 pt-5 pb-4 grid-cols-4 gap-3">
        <StatCard
          label={isViewingToday ? 'Today' : sectionLabel}
          value={
            <>{doneToday}
              <span className="text-[17px] font-bold" style={{ opacity: 0.45 }}> /{totalToday}</span>
            </>
          }
          sub={allDone && totalToday > 0 ? '🎉 All done!' : `${pct}% complete`}
          gradient={allDone && totalToday > 0 ? '#1db954' : 'var(--color-brand-500)'}
          progress={pct}
        />
        <StatCard
          label="Best Streak"
          value={
            <span style={{ color: 'var(--color-streak)' }}>
              {bestStreak}
              <span className="text-[16px] font-bold" style={{ opacity: 0.55 }}> d</span>
            </span>
          }
          sub="days in a row"
        />
        <StatCard
          label="Habits"
          value={
            <>{doneHabits.length}
              <span className="text-[17px] font-bold" style={{ opacity: 0.45 }}> /{todaysHabits.length}</span>
            </>
          }
          sub="done"
        />
        <StatCard
          label="Tasks"
          value={
            <>{doneTasks.length}
              <span className="text-[17px] font-bold" style={{ opacity: 0.45 }}> /{doneTasks.length + pendingTasks.length}</span>
            </>
          }
          sub="completed"
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BODY — main scroll + right panel
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-start">

        {/* ── Main scroll column ──────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-4 lg:px-6 pb-28 lg:pb-16 space-y-5">

          {/* Overdue alert — only show when viewing today */}
          {isViewingToday && overdueTasks.length > 0 && (
            <div
              className="glass-panel rounded-[26px] overflow-hidden"
              style={{ border: '1px solid #ef444422', background: 'var(--color-overdue-bg)' }}
            >
              <button
                onClick={() => setOverdueOpen(o => !o)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
              >
                <AlertCircle size={14} color="var(--color-overdue)" className="shrink-0" />
                <span className="font-sans font-extrabold text-[13px] flex-1" style={{ color: 'var(--color-overdue)' }}>
                  {copy.overdueSection(overdueTasks.length)}
                </span>
                <ChevronDown
                  size={14} color="var(--color-overdue)"
                  style={{ transform: overdueOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', flexShrink: 0 }}
                />
              </button>
              {overdueOpen && (
                <div className="px-3 pb-3 flex flex-col gap-2">
                  {overdueTasks.map(t => (
                    <div
                      key={t.id}
                      role="button"
                      onClick={() => navigate(`/tasks/${t.id}`)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                      style={{ background: 'var(--bg-surface)' }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[18px]"
                        style={{ background: `${t.color}20` }}>{t.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-bold text-[13px] truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</p>
                        <p className="font-body text-[11px]" style={{ color: 'var(--color-overdue)' }}>
                          Due {format(parseISO(t.dueDate + 'T12:00:00'), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Today — unified habits + tasks */}
          {allTodayItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-sans font-extrabold text-[11px] uppercase tracking-[0.5px] text-[var(--text-secondary)]">
                  {sectionLabel}
                </span>
                <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full font-sans font-bold text-[10px] text-[var(--text-tertiary)]"
                  style={{ background: 'var(--bg-surface-2)' }}>
                  {filteredPendingHabits.length + filteredPendingTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {allTodayItems.map(item =>
                  item.kind === 'habit'
                    ? <TodayRow key={item.habit.id} item={item} onTap={handleItemTap} />
                    : <TodayRow key={item.task.id} item={item} onTap={handleItemTap} />
                )}
              </div>
            </div>
          )}

          {/* Upcoming — mobile only, only show when viewing today */}
          {isViewingToday && upcomingTasks.length > 0 && (
            <div className="lg:hidden">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-sans font-extrabold text-[11px] uppercase tracking-[0.5px] text-[var(--text-secondary)]">Upcoming</span>
                <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full font-sans font-bold text-[10px] text-[var(--text-tertiary)]"
                  style={{ background: 'var(--bg-surface-2)' }}>
                  {upcomingTasks.length}
                </span>
              </div>
              <div className="glass-panel rounded-[26px] overflow-hidden bg-surface border border-[var(--border-subtle)]">
                {upcomingTasks.map((t, i) => (
                  <div
                    key={t.id}
                    role="button"
                    onClick={() => navigate(`/tasks/${t.id}`)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-surface-2)] transition-colors',
                      i < upcomingTasks.length - 1 && 'border-b border-[var(--border-subtle)]',
                    )}
                  >
                    <span className="font-sans font-medium text-[11px] text-[var(--text-tertiary)] w-[76px] shrink-0">
                      {format(parseISO(t.dueDate + 'T12:00:00'), 'EEE, MMM d')}
                    </span>
                    <span className="flex-1 font-body text-[13px] text-[var(--text-primary)] truncate">{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {pendingHabits.length === 0 && pendingTasks.length === 0 &&
           overdueTasks.length === 0 && doneHabits.length === 0 && doneTasks.length === 0 && (
            <EmptyState
              hero
              emoji="🌱"
              headline={isViewingToday ? 'Your journey starts here' : 'Nothing on this day'}
              subheadline={
                isViewingToday
                  ? 'Build one habit at a time — small wins compound into big results.'
                  : 'No habits or tasks were scheduled for this date.'
              }
              ideas={isViewingToday ? ['Morning stretch', 'Drink water', 'Read 20 min', 'Walk outside'] : undefined}
              action={isViewingToday ? { label: '+ Add first habit', onClick: () => openCreateComposer('habit', world) } : undefined}
            />
          )}
        </div>

        {/* ── Right panel — desktop only ────────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col gap-6 w-[240px] shrink-0 border-l border-[var(--border-subtle)] px-5 py-5"
          style={{ position: 'sticky', top: '64px', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}
        >
          <WeeklyChart />
          <TopStreaks />

          {/* Upcoming */}
          {isViewingToday && upcomingTasks.length > 0 && (
            <div>
              <p className="font-sans font-extrabold text-[11px] uppercase tracking-[0.4px] text-[var(--text-tertiary)] mb-3">
                Upcoming
              </p>
              <div className="flex flex-col gap-3">
                {upcomingTasks.slice(0, 5).map(t => (
                  <div
                    key={t.id}
                    role="button"
                    onClick={() => navigate(`/tasks/${t.id}`)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="font-sans text-[10px] font-bold text-[var(--text-tertiary)]">
                      {format(parseISO(t.dueDate + 'T12:00:00'), 'EEE, MMM d')}
                    </div>
                    <div className="font-sans font-semibold text-[13px] text-[var(--text-primary)] truncate mt-0.5">
                      {t.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed (desktop) */}
          {(doneHabits.length + doneTasks.length) > 0 && (
            <div>
              <p className="font-sans font-extrabold text-[11px] uppercase tracking-[0.4px] text-[var(--text-tertiary)] mb-3">
                Completed ({doneHabits.length + doneTasks.length})
              </p>
              <div className="flex flex-col gap-2.5">
                {doneHabits.slice(0, 4).map(h => (
                  <div key={h.id} className="flex items-center gap-2">
                    <span className="text-[14px]">{h.icon}</span>
                    <span
                      className="flex-1 font-sans font-semibold text-[12px] truncate"
                      style={{ color: 'var(--text-secondary)', textDecoration: 'line-through' }}
                    >{h.title}</span>
                    <span className="font-sans text-[11px] font-bold" style={{ color: 'var(--color-done)' }}>✓</span>
                  </div>
                ))}
                {doneTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <span className="text-[14px]">{t.icon}</span>
                    <span
                      className="flex-1 font-sans font-semibold text-[12px] truncate"
                      style={{ color: 'var(--text-secondary)', textDecoration: 'line-through' }}
                    >{t.title}</span>
                    <span className="font-sans text-[11px] font-bold" style={{ color: 'var(--color-done)' }}>✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── FAB — mobile only ───────────────────────────────────────────── */}
      <button
        onClick={() => openCreateComposer('habit', world)}
        className="lg:hidden fixed bottom-24 right-4 w-[58px] h-[58px] rounded-[22px] text-[var(--text-on-brand)] flex items-center justify-center z-20 active:scale-95 transition-all duration-150"
        style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-fab)' }}
        aria-label="Add habit or task"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* ── Measurement popup ───────────────────────────────────────────── */}
      {popupItem && (
        <MeasurementPopup
          habit={popupItem.kind === 'habit' ? popupItem.habit : undefined}
          entry={popupItem.kind === 'habit' ? popupItem.entry : undefined}
          task={popupItem.kind === 'task' ? popupItem.task : undefined}
          date={selectedDate}
          onClose={() => setPopupItem(null)}
        />
      )}
    </div>
  )
}
