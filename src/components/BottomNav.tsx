import { NavLink, useLocation } from 'react-router-dom'
import { Home, List, Calendar, BarChart2, Settings, Wallet, ArrowLeftRight, Building2, Target, Bike, Car, Fuel, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'

const habitsItems = [
  { to: '/',         label: 'Today',    Icon: Home,     exact: true },
  { to: '/habits',   label: 'Habits',   Icon: List,     exact: false },
  { to: '/tasks',    label: 'Tasks',    Icon: Calendar, exact: false },
  { to: '/stats',    label: 'Stats',    Icon: BarChart2,exact: false },
  { to: '/settings', label: 'Settings', Icon: Settings, exact: false },
]

const spendingItems = [
  { to: '/spending',              label: 'Overview', Icon: Wallet,        exact: true  },
  { to: '/spending/transactions', label: 'History',  Icon: ArrowLeftRight,exact: false },
  { to: '/spending/accounts',     label: 'Accounts', Icon: Building2,     exact: false },
  { to: '/spending/budgets',      label: 'Budgets',  Icon: Target,        exact: false },
  { to: '/settings',              label: 'Settings', Icon: Settings,      exact: false },
]

const motoItems = [
  { to: '/moto',          label: 'Dashboard', Icon: Bike,     exact: true  },
  { to: '/moto/vehicles', label: 'Garage',    Icon: Car,      exact: false },
  { to: '/moto/fuel',     label: 'Fuel',      Icon: Fuel,     exact: false },
  { to: '/moto/service',  label: 'Service',   Icon: Wrench,   exact: false },
  { to: '/settings',      label: 'Settings',  Icon: Settings, exact: false },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const activeModule =
    pathname.startsWith('/moto')     ? 'moto' :
    pathname.startsWith('/spending') ? 'spending' :
    'habits'
  const items =
    activeModule === 'habits'   ? habitsItems   :
    activeModule === 'spending' ? spendingItems :
    motoItems

  return (
    <nav
      className="lg:hidden fixed bottom-3 left-3 right-3 z-[var(--z-sticky)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="floating-nav flex flex-col rounded-[26px] overflow-hidden">
        {/* Module switcher */}
        <div className="px-3 pt-3 pb-1">
          <ModuleSwitcher />
        </div>

        {/* Nav items row */}
        <div className="flex h-[62px] items-center px-2">
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
                    'flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200',
                    isActive && 'bg-[rgba(229,9,20,0.16)] shadow-[var(--shadow-soft)]',
                  )}>
                    <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                  </div>
                  <span className={cn(
                    'text-[9px] font-sans tracking-[0.06em]',
                    isActive ? 'font-extrabold text-[var(--text-primary)]' : 'font-semibold',
                  )}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
