import { useNavigate } from 'react-router-dom'
import { Flame, Wallet, Bike } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useModule, type ActiveModule } from '@/store/module'

const MODULES: { id: ActiveModule; label: string; Icon: typeof Flame; home: string }[] = [
  { id: 'habits',   label: 'Habits', Icon: Flame,  home: '/' },
  { id: 'spending', label: 'Money',  Icon: Wallet, home: '/spending' },
  { id: 'moto',     label: 'Moto',   Icon: Bike,   home: '/moto' },
]

// Full-width horizontal segmented control for the mobile bottom nav
export function ModuleSwitcher() {
  const { activeModule, setModule } = useModule()
  const navigate = useNavigate()

  const handleSwitch = (m: ActiveModule, home: string) => {
    setModule(m)
    navigate(home)
  }

  return (
    <div className="flex w-full rounded-xl p-0.5" style={{ background: 'var(--bg-surface-2)' }}>
      {MODULES.map(({ id, label, Icon, home }) => {
        const active = activeModule === id
        return (
          <button
            key={id}
            onClick={() => handleSwitch(id, home)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 transition-all duration-200',
              active
                ? 'bg-[var(--color-brand-500)] shadow-[0_2px_8px_rgba(229,9,20,0.35)] text-white'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
            )}
            aria-label={label}
            aria-pressed={active}
          >
            <Icon size={13} strokeWidth={active ? 2.5 : 2} color={active ? '#fff' : 'currentColor'} />
            <span className="font-sans text-[11px] font-bold tracking-wide">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
