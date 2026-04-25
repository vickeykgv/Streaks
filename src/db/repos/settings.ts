import { db } from '@/db/database'

export const settingsRepo = {
  async get<T>(key: string, fallback: T): Promise<T> {
    const row = await db.settings.get(key)
    return row ? (row.value as T) : fallback
  },

  async set(key: string, value: unknown) {
    await db.settings.put({ key, value })
  },
}
