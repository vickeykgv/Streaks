import type { SyncMeta } from '@/types'

export type SpendingInterval = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export type AccountType = 'cash' | 'bank' | 'credit_card' | 'wallet' | 'other'
export type TransactionType = 'income' | 'expense' | 'transfer'
export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly' | 'custom'
export type CategoryType = 'income' | 'expense'

export interface SpendingAccount extends SyncMeta {
  id: string
  name: string
  type: AccountType
  openingBalance: number
  currency: string
  color: string
  icon: string
  archived: boolean
  createdAt: number
}

export interface SpendingCategory extends SyncMeta {
  id: string
  name: string
  type: CategoryType
  parentId?: string
  color: string
  icon: string
  archived: boolean
  createdAt: number
}

export interface SpendingTransaction extends SyncMeta {
  id: string
  type: TransactionType
  amount: number
  currency: string
  date: string           // 'YYYY-MM-DD'
  accountId: string
  toAccountId?: string   // for transfers
  categoryId?: string
  tags: string[]
  note?: string
  payee?: string
  recurringId?: string
  createdAt: number
}

export interface SpendingBudget extends SyncMeta {
  id: string
  name: string
  amount: number
  period: BudgetPeriod
  startDate: string      // 'YYYY-MM-DD'
  endDate?: string
  categoryIds: string[]
  rollover: boolean
  createdAt: number
}

export interface SpendingRecurring extends SyncMeta {
  id: string
  name: string
  type: TransactionType
  amount: number
  currency: string
  accountId: string
  toAccountId?: string
  categoryId?: string
  tags: string[]
  note?: string
  payee?: string
  interval: SpendingInterval
  nextRunAt: number      // ms timestamp
  lastRunAt?: number
  active: boolean
  createdAt: number
}
