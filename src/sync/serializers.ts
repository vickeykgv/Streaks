import type { Habit, Task, HabitEntry, Tag } from '@/types'
import type {
  SpendingAccount, SpendingCategory, SpendingTransaction,
  SpendingBudget, SpendingRecurring,
} from '@/types/spending'

// ─── Server row types (snake_case, as returned from Supabase) ────────────────

export interface ServerHabit {
  id: string
  user_id: string
  title: string
  description: string | null
  tags: string[]
  measurement_type: string
  target: number | null
  unit: string | null
  recurrence: Habit['recurrence']
  start_date: string
  end_date: string | null
  reminder_time: string | null
  color: string
  icon: string
  archived: boolean
  world: string | null
  created_at: number
  updated_at: number
  deleted_at: number | null
  synced_at: number | null
}

export interface ServerTask {
  id: string
  user_id: string
  title: string
  description: string | null
  tags: string[]
  measurement_type: string
  target: number | null
  unit: string | null
  due_date: string
  due_time: string | null
  priority: string
  status: string
  completed_at: number | null
  progress: number | null
  color: string
  icon: string
  world: string | null
  created_at: number
  updated_at: number
  deleted_at: number | null
  synced_at: number | null
}

export interface ServerHabitEntry {
  id: string
  user_id: string
  habit_id: string
  date: string
  status: string
  value: number | null
  note: string | null
  completed_at: number | null
  updated_at: number
  deleted_at: number | null
  synced_at: number | null
}

export interface ServerTag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: number
  updated_at: number
  deleted_at: number | null
  synced_at: number | null
}

// ─── fromServer: server row → local type (used after PULL) ──────────────────

export function habitFromServer(r: ServerHabit): Habit {
  return {
    id: r.id,
    ownerId: r.user_id,
    title: r.title,
    description: r.description ?? undefined,
    tags: r.tags ?? [],
    measurementType: r.measurement_type as Habit['measurementType'],
    target: r.target ?? undefined,
    unit: r.unit ?? undefined,
    recurrence: r.recurrence,
    startDate: r.start_date,
    endDate: r.end_date ?? undefined,
    reminderTime: r.reminder_time ?? undefined,
    color: r.color,
    icon: r.icon,
    archived: r.archived,
    world: (r.world ?? 'personal') as Habit['world'],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined,
    syncedAt: r.synced_at ?? undefined,
    dirty: false,
  }
}

export function taskFromServer(r: ServerTask): Task {
  return {
    id: r.id,
    ownerId: r.user_id,
    title: r.title,
    description: r.description ?? undefined,
    tags: r.tags ?? [],
    measurementType: r.measurement_type as Task['measurementType'],
    target: r.target ?? undefined,
    unit: r.unit ?? undefined,
    dueDate: r.due_date,
    dueTime: r.due_time ?? undefined,
    priority: r.priority as Task['priority'],
    status: r.status as Task['status'],
    completedAt: r.completed_at ?? undefined,
    progress: r.progress ?? undefined,
    color: r.color,
    icon: r.icon,
    world: (r.world ?? 'personal') as Task['world'],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined,
    syncedAt: r.synced_at ?? undefined,
    dirty: false,
  }
}

export function entryFromServer(r: ServerHabitEntry): HabitEntry {
  return {
    id: r.id,
    habitId: r.habit_id,
    date: r.date,
    status: r.status as HabitEntry['status'],
    value: r.value ?? undefined,
    note: r.note ?? undefined,
    completedAt: r.completed_at ?? undefined,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined,
    syncedAt: r.synced_at ?? undefined,
    dirty: false,
  }
}

export function tagFromServer(r: ServerTag): Tag {
  return {
    id: r.id,
    ownerId: r.user_id,
    name: r.name,
    color: r.color,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined,
    syncedAt: r.synced_at ?? undefined,
    dirty: false,
  }
}

// ─── toServer: local type → server row (used before PUSH) ───────────────────

export function habitToServer(h: Habit): Omit<ServerHabit, 'user_id'> {
  return {
    id: h.id,
    title: h.title,
    description: h.description ?? null,
    tags: h.tags,
    measurement_type: h.measurementType,
    target: h.target ?? null,
    unit: h.unit ?? null,
    recurrence: h.recurrence,
    start_date: h.startDate,
    end_date: h.endDate ?? null,
    reminder_time: h.reminderTime ?? null,
    color: h.color,
    icon: h.icon,
    archived: h.archived,
    world: h.world ?? 'personal',
    created_at: h.createdAt,
    updated_at: h.updatedAt,
    deleted_at: h.deletedAt ?? null,
    synced_at: h.syncedAt ?? null,
  }
}

