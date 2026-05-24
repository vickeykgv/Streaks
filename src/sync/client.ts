import { supabase } from '@/lib/supabase'
import type { Habit, Task, HabitEntry, Tag } from '@/types'
import type { SpendingAccount, SpendingCategory, SpendingTransaction, SpendingBudget, SpendingRecurring } from '@/types/spending'
import {
  habitFromServer, taskFromServer, entryFromServer, tagFromServer,
  habitToServer, taskToServer, entryToServer, tagToServer,
  spendingAccountFromServer, spendingCategoryFromServer, spendingTransactionFromServer, spendingBudgetFromServer, spendingRecurringFromServer,
  spendingAccountToServer, spendingCategoryToServer, spendingTransactionToServer, spendingBudgetToServer, spendingRecurringToServer,
  type ServerHabit, type ServerTask, type ServerHabitEntry, type ServerTag,
  type ServerSpendingAccount, type ServerSpendingCategory, type ServerSpendingTransaction, type ServerSpendingBudget, type ServerSpendingRecurring,
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
    habits:               ServerHabit[]
    tasks:                ServerTask[]
    entries:              ServerHabitEntry[]
    tags:                 ServerTag[]
    spendingAccounts?:     ServerSpendingAccount[]
    spendingCategories?:   ServerSpendingCategory[]
    spendingTransactions?: ServerSpendingTransaction[]
    spendingBudgets?:      ServerSpendingBudget[]
    spendingRecurring?:    ServerSpendingRecurring[]
  }
}

export interface PullResult {
  serverTime: number
  changes: {
    habits:               Habit[]
    tasks:                Task[]
    entries:              HabitEntry[]
    tags:                 Tag[]
    spendingAccounts:     SpendingAccount[]
    spendingCategories:   SpendingCategory[]
    spendingTransactions: SpendingTransaction[]
    spendingBudgets:      SpendingBudget[]
    spendingRecurring:    SpendingRecurring[]
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
      habits:               (raw.changes.habits               ?? []).map(habitFromServer),
      tasks:                (raw.changes.tasks                ?? []).map(taskFromServer),
      entries:              (raw.changes.entries              ?? []).map(entryFromServer),
      tags:                 (raw.changes.tags                 ?? []).map(tagFromServer),
      spendingAccounts:     (raw.changes.spendingAccounts     ?? []).map(spendingAccountFromServer),
      spendingCategories:   (raw.changes.spendingCategories   ?? []).map(spendingCategoryFromServer),
      spendingTransactions: (raw.changes.spendingTransactions ?? []).map(spendingTransactionFromServer),
      spendingBudgets:      (raw.changes.spendingBudgets      ?? []).map(spendingBudgetFromServer),
      spendingRecurring:    (raw.changes.spendingRecurring    ?? []).map(spendingRecurringFromServer),
    },
  }
}

export async function pushChanges(changes: {
  habits:               Habit[]
  tasks:                Task[]
  entries:              HabitEntry[]
  tags:                 Tag[]
  spendingAccounts:     SpendingAccount[]
  spendingCategories:   SpendingCategory[]
  spendingTransactions: SpendingTransaction[]
  spendingBudgets:      SpendingBudget[]
  spendingRecurring:    SpendingRecurring[]
}): Promise<{ ok: boolean; syncedAt: number }> {
  const res = await fetch(`${BASE}/functions/v1/sync-push`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      changes: {
        habits:               changes.habits.map(habitToServer),
        tasks:                changes.tasks.map(taskToServer),
        entries:              changes.entries.map(entryToServer),
        tags:                 changes.tags.map(tagToServer),
        spendingAccounts:     changes.spendingAccounts.map(spendingAccountToServer),
        spendingCategories:   changes.spendingCategories.map(spendingCategoryToServer),
        spendingTransactions: changes.spendingTransactions.map(spendingTransactionToServer),
        spendingBudgets:      changes.spendingBudgets.map(spendingBudgetToServer),
        spendingRecurring:    changes.spendingRecurring.map(spendingRecurringToServer),
      },
    }),
  })
  if (!res.ok) throw new Error(`Push failed: ${res.status}`)
  return res.json() as Promise<{ ok: boolean; syncedAt: number }>
}
