# Phase 6 — Sync Engine
**Estimated time:** Day 10–12  
**Goal:** Data created on one device syncs automatically to another. The protocol is pull → merge → push. Last-write-wins on `updatedAt`. Works transparently when online, queues changes when offline and uploads on reconnect.

**Prerequisite:** Phase 5 complete — Supabase schema, RLS, and auth all working.

---

## Step 1 — Sync protocol overview

The sync cycle always runs in this order:

```
1. PULL  — fetch all server records updated since lastPulledAt
2. MERGE — for each received record, compare updatedAt; keep whichever is newer
3. PUSH  — upload all local records where dirty === true
4. ACK   — on server ack, clear dirty flag and set syncedAt = now()
```

State persisted to `settingsRepo`:
- `lastPulledAt` — the server's clock time from the last pull response (number, ms timestamp). Start as `0` on first sync (pulls everything).

---

## Step 2 — Supabase Edge Functions for sync

Create two Edge Functions. Deploy via Supabase CLI or the dashboard.

### Install CLI
```bash
npm install -g supabase
supabase login
supabase init       # creates supabase/ folder
```

### `supabase/functions/sync-pull/index.ts`

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const url = new URL(req.url)
  const since = parseInt(url.searchParams.get('since') ?? '0', 10)
  const serverTime = Date.now()

  const [habits, tasks, entries, tags] = await Promise.all([
    supabase.from('habits')       .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('tasks')        .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('habit_entries').select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('tags')         .select('*').eq('user_id', user.id).gt('updated_at', since),
  ])

  return new Response(JSON.stringify({
    serverTime,
    changes: {
      habits:  habits.data  ?? [],
      tasks:   tasks.data   ?? [],
      entries: entries.data ?? [],
      tags:    tags.data    ?? [],
    },
  }), { headers: { 'Content-Type': 'application/json' } })
})
```

### `supabase/functions/sync-push/index.ts`

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader ?? '' } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  const { habits = [], tasks = [], entries = [], tags = [] } = body.changes ?? {}

  // Upsert each record, enforcing user_id = authenticated user
  const stamp = (records: any[]) =>
    records.map(r => ({ ...r, user_id: user.id }))  // enforce ownership

  const results = await Promise.allSettled([
    habits.length  && supabase.from('habits')       .upsert(stamp(habits),  { onConflict: 'id' }),
    tasks.length   && supabase.from('tasks')        .upsert(stamp(tasks),   { onConflict: 'id' }),
    entries.length && supabase.from('habit_entries').upsert(stamp(entries), { onConflict: 'id' }),
    tags.length    && supabase.from('tags')         .upsert(stamp(tags),    { onConflict: 'id' }),
  ])

  const errors = results.filter(r => r.status === 'rejected')
  if (errors.length > 0) {
    console.error('Push errors:', errors)
    return new Response(JSON.stringify({ ok: false }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true, syncedAt: Date.now() }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Deploy:
```bash
supabase functions deploy sync-pull
supabase functions deploy sync-push
```

---

## Step 3 — Sync client (`src/sync/client.ts`)

```ts
import { supabase } from '@/lib/supabase'

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

async function authHeaders() {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function pullChanges(since: number) {
  const res = await fetch(`${BASE}/sync-pull?since=${since}`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(`Pull failed: ${res.status}`)
  return res.json() as Promise<{
    serverTime: number
    changes: { habits: any[], tasks: any[], entries: any[], tags: any[] }
  }>
}

export async function pushChanges(changes: {
  habits?: any[], tasks?: any[], entries?: any[], tags?: any[]
}) {
  const res = await fetch(`${BASE}/sync-push`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ changes }),
  })
  if (!res.ok) throw new Error(`Push failed: ${res.status}`)
  return res.json() as Promise<{ ok: boolean, syncedAt: number }>
}
```

---

## Step 4 — Merge logic (`src/sync/engine.ts`)

This is the core of the sync. Keep it as pure functions so it's testable.

```ts
import { db } from '@/db/database'
import { settingsRepo } from '@/db/repos/settings'
import { pullChanges, pushChanges } from './client'
import { useSession } from '@/auth/session'
import { useAppStore } from '@/store/appStore'

/**
 * Merge a list of server records into the local IndexedDB table.
 * Last-write-wins: if server.updatedAt > local.updatedAt, take server version.
 * Tombstones: if server.deletedAt is set, apply the deletion locally.
 */
async function mergeIntoTable<T extends { id: string; updatedAt: number; deletedAt?: number }>(
  table: ReturnType<typeof db.table>,
  serverRecords: T[]
) {
  for (const serverRecord of serverRecords) {
    const localRecord = await table.get(serverRecord.id) as T | undefined

    if (serverRecord.deletedAt) {
      // Server tombstone: ensure local copy is also marked deleted
      if (localRecord && !localRecord.deletedAt) {
        await table.update(serverRecord.id, {
          deletedAt: serverRecord.deletedAt,
          updatedAt: serverRecord.updatedAt,
          dirty: false,
        })
      }
      continue
    }

    if (!localRecord) {
      // New record from server
      await table.add({ ...serverRecord, dirty: false })
    } else if (serverRecord.updatedAt > localRecord.updatedAt) {
      // Server is newer: overwrite local
      await table.put({ ...serverRecord, dirty: false })
    }
    // If local is newer (dirty = true), leave it — it will be pushed next
  }
}

