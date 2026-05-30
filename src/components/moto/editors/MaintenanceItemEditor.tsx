import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { maintenanceItemSchema, type MaintenanceItemFormValues } from '@/lib/schemas/moto'
import { maintenanceItemsRepo } from '@/db/repos/moto/maintenanceItems'
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

interface MaintenanceItemEditorProps {
  id?: string
  vehicleId: string
  onClose?: () => void
  onSaved?: () => void
}

export function MaintenanceItemEditor({ id, vehicleId, onClose, onSaved }: MaintenanceItemEditorProps) {
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<MaintenanceItemFormValues>({
    resolver: zodResolver(maintenanceItemSchema),
  })

  useEffect(() => {
    if (!isEdit) return
    maintenanceItemsRepo.getById(id).then(item => {
      if (!item) { onClose?.(); return }
      reset({ title: item.title })
      setLoading(false)
    })
  }, [id, isEdit, onClose, reset])

  const done = () => { onSaved?.(); onClose?.() }

  const onSubmit = async (data: MaintenanceItemFormValues) => {
    try {
      if (isEdit) {
        await maintenanceItemsRepo.update(id, { title: data.title })
        toast.success('Item updated')
      } else {
        await maintenanceItemsRepo.create({ vehicleId, title: data.title, checked: false })
        toast.success('Item added to checklist')
      }
      done()
    } catch {
      toast.error('Failed to save item')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await maintenanceItemsRepo.delete(id)
    toast.info('Item removed')
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

        <Field label="What to tell the mechanic?" error={errors.title?.message}>
          <input
            {...register('title')}
            className={inputCls}
            placeholder="e.g. Front brake feels soft, chain loose"
            autoFocus
          />
        </Field>

        {isEdit && (
          <button type="button" onClick={() => setShowDelete(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-overdue)] py-3 font-sans text-[14px] font-bold text-[var(--color-overdue)]"
          >
            <Trash2 size={15} strokeWidth={2.4} /> Remove from checklist
          </button>
        )}

        <button
          type="submit" disabled={isSubmitting}
          className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)] disabled:opacity-60"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)', height: '52px' }}
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add to checklist'}
        </button>
      </form>

      <ConfirmDialog
        open={showDelete} title="Remove item?"
        description="This item will be removed from the maintenance checklist."
        confirmLabel="Remove" onConfirm={handleDelete}
        onClose={() => setShowDelete(false)} danger
      />
    </div>
  )
}
