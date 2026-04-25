import { NavLink } from 'react-router-dom'
import { Home, List, Calendar, BarChart2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/',         label: 'Today',    Icon: Home,     exact: true },
  { to: '/habits',   label: 'Habits',   Icon: List,     exact: false },
  { to: '/tasks',    label: 'Tasks',    Icon: Calendar, exact: false },
  { to: '/stats',    label: 'Stats',    Icon: BarChart2,exact: false },
  { to: '/settings', label: 'Settings', Icon: Settings, exact: false },
]

export function BottomNav() {
  return (
    <nav
      className="lg:hidden fixed bottom-3 left-3 right-3 z-[var(--z-sticky)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="floating-nav flex h-[72px] items-center rounded-[26px] px-2">
        {items.map(({ to, label, Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => cn(
              'flex flex-1 flex-col items-center justify-center gap-1 rounded-[20px] py-2',
              'text-[var(--text-tertiary)] transition-all duration-200',
              isActive && 'bg-[rgba(229,9,20,0.14)] text-brand-500',
            )}
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200',
                  isActive && 'bg-[rgba(229,9,20,0.16)] shadow-[var(--shadow-soft)]',
                )}>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                </div>
                <span className={cn(
                  'text-[10px] font-sans tracking-[0.08em]',
                  isActive ? 'font-extrabold' : 'font-semibold',
                )}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
