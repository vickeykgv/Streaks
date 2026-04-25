import Dexie, { type Table } from 'dexie'
import type { Habit, Task, HabitEntry, Tag, Settings } from '@/types'

export class HabitTrackerDB extends Dexie {
  habits!: Table<Habit, string>
  tasks!: Table<Task, string>
  habitEntries!: Table<HabitEntry, string>
  tags!: Table<Tag, string>
  settings!: Table<Settings, string>

  constructor() {
    super('HabitTrackerDB')

    this.version(1).stores({
      habits:       'id, archived, *tags, dirty, updatedAt, ownerId',
      tasks:        'id, status, dueDate, *tags, priority, dirty, updatedAt, ownerId',
      habitEntries: 'id, habitId, date, [habitId+date], dirty, updatedAt',
      tags:         'id, name',
      settings:     'key',
    })

    this.version(2).stores({
      habits: 'id, archived, *tags, dirty, updatedAt, ownerId, world',
      tasks:  'id, status, dueDate, *tags, priority, dirty, updatedAt, ownerId, world',
    }).upgrade(tx =>
      Promise.all([
        tx.table('habits').toCollection().modify((h: Record<string, unknown>) => { h['world'] ??= 'personal' }),
        tx.table('tasks').toCollection().modify((t: Record<string, unknown>) => { t['world'] ??= 'personal' }),
      ])
    )
  }
}

export const db = new HabitTrackerDB()
