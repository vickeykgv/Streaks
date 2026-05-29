import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { documentSchema, type DocumentFormValues } from '@/lib/schemas/moto'
import { documentsRepo } from '@/db/repos/moto/documents'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { toast } from '@/store/toastStore'
import { ConfirmDialog } from '@/components/ui'
import { useLiveQuery } from 'dexie-react-hooks'
import type { DocumentType } from '@/types/moto'

const DOC_TYPES: { value: DocumentType; label: string; emoji: string; description: string }[] = [
  { value: 'insurance',       label: 'Insurance',        emoji: '🛡️', description: 'Vehicle insurance policy' },
  { value: 'driving_license', label: "Driver's Licence", emoji: '📋', description: 'Personal driving licence' },
]

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

interface DocumentEditorProps {
  id?: string
  vehicleId?: string
  onClose?: () => void
  onSaved?: () => void
}

export function DocumentEditor({ id, vehicleId: initVehicleId, onClose, onSaved }: DocumentEditorProps) {
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)

  const vehicles = useLiveQuery(() => vehiclesRepo.getAll(), []) ?? []

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type: initVehicleId ? 'insurance' : 'driving_license',
      vehicleId: initVehicleId ?? '',
      reminderDaysBefore: 30,
    },
  })

  const docType = watch('type')

  useEffect(() => {
    if (!isEdit) return
    documentsRepo.getById(id).then(doc => {
      if (!doc) { onClose?.(); return }
      reset({
        type:               doc.type,
        vehicleId:          doc.vehicleId ?? '',
        provider:           doc.provider ?? '',
        policyNo:           doc.policyNo ?? '',
        issuedDate:         doc.issuedDate ?? '',
        expiryDate:         doc.expiryDate,
        premium:            doc.premium,
        reminderDaysBefore: doc.reminderDaysBefore,
        note:               doc.note ?? '',
      })
      setLoading(false)
    })
  }, [id, isEdit, onClose, reset])

  const done = () => { onSaved?.(); onClose?.() }

  const onSubmit = async (data: DocumentFormValues) => {
    try {
      const payload = {
        type:               data.type,
        vehicleId:          data.type === 'insurance' && data.vehicleId ? data.vehicleId : undefined,
        provider:           data.provider || undefined,
        policyNo:           data.policyNo || undefined,
        issuedDate:         data.issuedDate || undefined,
        expiryDate:         data.expiryDate,
        premium:            data.premium,
        reminderDaysBefore: data.reminderDaysBefore,
        note:               data.note || undefined,
      }
      if (isEdit) {
        await documentsRepo.update(id, payload)
        toast.success('Document updated')
      } else {
        await documentsRepo.create(payload)
        toast.success('Document added')
      }
      done()
    } catch {
      toast.error('Failed to save document')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await documentsRepo.delete(id)
    toast.info('Document deleted')
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

        {/* Document type */}
        <Field label="Document type">
          <div className="grid grid-cols-2 gap-2">
            {DOC_TYPES.map(({ value, label, emoji }) => {
              const on = docType === value
              return (
                <button
                  key={value} type="button"
                  onClick={() => setValue('type', value)}
                  className="flex flex-col items-center gap-1 rounded-2xl py-3 transition-all"
                  style={{
                    background: on ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                    border: on ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <span className="text-[22px]">{emoji}</span>
                  <span className="font-sans text-[11px] font-bold" style={{ color: on ? '#fff' : 'var(--text-secondary)' }}>{label}</span>
                </button>
              )
            })}
          </div>
        </Field>

        {/* Vehicle picker — only for insurance */}
        {docType === 'insurance' && vehicles.length > 0 && (
          <Field label="Vehicle">
            <select {...register('vehicleId')}
              className={inputCls}
              style={{ background: 'var(--bg-surface-2)' }}
            >
              <option value="">— select vehicle —</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.registrationNo || v.make})</option>
              ))}
            </select>
          </Field>
        )}

        {/* Provider + Policy/Licence number */}
        <div className="grid grid-cols-2 gap-2">
          <Field label={docType === 'driving_license' ? 'Issuing authority — optional' : 'Insurer — optional'}>
            <input {...register('provider')} className={inputCls}
              placeholder={docType === 'driving_license' ? 'e.g. RTO Chennai' : 'e.g. HDFC Ergo'} />
          </Field>
          <Field label={docType === 'driving_license' ? 'Licence number — optional' : 'Policy number — optional'}>
            <input {...register('policyNo')} className={inputCls}
              placeholder={docType === 'driving_license' ? 'TN10 20230012345' : 'POL-XXXXXXX'} />
          </Field>
        </div>

        {/* Issued + Expiry dates */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Issued on — optional">
            <input type="date" {...register('issuedDate')} className={inputCls} />
          </Field>
          <Field label="Expires on" error={errors.expiryDate?.message}>
            <input type="date" {...register('expiryDate')} className={inputCls} />
          </Field>
        </div>

        {/* Premium (insurance only) */}
        {docType === 'insurance' && (
          <Field label="Annual premium — optional">
            <input type="number" step="0.01" {...register('premium')} className={inputCls} placeholder="0.00" />
          </Field>
        )}

        {/* Reminder lead time */}
        <Field label="Remind me (days before expiry)" error={errors.reminderDaysBefore?.message}>
          <input type="number" {...register('reminderDaysBefore')} className={inputCls} placeholder="30" />
        </Field>

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
            <Trash2 size={15} strokeWidth={2.4} /> Delete document
          </button>
        )}

        <button
          type="submit" disabled={isSubmitting}
          className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)] disabled:opacity-60"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)', height: '52px' }}
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add document'}
        </button>
      </form>

      <ConfirmDialog
        open={showDelete} title="Delete document?"
        description="This document record will be permanently removed."
        confirmLabel="Delete" onConfirm={handleDelete}
        onClose={() => setShowDelete(false)} danger
      />
    </div>
  )
}
