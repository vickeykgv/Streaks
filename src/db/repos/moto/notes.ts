import { db } from '@/db/database'
import type { MotoNote } from '@/types/moto'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

const now = () => Date.now()

export const notesRepo = {
  async getAllForVehicle(vehicleId: string) {
    const rows = await db.motoNotes
      .where('vehicleId').equals(vehicleId)
      .filter(n => !n.deletedAt)
      .toArray()
    // pinned first, then by newest
    return rows.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.createdAt - a.createdAt
    })
  },

  async getById(id: string) {
    return db.motoNotes.get(id)
  },

  async create(data: Omit<MotoNote, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt' | 'ownerId'>) {
    const user = useSession.getState().user
    const note: MotoNote = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.motoNotes.add(note)
    scheduleSyncSoon()
    return note
  },

  async update(id: string, patch: Partial<MotoNote>) {
    await db.motoNotes.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.motoNotes.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },
}
