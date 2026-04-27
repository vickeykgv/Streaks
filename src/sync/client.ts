import { supabase } from '@/lib/supabase'
import type { Habit, Task, HabitEntry, Tag } from '@/types'
import {
  habitFromServer, taskFromServer, entryFromServer, tagFromServer,
  habitToServer, taskToServer, entryToServer, tagToServer,
  type ServerHabit, type ServerTask, type ServerHabitEntry, type ServerTag,
} from './serializers'

const BASE = (import.meta.env.VITE_SUPABASE_URL as string)?.replace(/\/$/, '')

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token ?? ''
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

interface PullResponse {
  serverTime: number
  changes: {
    habits:  ServerHabit[]
    tasks:   ServerTask[]
    entries: ServerHabitEntry[]
    tags:    ServerTag[]
  }
}

export interface PullResult {
  serverTime: number
  changes: {
    habits:  Habit[]
    tasks:   Task[]
    entries: HabitEntry[]
    tags:    Tag[]
  }
}

export async function pullChanges(since: number): Promise<PullResult> {
  const res = await fetch(`${BASE}/functions/v1/sync-pull?since=${since}`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(`Pull failed: ${res.status}`)
  const raw = await res.json() as PullResponse
  return {
    serverTime: raw.serverTime,
    changes: {
      habits:  (raw.changes.habits  ?? []).map(habitFromServer),
      tasks:   (raw.changes.tasks   ?? []).map(taskFromServer),
      entries: (raw.changes.entries ?? []).map(entryFromServer),
      tags:    (raw.changes.tags    ?? []).map(tagFromServer),
    },
  }
}

export async function pushChanges(changes: {
  habits:  Habit[]
  tasks:   Task[]
  entries: HabitEntry[]
  tags:    Tag[]
}): Promise<{ ok: boolean; syncedAt: number }> {
  const res = await fetch(`${BASE}/functions/v1/sync-push`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      changes: {
        habits:  changes.habits.map(habitToServer),
        tasks:   changes.tasks.map(taskToServer),
        entries: changes.entries.map(entryToServer),
        tags:    changes.tags.map(tagToServer),
      },
    }),
  })
  if (!res.ok) throw new Error(`Push failed: ${res.status}`)
  return res.json() as Promise<{ ok: boolean; syncedAt: number }>
}
