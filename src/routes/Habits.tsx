import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, ChevronRight, Flame, Plus, Sparkles, SearchX } from 'lucide-react'
import { habitsRepo } from '@/db/repos/habits'
import { entriesRepo } from '@/db/repos/entries'
import { tagsRepo } from '@/db/repos/tags'
import { computeStreak, computeCompletionRate } from '@/lib/streaks'
import { format } from 'date-fns'
import { useAppStore } from '@/store/appStore'
import { EmptyState } from '@/components/ui'

export default function Habits() {
  const openCreateComposer = useAppStore(s => s.openCreateComposer)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const habits = useLiveQuery(() => habitsRepo.getAll(showArchived), [showArchived]) ?? []
  const tags = useLiveQuery(() => tagsRepo.getAll(), []) ?? []

  const filtered = habits.filter(h => {
    const matchSearch = h.title.toLowerCase().includes(search.toLowerCase())
    const matchTag = filterTag ? h.tags.includes(filterTag) : true
    return matchSearch && matchTag
  })

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-3xl px-0">
        <div className="px-4 pt-4">
          <div className="hero-panel rounded-[30px] px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="section-kicker mb-2">Routine studio</div>
                <div className="font-sans text-[30px] font-extrabold tracking-tight text-[var(--text-primary)]">Habits</div>
                <div className="mt-1 font-body text-[13px] text-[var(--text-secondary)]">
                  {habits.length} active habits ready to keep your streak alive.
                </div>
              </div>
              <button
                onClick={() => openCreateComposer('habit')}
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--text-on-brand)] shadow-[var(--shadow-glow)]"
                style={{ background: 'var(--color-brand-500)' }}
                aria-label="Create habit"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel mx-4 mt-4 rounded-[26px] p-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search habits..."
              className="h-11 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-strong)] pl-10 pr-3.5 font-sans text-[14px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]"
            />
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            <button
              onClick={() => setFilterTag(null)}
              className="shrink-0 rounded-full px-3.5 py-2 font-sans text-[12px] font-bold whitespace-nowrap transition-colors"
              style={{
                background: filterTag === null ? 'var(--color-brand-500)' : 'var(--bg-surface)',
                border: filterTag === null ? 'none' : '1px solid var(--border-subtle)',
                color: filterTag === null ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                boxShadow: filterTag === null ? 'var(--shadow-glow)' : 'none',
              }}
            >
              All
            </button>
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                className="shrink-0 rounded-full px-3.5 py-2 font-sans text-[12px] font-bold whitespace-nowrap transition-colors"
                style={{
                  background: filterTag === tag.id ? tag.color : 'var(--bg-surface)',
                  border: filterTag === tag.id ? 'none' : `1px solid ${tag.color}44`,
                  color: filterTag === tag.id ? '#fff' : tag.color,
                  boxShadow: filterTag === tag.id ? 'var(--shadow-card)' : 'none',
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-1 flex flex-col gap-3 px-4">
          {filtered.length === 0 && (
            <div className="glass-panel rounded-[28px]">
              <EmptyState
                hero
                icon={search || filterTag
                  ? <SearchX size={26} strokeWidth={1.8} />
                  : <Sparkles size={26} strokeWidth={1.8} />}
                headline={search || filterTag ? 'No matching habits' : 'No habits yet'}
                subheadline={
                  search || filterTag
                    ? 'Try a different search or clear your filters.'
                    : 'Add your first habit and start building your streak.'
                }
                action={
                  !search && !filterTag
                    ? { label: '+ Create first habit', onClick: () => openCreateComposer('habit') }
                    : undefined
                }
              />
            </div>
          )}
          {filtered.map(h => (
            <HabitRow key={h.id} habitId={h.id} title={h.title} color={h.color} icon={h.icon} startDate={h.startDate} />
          ))}
        </div>

        <button
          onClick={() => setShowArchived(a => !a)}
          className="mx-auto mt-5 flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 font-sans text-[12px] font-semibold text-[var(--text-tertiary)] shadow-card"
        >
          {showArchived ? 'Hide archived' : 'Show archived'}
        </button>

        <button
          onClick={() => openCreateComposer('habit')}
          className="fixed bottom-24 right-4 z-20 flex h-[58px] w-[58px] items-center justify-center rounded-[22px] text-[var(--text-on-brand)] transition-transform active:scale-95 lg:bottom-8 lg:right-8"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-fab)' }}
          aria-label="New habit"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

function HabitRow({ habitId, title, color, icon }: {
  habitId: string
  title: string
  color: string
  icon: string
  startDate: string
}) {
  const navigate = useNavigate()
  const entries = useLiveQuery(() => entriesRepo.getForHabit(habitId), [habitId]) ?? []
  const streak = computeStreak(entries)
  const rate = computeCompletionRate(entries, 30)
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayEntry = entries.find(e => e.date === today)
  const isDone = todayEntry?.status === 'done'

  return (
    <button
      onClick={() => navigate(`/habits/${habitId}`)}
      className="glass-panel flex w-full items-center gap-3 rounded-[24px] px-4 py-3.5 text-left transition-[border-color,transform] duration-200 hover:-translate-y-[1px]"
      style={{ borderColor: isDone ? '#22c55e33' : 'var(--border-subtle)', background: isDone ? 'var(--color-done-bg)' : 'var(--bg-surface)' }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
        style={{ background: `${color}22` }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-sans text-[14px] font-bold text-[var(--text-primary)]">{title}</div>
        <div className="mt-0.5 flex items-center gap-2">
          {streak > 0 && (
            <span className="inline-flex items-center gap-0.5 font-sans text-[11px] font-extrabold" style={{ color: 'var(--color-streak)' }}>
              <Flame size={10} fill="var(--color-streak)" stroke="none" />
              {streak}d
            </span>
          )}
          <span className="font-body text-[11px] text-[var(--text-tertiary)]">
            {Math.round(rate * 100)}% · 30d
          </span>
        </div>
        <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-[var(--bg-surface-2)]">
          <div className="h-full rounded-full" style={{ width: `${rate * 100}%`, background: isDone ? 'var(--color-done)' : color }} />
        </div>
      </div>
      <ChevronRight size={16} color="var(--text-tertiary)" />
    </button>
  )
}
