import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { categorySchema, type CategoryFormValues } from '@/lib/schemas/spending'
import { categoriesRepo } from '@/db/repos/spending/categories'
import { transactionsRepo } from '@/db/repos/spending/transactions'
import { toast } from '@/store/toastStore'
import { Select, ConfirmDialog } from '@/components/ui'
import { ColorPicker } from '@/components/ColorPicker'
import type { CategoryType } from '@/types/spending'

const CATEGORY_ICONS = [
  '🍽️','🍔','☕','🍕','🛒','🚗','🚇','✈️','🏠','💡',
  '📱','💻','🎬','🎮','🏋️','💊','🏥','📚','🎓','👔',
  '👗','💅','🎁','🎉','🌴','🐾','🏦','💳','💵','💰',
  '📈','💼','🔧','🏗️','🎨','🎵','📦','♻️','🧾','⚡',
]

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

interface CategoryEditorProps {
  embedded?: boolean
  initialId?: string
  initialType?: CategoryType
  onClose?: () => void
  onSaved?: () => void
}

export default function CategoryEditor({
  embedded = false,
  initialId,
  initialType,
  onClose,
  onSaved,
}: CategoryEditorProps = {}) {
  const navigate = useNavigate()
  const { id: routeId } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const id = initialId ?? routeId
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)
  const [txCount, setTxCount] = useState(0)

  const defaultType = initialType ?? (searchParams.get('type') as CategoryType) ?? 'expense'

  const allCategories = useLiveQuery(() => categoriesRepo.getAll(), []) ?? []

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', type: defaultType, parentId: '', color: '#f59e0b', icon: '📦' },
  })

  const selectedType = watch('type')
  const selectedIcon = watch('icon')

  const parentOptions = allCategories
    .filter(c => c.type === selectedType && c.id !== id && !c.parentId)
    .map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))

  useEffect(() => {
    if (!isEdit || !id) return
    categoriesRepo.getById(id).then(async cat => {
      if (!cat) { embedded ? onClose?.() : navigate('/spending/categories'); return }
      reset({ name: cat.name, type: cat.type, parentId: cat.parentId ?? '', color: cat.color, icon: cat.icon })
      const all = await transactionsRepo.getAll()
      setTxCount(all.filter(t => t.categoryId === id).length)
      setLoading(false)
    })
  }, [id, isEdit, embedded, navigate, onClose, reset])

  useEffect(() => {
    if (!isEdit) setValue('parentId', '')
  }, [selectedType, isEdit, setValue])

  const done = () => {
    if (embedded) { onSaved?.(); onClose?.() }
    else navigate('/spending/categories')
  }

  const onSubmit = async (data: CategoryFormValues) => {
    const payload = {
      name:     data.name,
      type:     data.type,
      color:    data.color,
      icon:     data.icon,
      parentId: data.parentId || undefined,
      archived: false,
    }
    try {
      if (isEdit && id) {
        await categoriesRepo.update(id, payload)
        toast.success('Category updated')
      } else {
        await categoriesRepo.create(payload)
        toast.success('Category created')
      }
      done()
    } catch {
      toast.error('Failed to save category')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await categoriesRepo.delete(id)
    toast.info('Category deleted', { label: 'Undo', onClick: () => categoriesRepo.restore(id) })
    done()
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className={embedded ? 'flex flex-col gap-5' : 'glass-panel rounded-[28px] p-5 flex flex-col gap-5'}>

        <Field label="Type">
          <div className="grid grid-cols-2 gap-2">
            {(['expense', 'income'] as CategoryType[]).map(t => {
              const on = selectedType === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue('type', t, { shouldValidate: true })}
                  className="rounded-2xl py-3 font-sans text-[13px] font-bold capitalize transition-all"
                  style={{
                    background: on ? (t === 'expense' ? '#ef4444' : '#22c55e') : 'var(--bg-surface-2)',
                    color: on ? '#fff' : 'var(--text-secondary)',
                    border: on ? 'none' : '1px solid var(--border-subtle)',
                    boxShadow: on ? `0 4px 14px ${t === 'expense' ? '#ef444455' : '#22c55e55'}` : 'none',
                  }}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Name" error={errors.name?.message}>
          <input {...register('name')} className={inputCls} placeholder="e.g. Groceries" autoFocus={!isEdit} />
        </Field>

        {parentOptions.length > 0 && (
          <Field label="Parent category (optional)">
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onChange={v => field.onChange(v)}
                  options={[{ value: '', label: 'None (top-level)' }, ...parentOptions]}
                />
              )}
            />
          </Field>
        )}

        <Field label="Icon">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ICONS.map(icon => {
              const on = selectedIcon === icon
              return (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setValue('icon', icon)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] transition-all active:scale-90"
                  style={{
                    background: on ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                    border: on ? 'none' : '1px solid var(--border-subtle)',
                    boxShadow: on ? 'var(--shadow-glow)' : 'none',
                  }}
                >
                  {icon}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Colour">
          <Controller
            control={control}
            name="color"
            render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
          />
        </Field>

      </div>

      {isEdit && embedded && (
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-overdue)] py-3 font-sans text-[14px] font-bold text-[var(--color-overdue)]"
        >
          <Trash2 size={15} strokeWidth={2.4} />
          Delete category
        </button>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-white disabled:opacity-60"
        style={{ height: '52px', background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
      >
        {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create category'}
      </button>
    </form>
  )

  if (embedded) {
    if (loading) return (
      <div className="flex items-center justify-center py-10">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
      </div>
    )
    return (
      <div className="overflow-y-auto px-5 pb-5 pt-1">
        {formContent}
        <ConfirmDialog
          open={showDelete}
          title="Delete category?"
          description={
            txCount > 0
              ? `This category is used by ${txCount} transaction${txCount !== 1 ? 's' : ''}. They will become uncategorised.`
              : 'This category will be removed.'
          }
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
          danger
        />
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen bg-app flex items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
    </div>
  )

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-2xl px-4 pt-4">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)]">
            <ChevronLeft size={20} color="var(--text-primary)" />
          </button>
          <h1 className="font-sans text-[22px] font-extrabold tracking-tight text-[var(--text-primary)]">
            {isEdit ? 'Edit Category' : 'New Category'}
          </h1>
          {isEdit && (
            <button onClick={() => setShowDelete(true)} className="ml-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)]">
              <Trash2 size={18} color="var(--color-overdue)" />
            </button>
          )}
        </div>

        {formContent}
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete category?"
        description={
          txCount > 0
            ? `This category is used by ${txCount} transaction${txCount !== 1 ? 's' : ''}. They will become uncategorised.`
            : 'This category will be removed.'
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setShowDelete(false)}
        danger
      />
    </div>
  )
}
