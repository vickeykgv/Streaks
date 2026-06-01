import { db } from '@/db/database'
import type { MotoMaintenanceItem } from '@/types/moto'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const maintenanceItemsRepo = {
  async getAllForVehicle(vehicleId: string) {
    return db.motoMaintenanceItems
      .where('vehicleId').equals(vehicleId)
      .filter(i => !i.deletedAt)
      .sortBy('createdAt')
      .then(rows => rows.reverse())
  },

  async getById(id: string) {
    return db.motoMaintenanceItems.get(id)
  },

  async create(data: Omit<MotoMaintenanceItem, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt' | 'ownerId'>) {
    const user = useSession.getState().user
    const item: MotoMaintenanceItem = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.motoMaintenanceItems.add(item)
    scheduleSyncSoon()
    return item
  },

  async toggle(id: string, checked: boolean) {
    await db.motoMaintenanceItems.update(id, { checked, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async update(id: string, patch: Partial<MotoMaintenanceItem>) {
    await db.motoMaintenanceItems.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.motoMaintenanceItems.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
