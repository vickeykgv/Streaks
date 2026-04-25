import { format, parseISO, isBefore, isAfter, startOfDay, getDay, differenceInDays } from 'date-fns'
import type { Habit, Task } from '@/types'

export function isHabitDueOn(habit: Habit, date: string): boolean {
  if (habit.archived || habit.deletedAt) return false

  const d = parseISO(date + 'T12:00:00')
  const start = parseISO(habit.startDate + 'T12:00:00')

  if (isBefore(startOfDay(d), startOfDay(start))) return false
  if (habit.endDate && isAfter(startOfDay(d), startOfDay(parseISO(habit.endDate + 'T12:00:00')))) return false

  const { recurrence } = habit
  if (recurrence.type === 'daily') return true
  if (recurrence.type === 'weekly') {
    return (recurrence.daysOfWeek ?? []).includes(getDay(d))
  }
  if (recurrence.type === 'custom') {
    const diff = differenceInDays(d, start)
    return diff >= 0 && diff % (recurrence.interval ?? 1) === 0
  }
  return false
}

export function recurrenceLabel(habit: Habit): string {
  const r = habit.recurrence
  if (r.type === 'daily') return 'Every day'
  if (r.type === 'weekly') {
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (r.daysOfWeek ?? []).map(d => DAYS[d]).join(', ')
  }
  return `Every ${r.interval ?? 1} day${(r.interval ?? 1) > 1 ? 's' : ''}`
}

export function getHabitsDueOn(date: string | Date, habits: Habit[]): Habit[] {
  const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd')
  return habits.filter(h => isHabitDueOn(h, dateStr))
}

export function getOverdueTasks(today: string, tasks: Task[]): Task[] {
  return tasks.filter(t => !t.deletedAt && t.status === 'pending' && isOverdue(t.dueDate, today))
}

export function getTasksDueOn(date: string, tasks: Task[]): Task[] {
  return tasks.filter(t => !t.deletedAt && t.dueDate === date)
}

export function getUpcomingTasks(today: string, days: number, tasks: Task[]): Task[] {
  const end = addDaysStr(today, days)
  return tasks.filter(t => !t.deletedAt && t.status === 'pending' && t.dueDate > today && t.dueDate <= end)
}

function isOverdue(date: string, today: string): boolean {
  return date < today
}

function addDaysStr(dateStr: string, n: number): string {
  const d = parseISO(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return format(d, 'yyyy-MM-dd')
}
