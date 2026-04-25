import { db } from '@/db/database'
import type { Task } from '@/types'
import { nanoid } from 'nanoid'

const now = () => Date.now()

export const tasksRepo = {
  async getAll() {
    return db.tasks.filter(t => !t.deletedAt).toArray()
  },

  async getById(id: string) {
    return db.tasks.get(id)
  },

  async getByStatus(status: Task['status']) {
    return db.tasks.where('status').equals(status).filter(t => !t.deletedAt).toArray()
  },

  async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt'>) {
    const task: Task = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
    }
    await db.tasks.add(task)
    return task
  },

  async update(id: string, patch: Partial<Task>) {
    await db.tasks.update(id, { ...patch, updatedAt: now(), dirty: true })
  },

  async complete(id: string) {
    await db.tasks.update(id, { status: 'done', completedAt: now(), updatedAt: now(), dirty: true })
  },

  async skip(id: string) {
    await db.tasks.update(id, { status: 'skipped', updatedAt: now(), dirty: true })
  },

  async delete(id: string) {
    await db.tasks.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
  },

  async removeTagFromAll(tagId: string) {
    const tasks = await db.tasks.filter(t => !t.deletedAt && t.tags.includes(tagId)).toArray()
    await Promise.all(
      tasks.map(t =>
        db.tasks.update(t.id, { tags: t.tags.filter(x => x !== tagId), updatedAt: now(), dirty: true })
      )
    )
  },
}
