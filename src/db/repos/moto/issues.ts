import { db } from '@/db/database'
import type { MotoIssue, IssueStatus } from '@/types/moto'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'
import { format } from 'date-fns'

const now = () => Date.now()
const today = () => format(new Date(), 'yyyy-MM-dd')

export const issuesRepo = {
  async getAllForVehicle(vehicleId: string, status?: IssueStatus) {
    let q = db.motoIssues
      .where('vehicleId').equals(vehicleId)
      .filter(i => !i.deletedAt)
    if (status) q = q.filter(i => i.status === status)
    return q.sortBy('reportedAt').then(rows => rows.reverse())
  },

  async getById(id: string) {
    return db.motoIssues.get(id)
  },

  async create(data: Omit<MotoIssue, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt' | 'ownerId'>) {
    const user = useSession.getState().user
    const issue: MotoIssue = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.motoIssues.add(issue)
    scheduleSyncSoon()
    return issue
  },

  async update(id: string, patch: Partial<MotoIssue>) {
    await db.motoIssues.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async resolve(id: string, resolvedByServiceId?: string) {
    await db.motoIssues.update(id, {
      status: 'resolved',
      resolvedAt: today(),
      resolvedByServiceId,
      updatedAt: now(),
      dirty: true,
    })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.motoIssues.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
