import { db } from '@/db/database'
import type { MotoFuelLog } from '@/types/moto'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const fuelLogsRepo = {
  async getAllForVehicle(vehicleId: string) {
    return db.motoFuelLogs
      .where('vehicleId').equals(vehicleId)
      .filter(l => !l.deletedAt)
      .sortBy('date')
      .then(rows => rows.reverse())
  },

  async getById(id: string) {
    return db.motoFuelLogs.get(id)
  },

  async create(data: Omit<MotoFuelLog, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt' | 'ownerId'>) {
    const user = useSession.getState().user
    const log: MotoFuelLog = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.motoFuelLogs.add(log)
    scheduleSyncSoon()
    return log
  },

  async update(id: string, patch: Partial<MotoFuelLog>) {
    await db.motoFuelLogs.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.motoFuelLogs.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