export function taskToServer(t: Task): Omit<ServerTask, 'user_id'> {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    tags: t.tags,
    measurement_type: t.measurementType,
    target: t.target ?? null,
    unit: t.unit ?? null,
    due_date: t.dueDate,
    due_time: t.dueTime ?? null,
    priority: t.priority,
    status: t.status,
    completed_at: t.completedAt ?? null,
    progress: t.progress ?? null,
    color: t.color,
    icon: t.icon,
    world: t.world ?? 'personal',
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    deleted_at: t.deletedAt ?? null,
    synced_at: t.syncedAt ?? null,
  }
}

export function entryToServer(e: HabitEntry): Omit<ServerHabitEntry, 'user_id'> {
  return {
    id: e.id,
    habit_id: e.habitId,
    date: e.date,
    status: e.status,
    value: e.value ?? null,
    note: e.note ?? null,
    completed_at: e.completedAt ?? null,
    updated_at: e.updatedAt,
    deleted_at: e.deletedAt ?? null,
    synced_at: e.syncedAt ?? null,
  }
}

export function tagToServer(t: Tag): Omit<ServerTag, 'user_id'> {
  return {
    id: t.id,
    name: t.name,
    color: t.color,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    deleted_at: t.deletedAt ?? null,
    synced_at: t.syncedAt ?? null,
  }
}

// ─── Spending server types ───────────────────────────────────────────────────

export interface ServerSpendingAccount {
  id: string; user_id: string; name: string; type: string
  opening_balance: number; currency: string; color: string; icon: string; archived: boolean
  created_at: number; updated_at: number; deleted_at: number | null; synced_at: number | null
}
export interface ServerSpendingCategory {
  id: string; user_id: string; name: string; type: string; parent_id: string | null
  color: string; icon: string; archived: boolean
  created_at: number; updated_at: number; deleted_at: number | null; synced_at: number | null
}
export interface ServerSpendingTransaction {
  id: string; user_id: string; type: string; amount: number; currency: string
  date: string; account_id: string; to_account_id: string | null; category_id: string | null
  tags: string[]; note: string | null; payee: string | null; recurring_id: string | null
  created_at: number; updated_at: number; deleted_at: number | null; synced_at: number | null
}
export interface ServerSpendingBudget {
  id: string; user_id: string; name: string; amount: number; period: string
  start_date: string; end_date: string | null; category_ids: string[]; rollover: boolean
  created_at: number; updated_at: number; deleted_at: number | null; synced_at: number | null
}
export interface ServerSpendingRecurring {
  id: string; user_id: string; name: string; type: string; amount: number; currency: string
  account_id: string; to_account_id: string | null; category_id: string | null
  tags: string[]; note: string | null; payee: string | null; interval: string
  next_run_at: number; last_run_at: number | null; active: boolean
  created_at: number; updated_at: number; deleted_at: number | null; synced_at: number | null
}

