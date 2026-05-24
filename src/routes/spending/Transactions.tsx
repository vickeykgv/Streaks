import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, ArrowLeftRight, TrendingUp, TrendingDown, Trash2,
  Search, SlidersHorizontal, X, ArrowUpDown,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { transactionsRepo } from '@/db/repos/spending/transactions'
import { accountsRepo } from '@/db/repos/spending/accounts'
import { categoriesRepo } from '@/db/repos/spending/categories'
import { settingsRepo } from '@/db/repos/settings'
import { toast } from '@/store/toastStore'
import { cn } from '@/lib/utils'
import { BottomSheet, DatePicker } from '@/components/ui'
import {
  filterAndSort, countActiveFilters, filtersToParams, filtersFromParams,
  type TransactionFilters, type SortKey, type DateRangePreset,
} from '@/lib/spending/filters'
import type { SpendingTransaction } from '@/types/spending'

function formatAmount(n: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}

const TYPE_COLOR = { income: '#22c55e', expense: '#ef4444', transfer: '#3b82f6' } as const
const TYPE_ICON  = { income: TrendingUp, expense: TrendingDown, transfer: ArrowLeftRight }

const SWIPE_MAX = 120
const SWIPE_THRESHOLD = 72

// ── Single transaction row (swipe-to-delete) ─────────────────────────────────
function TxRow({
  tx, categoryMap, accountMap, currency, onDelete,
}: {
  tx: SpendingTransaction
  categoryMap: Record<string, string>
  accountMap: Record<string, string>
  currency: string
  onDelete: (tx: SpendingTransaction) => void
}) {
  const navigate = useNavigate()
  const [dragX, setDragX]     = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX      = useRef(0)
  const startY      = useRef(0)
  const axisLocked  = useRef<'x' | 'y' | null>(null)
  const suppressClick = useRef(false)

  const TypeIcon    = TYPE_ICON[tx.type]
  const color       = TYPE_COLOR[tx.type]
  const catLabel    = tx.categoryId ? categoryMap[tx.categoryId] : undefined
  const accLabel    = accountMap[tx.accountId] ?? 'Unknown'
  const displayLabel = tx.payee || catLabel || (tx.type === 'transfer' ? 'Transfer' : 'Transaction')
  const subLabel    = tx.payee && catLabel ? catLabel : accLabel

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    axisLocked.current = null
    setDragging(true)
  }
  const onTouchMove = (e: React.TouchEvent) => {
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
    <div className="relative rounded-[22px] overflow-hidden">
      {dragX < 0 && (
        <div
          className="absolute inset-0 flex items-center justify-end pr-5 rounded-[22px]"
          style={{ background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)', opacity: revealStrength }}
        >
          <Trash2 size={18} color="#fff" strokeWidth={2.5} />
        </div>
      )}
      <div
        role="button"
        tabIndex={0}
        className="glass-panel flex items-center gap-3.5 px-4 py-3.5 rounded-[22px] cursor-pointer active:scale-[0.99] select-none"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 220ms cubic-bezier(0.34,1.56,0.64,1)',
          touchAction: 'pan-y manipulation',
        }}
        onClick={() => { if (suppressClick.current) return; navigate(`/spending/edit/${tx.id}`) }}
        onKeyDown={e => e.key === 'Enter' && navigate(`/spending/edit/${tx.id}`)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]" style={{ background: `${color}22` }}>
          <TypeIcon size={18} strokeWidth={2} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-sans text-[14px] font-semibold text-[var(--text-primary)] truncate">{displayLabel}</div>
          <div className="font-body text-[12px] text-[var(--text-tertiary)] truncate">{subLabel}</div>
        </div>
        <span className="font-sans text-[15px] font-extrabold shrink-0" style={{ color }}>
          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : '⇄'}{formatAmount(tx.amount, currency)}
        </span>
      </div>
    </div>
  )
}

