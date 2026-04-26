import { NavLink } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Home, List, Calendar, BarChart2, Settings, Tag, Flame } from 'lucide-react'
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

function NavItem({ to, label, Icon, exact, showBadge }: {
  to: string; label: string; Icon: React.ElementType; exact?: boolean; showBadge?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) => cn(
        'flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-2xl transition-all duration-200 group',
        isActive
          ? 'text-white'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
      )}
    >
      {({ isActive }) => (
        <>
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-2xl shrink-0 transition-all duration-200',
            isActive
              ? 'bg-[var(--color-brand-500)] shadow-[0_4px_14px_rgba(229,9,20,0.45)]'
              : 'bg-[var(--bg-surface-2)] group-hover:bg-[var(--bg-surface-3)]',
          )}>
            <Icon
              size={18}
              strokeWidth={isActive ? 2.5 : 2}
              className="shrink-0"
              color={isActive ? '#fff' : 'currentColor'}
            />
          </div>
          <span className="font-sans font-semibold text-[10px] text-center leading-tight min-w-0">{label}</span>
          {showBadge && <TodayBadge />}
        </>
      )}
    </NavLink>
  )
}

export function SideNav() {
  return (
    <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 z-20 w-[112px] px-3 py-3">
      <div className="glass-panel flex h-full flex-col overflow-hidden rounded-[30px]">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 px-4 pt-5 pb-4">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #e50914 0%, #b00010 100%)',
              boxShadow: '0 4px 16px rgba(229,9,20,0.5)',
            }}
          >
            <Flame size={20} strokeWidth={2} color="#fff" fill="rgba(255,255,255,0.25)" />
          </div>
          <span className="font-sans text-[11px] font-bold tracking-wide text-[var(--text-secondary)] uppercase">
            Streaks
          </span>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-[var(--border-subtle)]" />

        {/* Main nav */}
        <div className="flex-1 flex flex-col gap-0.5 px-2.5 py-3 overflow-y-auto">
          {mainItems.map(({ to, label, Icon, exact }) => (
            <NavItem key={to} to={to} label={label} Icon={Icon} exact={exact} showBadge={label === 'Today'} />
          ))}
        </div>

        {/* Footer nav */}
        <div className="flex flex-col gap-0.5 px-2.5 py-3 shrink-0 border-t border-[var(--border-subtle)]">
          {footerItems.map(({ to, label, Icon }) => (
            <NavItem key={to} to={to} label={label} Icon={Icon} />
          ))}
        </div>

      </div>
    </nav>
  )
}
