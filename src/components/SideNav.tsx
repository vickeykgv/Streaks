import { NavLink } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Home, List, Calendar, BarChart2, Settings, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { habitsRepo } from '@/db/repos/habits'
import { entriesRepo } from '@/db/repos/entries'
import { cn } from '@/lib/utils'

const mainItems = [
  { to: '/',       label: 'Today',   Icon: Home,     exact: true  },
  { to: '/habits', label: 'Habits',  Icon: List,     exact: false },
  { to: '/tasks',  label: 'Tasks',   Icon: Calendar, exact: false },
  { to: '/stats',  label: 'Stats',   Icon: BarChart2,exact: false },
]

const footerItems = [
  { to: '/tags',     label: 'Tags',     Icon: Tag      },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

function TodayBadge() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const habits = useLiveQuery(() => habitsRepo.getAll(false), []) ?? []
  const entries = useLiveQuery(() => entriesRepo.getForDate(today), [today]) ?? []
  const total = habits.length
  if (total === 0) return null
  const done = entries.filter(e => e.status === 'done').length
  return (
    <span
      className="font-sans font-extrabold text-[10px] px-1.5 py-0.5 rounded-full shrink-0 leading-[1.4]"
      style={{ background: 'var(--color-brand-500)', color: 'var(--text-on-brand)', minWidth: '28px', textAlign: 'center' }}
    >
      {done}/{total}
    </span>
  )
}

export function SideNav() {
  return (
    <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 z-20 w-[112px] px-3 py-3">
      <div className="glass-panel flex h-full flex-col overflow-hidden rounded-[30px]">

        <div className="px-4 pb-4 pt-5">
          <div className="hero-panel rounded-[24px] px-3 py-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl shrink-0"
                style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
              >
                <span className="font-sans text-[14px] font-extrabold text-[var(--text-on-brand)]">S</span>
              </div>
              <div className="min-w-0">
                <div className="font-sans text-[14px] font-extrabold text-[var(--text-primary)]">Streaks</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-0.5 px-2.5 py-2 overflow-y-auto">
          {mainItems.map(({ to, label, Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-2 px-2 py-3 rounded-2xl transition-all duration-200',
                isActive
                  ? 'bg-[rgba(229,9,20,0.14)] text-[var(--color-brand-500)] shadow-[var(--shadow-soft)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]',
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-2xl shrink-0 transition-all duration-200',
                    isActive ? 'bg-[rgba(229,9,20,0.16)]' : 'bg-[var(--bg-surface-2)]',
                  )}>
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                  </div>
                  <span className="font-sans font-semibold text-[11px] text-center leading-tight min-w-0">{label}</span>
                  {label === 'Today' && <TodayBadge />}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex flex-col gap-0.5 px-2.5 py-3 shrink-0 border-t border-[var(--border-subtle)]">
          {footerItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-2 px-2 py-3 rounded-2xl transition-all duration-200',
                isActive
                  ? 'bg-[rgba(229,9,20,0.14)] text-[var(--color-brand-500)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]',
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-2xl shrink-0',
                    isActive ? 'bg-[rgba(229,9,20,0.16)]' : 'bg-[var(--bg-surface-2)]',
                  )}>
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                  </div>
                  <span className="font-sans font-semibold text-[11px] text-center leading-tight">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
