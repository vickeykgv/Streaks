export type MeasurementType = 'checkbox' | 'count' | 'duration' | 'numeric' | 'rating'

export type RecurrenceType = 'daily' | 'weekly' | 'custom'

export interface Recurrence {
  type: RecurrenceType
  daysOfWeek?: number[]   // 0 = Sun, 6 = Sat
  interval?: number        // e.g. every 2 days
}

export interface SyncMeta {
  updatedAt: number        // ms timestamp
  syncedAt?: number
  deletedAt?: number       // tombstone
  dirty: boolean
  ownerId?: string
}

export type World = 'personal' | 'professional'

export interface Habit extends SyncMeta {
  id: string
  title: string
  description?: string
  tags: string[]
  measurementType: MeasurementType
  target?: number
  unit?: string
  recurrence: Recurrence
  startDate: string        // 'YYYY-MM-DD'
  endDate?: string
  reminderTime?: string    // 'HH:mm'
  color: string
  icon: string
  archived: boolean
  world?: World
  createdAt: number
}

export interface Task extends SyncMeta {
  id: string
  title: string
  description?: string
  tags: string[]
  measurementType: MeasurementType
  target?: number
  unit?: string
  dueDate: string          // 'YYYY-MM-DD'
  dueTime?: string         // 'HH:mm'
  priority: 'low' | 'med' | 'high'
  status: 'pending' | 'done' | 'skipped'
  completedAt?: number
  progress?: number
  color: string
  icon: string
  world?: World
  createdAt: number
}

export type EntryStatus = 'done' | 'partial' | 'skipped' | 'pending'

export interface HabitEntry extends Pick<SyncMeta, 'updatedAt' | 'syncedAt' | 'deletedAt' | 'dirty'> {
  id: string               // `${habitId}_${YYYY-MM-DD}`
  habitId: string
  date: string             // 'YYYY-MM-DD'
  status: EntryStatus
  value?: number
  note?: string
  completedAt?: number
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface Settings {
  key: string
  value: unknown
}
