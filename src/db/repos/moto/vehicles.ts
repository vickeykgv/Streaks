import { db } from '@/db/database'
import type { MotoVehicle } from '@/types/moto'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const vehiclesRepo = {
  async getAll(includeArchived = false) {
    const q = db.motoVehicles.filter(v => !v.deletedAt)
    return includeArchived ? q.toArray() : q.filter(v => !v.archived).toArray()
  },

  async getById(id: string) {
    return db.motoVehicles.get(id)
  },

  async create(data: Omit<MotoVehicle, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt' | 'ownerId'>) {
    const user = useSession.getState().user
    const vehicle: MotoVehicle = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.motoVehicles.add(vehicle)
    scheduleSyncSoon()
    return vehicle
  },

  async update(id: string, patch: Partial<MotoVehicle>) {
    await db.motoVehicles.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async archive(id: string) {
    await db.motoVehicles.update(id, { archived: true, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.motoVehicles.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async restore(id: string) {
    await db.motoVehicles.update(id, { deletedAt: undefined, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
