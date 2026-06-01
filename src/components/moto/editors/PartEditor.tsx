import { useEffect, useState } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { partSchema, type PartFormValues } from '@/lib/schemas/moto'
import { partsRepo } from '@/db/repos/moto/parts'
import { servicesRepo } from '@/db/repos/moto/services'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { toast } from '@/store/toastStore'
import { ConfirmDialog, DatePicker } from '@/components/ui'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'

const inputCls = 'h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3.5 font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]'

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

interface PartEditorProps {
  id?: string
  vehicleId: string
  onClose?: () => void
  onSaved?: () => void
}

export function PartEditor({ id, vehicleId, onClose, onSaved }: PartEditorProps) {
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)

  const recentServices = useLiveQuery(
    () => servicesRepo.getAllForVehicle(vehicleId),
    [vehicleId],
  ) ?? []

  const { register, handleSubmit, control, setValue, reset, formState: { errors, isSubmitting } } = useForm<PartFormValues>({
    resolver: zodResolver(partSchema) as Resolver<PartFormValues>,
    defaultValues: {
      partName: '', installedAt: format(new Date(), 'yyyy-MM-dd'),
      odoKmAtInstall: 0, cost: 0,
    },
  })

  useEffect(() => {
    if (!isEdit) {
      vehiclesRepo.getById(vehicleId).then(v => {
        if (v) setValue('odoKmAtInstall', v.currentOdoKm)
      })
      return
    }
    partsRepo.getById(id).then(p => {
      if (!p) { onClose?.(); return }
      reset({
        partName: p.partName, brand: p.brand ?? '', partNumber: p.partNumber ?? '',
        installedAt: p.installedAt, odoKmAtInstall: p.odoKmAtInstall, cost: p.cost,
        expectedLifeKm: p.expectedLifeKm, expectedLifeMonths: p.expectedLifeMonths,
        linkedServiceId: p.linkedServiceId ?? '', note: p.note ?? '',
      })
      setLoading(false)
    })
  }, [id, isEdit, vehicleId, onClose, reset, setValue])

  const done = () => { onSaved?.(); onClose?.() }

  const onSubmit = async (data: PartFormValues) => {
    try {
      const payload = {
        vehicleId,
        partName:          data.partName,
        brand:             data.brand || undefined,
        partNumber:        data.partNumber || undefined,
        installedAt:       data.installedAt,
        odoKmAtInstall:    data.odoKmAtInstall,
        cost:              data.cost,
        expectedLifeKm:    data.expectedLifeKm,
        expectedLifeMonths: data.expectedLifeMonths,
        linkedServiceId:   data.linkedServiceId || undefined,
        note:              data.note || undefined,
      }
      if (isEdit) {
        await partsRepo.update(id, payload)
        toast.success('Part updated')
      } else {
        await partsRepo.create(payload)
        toast.success('Part added')
      }
      done()
    } catch {
      toast.error('Failed to save part')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await partsRepo.delete(id)
    toast.info('Part deleted')
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

        {/* Part name */}
        <Field label="Part name" error={errors.partName?.message}>
          <input {...register('partName')} className={inputCls} placeholder="e.g. Air Filter" autoFocus />
        </Field>

        {/* Brand + Part number */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Brand — optional">
            <input {...register('brand')} className={inputCls} placeholder="e.g. Bosch" />
          </Field>
          <Field label="Part no. — optional">
            <input {...register('partNumber')} className={inputCls} placeholder="e.g. A-1234" />
          </Field>
        </div>

        {/* Install date + Odometer */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Installed on" error={errors.installedAt?.message}>
            <Controller
              control={control}
              name="installedAt"
              render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
            />
          </Field>
          <Field label="Odometer (km)" error={errors.odoKmAtInstall?.message}>
            <input type="number" {...register('odoKmAtInstall')} className={inputCls} placeholder="0" />
          </Field>
        </div>

        {/* Cost */}
        <Field label="Cost" error={errors.cost?.message}>
          <input type="number" step="0.01" {...register('cost')} className={inputCls} placeholder="0.00" />
        </Field>

        {/* Expected life */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Expected life (km) — optional">
            <input type="number" {...register('expectedLifeKm')} className={inputCls} placeholder="e.g. 10000" />
          </Field>
          <Field label="Expected life (months) — optional">
            <input type="number" {...register('expectedLifeMonths')} className={inputCls} placeholder="e.g. 12" />
          </Field>
        </div>

        {/* Link to service */}
        {recentServices.length > 0 && (
          <Field label="Linked service — optional">
            <select {...register('linkedServiceId')}
              className={inputCls}
              style={{ background: 'var(--bg-surface-2)' }}
            >
              <option value="">None</option>
              {recentServices.slice(0, 10).map(s => (
                <option key={s.id} value={s.id}>
                  {s.date} — {s.serviceType.replace('_', ' ')} ({s.odoKm.toLocaleString()} km)
                </option>
              ))}
            </select>
          </Field>
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
            <Trash2 size={15} strokeWidth={2.4} /> Delete part
          </button>
        )}

        <button
          type="submit" disabled={isSubmitting}
          className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)] disabled:opacity-60"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)', height: '52px' }}
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add part'}
        </button>
      </form>

      <ConfirmDialog
        open={showDelete} title="Delete part?"
        description="This part record will be permanently removed."
        confirmLabel="Delete" onConfirm={handleDelete}
        onClose={() => setShowDelete(false)} danger
      />
    </div>
  )
}
