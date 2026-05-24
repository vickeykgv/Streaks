import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, RefreshCw, Pause, Play, Pencil, CalendarClock } from 'lucide-react'
import { format } from 'date-fns'
import { recurringRepo } from '@/db/repos/spending/recurring'
import { categoriesRepo } from '@/db/repos/spending/categories'
import { accountsRepo } from '@/db/repos/spending/accounts'
import { runDueRecurring, intervalLabel } from '@/lib/spending/recurringRunner'
import { toast } from '@/store/toastStore'

function formatAmount(n: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

const TYPE_COLOR: Record<string, string> = {
  expense: '#ef4444',
  income:  '#22c55e',
  transfer:'#6366f1',
}

export default function SpendingRecurring() {
  const navigate = useNavigate()

  const rules      = useLiveQuery(() => recurringRepo.getAll(), []) ?? []
  const categories = useLiveQuery(() => categoriesRepo.getAll(true), []) ?? []
  const accounts   = useLiveQuery(() => accountsRepo.getAll(), []) ?? []

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const accMap = Object.fromEntries(accounts.map(a => [a.id, a]))

  // Run due rules on mount
  useEffect(() => {
    runDueRecurring().then(n => {
      if (n > 0) toast.success(`${n} recurring transaction${n > 1 ? 's' : ''} created`)
    })
  }, [])

  const handleToggle = async (id: string, active: boolean) => {
    await recurringRepo.update(id, { active: !active })
    toast.success(active ? 'Rule paused' : 'Rule resumed')
  }

  const handleRunNow = async (id: string) => {
    const rule = await recurringRepo.getById(id)
    if (!rule) return
    const now = Date.now()
    await recurringRepo.update(id, { nextRunAt: now })
    const n = await runDueRecurring()
    if (n > 0) toast.success('Transaction created')
  }

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-3xl px-4 pt-4">

        {/* Header */}
        <div className="hero-panel rounded-[30px] px-5 py-5 mb-5">
          <div className="section-kicker mb-1">Automation</div>
          <div className="font-sans text-[30px] font-extrabold tracking-tight text-[var(--text-primary)]">Recurring</div>
          {rules.length > 0 && (
            <p className="mt-1 font-sans text-[13px] text-[var(--text-secondary)]">
              {rules.filter(r => r.active).length} active rule{rules.filter(r => r.active).length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {rules.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-[var(--bg-surface-2)]">
              <CalendarClock size={28} strokeWidth={1.5} color="var(--text-tertiary)" />
            </div>
            <p className="font-sans text-[15px] font-bold text-[var(--text-primary)]">No recurring rules</p>
            <p className="max-w-xs font-body text-[13px] text-[var(--text-tertiary)]">
              Automate repeating transactions like salary, rent, or subscriptions.
            </p>
            <button
              onClick={() => navigate('/spending/recurring/new')}
              className="mt-2 rounded-2xl px-6 py-3 font-sans text-[14px] font-extrabold text-white"
              style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
            >
              Create first rule
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rules.map(rule => {
              const cat = rule.categoryId ? catMap[rule.categoryId] : null
              const acc = accMap[rule.accountId]
              const typeColor = TYPE_COLOR[rule.type] ?? 'var(--text-primary)'
              const nextDate = format(new Date(rule.nextRunAt), 'MMM d, yyyy')

              return (
                <div
                  key={rule.id}
                  className="glass-panel rounded-[24px] px-5 py-4"
                  style={{ opacity: rule.active ? 1 : 0.55 }}
                >
                  <div className="flex items-start gap-3">
                    {/* Type dot */}
                    <div
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: typeColor }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-sans text-[15px] font-extrabold text-[var(--text-primary)] truncate">{rule.name}</p>
                        <p className="font-sans text-[16px] font-extrabold shrink-0 tabular-nums" style={{ color: typeColor }}>
                          {formatAmount(rule.amount, rule.currency)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        <span className="font-sans text-[12px] text-[var(--text-tertiary)]">
                          {intervalLabel(rule.interval)}
                        </span>
                        {acc && (
                          <span className="font-sans text-[12px] text-[var(--text-tertiary)]">
                            {acc.icon} {acc.name}
                          </span>
                        )}
                        {cat && (
                          <span className="font-sans text-[12px] text-[var(--text-tertiary)]">
                            {cat.icon} {cat.name}
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 font-sans text-[11px]" style={{ color: rule.active ? 'var(--color-brand-500)' : 'var(--text-tertiary)' }}>
                        {rule.active ? `Next: ${nextDate}` : `Paused · Next would be ${nextDate}`}
                      </p>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)]">
                    <button
                      onClick={() => handleRunNow(rule.id)}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-sans text-[12px] font-bold bg-[var(--bg-surface-2)] text-[var(--text-secondary)]"
                    >
                      <RefreshCw size={12} />
                      Run now
                    </button>
                    <button
                      onClick={() => handleToggle(rule.id, rule.active)}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-sans text-[12px] font-bold bg-[var(--bg-surface-2)] text-[var(--text-secondary)]"
                    >
                      {rule.active ? <><Pause size={12} />Pause</> : <><Play size={12} />Resume</>}
                    </button>
                    <button
                      onClick={() => navigate(`/spending/recurring/edit/${rule.id}`)}
                      className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-surface-2)]"
                    >
                      <Pencil size={14} color="var(--text-secondary)" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/spending/recurring/new')}
        className="fixed bottom-40 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:scale-90 transition-transform"
        style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
        aria-label="Add recurring rule"
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
      </button>
    </div>
  )
}
