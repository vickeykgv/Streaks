import type { Habit, Task, HabitEntry, Tag } from '@/types'

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
