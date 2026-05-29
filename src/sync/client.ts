import { supabase } from '@/lib/supabase'
import type { Habit, Task, HabitEntry, Tag } from '@/types'
import type { SpendingAccount, SpendingCategory, SpendingTransaction, SpendingBudget, SpendingRecurring } from '@/types/spending'
import type { MotoVehicle, MotoFuelLog, MotoService, MotoPart, MotoIssue, MotoNote, MotoDocument } from '@/types/moto'
import {
  habitFromServer, taskFromServer, entryFromServer, tagFromServer,
  habitToServer, taskToServer, entryToServer, tagToServer,
  spendingAccountFromServer, spendingCategoryFromServer, spendingTransactionFromServer, spendingBudgetFromServer, spendingRecurringFromServer,
  spendingAccountToServer, spendingCategoryToServer, spendingTransactionToServer, spendingBudgetToServer, spendingRecurringToServer,
  motoVehicleFromServer, motoFuelLogFromServer, motoServiceFromServer, motoPartFromServer,
  motoIssueFromServer, motoNoteFromServer, motoDocumentFromServer,
  motoVehicleToServer, motoFuelLogToServer, motoServiceToServer, motoPartToServer,
  motoIssueToServer, motoNoteToServer, motoDocumentToServer,
  type ServerHabit, type ServerTask, type ServerHabitEntry, type ServerTag,
  type ServerSpendingAccount, type ServerSpendingCategory, type ServerSpendingTransaction, type ServerSpendingBudget, type ServerSpendingRecurring,
  type ServerMotoVehicle, type ServerMotoFuelLog, type ServerMotoService, type ServerMotoPart,
  type ServerMotoIssue, type ServerMotoNote, type ServerMotoDocument,
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
    motoVehicles?:         ServerMotoVehicle[]
    motoFuelLogs?:         ServerMotoFuelLog[]
    motoServices?:         ServerMotoService[]
    motoParts?:            ServerMotoPart[]
    motoIssues?:           ServerMotoIssue[]
    motoNotes?:            ServerMotoNote[]
    motoDocuments?:        ServerMotoDocument[]
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
    motoVehicles:         MotoVehicle[]
    motoFuelLogs:         MotoFuelLog[]
    motoServices:         MotoService[]
    motoParts:            MotoPart[]
    motoIssues:           MotoIssue[]
    motoNotes:            MotoNote[]
    motoDocuments:        MotoDocument[]
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
      motoVehicles:  (raw.changes.motoVehicles  ?? []).map(motoVehicleFromServer),
      motoFuelLogs:  (raw.changes.motoFuelLogs  ?? []).map(motoFuelLogFromServer),
      motoServices:  (raw.changes.motoServices  ?? []).map(motoServiceFromServer),
      motoParts:     (raw.changes.motoParts     ?? []).map(motoPartFromServer),
      motoIssues:    (raw.changes.motoIssues    ?? []).map(motoIssueFromServer),
      motoNotes:     (raw.changes.motoNotes     ?? []).map(motoNoteFromServer),
      motoDocuments: (raw.changes.motoDocuments ?? []).map(motoDocumentFromServer),
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
  motoVehicles:         MotoVehicle[]
  motoFuelLogs:         MotoFuelLog[]
  motoServices:         MotoService[]
  motoParts:            MotoPart[]
  motoIssues:           MotoIssue[]
  motoNotes:            MotoNote[]
  motoDocuments:        MotoDocument[]
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
        motoVehicles:  changes.motoVehicles.map(motoVehicleToServer),
        motoFuelLogs:  changes.motoFuelLogs.map(motoFuelLogToServer),
        motoServices:  changes.motoServices.map(motoServiceToServer),
        motoParts:     changes.motoParts.map(motoPartToServer),
        motoIssues:    changes.motoIssues.map(motoIssueToServer),
        motoNotes:     changes.motoNotes.map(motoNoteToServer),
        motoDocuments: changes.motoDocuments.map(motoDocumentToServer),
      },
    }),
  })
  if (!res.ok) throw new Error(`Push failed: ${res.status}`)
  return res.json() as Promise<{ ok: boolean; syncedAt: number }>
}
