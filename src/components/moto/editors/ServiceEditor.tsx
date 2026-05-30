import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { serviceSchema, type ServiceFormValues } from '@/lib/schemas/moto'
import { servicesRepo } from '@/db/repos/moto/services'
import { issuesRepo } from '@/db/repos/moto/issues'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { toast } from '@/store/toastStore'
import { ConfirmDialog } from '@/components/ui'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import type { ServiceType } from '@/types/moto'

const SERVICE_TYPES: { value: ServiceType; label: string; emoji: string }[] = [
  { value: 'general',    label: 'General',    emoji: '🔧' },
  { value: 'oil_change', label: 'Oil Change', emoji: '🛢️' },
  { value: 'tire',       label: 'Tyre',       emoji: '🔩' },
  { value: 'brake',      label: 'Brake',      emoji: '🛑' },
  { value: 'battery',    label: 'Battery',    emoji: '🔋' },
  { value: 'major',      label: 'Major',      emoji: '🏭' },
  { value: 'other',      label: 'Other',      emoji: '⚙️' },
]

const inputCls = 'h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3.5 font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]'

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="font-sans text-[12px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
          {label}
        </label>
        {hint && <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-[11px] text-[var(--color-overdue)]">{error}</p>}
    </div>
  )
}

function PrefixInput({ prefix, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { prefix: string }) {
  return (
    <div
      className="flex items-center h-11 rounded-xl overflow-hidden transition-colors focus-within:border-[var(--color-brand-500)]"
      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}
    >
      <span className="pl-3.5 shrink-0 font-mono text-[15px] text-[var(--text-tertiary)]">{prefix}</span>
      <input
        {...props}
        className="flex-1 min-w-0 h-full bg-transparent font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none pl-[6px] pr-3.5"
      />
    </div>
  )
}

interface ServiceEditorProps {
  id?: string
  vehicleId: string
  onClose?: () => void
  onSaved?: () => void
}

