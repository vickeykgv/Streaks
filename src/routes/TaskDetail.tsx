import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Pencil, Calendar, Clock, CheckCircle2, SkipForward } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { tasksRepo } from '@/db/repos/tasks'
import { tagsRepo } from '@/db/repos/tags'

const PRIORITY_LABEL: Record<string, string> = { high: 'High', med: 'Medium', low: 'Low' }
const PRIORITY_COLOR: Record<string, string> = {
  high: 'var(--color-overdue)',
  med: 'var(--color-priority-med)',
  low: 'var(--color-skipped)',
}

export default function TaskDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const task = useLiveQuery(() => tasksRepo.getById(id!), [id])
  const allTags = useLiveQuery(() => tagsRepo.getAll(), []) ?? []

  if (task === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent animate-spin" />
      </div>
    )
  }
  if (task === null || task.deletedAt) {
    navigate('/tasks')
    return null
  }

  const taskTags = allTags.filter(t => task.tags.includes(t.id))
  const today = format(new Date(), 'yyyy-MM-dd')
  const isOverdue = task.status === 'pending' && task.dueDate < today
  const isDone = task.status === 'done'
  const isSkipped = task.status === 'skipped'

  const hasProgress = (task.measurementType === 'count' || task.measurementType === 'duration' || task.measurementType === 'numeric')
    && task.target != null
  const progress = task.progress ?? 0
  const progressPct = hasProgress ? Math.min(100, (progress / task.target!) * 100) : 0

  const handleDone = async () => {
    await tasksRepo.complete(task.id)
    navigate(-1)
  }

  const handleSkip = async () => {
    await tasksRepo.skip(task.id)
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-app pb-24">
      <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="px-5 pt-4 pb-5" style={{ background: 'var(--bg-surface-2)' }}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-surface border border-[var(--border-subtle)] flex items-center justify-center"
          >
            <ChevronLeft size={18} color="var(--text-secondary)" strokeWidth={2.4} />
          </button>
          <button
            onClick={() => navigate(`/edit/task/${task.id}`)}
            className="w-9 h-9 rounded-xl bg-surface border border-[var(--border-subtle)] flex items-center justify-center"
          >
            <Pencil size={15} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Priority badge */}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-sans font-extrabold text-[11px] mb-3"
          style={{ background: `${PRIORITY_COLOR[task.priority]}20`, color: PRIORITY_COLOR[task.priority] }}>
          {PRIORITY_LABEL[task.priority]} priority
        </span>

        <div className="w-[62px] h-[62px] rounded-[18px] flex items-center justify-center mb-3 text-[30px]"
          style={{ background: `${task.color}22` }}>
          {task.icon}
        </div>

        <div className="font-sans text-[30px] font-extrabold text-[var(--text-primary)] tracking-tight"
          style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
          {task.title}
        </div>

        {task.description && (
          <div className="font-body text-[14px] text-[var(--text-secondary)] mt-1">{task.description}</div>
        )}

        <div className="flex gap-1.5 mt-3 flex-wrap">
          {taskTags.map(tag => (
            <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-sans font-bold text-[11px]"
              style={{ background: `${tag.color}18`, color: tag.color }}>
              <span className="w-1 h-1 rounded-full bg-current" />{tag.name}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 bg-surface2 px-2 py-0.5 rounded-full font-sans font-bold text-[11px]"
            style={{ color: isOverdue ? 'var(--color-overdue)' : 'var(--text-secondary)' }}>
            <Calendar size={11} />
            {format(parseISO(task.dueDate + 'T12:00:00'), 'MMM d, yyyy')}
            {isOverdue && ' (overdue)'}
          </span>
          {task.dueTime && (
            <span className="inline-flex items-center gap-1 bg-surface2 px-2 py-0.5 rounded-full font-sans font-bold text-[11px] text-[var(--text-secondary)]">
              <Clock size={11} />{task.dueTime}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {hasProgress && (
        <div className="px-4 mb-2">
          <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl p-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-sans font-bold text-[12px] text-[var(--text-secondary)] uppercase tracking-wide">Progress</span>
              <span className="font-sans font-extrabold text-[18px]" style={{ color: task.color }}>
                {progress}<span className="text-[13px] text-[var(--text-tertiary)]">/{task.target} {task.unit}</span>
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
              <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${progressPct}%`, background: task.color }} />
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      {(isDone || isSkipped) && (
        <div className="mx-4 mb-4 rounded-2xl p-4 border"
          style={{
            background: isDone ? 'var(--color-done-bg)' : 'var(--color-skipped-bg)',
            borderColor: isDone ? '#22c55e33' : 'var(--color-skipped)33',
          }}>
          <p className="font-sans font-bold text-[14px]" style={{ color: isDone ? 'var(--color-done)' : 'var(--color-skipped)' }}>
            {isDone ? '✅ Completed' : '⏭ Skipped'}
            {task.completedAt && ` on ${format(new Date(task.completedAt), 'MMM d, yyyy')}`}
          </p>
        </div>
      )}

      {/* Actions */}
      {task.status === 'pending' && (
        <div className="px-4 flex flex-col gap-2.5">
          <button onClick={handleDone}
            className="w-full h-12 rounded-xl font-sans font-extrabold text-[15px] text-white flex items-center justify-center gap-2 transition-opacity"
            style={{ background: 'var(--color-done)' }}>
            <CheckCircle2 size={18} />
            Mark Done
          </button>
          <button onClick={handleSkip}
            className="w-full h-12 rounded-xl font-sans font-bold text-[15px] flex items-center justify-center gap-2 transition-opacity"
            style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
            <SkipForward size={16} />
            Skip
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
