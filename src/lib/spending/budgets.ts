import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import type { SpendingBudget, SpendingTransaction } from '@/types/spending'

export interface BudgetProgress {
  budget: SpendingBudget
  spent: number
  remaining: number
  pct: number        // 0–100
  from: string
  to: string
}

export function budgetDateRange(b: SpendingBudget): { from: string; to: string } {
  const now = new Date()
  switch (b.period) {
    case 'weekly':
      return {
        from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        to:   format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      }
    case 'yearly':
      return {
        from: format(startOfYear(now), 'yyyy-MM-dd'),
        to:   format(endOfYear(now),   'yyyy-MM-dd'),
      }
    case 'custom':
      return { from: b.startDate, to: b.endDate ?? format(now, 'yyyy-MM-dd') }
    case 'monthly':
    default:
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to:   format(endOfMonth(now),   'yyyy-MM-dd'),
      }
  }
}

export function computeBudgetProgress(
  budget: SpendingBudget,
  transactions: SpendingTransaction[],
): BudgetProgress {
  const { from, to } = budgetDateRange(budget)
  const relevant = transactions.filter(t =>
    t.type === 'expense' &&
    t.date >= from &&
    t.date <= to &&
    (budget.categoryIds.length === 0 ||
      (t.categoryId != null && budget.categoryIds.includes(t.categoryId))),
  )
  const spent = relevant.reduce((s, t) => s + t.amount, 0)
  const pct   = budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0
  return {
    budget,
    spent,
    remaining: Math.max(0, budget.amount - spent),
    pct,
    from,
    to,
  }
}

export function budgetBarColor(pct: number): string {
  if (pct >= 100) return '#ef4444'
  if (pct >= 80)  return '#f97316'
  if (pct >= 60)  return '#eab308'
  return '#22c55e'
}
