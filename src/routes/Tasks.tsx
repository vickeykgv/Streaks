import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { tasksRepo } from '@/db/repos/tasks'
import { tagsRepo } from '@/db/repos/tags'
import { useAppStore } from '@/store/appStore'
import { EmptyState } from '@/components/ui'
import type { Task } from '@/types'

const PRIORITY_COLOR: Record<string, string> = {
  high: 'var(--color-overdue)',
  med: 'var(--color-priority-med)',
  low: 'var(--color-skipped)',
}

const TABS = ['Pending', 'Done', 'All'] as const
type Tab = typeof TABS[number]

export default function Tasks() {
  const openCreateComposer = useAppStore(s => s.openCreateComposer)
  const [tab, setTab] = useState<Tab>('Pending')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)

  const allTasks = useLiveQuery(() => tasksRepo.getAll(), []) ?? []
  const tags = useLiveQuery(() => tagsRepo.getAll(), []) ?? []

  const visibleTasks = allTasks
    .filter(t => {
      if (tab === 'Pending') return t.status === 'pending'
      if (tab === 'Done') return t.status === 'done' || t.status === 'skipped'
      return true
    })
    .filter(t => filterTag ? t.tags.includes(filterTag) : true)
    .filter(t => filterPriority ? t.priority === filterPriority : true)

  const today = format(new Date(), 'yyyy-MM-dd')
  const overdue = visibleTasks.filter(t => t.status === 'pending' && t.dueDate < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const dueToday = visibleTasks.filter(t => t.status === 'pending' && t.dueDate === today)
  const upcoming = visibleTasks.filter(t => t.status === 'pending' && t.dueDate > today).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const done = visibleTasks.filter(t => t.status !== 'pending').sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-3xl px-0">
        <div className="px-4 pt-4">
          <div className="hero-panel rounded-[30px] px-5 py-5">
            <div className="section-kicker mb-2">Execution board</div>
            <div className="font-sans text-[30px] font-extrabold tracking-tight text-[var(--text-primary)]">Tasks</div>
            <div className="mt-1 font-body text-[13px] text-[var(--text-secondary)]">
              {allTasks.length} tasks across overdue, active, and completed work.
            </div>
          </div>
        </div>

        <div className="glass-panel mx-4 mt-4 rounded-[26px] p-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="rounded-2xl px-4 py-2.5 font-sans text-[13px] font-bold transition-all"
                style={{
                  background: tab === t ? 'var(--color-brand-500)' : 'var(--bg-surface-strong)',
                  border: tab === t ? 'none' : '1px solid var(--border-subtle)',
                  color: tab === t ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                  boxShadow: tab === t ? 'var(--shadow-glow)' : 'none',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            <FilterChip active={filterTag === null} onClick={() => setFilterTag(null)} label="All tags" />
            {tags.map(tag => (
              <FilterChip
                key={tag.id}
                active={filterTag === tag.id}
                onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                label={tag.name}
                color={tag.color}
              />
            ))}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto px-4 pb-2">
          <FilterChip active={filterPriority === null} onClick={() => setFilterPriority(null)} label="All priorities" />
          {(['high', 'med', 'low'] as const).map(p => (
            <FilterChip
              key={p}
              active={filterPriority === p}
              onClick={() => setFilterPriority(filterPriority === p ? null : p)}
              label={p[0].toUpperCase() + p.slice(1)}
              color={PRIORITY_COLOR[p]}
            />
          ))}
        </div>

        <div className="mt-2 flex flex-col gap-3 px-4">
          {tab === 'Pending' && (
            <>
              {overdue.length > 0 && (
                <>
                  <SectionLabel label="Overdue" color="var(--color-overdue)" count={overdue.length} />
                  {overdue.map(t => <TaskRow key={t.id} task={t} />)}
                </>
              )}
              {dueToday.length > 0 && (
                <>
                  <SectionLabel label="Today" count={dueToday.length} />
                  {dueToday.map(t => <TaskRow key={t.id} task={t} />)}
                </>
              )}
              {upcoming.length > 0 && (
                <>
                  <SectionLabel label="Upcoming" count={upcoming.length} />
                  {upcoming.map(t => <TaskRow key={t.id} task={t} />)}
                </>
              )}
              {overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0 && (
                <div className="glass-panel rounded-[28px]">
                  <EmptyState
                    emoji="📋"
                    headline="No pending tasks"
                    subheadline="You're all caught up! Add a task to stay on top of your goals."
                    action={{ label: '+ Add task', onClick: () => openCreateComposer('task') }}
                  />
                </div>
              )}
            </>
          )}
          {tab === 'Done' && (
            <>
              {done.length > 0 ? done.map(t => <TaskRow key={t.id} task={t} />) : (
                <div className="glass-panel rounded-[28px]">
                  <EmptyState
                    emoji="✅"
                    headline="Nothing completed yet"
                    subheadline="Tasks you finish will show up here. Keep going!"
                  />
                </div>
              )}
            </>
          )}
          {tab === 'All' && (
            <>
              {visibleTasks.length > 0
                ? [...visibleTasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(t => <TaskRow key={t.id} task={t} />)
                : (
                  <div className="glass-panel rounded-[28px]">
                    <EmptyState
                      emoji="🗂️"
                      headline="No tasks yet"
                      subheadline="One-off goals, deadlines, and errands — add anything here."
                      action={{ label: '+ Create task', onClick: () => openCreateComposer('task') }}
                    />
                  </div>
                )}
            </>
          )}
        </div>

        <button
          onClick={() => openCreateComposer('task')}
          className="fixed bottom-24 right-4 z-20 flex h-[58px] w-[58px] items-center justify-center rounded-[22px] text-[var(--text-on-brand)] transition-transform active:scale-95 lg:bottom-8 lg:right-8"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-fab)' }}
          aria-label="New task"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

function FilterChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full px-3.5 py-2 font-sans text-[12px] font-bold whitespace-nowrap transition-colors"
      style={{
        background: active ? (color ?? 'var(--color-brand-500)') : 'var(--bg-surface)',
        border: active ? 'none' : `1px solid ${color ? `${color}44` : 'var(--border-subtle)'}`,
        color: active ? 'var(--text-on-brand)' : (color ?? 'var(--text-secondary)'),
        boxShadow: active ? 'var(--shadow-card)' : 'none',
      }}
    >
      {label}
    </button>
  )
}

function SectionLabel({ label, count, color }: { label: string; count: number; color?: string }) {
  return (
    <div className="section-kicker mb-0.5 mt-2" style={{ color: color ?? 'var(--text-tertiary)' }}>
      {label} · {count}
    </div>
  )
}


function TaskRow({ task }: { task: Task }) {
  const navigate = useNavigate()
  const today = format(new Date(), 'yyyy-MM-dd')
  const isOverdue = task.status === 'pending' && task.dueDate < today
  const isTodayDue = task.dueDate === today
  const done = task.status === 'done'
  const skipped = task.status === 'skipped'

  const dueBadgeColor = isOverdue ? 'var(--color-overdue)' : isTodayDue ? 'var(--color-streak)' : 'var(--text-tertiary)'

  return (
    <button
      onClick={() => navigate(`/tasks/${task.id}`)}
      className="glass-panel flex w-full items-center gap-3 rounded-[24px] px-4 py-3.5 text-left transition-[border-color,transform] duration-200 hover:-translate-y-[1px]"
      style={{
        background: done ? 'var(--color-done-bg)' : 'var(--bg-surface)',
        border: done ? '1px solid #22c55e33' : '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
        style={{ background: `${task.color}22` }}
      >
        {task.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="font-sans text-[14.5px] font-bold"
          style={{
            color: done || skipped ? 'var(--text-tertiary)' : 'var(--text-primary)',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </div>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-[var(--bg-surface-2)] px-2.5 py-1 font-body text-[11px] font-semibold" style={{ color: dueBadgeColor }}>
            {isOverdue ? `Due ${task.dueDate}` : isTodayDue ? 'Today' : format(parseISO(task.dueDate + 'T12:00:00'), 'MMM d')}
          </span>
          {task.dueTime && (
            <span className="font-body text-[12px] text-[var(--text-secondary)]">{task.dueTime}</span>
          )}
        </div>
      </div>

      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PRIORITY_COLOR[task.priority], boxShadow: `0 0 0 5px ${PRIORITY_COLOR[task.priority]}18` }} />
    </button>
  )
}
