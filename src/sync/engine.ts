import type { Table } from 'dexie'
import { db } from '@/db/database'
import { settingsRepo } from '@/db/repos/settings'
import { pullChanges, pushChanges } from './client'
import { useSession } from '@/auth/session'
import { useAppStore } from '@/store/appStore'

type SyncRecord = { id: string; updatedAt: number; deletedAt?: number; syncedAt?: number; dirty: boolean }

async function mergeIntoTable<T extends SyncRecord>(
  table: Table<T, string>,
  serverRecords: T[],
): Promise<void> {
  for (const serverRecord of serverRecords) {
    const localRecord = await table.get(serverRecord.id)

    if (serverRecord.deletedAt) {
      if (localRecord && !localRecord.deletedAt) {
        await table.where('id').equals(serverRecord.id).modify((obj: T) => {
          obj.deletedAt = serverRecord.deletedAt
          obj.updatedAt = serverRecord.updatedAt
          obj.dirty = false
        })
      }
      continue
    }

    if (!localRecord) {
      await table.add({ ...serverRecord, dirty: false } as T)
    } else if (serverRecord.updatedAt > localRecord.updatedAt) {
      await table.put({ ...serverRecord, dirty: false } as T)
    }
    // If local is newer (dirty = true), leave it — will be pushed next
  }
}

async function getDirtyRecords<T extends SyncRecord>(table: Table<T, string>): Promise<T[]> {
  return table.filter(r => r.dirty === true).toArray()
}

async function markSynced<T extends SyncRecord>(
  table: Table<T, string>,
  ids: string[],
  syncedAt: number,
): Promise<void> {
  await Promise.all(ids.map(id =>
    table.where('id').equals(id).modify((obj: T) => {
      obj.dirty = false
      obj.syncedAt = syncedAt
    }),
  ))
}

let syncInProgress = false

export async function syncNow(): Promise<void> {
  const user = useSession.getState().user
  if (!user) return
  if (syncInProgress) return
  if (!navigator.onLine) return

  syncInProgress = true
  useAppStore.getState().setSyncing(true)
  useAppStore.getState().setSyncError(false)

  try {
    const lastPulledAt = await settingsRepo.get<number>('lastPulledAt', 0)

    // 1. PULL
    const { serverTime, changes } = await pullChanges(lastPulledAt)

    // 2. MERGE
    await db.transaction('rw', [db.habits, db.tasks, db.habitEntries, db.tags], async () => {
      await mergeIntoTable(db.habits,       changes.habits)
      await mergeIntoTable(db.tasks,        changes.tasks)
      await mergeIntoTable(db.habitEntries, changes.entries)
      await mergeIntoTable(db.tags,         changes.tags)
    })

    await settingsRepo.set('lastPulledAt', serverTime)

    // 3. PUSH
    const [dirtyHabits, dirtyTasks, dirtyEntries, dirtyTags] = await Promise.all([
      getDirtyRecords(db.habits),
      getDirtyRecords(db.tasks),
      getDirtyRecords(db.habitEntries),
      getDirtyRecords(db.tags),
    ])

    const hasChanges = [dirtyHabits, dirtyTasks, dirtyEntries, dirtyTags].some(a => a.length > 0)

    if (hasChanges) {
      const { syncedAt } = await pushChanges({
        habits:  dirtyHabits,
        tasks:   dirtyTasks,
        entries: dirtyEntries,
        tags:    dirtyTags,
      })

      // 4. ACK — clear dirty flags
      await db.transaction('rw', [db.habits, db.tasks, db.habitEntries, db.tags], async () => {
        await markSynced(db.habits,       dirtyHabits.map(r => r.id),  syncedAt)
        await markSynced(db.tasks,        dirtyTasks.map(r => r.id),   syncedAt)
        await markSynced(db.habitEntries, dirtyEntries.map(r => r.id), syncedAt)
        await markSynced(db.tags,         dirtyTags.map(r => r.id),    syncedAt)
      })
    }

    useAppStore.getState().setLastSyncedAt(Date.now())
  } catch (err) {
    console.error('[Sync] Failed:', err)
    useAppStore.getState().setSyncError(true)
  } finally {
    syncInProgress = false
    useAppStore.getState().setSyncing(false)
  }
}
