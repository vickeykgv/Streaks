import type { Habit, Task, HabitEntry, Tag } from '@/types'
import type {
  SpendingAccount, SpendingCategory, SpendingTransaction,
  SpendingBudget, SpendingRecurring,
} from '@/types/spending'
import type {
  MotoVehicle, MotoFuelLog, MotoService, MotoPart,
  MotoIssue, MotoNote, MotoDocument,
} from '@/types/moto'

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

// ─── Moto server types ────────────────────────────────────────────────────────

export interface ServerMotoVehicle {
  id: string; user_id: string; name: string; make: string; model: string; year: number
  registration_no: string; vehicle_type: string; fuel_type: string
  tank_capacity_l: number | null; purchase_date: string | null; purchase_odo_km: number | null
  current_odo_km: number; color: string; archived: boolean
  created_at: number; updated_at: number; deleted_at: number | null; synced_at: number | null
}
export interface ServerMotoFuelLog {
  id: string; user_id: string; vehicle_id: string; date: string
  odo_km: number; litres: number; price_per_l: number; total_cost: number
  fuel_type: string; station: string | null; full_tank: boolean; note: string | null
  created_at: number; updated_at: number; deleted_at: number | null; synced_at: number | null
}
export interface ServerMotoService {
  id: string; user_id: string; vehicle_id: string; date: string; odo_km: number
  service_type: string; workshop: string | null; labor_cost: number; parts_cost: number; total_cost: number
  next_due_date: string | null; next_due_odo_km: number | null; note: string | null
  linked_issue_ids: string[]
  created_at: number; updated_at: number; deleted_at: number | null; synced_at: number | null
}
export interface ServerMotoPart {
  id: string; user_id: string; vehicle_id: string; part_name: string
  part_number: string | null; brand: string | null; installed_at: string; odo_km_at_install: number; cost: number
  expected_life_km: number | null; expected_life_months: number | null; linked_service_id: string | null; note: string | null
  created_at: number; updated_at: number; deleted_at: number | null; synced_at: number | null
}
export interface ServerMotoIssue {
  id: string; user_id: string; vehicle_id: string; title: string; description: string | null
  status: string; priority: string; reported_at: string; resolved_at: string | null
  resolved_by_service_id: string | null
  created_at: number; updated_at: number; deleted_at: number | null; synced_at: number | null
}
export interface ServerMotoNote {
  id: string; user_id: string; vehicle_id: string; title: string | null; body: string; pinned: boolean
  created_at: number; updated_at: number; deleted_at: number | null; synced_at: number | null
}
export interface ServerMotoDocument {
  id: string; user_id: string; vehicle_id: string | null; type: string
  provider: string | null; policy_no: string | null; issued_date: string | null
  expiry_date: string; premium: number | null; reminder_days_before: number; note: string | null
  created_at: number; updated_at: number; deleted_at: number | null; synced_at: number | null
}

// fromServer
export function motoVehicleFromServer(r: ServerMotoVehicle): MotoVehicle {
  return { id: r.id, ownerId: r.user_id, name: r.name, make: r.make, model: r.model, year: r.year,
    registrationNo: r.registration_no, vehicleType: r.vehicle_type as MotoVehicle['vehicleType'],
    fuelType: r.fuel_type as MotoVehicle['fuelType'],
    tankCapacityL: r.tank_capacity_l ?? undefined, purchaseDate: r.purchase_date ?? undefined,
    purchaseOdoKm: r.purchase_odo_km ?? undefined, currentOdoKm: r.current_odo_km,
    color: r.color, archived: r.archived,
    createdAt: r.created_at, updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined, syncedAt: r.synced_at ?? undefined, dirty: false }
}
export function motoFuelLogFromServer(r: ServerMotoFuelLog): MotoFuelLog {
  return { id: r.id, ownerId: r.user_id, vehicleId: r.vehicle_id, date: r.date,
    odoKm: r.odo_km, litres: r.litres, pricePerL: r.price_per_l, totalCost: r.total_cost,
    fuelType: r.fuel_type as MotoFuelLog['fuelType'], station: r.station ?? undefined,
    fullTank: r.full_tank, note: r.note ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined, syncedAt: r.synced_at ?? undefined, dirty: false }
}
export function motoServiceFromServer(r: ServerMotoService): MotoService {
  return { id: r.id, ownerId: r.user_id, vehicleId: r.vehicle_id, date: r.date, odoKm: r.odo_km,
    serviceType: r.service_type as MotoService['serviceType'], workshop: r.workshop ?? undefined,
    laborCost: r.labor_cost, partsCost: r.parts_cost, totalCost: r.total_cost,
    nextDueDate: r.next_due_date ?? undefined, nextDueOdoKm: r.next_due_odo_km ?? undefined,
    note: r.note ?? undefined, linkedIssueIds: r.linked_issue_ids ?? [],
    createdAt: r.created_at, updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined, syncedAt: r.synced_at ?? undefined, dirty: false }
}
export function motoPartFromServer(r: ServerMotoPart): MotoPart {
  return { id: r.id, ownerId: r.user_id, vehicleId: r.vehicle_id, partName: r.part_name,
    partNumber: r.part_number ?? undefined, brand: r.brand ?? undefined,
    installedAt: r.installed_at, odoKmAtInstall: r.odo_km_at_install, cost: r.cost,
    expectedLifeKm: r.expected_life_km ?? undefined, expectedLifeMonths: r.expected_life_months ?? undefined,
    linkedServiceId: r.linked_service_id ?? undefined, note: r.note ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined, syncedAt: r.synced_at ?? undefined, dirty: false }
}
export function motoIssueFromServer(r: ServerMotoIssue): MotoIssue {
  return { id: r.id, ownerId: r.user_id, vehicleId: r.vehicle_id, title: r.title,
    description: r.description ?? undefined, status: r.status as MotoIssue['status'],
    priority: r.priority as MotoIssue['priority'], reportedAt: r.reported_at,
    resolvedAt: r.resolved_at ?? undefined, resolvedByServiceId: r.resolved_by_service_id ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined, syncedAt: r.synced_at ?? undefined, dirty: false }
}
export function motoNoteFromServer(r: ServerMotoNote): MotoNote {
  return { id: r.id, ownerId: r.user_id, vehicleId: r.vehicle_id, title: r.title ?? undefined,
    body: r.body, pinned: r.pinned,
    createdAt: r.created_at, updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined, syncedAt: r.synced_at ?? undefined, dirty: false }
}
export function motoDocumentFromServer(r: ServerMotoDocument): MotoDocument {
  return { id: r.id, ownerId: r.user_id, vehicleId: r.vehicle_id ?? undefined, type: r.type as MotoDocument['type'],
    provider: r.provider ?? undefined, policyNo: r.policy_no ?? undefined,
    issuedDate: r.issued_date ?? undefined, expiryDate: r.expiry_date,
    premium: r.premium ?? undefined, reminderDaysBefore: r.reminder_days_before, note: r.note ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined, syncedAt: r.synced_at ?? undefined, dirty: false }
}

