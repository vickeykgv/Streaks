import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  differenceInCalendarDays,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
import { transactionsRepo } from '@/db/repos/spending/transactions'
import { accountsRepo } from '@/db/repos/spending/accounts'
import { categoriesRepo } from '@/db/repos/spending/categories'
import { budgetsRepo } from '@/db/repos/spending/budgets'
import { computeBudgetProgress } from '@/lib/spending/budgets'

export type SpendingPeriod = 'month' | 'week'

export function useSpendingDashboard(period: SpendingPeriod) {
  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    if (period === 'week') {
      return {
        startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        endDate:   format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      }
    }
    return {
      startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
      endDate:   format(endOfMonth(now),   'yyyy-MM-dd'),
    }
  }, [period])

  const periodTxns  = useLiveQuery(() => transactionsRepo.getByDateRange(startDate, endDate), [startDate, endDate]) ?? []
  const allTxns     = useLiveQuery(() => transactionsRepo.getAll(), []) ?? []
  const accounts    = useLiveQuery(() => accountsRepo.getAll(), []) ?? []
  const categories  = useLiveQuery(() => categoriesRepo.getAll(true), []) ?? []
  const budgets     = useLiveQuery(() => budgetsRepo.getAll(), []) ?? []

  const isLoading = periodTxns === undefined || accounts === undefined

  // ── Period aggregates ──────────────────────────────────────────────────────
  const totalIncome  = periodTxns.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0)
  const totalExpense = periodTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = totalIncome - totalExpense

  // ── Top expense categories ─────────────────────────────────────────────────
  const expenseByCategory: Record<string, number> = {}
  for (const tx of periodTxns) {
    if (tx.type === 'expense' && tx.categoryId) {
      expenseByCategory[tx.categoryId] = (expenseByCategory[tx.categoryId] ?? 0) + tx.amount
    }
  }
  const topCategories = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId)
      return { catId, amount, name: cat?.name ?? 'Unknown', icon: cat?.icon ?? '📦', color: cat?.color ?? '#6b7280' }
    })

  // ── Account balances (computed from all-time transactions) ─────────────────
  const accountBalances = accounts.map(acc => {
    let balance = acc.openingBalance
    for (const tx of allTxns) {
      if (tx.type === 'expense' && tx.accountId === acc.id) {
        balance -= tx.amount
      } else if (tx.type === 'income' && tx.accountId === acc.id) {
        balance += tx.amount
      } else if (tx.type === 'transfer') {
        if (tx.accountId === acc.id)   balance -= tx.amount
        if (tx.toAccountId === acc.id) balance += tx.amount
      }
    }
    return { ...acc, balance }
  })

  // ── Recent 5 transactions in the period ────────────────────────────────────
  const recentTransactions = [...periodTxns]
    .sort((a, b) => b.date !== a.date ? b.date.localeCompare(a.date) : b.createdAt - a.createdAt)
    .slice(0, 8)

  // ── Biggest single expense ─────────────────────────────────────────────────
  const biggestExpense = periodTxns
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)[0] ?? null

  const budgetProgresses = budgets.map(b => computeBudgetProgress(b, allTxns))

  // Period-matched budgets for the metric cards (Budget Used %)
  const activeBudgetProgresses = budgetProgresses.filter(p =>
    p.budget.period === (period === 'week' ? 'weekly' : 'monthly'),
  )
  const totalBudget = activeBudgetProgresses.reduce((sum, item) => sum + item.budget.amount, 0)
  const totalBudgetSpent = activeBudgetProgresses.reduce((sum, item) => sum + item.spent, 0)

  // All budgets sorted by risk for the health panel and alerts
  const allBudgetProgresses = [...budgetProgresses].sort((a, b) => b.pct - a.pct)
  const overBudgetCount = allBudgetProgresses.filter(item => item.pct >= 100).length
  const nearLimitCount = allBudgetProgresses.filter(item => item.pct >= 80 && item.pct < 100).length
  const totalDaysInPeriod = Math.max(1, differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1)
  const elapsedDays = Math.min(
    totalDaysInPeriod,
    Math.max(1, differenceInCalendarDays(new Date(), new Date(startDate)) + 1),
  )
  const avgDailyExpense = totalExpense / elapsedDays
  const projectedExpense = avgDailyExpense * totalDaysInPeriod
  const spendingPacePct = totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0
  const timeProgressPct = (elapsedDays / totalDaysInPeriod) * 100
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : null
  const topSpendCategory = topCategories[0] ?? null

  const categoryMap: Record<string, { name: string; icon: string; color: string }> = {}
  for (const c of categories) categoryMap[c.id] = { name: c.name, icon: c.icon, color: c.color }

  const accountMap: Record<string, string> = {}
  for (const a of accounts) accountMap[a.id] = `${a.icon} ${a.name}`

  return {
    totalIncome,
    totalExpense,
    net,
    topCategories,
    accountBalances,
    recentTransactions,
    biggestExpense,
    topSpendCategory,
    categoryMap,
    accountMap,
    activeBudgetProgresses,
    allBudgetProgresses,
    totalBudget,
    totalBudgetSpent,
    overBudgetCount,
    nearLimitCount,
    avgDailyExpense,
    projectedExpense,
    spendingPacePct,
    timeProgressPct,
    savingsRate,
    elapsedDays,
    totalDaysInPeriod,
    isLoading,
    transactionCount: periodTxns.length,
    startDate,
    endDate,
  }
}
