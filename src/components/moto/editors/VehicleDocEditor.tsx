import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLink, Trash2 } from 'lucide-react'
import { vehicleDocSchema, type VehicleDocFormValues } from '@/lib/schemas/moto'
import { vehicleDocsRepo } from '@/db/repos/moto/vehicleDocs'
import { toast } from '@/store/toastStore'
import { ConfirmDialog } from '@/components/ui'

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

interface VehicleDocEditorProps {
  id?: string
  vehicleId: string
  onClose?: () => void
  onSaved?: () => void
}

export function VehicleDocEditor({ id, vehicleId, onClose, onSaved }: VehicleDocEditorProps) {
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<VehicleDocFormValues>({
    resolver: zodResolver(vehicleDocSchema),
  })

  useEffect(() => {
    if (!isEdit) return
    vehicleDocsRepo.getById(id).then(doc => {
      if (!doc) { onClose?.(); return }
      reset({
        name:       doc.name,
        validUntil: doc.validUntil ?? '',
        imageUrl:   doc.imageUrl ?? '',
        note:       doc.note ?? '',
      })
      setLoading(false)
    })
  }, [id, isEdit, onClose, reset])

  const done = () => { onSaved?.(); onClose?.() }

  const onSubmit = async (data: VehicleDocFormValues) => {
    try {
      const payload = {
        name:       data.name,
        validUntil: data.validUntil || undefined,
        imageUrl:   data.imageUrl || undefined,
        note:       data.note || undefined,
      }
      if (isEdit) {
        await vehicleDocsRepo.update(id, payload)
        toast.success('Document updated')
      } else {
        await vehicleDocsRepo.create({ vehicleId, ...payload })
        toast.success('Document added')
      }
      done()
    } catch {
      toast.error('Failed to save document')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await vehicleDocsRepo.delete(id)
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

        <Field label="Document name" error={errors.name?.message}>
          <input {...register('name')} className={inputCls} placeholder="e.g. RC Book, PUC Certificate, Fitness Cert" autoFocus />
        </Field>

        <Field label="Valid until — optional" error={errors.validUntil?.message}>
          <input type="date" {...register('validUntil')} className={inputCls} />
        </Field>

        <Field label="Image / scan link — optional" error={errors.imageUrl?.message}>
          <div className="relative">
            <input
              {...register('imageUrl')}
              className={inputCls + ' pr-10'}
              placeholder="https://drive.google.com/…"
            />
            <ExternalLink
              size={15} strokeWidth={2}
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            />
          </div>
        </Field>

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
