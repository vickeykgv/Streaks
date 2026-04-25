import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Pencil, Flame, Calendar, Clock, Archive } from 'lucide-react'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { habitsRepo } from '@/db/repos/habits'
import { entriesRepo } from '@/db/repos/entries'
import { tagsRepo } from '@/db/repos/tags'
import { computeStreak, computeLongestStreak, computeCompletionRate, formatRecurrence } from '@/lib/streaks'
import { useState } from 'react'

export default function HabitDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const habit = useLiveQuery(() => habitsRepo.getById(id!), [id])
  const entries = useLiveQuery(() => entriesRepo.getForHabit(id!), [id]) ?? []
  const allTags = useLiveQuery(() => tagsRepo.getAll(), []) ?? []

  if (habit === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent animate-spin" />
      </div>
    )
  }
  if (habit === null || habit.deletedAt) {
    navigate('/habits')
    return null
  }

  const habitTags = allTags.filter(t => habit.tags.includes(t.id))
  const streak = computeStreak(entries)
  const longest = computeLongestStreak(entries)
  const rate7 = computeCompletionRate(entries, 7)
  const rate30 = computeCompletionRate(entries, 30)

  const today = new Date()
  const heatmapDays = eachDayOfInterval({ start: subDays(today, 90), end: today })
  const entryMap = new Map(entries.map(e => [e.date, e]))

  const recentEntries = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)

  const handleArchive = async () => {
    await habitsRepo.archive(habit.id)
    navigate('/habits')
  }

  return (
    <div className="min-h-screen bg-app pb-24">
      <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="px-5 pt-4 pb-5" style={{ background: 'var(--bg-surface-2)' }}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-surface border border-[var(--border-subtle)] flex items-center justify-center"
          >
            <ChevronLeft size={18} color="var(--text-secondary)" strokeWidth={2.4} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/edit/habit/${habit.id}`)}
              className="w-9 h-9 rounded-xl bg-surface border border-[var(--border-subtle)] flex items-center justify-center"
            >
              <Pencil size={15} color="var(--text-secondary)" />
            </button>
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="w-9 h-9 rounded-xl bg-surface border border-[var(--border-subtle)] flex items-center justify-center"
            >
              <Archive size={15} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        <div className="w-[62px] h-[62px] rounded-[18px] flex items-center justify-center mb-3 text-[30px]"
          style={{ background: `${habit.color}22` }}>
          {habit.icon}
        </div>

        <div className="font-sans text-[30px] font-extrabold text-[var(--text-primary)] tracking-tight">{habit.title}</div>
        {habit.description && (
          <div className="font-body text-[14px] text-[var(--text-secondary)] mt-1">{habit.description}</div>
        )}

        <div className="flex gap-1.5 mt-3 flex-wrap">
          {habitTags.map(tag => (
            <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-sans font-bold text-[11px]"
              style={{ background: `${tag.color}18`, color: tag.color }}>
              <span className="w-1 h-1 rounded-full bg-current" />{tag.name}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 bg-surface2 px-2 py-0.5 rounded-full font-sans font-bold text-[11px] text-[var(--text-secondary)]">
            <Calendar size={11} />{formatRecurrence(habit.recurrence)}
          </span>
          {habit.reminderTime && (
            <span className="inline-flex items-center gap-1 bg-surface2 px-2 py-0.5 rounded-full font-sans font-bold text-[11px] text-[var(--text-secondary)]">
              <Clock size={11} />{habit.reminderTime}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 grid grid-cols-2 gap-2.5">
        <StatCard label="Current streak" value={streak} unit="days" accent="var(--color-streak)"
          icon={<Flame size={16} fill="var(--color-streak)" stroke="none" />} />
        <StatCard label="Longest streak" value={longest} unit="days" accent="var(--text-primary)" />
        <StatCard label="Last 7 days" value={Math.round(rate7 * 100)} unit="%" accent={habit.color} bar={rate7} />
        <StatCard label="Last 30 days" value={Math.round(rate30 * 100)} unit="%" accent={habit.color} bar={rate30} />
      </div>

      {/* Heatmap */}
      <div className="px-4 mt-5">
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="font-sans font-extrabold text-[14px] uppercase tracking-[0.2px] text-[var(--text-primary)]">Last 90 days</span>
          <div className="flex items-center gap-1.5">
            {['var(--bg-surface-2)', `${habit.color}40`, `${habit.color}80`, habit.color].map((c, i) => (
              <span key={i} className="w-2.5 h-2.5 rounded-[3px] inline-block" style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl p-3.5"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 4 }}>
          {heatmapDays.map((d, i) => {
            const ds = format(d, 'yyyy-MM-dd')
            const entry = entryMap.get(ds)
            const bg = entry?.status === 'done' ? habit.color
              : entry?.status === 'partial' ? `${habit.color}70`
              : entry?.status === 'skipped' ? 'var(--color-skipped-bg)'
              : 'var(--bg-surface-2)'
            return <div key={i} className="rounded-[4px]" style={{ aspectRatio: '1', background: bg }} title={ds} />
          })}
        </div>
      </div>

      {/* Recent history */}
      {recentEntries.length > 0 && (
        <div className="px-4 mt-4">
          <div className="font-sans font-extrabold text-[14px] uppercase tracking-[0.2px] text-[var(--text-primary)] mb-2.5">Recent</div>
          <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
            {recentEntries.map((e, i) => (
              <div key={e.id} className="flex items-center px-3.5 py-3"
                style={{ borderBottom: i < recentEntries.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div className="font-sans font-bold text-[14px] text-[var(--text-primary)] flex-1">
                  {format(new Date(e.date + 'T12:00:00'), 'MMM d')}
                </div>
                {e.value != null && (
                  <div className="font-body text-[13px] text-[var(--text-secondary)] mr-2.5">{e.value}</div>
                )}
                <StatusPill status={e.status} color={habit.color} />
              </div>
            ))}
          </div>
        </div>
      )}

      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowArchiveConfirm(false)}>
          <div className="w-full bg-surface rounded-t-2xl p-5 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <p className="font-sans font-bold text-[16px] text-[var(--text-primary)]">Archive "{habit.title}"?</p>
            <p className="font-body text-[14px] text-[var(--text-secondary)]">
              It will be hidden from your lists but history is preserved.
            </p>
            <button onClick={handleArchive}
              className="w-full h-11 rounded-xl font-sans font-extrabold text-[14px] text-white"
              style={{ background: 'var(--color-overdue)' }}>
              Archive
            </button>
            <button onClick={() => setShowArchiveConfirm(false)}
              className="w-full h-11 rounded-xl font-sans font-bold text-[14px] bg-surface2 text-[var(--text-secondary)]">
              Cancel
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, accent, icon, bar }: {
  label: string; value: number; unit: string; accent: string; icon?: React.ReactNode; bar?: number
}) {
  return (
    <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl p-3.5">
      <div className="flex justify-between items-center font-sans text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.3px] mb-0.5">
        <span>{label}</span>{icon}
      </div>
      <div className="font-sans text-[28px] font-extrabold tracking-tight leading-[1.1]" style={{ color: accent }}>
        {value}<span className="text-[13px] font-semibold text-[var(--text-tertiary)] ml-0.5">{unit}</span>
      </div>
      {bar != null && (
        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
          <div className="h-full rounded-full" style={{ width: `${bar * 100}%`, background: accent }} />
        </div>
      )}
    </div>
  )
}

function StatusPill({ status, color }: { status: string; color: string }) {
  const styles: Record<string, { bg: string; fg: string; label: string }> = {
    done:    { bg: `${color}18`,                   fg: color,                    label: 'Done' },
    partial: { bg: 'var(--color-partial-bg)',       fg: 'var(--color-partial)',   label: 'Partial' },
    skipped: { bg: 'var(--color-skipped-bg)',       fg: 'var(--color-skipped)',   label: 'Skipped' },
    pending: { bg: 'var(--bg-surface-2)',           fg: 'var(--text-tertiary)',   label: 'Pending' },
  }
  const v = styles[status] ?? styles.pending
  return (
    <span className="px-2.5 py-0.5 rounded-full font-sans font-extrabold text-[11px]"
      style={{ background: v.bg, color: v.fg }}>{v.label}</span>
  )
}
