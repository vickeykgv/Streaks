import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Target, Pencil } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { budgetsRepo } from '@/db/repos/spending/budgets'
import { transactionsRepo } from '@/db/repos/spending/transactions'
import { categoriesRepo } from '@/db/repos/spending/categories'
import { settingsRepo } from '@/db/repos/settings'
import { computeBudgetProgress, budgetBarColor } from '@/lib/spending/budgets'
import { ProgressBar } from '@/components/ui'
import type { SpendingCategory } from '@/types/spending'

function formatAmount(n: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

export default function SpendingBudgets() {
  const navigate = useNavigate()
  const [currency, setCurrency] = useState('INR')
  useEffect(() => { settingsRepo.get<string>('baseCurrency', 'INR').then(setCurrency) }, [])

  const budgets      = useLiveQuery(() => budgetsRepo.getAll(), []) ?? []
  const transactions = useLiveQuery(() => transactionsRepo.getAll(), []) ?? []
  const categories   = useLiveQuery(() => categoriesRepo.getAll(true), []) ?? []

  const catMap = useMemo(() => {
    const m: Record<string, SpendingCategory> = {}
    for (const c of categories) m[c.id] = c
    return m
  }, [categories])

  const progresses = useMemo(
    () => budgets.map(b => computeBudgetProgress(b, transactions)),
    [budgets, transactions],
  )

  const totalMonthlyLimit = progresses
    .filter(p => p.budget.period === 'monthly')
    .reduce((s, p) => s + p.budget.amount, 0)

  const totalMonthlySpent = progresses
    .filter(p => p.budget.period === 'monthly')
    .reduce((s, p) => s + p.spent, 0)

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-3xl px-4 pt-4">

        {/* Header */}
        <div className="hero-panel rounded-[30px] px-5 py-5 mb-5">
          <div className="section-kicker mb-1">Planning</div>
          <div className="font-sans text-[30px] font-extrabold tracking-tight text-[var(--text-primary)]">Budgets</div>
          {budgets.length > 0 && (
            <p className="mt-1 font-sans text-[13px] text-[var(--text-secondary)]">
              {formatAmount(totalMonthlySpent, currency)} of {formatAmount(totalMonthlyLimit, currency)} monthly limit used
            </p>
          )}
        </div>

        {/* Budget list */}
        {progresses.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-[var(--bg-surface-2)]">
              <Target size={28} strokeWidth={1.5} color="var(--text-tertiary)" />
            </div>
            <p className="font-sans text-[15px] font-bold text-[var(--text-primary)]">No budgets yet</p>
            <p className="max-w-xs font-body text-[13px] text-[var(--text-tertiary)]">
              Set spending limits for categories and track your progress.
            </p>
            <button
              onClick={() => navigate('/spending/budgets/new')}
              className="mt-2 rounded-2xl px-6 py-3 font-sans text-[14px] font-extrabold text-white"
              style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
            >
              Create first budget
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {progresses.map(({ budget, spent, remaining, pct, from, to }) => {
              const barColor = budgetBarColor(pct)
              const isOver = pct >= 100

              return (
                <div
                  key={budget.id}
                  className="glass-panel rounded-[24px] px-5 py-4"
                  style={isOver ? { border: '1.5px solid #ef444466' } : {}}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-sans text-[16px] font-extrabold text-[var(--text-primary)]">{budget.name}</p>
                      <p className="font-sans text-[11px] text-[var(--text-tertiary)] mt-0.5 capitalize">
                        {budget.period} · {format(parseISO(from), 'MMM d')} – {format(parseISO(to), 'MMM d')}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/spending/budgets/edit/${budget.id}`)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-surface-2)]"
                    >
                      <Pencil size={14} color="var(--text-secondary)" />
                    </button>
                  </div>

                  {/* Category tags */}
                  {budget.categoryIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {budget.categoryIds.map(cid => {
                        const c = catMap[cid]
                        return c ? (
                          <span
                            key={cid}
                            className="rounded-full px-2.5 py-0.5 font-sans text-[11px] font-bold"
                            style={{ background: c.color + '22', color: c.color }}
                          >
                            {c.icon} {c.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="mb-2">
                    <ProgressBar value={pct} color={barColor} size="md" />
                  </div>

                  {/* Amounts row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-sans text-[13px] font-bold" style={{ color: barColor }}>
                        {formatAmount(spent, currency)} spent
                      </span>
                      <span className="font-sans text-[12px] text-[var(--text-tertiary)]">
                        {' '}of {formatAmount(budget.amount, currency)}
                      </span>
                    </div>
                    {isOver ? (
                      <span className="font-sans text-[12px] font-bold text-[#ef4444]">
                        {formatAmount(spent - budget.amount, currency)} over
                      </span>
                    ) : (
                      <span className="font-sans text-[12px] text-[var(--text-secondary)]">
                        {formatAmount(remaining, currency)} left
                      </span>
                    )}
                  </div>

                  {budget.rollover && (
                    <p className="mt-1.5 font-sans text-[11px] text-[var(--text-tertiary)]">↩ Rollover enabled</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/spending/budgets/new')}
        className="fixed bottom-40 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:scale-90 transition-transform"
        style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
        aria-label="Add budget"
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
      </button>
    </div>
  )
}
