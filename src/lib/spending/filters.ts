import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import type { SpendingTransaction } from '@/types/spending'

export type SortKey = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
export type DateRangePreset = 'all' | 'week' | 'month' | 'custom'

export interface TransactionFilters {
  q?:           string
  type?:        'income' | 'expense' | 'transfer' | ''
  accountIds?:  string[]
  categoryIds?: string[]
  dateRange?:   DateRangePreset
  from?:        string   // 'YYYY-MM-DD', used when dateRange === 'custom'
  to?:          string
  minAmount?:   number
  maxAmount?:   number
  sort?:        SortKey
}

function resolvedDateRange(f: TransactionFilters): { from: string; to: string } | null {
  const now = new Date()
  if (f.dateRange === 'week') {
    return {
      from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      to:   format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    }
  }
  if (f.dateRange === 'month') {
    return {
      from: format(startOfMonth(now), 'yyyy-MM-dd'),
      to:   format(endOfMonth(now),   'yyyy-MM-dd'),
    }
  }
  if (f.dateRange === 'custom' && f.from && f.to) {
    return { from: f.from, to: f.to }
  }
  return null
}

export function filterAndSort(
  txns: SpendingTransaction[],
  filters: TransactionFilters,
): SpendingTransaction[] {
  const range = resolvedDateRange(filters)
  const q = filters.q?.trim().toLowerCase()

  const result = txns.filter(tx => {
    if (filters.type && tx.type !== filters.type) return false
    if (filters.accountIds?.length && !filters.accountIds.includes(tx.accountId)) return false
    if (filters.categoryIds?.length) {
      if (!tx.categoryId || !filters.categoryIds.includes(tx.categoryId)) return false
    }
    if (range && (tx.date < range.from || tx.date > range.to)) return false
    if (filters.minAmount != null && tx.amount < filters.minAmount) return false
    if (filters.maxAmount != null && tx.amount > filters.maxAmount) return false
    if (q) {
      const haystack = [tx.payee, tx.note, ...(tx.tags ?? [])].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const sort = filters.sort ?? 'date_desc'
  result.sort((a, b) => {
    switch (sort) {
      case 'date_asc':    return a.date !== b.date ? a.date.localeCompare(b.date)   : a.createdAt - b.createdAt
      case 'date_desc':   return b.date !== a.date ? b.date.localeCompare(a.date)   : b.createdAt - a.createdAt
      case 'amount_asc':  return a.amount - b.amount
      case 'amount_desc': return b.amount - a.amount
      default:            return b.date.localeCompare(a.date)
    }
  })

  return result
}

export function countActiveFilters(f: TransactionFilters): number {
  let n = 0
  if (f.type)                                         n++
  if (f.accountIds?.length)                           n++
  if (f.categoryIds?.length)                          n++
  if (f.dateRange && f.dateRange !== 'all')           n++
  if (f.minAmount != null || f.maxAmount != null)     n++
  return n
}

// ── URL serialisation ────────────────────────────────────────────────────────

export function filtersToParams(f: TransactionFilters): Record<string, string> {
  const p: Record<string, string> = {}
  if (f.q)                      p.q           = f.q
  if (f.type)                   p.type        = f.type
  if (f.accountIds?.length)     p.accounts    = f.accountIds.join(',')
  if (f.categoryIds?.length)    p.categories  = f.categoryIds.join(',')
  if (f.dateRange)              p.dateRange   = f.dateRange
  if (f.from)                   p.from        = f.from
  if (f.to)                     p.to          = f.to
  if (f.minAmount != null)      p.minAmount   = String(f.minAmount)
  if (f.maxAmount != null)      p.maxAmount   = String(f.maxAmount)
  if (f.sort && f.sort !== 'date_desc') p.sort = f.sort
  return p
}

export function filtersFromParams(params: URLSearchParams): TransactionFilters {
  return {
    q:           params.get('q')          || undefined,
    type:        (params.get('type')      || '') as TransactionFilters['type'],
    accountIds:  params.get('accounts')   ? params.get('accounts')!.split(',') : undefined,
    categoryIds: params.get('categories') ? params.get('categories')!.split(',') : undefined,
    dateRange:   (params.get('dateRange') || 'all') as DateRangePreset,
    from:        params.get('from')       || undefined,
    to:          params.get('to')         || undefined,
    minAmount:   params.get('minAmount')  ? Number(params.get('minAmount'))  : undefined,
    maxAmount:   params.get('maxAmount')  ? Number(params.get('maxAmount'))  : undefined,
    sort:        (params.get('sort')      || 'date_desc') as SortKey,
  }
}