// toServer
export function motoVehicleToServer(v: MotoVehicle): Omit<ServerMotoVehicle, 'user_id'> {
  return { id: v.id, name: v.name, make: v.make, model: v.model, year: v.year,
    registration_no: v.registrationNo, vehicle_type: v.vehicleType, fuel_type: v.fuelType,
    tank_capacity_l: v.tankCapacityL ?? null, purchase_date: v.purchaseDate ?? null,
    purchase_odo_km: v.purchaseOdoKm ?? null, current_odo_km: v.currentOdoKm,
    color: v.color, archived: v.archived,
    created_at: v.createdAt, updated_at: v.updatedAt,
    deleted_at: v.deletedAt ?? null, synced_at: v.syncedAt ?? null }
}
export function motoFuelLogToServer(l: MotoFuelLog): Omit<ServerMotoFuelLog, 'user_id'> {
  return { id: l.id, vehicle_id: l.vehicleId, date: l.date,
    odo_km: l.odoKm, litres: l.litres, price_per_l: l.pricePerL, total_cost: l.totalCost,
    fuel_type: l.fuelType, station: l.station ?? null, full_tank: l.fullTank, note: l.note ?? null,
    created_at: l.createdAt, updated_at: l.updatedAt,
    deleted_at: l.deletedAt ?? null, synced_at: l.syncedAt ?? null }
}
export function motoServiceToServer(s: MotoService): Omit<ServerMotoService, 'user_id'> {
  return { id: s.id, vehicle_id: s.vehicleId, date: s.date, odo_km: s.odoKm,
    service_type: s.serviceType, workshop: s.workshop ?? null,
    labor_cost: s.laborCost, parts_cost: s.partsCost, total_cost: s.totalCost,
    next_due_date: s.nextDueDate ?? null, next_due_odo_km: s.nextDueOdoKm ?? null,
    note: s.note ?? null, linked_issue_ids: s.linkedIssueIds,
    created_at: s.createdAt, updated_at: s.updatedAt,
    deleted_at: s.deletedAt ?? null, synced_at: s.syncedAt ?? null }
}
export function motoPartToServer(p: MotoPart): Omit<ServerMotoPart, 'user_id'> {
  return { id: p.id, vehicle_id: p.vehicleId, part_name: p.partName,
    part_number: p.partNumber ?? null, brand: p.brand ?? null,
    installed_at: p.installedAt, odo_km_at_install: p.odoKmAtInstall, cost: p.cost,
    expected_life_km: p.expectedLifeKm ?? null, expected_life_months: p.expectedLifeMonths ?? null,
    linked_service_id: p.linkedServiceId ?? null, note: p.note ?? null,
    created_at: p.createdAt, updated_at: p.updatedAt,
    deleted_at: p.deletedAt ?? null, synced_at: p.syncedAt ?? null }
}
export function motoIssueToServer(i: MotoIssue): Omit<ServerMotoIssue, 'user_id'> {
  return { id: i.id, vehicle_id: i.vehicleId, title: i.title,
    description: i.description ?? null, status: i.status, priority: i.priority,
    reported_at: i.reportedAt, resolved_at: i.resolvedAt ?? null,
    resolved_by_service_id: i.resolvedByServiceId ?? null,
    created_at: i.createdAt, updated_at: i.updatedAt,
    deleted_at: i.deletedAt ?? null, synced_at: i.syncedAt ?? null }
}
export function motoNoteToServer(n: MotoNote): Omit<ServerMotoNote, 'user_id'> {
  return { id: n.id, vehicle_id: n.vehicleId, title: n.title ?? null, body: n.body, pinned: n.pinned,
    created_at: n.createdAt, updated_at: n.updatedAt,
    deleted_at: n.deletedAt ?? null, synced_at: n.syncedAt ?? null }
}
export function motoDocumentToServer(d: MotoDocument): Omit<ServerMotoDocument, 'user_id'> {
  return { id: d.id, vehicle_id: d.vehicleId ?? null, type: d.type,
    provider: d.provider ?? null, policy_no: d.policyNo ?? null,
    issued_date: d.issuedDate ?? null, expiry_date: d.expiryDate,
    premium: d.premium ?? null, reminder_days_before: d.reminderDaysBefore, note: d.note ?? null,
    created_at: d.createdAt, updated_at: d.updatedAt,
    deleted_at: d.deletedAt ?? null, synced_at: d.syncedAt ?? null }
}

// toServer (spending)
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
