import { db } from '@/db/database'
import type { MotoVehicleDoc } from '@/types/moto'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const vehicleDocsRepo = {
  async getAllForVehicle(vehicleId: string) {
    return db.motoVehicleDocs
      .where('vehicleId').equals(vehicleId)
      .filter(d => !d.deletedAt)
      .sortBy('createdAt')
      .then(rows => rows.reverse())
  },

  async getById(id: string) {
    return db.motoVehicleDocs.get(id)
  },

  async create(data: Omit<MotoVehicleDoc, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt' | 'ownerId'>) {
    const user = useSession.getState().user
    const doc: MotoVehicleDoc = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.motoVehicleDocs.add(doc)
    scheduleSyncSoon()
    return doc
  },

  async update(id: string, patch: Partial<MotoVehicleDoc>) {
    await db.motoVehicleDocs.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.motoVehicleDocs.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
