import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check } from 'lucide-react'
import { entriesRepo } from '@/db/repos/entries'
import { computeStreak } from '@/lib/streaks'
import { isEntryComplete } from '@/lib/measurement'
import { MeasurementControl } from '@/components/MeasurementControl'
import { StreakBadge } from '@/components/StreakBadge'
import type { Habit, HabitEntry } from '@/types'

interface HabitCardProps {
  habit: Habit
  entry: HabitEntry | undefined
  tagNames?: { id: string; name: string; color: string }[]
  navigable?: boolean
}

export function HabitCard({ habit, entry, tagNames = [], navigable = true }: HabitCardProps) {
  const navigate = useNavigate()
  const allEntries = useLiveQuery(() => entriesRepo.getForHabit(habit.id), [habit.id]) ?? []
  const streak = computeStreak(allEntries)
  const done = isEntryComplete(entry, habit)

  return (
    <div
      className="relative overflow-hidden rounded-2xl flex flex-col px-4 py-3.5 transition-[background,border-color] duration-[200ms]"
      style={{
        background: done ? 'var(--color-done-bg)' : 'var(--bg-surface)',
        border: done ? '1px solid #22c55e33' : '1px solid var(--border-subtle)',
        boxShadow: done ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
        paddingLeft: 20,
      }}
    >
      {/* Accent bar */}
      <span
        className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
        style={{ background: done ? 'var(--color-done)' : habit.color }}
      />

      {/* Top row: icon + title + streak + control */}
      <div className="flex items-center gap-3.5">
        {/* Icon */}
        <button
          onClick={() => navigable && navigate(`/habits/${habit.id}`)}
          className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0 text-[20px]"
          style={{ background: `${done ? 'var(--color-done)' : habit.color}1a`, color: done ? 'var(--color-done)' : habit.color }}
          aria-label={`Open ${habit.title}`}
        >
          {done && habit.measurementType === 'checkbox'
            ? <Check size={18} strokeWidth={3} style={{ color: 'var(--color-done)' }} />
            : habit.icon}
        </button>

        {/* Title + badges */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigable && navigate(`/habits/${habit.id}`)}
            className="text-left w-full"
          >
            <div
              className="font-sans font-bold text-[15px] tracking-tight leading-snug"
              style={{
                color: done ? 'var(--text-tertiary)' : 'var(--text-primary)',
                textDecoration: done && habit.measurementType === 'checkbox' ? 'line-through' : 'none',
                textDecorationColor: 'var(--color-done)',
              }}
            >
              {habit.title}
            </div>
          </button>

          {/* Tag chips + streak */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <StreakBadge streak={streak} />
            {tagNames.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-sans font-bold text-[11px]"
                style={{ background: `${tag.color}18`, color: tag.color }}
              >
                <span className="w-1 h-1 rounded-full bg-current" />
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        {/* Measurement control */}
        <MeasurementControl habit={habit} entry={entry} />
      </div>
    </div>
  )
}