// fromServer
export function spendingAccountFromServer(r: ServerSpendingAccount): SpendingAccount {
  return { id: r.id, ownerId: r.user_id, name: r.name, type: r.type as SpendingAccount['type'],
    openingBalance: r.opening_balance, currency: r.currency, color: r.color, icon: r.icon,
    archived: r.archived, createdAt: r.created_at, updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined, syncedAt: r.synced_at ?? undefined, dirty: false }
}
export function spendingCategoryFromServer(r: ServerSpendingCategory): SpendingCategory {
  return { id: r.id, ownerId: r.user_id, name: r.name, type: r.type as SpendingCategory['type'],
    parentId: r.parent_id ?? undefined, color: r.color, icon: r.icon, archived: r.archived,
    createdAt: r.created_at, updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined, syncedAt: r.synced_at ?? undefined, dirty: false }
}
export function spendingTransactionFromServer(r: ServerSpendingTransaction): SpendingTransaction {
  return { id: r.id, ownerId: r.user_id, type: r.type as SpendingTransaction['type'],
    amount: r.amount, currency: r.currency, date: r.date, accountId: r.account_id,
    toAccountId: r.to_account_id ?? undefined, categoryId: r.category_id ?? undefined,
    tags: r.tags ?? [], note: r.note ?? undefined, payee: r.payee ?? undefined,
    recurringId: r.recurring_id ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined, syncedAt: r.synced_at ?? undefined, dirty: false }
}
export function spendingBudgetFromServer(r: ServerSpendingBudget): SpendingBudget {
  return { id: r.id, ownerId: r.user_id, name: r.name, amount: r.amount,
    period: r.period as SpendingBudget['period'], startDate: r.start_date,
    endDate: r.end_date ?? undefined, categoryIds: r.category_ids ?? [], rollover: r.rollover,
    createdAt: r.created_at, updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined, syncedAt: r.synced_at ?? undefined, dirty: false }
}
export function spendingRecurringFromServer(r: ServerSpendingRecurring): SpendingRecurring {
  return { id: r.id, ownerId: r.user_id, name: r.name, type: r.type as SpendingRecurring['type'],
    amount: r.amount, currency: r.currency, accountId: r.account_id,
    toAccountId: r.to_account_id ?? undefined, categoryId: r.category_id ?? undefined,
    tags: r.tags ?? [], note: r.note ?? undefined, payee: r.payee ?? undefined,
    interval: r.interval as SpendingRecurring['interval'],
    nextRunAt: r.next_run_at, lastRunAt: r.last_run_at ?? undefined, active: r.active,
    createdAt: r.created_at, updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined, syncedAt: r.synced_at ?? undefined, dirty: false }
}

// toServer
export function spendingAccountToServer(a: SpendingAccount): Omit<ServerSpendingAccount, 'user_id'> {
  return { id: a.id, name: a.name, type: a.type, opening_balance: a.openingBalance,
    currency: a.currency, color: a.color, icon: a.icon, archived: a.archived,
    created_at: a.createdAt, updated_at: a.updatedAt,
    deleted_at: a.deletedAt ?? null, synced_at: a.syncedAt ?? null }
}
export function spendingCategoryToServer(c: SpendingCategory): Omit<ServerSpendingCategory, 'user_id'> {
  return { id: c.id, name: c.name, type: c.type, parent_id: c.parentId ?? null,
    color: c.color, icon: c.icon, archived: c.archived,
    created_at: c.createdAt, updated_at: c.updatedAt,
    deleted_at: c.deletedAt ?? null, synced_at: c.syncedAt ?? null }
}
export function spendingTransactionToServer(t: SpendingTransaction): Omit<ServerSpendingTransaction, 'user_id'> {
  return { id: t.id, type: t.type, amount: t.amount, currency: t.currency, date: t.date,
    account_id: t.accountId, to_account_id: t.toAccountId ?? null, category_id: t.categoryId ?? null,
    tags: t.tags ?? [], note: t.note ?? null, payee: t.payee ?? null,
    recurring_id: t.recurringId ?? null, created_at: t.createdAt, updated_at: t.updatedAt,
    deleted_at: t.deletedAt ?? null, synced_at: t.syncedAt ?? null }
}
export function spendingBudgetToServer(b: SpendingBudget): Omit<ServerSpendingBudget, 'user_id'> {
  return { id: b.id, name: b.name, amount: b.amount, period: b.period,
    start_date: b.startDate, end_date: b.endDate ?? null,
    category_ids: b.categoryIds, rollover: b.rollover,
    created_at: b.createdAt, updated_at: b.updatedAt,
    deleted_at: b.deletedAt ?? null, synced_at: b.syncedAt ?? null }
}
export function spendingRecurringToServer(r: SpendingRecurring): Omit<ServerSpendingRecurring, 'user_id'> {
  return { id: r.id, name: r.name, type: r.type, amount: r.amount, currency: r.currency,
    account_id: r.accountId, to_account_id: r.toAccountId ?? null, category_id: r.categoryId ?? null,
    tags: r.tags ?? [], note: r.note ?? null, payee: r.payee ?? null, interval: r.interval,
    next_run_at: r.nextRunAt, last_run_at: r.lastRunAt ?? null, active: r.active,
    created_at: r.createdAt, updated_at: r.updatedAt,
    deleted_at: r.deletedAt ?? null, synced_at: r.syncedAt ?? null }
}
