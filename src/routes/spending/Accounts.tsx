import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Building2, ChevronRight, Wallet, CreditCard, PiggyBank, TrendingUp, TrendingDown, ArrowLeftRight, Target, Tag, CalendarClock } from 'lucide-react'
import { accountsRepo } from '@/db/repos/spending/accounts'
import { transactionsRepo } from '@/db/repos/spending/transactions'
import { settingsRepo } from '@/db/repos/settings'
import { Modal, BottomSheet } from '@/components/ui'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import { ActionDropdown } from '@/components/ActionDropdown'
import AccountEditor from '@/routes/spending/AccountEditor'
import { cn } from '@/lib/utils'
import { openSpendingEditor } from '@/store/spendingEditor'
import type { SpendingAccount } from '@/types/spending'

function formatAmount(n: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}

function useAccountBalances(accounts: SpendingAccount[]) {
  const transactions = useLiveQuery(() => transactionsRepo.getAll(), []) ?? []

  const balances: Record<string, number> = {}
  for (const acc of accounts) {
    balances[acc.id] = acc.openingBalance
  }
  for (const tx of transactions) {
    if (tx.type === 'expense') {
      balances[tx.accountId] = (balances[tx.accountId] ?? 0) - tx.amount
    } else if (tx.type === 'income') {
      balances[tx.accountId] = (balances[tx.accountId] ?? 0) + tx.amount
    } else if (tx.type === 'transfer') {
      balances[tx.accountId]    = (balances[tx.accountId]    ?? 0) - tx.amount
      if (tx.toAccountId) {
        balances[tx.toAccountId] = (balances[tx.toAccountId] ?? 0) + tx.amount
      }
    }
  }
  return balances
}

const ACCOUNT_TYPE_ICON: Record<string, React.ReactNode> = {
  bank:        <Wallet size={14} strokeWidth={2} />,
  cash:        <PiggyBank size={14} strokeWidth={2} />,
  credit_card: <CreditCard size={14} strokeWidth={2} />,
  savings:     <TrendingUp size={14} strokeWidth={2} />,
  investment:  <TrendingUp size={14} strokeWidth={2} />,
}

