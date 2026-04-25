import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import { today, addDaysFromToday } from '@/lib/dates'
import { isHabitDueOn } from '@/lib/recurrence'
import { isEntryComplete } from '@/lib/measurement'
import type { World } from '@/types'

export function useDashboard(worldFilter: World = 'personal', selectedDate?: string) {
  const todayStr = today()
  const dateStr = selectedDate ?? todayStr

  const habits = useLiveQuery(
    () => db.habits.filter(h => !h.archived && !h.deletedAt).toArray(), []
  )

  const entries = useLiveQuery(
    () => db.habitEntries.where('date').equals(dateStr).toArray(), [dateStr]
  )

  const tasks = useLiveQuery(
    () => db.tasks.filter(t => !t.deletedAt).toArray(), []
  )

  const tags = useLiveQuery(() => db.tags.toArray(), [])

  const entryMap = useMemo(
    () => new Map((entries ?? []).map(e => [e.habitId, e])),
    [entries]
  )

  // Habits due on the selected date in the active world
  const todaysHabits = useMemo(
    () => (habits ?? []).filter(h =>
      isHabitDueOn(h, dateStr) && (h.world ?? 'personal') === worldFilter
    ),
    [habits, dateStr, worldFilter]
  )

  const pendingHabits = useMemo(
    () => todaysHabits.filter(h => !isEntryComplete(entryMap.get(h.id), h)),
    [todaysHabits, entryMap]
  )

  const doneHabits = useMemo(
    () => todaysHabits.filter(h => isEntryComplete(entryMap.get(h.id), h)),
    [todaysHabits, entryMap]
  )

  // Tasks due on the selected date in the active world
  const todaysAllTasks = useMemo(
    () => (tasks ?? []).filter(t =>
      t.dueDate === dateStr && (t.world ?? 'personal') === worldFilter
    ),
    [tasks, dateStr, worldFilter]
  )

  const pendingTasks = useMemo(
    () => todaysAllTasks.filter(t => t.status === 'pending'),
    [todaysAllTasks]
  )

  const doneTasks = useMemo(
    () => todaysAllTasks.filter(t => t.status === 'done'),
    [todaysAllTasks]
  )

  // Overdue and upcoming are always relative to today, not selectedDate
  const overdueTasks = useMemo(
    () => (tasks ?? []).filter(t =>
      t.status === 'pending' && t.dueDate < todayStr && (t.world ?? 'personal') === worldFilter
    ),
    [tasks, todayStr, worldFilter]
  )

  const upcomingTasks = useMemo(() => {
    const sevenDaysOut = addDaysFromToday(7)
    return (tasks ?? []).filter(t =>
      t.status === 'pending' &&
      t.dueDate > todayStr &&
      t.dueDate <= sevenDaysOut &&
      (t.world ?? 'personal') === worldFilter
    ).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [tasks, todayStr, worldFilter])

  const totalToday = todaysHabits.length + todaysAllTasks.length
  const doneToday = doneHabits.length + doneTasks.length

  const isLoading = habits === undefined || tasks === undefined || entries === undefined

  return {
    dateStr,
    todayStr,
    todaysHabits,
    pendingHabits,
    doneHabits,
    todayEntries: entries ?? [],
    entryMap,
    overdueTasks,
    pendingTasks,
    doneTasks,
    upcomingTasks,
    tags: tags ?? [],
    doneToday,
    totalToday,
    isLoading,
  }
}
