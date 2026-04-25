import { db } from '@/db/database'
import type { Tag } from '@/types'
import { nanoid } from 'nanoid'

export const tagsRepo = {
  async getAll() {
    return db.tags.toArray()
  },

  async getById(id: string) {
    return db.tags.get(id)
  },

  async create(name: string, color: string) {
    const tag: Tag = {
      id: nanoid(),
      name,
      color,
      createdAt: Date.now(),
    }
    await db.tags.add(tag)
    return tag
  },

  async update(id: string, patch: Partial<Pick<Tag, 'name' | 'color'>>) {
    await db.tags.update(id, patch)
  },

  async delete(id: string) {
    await db.tags.delete(id)
  },
}
