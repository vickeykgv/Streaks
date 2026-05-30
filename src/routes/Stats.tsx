import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, subDays } from 'date-fns'
import { Flame } from 'lucide-react'
import { db } from '@/db/database'
import { isHabitDueOn } from '@/lib/recurrence'
import { computeStreak } from '@/lib/streaks'
import { EmptyState } from '@/components/ui'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import type { HabitEntry } from '@/types'

const LV_COLOR = [
  'var(--bg-surface-2)',   // 0 = nothing due / no data
  '#6366f140',             // 1 = 1–25%
  '#6366f180',             // 2 = 26–50%
  '#6366f1b0',             // 3 = 51–75%
  '#6366f1',               // 4 = 76–100%
]

function intensityLevel(rate: number): number {
  if (rate < 0) return 0
  if (rate === 0) return 0
  if (rate <= 0.25) return 1
  if (rate <= 0.5) return 2
  if (rate <= 0.75) return 3
  return 4
}

export default function Stats() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const cutoff180 = format(subDays(new Date(), 179), 'yyyy-MM-dd')

  const habits = useLiveQuery(
    () => db.habits.filter(h => !h.archived && !h.deletedAt).toArray(), []
  )
  const allEntries = useLiveQuery(
    () => db.habitEntries.where('date').between(cutoff180, today, true, true).toArray(),
    [cutoff180, today]
  )

  const entrySet = useMemo(() => new Set(
    (allEntries ?? [])
      .filter((e: HabitEntry) => e.status === 'done' || e.status === 'partial')
      .map((e: HabitEntry) => `${e.habitId}_${e.date}`)
  ), [allEntries])

  // ─── Completion rate 30d ───────────────────────────────────────────────────
  const completionRate30 = useMemo(() => {
    if (!habits || !allEntries) return null
    let due = 0, done = 0
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      const dueHabits = habits.filter(h => isHabitDueOn(h, d))
      due += dueHabits.length
      done += dueHabits.filter(h => entrySet.has(`${h.id}_${d}`)).length
    }
    return due > 0 ? done / due : null
  }, [habits, allEntries, entrySet])

  // ─── Best streak ───────────────────────────────────────────────────────────
  const { bestStreak, bestHabitTitle } = useMemo(() => {
    if (!habits || !allEntries) return { bestStreak: 0, bestHabitTitle: '' }
    let bestStreak = 0, bestHabitTitle = ''
    for (const h of habits) {
      const habitEntries = allEntries.filter(e => e.habitId === h.id)
      const s = computeStreak(habitEntries)
      if (s > bestStreak) { bestStreak = s; bestHabitTitle = h.title }
    }
    return { bestStreak, bestHabitTitle }
  }, [habits, allEntries])

  // ─── Heatmap (last 90 days) ────────────────────────────────────────────────
  const heatmapDays = useMemo(() => {
    if (!habits || !allEntries) return []
    return Array.from({ length: 90 }, (_, i) => {
      const date = format(subDays(new Date(), 89 - i), 'yyyy-MM-dd')
      const dueHabits = habits.filter(h => isHabitDueOn(h, date))
      if (dueHabits.length === 0) return { date, level: 0, label: '' }
      const done = dueHabits.filter(h => entrySet.has(`${h.id}_${date}`)).length
      const rate = done / dueHabits.length
      return {
        date,
        level: intensityLevel(rate),
        label: `${format(new Date(date + 'T12:00:00'), 'MMM d')} · ${done}/${dueHabits.length} done`,
      }
    })
  }, [habits, allEntries, entrySet])

  // ─── Weekly bars (last 8 weeks) ────────────────────────────────────────────
  const weeklyBars = useMemo(() => {
    if (!habits || !allEntries) return []
    return Array.from({ length: 8 }, (_, i) => {
      // i=0 oldest, i=7 current week
      const startDaysAgo = 7 * (7 - i) + 6
      const endDaysAgo = 7 * (7 - i)
      let due = 0, done = 0
      for (let d = startDaysAgo; d >= endDaysAgo; d--) {
        if (d < 0) continue
        const date = format(subDays(new Date(), d), 'yyyy-MM-dd')
        const dueHabits = habits.filter(h => isHabitDueOn(h, date))
        due += dueHabits.length
        done += dueHabits.filter(h => entrySet.has(`${h.id}_${date}`)).length
      }
      return { rate: due > 0 ? done / due : 0, isCurrent: i === 7, label: i === 7 ? 'Now' : `W${i + 1}` }
    })
  }, [habits, allEntries, entrySet])

  // ─── Top 5 habits by 30d completion rate ──────────────────────────────────
  const topHabits = useMemo(() => {
    if (!habits || !allEntries) return []
    return habits
      .map(h => {
        let due = 0, done = 0
        for (let i = 0; i < 30; i++) {
          const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
          if (isHabitDueOn(h, d)) {
            due++
            if (entrySet.has(`${h.id}_${d}`)) done++
          }
        }
        return { habit: h, rate: due > 0 ? done / due : 0, due }
      })
      .filter(r => r.due > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5)
  }, [habits, allEntries, entrySet])

  const hasData = (habits?.length ?? 0) > 0

  // ─── Organize heatmap into week columns ───────────────────────────────────
  // 90 days → up to 13 columns of 7 rows
  const heatmapCols = useMemo(() => {
    const cols: typeof heatmapDays[] = []
    for (let c = 0; c < heatmapDays.length; c += 7) {
      cols.push(heatmapDays.slice(c, c + 7))
    }
    return cols
  }, [heatmapDays])

  const monthLabels = useMemo(() => {
    const labels: { text: string; col: number }[] = []
    let lastMonth = ''
    heatmapCols.forEach((col, ci) => {
      const m = format(new Date(col[0].date + 'T12:00:00'), 'MMM')
      if (m !== lastMonth) { labels.push({ text: m, col: ci }); lastMonth = m }
    })
    return labels
  }, [heatmapCols])

  if (!habits || !allEntries) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-app)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center pb-24" style={{ background: 'var(--bg-app)' }}>
        <EmptyState
          headline="Not enough data yet"
          subheadline="Complete a few habits to start seeing your stats here."
          action={{ label: 'Go to dashboard', to: '/' }}
          hero
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 bg-app">
      <DesktopPageHeader />
      <div className="mx-auto max-w-2xl px-4">

        {/* Header */}
        <div className="pt-4 pb-2">
          <div className="font-body text-[12px] font-medium text-[var(--text-tertiary)]">Last 90 days</div>
          <div className="font-sans text-[28px] font-extrabold tracking-tight text-[var(--text-primary)]">Stats</div>
        </div>

        {/* KPI row */}
        <div className="mt-3 grid gap-2.5" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
          <div
            className="rounded-[18px] p-4 text-white"
            style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-soft)' }}
          >
            <div className="font-sans text-[11px] font-bold opacity-80 uppercase tracking-[0.4px]">Completion · 30d</div>
            <div className="font-sans text-[36px] font-extrabold tracking-tight leading-[1.1] mt-0.5">
              {completionRate30 !== null ? `${Math.round(completionRate30 * 100)}%` : '—'}
            </div>
            <div className="font-body text-[12px] opacity-85 mt-0.5">
              {completionRate30 !== null
                ? completionRate30 >= 0.8 ? '🔥 Great work!' : completionRate30 >= 0.5 ? 'Keep it up!' : 'Room to grow'
                : 'No data yet'}
            </div>
          </div>
          <div
            className="rounded-[18px] p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="font-sans text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.4px]">Best streak</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <Flame size={18} fill="var(--color-streak)" stroke="none" />
              <span className="font-sans text-[32px] font-extrabold tracking-tight" style={{ color: 'var(--color-streak)' }}>
                {bestStreak}
              </span>
            </div>
            <div className="font-body text-[12px] text-[var(--text-secondary)] truncate">{bestHabitTitle || '—'}</div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="mt-5">
          <div className="font-sans font-extrabold text-[14px] uppercase tracking-[0.2px] text-[var(--text-primary)] mb-2.5">
            Activity · 90 days
          </div>
          <div
            className="rounded-2xl p-3.5"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex gap-[3px]">
              {heatmapCols.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[3px] flex-1">
                  {col.map((day, di) => (
                    <div
                      key={di}
                      className="rounded-[3px]"
                      style={{ aspectRatio: '1', background: LV_COLOR[day.level] }}
                      title={day.label}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex mt-2.5 relative h-4">
              {monthLabels.map(({ text, col }) => (
                <span
                  key={`${text}-${col}`}
                  className="absolute font-body text-[11px] text-[var(--text-tertiary)]"
                  style={{ left: `${(col / heatmapCols.length) * 100}%` }}
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly bars */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between mb-2.5">
            <span className="font-sans font-extrabold text-[14px] uppercase tracking-[0.2px] text-[var(--text-primary)]">
              Last 8 weeks
            </span>
            <span className="font-sans font-bold text-[11px] text-[var(--text-tertiary)]">% complete</span>
          </div>
          <div
            className="rounded-2xl px-4 pb-3.5 pt-[18px] flex gap-2.5 items-end"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', height: 140 }}
          >
            {weeklyBars.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-t-[6px] rounded-b-[3px] transition-all duration-500"
                    style={{
                      height: `${Math.max(w.rate * 100, w.rate > 0 ? 4 : 0)}%`,
                      background: w.isCurrent ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                    }}
                  />
                </div>
                <span
                  className="font-sans text-[10px] font-bold"
                  style={{ color: w.isCurrent ? 'var(--color-brand-500)' : 'var(--text-tertiary)' }}
                >
                  {w.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top habits */}
        {topHabits.length > 0 && (
          <div className="mt-5">
            <div className="font-sans font-extrabold text-[14px] uppercase tracking-[0.2px] text-[var(--text-primary)] mb-2.5">
              Top habits · 30d
            </div>
            <div
              className="overflow-hidden rounded-2xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              {topHabits.map(({ habit, rate }, i) => (
                <div
                  key={habit.id}
                  className="flex items-center gap-3 px-3.5 py-3"
                  style={{ borderBottom: i < topHabits.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                >
                  <div
                    className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0 text-[14px]"
                    style={{ background: `${habit.color}1a` }}
                  >
                    {habit.icon}
                  </div>
                  <span className="font-sans font-bold text-[13px] text-[var(--text-primary)] flex-1 truncate">
                    {habit.title}
                  </span>
                  <div className="w-[90px] h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${rate * 100}%`, background: habit.color }}
                    />
                  </div>
                  <span className="font-sans font-extrabold text-[12px] text-[var(--text-secondary)] w-[34px] text-right">
                    {Math.round(rate * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
