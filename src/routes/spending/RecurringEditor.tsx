import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { recurringRepo } from '@/db/repos/spending/recurring'
import { accountsRepo } from '@/db/repos/spending/accounts'
import { categoriesRepo } from '@/db/repos/spending/categories'
import { settingsRepo } from '@/db/repos/settings'
import { toast } from '@/store/toastStore'
import { Select, DatePicker, ConfirmDialog } from '@/components/ui'
import type { TransactionType, SpendingInterval } from '@/types/spending'

const recurringSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(100),
  type:        z.enum(['income', 'expense', 'transfer']).default('expense'),
  amount:      z.coerce.number({ invalid_type_error: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
  accountId:   z.string().min(1, 'Account required'),
  toAccountId: z.string().optional(),
  categoryId:  z.string().optional(),
  payee:       z.string().max(100).optional().or(z.literal('')).transform(v => v || undefined),
  note:        z.string().max(500).optional().or(z.literal('')).transform(v => v || undefined),
  interval:    z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']).default('monthly'),
  startDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date required'),
}).superRefine((data, ctx) => {
  if (data.type === 'transfer' && !data.toAccountId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Destination account required', path: ['toAccountId'] })
  }
  if (data.type !== 'transfer' && !data.categoryId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Category required', path: ['categoryId'] })
  }
})

type FormValues = z.infer<typeof recurringSchema>

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

const INTERVALS: { value: SpendingInterval; label: string }[] = [
  { value: 'daily',    label: 'Daily'     },
  { value: 'weekly',   label: 'Weekly'    },
  { value: 'biweekly', label: 'Biweekly'  },
  { value: 'monthly',  label: 'Monthly'   },
  { value: 'yearly',   label: 'Yearly'    },
]

const TX_TYPES: { value: TransactionType; label: string; color: string }[] = [
  { value: 'expense',  label: 'Expense',  color: '#ef4444' },
  { value: 'income',   label: 'Income',   color: '#22c55e' },
  { value: 'transfer', label: 'Transfer', color: '#6366f1' },
]

