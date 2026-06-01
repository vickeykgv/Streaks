import { db } from '@/db/database'
import type { SpendingAccount } from '@/types/spending'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const accountsRepo = {
  async getAll(includeArchived = false) {
    const q = db.spendingAccounts.filter(a => !a.deletedAt)
    return includeArchived ? q.toArray() : q.filter(a => !a.archived).toArray()
  },

  async getById(id: string) {
    return db.spendingAccounts.get(id)
  },

  async create(data: Omit<SpendingAccount, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt'>) {
    const user = useSession.getState().user
    const account: SpendingAccount = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.spendingAccounts.add(account)
    scheduleSyncSoon()
    return account
  },

  async update(id: string, patch: Partial<SpendingAccount>) {
    await db.spendingAccounts.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async archive(id: string) {
    await db.spendingAccounts.update(id, { archived: true, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.spendingAccounts.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async restore(id: string) {
    await db.spendingAccounts.update(id, { deletedAt: undefined, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
