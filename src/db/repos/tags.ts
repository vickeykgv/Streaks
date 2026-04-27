import { db } from '@/db/database'
import type { Tag } from '@/types'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'

const now = () => Date.now()

export const tagsRepo = {
  async getAll() {
    return db.tags.filter(t => !t.deletedAt).toArray()
  },

  async getById(id: string) {
    return db.tags.get(id)
  },

  async create(name: string, color: string) {
    const user = useSession.getState().user
    const tag: Tag = {
      id: nanoid(),
      name,
      color,
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.tags.add(tag)
    return tag
  },

  async update(id: string, patch: Partial<Pick<Tag, 'name' | 'color'>>) {
    await db.tags.update(id, { ...patch, updatedAt: now(), dirty: true })
  },

  async delete(id: string) {
    await db.tags.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
  },
}
