import { db } from '@/db/database'
import type { SpendingTransaction } from '@/types/spending'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const transactionsRepo = {
  async getAll() {
    return db.spendingTransactions.filter(t => !t.deletedAt).toArray()
  },

  async getByDateRange(from: string, to: string) {
    return db.spendingTransactions
      .where('date')
      .between(from, to, true, true)
      .filter(t => !t.deletedAt)
      .toArray()
  },

  async getByAccount(accountId: string) {
    return db.spendingTransactions
      .where('accountId')
      .equals(accountId)
      .filter(t => !t.deletedAt)
      .toArray()
  },

  async getById(id: string) {
    return db.spendingTransactions.get(id)
  },

  async create(data: Omit<SpendingTransaction, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt'>) {
    const user = useSession.getState().user
    const transaction: SpendingTransaction = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.spendingTransactions.add(transaction)
    scheduleSyncSoon()
    return transaction
  },

  async update(id: string, patch: Partial<SpendingTransaction>) {
    await db.spendingTransactions.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.spendingTransactions.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async restore(id: string) {
    await db.spendingTransactions.update(id, { deletedAt: undefined, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
