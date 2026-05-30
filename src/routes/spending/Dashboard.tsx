import { useEffect, useState, type ReactNode } from 'react'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import { ActionDropdown } from '@/components/ActionDropdown'
import { FabMenu } from '@/components/FabMenu'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  ChevronRight,
  Wallet,
  Target,
  CalendarClock,
  Sparkles,
  Landmark,
  AlertTriangle,
  Tag,
  RefreshCw,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { PieChart, Pie, Cell } from 'recharts'
import { seedDefaultCategories } from '@/db/repos/spending/seed'
import { settingsRepo } from '@/db/repos/settings'
import { useSpendingDashboard, type SpendingPeriod } from '@/hooks/useSpendingDashboard'
import { ProgressBar } from '@/components/ui'
import { CardSkeleton, HeroPanelSkeleton, StatsSkeleton } from '@/components/SpendingSkeleton'
import { openSpendingEditor } from '@/store/spendingEditor'
import type { TransactionType } from '@/types/spending'

function formatAmount(n: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function PeriodSwitcher({ period, onChange }: { period: SpendingPeriod; onChange: (p: SpendingPeriod) => void }) {
  return (
    <div
      className="flex rounded-2xl p-[4px] gap-1"
      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}
    >
      {(['week', 'month'] as SpendingPeriod[]).map(p => {
        const active = period === p
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="flex-1 flex items-center justify-center px-4 py-2.5 rounded-[14px] font-sans font-bold text-[13px] transition-all duration-150 whitespace-nowrap"
            style={{
              background: active ? 'var(--color-brand-500)' : 'transparent',
              color: active ? 'var(--text-on-brand)' : 'var(--text-tertiary)',
              boxShadow: active ? 'var(--shadow-glow)' : 'none',
            }}
          >
            {p === 'week' ? 'This Week' : 'This Month'}
          </button>
        )
      })}
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  color,
  icon,
}: {
  label: string
  value: string
  hint: string
  color: string
  icon: ReactNode
}) {
  return (
    <div className="glass-panel rounded-[24px] p-4 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[12px]" style={{ background: `${color}20`, color }}>
          {icon}
        </div>
        <div>
          <div className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{label}</div>
          <div className="font-body text-[11px] text-[var(--text-secondary)]">{hint}</div>
        </div>
      </div>
      <div className="font-sans text-[22px] font-extrabold tracking-tight" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

function QuickAction({
  label,
  sublabel,
  icon,
  onClick,
}: {
  label: string
  sublabel: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="glass-panel flex items-center gap-3 rounded-[20px] p-4 text-left hover:border-[var(--border-default)]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--bg-surface-2)] text-[var(--color-brand-500)]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-sans text-[14px] font-bold text-[var(--text-primary)]">{label}</div>
        <div className="font-body text-[12px] text-[var(--text-tertiary)]">{sublabel}</div>
      </div>
    </button>
  )
}

const TYPE_COLOR = { income: '#22c55e', expense: '#ef4444', transfer: '#3b82f6' } as const
const TYPE_ICON = { income: TrendingUp, expense: TrendingDown, transfer: ArrowLeftRight }

export default function SpendingDashboard() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<SpendingPeriod>(() =>
    (localStorage.getItem('spending-period') as SpendingPeriod) ?? 'month',
  )
  const [currency, setCurrency] = useState('INR')
  useEffect(() => {
    seedDefaultCategories()
    settingsRepo.get<string>('baseCurrency', 'INR').then(setCurrency)
  }, [])

  const handlePeriodChange = (p: SpendingPeriod) => {
    localStorage.setItem('spending-period', p)
    setPeriod(p)
  }

  const {
    totalIncome,
    totalExpense,
    net,
    topCategories,
    topSpendCategory,
    accountBalances,
    recentTransactions,
    biggestExpense,
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
    isLoading,
    transactionCount,
    categoryMap,
    accountMap,
  } = useSpendingDashboard(period)

  const budgetPct = totalBudget > 0 ? Math.min(100, (totalBudgetSpent / totalBudget) * 100) : 0
  const openCreateModal = (type: TransactionType, categoryId?: string) => openSpendingEditor({ kind: 'transaction', type, categoryId })
  const openEditModal = (id: string) => openSpendingEditor({ kind: 'transaction', id })

  const spendingActions = [
    { label: 'Transaction', icon: <ArrowLeftRight size={14} strokeWidth={2.5} />, onClick: () => openCreateModal('expense') },
    { label: 'Account',     icon: <Landmark size={14} strokeWidth={2.5} />,       onClick: () => navigate('/spending/accounts') },
    { label: 'Budget',      icon: <Target size={14} strokeWidth={2.5} />,         onClick: () => navigate('/spending/budgets') },
    { label: 'Category',    icon: <Tag size={14} strokeWidth={2.5} />,            onClick: () => navigate('/spending/categories') },
    { label: 'Recurring',   icon: <CalendarClock size={14} strokeWidth={2.5} />,  onClick: () => navigate('/spending/recurring') },
  ]

  const fabItems = [
    { label: 'Transaction', description: 'Log income or expense', icon: <ArrowLeftRight size={22} strokeWidth={1.6} />, onClick: () => openCreateModal('expense'), color: 'var(--color-brand-500)' },
    { label: 'Account',     description: 'Cash, bank, wallet',    icon: <Landmark size={22} strokeWidth={1.6} />,       onClick: () => navigate('/spending/accounts'), color: '#3b82f6' },
    { label: 'Budget',      description: 'Set a spending limit',  icon: <Target size={22} strokeWidth={1.6} />,         onClick: () => navigate('/spending/budgets'),  color: '#10b981' },
    { label: 'Category',    description: 'Income or expense type', icon: <Tag size={22} strokeWidth={1.6} />,           onClick: () => navigate('/spending/categories'), color: '#f97316' },
    { label: 'Recurring',   description: 'Auto-log subscriptions', icon: <RefreshCw size={22} strokeWidth={1.6} />,     onClick: () => navigate('/spending/recurring'),  color: '#8b5cf6' },
  ]

  return (
    <div className="min-h-screen bg-app pb-28">
      <DesktopPageHeader action={<ActionDropdown items={spendingActions} />} />
      <div className="w-full px-4 pt-4 pb-6 lg:px-6">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <HeroPanelSkeleton />
            <StatsSkeleton />
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <CardSkeleton rows={4} />
              <CardSkeleton rows={4} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 lg:gap-5">

            {/* ── Mobile hero (hidden on desktop) ── */}
            <section className="hero-panel lg:hidden overflow-hidden rounded-[32px] p-5">
              <div className="section-kicker mb-2">Money workspace</div>
              <div className="font-sans text-[30px] font-extrabold leading-none tracking-tight text-[var(--text-primary)]">
                {net >= 0 ? '+' : '-'} {formatAmount(Math.abs(net), currency)}
              </div>
              <div className="mt-2 font-body text-[13px] text-[var(--text-secondary)]">
                Net {period === 'week' ? 'this week' : 'this month'} · {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                {topSpendCategory ? ` · ${topSpendCategory.icon} ${topSpendCategory.name} leads` : ''}
              </div>
              <div className="mt-4">
                <PeriodSwitcher period={period} onChange={handlePeriodChange} />
              </div>
              <div className="mt-3 flex gap-2">
                <div className="flex-1 rounded-[16px] bg-[var(--bg-surface-2)] px-3 py-2.5">
                  <div className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Income</div>
                  <div className="mt-0.5 font-sans text-[14px] font-extrabold text-[#22c55e]">{formatAmount(totalIncome, currency)}</div>
                </div>
                <div className="flex-1 rounded-[16px] bg-[var(--bg-surface-2)] px-3 py-2.5">
                  <div className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Expense</div>
                  <div className="mt-0.5 font-sans text-[14px] font-extrabold text-[#ef4444]">{formatAmount(totalExpense, currency)}</div>
                </div>
                {totalBudget > 0 && (
                  <div className="flex-1 rounded-[16px] bg-[var(--bg-surface-2)] px-3 py-2.5">
                    <div className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Budget</div>
                    <div className="mt-0.5 font-sans text-[14px] font-extrabold" style={{ color: budgetPct >= 100 ? '#ef4444' : budgetPct >= 80 ? '#f59e0b' : '#22c55e' }}>{Math.round(budgetPct)}%</div>
                  </div>
                )}
              </div>
            </section>

            {/* ── Desktop top bar (hidden on mobile) ── */}
            <section className="hero-panel hidden lg:flex items-center justify-between gap-6 rounded-[32px] px-7 py-5">
              <div className="min-w-0">
                <div className="section-kicker mb-1.5">Money workspace</div>
                <div className="font-sans text-[38px] font-extrabold leading-none tracking-tight text-[var(--text-primary)]">
                  {net >= 0 ? '+' : '-'} {formatAmount(Math.abs(net), currency)}
                </div>
                <div className="mt-2 font-body text-[13px] text-[var(--text-secondary)]">
                  Net {period === 'week' ? 'this week' : 'this month'} · {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                  {topSpendCategory ? ` · ${topSpendCategory.icon} ${topSpendCategory.name} leads spend` : ''}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <PeriodSwitcher period={period} onChange={handlePeriodChange} />
                <button
                  onClick={() => openCreateModal('expense')}
                  className="flex h-11 items-center gap-2 rounded-2xl px-5 font-sans text-[14px] font-extrabold text-white"
                  style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  Add transaction
                </button>
              </div>
            </section>

            {/* ── Desktop 4 stat cards (hidden on mobile) ── */}
            <section className="hidden lg:grid lg:grid-cols-4 gap-3">
              <MetricCard
                label="Income"
                hint="Money in"
                value={formatAmount(totalIncome, currency)}
                color="#22c55e"
                icon={<TrendingUp size={16} strokeWidth={2.4} />}
              />
              <MetricCard
                label="Expense"
                hint="Money out"
                value={formatAmount(totalExpense, currency)}
                color="#ef4444"
                icon={<TrendingDown size={16} strokeWidth={2.4} />}
              />
              <MetricCard
                label="Budget Used"
                hint={totalBudget > 0 ? `${Math.round(spendingPacePct)}% consumed` : 'No active budget'}
                value={totalBudget > 0 ? formatAmount(totalBudgetSpent, currency) : '—'}
                color={spendingPacePct >= 100 ? '#ef4444' : spendingPacePct >= 80 ? '#f59e0b' : '#ffb457'}
                icon={<Target size={16} strokeWidth={2.4} />}
              />
              <MetricCard
                label="Time Elapsed"
                hint="Period progress"
                value={`${Math.round(timeProgressPct)}%`}
                color="#60a5fa"
                icon={<CalendarClock size={16} strokeWidth={2.4} />}
              />
            </section>

            {/* ── Main 2-column body ── */}
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">

              {/* Left column — actions, categories, budgets */}
              <div className="space-y-4">

                {/* Desktop-only quick actions */}
                <div className="hidden gap-3 lg:grid lg:grid-cols-3">
                  <QuickAction
                    label="Add expense"
                    sublabel="Log a purchase"
                    icon={<TrendingDown size={18} strokeWidth={2.4} />}
                    onClick={() => openCreateModal('expense')}
                  />
                  <QuickAction
                    label="Add income"
                    sublabel="Salary, refund, bonus"
                    icon={<TrendingUp size={18} strokeWidth={2.4} />}
                    onClick={() => openCreateModal('income')}
                  />
                  <QuickAction
                    label="Transfer"
                    sublabel="Move between accounts"
                    icon={<ArrowLeftRight size={18} strokeWidth={2.4} />}
                    onClick={() => openCreateModal('transfer')}
                  />
                </div>

                {/* Top expense categories */}
                {topCategories.length > 0 && (
                  <div className="glass-panel rounded-[28px] p-5 lg:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-sans text-[18px] font-extrabold text-[var(--text-primary)]">Top expense categories</div>
                        <div className="font-body text-[13px] text-[var(--text-secondary)]">Where most of the cash is going this period.</div>
                      </div>
                      <button
                        onClick={() => navigate('/spending/categories')}
                        className="flex items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-1.5 font-sans text-[12px] font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
                      >
                        Manage <ChevronRight size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                    <CategoryDonut
                      categories={topCategories}
                      totalExpense={totalExpense}
                      currency={currency}
                      onAdd={catId => openCreateModal('expense', catId)}
                    />
                  </div>
                )}

                {/* At-risk alert banner (mobile + desktop) */}
                {(overBudgetCount > 0 || nearLimitCount > 0) && (
                  <div
                    className="flex items-start gap-3 rounded-[20px] px-4 py-3.5"
                    style={{
                      background: overBudgetCount > 0 ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.10)',
                      border: `1.5px solid ${overBudgetCount > 0 ? 'rgba(239,68,68,0.30)' : 'rgba(245,158,11,0.30)'}`,
                    }}
                  >
                    <AlertTriangle
                      size={16}
                      strokeWidth={2.4}
                      style={{ color: overBudgetCount > 0 ? '#ef4444' : '#f59e0b', marginTop: 2, flexShrink: 0 }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-sans text-[13px] font-bold" style={{ color: overBudgetCount > 0 ? '#ef4444' : '#f59e0b' }}>
                        {overBudgetCount > 0
                          ? `${overBudgetCount} budget${overBudgetCount > 1 ? 's' : ''} exceeded`
                          : `${nearLimitCount} budget${nearLimitCount > 1 ? 's' : ''} near limit`}
                      </div>
                      <div className="font-body text-[12px] text-[var(--text-secondary)]">
                        {overBudgetCount > 0
                          ? 'You\'ve gone over the set limit — review and adjust.'
                          : 'Approaching the cap — spend carefully to stay on track.'}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/spending/budgets')}
                      className="shrink-0 font-sans text-[12px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Review
                    </button>
                  </div>
                )}

                {/* Budget health */}
                {allBudgetProgresses.length > 0 && (
                  <div className="glass-panel rounded-[28px] p-5 lg:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-sans text-[18px] font-extrabold text-[var(--text-primary)]">Budget health</div>
                        <div className="font-body text-[13px] text-[var(--text-secondary)]">
                          {allBudgetProgresses.length} budget{allBudgetProgresses.length > 1 ? 's' : ''} · sorted by usage
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/spending/budgets')}
                        className="flex items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-1.5 font-sans text-[12px] font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
                      >
                        Open budgets <ChevronRight size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      {allBudgetProgresses.map(({ budget, spent, remaining, pct }) => (
                        <div
                          key={budget.id}
                          className="rounded-[22px] bg-[var(--bg-surface-2)] p-4"
                          style={{
                            border: pct >= 100 ? '1.5px solid rgba(239,68,68,0.35)' : pct >= 80 ? '1.5px solid rgba(245,158,11,0.25)' : '1px solid var(--border-subtle)',
                          }}
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-sans text-[14px] font-bold text-[var(--text-primary)]">{budget.name}</div>
                              <div className="font-body text-[12px] text-[var(--text-tertiary)] capitalize">{budget.period} budget</div>
                            </div>
                            <div
                              className="shrink-0 rounded-full px-2.5 py-1 font-sans text-[11px] font-bold"
                              style={{
                                background: pct >= 100 ? 'rgba(239,68,68,0.14)' : pct >= 80 ? 'rgba(245,158,11,0.14)' : 'rgba(34,197,94,0.14)',
                                color: pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#22c55e',
                              }}
                            >
                              {Math.round(pct)}%
                            </div>
                          </div>
                          <div className="mb-3">
                            <ProgressBar value={pct} color={pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#22c55e'} size="sm" />
                          </div>
                          <div className="flex items-center justify-between gap-3 font-body text-[12px] text-[var(--text-secondary)]">
                            <span>{formatAmount(spent, currency)} spent</span>
                            <span style={{ color: pct >= 100 ? '#ef4444' : 'inherit', fontWeight: pct >= 100 ? 700 : undefined }}>
                              {pct >= 100 ? `${formatAmount(spent - budget.amount, currency)} over` : `${formatAmount(remaining, currency)} left`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right sidebar — insights, recent activity, accounts */}
              <div className="space-y-4">

                {/* Desktop-only insights panel */}
                <div className="hidden lg:block glass-panel rounded-[28px] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles size={15} color="var(--color-brand-500)" />
                    <div className="font-sans text-[14px] font-bold text-[var(--text-primary)]">This period at a glance</div>
                  </div>
                  <div className="space-y-2.5">
                    <InsightRow label="Avg daily spend" value={formatAmount(avgDailyExpense || 0, currency)} tone="neutral" />
                    <InsightRow label="Projected spend" value={formatAmount(projectedExpense || 0, currency)} tone={projectedExpense > totalExpense ? 'warning' : 'neutral'} />
                    <InsightRow
                      label="Savings rate"
                      value={savingsRate == null ? '—' : `${Math.round(savingsRate)}%`}
                      tone={savingsRate != null && savingsRate >= 20 ? 'positive' : savingsRate != null && savingsRate < 0 ? 'danger' : 'neutral'}
                    />
                    <InsightRow
                      label="Needs attention"
                      value={overBudgetCount > 0 ? `${overBudgetCount} over budget` : nearLimitCount > 0 ? `${nearLimitCount} near limit` : 'All clear'}
                      tone={overBudgetCount > 0 ? 'danger' : nearLimitCount > 0 ? 'warning' : 'positive'}
                    />
                  </div>
                  {totalBudget > 0 && (
                    <div className="mt-4 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-3.5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Budget runway</div>
                        <div className="rounded-full bg-[var(--bg-surface-3)] px-2 py-0.5 font-sans text-[11px] font-bold text-[var(--text-secondary)]">{Math.round(budgetPct)}%</div>
                      </div>
                      <ProgressBar value={budgetPct} color={budgetPct >= 100 ? '#ef4444' : budgetPct >= 80 ? '#f59e0b' : '#22c55e'} size="sm" />
                      <div className="mt-1.5 font-body text-[11px] text-[var(--text-secondary)]">
                        {formatAmount(totalBudgetSpent, currency)} of {formatAmount(totalBudget, currency)} used
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent activity */}
                <div className="glass-panel rounded-[28px] p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-sans text-[18px] font-extrabold text-[var(--text-primary)]">Recent activity</div>
                      <div className="font-body text-[13px] text-[var(--text-secondary)]">Latest money movement.</div>
                    </div>
                    <button
                      onClick={() => navigate('/spending/transactions')}
                      className="flex items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-1.5 font-sans text-[12px] font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
                    >
                      View all <ChevronRight size={12} strokeWidth={2.5} />
                    </button>
                  </div>

                  {recentTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {recentTransactions.map(tx => {
                        const TypeIcon = TYPE_ICON[tx.type]
                        const color = TYPE_COLOR[tx.type]
                        const cat = tx.categoryId ? categoryMap[tx.categoryId] : undefined
                        const label = tx.payee || cat?.name || (tx.type === 'transfer' ? 'Transfer' : 'Transaction')
                        return (
                          <button
                            key={tx.id}
                            onClick={() => openEditModal(tx.id)}
                            className="flex w-full items-center gap-3 rounded-[18px] border border-transparent bg-[var(--bg-surface-2)] px-3 py-3 text-left hover:border-[var(--border-default)]"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]" style={{ background: `${color}22` }}>
                              <TypeIcon size={16} strokeWidth={2} style={{ color }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-sans text-[13px] font-bold text-[var(--text-primary)]">{label}</div>
                              <div className="truncate font-body text-[12px] text-[var(--text-tertiary)]">
                                {accountMap[tx.accountId] ?? ''} · {format(parseISO(`${tx.date}T12:00:00`), 'MMM d')}
                              </div>
                            </div>
                            <div className="shrink-0 font-sans text-[14px] font-extrabold tabular-nums" style={{ color }}>
                              {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '↔'}{formatAmount(tx.amount, currency)}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptyMiniState
                      icon={<ArrowLeftRight size={20} strokeWidth={1.8} color="var(--text-tertiary)" />}
                      title={`No transactions ${period === 'week' ? 'this week' : 'this month'}`}
                      copy="Start with your first entry to unlock trends and budgets."
                    />
                  )}

                  {biggestExpense && (
                    <div className="mt-4 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-4">
                      <div className="mb-1 flex items-center gap-2">
                        <Landmark size={14} color="#ef4444" />
                        <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Largest expense</div>
                      </div>
                      <div className="font-sans text-[15px] font-extrabold text-[var(--text-primary)]">
                        {biggestExpense.payee || categoryMap[biggestExpense.categoryId ?? '']?.name || 'Expense'}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <div className="font-body text-[12px] text-[var(--text-tertiary)]">{format(parseISO(`${biggestExpense.date}T12:00:00`), 'MMM d')}</div>
                        <div className="font-sans text-[14px] font-extrabold text-[#ef4444]">{formatAmount(biggestExpense.amount, currency)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accounts */}
                <div className="glass-panel rounded-[28px] p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-sans text-[18px] font-extrabold text-[var(--text-primary)]">Accounts</div>
                      <div className="font-body text-[13px] text-[var(--text-secondary)]">Live balances.</div>
                    </div>
                    <button
                      onClick={() => navigate('/spending/accounts')}
                      className="flex items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-1.5 font-sans text-[12px] font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
                    >
                      Manage <ChevronRight size={12} strokeWidth={2.5} />
                    </button>
                  </div>

                  {accountBalances.length > 0 ? (
                    <div className="space-y-2">
                      {accountBalances.map(acc => (
                        <div key={acc.id} className="flex items-center gap-3 rounded-[18px] bg-[var(--bg-surface-2)] px-3 py-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-[17px]" style={{ background: `${acc.color}22` }}>
                            {acc.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-sans text-[13px] font-bold text-[var(--text-primary)]">{acc.name}</div>
                            <div className="font-body text-[11px] capitalize text-[var(--text-tertiary)]">{acc.type.replace('_', ' ')}</div>
                          </div>
                          <div className="font-sans text-[13px] font-extrabold tabular-nums text-[var(--text-primary)]">
                            {formatAmount(acc.balance, currency)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyMiniState
                      icon={<Wallet size={20} strokeWidth={1.8} color="var(--text-tertiary)" />}
                      title="Set up your first account"
                      copy="Add a bank account or cash wallet before logging transactions."
                      actionLabel="Add account"
                      onAction={() => navigate('/spending/accounts/new')}
                    />
                  )}
                </div>

              </div>
            </section>

          </div>
        )}
      </div>

      <FabMenu items={fabItems} title="Add to spending" />
    </div>
  )
}

function CategoryDonut({
  categories,
  totalExpense,
  currency,
  onAdd,
}: {
  categories: { catId: string; amount: number; name: string; icon: string; color: string }[]
  totalExpense: number
  currency: string
  onAdd?: (catId: string) => void
}) {
  const data = categories.map(c => ({ name: c.name, value: c.amount, color: c.color }))
  const CHART = 192

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      {/* Donut — centred on mobile, left-aligned on desktop */}
      <div className="mx-auto shrink-0 lg:mx-0" style={{ position: 'relative', width: CHART, height: CHART }}>
        <PieChart width={CHART} height={CHART}>
          <Pie
            data={data}
            cx={CHART / 2 - 4}
            cy={CHART / 2 - 4}
            innerRadius={58}
            outerRadius={88}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={categories[i].color} opacity={0.9} />
            ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">spent</div>
          <div className="font-sans text-[15px] font-extrabold leading-tight text-[var(--text-primary)]">
            {formatAmount(totalExpense, currency)}
          </div>
        </div>
      </div>

      {/* Legend — single col on mobile, 2-col grid on desktop */}
      <div className="flex-1 grid grid-cols-1 gap-2 lg:grid-cols-2 lg:content-start">
        {categories.map(cat => {
          const pct = totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0
          return (
            <button
              key={cat.catId}
              type="button"
              onClick={() => onAdd?.(cat.catId)}
              className="group flex items-center gap-2.5 rounded-[16px] border border-transparent bg-[var(--bg-surface-2)] px-3 py-2.5 text-left transition-colors hover:border-[var(--border-default)]"
              title={`Add expense · ${cat.name}`}
            >
              <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: cat.color }} />
              <span className="text-[13px] leading-none">{cat.icon}</span>
              <span className="min-w-0 flex-1 truncate font-sans text-[13px] font-semibold text-[var(--text-primary)]">{cat.name}</span>
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 font-sans text-[11px] font-bold"
                style={{ background: `${cat.color}22`, color: cat.color }}
              >
                {pct}%
              </span>
              <span className="shrink-0 font-sans text-[12px] font-extrabold tabular-nums text-[var(--text-secondary)]">
                {formatAmount(cat.amount, currency)}
              </span>
              <Plus
                size={13}
                strokeWidth={2.5}
                className="ml-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60"
                color="var(--color-brand-500)"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function InsightRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'neutral' | 'positive' | 'warning' | 'danger'
}) {
  const colors = {
    neutral: 'var(--text-primary)',
    positive: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  } as const

  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[var(--bg-surface-2)] px-3.5 py-2.5">
      <div className="font-body text-[12px] text-[var(--text-secondary)]">{label}</div>
      <div className="font-sans text-[13px] font-extrabold" style={{ color: colors[tone] }}>
        {value}
      </div>
    </div>
  )
}

function EmptyMiniState({
  icon,
  title,
  copy,
  actionLabel,
  onAction,
}: {
  icon: ReactNode
  title: string
  copy: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[22px] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-5 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--bg-surface-3)]">
        {icon}
      </div>
      <div className="font-sans text-[14px] font-bold text-[var(--text-primary)]">{title}</div>
      <div className="max-w-xs font-body text-[12px] text-[var(--text-tertiary)]">{copy}</div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-2xl px-4 py-2.5 font-sans text-[13px] font-bold text-white"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
