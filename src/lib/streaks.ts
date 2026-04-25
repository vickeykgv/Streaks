import { format, subDays, parseISO, differenceInDays } from 'date-fns'
import type { HabitEntry } from '@/types'

/** Current streak: consecutive days (ending today or yesterday) with done or partial. */
export function computeStreak(entries: HabitEntry[]): number {
  const doneSet = new Set(
    entries.filter(e => e.status === 'done' || e.status === 'partial').map(e => e.date)
  )

  let streak = 0
  let cursor = new Date()

  // If today isn't done yet, start from yesterday
  if (!doneSet.has(format(cursor, 'yyyy-MM-dd'))) {
    cursor = subDays(cursor, 1)
  }

  while (doneSet.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++
    cursor = subDays(cursor, 1)
  }

  return streak
}

/** Longest ever streak. */
export function computeLongestStreak(entries: HabitEntry[]): number {
  const doneDates = entries
    .filter(e => e.status === 'done' || e.status === 'partial')
    .map(e => e.date)
    .sort()

  if (doneDates.length === 0) return 0

  let longest = 1, current = 1
  for (let i = 1; i < doneDates.length; i++) {
    const diff = differenceInDays(parseISO(doneDates[i] + 'T12:00:00'), parseISO(doneDates[i - 1] + 'T12:00:00'))
    current = diff === 1 ? current + 1 : 1
    longest = Math.max(longest, current)
  }
  return longest
}

/** Completion rate over the last N days (0–1). Uses entry dates that exist (days without entries = not done). */
export function computeCompletionRate(entries: HabitEntry[], days = 30): number {
  const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd')
  const recent = entries.filter(e => e.date >= cutoff)
  if (recent.length === 0) return 0
  const done = recent.filter(e => e.status === 'done' || e.status === 'partial').length
  return done / recent.length
}

/** Human-readable recurrence summary (kept here for backward compat). */
export function formatRecurrence(r: { type: string; daysOfWeek?: number[]; interval?: number }): string {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  if (r.type === 'daily') return 'Every day'
  if (r.type === 'weekly') return (r.daysOfWeek ?? []).map(d => DAYS[d]).join(', ') || 'Weekly'
  return `Every ${r.interval ?? 1} day${(r.interval ?? 1) > 1 ? 's' : ''}`
}
