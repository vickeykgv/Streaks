import Dexie, { type Table } from 'dexie'
import type { Habit, Task, HabitEntry, Tag, Settings } from '@/types'
import type { SpendingAccount, SpendingCategory, SpendingTransaction, SpendingBudget, SpendingRecurring } from '@/types/spending'
import type { MotoVehicle, MotoFuelLog, MotoService, MotoPart, MotoIssue, MotoNote, MotoDocument, MotoVehicleDoc, MotoMaintenanceItem } from '@/types/moto'

export class HabitTrackerDB extends Dexie {
  habits!: Table<Habit, string>
  tasks!: Table<Task, string>
  habitEntries!: Table<HabitEntry, string>
  tags!: Table<Tag, string>
  settings!: Table<Settings, string>
  spendingAccounts!: Table<SpendingAccount, string>
  spendingCategories!: Table<SpendingCategory, string>
  spendingTransactions!: Table<SpendingTransaction, string>
  spendingBudgets!: Table<SpendingBudget, string>
  spendingRecurring!: Table<SpendingRecurring, string>
  motoVehicles!:  Table<MotoVehicle, string>
  motoFuelLogs!:  Table<MotoFuelLog, string>
  motoServices!:  Table<MotoService, string>
  motoParts!:     Table<MotoPart, string>
  motoIssues!:    Table<MotoIssue, string>
  motoNotes!:     Table<MotoNote, string>
  motoDocuments!:         Table<MotoDocument, string>
  motoVehicleDocs!:       Table<MotoVehicleDoc, string>
  motoMaintenanceItems!:  Table<MotoMaintenanceItem, string>

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

    this.version(3).stores({
      tags: 'id, name, updatedAt, dirty',
    }).upgrade(tx =>
      tx.table('tags').toCollection().modify((tag: Record<string, unknown>) => {
        tag['updatedAt'] ??= Date.now()
        tag['dirty'] = true
      })
    )

    this.version(4).stores({
      spendingAccounts:     'id, archived, dirty, updatedAt, ownerId',
      spendingCategories:   'id, type, parentId, dirty, updatedAt, ownerId',
      spendingTransactions: 'id, date, accountId, categoryId, type, recurringId, dirty, updatedAt, ownerId, *tags',
      spendingBudgets:      'id, period, dirty, updatedAt, ownerId',
      spendingRecurring:    'id, nextRunAt, dirty, updatedAt, ownerId',
    })

    this.version(5).stores({
      motoVehicles:  'id, archived, dirty, updatedAt, ownerId',
      motoFuelLogs:  'id, vehicleId, date, dirty, updatedAt, ownerId',
      motoServices:  'id, vehicleId, date, dirty, updatedAt, ownerId',
      motoParts:     'id, vehicleId, installedAt, dirty, updatedAt, ownerId',
      motoIssues:    'id, vehicleId, status, priority, dirty, updatedAt, ownerId',
      motoNotes:     'id, vehicleId, dirty, updatedAt, ownerId',
      motoDocuments: 'id, vehicleId, type, expiryDate, dirty, updatedAt, ownerId',
    })

    this.version(6).stores({
      motoVehicleDocs:      'id, vehicleId, dirty, updatedAt, ownerId',
      motoMaintenanceItems: 'id, vehicleId, checked, dirty, updatedAt, ownerId',
    })
  }
}

export const db = new HabitTrackerDB()
