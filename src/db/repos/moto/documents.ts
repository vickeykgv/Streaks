import { db } from '@/db/database'
import type { MotoDocument } from '@/types/moto'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const documentsRepo = {
  // vehicleId = undefined returns all (including DL which has no vehicle)
  async getAll(vehicleId?: string) {
    return db.motoDocuments
      .filter(d => !d.deletedAt && (vehicleId === undefined || d.vehicleId === vehicleId || d.vehicleId === undefined))
      .toArray()
  },

  async getById(id: string) {
    return db.motoDocuments.get(id)
  },

  async create(data: Omit<MotoDocument, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt' | 'ownerId'>) {
    const user = useSession.getState().user
    const doc: MotoDocument = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.motoDocuments.add(doc)
    scheduleSyncSoon()
    return doc
  },

  async update(id: string, patch: Partial<MotoDocument>) {
    await db.motoDocuments.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.motoDocuments.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
