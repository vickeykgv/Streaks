import { db } from '@/db/database'
import type { HabitEntry } from '@/types'

const now = () => Date.now()

export const entriesRepo = {
  async getForHabit(habitId: string) {
    return db.habitEntries.where('habitId').equals(habitId).toArray()
  },

  async getForDate(date: string) {
    return db.habitEntries.where('date').equals(date).toArray()
  },

  async getForDateRange(startDate: string) {
    return db.habitEntries.where('date').aboveOrEqual(startDate).toArray()
  },

  async getByHabitAndDate(habitId: string, date: string) {
    return db.habitEntries.get(`${habitId}_${date}`)
  },

  async upsert(habitId: string, date: string, patch: Partial<HabitEntry>) {
    const id = `${habitId}_${date}`
    const existing = await db.habitEntries.get(id)
    if (existing) {
      await db.habitEntries.update(id, { ...patch, updatedAt: now(), dirty: true })
    } else {
      await db.habitEntries.add({
        id,
        habitId,
        date,
        status: 'pending',
        updatedAt: now(),
        dirty: true,
        ...patch,
      } as HabitEntry)
    }
    return db.habitEntries.get(id)
  },
}
