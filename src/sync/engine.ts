import type { Table } from 'dexie'
import { db } from '@/db/database'
import { settingsRepo } from '@/db/repos/settings'
import { pullChanges, pushChanges } from './client'
import { useSession } from '@/auth/session'
import { useAppStore } from '@/store/appStore'
import { logError } from '@/lib/errorLog'

type SyncRecord = { id: string; updatedAt: number; deletedAt?: number; syncedAt?: number; dirty: boolean }

export async function mergeIntoTable<T extends SyncRecord>(
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
    } else if (localRecord.dirty) {
      // Local has an unsynced edit — keep it; it will be pushed next. Never let
      // a pulled copy overwrite a dirty record. (Comparing updatedAt here is not
      // safe once the server stamps updatedAt on push: a device whose clock is
      // behind the server could see serverRecord.updatedAt > its own pending
      // edit's timestamp and silently lose the edit.)
      continue
    } else if (serverRecord.updatedAt > localRecord.updatedAt) {
      await table.put({ ...serverRecord, dirty: false } as T)
    }
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

const SYNC_TIMEOUT_MS = 30_000

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    p.then(v => { clearTimeout(id); resolve(v) }, e => { clearTimeout(id); reject(e) })
  })
}

export async function syncNow(opts?: { full?: boolean }): Promise<void> {
  const user = useSession.getState().user
  if (!user) return
  if (syncInProgress) return
  if (!navigator.onLine) return

  syncInProgress = true
  useAppStore.getState().setSyncing(true)
  useAppStore.getState().setSyncError(false)

  try {
    // A full sync pulls everything (since = 0) instead of just changes since the
    // last cursor. Used by the manual "Sync now" button so records are fetched
    // even if the incremental cursor has drifted past them (e.g. device clock
    // skew). The cursor is still advanced to serverTime below, so subsequent
    // automatic syncs stay incremental.
    const lastPulledAt = opts?.full ? 0 : await settingsRepo.get<number>('lastPulledAt', 0)

    // 1. PULL (with timeout — Android PWA standalone mode sometimes stalls fetches)
    const { serverTime, changes } = await withTimeout(pullChanges(lastPulledAt), SYNC_TIMEOUT_MS, 'pullChanges')

    // 2. MERGE
    await db.transaction('rw', [
      db.habits, db.tasks, db.habitEntries, db.tags,
      db.spendingAccounts, db.spendingCategories, db.spendingTransactions, db.spendingBudgets, db.spendingRecurring,
      db.motoVehicles, db.motoFuelLogs, db.motoServices, db.motoParts, db.motoIssues, db.motoNotes, db.motoDocuments,
    ], async () => {
      await mergeIntoTable(db.habits,               changes.habits)
      await mergeIntoTable(db.tasks,                changes.tasks)
      await mergeIntoTable(db.habitEntries,          changes.entries)
      await mergeIntoTable(db.tags,                  changes.tags)
      await mergeIntoTable(db.spendingAccounts,      changes.spendingAccounts)
      await mergeIntoTable(db.spendingCategories,    changes.spendingCategories)
      await mergeIntoTable(db.spendingTransactions,  changes.spendingTransactions)
      await mergeIntoTable(db.spendingBudgets,       changes.spendingBudgets)
      await mergeIntoTable(db.spendingRecurring,     changes.spendingRecurring)
      await mergeIntoTable(db.motoVehicles,  changes.motoVehicles)
      await mergeIntoTable(db.motoFuelLogs,  changes.motoFuelLogs)
      await mergeIntoTable(db.motoServices,  changes.motoServices)
      await mergeIntoTable(db.motoParts,     changes.motoParts)
      await mergeIntoTable(db.motoIssues,    changes.motoIssues)
      await mergeIntoTable(db.motoNotes,     changes.motoNotes)
      await mergeIntoTable(db.motoDocuments, changes.motoDocuments)
    })

    await settingsRepo.set('lastPulledAt', serverTime)

    // 3. PUSH
    const [
      dirtyHabits, dirtyTasks, dirtyEntries, dirtyTags,
      dirtyAccounts, dirtyCategories, dirtyTransactions, dirtyBudgets, dirtyRecurring,
      dirtyVehicles, dirtyFuelLogs, dirtyServices, dirtyParts, dirtyIssues, dirtyNotes, dirtyDocs,
    ] = await Promise.all([
      getDirtyRecords(db.habits),
      getDirtyRecords(db.tasks),
      getDirtyRecords(db.habitEntries),
      getDirtyRecords(db.tags),
      getDirtyRecords(db.spendingAccounts),
      getDirtyRecords(db.spendingCategories),
      getDirtyRecords(db.spendingTransactions),
      getDirtyRecords(db.spendingBudgets),
      getDirtyRecords(db.spendingRecurring),
      getDirtyRecords(db.motoVehicles),
      getDirtyRecords(db.motoFuelLogs),
      getDirtyRecords(db.motoServices),
      getDirtyRecords(db.motoParts),
      getDirtyRecords(db.motoIssues),
      getDirtyRecords(db.motoNotes),
      getDirtyRecords(db.motoDocuments),
    ])

    const hasChanges = [
      dirtyHabits, dirtyTasks, dirtyEntries, dirtyTags,
      dirtyAccounts, dirtyCategories, dirtyTransactions, dirtyBudgets, dirtyRecurring,
      dirtyVehicles, dirtyFuelLogs, dirtyServices, dirtyParts, dirtyIssues, dirtyNotes, dirtyDocs,
    ].some(a => a.length > 0)

    if (hasChanges) {
      const { syncedAt } = await withTimeout(pushChanges({
        habits:               dirtyHabits,
        tasks:                dirtyTasks,
        entries:              dirtyEntries,
        tags:                 dirtyTags,
        spendingAccounts:     dirtyAccounts,
        spendingCategories:   dirtyCategories,
        spendingTransactions: dirtyTransactions,
        spendingBudgets:      dirtyBudgets,
        spendingRecurring:    dirtyRecurring,
        motoVehicles:  dirtyVehicles,
        motoFuelLogs:  dirtyFuelLogs,
        motoServices:  dirtyServices,
        motoParts:     dirtyParts,
        motoIssues:    dirtyIssues,
        motoNotes:     dirtyNotes,
        motoDocuments: dirtyDocs,
      }), SYNC_TIMEOUT_MS, 'pushChanges')

      // 4. ACK — clear dirty flags
      await db.transaction('rw', [
        db.habits, db.tasks, db.habitEntries, db.tags,
        db.spendingAccounts, db.spendingCategories, db.spendingTransactions, db.spendingBudgets, db.spendingRecurring,
        db.motoVehicles, db.motoFuelLogs, db.motoServices, db.motoParts, db.motoIssues, db.motoNotes, db.motoDocuments,
      ], async () => {
        await markSynced(db.habits,               dirtyHabits.map(r => r.id),       syncedAt)
        await markSynced(db.tasks,                dirtyTasks.map(r => r.id),        syncedAt)
        await markSynced(db.habitEntries,          dirtyEntries.map(r => r.id),      syncedAt)
        await markSynced(db.tags,                  dirtyTags.map(r => r.id),         syncedAt)
        await markSynced(db.spendingAccounts,      dirtyAccounts.map(r => r.id),     syncedAt)
        await markSynced(db.spendingCategories,    dirtyCategories.map(r => r.id),   syncedAt)
        await markSynced(db.spendingTransactions,  dirtyTransactions.map(r => r.id), syncedAt)
        await markSynced(db.spendingBudgets,       dirtyBudgets.map(r => r.id),      syncedAt)
        await markSynced(db.spendingRecurring,     dirtyRecurring.map(r => r.id),    syncedAt)
        await markSynced(db.motoVehicles,  dirtyVehicles.map(r => r.id),  syncedAt)
        await markSynced(db.motoFuelLogs,  dirtyFuelLogs.map(r => r.id),  syncedAt)
        await markSynced(db.motoServices,  dirtyServices.map(r => r.id),  syncedAt)
        await markSynced(db.motoParts,     dirtyParts.map(r => r.id),     syncedAt)
        await markSynced(db.motoIssues,    dirtyIssues.map(r => r.id),    syncedAt)
        await markSynced(db.motoNotes,     dirtyNotes.map(r => r.id),     syncedAt)
        await markSynced(db.motoDocuments, dirtyDocs.map(r => r.id),      syncedAt)
      })
    }

    useAppStore.getState().setLastSyncedAt(Date.now())
  } catch (err) {
    console.error('[Sync] Failed:', err)
    useAppStore.getState().setSyncError(true)
    void logError(err, 'sync')
  } finally {
    syncInProgress = false
    useAppStore.getState().setSyncing(false)
  }
}
