import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ChevronDown, ChevronLeft, ChevronUp, Home, Briefcase, Trash2, X } from 'lucide-react'
import { habitSchema, taskSchema, type HabitFormValues, type TaskFormValues } from '@/lib/schemas'
import type { Habit, Task, World } from '@/types'
import { MEASUREMENT_TYPES, PRIORITY_OPTIONS } from '@/lib/constants'
import { habitsRepo } from '@/db/repos/habits'
import { tasksRepo } from '@/db/repos/tasks'
import { ColorPicker } from '@/components/ColorPicker'
import { IconPicker } from '@/components/IconPicker'
import { TagInput } from '@/components/TagInput'
import { RecurrencePicker } from '@/components/RecurrencePicker'
import { MeasurementConfig } from '@/components/MeasurementConfig'

type Mode = 'habit' | 'task'

interface EditorProps {
  embedded?: boolean
  initialMode?: Mode
  defaultWorld?: World
  onClose?: () => void
  onSaved?: () => void
}

const TODAY = format(new Date(), 'yyyy-MM-dd')

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

function inputCls() {
  return 'h-11 w-full min-w-0 rounded-xl border border-[var(--border-subtle)] bg-surface px-3.5 font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]'
}

export default function Editor({
  embedded = false,
  initialMode: embeddedInitialMode,
  defaultWorld: embeddedDefaultWorld,
  onClose,
  onSaved,
}: EditorProps) {
  const navigate = useNavigate()
  const { type, id } = useParams<{ type?: string; id?: string }>()
  const [searchParams] = useSearchParams()

  const isEdit = !embedded && !!id && !!type
  const initialMode: Mode = embeddedInitialMode ?? (isEdit
    ? (type as Mode)
    : ((searchParams.get('type') as Mode) ?? 'habit'))

  const [mode, setMode] = useState<Mode>(initialMode)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const defaultWorld = embeddedDefaultWorld ?? (searchParams.get('world') as World) ?? 'personal'

  const habitForm = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: '',
      measurementType: 'checkbox',
      recurrence: { type: 'daily' },
      startDate: TODAY,
      color: '#6366f1',
      icon: '✅',
      tags: [],
      world: defaultWorld,
    },
  })

  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      measurementType: 'checkbox',
      dueDate: TODAY,
      priority: 'med',
      color: '#6366f1',
      icon: '🎯',
      tags: [],
      world: defaultWorld,
    },
  })

  useEffect(() => {
    if (!isEdit) return

    const load = async () => {
      if (type === 'habit') {
        const habit = await habitsRepo.getById(id!)
        if (!habit) {
          navigate('/habits')
          return
        }
        habitForm.reset({
          title: habit.title,
          description: habit.description ?? '',
          tags: habit.tags,
          measurementType: habit.measurementType,
          target: habit.target,
          unit: habit.unit ?? '',
          recurrence: habit.recurrence,
          startDate: habit.startDate,
          endDate: habit.endDate ?? '',
          reminderTime: habit.reminderTime ?? '',
          color: habit.color,
          icon: habit.icon,
          world: habit.world ?? 'personal',
        })
      } else {
        const task = await tasksRepo.getById(id!)
        if (!task) {
          navigate('/tasks')
          return
        }
        taskForm.reset({
          title: task.title,
          description: task.description ?? '',
          tags: task.tags,
          measurementType: task.measurementType,
          target: task.target,
          unit: task.unit ?? '',
          dueDate: task.dueDate,
          dueTime: task.dueTime ?? '',
          priority: task.priority,
          color: task.color,
          icon: task.icon,
          world: task.world ?? 'personal',
        })
      }
      setLoading(false)
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit])

  useEffect(() => {
    setShowAdvanced(isEdit)
  }, [isEdit, mode])

  const finish = () => {
    if (embedded) onSaved?.()
    else navigate(-1)
  }

  const handleHabitSubmit = async (data: HabitFormValues) => {
    const payload = {
      ...data,
      archived: false,
    } as Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt'>

    if (isEdit) {
      await habitsRepo.update(id!, payload)
    } else {
      await habitsRepo.create(payload)
    }

    finish()
  }

  const handleTaskSubmit = async (data: TaskFormValues) => {
    const payload = {
      ...data,
      status: 'pending' as const,
      progress: 0,
    } as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt'>

    if (isEdit) {
      await tasksRepo.update(id!, payload)
    } else {
      await tasksRepo.create(payload)
    }

    finish()
  }

  const handleDelete = async () => {
    if (type === 'habit') {
      await habitsRepo.archive(id!)
    } else {
      await tasksRepo.delete(id!)
    }
    navigate('/')
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'min-h-[320px]' : 'min-h-screen bg-app'}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
      </div>
    )
  }

  const isHabit = mode === 'habit'
  const taskPriority = taskForm.watch('priority')

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <EmbeddedHeader
          mode={mode}
          onModeChange={isEdit ? undefined : setMode}
          onClose={onClose}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <div className="mx-auto flex max-w-[560px] flex-col gap-4 pb-4">
            {isHabit ? (
              <form id="embedded-create-form" onSubmit={habitForm.handleSubmit(handleHabitSubmit)} className="flex flex-col gap-4">
                <CompactHabitFields
                  form={habitForm}
                  showAdvanced={showAdvanced}
                  onToggleAdvanced={() => setShowAdvanced(v => !v)}
                />
              </form>
            ) : (
              <form id="embedded-create-form" onSubmit={taskForm.handleSubmit(handleTaskSubmit)} className="flex flex-col gap-4">
                <CompactTaskFields
                  form={taskForm}
                  taskPriority={taskPriority}
                  showAdvanced={showAdvanced}
                  onToggleAdvanced={() => setShowAdvanced(v => !v)}
                />
              </form>
            )}
          </div>
        </div>

        <EmbeddedFooter
          submitLabel={isHabit ? 'Create habit' : 'Create task'}
          submitting={isHabit ? habitForm.formState.isSubmitting : taskForm.formState.isSubmitting}
          onCancel={onClose}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app pb-24">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3 px-4 pb-2 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-surface"
          >
            <ChevronLeft size={18} color="var(--text-secondary)" strokeWidth={2.4} />
          </button>
          <h1 className="flex-1 font-sans text-[20px] font-extrabold tracking-tight text-[var(--text-primary)]">
            {isEdit ? `Edit ${mode}` : `New ${mode}`}
          </h1>
          {isEdit && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-surface"
            >
              <Trash2 size={16} color="var(--color-overdue)" />
            </button>
          )}
        </div>

        {!isEdit && (
          <div className="mx-4 mb-4 flex overflow-hidden rounded-xl border border-[var(--border-subtle)]">
            {(['habit', 'task'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="flex-1 py-2.5 font-sans text-[14px] font-bold capitalize transition-colors"
                style={{
                  background: mode === m ? 'var(--color-brand-500)' : 'var(--bg-surface)',
                  color: mode === m ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {isHabit ? (
          <form onSubmit={habitForm.handleSubmit(handleHabitSubmit)} className="flex flex-col gap-4 px-4">
            <FullHabitFields form={habitForm} />
            <SubmitButton
              submitting={habitForm.formState.isSubmitting}
              label={isEdit ? 'Save changes' : 'Create habit'}
            />
          </form>
        ) : (
          <form onSubmit={taskForm.handleSubmit(handleTaskSubmit)} className="flex flex-col gap-4 px-4">
            <FullTaskFields form={taskForm} taskPriority={taskPriority} />
            <SubmitButton
              submitting={taskForm.formState.isSubmitting}
              label={isEdit ? 'Save changes' : 'Create task'}
            />
          </form>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowDeleteConfirm(false)}>
            <div className="flex w-full flex-col gap-3 rounded-t-2xl bg-surface p-5" onClick={e => e.stopPropagation()}>
              <p className="font-sans text-[16px] font-bold text-[var(--text-primary)]">
                {mode === 'habit' ? 'Archive this habit?' : 'Delete this task?'}
              </p>
              <p className="font-body text-[14px] text-[var(--text-secondary)]">
                {mode === 'habit'
                  ? 'It will be hidden from your lists but history is preserved.'
                  : 'This action cannot be undone.'}
              </p>
              <button
                onClick={handleDelete}
                className="h-11 w-full rounded-xl font-sans text-[14px] font-extrabold text-white"
                style={{ background: 'var(--color-overdue)' }}
              >
                {mode === 'habit' ? 'Archive' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="h-11 w-full rounded-xl bg-surface2 font-sans text-[14px] font-bold text-[var(--text-secondary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmbeddedHeader({
  mode,
  onModeChange,
  onClose,
}: {
  mode: Mode
  onModeChange?: (mode: Mode) => void
  onClose?: () => void
}) {
  return (
    <div className="shrink-0 border-b border-[var(--border-subtle)] px-4 pb-3 pt-3 sm:px-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-sans text-[18px] font-extrabold tracking-tight text-[var(--text-primary)]">
          Create new
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex overflow-hidden rounded-xl border border-[var(--border-subtle)]">
        {(['habit', 'task'] as const).map(item => (
          <button
            key={item}
            type="button"
            disabled={!onModeChange}
            onClick={() => onModeChange?.(item)}
            className="flex-1 py-2.5 font-sans text-[14px] font-bold capitalize transition-colors disabled:cursor-default"
            style={{
              background: mode === item ? 'var(--color-brand-500)' : 'var(--bg-surface)',
              color: mode === item ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

function EmbeddedFooter({
  submitLabel,
  submitting,
  onCancel,
}: {
  submitLabel: string
  submitting: boolean
  onCancel?: () => void
}) {
  return (
    <div className="shrink-0 border-t border-[var(--border-subtle)] px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-5">
      <div className="mx-auto flex max-w-[560px] gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 rounded-xl bg-surface2 font-sans text-[15px] font-bold text-[var(--text-secondary)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="embedded-create-form"
          disabled={submitting}
          className="h-12 flex-1 rounded-xl font-sans text-[15px] font-extrabold text-white transition-opacity disabled:opacity-60"
          style={{ background: 'var(--color-brand-500)' }}
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
  )
}

function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="h-12 w-full rounded-xl font-sans text-[15px] font-extrabold text-white transition-opacity disabled:opacity-60"
      style={{ background: 'var(--color-brand-500)' }}
    >
      {submitting ? 'Saving...' : label}
    </button>
  )
}

function SectionToggle({
  open,
  onClick,
}: {
  open: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-left"
    >
      <div>
        <p className="font-sans text-[14px] font-bold text-[var(--text-primary)]">Additional details</p>
        <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
          Customize icons, colors, schedule, measurements, and more.
        </p>
      </div>
      {open ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
    </button>
  )
}

function CompactHabitFields({
  form,
  showAdvanced,
  onToggleAdvanced,
}: {
  form: ReturnType<typeof useForm<HabitFormValues>>
  showAdvanced: boolean
  onToggleAdvanced: () => void
}) {
  return (
    <>
      <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <Field label="Title" error={form.formState.errors.title?.message}>
            <input
              {...form.register('title')}
              placeholder="e.g. Drink water"
              autoFocus
              className={inputCls()}
            />
          </Field>

          <Field label="Measurement type">
            <select {...form.register('measurementType')} className={inputCls()}>
              {MEASUREMENT_TYPES.map(mt => (
                <option key={mt.value} value={mt.value}>{mt.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Context">
            <Controller
              name="world"
              control={form.control}
              render={({ field }) => <WorldPicker value={field.value as World} onChange={field.onChange} />}
            />
          </Field>
        </div>
      </div>

      <SectionToggle open={showAdvanced} onClick={onToggleAdvanced} />

      {showAdvanced && (
        <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <Field label="Description">
              <textarea
                {...form.register('description')}
                placeholder="Optional note..."
                rows={2}
                className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-surface px-3.5 py-2.5 font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]"
              />
            </Field>

            <Field label="Icon">
              <Controller
                name="icon"
                control={form.control}
                render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />}
              />
            </Field>

            <Field label="Color">
              <Controller
                name="color"
                control={form.control}
                render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
              />
            </Field>

            <Field label="Tags">
              <Controller
                name="tags"
                control={form.control}
                render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
              />
            </Field>

            <Controller
              name="measurementType"
              control={form.control}
              render={({ field }) => (
                <MeasurementConfig
                  measurementType={field.value}
                  register={form.register as Parameters<typeof MeasurementConfig>[0]['register']}
                  errors={form.formState.errors as Parameters<typeof MeasurementConfig>[0]['errors']}
                />
              )}
            />

            <Field label="Recurrence">
              <Controller
                name="recurrence"
                control={form.control}
                render={({ field }) => (
                  <RecurrencePicker
                    value={field.value as import('@/types').Recurrence}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field label="Start date" error={form.formState.errors.startDate?.message}>
              <input type="date" {...form.register('startDate')} className={inputCls()} />
            </Field>

            <Field label="End date (optional)">
              <input type="date" {...form.register('endDate')} className={inputCls()} />
            </Field>

            <Field label="Reminder time (optional)">
              <input type="time" {...form.register('reminderTime')} className={inputCls()} />
            </Field>
          </div>
        </div>
      )}
    </>
  )
}

function CompactTaskFields({
  form,
  taskPriority,
  showAdvanced,
  onToggleAdvanced,
}: {
  form: ReturnType<typeof useForm<TaskFormValues>>
  taskPriority: TaskFormValues['priority']
  showAdvanced: boolean
  onToggleAdvanced: () => void
}) {
  return (
    <>
      <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <Field label="Title" error={form.formState.errors.title?.message}>
            <input
              {...form.register('title')}
              placeholder="e.g. Submit report"
              autoFocus
              className={inputCls()}
            />
          </Field>

          <Field label="Due date" error={form.formState.errors.dueDate?.message}>
            <input type="date" {...form.register('dueDate')} className={inputCls()} />
          </Field>

          <Field label="Priority">
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => form.setValue('priority', p.value)}
                  className="flex-1 rounded-xl font-sans text-[13px] font-bold transition-all"
                  style={{
                    height: '2.5rem',
                    background: taskPriority === p.value ? 'var(--color-brand-500)' : 'var(--bg-surface)',
                    border: taskPriority === p.value ? 'none' : '1px solid var(--border-subtle)',
                    color: taskPriority === p.value ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      <SectionToggle open={showAdvanced} onClick={onToggleAdvanced} />

      {showAdvanced && (
        <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <Field label="Description">
              <textarea
                {...form.register('description')}
                placeholder="Optional note..."
                rows={2}
                className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-surface px-3.5 py-2.5 font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]"
              />
            </Field>

            <Field label="Icon">
              <Controller
                name="icon"
                control={form.control}
                render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />}
              />
            </Field>

            <Field label="Color">
              <Controller
                name="color"
                control={form.control}
                render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
              />
            </Field>

            <Field label="Tags">
              <Controller
                name="tags"
                control={form.control}
                render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
              />
            </Field>

            <Field label="Context">
              <Controller
                name="world"
                control={form.control}
                render={({ field }) => <WorldPicker value={field.value as World} onChange={field.onChange} />}
              />
            </Field>

            <Field label="Measurement type">
              <select {...form.register('measurementType')} className={inputCls()}>
                {MEASUREMENT_TYPES.map(mt => (
                  <option key={mt.value} value={mt.value}>{mt.label}</option>
                ))}
              </select>
            </Field>

            <Controller
              name="measurementType"
              control={form.control}
              render={({ field }) => (
                <MeasurementConfig
                  measurementType={field.value}
                  register={form.register as Parameters<typeof MeasurementConfig>[0]['register']}
                  errors={form.formState.errors as Parameters<typeof MeasurementConfig>[0]['errors']}
                />
              )}
            />

            <Field label="Due time (optional)">
              <input type="time" {...form.register('dueTime')} className={inputCls()} />
            </Field>
          </div>
        </div>
      )}
    </>
  )
}

function FullHabitFields({ form }: { form: ReturnType<typeof useForm<HabitFormValues>> }) {
  return (
    <>
      <Field label="Title" error={form.formState.errors.title?.message}>
        <input
          {...form.register('title')}
          placeholder="e.g. Drink water"
          autoFocus
          className={inputCls()}
        />
      </Field>

      <Field label="Description">
        <textarea
          {...form.register('description')}
          placeholder="Optional note..."
          rows={2}
          className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-surface px-3.5 py-2.5 font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]"
        />
      </Field>

      <Field label="Icon">
        <Controller
          name="icon"
          control={form.control}
          render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />}
        />
      </Field>

      <Field label="Color">
        <Controller
          name="color"
          control={form.control}
          render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
        />
      </Field>

      <Field label="Tags">
        <Controller
          name="tags"
          control={form.control}
          render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
        />
      </Field>

      <Field label="Context">
        <Controller
          name="world"
          control={form.control}
          render={({ field }) => <WorldPicker value={field.value as World} onChange={field.onChange} />}
        />
      </Field>

      <Field label="Measurement type">
        <select {...form.register('measurementType')} className={inputCls()}>
          {MEASUREMENT_TYPES.map(mt => (
            <option key={mt.value} value={mt.value}>{`${mt.label} - ${mt.description}`}</option>
          ))}
        </select>
      </Field>

      <Controller
        name="measurementType"
        control={form.control}
        render={({ field }) => (
          <MeasurementConfig
            measurementType={field.value}
            register={form.register as Parameters<typeof MeasurementConfig>[0]['register']}
            errors={form.formState.errors as Parameters<typeof MeasurementConfig>[0]['errors']}
          />
        )}
      />

      <Field label="Recurrence">
        <Controller
          name="recurrence"
          control={form.control}
          render={({ field }) => (
            <RecurrencePicker
              value={field.value as import('@/types').Recurrence}
              onChange={field.onChange}
            />
          )}
        />
      </Field>

      <Field label="Start date" error={form.formState.errors.startDate?.message}>
        <input type="date" {...form.register('startDate')} className={inputCls()} />
      </Field>

      <Field label="End date (optional)">
        <input type="date" {...form.register('endDate')} className={inputCls()} />
      </Field>

      <Field label="Reminder time (optional)">
        <input type="time" {...form.register('reminderTime')} className={inputCls()} />
      </Field>
    </>
  )
}

function FullTaskFields({
  form,
  taskPriority,
}: {
  form: ReturnType<typeof useForm<TaskFormValues>>
  taskPriority: TaskFormValues['priority']
}) {
  return (
    <>
      <Field label="Title" error={form.formState.errors.title?.message}>
        <input
          {...form.register('title')}
          placeholder="e.g. Submit report"
          autoFocus
          className={inputCls()}
        />
      </Field>

      <Field label="Description">
        <textarea
          {...form.register('description')}
          placeholder="Optional note..."
          rows={2}
          className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-surface px-3.5 py-2.5 font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]"
        />
      </Field>

      <Field label="Icon">
        <Controller
          name="icon"
          control={form.control}
          render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />}
        />
      </Field>

      <Field label="Color">
        <Controller
          name="color"
          control={form.control}
          render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
        />
      </Field>

      <Field label="Tags">
        <Controller
          name="tags"
          control={form.control}
          render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
        />
      </Field>

      <Field label="Context">
        <Controller
          name="world"
          control={form.control}
          render={({ field }) => <WorldPicker value={field.value as World} onChange={field.onChange} />}
        />
      </Field>

      <Field label="Measurement type">
        <select {...form.register('measurementType')} className={inputCls()}>
          {MEASUREMENT_TYPES.map(mt => (
            <option key={mt.value} value={mt.value}>{`${mt.label} - ${mt.description}`}</option>
          ))}
        </select>
      </Field>

      <Controller
        name="measurementType"
        control={form.control}
        render={({ field }) => (
          <MeasurementConfig
            measurementType={field.value}
            register={form.register as Parameters<typeof MeasurementConfig>[0]['register']}
            errors={form.formState.errors as Parameters<typeof MeasurementConfig>[0]['errors']}
          />
        )}
      />

      <Field label="Due date" error={form.formState.errors.dueDate?.message}>
        <input type="date" {...form.register('dueDate')} className={inputCls()} />
      </Field>

      <Field label="Due time (optional)">
        <input type="time" {...form.register('dueTime')} className={inputCls()} />
      </Field>

      <Field label="Priority">
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => form.setValue('priority', p.value)}
              className="flex-1 rounded-xl font-sans text-[13px] font-bold transition-all"
              style={{
                height: '2.5rem',
                background: taskPriority === p.value ? 'var(--color-brand-500)' : 'var(--bg-surface)',
                border: taskPriority === p.value ? 'none' : '1px solid var(--border-subtle)',
                color: taskPriority === p.value ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>
    </>
  )
}

function WorldPicker({ value, onChange }: { value: World; onChange: (v: World) => void }) {
  const options: { value: World; label: string; Icon: typeof Home }[] = [
    { value: 'personal', label: 'Personal', Icon: Home },
    { value: 'professional', label: 'Professional', Icon: Briefcase },
  ]

  return (
    <div className="flex gap-2">
      {options.map(({ value: nextValue, label, Icon }) => (
        <button
          key={nextValue}
          type="button"
          onClick={() => onChange(nextValue)}
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl font-sans text-[13px] font-bold transition-all"
          style={{
            background: value === nextValue ? 'var(--color-brand-500)' : 'var(--bg-surface)',
            border: value === nextValue ? 'none' : '1px solid var(--border-subtle)',
            color: value === nextValue ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  )
}
