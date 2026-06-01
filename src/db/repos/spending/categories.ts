import { db } from '@/db/database'
import type { SpendingCategory } from '@/types/spending'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const categoriesRepo = {
  async getAll(includeArchived = false) {
    const q = db.spendingCategories.filter(c => !c.deletedAt)
    return includeArchived ? q.toArray() : q.filter(c => !c.archived).toArray()
  },

  async getByType(type: SpendingCategory['type'], includeArchived = false) {
    const all = await this.getAll(includeArchived)
    return all.filter(c => c.type === type)
  },

  async getById(id: string) {
    return db.spendingCategories.get(id)
  },

  async create(data: Omit<SpendingCategory, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt'>) {
    const user = useSession.getState().user
    const category: SpendingCategory = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.spendingCategories.add(category)
    scheduleSyncSoon()
    return category
  },

  async update(id: string, patch: Partial<SpendingCategory>) {
    await db.spendingCategories.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async archive(id: string) {
    await db.spendingCategories.update(id, { archived: true, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.spendingCategories.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async restore(id: string) {
    await db.spendingCategories.update(id, { deletedAt: undefined, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
