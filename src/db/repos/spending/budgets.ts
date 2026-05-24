import { db } from '@/db/database'
import type { SpendingBudget } from '@/types/spending'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const budgetsRepo = {
  async getAll() {
    return db.spendingBudgets.filter(b => !b.deletedAt).toArray()
  },

  async getById(id: string) {
    return db.spendingBudgets.get(id)
  },

  async create(data: Omit<SpendingBudget, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt'>) {
    const user = useSession.getState().user
    const budget: SpendingBudget = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.spendingBudgets.add(budget)
    scheduleSyncSoon()
    return budget
  },

  async update(id: string, patch: Partial<SpendingBudget>) {
    await db.spendingBudgets.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.spendingBudgets.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async restore(id: string) {
    await db.spendingBudgets.update(id, { deletedAt: undefined, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
