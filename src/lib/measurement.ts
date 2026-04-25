import type { Habit, HabitEntry } from '@/types'

/** Returns true if this entry counts as complete for the given habit. */
export function isEntryComplete(entry: HabitEntry | undefined, habit: Habit): boolean {
  if (!entry) return false
  if (entry.status === 'done') return true
  if (habit.measurementType === 'checkbox') return false

  if (habit.measurementType === 'count' || habit.measurementType === 'duration' || habit.measurementType === 'numeric') {
    if (entry.value === undefined) return false
    if (habit.target) return entry.value >= habit.target
    return entry.value > 0
  }

  if (habit.measurementType === 'rating') {
    return entry.value !== undefined && entry.value > 0
  }

  return false
}

/** Derives the entry status from the current value. */
export function deriveStatus(entry: Partial<HabitEntry>, habit: Habit): HabitEntry['status'] {
  const check: HabitEntry = {
    id: '',
    habitId: habit.id,
    date: '',
    status: 'pending',
    updatedAt: 0,
    dirty: true,
    ...entry,
  }
  if (isEntryComplete(check, habit)) return 'done'
  if ((entry.value ?? 0) > 0) return 'partial'
  return 'pending'
}

/** Short progress label for display. */
export function progressLabel(entry: HabitEntry | undefined, habit: Habit): string {
  if (!entry?.value) return ''
  const v = entry.value
  const unit = habit.unit ? ` ${habit.unit}` : ''
  if (habit.measurementType === 'count' || habit.measurementType === 'duration') {
    return habit.target ? `${v} / ${habit.target}${unit}` : `${v}${unit}`
  }
  if (habit.measurementType === 'rating') return '★'.repeat(Math.round(v))
  return `${v}${unit}`
}