export default function RecurringEditor() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)
  const [currency, setCurrency] = useState('INR')
  useEffect(() => { settingsRepo.get<string>('baseCurrency', 'INR').then(setCurrency) }, [])

  const accounts   = useLiveQuery(() => accountsRepo.getAll(), []) ?? []
  const categories = useLiveQuery(() => categoriesRepo.getAll(true), []) ?? []

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      name: '', type: 'expense', amount: 0,
      accountId: '', toAccountId: '', categoryId: '',
      interval: 'monthly',
      startDate: format(addMonths(new Date(), 0), 'yyyy-MM-dd'),
    },
  })

  const selectedType     = watch('type')
  const selectedInterval = watch('interval')

  const accountOptions  = accounts.map(a => ({ value: a.id, label: `${a.icon} ${a.name}` }))
  const categoryOptions = categories
    .filter(c => c.type === (selectedType === 'income' ? 'income' : 'expense'))
    .map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))

  useEffect(() => {
    if (!isEdit || !id) return
    recurringRepo.getById(id).then(r => {
      if (!r) { navigate('/spending/recurring'); return }
      reset({
        name:        r.name,
        type:        r.type,
        amount:      r.amount,
        accountId:   r.accountId,
        toAccountId: r.toAccountId ?? '',
        categoryId:  r.categoryId ?? '',
        payee:       r.payee,
        note:        r.note,
        interval:    r.interval,
        startDate:   format(new Date(r.nextRunAt), 'yyyy-MM-dd'),
      })
      setLoading(false)
    })
  }, [id, isEdit, navigate, reset])

  const onSubmit = async (data: FormValues) => {
    const nextRunAt = new Date(data.startDate).getTime()
    const payload = {
      name:        data.name,
      type:        data.type,
      amount:      data.amount,
      currency,
      accountId:   data.accountId,
      toAccountId: data.type === 'transfer' ? data.toAccountId : undefined,
      categoryId:  data.type !== 'transfer' ? data.categoryId : undefined,
      payee:       data.payee,
      note:        data.note,
      interval:    data.interval,
      nextRunAt,
      active:      true,
      tags:        [] as string[],
    }
    try {
      if (isEdit && id) {
        await recurringRepo.update(id, payload)
        toast.success('Rule updated')
      } else {
        await recurringRepo.create(payload)
        toast.success('Recurring rule created')
      }
      navigate('/spending/recurring')
    } catch {
      toast.error('Failed to save')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await recurringRepo.delete(id)
    toast.info('Rule deleted', { label: 'Undo', onClick: () => recurringRepo.restore(id) })
    navigate('/spending/recurring')
  }

  if (loading) return (
    <div className="min-h-screen bg-app flex items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
    </div>
  )

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-2xl px-4 pt-4">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)]">
            <ChevronLeft size={20} color="var(--text-primary)" />
          </button>
          <h1 className="font-sans text-[22px] font-extrabold tracking-tight text-[var(--text-primary)]">
            {isEdit ? 'Edit Rule' : 'New Recurring Rule'}
          </h1>
          {isEdit && (
            <button onClick={() => setShowDelete(true)} className="ml-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)]">
              <Trash2 size={18} color="var(--color-overdue)" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="glass-panel rounded-[28px] p-5 flex flex-col gap-5">

            <Field label="Name" error={errors.name?.message}>
              <input {...register('name')} className={inputCls} placeholder="e.g. Monthly Rent" autoFocus={!isEdit} />
            </Field>

            {/* Type */}
            <Field label="Type">
              <div className="grid grid-cols-3 gap-2">
                {TX_TYPES.map(({ value, label, color }) => {
                  const on = selectedType === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setValue('type', value); setValue('categoryId', '') }}
                      className="rounded-2xl py-2.5 font-sans text-[13px] font-bold transition-all"
                      style={{
                        background: on ? color : 'var(--bg-surface-2)',
                        color: on ? '#fff' : 'var(--text-secondary)',
                        border: on ? 'none' : '1px solid var(--border-subtle)',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Amount" error={errors.amount?.message}>
              <input {...register('amount')} type="number" step="0.01" min="0" className={inputCls} placeholder="0" />
            </Field>

            <Field label="Account" error={errors.accountId?.message}>
              <Controller
                control={control}
                name="accountId"
                render={({ field }) => (
                  <Select value={field.value} onChange={field.onChange}
                    options={[{ value: '', label: 'Select account…' }, ...accountOptions]}
                  />
                )}
              />
            </Field>

            {selectedType === 'transfer' ? (
              <Field label="To account" error={errors.toAccountId?.message}>
                <Controller
                  control={control}
                  name="toAccountId"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onChange={field.onChange}
                      options={[{ value: '', label: 'Select account…' }, ...accountOptions]}
                    />
                  )}
                />
              </Field>
            ) : (
              <Field label="Category" error={errors.categoryId?.message}>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onChange={field.onChange}
                      options={[{ value: '', label: 'Select category…' }, ...categoryOptions]}
                    />
                  )}
                />
              </Field>
            )}

            <Field label="Payee (optional)">
              <input {...register('payee')} className={inputCls} placeholder="e.g. Landlord" />
            </Field>

            {/* Interval */}
            <Field label="Repeats">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {INTERVALS.map(({ value, label }) => {
                  const on = selectedInterval === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('interval', value)}
                      className="rounded-2xl py-2.5 font-sans text-[12px] font-bold transition-all"
                      style={{
                        background: on ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                        color: on ? '#fff' : 'var(--text-secondary)',
                        border: on ? 'none' : '1px solid var(--border-subtle)',
                        boxShadow: on ? 'var(--shadow-glow)' : 'none',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="First run on" error={errors.startDate?.message}>
              <Controller
                control={control}
                name="startDate"
                render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
              />
            </Field>

          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-white disabled:opacity-60"
            style={{ height: '52px', background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
          >
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create rule'}
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete recurring rule?"
        description="Future transactions won't be created automatically. Existing transactions are not affected."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setShowDelete(false)}
        danger
      />
    </div>
  )
}