export default function SpendingAccounts() {
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

  const accounts = useLiveQuery(() => accountsRepo.getAll(), []) ?? []
  const balances = useAccountBalances(accounts)

  const totalNet    = accounts.reduce((sum, a) => sum + (balances[a.id] ?? 0), 0)
  const totalAssets = accounts.reduce((sum, a) => {
    const b = balances[a.id] ?? 0
    return b > 0 ? sum + b : sum
  }, 0)
  const totalDebt   = accounts.reduce((sum, a) => {
    const b = balances[a.id] ?? 0
    return b < 0 ? sum + Math.abs(b) : sum
  }, 0)

  const spendingActions = [
    { label: 'Account',     icon: <Wallet size={14} strokeWidth={2.5} />,         onClick: openNew },
    { label: 'Transaction', icon: <ArrowLeftRight size={14} strokeWidth={2.5} />, onClick: () => openSpendingEditor({ kind: 'transaction', type: 'expense' }) },
    { label: 'Budget',      icon: <Target size={14} strokeWidth={2.5} />,         onClick: () => navigate('/spending/budgets') },
    { label: 'Category',    icon: <Tag size={14} strokeWidth={2.5} />,            onClick: () => navigate('/spending/categories') },
    { label: 'Recurring',   icon: <CalendarClock size={14} strokeWidth={2.5} />,  onClick: () => navigate('/spending/recurring') },
  ]

  return (
    <div className="min-h-screen bg-app pb-28">
      <DesktopPageHeader action={<ActionDropdown items={spendingActions} />} />
      <div className="w-full px-4 pt-4 pb-6 lg:px-6">

        {/* Hero */}
        <div className="hero-panel rounded-[32px] px-5 py-5 mb-5 lg:px-7 lg:py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="section-kicker mb-1.5">Accounts</div>
            <div className="font-sans text-[30px] lg:text-[38px] font-extrabold tracking-tight text-[var(--text-primary)]">My Accounts</div>
            <div className="mt-1.5 font-body text-[13px] text-[var(--text-secondary)]">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} · net worth
              <span
                className="ml-1.5 font-sans text-[14px] font-extrabold"
                style={{ color: totalNet >= 0 ? 'var(--text-success)' : 'var(--color-overdue)' }}
              >
                {formatAmount(totalNet, currency)}
              </span>
            </div>
          </div>

          {accounts.length > 0 && (
            <div className="flex gap-3 lg:shrink-0">
              <div className="flex-1 lg:flex-none rounded-[18px] bg-[var(--bg-surface-2)] px-4 py-3 lg:min-w-[120px]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp size={12} color="#22c55e" />
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Assets</span>
                </div>
                <div className="font-sans text-[15px] font-extrabold text-[#22c55e]">{formatAmount(totalAssets, currency)}</div>
              </div>
              <div className="flex-1 lg:flex-none rounded-[18px] bg-[var(--bg-surface-2)] px-4 py-3 lg:min-w-[120px]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingDown size={12} color="#ef4444" />
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Debt</span>
                </div>
                <div className="font-sans text-[15px] font-extrabold text-[#ef4444]">{formatAmount(totalDebt, currency)}</div>
              </div>
            </div>
          )}

        </div>

        {/* Content */}
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 mt-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-[var(--bg-surface-2)]">
              <Building2 size={28} strokeWidth={1.5} color="var(--text-tertiary)" />
            </div>
            <p className="font-sans text-[15px] font-bold text-[var(--text-primary)]">No accounts yet</p>
            <p className="max-w-xs font-body text-[13px] text-[var(--text-tertiary)]">
              Add a cash wallet, bank account, or credit card to get started.
            </p>
            <button
              onClick={() => openNew()}
              className="mt-2 flex items-center gap-2 rounded-2xl px-5 py-3 font-sans text-[14px] font-bold text-white"
              style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
            >
              <Plus size={16} strokeWidth={2.5} /> Add first account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map(acc => {
              const balance = balances[acc.id] ?? 0
              const isNeg = balance < 0
              const typeIcon = ACCOUNT_TYPE_ICON[acc.type]
              return (
                <button
                  key={acc.id}
                  onClick={() => openEdit(acc.id)}
                  className="glass-panel flex flex-col rounded-[24px] px-5 py-4 w-full text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {/* Top row: icon + chevron */}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-[18px] text-[24px]"
                      style={{ background: `${acc.color}22` }}
                    >
                      {acc.icon}
                    </div>
                    <ChevronRight size={15} color="var(--text-tertiary)" />
                  </div>

                  {/* Name + type */}
                  <div className="mb-3 flex-1">
                    <div className="font-sans text-[15px] font-bold text-[var(--text-primary)] truncate">{acc.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[var(--text-tertiary)]">{typeIcon}</span>
                      <span className="font-body text-[12px] text-[var(--text-tertiary)] capitalize">{acc.type.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className={cn('font-sans text-[22px] font-extrabold', isNeg ? 'text-[var(--color-overdue)]' : 'text-[var(--text-success)]')}>
                    {formatAmount(balance, currency)}
                  </div>
                  <div className="mt-0.5 font-body text-[11px] text-[var(--text-tertiary)]">Current balance</div>
                </button>
              )
            })}

            {/* Add account card */}
            <button
              onClick={() => openNew()}
              className="flex flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-[var(--border-subtle)] bg-transparent px-5 py-8 text-center transition-all hover:border-[var(--color-brand-500)] hover:bg-[var(--bg-surface-2)] active:scale-[0.98] min-h-[160px]"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[16px]"
                style={{ background: 'var(--color-brand-500)22' }}
              >
                <Plus size={20} strokeWidth={2.5} color="var(--color-brand-500)" />
              </div>
              <span className="font-sans text-[13px] font-bold text-[var(--text-secondary)]">Add account</span>
            </button>
          </div>
        )}
      </div>

      {/* FAB (mobile only) */}
      <button
        onClick={openNew}
        className="fixed bottom-40 right-5 flex h-14 w-14 items-center justify-center rounded-full shadow-[var(--shadow-fab)] z-10 lg:hidden"
        style={{ background: 'var(--color-brand-500)' }}
        aria-label="Add account"
      >
        <Plus size={24} strokeWidth={2.5} color="#fff" />
      </button>

      {isDesktop ? (
        <Modal
          open={editorState.open}
          onClose={closeEditor}
          title={editorState.id ? 'Edit Account' : 'New Account'}
          size="sm"
        >
          <AccountEditor
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
          title={editorState.id ? 'Edit Account' : 'New Account'}
        >
          <AccountEditor
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
