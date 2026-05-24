import { useEffect, useState } from 'react'
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
  { id: 'expense',  label: 'Expense',  Icon: TrendingDown,    color: '#ef4444' },
  { id: 'income',   label: 'Income',   Icon: TrendingUp,      color: '#22c55e' },
  { id: 'transfer', label: 'Transfer', Icon: ArrowLeftRight,  color: '#3b82f6' },
]

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
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

export default function TransactionEditor() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)
  const [currency, setCurrency] = useState('INR')

  const accounts = useLiveQuery(() => accountsRepo.getAll(), []) ?? []
  const allCategories = useLiveQuery(() => categoriesRepo.getAll(), []) ?? []

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: (searchParams.get('type') as TransactionType) ?? 'expense',
      amount: undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
      accountId: '',
      toAccountId: '',
      categoryId: '',
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
      if (!tx) { navigate('/spending/transactions'); return }
      reset({
        type:        tx.type,
        amount:      tx.amount,
        date:        tx.date,
        accountId:   tx.accountId,
        toAccountId: tx.toAccountId ?? '',
        categoryId:  tx.categoryId ?? '',
        tags:        tx.tags,
        note:        tx.note ?? '',
        payee:       tx.payee ?? '',
      })
      setLoading(false)
    })
  }, [id, isEdit, navigate, reset])

  // Auto-select first account if only one exists
  useEffect(() => {
    if (!watch('accountId') && accounts.length === 1) {
      setValue('accountId', accounts[0].id)
    }
  }, [accounts, setValue, watch])

  const onSubmit = async (data: TransactionFormValues) => {
    const payload = {
      type:        data.type,
      amount:      data.amount,
      date:        data.date,
      accountId:   data.accountId,
      tags:        data.tags,
      note:        data.note,
      payee:       data.payee,
      currency,
      toAccountId:  data.type === 'transfer' ? data.toAccountId : undefined,
      categoryId:   data.type !== 'transfer' ? data.categoryId  : undefined,
    }
    try {
      if (isEdit && id) {
        await transactionsRepo.update(id, payload)
        toast.success('Transaction updated')
      } else {
        await transactionsRepo.create(payload)
        toast.success('Transaction saved')
      }
      navigate(-1)
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
    navigate('/spending/transactions')
  }

  if (loading) return (
    <div className="min-h-screen bg-app flex items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
    </div>
  )

  const typeInfo = TYPE_OPTIONS.find(t => t.id === txType)!

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-2xl px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)]">
            <ChevronLeft size={20} color="var(--text-primary)" />
          </button>
          <h1 className="font-sans text-[22px] font-extrabold tracking-tight text-[var(--text-primary)]">
            {isEdit ? 'Edit Transaction' : 'New Transaction'}
          </h1>
          {isEdit && (
            <button onClick={() => setShowDelete(true)} className="ml-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)]">
              <Trash2 size={18} color="var(--color-overdue)" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

          {/* Type switcher */}
          <div className="glass-panel rounded-[28px] p-2 flex gap-1.5">
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

          <div className="glass-panel rounded-[28px] p-5 flex flex-col gap-5">

            {/* Amount — large prominent input */}
            <div>
              <label className="mb-1.5 block font-sans text-[12px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                Amount ({currency})
              </label>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 font-sans text-[22px] font-extrabold"
                  style={{ color: typeInfo.color }}
                >
                  {txType === 'income' ? '+' : txType === 'expense' ? '−' : '⇄'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('amount')}
                  className="h-16 w-full rounded-xl border border-[var(--border-subtle)] bg-surface pl-11 pr-4 font-sans text-[28px] font-extrabold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]"
                  placeholder="0.00"
                  autoFocus={!isEdit}
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
                    placeholder="Select account…"
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
                      placeholder="Destination account…"
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
                      placeholder="Select category…"
                    />
                  )}
                />
              </Field>
            )}

            <Field label="Payee / Merchant" error={errors.payee?.message}>
              <input {...register('payee')} className={inputCls} placeholder="e.g. Zomato, Amazon…" />
            </Field>

            <Field label="Note" error={errors.note?.message}>
              <textarea
                {...register('note')}
                className="w-full min-h-[80px] rounded-xl border border-[var(--border-subtle)] bg-surface px-3.5 py-3 font-sans text-[14px] text-[var(--text-primary)] outline-none resize-none transition-colors focus:border-[var(--color-brand-500)]"
                placeholder="Optional note…"
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
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : `Add ${txType}`}
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
