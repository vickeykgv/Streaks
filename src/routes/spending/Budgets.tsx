import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Target, Pencil, TrendingDown, AlertTriangle, CheckCircle2, ArrowLeftRight, Wallet, Tag, CalendarClock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { budgetsRepo } from '@/db/repos/spending/budgets'
import { transactionsRepo } from '@/db/repos/spending/transactions'
import { categoriesRepo } from '@/db/repos/spending/categories'
import { settingsRepo } from '@/db/repos/settings'
import { computeBudgetProgress, budgetBarColor } from '@/lib/spending/budgets'
import { ProgressBar, Modal, BottomSheet } from '@/components/ui'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import { ActionDropdown } from '@/components/ActionDropdown'
import BudgetEditor from '@/routes/spending/BudgetEditor'
import { openSpendingEditor } from '@/store/spendingEditor'
import type { SpendingCategory } from '@/types/spending'

function formatAmount(n: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

export default function SpendingBudgets() {
  const navigate = useNavigate()
  const [currency, setCurrency] = useState('INR')
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false,
  )
  const [editorState, setEditorState] = useState<{ open: boolean; id?: string }>({ open: false })

  useEffect(() => { settingsRepo.get<string>('baseCurrency', 'INR').then(setCurrency) }, [])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const sync = (e?: MediaQueryListEvent) => setIsDesktop(e ? e.matches : media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const openNew  = () => setEditorState({ open: true })
  const openEdit = (id: string) => setEditorState({ open: true, id })
  const closeEditor = () => setEditorState({ open: false })

  const budgets      = useLiveQuery(() => budgetsRepo.getAll(), []) ?? []
  const transactions = useLiveQuery(() => transactionsRepo.getAll(), []) ?? []
  const categories   = useLiveQuery(() => categoriesRepo.getAll(true), []) ?? []

  const catMap = useMemo(() => {
    const m: Record<string, SpendingCategory> = {}
    for (const c of categories) m[c.id] = c
    return m
  }, [categories])

  const progresses = useMemo(
    () => budgets
      .map(b => computeBudgetProgress(b, transactions))
      .sort((a, b) => b.pct - a.pct),
    [budgets, transactions],
  )

  const totalMonthlyLimit = progresses
    .filter(p => p.budget.period === 'monthly')
    .reduce((s, p) => s + p.budget.amount, 0)

  const totalMonthlySpent = progresses
    .filter(p => p.budget.period === 'monthly')
    .reduce((s, p) => s + p.spent, 0)

  const overBudgetCount = progresses.filter(p => p.pct >= 100).length
  const nearLimitCount  = progresses.filter(p => p.pct >= 80 && p.pct < 100).length
  const healthyCount    = progresses.filter(p => p.pct < 80).length
  const overallPct      = totalMonthlyLimit > 0 ? Math.min(100, (totalMonthlySpent / totalMonthlyLimit) * 100) : 0

  const spendingActions = [
    { label: 'Budget',      icon: <Target size={14} strokeWidth={2.5} />,         onClick: openNew },
    { label: 'Transaction', icon: <ArrowLeftRight size={14} strokeWidth={2.5} />, onClick: () => openSpendingEditor({ kind: 'transaction', type: 'expense' }) },
    { label: 'Account',     icon: <Wallet size={14} strokeWidth={2.5} />,         onClick: () => navigate('/spending/accounts') },
    { label: 'Category',    icon: <Tag size={14} strokeWidth={2.5} />,            onClick: () => navigate('/spending/categories') },
    { label: 'Recurring',   icon: <CalendarClock size={14} strokeWidth={2.5} />,  onClick: () => navigate('/spending/recurring') },
  ]

  return (
    <div className="min-h-screen bg-app pb-28">
      <DesktopPageHeader action={<ActionDropdown items={spendingActions} />} />
      <div className="w-full px-4 pt-4 pb-6 lg:px-6">

        {/* Hero */}
        <div className="hero-panel rounded-[32px] px-5 py-5 mb-5 lg:px-7 lg:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 min-w-0">
              <div className="section-kicker mb-1.5">Planning</div>
              <div className="font-sans text-[30px] lg:text-[38px] font-extrabold tracking-tight text-[var(--text-primary)]">Budgets</div>
              {budgets.length > 0 ? (
                <div className="mt-2 font-body text-[13px] text-[var(--text-secondary)]">
                  Monthly: {formatAmount(totalMonthlySpent, currency)} of {formatAmount(totalMonthlyLimit, currency)} used
                </div>
              ) : (
                <div className="mt-2 font-body text-[13px] text-[var(--text-secondary)]">
                  Set limits to stay in control of your spending.
                </div>
              )}
            </div>

          </div>

          {/* Overall progress + status pills */}
          {budgets.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Overall monthly spend</span>
                <span
                  className="font-sans text-[12px] font-extrabold"
                  style={{ color: overallPct >= 100 ? '#ef4444' : overallPct >= 80 ? '#f59e0b' : '#22c55e' }}
                >
                  {Math.round(overallPct)}%
                </span>
              </div>
              <ProgressBar value={overallPct} color={overallPct >= 100 ? '#ef4444' : overallPct >= 80 ? '#f59e0b' : '#22c55e'} size="md" />
              <div className="mt-3 flex flex-wrap gap-2">
                {overBudgetCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[11px] font-bold" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                    <AlertTriangle size={11} strokeWidth={2.5} /> {overBudgetCount} over budget
                  </span>
                )}
                {nearLimitCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[11px] font-bold" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                    <TrendingDown size={11} strokeWidth={2.5} /> {nearLimitCount} near limit
                  </span>
                )}
                {healthyCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[11px] font-bold" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                    <CheckCircle2 size={11} strokeWidth={2.5} /> {healthyCount} on track
                  </span>
                )}
              </div>
            </div>
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
              onClick={openNew}
              className="mt-2 rounded-2xl px-6 py-3 font-sans text-[14px] font-extrabold text-white"
              style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
            >
              Create first budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {progresses.map(({ budget, spent, remaining, pct, from, to }) => {
              const barColor = budgetBarColor(pct)
              const isOver   = pct >= 100
              const isNear   = pct >= 80 && !isOver

              return (
                <div
                  key={budget.id}
                  className="glass-panel flex flex-col rounded-[24px] px-5 py-4"
                  style={isOver ? { border: '1.5px solid rgba(239,68,68,0.4)' } : isNear ? { border: '1.5px solid rgba(245,158,11,0.3)' } : {}}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-sans text-[16px] font-extrabold text-[var(--text-primary)] truncate">{budget.name}</p>
                      <p className="font-sans text-[11px] text-[var(--text-tertiary)] mt-0.5 capitalize">
                        {budget.period} · {format(parseISO(from), 'MMM d')} – {format(parseISO(to), 'MMM d')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className="rounded-full px-2.5 py-1 font-sans text-[11px] font-bold"
                        style={{
                          background: isOver ? 'rgba(239,68,68,0.14)' : isNear ? 'rgba(245,158,11,0.14)' : 'rgba(34,197,94,0.14)',
                          color: barColor,
                        }}
                      >
                        {Math.round(pct)}%
                      </div>
                      <button
                        onClick={() => openEdit(budget.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-surface-2)]"
                      >
                        <Pencil size={14} color="var(--text-secondary)" />
                      </button>
                    </div>
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
                  <div className="mb-3">
                    <ProgressBar value={pct} color={barColor} size="md" />
                  </div>

                  {/* Amounts row */}
                  <div className="mt-auto flex items-end justify-between gap-2">
                    <div>
                      <div className="font-sans text-[20px] font-extrabold" style={{ color: barColor }}>
                        {formatAmount(spent, currency)}
                      </div>
                      <div className="font-body text-[11px] text-[var(--text-tertiary)]">of {formatAmount(budget.amount, currency)}</div>
                    </div>
                    <div className="text-right">
                      {isOver ? (
                        <div className="font-sans text-[13px] font-bold text-[#ef4444]">
                          {formatAmount(spent - budget.amount, currency)} over
                        </div>
                      ) : (
                        <div className="font-sans text-[13px] font-semibold text-[var(--text-secondary)]">
                          {formatAmount(remaining, currency)} left
                        </div>
                      )}
                      {budget.rollover && (
                        <div className="mt-0.5 font-sans text-[10px] text-[var(--text-tertiary)]">↩ Rollover</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB (mobile only) */}
      <button
        onClick={openNew}
        className="fixed bottom-40 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:scale-90 transition-transform lg:hidden"
        style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
        aria-label="Add budget"
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
      </button>

      {isDesktop ? (
        <Modal
          open={editorState.open}
          onClose={closeEditor}
          title={editorState.id ? 'Edit Budget' : 'New Budget'}
          size="md"
        >
          <BudgetEditor
            embedded
            initialId={editorState.id}
            onClose={closeEditor}
            onSaved={closeEditor}
          />
        </Modal>
      ) : (
        <BottomSheet
          open={editorState.open}
          onClose={closeEditor}
          title={editorState.id ? 'Edit Budget' : 'New Budget'}
        >
          <BudgetEditor
            embedded
            initialId={editorState.id}
            onClose={closeEditor}
            onSaved={closeEditor}
          />
        </BottomSheet>
      )}
    </div>
  )
}
