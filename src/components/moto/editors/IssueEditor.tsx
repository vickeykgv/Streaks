import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { issueSchema, type IssueFormValues } from '@/lib/schemas/moto'
import { issuesRepo } from '@/db/repos/moto/issues'
import { toast } from '@/store/toastStore'
import { ConfirmDialog } from '@/components/ui'
import { format } from 'date-fns'
import type { IssuePriority } from '@/types/moto'

const PRIORITIES: { value: IssuePriority; label: string; emoji: string }[] = [
  { value: 'low',    label: 'Low',    emoji: '🟢' },
  { value: 'medium', label: 'Medium', emoji: '🟡' },
  { value: 'high',   label: 'High',   emoji: '🔴' },
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

interface IssueEditorProps {
  id?: string
  vehicleId: string
  onClose?: () => void
  onSaved?: () => void
}

export function IssueEditor({ id, vehicleId, onClose, onSaved }: IssueEditorProps) {
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)
  const [isResolved, setIsResolved] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      reportedAt: format(new Date(), 'yyyy-MM-dd'),
      priority: 'medium',
    },
  })

  const priority = watch('priority')

  useEffect(() => {
    if (!isEdit) return
    issuesRepo.getById(id).then(issue => {
      if (!issue) { onClose?.(); return }
      reset({
        title:       issue.title,
        description: issue.description ?? '',
        priority:    issue.priority,
        reportedAt:  issue.reportedAt,
      })
      setIsResolved(issue.status === 'resolved')
      setLoading(false)
    })
  }, [id, isEdit, onClose, reset])

  const done = () => { onSaved?.(); onClose?.() }

  const onSubmit = async (data: IssueFormValues) => {
    try {
      if (isEdit) {
        await issuesRepo.update(id, {
          title:       data.title,
          description: data.description || undefined,
          priority:    data.priority,
          reportedAt:  data.reportedAt,
        })
        toast.success('Issue updated')
      } else {
        await issuesRepo.create({
          vehicleId,
          title:       data.title,
          description: data.description || undefined,
          priority:    data.priority,
          status:      'open',
          reportedAt:  data.reportedAt,
        })
        toast.success('Issue reported')
      }
      done()
    } catch {
      toast.error('Failed to save issue')
    }
  }

  const handleResolve = async () => {
    if (!id) return
    await issuesRepo.resolve(id)
    toast.success('Issue marked as resolved')
    done()
  }

  const handleReopen = async () => {
    if (!id) return
    await issuesRepo.update(id, { status: 'open', resolvedAt: undefined, resolvedByServiceId: undefined })
    toast.info('Issue reopened')
    done()
  }

  const handleDelete = async () => {
    if (!id) return
    await issuesRepo.delete(id)
    toast.info('Issue deleted')
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

        <Field label="Title" error={errors.title?.message}>
          <input {...register('title')} className={inputCls} placeholder="e.g. Engine oil leak near filter" autoFocus />
        </Field>

        <Field label="Description — optional">
          <textarea {...register('description')} rows={3}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3.5 py-2.5 font-body text-[14px] text-[var(--text-primary)] outline-none resize-none focus:border-[var(--color-brand-500)]"
            placeholder="More details, when it started, conditions…"
          />
        </Field>

        <Field label="Priority">
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map(({ value, label, emoji }) => {
              const on = priority === value
              return (
                <button
                  key={value} type="button"
                  onClick={() => setValue('priority', value)}
                  className="flex items-center justify-center gap-2 rounded-2xl py-2.5 transition-all font-sans text-[13px] font-bold"
                  style={{
                    background: on ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                    border: on ? 'none' : '1px solid var(--border-subtle)',
                    color: on ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  <span>{emoji}</span> {label}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Reported on" error={errors.reportedAt?.message}>
          <input type="date" {...register('reportedAt')} className={inputCls} />
        </Field>

        {isEdit && (
          <div className="flex gap-2">
            {isResolved ? (
              <button
                type="button" onClick={handleReopen}
                className="flex-1 rounded-2xl border border-[var(--border-subtle)] py-3 font-sans text-[13px] font-bold text-[var(--text-secondary)]"
              >
                Reopen issue
              </button>
            ) : (
              <button
                type="button" onClick={handleResolve}
                className="flex-1 rounded-2xl py-3 font-sans text-[13px] font-bold text-white"
                style={{ background: '#16a34a' }}
              >
                Mark resolved ✓
              </button>
            )}
          </div>
        )}

        {isEdit && (
          <button type="button" onClick={() => setShowDelete(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-overdue)] py-3 font-sans text-[14px] font-bold text-[var(--color-overdue)]"
          >
            <Trash2 size={15} strokeWidth={2.4} /> Delete issue
          </button>
        )}

        <button
          type="submit" disabled={isSubmitting}
          className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)] disabled:opacity-60"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)', height: '52px' }}
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Report issue'}
        </button>
      </form>

      <ConfirmDialog
        open={showDelete} title="Delete issue?"
        description="This issue will be permanently removed."
        confirmLabel="Delete" onConfirm={handleDelete}
        onClose={() => setShowDelete(false)} danger
      />
    </div>
  )
}
