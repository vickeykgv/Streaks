import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { accountSchema, type AccountFormValues } from '@/lib/schemas/spending'
import { accountsRepo } from '@/db/repos/spending/accounts'
import { settingsRepo } from '@/db/repos/settings'
import { toast } from '@/store/toastStore'
import { ConfirmDialog } from '@/components/ui'
import { ColorPicker } from '@/components/ColorPicker'

const ACCOUNT_TYPES = [
  { value: 'cash',        label: 'Cash',        icon: '💵' },
  { value: 'bank',        label: 'Bank',        icon: '🏦' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'wallet',      label: 'Wallet',      icon: '👛' },
  { value: 'other',       label: 'Other',       icon: '🏧' },
] as const

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

export default function AccountEditor() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)
  const [currency, setCurrency] = useState('INR')

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: '', type: 'bank', openingBalance: 0, color: '#6366f1', icon: '🏦' },
  })

  const selectedType = watch('type')

  useEffect(() => {
    settingsRepo.get<string>('baseCurrency', 'INR').then(setCurrency)
    if (!isEdit) return
    accountsRepo.getById(id).then(acc => {
      if (!acc) { navigate('/spending/accounts'); return }
      reset({ name: acc.name, type: acc.type, openingBalance: acc.openingBalance, color: acc.color, icon: acc.icon })
      setLoading(false)
    })
  }, [id, isEdit, navigate, reset])

  // Auto-set icon when type changes (only on create)
  useEffect(() => {
    if (isEdit) return
    const t = ACCOUNT_TYPES.find(a => a.value === selectedType)
    if (t) setValue('icon', t.icon)
  }, [selectedType, isEdit, setValue])

  const onSubmit = async (data: AccountFormValues) => {
    try {
      if (isEdit) {
        await accountsRepo.update(id, { ...data, currency })
        toast.success('Account updated')
      } else {
        await accountsRepo.create({
          name: data.name,
          type: data.type,
          openingBalance: data.openingBalance,
          color: data.color,
          icon: data.icon,
          currency,
          archived: false,
        })
        toast.success('Account created')
      }
      navigate('/spending/accounts')
    } catch {
      toast.error('Failed to save account')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await accountsRepo.delete(id)
    toast.info('Account deleted', {
      label: 'Undo',
      onClick: () => accountsRepo.restore(id),
    })
    navigate('/spending/accounts')
  }

  if (loading) {
    return <div className="min-h-screen bg-app flex items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
    </div>
  }

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-2xl px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)]">
            <ChevronLeft size={20} color="var(--text-primary)" />
          </button>
          <h1 className="font-sans text-[22px] font-extrabold tracking-tight text-[var(--text-primary)]">
            {isEdit ? 'Edit Account' : 'New Account'}
          </h1>
          {isEdit && (
            <button onClick={() => setShowDelete(true)} className="ml-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)]">
              <Trash2 size={18} color="var(--color-overdue)" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="glass-panel rounded-[28px] p-5 flex flex-col gap-5">

            <Field label="Account name" error={errors.name?.message}>
              <input {...register('name')} className={inputCls} placeholder="e.g. HDFC Savings" autoFocus />
            </Field>

            <Field label="Account type">
              <div className="grid grid-cols-5 gap-1.5">
                {ACCOUNT_TYPES.map(({ value, label, icon }) => {
                  const on = selectedType === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('type', value, { shouldValidate: true })}
                      className="flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-all"
                      style={{
                        background: on ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                        border: on ? 'none' : '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="text-[20px]">{icon}</span>
                      <span className="font-sans text-[10px] font-bold" style={{ color: on ? '#fff' : 'var(--text-secondary)' }}>{label}</span>
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label={`Opening balance (${currency})`} error={errors.openingBalance?.message}>
              <input
                type="number"
                step="0.01"
                {...register('openingBalance')}
                className={inputCls}
                placeholder="0.00"
              />
            </Field>

            <Field label="Colour">
              <Controller
                control={control}
                name="color"
                render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
              />
            </Field>

          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-13 w-full rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)] disabled:opacity-60"
            style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)', height: '52px' }}
          >
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create account'}
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete account?"
        description="This removes the account permanently. Transactions linked to it will remain."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setShowDelete(false)}
        danger
      />
    </div>
  )
}
