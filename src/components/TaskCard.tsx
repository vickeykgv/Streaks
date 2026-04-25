import { Check, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TaskData {
  id: string
  title: string
  dueTime?: string
  priority: 'high' | 'med' | 'low'
  overdue?: boolean
  status: 'pending' | 'done'
  color: string
  tags?: { name: string; color: string }[]
}

interface TaskCardProps {
  task: TaskData
  onToggle: () => void
}

const priorityColor = {
  high: 'var(--color-overdue)',
  med:  'var(--color-priority-med)',
  low:  'var(--color-skipped)',
}

export function TaskCard({ task, onToggle }: TaskCardProps) {
  const done = task.status === 'done'

  return (
    <div
      className="relative overflow-hidden rounded-2xl flex items-center gap-3 px-3.5 py-3 transition-[background,border-color] duration-[200ms]"
      style={{
        background: done ? 'var(--color-done-bg)' : 'var(--bg-surface)',
        border: done ? '1px solid #22c55e33' : '1px solid var(--border-subtle)',
        boxShadow: done ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* DONE pill */}
      {done && (
        <span
          className="absolute top-2 right-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-sans font-extrabold text-[10px] tracking-wide"
          style={{ background: 'var(--color-done)', color: '#fff' }}
        >
          <Check size={10} strokeWidth={3.5} />DONE
        </span>
      )}

      {/* Checkbox */}
      <button
        onClick={onToggle}
        aria-label={done ? 'Mark not done' : 'Mark done'}
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-[200ms] ease-[var(--ease-spring)] active:scale-90"
        style={{
          border: `2px solid ${done ? task.color : 'var(--border-default)'}`,
          background: done ? task.color : 'transparent',
          boxShadow: done ? `0 0 0 6px ${task.color}18` : 'none',
        }}
      >
        {done && <Check size={20} color="#fff" strokeWidth={3} />}
      </button>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div
          className={cn('font-sans font-bold text-[14.5px] transition-colors duration-[200ms]')}
          style={{
            color: done ? 'var(--text-tertiary)' : 'var(--text-primary)',
            textDecoration: done ? 'line-through' : 'none',
            textDecorationColor: 'var(--color-done)',
            textDecorationThickness: '2px',
          }}
        >
          {task.title}
        </div>
        <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
          {task.dueTime && (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--text-secondary)]">
              <Clock size={11} />
              {task.dueTime}
            </span>
          )}
          {task.overdue && !done && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-extrabold px-1.5 py-0.5 rounded-full"
              style={{ color: 'var(--color-overdue)', background: 'var(--color-overdue-bg)' }}
            >
              <AlertCircle size={10} />overdue
            </span>
          )}
          {task.tags?.map(tag => (
            <span
              key={tag.name}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-sans font-bold text-[11px]"
              style={{ background: `${tag.color}18`, color: tag.color }}
            >
              <span className="w-1 h-1 rounded-full bg-current" />
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Priority dot */}
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 self-start mt-2"
        style={{ background: priorityColor[task.priority] }}
        title={`${task.priority} priority`}
      />
    </div>
  )
}
