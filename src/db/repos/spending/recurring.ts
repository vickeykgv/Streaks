import { db } from '@/db/database'
import type { SpendingRecurring } from '@/types/spending'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const recurringRepo = {
  async getAll(activeOnly = false) {
    const q = db.spendingRecurring.filter(r => !r.deletedAt)
    return activeOnly ? q.filter(r => r.active).toArray() : q.toArray()
  },

  async getDue() {
    return db.spendingRecurring
      .filter(r => !r.deletedAt && r.active && r.nextRunAt <= Date.now())
      .toArray()
  },

  async getById(id: string) {
    return db.spendingRecurring.get(id)
  },

  async create(data: Omit<SpendingRecurring, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt'>) {
    const user = useSession.getState().user
    const rule: SpendingRecurring = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.spendingRecurring.add(rule)
    scheduleSyncSoon()
    return rule
  },

  async update(id: string, patch: Partial<SpendingRecurring>) {
    await db.spendingRecurring.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.spendingRecurring.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async restore(id: string) {
    await db.spendingRecurring.update(id, { deletedAt: undefined, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