/**
 * Collect all records with dirty = true for a given table.
 */
async function getDirtyRecords(table: ReturnType<typeof db.table>) {
  return table.filter((r: any) => r.dirty === true).toArray()
}

/**
 * Mark a list of records as synced (clear dirty flag, set syncedAt).
 */
async function markSynced(table: ReturnType<typeof db.table>, ids: string[], syncedAt: number) {
  await Promise.all(ids.map(id => table.update(id, { dirty: false, syncedAt })))
}

let syncInProgress = false

export async function syncNow(): Promise<void> {
  const user = useSession.getState().user
  if (!user) return          // signed out — no-op
  if (syncInProgress) return // debounce concurrent calls
  if (!navigator.onLine) return

  syncInProgress = true
  useAppStore.getState().setSyncing(true)

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
        await markSynced(db.habits,       dirtyHabits.map(r => r.id),   syncedAt)
        await markSynced(db.tasks,        dirtyTasks.map(r => r.id),    syncedAt)
        await markSynced(db.habitEntries, dirtyEntries.map(r => r.id),  syncedAt)
        await markSynced(db.tags,         dirtyTags.map(r => r.id),     syncedAt)
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
```

---

## Step 5 — Auto-sync triggers

Add these to `App.tsx` (inside the component, after session is loaded):

```tsx
import { syncNow } from '@/sync/engine'
import { useSession } from '@/auth/session'

// 1. Sync on app start
useEffect(() => {
  if (user) syncNow()
}, [user])

// 2. Sync when coming back online
useEffect(() => {
  const handler = () => { if (user) syncNow() }
  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}, [user])

// 3. Periodic sync every 60 seconds
useEffect(() => {
  if (!user) return
  const id = setInterval(syncNow, 60_000)
  return () => clearInterval(id)
}, [user])
```

### Debounced sync after writes

In `habitsRepo`, `tasksRepo`, and `entriesRepo`, after every write call a debounced `scheduleSyncSoon()`:

```ts
// src/sync/schedule.ts
import { syncNow } from './engine'

let timer: ReturnType<typeof setTimeout> | null = null

export function scheduleSyncSoon(delay = 3000) {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    syncNow()
  }, delay)
}
```

Import and call `scheduleSyncSoon()` at the end of every repo write method.

---

## Step 6 — Background Sync (service worker)

When the user goes offline while there are dirty records, register a background sync tag so the browser re-tries as soon as the device has network — even if the tab is closed.

In `src/pwa/sw.ts` (Phase 7 will flesh out the full SW; add this now as a stub):

```ts
// In the service worker:
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'habit-sync') {
    event.waitUntil(
      // Post a message to all open clients to trigger syncNow()
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SYNC_NOW' }))
      )
    )
  }
})
```

In `src/pwa/registerSW.ts`, register the sync tag after every write:

```ts
export async function requestBackgroundSync() {
  try {
    const reg = await navigator.serviceWorker.ready
    if ('sync' in reg) {
      await (reg as any).sync.register('habit-sync')
    }
  } catch {
    // Background Sync not supported — fine, we have the online listener
  }
}
```

Listen for the SW message in `App.tsx`:

```tsx
useEffect(() => {
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'SYNC_NOW') syncNow()
  }
  navigator.serviceWorker?.addEventListener('message', handler)
  return () => navigator.serviceWorker?.removeEventListener('message', handler)
}, [])
```

---

## Step 7 — Sync status UI

Update `src/store/appStore.ts` with sync state:

```ts
syncing: boolean
lastSyncedAt: number | null
syncError: boolean
setSyncing: (v: boolean) => void
setLastSyncedAt: (v: number) => void
setSyncError: (v: boolean) => void
```

Create `src/components/SyncStatusBadge.tsx`:

```
Syncing...   →  spinning dots
● Synced 2m ago  →  green dot + relative time
⚠ Sync error     →  amber warning icon (tap to retry)
(hidden when signed out)
```

Mount in the Dashboard header, right side. Update the relative time every 30 seconds.

---

## Step 8 — `ownerId` on writes

Update all repo create methods to stamp `ownerId` when a user is signed in:

```ts
import { useSession } from '@/auth/session'

// Inside create():
const user = useSession.getState().user
const habit: Habit = {
  ...data,
  id: nanoid(),
  createdAt: now(),
  updatedAt: now(),
  dirty: true,
  ownerId: user?.id,  // undefined if signed out
}
```

---

## ✅ Phase 6 done when

- [ ] Sign in on Device A → create a habit → Sync badge shows "Synced".
- [ ] Open the app on Device B with the same account → habit appears.
- [ ] Edit the habit on Device B → save → sync → Device A refreshes and shows the updated title.
- [ ] Kill network on Device A → create another habit → dirty flag is `true` in IndexedDB.
- [ ] Restore network → sync fires automatically → dirty flag clears.
- [ ] Delete a habit on Device A → tombstone (`deletedAt` set) → syncs → habit is gone on Device B.
- [ ] Open Supabase Table Editor → `habits` table → row is present with correct `user_id`.
- [ ] Sign out → sync stops (no network calls after sign-out).
- [ ] `syncNow()` called twice in a row → idempotent (no duplicate rows, no errors).
- [ ] First-ever sign-in on fresh device: `lastPulledAt = 0` → full pull → all data hydrated.