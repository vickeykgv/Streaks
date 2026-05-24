import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Building2, ChevronRight } from 'lucide-react'
import { accountsRepo } from '@/db/repos/spending/accounts'
import { transactionsRepo } from '@/db/repos/spending/transactions'
import { settingsRepo } from '@/db/repos/settings'
import { cn } from '@/lib/utils'
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

export default function SpendingAccounts() {
  const navigate = useNavigate()
  const [currency, setCurrency] = useState('INR')

  useEffect(() => { settingsRepo.get<string>('baseCurrency', 'INR').then(setCurrency) }, [])

  const accounts = useLiveQuery(() => accountsRepo.getAll(), []) ?? []
  const balances = useAccountBalances(accounts)

  const totalNet = accounts.reduce((sum, a) => sum + (balances[a.id] ?? 0), 0)

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-3xl px-4 pt-4">

        {/* Header */}
        <div className="hero-panel rounded-[30px] px-5 py-5 mb-5">
          <div className="section-kicker mb-2">Accounts</div>
          <div className="font-sans text-[30px] font-extrabold tracking-tight text-[var(--text-primary)]">My Accounts</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-sans text-[13px] text-[var(--text-secondary)]">Net worth</span>
            <span
              className="font-sans text-[22px] font-extrabold"
              style={{ color: totalNet >= 0 ? 'var(--color-done)' : 'var(--color-overdue)' }}
            >
              {formatAmount(totalNet, currency)}
            </span>
          </div>
        </div>

        {/* Accounts list */}
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
              onClick={() => navigate('/spending/accounts/new')}
              className="mt-2 flex items-center gap-2 rounded-2xl px-5 py-3 font-sans text-[14px] font-bold text-white"
              style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
            >
              <Plus size={16} strokeWidth={2.5} /> Add first account
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {accounts.map(acc => {
              const balance = balances[acc.id] ?? 0
              const isNeg = balance < 0
              return (
                <button
                  key={acc.id}
                  onClick={() => navigate(`/spending/accounts/edit/${acc.id}`)}
                  className="glass-panel flex items-center gap-4 rounded-[24px] px-4 py-4 w-full text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {/* Icon */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-[24px]"
                    style={{ background: `${acc.color}22` }}
                  >
                    {acc.icon}
                  </div>

                  {/* Name + type */}
                  <div className="flex-1 min-w-0">
                    <div className="font-sans text-[15px] font-bold text-[var(--text-primary)] truncate">{acc.name}</div>
                    <div className="font-body text-[12px] text-[var(--text-tertiary)] capitalize">{acc.type.replace('_', ' ')}</div>
                  </div>

                  {/* Balance */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn('font-sans text-[17px] font-extrabold', isNeg ? 'text-[var(--color-overdue)]' : 'text-[var(--color-done)]')}
                    >
                      {formatAmount(balance, currency)}
                    </span>
                    <ChevronRight size={16} color="var(--text-tertiary)" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/spending/accounts/new')}
        className="fixed bottom-40 right-5 flex h-14 w-14 items-center justify-center rounded-full shadow-[var(--shadow-fab)] z-10"
        style={{ background: 'var(--color-brand-500)' }}
        aria-label="Add account"
      >
        <Plus size={24} strokeWidth={2.5} color="#fff" />
      </button>
    </div>
  )
}
