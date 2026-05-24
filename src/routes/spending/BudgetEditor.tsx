import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { budgetSchema, type BudgetFormValues } from '@/lib/schemas/spending'
import { budgetsRepo } from '@/db/repos/spending/budgets'
import { categoriesRepo } from '@/db/repos/spending/categories'
import { toast } from '@/store/toastStore'
import { DatePicker, ConfirmDialog } from '@/components/ui'
import type { BudgetPeriod } from '@/types/spending'

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

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly'  },
  { value: 'custom',  label: 'Custom'  },
]

export default function BudgetEditor() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)

  const categories = useLiveQuery(() => categoriesRepo.getByType('expense'), []) ?? []

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      amount: 0,
      period: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: undefined,
      categoryIds: [],
      rollover: false,
    },
  })

  const selectedPeriod   = watch('period')
  const selectedCatIds   = watch('categoryIds')
  const rollover         = watch('rollover')

  useEffect(() => {
    if (!isEdit || !id) return
    budgetsRepo.getById(id).then(b => {
      if (!b) { navigate('/spending/budgets'); return }
      reset({
        name:        b.name,
        amount:      b.amount,
        period:      b.period,
        startDate:   b.startDate,
        endDate:     b.endDate,
        categoryIds: b.categoryIds,
        rollover:    b.rollover,
      })
      setLoading(false)
    })
  }, [id, isEdit, navigate, reset])

  const toggleCategory = (catId: string) => {
    const cur = selectedCatIds ?? []
    setValue('categoryIds', cur.includes(catId) ? cur.filter(c => c !== catId) : [...cur, catId])
  }

  const onSubmit = async (data: BudgetFormValues) => {
    const payload = {
      name:        data.name,
      amount:      data.amount,
      period:      data.period,
      startDate:   data.startDate,
      endDate:     data.period === 'custom' ? data.endDate : undefined,
      categoryIds: data.categoryIds,
      rollover:    data.rollover,
    }
    try {
      if (isEdit && id) {
        await budgetsRepo.update(id, payload)
        toast.success('Budget updated')
      } else {
        await budgetsRepo.create(payload)
        toast.success('Budget created')
      }
      navigate('/spending/budgets')
    } catch {
      toast.error('Failed to save budget')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await budgetsRepo.delete(id)
    toast.info('Budget deleted', { label: 'Undo', onClick: () => budgetsRepo.restore(id) })
    navigate('/spending/budgets')
  }

  if (loading) return (
    <div className="min-h-screen bg-app flex items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
    </div>
  )

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-2xl px-4 pt-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)]">
            <ChevronLeft size={20} color="var(--text-primary)" />
          </button>
          <h1 className="font-sans text-[22px] font-extrabold tracking-tight text-[var(--text-primary)]">
            {isEdit ? 'Edit Budget' : 'New Budget'}
          </h1>
          {isEdit && (
            <button onClick={() => setShowDelete(true)} className="ml-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)]">
              <Trash2 size={18} color="var(--color-overdue)" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="glass-panel rounded-[28px] p-5 flex flex-col gap-5">

            <Field label="Budget name" error={errors.name?.message}>
              <input {...register('name')} className={inputCls} placeholder="e.g. Monthly Groceries" autoFocus={!isEdit} />
            </Field>

            <Field label="Limit amount" error={errors.amount?.message}>
              <input {...register('amount')} type="number" step="1" min="0" className={inputCls} placeholder="0" />
            </Field>

            {/* Period */}
            <Field label="Resets every">
              <div className="grid grid-cols-4 gap-2">
                {PERIODS.map(({ value, label }) => {
                  const on = selectedPeriod === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('period', value, { shouldValidate: true })}
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

            {selectedPeriod === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date" error={errors.startDate?.message}>
                  <Controller
                    control={control}
                    name="startDate"
                    render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} />
                    )}
                  />
                </Field>
                <Field label="End date">
                  <Controller
                    control={control}
                    name="endDate"
                    render={({ field }) => (
                      <DatePicker value={field.value ?? ''} onChange={field.onChange} />
                    )}
                  />
                </Field>
              </div>
            )}

            {/* Category filter */}
            {categories.length > 0 && (
              <Field label="Track categories (all if none selected)">
                <div className="flex flex-wrap gap-2 mt-1">
                  {categories.map(c => {
                    const on = (selectedCatIds ?? []).includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCategory(c.id)}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[12px] font-bold transition-all"
                        style={{
                          background: on ? c.color + '33' : 'var(--bg-surface-2)',
                          color: on ? c.color : 'var(--text-secondary)',
                          border: `1.5px solid ${on ? c.color : 'var(--border-subtle)'}`,
                        }}
                      >
                        <span>{c.icon}</span>
                        {c.name}
                      </button>
                    )
                  })}
                </div>
              </Field>
            )}

            {/* Rollover */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans text-[14px] font-semibold text-[var(--text-primary)]">Rollover unused budget</p>
                <p className="font-sans text-[12px] text-[var(--text-tertiary)]">Add leftover to next period</p>
              </div>
              <button
                type="button"
                onClick={() => setValue('rollover', !rollover)}
                className="relative h-6 w-11 rounded-full transition-colors duration-200"
                style={{ background: rollover ? 'var(--color-brand-500)' : 'var(--border-subtle)' }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: rollover ? '22px' : '2px' }}
                />
              </button>
            </div>

          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-white disabled:opacity-60"
            style={{ height: '52px', background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
          >
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create budget'}
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete budget?"
        description="This budget will be removed. Your transactions won't be affected."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setShowDelete(false)}
        danger
      />
    </div>
  )
}
