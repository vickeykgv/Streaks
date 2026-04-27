import { db } from '@/db/database'
import type { Habit } from '@/types'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const habitsRepo = {
  async getAll(includeArchived = false) {
    const q = db.habits.filter(h => !h.deletedAt)
    return includeArchived ? q.toArray() : q.filter(h => !h.archived).toArray()
  },

  async getById(id: string) {
    return db.habits.get(id)
  },

  async create(data: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt'>) {
    const user = useSession.getState().user
    const habit: Habit = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.habits.add(habit)
    scheduleSyncSoon()
    return habit
  },

  async update(id: string, patch: Partial<Habit>) {
    await db.habits.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async archive(id: string) {
    await db.habits.update(id, { archived: true, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.habits.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async removeTagFromAll(tagId: string) {
    const habits = await db.habits.filter(h => !h.deletedAt && h.tags.includes(tagId)).toArray()
    await Promise.all(
      habits.map(h =>
        db.habits.update(h.id, { tags: h.tags.filter(t => t !== tagId), updatedAt: now(), dirty: true })
      )
    )
    if (habits.length > 0) scheduleSyncSoon()
  },
}
