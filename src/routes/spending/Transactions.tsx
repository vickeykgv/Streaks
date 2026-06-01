import { useEffect, useRef, useState, useMemo, type TouchEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Trash2,
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Sparkles,
  CalendarRange,
  Landmark,
  Target,
  Tag,
  CalendarClock,
  RefreshCw,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { transactionsRepo } from '@/db/repos/spending/transactions'
import { accountsRepo } from '@/db/repos/spending/accounts'
import { categoriesRepo } from '@/db/repos/spending/categories'
import { settingsRepo } from '@/db/repos/settings'
import { toast } from '@/store/toastStore'
import { cn } from '@/lib/utils'
import { BottomSheet, DatePicker } from '@/components/ui'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import { ActionDropdown } from '@/components/ActionDropdown'
import { FabMenu } from '@/components/FabMenu'
import { openSpendingEditor } from '@/store/spendingEditor'
import {
  filterAndSort,
  countActiveFilters,
  filtersToParams,
  filtersFromParams,
  type TransactionFilters,
  type SortKey,
  type DateRangePreset,
} from '@/lib/spending/filters'
import type { SpendingTransaction, TransactionType } from '@/types/spending'

function formatAmount(n: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}

const TYPE_COLOR = { income: '#22c55e', expense: '#ef4444', transfer: '#3b82f6' } as const
const TYPE_ICON = { income: TrendingUp, expense: TrendingDown, transfer: ArrowLeftRight }

const SWIPE_MAX = 120
const SWIPE_THRESHOLD = 72

function TxRow({
  tx,
  categoryMap,
  accountMap,
  currency,
  onDelete,
  onOpen,
}: {
  tx: SpendingTransaction
  categoryMap: Record<string, string>
  accountMap: Record<string, string>
  currency: string
  onDelete: (tx: SpendingTransaction) => void
  onOpen: (tx: SpendingTransaction) => void
}) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const axisLocked = useRef<'x' | 'y' | null>(null)
  const suppressClick = useRef(false)

  const TypeIcon = TYPE_ICON[tx.type]
  const color = TYPE_COLOR[tx.type]
  const catLabel = tx.categoryId ? categoryMap[tx.categoryId] : undefined
  const accLabel = accountMap[tx.accountId] ?? 'Unknown'
  const displayLabel = tx.payee || catLabel || (tx.type === 'transfer' ? 'Transfer' : 'Transaction')
  const subLabel = tx.payee && catLabel ? catLabel : accLabel

  const onTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    axisLocked.current = null
    setDragging(true)
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!dragging) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    if (!axisLocked.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      axisLocked.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }
    if (axisLocked.current !== 'x') return
    if (dx > 0) return
    setDragX(Math.max(-SWIPE_MAX, dx))
  }

  const onTouchEnd = () => {
    if (!dragging) return
    setDragging(false)
    const dx = dragX
    setDragX(0)
    if (axisLocked.current === 'x') {
      suppressClick.current = true
      window.setTimeout(() => { suppressClick.current = false }, 350)
    }
    if (dx <= -SWIPE_THRESHOLD) onDelete(tx)
  }

  const revealStrength = Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD)

  return (
    <div className="relative overflow-hidden rounded-[22px]">
      {dragX < 0 && (
        <div
          className="absolute inset-0 flex items-center justify-end rounded-[22px] pr-5"
          style={{ background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)', opacity: revealStrength }}
        >
          <Trash2 size={18} color="#fff" strokeWidth={2.5} />
        </div>
      )}
      <div
        role="button"
        tabIndex={0}
        className="glass-panel flex cursor-pointer items-center gap-3.5 rounded-[22px] px-4 py-3.5 active:scale-[0.99] select-none"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 220ms cubic-bezier(0.34,1.56,0.64,1)',
          touchAction: 'pan-y manipulation',
        }}
        onClick={() => { if (suppressClick.current) return; onOpen(tx) }}
        onKeyDown={e => e.key === 'Enter' && onOpen(tx)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]" style={{ background: `${color}22` }}>
          <TypeIcon size={18} strokeWidth={2} style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-sans text-[14px] font-semibold text-[var(--text-primary)]">{displayLabel}</div>
          <div className="truncate font-body text-[12px] text-[var(--text-tertiary)]">{subLabel}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-sans text-[15px] font-extrabold tabular-nums" style={{ color }}>
            {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '↔'}{formatAmount(tx.amount, currency)}
          </div>
          <div className="font-body text-[11px] text-[var(--text-tertiary)]">
            {format(parseISO(`${tx.date}T12:00:00`), 'MMM d')}
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterPanel({
  open,
  onClose,
  filters,
  onChange,
  accounts,
  categories,
}: {
  open: boolean
  onClose: () => void
  filters: TransactionFilters
  onChange: (f: TransactionFilters) => void
  accounts: { id: string; name: string; icon: string }[]
  categories: { id: string; name: string; icon: string; type: string }[]
}) {
  const [local, setLocal] = useState<TransactionFilters>(filters)
  useEffect(() => { setLocal(filters) }, [filters, open])

  const toggle = <T extends string>(arr: T[] | undefined, val: T): T[] => {
    const s = new Set(arr ?? [])
    s.has(val) ? s.delete(val) : s.add(val)
    return [...s]
  }

  const amountInputCls = 'h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-surface px-3 font-sans text-[14px] font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--color-brand-500)]'

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="flex flex-col gap-5 px-1 pb-4">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[17px] font-extrabold text-[var(--text-primary)]">Filters</span>
          <button
            onClick={() => { onChange({ sort: local.sort ?? 'date_desc' }); onClose() }}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-1.5 font-sans text-[12px] font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
          >
            Clear all
          </button>
        </div>

        <div>
          <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Date range</div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'week', 'month', 'custom'] as DateRangePreset[]).map(d => {
              const active = (local.dateRange ?? 'all') === d
              return (
                <button
                  key={d}
                  onClick={() => setLocal(f => ({ ...f, dateRange: d, from: d !== 'custom' ? undefined : f.from, to: d !== 'custom' ? undefined : f.to }))}
                  className="rounded-2xl px-3.5 py-2 font-sans text-[13px] font-bold transition-all capitalize"
                  style={{
                    background: active ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    border: active ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  {d === 'all' ? 'All time' : d === 'week' ? 'This week' : d === 'month' ? 'This month' : 'Custom'}
                </button>
              )
            })}
          </div>
          {local.dateRange === 'custom' && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">From</div>
                <DatePicker value={local.from} onChange={v => setLocal(f => ({ ...f, from: v }))} />
              </div>
              <div>
                <div className="mb-1 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">To</div>
                <DatePicker value={local.to} onChange={v => setLocal(f => ({ ...f, to: v }))} />
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Type</div>
          <div className="flex gap-2">
            {[
              { value: '', label: 'All', color: 'var(--color-brand-500)' },
              { value: 'expense', label: 'Expense', color: '#ef4444' },
              { value: 'income', label: 'Income', color: '#22c55e' },
              { value: 'transfer', label: 'Transfer', color: '#3b82f6' },
            ].map(({ value, label, color }) => {
              const active = (local.type ?? '') === value
              return (
                <button
                  key={value}
                  onClick={() => setLocal(f => ({ ...f, type: value as TransactionFilters['type'] }))}
                  className="rounded-2xl px-3.5 py-2 font-sans text-[13px] font-bold transition-all"
                  style={{
                    background: active ? color : 'var(--bg-surface-2)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    border: active ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {accounts.length > 0 && (
          <div>
            <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Account</div>
            <div className="flex flex-wrap gap-2">
              {accounts.map(a => {
                const active = local.accountIds?.includes(a.id) ?? false
                return (
                  <button
                    key={a.id}
                    onClick={() => setLocal(f => ({ ...f, accountIds: toggle(f.accountIds, a.id) }))}
                    className="flex items-center gap-1.5 rounded-2xl px-3 py-2 font-sans text-[13px] font-bold transition-all"
                    style={{
                      background: active ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      border: active ? 'none' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <span>{a.icon}</span> {a.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div>
            <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Category</div>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => {
                const active = local.categoryIds?.includes(c.id) ?? false
                return (
                  <button
                    key={c.id}
                    onClick={() => setLocal(f => ({ ...f, categoryIds: toggle(f.categoryIds, c.id) }))}
                    className="flex items-center gap-1.5 rounded-2xl px-3 py-2 font-sans text-[13px] font-bold transition-all"
                    style={{
                      background: active ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      border: active ? 'none' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <span>{c.icon}</span> {c.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Amount range</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Min</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={local.minAmount ?? ''}
                onChange={e => setLocal(f => ({ ...f, minAmount: e.target.value ? Number(e.target.value) : undefined }))}
                className={amountInputCls}
              />
            </div>
            <div>
              <label className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Max</label>
              <input
                type="number"
                min={0}
                placeholder="Any"
                value={local.maxAmount ?? ''}
                onChange={e => setLocal(f => ({ ...f, maxAmount: e.target.value ? Number(e.target.value) : undefined }))}
                className={amountInputCls}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Sort by</div>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'date_desc', label: 'Newest first' },
              { value: 'date_asc', label: 'Oldest first' },
              { value: 'amount_desc', label: 'Highest amount' },
              { value: 'amount_asc', label: 'Lowest amount' },
            ] as { value: SortKey; label: string }[]).map(({ value, label }) => {
              const active = (local.sort ?? 'date_desc') === value
              return (
                <button
                  key={value}
                  onClick={() => setLocal(f => ({ ...f, sort: value }))}
                  className="rounded-2xl py-2.5 font-sans text-[12px] font-bold transition-all"
                  style={{
                    background: active ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    border: active ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={() => { onChange(local); onClose() }}
          className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-white"
          style={{ height: '52px', background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
        >
          Apply filters
        </button>
      </div>
    </BottomSheet>
  )
}

export default function SpendingTransactions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [currency, setCurrency] = useState('INR')
  const navigate = useNavigate()
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => { settingsRepo.get<string>('baseCurrency', 'INR').then(setCurrency) }, [])

  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams])

  const setFilters = (next: TransactionFilters) => {
    const params = filtersToParams(next)
    setSearchParams(params, { replace: true })
  }

  const setQ = (q: string) => {
    setSearchParams(p => {
      const next = new URLSearchParams(p)
      q ? next.set('q', q) : next.delete('q')
      return next
    }, { replace: true })
  }

  const transactions = useLiveQuery(() => transactionsRepo.getAll(), []) ?? []
  const accounts = useLiveQuery(() => accountsRepo.getAll(true), []) ?? []
  const categories = useLiveQuery(() => categoriesRepo.getAll(true), []) ?? []

  const accountMap: Record<string, string> = {}
  for (const a of accounts) accountMap[a.id] = `${a.icon} ${a.name}`
  const categoryMap: Record<string, string> = {}
  for (const c of categories) categoryMap[c.id] = `${c.icon} ${c.name}`

  const filtered = useMemo(() => filterAndSort(transactions, filters), [transactions, filters])

  const groups = useMemo(() => {
    const g: { date: string; items: SpendingTransaction[] }[] = []
    for (const tx of filtered) {
      const last = g[g.length - 1]
      if (last && last.date === tx.date) last.items.push(tx)
      else g.push({ date: tx.date, items: [tx] })
    }
    return g
  }, [filtered])

  const activeFilterCount = countActiveFilters(filters)
  const hasSearch = !!filters.q

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    let transfer = 0
    for (const tx of filtered) {
      if (tx.type === 'income') income += tx.amount
      else if (tx.type === 'expense') expense += tx.amount
      else transfer += tx.amount
    }
    return { income, expense, transfer, net: income - expense }
  }, [filtered])

  const latestDate = filtered[0]?.date

  const handleDelete = async (tx: SpendingTransaction) => {
    await transactionsRepo.delete(tx.id)
    toast.info(`Deleted · ${tx.payee ?? formatAmount(tx.amount, currency)}`, {
      label: 'Undo',
      onClick: () => transactionsRepo.restore(tx.id),
    })
  }
  const openCreateModal = (type: TransactionType) => openSpendingEditor({ kind: 'transaction', type })
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
      <div className="w-full px-4 pt-4 lg:px-6">
        <div className="mb-4 hero-panel rounded-[30px] px-5 py-5 lg:px-6 lg:py-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_360px] lg:items-center">
            <div>
              <div className="section-kicker mb-2">History</div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-sans text-[30px] font-extrabold tracking-tight text-[var(--text-primary)] lg:text-[38px]">Transactions</div>
                </div>
              </div>
              <div className="mt-2 max-w-2xl font-body text-[13px] text-[var(--text-secondary)]">
                {filtered.length !== transactions.length
                  ? `${filtered.length} of ${transactions.length} records shown`
                  : `${transactions.length} records logged across your accounts`}
                {latestDate ? ` · Latest entry ${format(parseISO(`${latestDate}T12:00:00`), 'MMM d')}` : ''}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <QuickAddCard label="Expense" value={formatAmount(totals.expense, currency)} color="#ef4444" onClick={() => openCreateModal('expense')} />
              <QuickAddCard label="Income" value={formatAmount(totals.income, currency)} color="#22c55e" onClick={() => openCreateModal('income')} />
              <QuickAddCard label="Transfer" value={formatAmount(totals.transfer, currency)} color="#3b82f6" onClick={() => openCreateModal('transfer')} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_360px]">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[24px] bg-transparent md:flex-row">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="search"
                  placeholder="Search payee or note..."
                  value={filters.q ?? ''}
                  onChange={e => setQ(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-10 pr-10 font-sans text-[14px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]"
                />
                {hasSearch && (
                  <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={14} color="var(--text-tertiary)" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterOpen(true)}
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all"
                  style={{
                    background: activeFilterCount > 0 ? 'var(--color-brand-500)' : 'var(--bg-surface)',
                    border: activeFilterCount > 0 ? 'none' : '1px solid var(--border-subtle)',
                    boxShadow: activeFilterCount > 0 ? 'var(--shadow-glow)' : 'none',
                  }}
                  aria-label="Filters"
                >
                  <SlidersHorizontal size={18} color={activeFilterCount > 0 ? '#fff' : 'var(--text-primary)'} />
                  {activeFilterCount > 0 && (
                    <span
                      className="absolute -right-1 -top-1 flex w-[18px] items-center justify-center rounded-full bg-white font-sans text-[9px] font-extrabold text-[var(--color-brand-500)]"
                      style={{ minWidth: '18px', height: '18px' }}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    const order: SortKey[] = ['date_desc', 'date_asc', 'amount_desc', 'amount_asc']
                    const cur = filters.sort ?? 'date_desc'
                    const next = order[(order.indexOf(cur) + 1) % order.length]
                    setFilters({ ...filters, sort: next })
                  }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all"
                  aria-label="Sort"
                  title={{ date_desc: 'Newest first', date_asc: 'Oldest first', amount_desc: 'Highest', amount_asc: 'Lowest' }[filters.sort ?? 'date_desc']}
                >
                  <ArrowUpDown size={18} color="var(--text-primary)" />
                </button>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="glass-panel rounded-[24px] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} color="var(--color-brand-500)" />
                    <div className="font-sans text-[13px] font-bold text-[var(--text-primary)]">Active filters</div>
                  </div>
                  <button
                    onClick={() => setFilters({ sort: filters.sort })}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-1.5 font-sans text-[12px] font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.type && <Chip label={filters.type} onRemove={() => setFilters({ ...filters, type: '' })} />}
                  {filters.dateRange && filters.dateRange !== 'all' && (
                    <Chip
                      label={filters.dateRange === 'week' ? 'This week' : filters.dateRange === 'month' ? 'This month' : `${filters.from} → ${filters.to}`}
                      onRemove={() => setFilters({ ...filters, dateRange: 'all', from: undefined, to: undefined })}
                    />
                  )}
                  {filters.accountIds?.map(id => (
                    <Chip key={id} label={accountMap[id] ?? id} onRemove={() => setFilters({ ...filters, accountIds: filters.accountIds!.filter(a => a !== id) })} />
                  ))}
                  {filters.categoryIds?.map(id => (
                    <Chip key={id} label={categoryMap[id] ?? id} onRemove={() => setFilters({ ...filters, categoryIds: filters.categoryIds!.filter(c => c !== id) })} />
                  ))}
                  {(filters.minAmount != null || filters.maxAmount != null) && (
                    <Chip
                      label={`${filters.minAmount ?? 0}–${filters.maxAmount ?? '∞'}`}
                      onRemove={() => setFilters({ ...filters, minAmount: undefined, maxAmount: undefined })}
                    />
                  )}
                </div>
              </div>
            )}

            {transactions.length === 0 && (
              <EmptyBlock
                title="No transactions yet"
                copy="Start by logging your first income or expense."
                actionLabel="Add transaction"
                onAction={() => openCreateModal('expense')}
              />
            )}

            {transactions.length > 0 && filtered.length === 0 && (
              <EmptyBlock
                title="No matching transactions"
                copy="Try a wider date range or clear a couple of filters."
                actionLabel="Clear filters"
                onAction={() => setFilters({ sort: filters.sort })}
              />
            )}

            {filtered.length > 0 && (
              <div className="space-y-6">
                {groups.map(({ date, items }) => {
                  const dateObj = parseISO(`${date}T12:00:00`)
                  const dayTotal = items.reduce((sum, tx) =>
                    tx.type === 'income' ? sum + tx.amount : tx.type === 'expense' ? sum - tx.amount : sum, 0)
                  return (
                    <section key={date}>
                      <div className="mb-2 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <CalendarRange size={14} color="var(--text-tertiary)" />
                          <span className="font-sans text-[12px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                            {format(dateObj, 'EEE, MMM d')}
                          </span>
                        </div>
                        <span className={cn('font-sans text-[12px] font-bold', dayTotal >= 0 ? 'text-[var(--text-success)]' : 'text-[var(--color-overdue)]')}>
                          {dayTotal >= 0 ? '+' : '-'}{formatAmount(Math.abs(dayTotal), currency)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {items.map(tx => (
                          <TxRow
                            key={tx.id}
                            tx={tx}
                            categoryMap={categoryMap}
                            accountMap={accountMap}
                            currency={currency}
                            onDelete={handleDelete}
                            onOpen={tx => openEditModal(tx.id)}
                          />
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="glass-panel rounded-[28px] p-5 xl:sticky xl:top-4">
              <div className="mb-4">
                <div className="font-sans text-[18px] font-extrabold text-[var(--text-primary)]">Summary</div>
                <div className="font-body text-[13px] text-[var(--text-secondary)]">Live totals for the currently visible records.</div>
              </div>

              <div className="grid gap-3">
                <SummaryTile label="Net" value={`${totals.net >= 0 ? '+' : '-'}${formatAmount(Math.abs(totals.net), currency)}`} color={totals.net >= 0 ? '#22c55e' : '#ef4444'} />
                <SummaryTile label="Expenses" value={formatAmount(totals.expense, currency)} color="#ef4444" />
                <SummaryTile label="Income" value={formatAmount(totals.income, currency)} color="#22c55e" />
                <SummaryTile label="Transfers" value={formatAmount(totals.transfer, currency)} color="#3b82f6" />
              </div>

              <div className="mt-5 rounded-[22px] bg-[var(--bg-surface-2)] p-4">
                <div className="mb-3 font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Quick actions</div>
                <div className="grid gap-2">
                  <ActionButton label="Add expense" onClick={() => openCreateModal('expense')} />
                  <ActionButton label="Add income" onClick={() => openCreateModal('income')} />
                  <ActionButton label="Add transfer" onClick={() => openCreateModal('transfer')} />
                </div>
              </div>

              <div className="mt-4 rounded-[22px] bg-[var(--bg-surface-2)] p-4">
                <div className="mb-2 font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Filter status</div>
                <div className="space-y-2 font-body text-[12px] text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Search</span>
                    <span className="font-sans font-bold text-[var(--text-primary)]">{filters.q ? 'Active' : 'None'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Advanced filters</span>
                    <span className="font-sans font-bold text-[var(--text-primary)]">{activeFilterCount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Sort</span>
                    <span className="font-sans font-bold text-[var(--text-primary)]">{sortLabel(filters.sort ?? 'date_desc')}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <FabMenu items={fabItems} title="Add to spending" />

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
        accounts={accounts.map(a => ({ id: a.id, name: a.name, icon: a.icon }))}
        categories={categories.map(c => ({ id: c.id, name: c.name, icon: c.icon, type: c.type }))}
      />
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[12px] font-bold"
      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
    >
      {label}
      <button onClick={onRemove} aria-label="Remove filter">
        <X size={12} strokeWidth={2.5} color="var(--text-tertiary)" />
      </button>
    </span>
  )
}

function QuickAddCard({
  label,
  value,
  color,
  onClick,
}: {
  label: string
  value: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="glass-panel rounded-[22px] p-4 text-left hover:border-[var(--border-default)]"
    >
      <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color }}>
        {label}
      </div>
      <div className="mt-2 font-sans text-[16px] font-extrabold text-[var(--text-primary)]">{value}</div>
    </button>
  )
}

function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-[18px] bg-[var(--bg-surface-2)] px-4 py-3">
      <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{label}</div>
      <div className="mt-1 font-sans text-[17px] font-extrabold" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-3)] px-3 py-3 text-left font-sans text-[13px] font-bold text-[var(--text-primary)]"
    >
      {label}
    </button>
  )
}

function EmptyBlock({
  title,
  copy,
  actionLabel,
  onAction,
}: {
  title: string
  copy: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="glass-panel mt-6 flex flex-col items-center gap-4 rounded-[28px] px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-[var(--bg-surface-2)]">
        <ArrowLeftRight size={28} strokeWidth={1.5} color="var(--text-tertiary)" />
      </div>
      <p className="font-sans text-[16px] font-bold text-[var(--text-primary)]">{title}</p>
      <p className="max-w-xs font-body text-[13px] text-[var(--text-tertiary)]">{copy}</p>
      <button
        onClick={onAction}
        className="rounded-2xl px-5 py-3 font-sans text-[14px] font-bold text-white"
        style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
      >
        {actionLabel}
      </button>
    </div>
  )
}

function sortLabel(sort: SortKey) {
  switch (sort) {
    case 'date_asc':
      return 'Oldest'
    case 'amount_desc':
      return 'Highest'
    case 'amount_asc':
      return 'Lowest'
    case 'date_desc':
    default:
      return 'Newest'
  }
}
