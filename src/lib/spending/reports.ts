import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns'
import type { SpendingTransaction, SpendingCategory } from '@/types/spending'

export type ReportPeriod = '3m' | '6m' | '12m' | 'year' | 'lastyear'

export interface MonthlyBar {
  month: string        // 'Jan', 'Feb', …
  income: number
  expense: number
}

export interface CategorySlice {
  catId: string
  name: string
  icon: string
  color: string
  amount: number
  pct: number
}

export interface ReportData {
  totalIncome: number
  totalExpense: number
  net: number
  savingsRate: number       // (income - expense) / income * 100, NaN if no income
  avgDailyExpense: number
  monthlyBars: MonthlyBar[]
  topCategories: CategorySlice[]
  topPayees: { payee: string; amount: number }[]
}

function periodRange(p: ReportPeriod): { from: string; to: string } {
  const now = new Date()
  if (p === 'year')     return { from: format(startOfYear(now), 'yyyy-MM-dd'), to: format(endOfYear(now), 'yyyy-MM-dd') }
  if (p === 'lastyear') {
    const y = subMonths(now, 12)
    return { from: format(startOfYear(y), 'yyyy-MM-dd'), to: format(endOfYear(y), 'yyyy-MM-dd') }
  }
  const months = p === '3m' ? 3 : p === '6m' ? 6 : 12
  return {
    from: format(startOfMonth(subMonths(now, months - 1)), 'yyyy-MM-dd'),
    to:   format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

function monthCount(p: ReportPeriod): number {
  if (p === 'year' || p === 'lastyear' || p === '12m') return 12
  if (p === '6m') return 6
  return 3
}

export function computeReportData(
  transactions: SpendingTransaction[],
  categories: SpendingCategory[],
  period: ReportPeriod,
): ReportData {
  const { from, to } = periodRange(period)
  const catMap: Record<string, SpendingCategory> = {}
  for (const c of categories) catMap[c.id] = c

  const inPeriod = transactions.filter(t => t.date >= from && t.date <= to)
  const incomes  = inPeriod.filter(t => t.type === 'income')
  const expenses = inPeriod.filter(t => t.type === 'expense')

  const totalIncome  = incomes.reduce((s, t)  => s + t.amount, 0)
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)
  const net          = totalIncome - totalExpense
  const savingsRate  = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : NaN

  // ── Monthly bars ────────────────────────────────────────────────────────────
  const mCount = monthCount(period)
  const refDate = period === 'lastyear' ? subMonths(new Date(), 12) : new Date()
  const monthlyBars: MonthlyBar[] = []
  for (let i = mCount - 1; i >= 0; i--) {
    const mDate = subMonths(refDate, i)
    const mFrom = format(startOfMonth(mDate), 'yyyy-MM-dd')
    const mTo   = format(endOfMonth(mDate),   'yyyy-MM-dd')
    const mIncome  = inPeriod.filter(t => t.type === 'income'  && t.date >= mFrom && t.date <= mTo).reduce((s, t) => s + t.amount, 0)
    const mExpense = inPeriod.filter(t => t.type === 'expense' && t.date >= mFrom && t.date <= mTo).reduce((s, t) => s + t.amount, 0)
    monthlyBars.push({ month: format(parseISO(mFrom), 'MMM'), income: mIncome, expense: mExpense })
  }

  // ── Category breakdown ──────────────────────────────────────────────────────
  const byCat: Record<string, number> = {}
  for (const t of expenses) {
    if (t.categoryId) byCat[t.categoryId] = (byCat[t.categoryId] ?? 0) + t.amount
  }
  const topCategories: CategorySlice[] = Object.entries(byCat)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([catId, amount]) => {
      const c = catMap[catId]
      return { catId, name: c?.name ?? 'Unknown', icon: c?.icon ?? '📦', color: c?.color ?? '#6b7280', amount, pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0 }
    })

  // ── Top payees ──────────────────────────────────────────────────────────────
  const byPayee: Record<string, number> = {}
  for (const t of expenses) {
    if (t.payee) byPayee[t.payee] = (byPayee[t.payee] ?? 0) + t.amount
  }
  const topPayees = Object.entries(byPayee)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([payee, amount]) => ({ payee, amount }))

  // Days in range
  const fromMs = parseISO(from).getTime()
  const toMs   = parseISO(to).getTime()
  const days   = Math.max(1, Math.round((toMs - fromMs) / 86_400_000) + 1)
  const avgDailyExpense = totalExpense / days

  return { totalIncome, totalExpense, net, savingsRate, avgDailyExpense, monthlyBars, topCategories, topPayees }
}

export function periodLabel(p: ReportPeriod): string {
  switch (p) {
    case '3m':       return 'Last 3 months'
    case '6m':       return 'Last 6 months'
    case '12m':      return 'Last 12 months'
    case 'year':     return 'This year'
    case 'lastyear': return 'Last year'
  }
}
