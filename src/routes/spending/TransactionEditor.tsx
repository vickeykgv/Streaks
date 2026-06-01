import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Trash2, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import { format } from 'date-fns'
import { transactionSchema, type TransactionFormValues } from '@/lib/schemas/spending'
import { transactionsRepo } from '@/db/repos/spending/transactions'
import { accountsRepo } from '@/db/repos/spending/accounts'
import { categoriesRepo } from '@/db/repos/spending/categories'
import { settingsRepo } from '@/db/repos/settings'
import { toast } from '@/store/toastStore'
import { ConfirmDialog, Select, DatePicker } from '@/components/ui'
import { TagInput } from '@/components/TagInput'
import type { TransactionType } from '@/types/spending'

const TYPE_OPTIONS: { id: TransactionType; label: string; Icon: typeof TrendingUp; color: string }[] = [
  { id: 'expense', label: 'Expense', Icon: TrendingDown, color: '#ef4444' },
  { id: 'income', label: 'Income', Icon: TrendingUp, color: '#22c55e' },
  { id: 'transfer', label: 'Transfer', Icon: ArrowLeftRight, color: '#3b82f6' },
]

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-sans text-[12px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-[var(--color-overdue)]">{error}</p>}
    </div>
  )
}

const inputCls = 'h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-surface px-3.5 font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]'

interface TransactionEditorProps {
  embedded?: boolean
  initialType?: TransactionType
  initialId?: string
  initialCategoryId?: string
  onClose?: () => void
  onSaved?: () => void
}

