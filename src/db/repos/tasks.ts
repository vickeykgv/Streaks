import { db } from '@/db/database'
import type { Task } from '@/types'
import { nanoid } from 'nanoid'
import { useSession } from '@/auth/session'
import { scheduleSyncSoon } from '@/sync/schedule'

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
    const user = useSession.getState().user
    const task: Task = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
      ownerId: user?.id,
    }
    await db.tasks.add(task)
    scheduleSyncSoon()
    return task
  },

  async update(id: string, patch: Partial<Task>) {
    await db.tasks.update(id, { ...patch, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async complete(id: string) {
    await db.tasks.update(id, { status: 'done', completedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async skip(id: string) {
    await db.tasks.update(id, { status: 'skipped', updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async delete(id: string) {
    await db.tasks.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async restore(id: string) {
    await db.tasks.update(id, { deletedAt: undefined, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async snooze(id: string, days = 1) {
    const t = await db.tasks.get(id)
    if (!t) return
    const d = new Date(t.dueDate + 'T12:00:00')
    d.setDate(d.getDate() + days)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    await db.tasks.update(id, { dueDate: `${y}-${m}-${dd}`, updatedAt: now(), dirty: true })
    scheduleSyncSoon()
  },

  async removeTagFromAll(tagId: string) {
    const tasks = await db.tasks.filter(t => !t.deletedAt && t.tags.includes(tagId)).toArray()
    await Promise.all(
      tasks.map(t =>
        db.tasks.update(t.id, { tags: t.tags.filter(x => x !== tagId), updatedAt: now(), dirty: true })
      )
    )
    if (tasks.length > 0) scheduleSyncSoon()
  },
}
