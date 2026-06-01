import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Minus, BarChart2, Sparkles } from 'lucide-react'
import { transactionsRepo } from '@/db/repos/spending/transactions'
import { categoriesRepo } from '@/db/repos/spending/categories'
import { settingsRepo } from '@/db/repos/settings'
import { computeReportData, periodLabel, type ReportPeriod } from '@/lib/spending/reports'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'

function formatAmount(n: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function formatK(n: number): string {
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000)   return `${(n / 1_000).toFixed(0)}K`
  return String(Math.round(n))
}

const PERIODS: ReportPeriod[] = ['3m', '6m', '12m', 'year', 'lastyear']

const incomeColor  = '#22c55e'
const expenseColor = '#ef4444'

export default function SpendingReports() {
  const [period, setPeriod] = useState<ReportPeriod>('6m')
  const [currency, setCurrency] = useState('INR')
  useEffect(() => { settingsRepo.get<string>('baseCurrency', 'INR').then(setCurrency) }, [])

  const transactions = useLiveQuery(() => transactionsRepo.getAll(), []) ?? []
  const categories   = useLiveQuery(() => categoriesRepo.getAll(true), []) ?? []

  const data = useMemo(
    () => computeReportData(transactions, categories, period),
    [transactions, categories, period],
  )

  const isEmpty = transactions.length === 0
  const pieData = data.topCategories.map(c => ({ name: `${c.icon} ${c.name}`, value: c.amount, color: c.color }))

  return (
    <div className="min-h-screen bg-app pb-28">
      <DesktopPageHeader />
      <div className="w-full px-4 pt-4 pb-6 lg:px-6">

        {/* Hero */}
        <div className="hero-panel rounded-[32px] px-5 py-5 mb-5 lg:px-7 lg:py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="section-kicker mb-1.5">Analytics</div>
            <div className="font-sans text-[30px] lg:text-[38px] font-extrabold tracking-tight text-[var(--text-primary)]">Reports</div>
            <div className="mt-1.5 font-body text-[13px] text-[var(--text-secondary)]">
              {isEmpty ? 'Add transactions to unlock trends and insights.' : `Showing ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''} · ${periodLabel(period)}`}
            </div>
          </div>

          {/* Period tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5 lg:shrink-0">
            {PERIODS.map(p => {
              const active = period === p
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="shrink-0 rounded-full px-4 py-2 font-sans text-[12px] font-bold transition-all"
                  style={{
                    background: active ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    border: active ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  {periodLabel(p)}
                </button>
              )
            })}
          </div>
        </div>

        {isEmpty ? (
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-[var(--bg-surface-2)]">
              <BarChart2 size={28} strokeWidth={1.5} color="var(--text-tertiary)" />
            </div>
            <p className="font-sans text-[15px] font-bold text-[var(--text-primary)]">No data yet</p>
            <p className="max-w-xs font-body text-[13px] text-[var(--text-tertiary)]">
              Add some transactions to see your reports here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 lg:gap-5">

            {/* Summary row — 4 cards on desktop, 3 on mobile */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="glass-panel rounded-[22px] p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: `${incomeColor}20` }}>
                    <TrendingUp size={14} color={incomeColor} />
                  </div>
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Income</span>
                </div>
                <p className="font-sans text-[20px] font-extrabold" style={{ color: incomeColor }}>
                  {formatAmount(data.totalIncome, currency)}
                </p>
              </div>

              <div className="glass-panel rounded-[22px] p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: `${expenseColor}20` }}>
                    <TrendingDown size={14} color={expenseColor} />
                  </div>
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Expenses</span>
                </div>
                <p className="font-sans text-[20px] font-extrabold" style={{ color: expenseColor }}>
                  {formatAmount(data.totalExpense, currency)}
                </p>
              </div>

              <div className="glass-panel rounded-[22px] p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: 'var(--bg-surface-2)' }}>
                    <Minus size={14} color="var(--text-secondary)" />
                  </div>
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Savings rate</span>
                </div>
                <p className="font-sans text-[20px] font-extrabold" style={{ color: data.net >= 0 ? incomeColor : expenseColor }}>
                  {isNaN(data.savingsRate) ? '–' : `${Math.round(data.savingsRate)}%`}
                </p>
              </div>

              <div className="glass-panel rounded-[22px] p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: 'rgba(99,102,241,0.14)' }}>
                    <Sparkles size={14} color="#6366f1" />
                  </div>
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Net cashflow</span>
                </div>
                <p className="font-sans text-[20px] font-extrabold" style={{ color: data.net >= 0 ? incomeColor : expenseColor }}>
                  {data.net >= 0 ? '+' : ''}{formatAmount(data.net, currency)}
                </p>
              </div>
            </div>

            {/* Two-column body on desktop */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">

              {/* Left — charts */}
              <div className="space-y-4">

                {/* Monthly trend bar chart */}
                <div className="glass-panel rounded-[24px] p-5 lg:p-6">
                  <p className="font-sans text-[14px] font-bold text-[var(--text-primary)] mb-1">Monthly trend</p>
                  <p className="font-body text-[12px] text-[var(--text-secondary)] mb-4">Income vs expenses over time.</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.monthlyBars} barCategoryGap="30%" barGap={2}>
                      <XAxis
                        dataKey="month"
                        tick={{ fontFamily: 'var(--font-sans)', fontSize: 11, fill: 'var(--text-tertiary)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={formatK}
                        tick={{ fontFamily: 'var(--font-sans)', fontSize: 10, fill: 'var(--text-tertiary)' }}
                        axisLine={false}
                        tickLine={false}
                        width={38}
                      />
                      <Tooltip
                        formatter={(value: number) => formatAmount(value, currency)}
                        labelStyle={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}
                        contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 12 }}
                        cursor={{ fill: 'var(--bg-surface-2)', radius: 6 }}
                      />
                      <Bar dataKey="income"  name="Income"  fill={incomeColor}  radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill={expenseColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-5 mt-3 justify-center">
                    <span className="flex items-center gap-1.5 font-sans text-[11px] text-[var(--text-tertiary)]">
                      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: incomeColor }} />Income
                    </span>
                    <span className="flex items-center gap-1.5 font-sans text-[11px] text-[var(--text-tertiary)]">
                      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: expenseColor }} />Expense
                    </span>
                  </div>
                </div>

                {/* Category breakdown */}
                {data.topCategories.length > 0 && (
                  <div className="glass-panel rounded-[24px] p-5 lg:p-6">
                    <p className="font-sans text-[14px] font-bold text-[var(--text-primary)] mb-1">Expense breakdown</p>
                    <p className="font-body text-[12px] text-[var(--text-secondary)] mb-5">Where most of the money is going.</p>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                      {/* Pie chart */}
                      <div className="flex justify-center lg:shrink-0">
                        <PieChart width={180} height={180}>
                          <Pie
                            data={pieData}
                            cx={90}
                            cy={90}
                            innerRadius={52}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatAmount(value, currency)}
                            contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 12 }}
                          />
                        </PieChart>
                      </div>
                      {/* Category list */}
                      <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                        {data.topCategories.map(c => (
                          <div key={c.catId} className="flex items-center gap-2.5">
                            <span className="text-[16px] shrink-0">{c.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-sans text-[12px] font-bold text-[var(--text-primary)] truncate">{c.name}</span>
                                <span className="font-sans text-[11px] text-[var(--text-tertiary)] shrink-0 ml-2">{Math.round(c.pct)}%</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
                                <div
                                  className="h-full rounded-full transition-[width] duration-500"
                                  style={{ width: `${c.pct}%`, background: c.color }}
                                />
                              </div>
                            </div>
                            <span className="font-sans text-[12px] font-bold text-[var(--text-secondary)] shrink-0 tabular-nums">
                              {formatAmount(c.amount, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right — insights + payees */}
              <div className="space-y-4">

                {/* Quick stats */}
                <div className="glass-panel rounded-[24px] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles size={15} color="var(--color-brand-500)" />
                    <div className="font-sans text-[14px] font-bold text-[var(--text-primary)]">Period insights</div>
                  </div>
                  <div className="space-y-2.5">
                    <InsightRow label="Avg daily spend" value={formatAmount(data.avgDailyExpense, currency)} />
                    <InsightRow label="Total income" value={formatAmount(data.totalIncome, currency)} valueColor={incomeColor} />
                    <InsightRow label="Total expenses" value={formatAmount(data.totalExpense, currency)} valueColor={expenseColor} />
                    <InsightRow
                      label="Net cashflow"
                      value={`${data.net >= 0 ? '+' : ''}${formatAmount(data.net, currency)}`}
                      valueColor={data.net >= 0 ? incomeColor : expenseColor}
                    />
                    {!isNaN(data.savingsRate) && (
                      <InsightRow
                        label="Savings rate"
                        value={`${Math.round(data.savingsRate)}%`}
                        valueColor={data.savingsRate >= 20 ? incomeColor : data.savingsRate < 0 ? expenseColor : 'var(--text-primary)'}
                      />
                    )}
                  </div>
                </div>

                {/* Top payees */}
                {data.topPayees.length > 0 && (
                  <div className="glass-panel rounded-[24px] p-5">
                    <p className="font-sans text-[14px] font-bold text-[var(--text-primary)] mb-1">Top payees</p>
                    <p className="font-body text-[12px] text-[var(--text-secondary)] mb-4">Merchants you spend at most.</p>
                    <div className="flex flex-col gap-2.5">
                      {data.topPayees.map(({ payee, amount }, i) => (
                        <div key={payee} className="flex items-center gap-3 rounded-[16px] bg-[var(--bg-surface-2)] px-3.5 py-3">
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-sans text-[11px] font-extrabold"
                            style={{ background: 'var(--bg-surface-3)', color: 'var(--text-secondary)' }}
                          >
                            {i + 1}
                          </div>
                          <span className="flex-1 font-sans text-[13px] font-semibold text-[var(--text-primary)] truncate">{payee}</span>
                          <span className="font-sans text-[13px] font-extrabold tabular-nums shrink-0" style={{ color: expenseColor }}>
                            {formatAmount(amount, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

function InsightRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] bg-[var(--bg-surface-2)] px-3.5 py-2.5">
      <div className="font-body text-[12px] text-[var(--text-secondary)]">{label}</div>
      <div className="font-sans text-[13px] font-extrabold" style={{ color: valueColor ?? 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}
