import { NavLink, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Home, List, Calendar, BarChart2, Settings, Tag, Flame, Wallet, ArrowLeftRight, Building2, Target, Bike, Car, Fuel, Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { habitsRepo } from '@/db/repos/habits'
import { entriesRepo } from '@/db/repos/entries'
import { cn } from '@/lib/utils'
import { useModule, type ActiveModule } from '@/store/module'

const MODULES: { id: ActiveModule; label: string; Icon: typeof Flame; home: string }[] = [
  { id: 'habits',   label: 'Habits', Icon: Flame,  home: '/' },
  { id: 'spending', label: 'Money',  Icon: Wallet, home: '/spending' },
  { id: 'moto',     label: 'Moto',   Icon: Bike,   home: '/moto' },
]

const habitsMainItems = [
  { to: '/',       label: 'Today',   Icon: Home,     exact: true  },
  { to: '/habits', label: 'Habits',  Icon: List,     exact: false },
  { to: '/tasks',  label: 'Tasks',   Icon: Calendar, exact: false },
  { to: '/stats',  label: 'Stats',   Icon: BarChart2,exact: false },
  { to: '/tags',   label: 'Tags',    Icon: Tag,      exact: false },
]

const spendingMainItems = [
  { to: '/spending',              label: 'Dashboard',    Icon: Wallet,        exact: true  },
  { to: '/spending/transactions', label: 'Transactions', Icon: ArrowLeftRight,exact: false },
  { to: '/spending/accounts',     label: 'Accounts',     Icon: Building2,     exact: false },
  { to: '/spending/budgets',      label: 'Budgets',      Icon: Target,        exact: false },
  { to: '/spending/reports',      label: 'Reports',      Icon: BarChart2,     exact: false },
]

const motoMainItems = [
  { to: '/moto',           label: 'Dashboard', Icon: Bike,      exact: true  },
  { to: '/moto/vehicles',  label: 'Garage',    Icon: Car,       exact: false },
  { to: '/moto/fuel',      label: 'Fuel',      Icon: Fuel,      exact: false },
  { to: '/moto/service',   label: 'Service',   Icon: Wrench,    exact: false },
  { to: '/moto/reports',   label: 'Reports',   Icon: BarChart2, exact: false },
]

const footerItems = [
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

function SideModuleSwitcher() {
  const { activeModule, setModule } = useModule()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-0.5 px-2.5 py-3 shrink-0 border-t border-[var(--border-subtle)]">
      {MODULES.map(({ id, label, Icon, home }) => {
        const active = activeModule === id
        return (
          <div key={id} className="relative group flex flex-col items-center">
            <button
              onClick={() => { setModule(id); navigate(home) }}
              className={cn(
                'flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-2xl w-full transition-all duration-200',
                active ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
              aria-pressed={active}
              aria-label={label}
            >
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl shrink-0 transition-all duration-200',
                active
                  ? 'bg-[var(--color-brand-500)] shadow-[0_4px_14px_rgba(229,9,20,0.45)]'
                  : 'bg-[var(--bg-surface-2)] group-hover:bg-[var(--bg-surface-3)]',
              )}>
                <Icon
                  size={18}
                  strokeWidth={active ? 2.5 : 2}
                  color={active ? '#fff' : 'currentColor'}
                />
              </div>
              <span className="font-sans font-semibold text-[10px] text-center leading-tight">{label}</span>
            </button>

            {/* Tooltip */}
            <div
              className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50
                         opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            >
              <div
                className="whitespace-nowrap rounded-xl px-2.5 py-1.5 font-sans text-[12px] font-bold text-white shadow-lg"
                style={{ background: 'rgba(20,20,22,0.92)', backdropFilter: 'blur(8px)' }}
              >
                {label}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function SideNav() {
  const { activeModule } = useModule()
  const mainItems =
    activeModule === 'habits'   ? habitsMainItems   :
    activeModule === 'spending' ? spendingMainItems :
    motoMainItems

  return (
    <>
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

          {/* Module switcher — above footer */}
          <SideModuleSwitcher />

          {/* Footer nav */}
          <div className="flex flex-col gap-0.5 px-2.5 py-3 shrink-0 border-t border-[var(--border-subtle)]">
            {footerItems.map(({ to, label, Icon }) => (
              <NavItem key={to} to={to} label={label} Icon={Icon} />
            ))}
          </div>

        </div>
      </nav>
    </>
  )
}