export default function TransactionEditor({
  embedded = false,
  initialType,
  initialId,
  initialCategoryId,
  onClose,
  onSaved,
}: TransactionEditorProps = {}) {
  const navigate = useNavigate()
  const { id: routeId } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const id = initialId ?? routeId
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)
  const [currency, setCurrency] = useState('INR')

  const accounts = useLiveQuery(() => accountsRepo.getAll(), []) ?? []
  const allCategories = useLiveQuery(() => categoriesRepo.getAll(), []) ?? []

  const closeEditor = () => {
    if (embedded) onClose?.()
    else navigate(-1)
  }

  const finishEditor = () => {
    if (embedded) onSaved?.()
    else navigate(-1)
  }

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialType ?? (searchParams.get('type') as TransactionType) ?? 'expense',
      amount: undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
      accountId: '',
      toAccountId: '',
      categoryId: initialCategoryId ?? '',
      tags: [],
      note: '',
      payee: '',
    },
  })

  const txType = watch('type')
  const accountId = watch('accountId')

  const categoryOptions = allCategories
    .filter(c => c.type === (txType === 'income' ? 'income' : 'expense'))
    .map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))

  const accountOptions = accounts.map(a => ({ value: a.id, label: `${a.icon} ${a.name}` }))
  const toAccountOptions = accountOptions.filter(a => a.value !== accountId)

  useEffect(() => {
    settingsRepo.get<string>('baseCurrency', 'INR').then(setCurrency)
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    transactionsRepo.getById(id).then(tx => {
      if (!tx) {
        if (embedded) onClose?.()
        else navigate('/spending/transactions')
        return
      }
      reset({
        type: tx.type,
        amount: tx.amount,
        date: tx.date,
        accountId: tx.accountId,
        toAccountId: tx.toAccountId ?? '',
        categoryId: tx.categoryId ?? '',
        tags: tx.tags,
        note: tx.note ?? '',
        payee: tx.payee ?? '',
      })
      setLoading(false)
    })
  }, [embedded, id, isEdit, navigate, onClose, reset])

  useEffect(() => {
    if (!watch('accountId') && accounts.length === 1) {
      setValue('accountId', accounts[0].id)
    }
  }, [accounts, setValue, watch])

  const onSubmit = async (data: TransactionFormValues) => {
    const payload = {
      type: data.type,
      amount: data.amount,
      date: data.date,
      accountId: data.accountId,
      tags: data.tags,
      note: data.note,
      payee: data.payee,
      currency,
      toAccountId: data.type === 'transfer' ? data.toAccountId : undefined,
      categoryId: data.type !== 'transfer' ? data.categoryId : undefined,
    }
    try {
      if (isEdit && id) {
        await transactionsRepo.update(id, payload)
        toast.success('Transaction updated')
      } else {
        await transactionsRepo.create(payload)
        toast.success('Transaction saved')
      }
      finishEditor()
    } catch {
      toast.error('Failed to save transaction')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await transactionsRepo.delete(id)
    toast.info('Transaction deleted', {
      label: 'Undo',
      onClick: () => transactionsRepo.restore(id),
    })
    if (embedded) onSaved?.()
    else navigate('/spending/transactions')
  }

  if (loading) {
    return (
      <div className={`${embedded ? 'min-h-[320px]' : 'min-h-screen bg-app'} flex items-center justify-center`}>
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
      </div>
    )
  }

  const typeInfo = TYPE_OPTIONS.find(t => t.id === txType)!

  const formFields = (
    <div className="flex flex-col gap-5">
      {/* Type selector */}
      <div className="glass-panel flex gap-1.5 rounded-[28px] p-2">
        {TYPE_OPTIONS.map(({ id: tid, label, Icon, color }) => {
          const active = txType === tid
          return (
            <button
              key={tid}
              type="button"
              onClick={() => setValue('type', tid, { shouldValidate: true })}
              className="flex flex-1 items-center justify-center gap-2 rounded-[20px] py-3 font-sans text-[13px] font-bold transition-all"
              style={{
                background: active ? color : 'transparent',
                color: active ? '#fff' : 'var(--text-tertiary)',
                boxShadow: active ? `0 4px 14px ${color}55` : 'none',
              }}
            >
              <Icon size={15} strokeWidth={2.5} />
              {label}
            </button>
          )
        })}
      </div>

      <div className="glass-panel flex flex-col gap-5 rounded-[28px] p-5">
        <div>
          <label className="mb-1.5 block font-sans text-[12px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
            Amount ({currency})
          </label>
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 font-sans text-[22px] font-extrabold"
              style={{ color: typeInfo.color }}
            >
              {txType === 'income' ? '+' : txType === 'expense' ? '-' : '↔'}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('amount')}
              className="h-16 w-full rounded-xl border border-[var(--border-subtle)] bg-surface pl-11 pr-4 font-sans text-[28px] font-extrabold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]"
              placeholder="0.00"
              autoFocus={!isEdit && !embedded}
            />
          </div>
          {errors.amount && <p className="mt-1 text-[11px] text-[var(--color-overdue)]">{errors.amount.message}</p>}
        </div>

        <Field label="Date" error={errors.date?.message}>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} maxDate={format(new Date(), 'yyyy-MM-dd')} />
            )}
          />
        </Field>

        <Field label="Account" error={errors.accountId?.message}>
          <Controller
            control={control}
            name="accountId"
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                options={accountOptions}
                placeholder="Select account..."
              />
            )}
          />
        </Field>

        {txType === 'transfer' && (
          <Field label="To Account" error={errors.toAccountId?.message}>
            <Controller
              control={control}
              name="toAccountId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={toAccountOptions}
                  placeholder="Destination account..."
                />
              )}
            />
          </Field>
        )}

        {txType !== 'transfer' && (
          <Field label="Category" error={errors.categoryId?.message}>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={categoryOptions}
                  placeholder="Select category..."
                />
              )}
            />
          </Field>
        )}

        <Field label="Payee / Merchant" error={errors.payee?.message}>
          <input {...register('payee')} className={inputCls} placeholder="e.g. Zomato, Amazon..." />
        </Field>

        <Field label="What was this for?" error={errors.note?.message}>
          <textarea
            {...register('note')}
            className="min-h-[80px] w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-surface px-3.5 py-3 font-sans text-[14px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]"
            placeholder="e.g. groceries for the week, birthday gift, fuel…"
          />
        </Field>

        <Field label="Tags">
          <Controller
            control={control}
            name="tags"
            render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
          />
        </Field>
      </div>
    </div>
  )

  /* ── Embedded mode (Modal / BottomSheet) ─────────────────────────── */
  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Delete button for edit mode */}
        {isEdit && (
          <div className="flex justify-end px-5 py-1">
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-surface-2)]"
            >
              <Trash2 size={17} color="var(--color-overdue)" />
            </button>
          </div>
        )}

        {/* Scrollable form area */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
          <form id="tx-editor-form" onSubmit={handleSubmit(onSubmit)}>
            {formFields}
          </form>
        </div>

        {/* Pinned footer */}
        <div className="flex flex-col gap-2 border-t border-[var(--border-subtle)] px-4 pb-4 pt-3">
          <button
            type="submit"
            form="tx-editor-form"
            disabled={isSubmitting}
            className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-white disabled:opacity-60"
            style={{
              height: '52px',
              background: typeInfo.color,
              boxShadow: `0 4px 18px ${typeInfo.color}55`,
            }}
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : `Add ${txType}`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] font-sans text-[14px] font-bold text-[var(--text-secondary)]"
            style={{ height: '44px' }}
          >
            Cancel
          </button>
        </div>

        <ConfirmDialog
          open={showDelete}
          title="Delete transaction?"
          description="This action cannot be undone unless you tap Undo in the toast."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
          danger
        />
      </div>
    )
  }

  /* ── Standalone page ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={closeEditor} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)]">
            <ChevronLeft size={20} color="var(--text-primary)" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-sans text-[22px] font-extrabold tracking-tight text-[var(--text-primary)]">
              {isEdit ? 'Edit Transaction' : 'New Transaction'}
            </h1>
          </div>
          {isEdit && (
            <button onClick={() => setShowDelete(true)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)]">
              <Trash2 size={18} color="var(--color-overdue)" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {formFields}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-white disabled:opacity-60"
            style={{
              height: '52px',
              background: typeInfo.color,
              boxShadow: `0 4px 18px ${typeInfo.color}55`,
            }}
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : `Add ${txType}`}
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete transaction?"
        description="This action cannot be undone unless you tap Undo in the toast."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setShowDelete(false)}
        danger
      />
    </div>
  )
}
