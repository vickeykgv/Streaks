import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import { today } from '@/lib/dates'
import { isHabitDueOn } from '@/lib/recurrence'
import { isEntryComplete } from '@/lib/measurement'
import { setAppBadge, clearAppBadge } from '@/lib/appBadge'

// Subscribes to live data and keeps the home-screen app badge in sync with
// the count of pending items (habits not yet completed today + tasks due today
// or overdue that are still pending). No-ops on unsupported browsers.
export function useAppBadge() {
  const todayStr = today()

  const pendingCount = useLiveQuery(async () => {
    const [habits, tasks, todaysEntries] = await Promise.all([
      db.habits.filter(h => !h.archived && !h.deletedAt).toArray(),
      db.tasks.filter(t => !t.deletedAt).toArray(),
      db.habitEntries.where('date').equals(todayStr).toArray(),
    ])

    const entryByHabit = new Map(todaysEntries.map(e => [e.habitId, e]))
    const pendingHabits = habits.filter(h =>
      isHabitDueOn(h, todayStr) && !isEntryComplete(entryByHabit.get(h.id), h)
    )
    const pendingTasks = tasks.filter(t =>
      t.status === 'pending' && t.dueDate <= todayStr
    )

    return pendingHabits.length + pendingTasks.length
  }, [todayStr]) ?? 0

  useEffect(() => {
    if (pendingCount > 0) setAppBadge(pendingCount)
    else clearAppBadge()
  }, [pendingCount])
}
