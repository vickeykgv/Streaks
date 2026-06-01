import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Pin } from 'lucide-react'
import { noteSchema, type NoteFormValues } from '@/lib/schemas/moto'
import { notesRepo } from '@/db/repos/moto/notes'
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

interface NoteEditorProps {
  id?: string
  vehicleId: string
  onClose?: () => void
  onSaved?: () => void
}

export function NoteEditor({ id, vehicleId, onClose, onSaved }: NoteEditorProps) {
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { pinned: false },
  })

  const pinned = watch('pinned')

  useEffect(() => {
    if (!isEdit) return
    notesRepo.getById(id).then(note => {
      if (!note) { onClose?.(); return }
      reset({ title: note.title ?? '', body: note.body, pinned: note.pinned })
      setLoading(false)
    })
  }, [id, isEdit, onClose, reset])

  const done = () => { onSaved?.(); onClose?.() }

  const onSubmit = async (data: NoteFormValues) => {
    try {
      const payload = {
        title:  data.title || undefined,
        body:   data.body,
        pinned: data.pinned,
      }
      if (isEdit) {
        await notesRepo.update(id, payload)
        toast.success('Note updated')
      } else {
        await notesRepo.create({ vehicleId, ...payload })
        toast.success('Note saved')
      }
      done()
    } catch {
      toast.error('Failed to save note')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await notesRepo.delete(id)
    toast.info('Note deleted')
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

        <Field label="Title — optional">
          <input {...register('title')} className={inputCls} placeholder="Optional heading…" autoFocus />
        </Field>

        <Field label="Note" error={errors.body?.message}>
          <textarea {...register('body')} rows={6}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3.5 py-2.5 font-body text-[14px] text-[var(--text-primary)] outline-none resize-none focus:border-[var(--color-brand-500)]"
            placeholder="Write anything…"
          />
        </Field>

        <div
          className="flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: 'var(--bg-surface-2)' }}
        >
          <div className="flex items-center gap-2">
            <Pin size={15} color={pinned ? 'var(--color-brand-500)' : 'var(--text-tertiary)'} strokeWidth={2.4} />
            <span className="font-sans text-[13px] font-bold text-[var(--text-primary)]">Pin note</span>
          </div>
          <button
            type="button"
            onClick={() => setValue('pinned', !pinned)}
            className="relative h-7 w-12 rounded-full transition-colors"
            style={{ background: pinned ? 'var(--color-brand-500)' : 'var(--bg-surface-3)' }}
          >
            <span
              className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
              style={{ transform: pinned ? 'translateX(20px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        {isEdit && (
          <button type="button" onClick={() => setShowDelete(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-overdue)] py-3 font-sans text-[14px] font-bold text-[var(--color-overdue)]"
          >
            <Trash2 size={15} strokeWidth={2.4} /> Delete note
          </button>
        )}

        <button
          type="submit" disabled={isSubmitting}
          className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)] disabled:opacity-60"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)', height: '52px' }}
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Save note'}
        </button>
      </form>

      <ConfirmDialog
        open={showDelete} title="Delete note?"
        description="This note will be permanently removed."
        confirmLabel="Delete" onConfirm={handleDelete}
        onClose={() => setShowDelete(false)} danger
      />
    </div>
  )
}
