import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, TrendingUp, TrendingDown, ArrowLeftRight, ChevronRight, Wallet } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { seedDefaultCategories } from '@/db/repos/spending/seed'
import { settingsRepo } from '@/db/repos/settings'
import { useSpendingDashboard, type SpendingPeriod } from '@/hooks/useSpendingDashboard'
import { ProgressBar } from '@/components/ui'
import { cn } from '@/lib/utils'

function formatAmount(n: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

// ── Period switcher (same visual language as WorldSwitcher) ──────────────────
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

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div
      className="glass-panel flex-1 rounded-[22px] p-4 flex flex-col gap-2"
      style={{ border: `1px solid ${color}33`, background: `${color}0d` }}
    >
      <div className="flex items-center gap-1.5">
        <span style={{ color }}>{icon}</span>
        <span className="font-sans text-[10px] font-bold uppercase tracking-wide" style={{ color: `${color}cc` }}>{label}</span>
      </div>
      <div className="font-sans font-extrabold text-[18px] leading-none tracking-tight" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

// ── Transaction type icon + color ────────────────────────────────────────────
const TYPE_COLOR = { income: '#22c55e', expense: '#ef4444', transfer: '#3b82f6' } as const
const TYPE_ICON  = { income: TrendingUp, expense: TrendingDown, transfer: ArrowLeftRight }

export default function SpendingDashboard() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<SpendingPeriod>(() =>
    (localStorage.getItem('spending-period') as SpendingPeriod) ?? 'month'
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
    totalIncome, totalExpense, net,
    topCategories, accountBalances, recentTransactions,
    isLoading, transactionCount, categoryMap, accountMap,
  } = useSpendingDashboard(period)

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-3xl px-4 pt-4 flex flex-col gap-5">

        {/* Hero header */}
        <div className="hero-panel rounded-[30px] px-5 py-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="section-kicker mb-1">Spending</div>
              <div className="font-sans text-[28px] font-extrabold tracking-tight text-[var(--text-primary)]">
                {net >= 0 ? '+ ' : '− '}{formatAmount(Math.abs(net), currency)}
              </div>
              <div className="font-body text-[13px] text-[var(--text-secondary)] mt-0.5">
                Net {period === 'week' ? 'this week' : 'this month'} · {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px]" style={{ background: 'var(--bg-surface-2)' }}>
              <Wallet size={22} strokeWidth={1.5} color="var(--text-secondary)" />
            </div>
          </div>
          <div className="mt-4">
            <PeriodSwitcher period={period} onChange={handlePeriodChange} />
          </div>
        </div>

        {/* Stat cards */}
        <div className="flex gap-3">
          <StatCard
            label="Income"
            value={formatAmount(totalIncome, currency)}
            color="#22c55e"
            icon={<TrendingUp size={12} strokeWidth={2.5} />}
          />
          <StatCard
            label="Expense"
            value={formatAmount(totalExpense, currency)}
            color="#ef4444"
            icon={<TrendingDown size={12} strokeWidth={2.5} />}
          />
          <StatCard
            label="Net"
            value={formatAmount(Math.abs(net), currency)}
            color={net >= 0 ? '#22c55e' : '#ef4444'}
            icon={<span className="text-[11px] font-extrabold">{net >= 0 ? '+' : '−'}</span>}
          />
        </div>

        {/* Category breakdown */}
        {topCategories.length > 0 && (
          <div className="glass-panel rounded-[28px] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-sans text-[14px] font-bold text-[var(--text-primary)]">Top Expenses</span>
              <button
                onClick={() => navigate('/spending/categories')}
                className="font-sans text-[12px] font-bold text-[var(--color-brand-500)]"
              >
                All categories
              </button>
            </div>
            <div className="flex flex-col gap-3.5">
              {topCategories.map(cat => {
                const pct = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0
                return (
                  <div key={cat.catId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px]">{cat.icon}</span>
                        <span className="font-sans text-[13px] font-semibold text-[var(--text-primary)]">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[12px] font-bold text-[var(--text-secondary)] tabular-nums">
                          {formatAmount(cat.amount, currency)}
                        </span>
                        <span className="font-sans text-[10px] text-[var(--text-tertiary)] tabular-nums w-8 text-right">
                          {Math.round(pct)}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar value={pct} color={cat.color} size="sm" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Account balances */}
        {accountBalances.length > 0 && (
          <div className="glass-panel rounded-[28px] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-sans text-[14px] font-bold text-[var(--text-primary)]">Accounts</span>
              <button
                onClick={() => navigate('/spending/accounts')}
                className="font-sans text-[12px] font-bold text-[var(--color-brand-500)]"
              >
                Manage
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {accountBalances.map(acc => (
                <div key={acc.id} className="flex items-center gap-3 py-1.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] text-[18px]"
                    style={{ background: `${acc.color}22` }}
                  >
                    {acc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-sans text-[13px] font-semibold text-[var(--text-primary)] truncate">{acc.name}</div>
                    <div className="font-body text-[11px] text-[var(--text-tertiary)] capitalize">{acc.type.replace('_', ' ')}</div>
                  </div>
                  <span
                    className={cn(
                      'font-sans text-[14px] font-extrabold tabular-nums',
                      acc.balance >= 0 ? 'text-[var(--color-done)]' : 'text-[var(--color-overdue)]',
                    )}
                  >
                    {formatAmount(acc.balance, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent transactions */}
        {recentTransactions.length > 0 && (
          <div className="glass-panel rounded-[28px] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-sans text-[14px] font-bold text-[var(--text-primary)]">Recent</span>
              <button
                onClick={() => navigate('/spending/transactions')}
                className="flex items-center gap-1 font-sans text-[12px] font-bold text-[var(--color-brand-500)]"
              >
                See all <ChevronRight size={13} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {recentTransactions.map(tx => {
                const TypeIcon = TYPE_ICON[tx.type]
                const color = TYPE_COLOR[tx.type]
                const cat = tx.categoryId ? categoryMap[tx.categoryId] : undefined
                const label = tx.payee || cat?.name || (tx.type === 'transfer' ? 'Transfer' : 'Transaction')
                const sub = format(parseISO(tx.date + 'T12:00:00'), 'MMM d')
                return (
                  <button
                    key={tx.id}
                    onClick={() => navigate(`/spending/edit/${tx.id}`)}
                    className="flex items-center gap-3 rounded-[18px] px-3 py-2.5 transition-all hover:bg-[var(--bg-surface-2)] active:scale-[0.99] w-full text-left"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px]"
                      style={{ background: `${color}22` }}
                    >
                      <TypeIcon size={16} strokeWidth={2} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-sans text-[13px] font-semibold text-[var(--text-primary)] truncate">{label}</div>
                      <div className="font-body text-[11px] text-[var(--text-tertiary)]">{accountMap[tx.accountId] ?? ''} · {sub}</div>
                    </div>
                    <span className="font-sans text-[14px] font-extrabold tabular-nums shrink-0" style={{ color }}>
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : '⇄'}{formatAmount(tx.amount, currency)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state — no transactions */}
        {isLoading === false && transactionCount === 0 && accountBalances.length > 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="font-sans text-[14px] font-bold text-[var(--text-secondary)]">No transactions {period === 'week' ? 'this week' : 'this month'}</p>
            <p className="font-body text-[12px] text-[var(--text-tertiary)]">Tap + to log your first one.</p>
          </div>
        )}

        {/* First-time empty state — no accounts */}
        {accountBalances.length === 0 && (
          <div className="flex flex-col items-center gap-4 mt-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-[var(--bg-surface-2)]">
              <Wallet size={28} strokeWidth={1.5} color="var(--text-tertiary)" />
            </div>
            <p className="font-sans text-[15px] font-bold text-[var(--text-primary)]">Set up your first account</p>
            <p className="max-w-xs font-body text-[13px] text-[var(--text-tertiary)]">
              Add a bank account or cash wallet, then start logging transactions.
            </p>
            <button
              onClick={() => navigate('/spending/accounts/new')}
              className="mt-1 flex items-center gap-2 rounded-2xl px-5 py-3 font-sans text-[14px] font-bold text-white"
              style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
            >
              <Plus size={16} strokeWidth={2.5} /> Add account
            </button>
          </div>
        )}

      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/spending/new')}
        className="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full shadow-[var(--shadow-fab)] z-10"
        style={{ background: 'var(--color-brand-500)' }}
        aria-label="Add transaction"
      >
        <Plus size={24} strokeWidth={2.5} color="#fff" />
      </button>
    </div>
  )
}
