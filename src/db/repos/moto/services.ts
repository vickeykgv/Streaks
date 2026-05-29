import { db } from '@/db/database'
import type { MotoService } from '@/types/moto'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const servicesRepo = {
  async getAllForVehicle(vehicleId: string) {
    return db.motoServices
      .where('vehicleId').equals(vehicleId)
      .filter(s => !s.deletedAt)
      .sortBy('date')
      .then(rows => rows.reverse())
  },

  async getById(id: string) {
    return db.motoServices.get(id)
  },

  async create(data: Omit<MotoService, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt' | 'ownerId'>) {
    const user = useSession.getState().user
    const service: MotoService = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.motoServices.add(service)
    scheduleSyncSoon()
    return service
  },

  async update(id: string, patch: Partial<MotoService>) {
    await db.motoServices.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.motoServices.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
