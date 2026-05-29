import { db } from '@/db/database'
import type { MotoPart } from '@/types/moto'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const partsRepo = {
  async getAllForVehicle(vehicleId: string) {
    return db.motoParts
      .where('vehicleId').equals(vehicleId)
      .filter(p => !p.deletedAt)
      .sortBy('installedAt')
      .then(rows => rows.reverse())
  },

  async getById(id: string) {
    return db.motoParts.get(id)
  },

  async create(data: Omit<MotoPart, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt' | 'ownerId'>) {
    const user = useSession.getState().user
    const part: MotoPart = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.motoParts.add(part)
    scheduleSyncSoon()
    return part
  },

  async update(id: string, patch: Partial<MotoPart>) {
    await db.motoParts.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.motoParts.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