// ── Filter panel (BottomSheet) ────────────────────────────────────────────────
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
  accounts:   { id: string; name: string; icon: string }[]
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
            className="font-sans text-[13px] font-bold text-[var(--color-brand-500)]"
          >
            Clear all
          </button>
        </div>

        {/* Date range */}
        <div>
          <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Date range</div>
          <div className="flex gap-2 flex-wrap">
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

        {/* Type */}
        <div>
          <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Type</div>
          <div className="flex gap-2">
            {[
              { value: '',         label: 'All',      color: 'var(--color-brand-500)' },
              { value: 'expense',  label: 'Expense',  color: '#ef4444' },
              { value: 'income',   label: 'Income',   color: '#22c55e' },
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

        {/* Accounts */}
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

        {/* Categories */}
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

        {/* Amount range */}
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

        {/* Sort */}
        <div>
          <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Sort by</div>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'date_desc',   label: 'Newest first'   },
              { value: 'date_asc',    label: 'Oldest first'   },
              { value: 'amount_desc', label: 'Highest amount' },
              { value: 'amount_asc',  label: 'Lowest amount'  },
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

        {/* Apply */}
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SpendingTransactions() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [currency, setCurrency] = useState('INR')
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
  const accounts     = useLiveQuery(() => accountsRepo.getAll(true),  []) ?? []
  const categories   = useLiveQuery(() => categoriesRepo.getAll(true), []) ?? []

  const accountMap: Record<string, string>  = {}
  for (const a of accounts)   accountMap[a.id]   = `${a.icon} ${a.name}`
  const categoryMap: Record<string, string> = {}
  for (const c of categories) categoryMap[c.id]  = `${c.icon} ${c.name}`

  const filtered = useMemo(() => filterAndSort(transactions, filters), [transactions, filters])

  // Group by date
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
  const hasSearch = !!(filters.q)

  const handleDelete = async (tx: SpendingTransaction) => {
    await transactionsRepo.delete(tx.id)
    toast.info(`Deleted · ${tx.payee ?? formatAmount(tx.amount, currency)}`, {
      label: 'Undo',
      onClick: () => transactionsRepo.restore(tx.id),
    })
  }

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-3xl px-4 pt-4">

        {/* Header */}
        <div className="hero-panel rounded-[30px] px-5 py-5 mb-4">
          <div className="section-kicker mb-2">History</div>
          <div className="font-sans text-[30px] font-extrabold tracking-tight text-[var(--text-primary)]">Transactions</div>
          <div className="mt-1 font-body text-[13px] text-[var(--text-secondary)]">
            {filtered.length !== transactions.length
              ? `${filtered.length} of ${transactions.length} record${transactions.length !== 1 ? 's' : ''}`
              : `${transactions.length} record${transactions.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Search + filter bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="search"
              placeholder="Search payee or note…"
              value={filters.q ?? ''}
              onChange={e => setQ(e.target.value)}
              className="h-11 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-10 pr-4 font-sans text-[14px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]"
            />
            {hasSearch && (
              <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} color="var(--text-tertiary)" />
              </button>
            )}
          </div>

          {/* Filter button */}
          <button
            onClick={() => setFilterOpen(true)}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all"
            style={{
              background: activeFilterCount > 0 ? 'var(--color-brand-500)' : 'var(--bg-surface)',
              border: activeFilterCount > 0 ? 'none' : '1px solid var(--border-subtle)',
              boxShadow: activeFilterCount > 0 ? 'var(--shadow-glow)' : 'none',
            }}
            aria-label="Filters"
          >
            <SlidersHorizontal size={18} color={activeFilterCount > 0 ? '#fff' : 'var(--text-primary)'} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white font-sans text-[9px] font-extrabold text-[var(--color-brand-500)]"
                style={{ minWidth: '18px', height: '18px' }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort quick-toggle */}
          <button
            onClick={() => {
              const order: SortKey[] = ['date_desc', 'date_asc', 'amount_desc', 'amount_asc']
              const cur = filters.sort ?? 'date_desc'
              const next = order[(order.indexOf(cur) + 1) % order.length]
              setFilters({ ...filters, sort: next })
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all"
            aria-label="Sort"
            title={{ date_desc: 'Newest first', date_asc: 'Oldest first', amount_desc: 'Highest', amount_asc: 'Lowest' }[filters.sort ?? 'date_desc']}
          >
            <ArrowUpDown size={18} color="var(--text-primary)" />
          </button>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.type && (
              <Chip label={filters.type} onRemove={() => setFilters({ ...filters, type: '' })} />
            )}
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
            <button
              onClick={() => setFilters({ sort: filters.sort })}
              className="font-sans text-[12px] font-bold text-[var(--color-brand-500)]"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Empty state */}
        {transactions.length === 0 && (
          <div className="flex flex-col items-center gap-4 mt-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-[var(--bg-surface-2)]">
              <ArrowLeftRight size={28} strokeWidth={1.5} color="var(--text-tertiary)" />
            </div>
            <p className="font-sans text-[15px] font-bold text-[var(--text-primary)]">No transactions yet</p>
            <p className="max-w-xs font-body text-[13px] text-[var(--text-tertiary)]">Tap + to log your first income or expense.</p>
          </div>
        )}

        {/* No results for active filter */}
        {transactions.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 mt-10 text-center">
            <p className="font-sans text-[15px] font-bold text-[var(--text-primary)]">No matching transactions</p>
            <button onClick={() => setFilters({ sort: filters.sort })} className="font-sans text-[13px] font-bold text-[var(--color-brand-500)]">
              Clear filters
            </button>
          </div>
        )}

        {/* Grouped list */}
        <div className="flex flex-col gap-6">
          {groups.map(({ date, items }) => {
            const dateObj  = parseISO(date + 'T12:00:00')
            const dayTotal = items.reduce((sum, tx) =>
              tx.type === 'income' ? sum + tx.amount : tx.type === 'expense' ? sum - tx.amount : sum, 0)
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="font-sans text-[12px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                    {format(dateObj, 'EEE, MMM d')}
                  </span>
                  <span className={cn('font-sans text-[12px] font-bold', dayTotal >= 0 ? 'text-[var(--color-done)]' : 'text-[var(--color-overdue)]')}>
                    {dayTotal >= 0 ? '+' : '−'}{formatAmount(Math.abs(dayTotal), currency)}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map(tx => (
                    <TxRow
                      key={tx.id}
                      tx={tx}
                      categoryMap={categoryMap}
                      accountMap={accountMap}
                      currency={currency}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
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