export function ServiceEditor({ id, vehicleId, onClose, onSaved }: ServiceEditorProps) {
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)

  const openIssues = useLiveQuery(
    () => issuesRepo.getAllForVehicle(vehicleId, 'open'),
    [vehicleId],
  ) ?? []

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      odoKm: 0, serviceType: 'general',
      laborCost: 0, partsCost: 0, totalCost: 0,
      linkedIssueIds: [],
    },
  })

  const serviceType    = watch('serviceType')
  const laborCost      = watch('laborCost')
  const partsCost      = watch('partsCost')
  const linkedIssueIds = watch('linkedIssueIds')

  // Auto-compute totalCost = labor + parts
  useEffect(() => {
    const l = Number(laborCost) || 0
    const p = Number(partsCost) || 0
    setValue('totalCost', l + p)
  }, [laborCost, partsCost, setValue])

  useEffect(() => {
    if (!isEdit) {
      vehiclesRepo.getById(vehicleId).then(v => {
        if (v) setValue('odoKm', v.currentOdoKm)
      })
      return
    }
    servicesRepo.getById(id).then(s => {
      if (!s) { onClose?.(); return }
      reset({
        date: s.date, odoKm: s.odoKm, serviceType: s.serviceType,
        workshop: s.workshop ?? '', laborCost: s.laborCost,
        partsCost: s.partsCost, totalCost: s.totalCost,
        nextDueDate: s.nextDueDate ?? '', nextDueOdoKm: s.nextDueOdoKm,
        note: s.note ?? '', linkedIssueIds: s.linkedIssueIds,
      })
      setLoading(false)
    })
  }, [id, isEdit, vehicleId, onClose, reset, setValue])

  const toggleIssue = (issueId: string) => {
    const current = linkedIssueIds ?? []
    setValue(
      'linkedIssueIds',
      current.includes(issueId) ? current.filter(i => i !== issueId) : [...current, issueId],
    )
  }

  const done = () => { onSaved?.(); onClose?.() }

  const onSubmit = async (data: ServiceFormValues) => {
    try {
      const payload = {
        vehicleId,
        date:          data.date,
        odoKm:         data.odoKm,
        serviceType:   data.serviceType,
        workshop:      data.workshop || undefined,
        laborCost:     data.laborCost,
        partsCost:     data.partsCost,
        totalCost:     data.totalCost,
        nextDueDate:   data.nextDueDate || undefined,
        nextDueOdoKm:  data.nextDueOdoKm,
        note:          data.note || undefined,
        linkedIssueIds: data.linkedIssueIds ?? [],
      }

      let savedId = id
      if (isEdit) {
        await servicesRepo.update(id, payload)
        toast.success('Service updated')
      } else {
        const s = await servicesRepo.create(payload)
        savedId = s.id
        toast.success('Service logged')
      }

      // Bump vehicle odometer
      const vehicle = await vehiclesRepo.getById(vehicleId)
      if (vehicle && data.odoKm > vehicle.currentOdoKm) {
        await vehiclesRepo.update(vehicleId, { currentOdoKm: data.odoKm })
      }

      // Resolve linked issues
      for (const issueId of data.linkedIssueIds ?? []) {
        await issuesRepo.resolve(issueId, savedId)
      }

      done()
    } catch {
      toast.error('Failed to save service')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await servicesRepo.delete(id)
    toast.info('Service deleted')
    done()
  }

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
    </div>
  )

  return (
    <div className="overflow-y-auto px-5 pb-6 pt-2">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Date + Odometer */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Date" error={errors.date?.message}>
            <input type="date" {...register('date')} className={inputCls} />
          </Field>
          <Field label="Odometer (km)" error={errors.odoKm?.message}>
            <input type="number" {...register('odoKm')} className={inputCls} placeholder="0" />
          </Field>
        </div>

        {/* Service type */}
        <Field label="Service type">
          <div className="grid grid-cols-4 gap-1.5">
            {SERVICE_TYPES.map(({ value, label, emoji }) => {
              const on = serviceType === value
              return (
                <button
                  key={value} type="button"
                  onClick={() => setValue('serviceType', value)}
                  className="flex flex-col items-center gap-1 rounded-2xl py-2 transition-all"
                  style={{
                    background: on ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                    border: on ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <span className="text-[18px]">{emoji}</span>
                  <span className="font-sans text-[9px] font-bold leading-tight text-center" style={{ color: on ? '#fff' : 'var(--text-secondary)' }}>{label}</span>
                </button>
              )
            })}
          </div>
        </Field>

        {/* Workshop */}
        <Field label="Workshop — optional">
          <input {...register('workshop')} className={inputCls} placeholder="e.g. Local Honda Service" />
        </Field>

        {/* Costs */}
        <div className="grid grid-cols-3 gap-2">
          <Field label="Labour" error={errors.laborCost?.message}>
            <PrefixInput type="number" step="0.01" prefix="₹" {...register('laborCost')} placeholder="0" />
          </Field>
          <Field label="Parts" error={errors.partsCost?.message}>
            <PrefixInput type="number" step="0.01" prefix="₹" {...register('partsCost')} placeholder="0" />
          </Field>
          <Field label="Total" hint="auto">
            <PrefixInput type="number" step="0.01" prefix="₹" {...register('totalCost')} />
          </Field>
        </div>

        {/* Next due */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Next due by date — optional">
            <input type="date" {...register('nextDueDate')} className={inputCls} />
          </Field>
          <Field label="Next due by odo (km) — optional">
            <input type="number" {...register('nextDueOdoKm')} className={inputCls} placeholder="e.g. 15000" />
          </Field>
        </div>

        {/* Open issues to resolve */}
        {openIssues.length > 0 && (
          <div
            className="rounded-[16px] p-[15px]"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="font-sans text-[13.5px] font-semibold text-[var(--text-primary)] mb-0.5">
              While you're here…
            </p>
            <p className="font-body text-[12.5px] text-[var(--text-secondary)] mb-3">
              Did this visit sort out any open niggles?
            </p>
            <div className="flex flex-col gap-1.5">
              {openIssues.map(issue => {
                const checked = (linkedIssueIds ?? []).includes(issue.id)
                return (
                  <button
                    key={issue.id} type="button"
                    onClick={() => toggleIssue(issue.id)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all"
                    style={{
                      background: checked ? 'rgba(229,9,20,0.08)' : 'var(--bg-surface)',
                      border: checked ? '1px solid var(--color-brand-500)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                      style={{ background: checked ? 'var(--color-brand-500)' : 'var(--bg-surface-3)', border: checked ? 'none' : '1.5px solid var(--border-subtle)' }}
                    >
                      {checked && <span className="text-white text-[11px]">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-sans text-[13px] font-semibold text-[var(--text-primary)] truncate">{issue.title}</div>
                    </div>
                    <span
                      className="shrink-0 rounded-lg px-1.5 py-0.5 font-sans text-[10px] font-bold"
                      style={{
                        background: issue.priority === 'high' ? 'rgba(229,9,20,0.12)' : issue.priority === 'medium' ? 'rgba(251,146,60,0.12)' : 'var(--bg-surface-3)',
                        color: issue.priority === 'high' ? 'var(--color-brand-500)' : issue.priority === 'medium' ? '#f97316' : 'var(--text-tertiary)',
                      }}
                    >
                      {issue.priority}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Note */}
        <Field label="Note — optional">
          <textarea {...register('note')} rows={2}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3.5 py-2.5 font-body text-[14px] text-[var(--text-primary)] outline-none resize-none focus:border-[var(--color-brand-500)]"
            placeholder="Any remarks…"
          />
        </Field>

        {isEdit && (
          <button type="button" onClick={() => setShowDelete(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-overdue)] py-3 font-sans text-[14px] font-bold text-[var(--color-overdue)]"
          >
            <Trash2 size={15} strokeWidth={2.4} /> Delete service
          </button>
        )}

        <button
          type="submit" disabled={isSubmitting}
          className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)] disabled:opacity-60"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)', height: '52px' }}
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Log service'}
        </button>
      </form>

      <ConfirmDialog
        open={showDelete} title="Delete service record?"
        description="This service entry will be permanently removed."
        confirmLabel="Delete" onConfirm={handleDelete}
        onClose={() => setShowDelete(false)} danger
      />
    </div>
  )
}
