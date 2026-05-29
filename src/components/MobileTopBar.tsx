import { Bell } from 'lucide-react'
import { format } from 'date-fns'
import { copy } from '@/lib/copy'
import { SyncStatusBadge } from '@/components/SyncStatusBadge'

export function MobileTopBar() {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? copy.greetingMorning : hour < 18 ? copy.greetingAfternoon : copy.greetingEvening
  const dateStr = format(new Date(), 'EEEE, MMMM d')

  return (
    <header
      className="lg:hidden sticky top-0 z-20 flex h-[60px] items-center gap-3 px-4 border-b border-[var(--border-subtle)] bg-[rgba(var(--bg-app-rgb),0.72)] backdrop-blur-xl"
    >
      {/* Logo mark */}
      <div
        className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-[var(--shadow-glow)]"
        style={{ background: 'var(--color-brand-500)' }}
      >
        <span className="font-sans font-extrabold text-[13px] text-[var(--text-on-brand)]">S</span>
      </div>

      {/* Title — same layout for both modules */}
      <div className="flex-1 min-w-0">
        <p className="section-kicker leading-none">{dateStr}</p>
        <p className="font-sans font-extrabold text-[16px] text-[var(--text-primary)] tracking-tight leading-snug truncate mt-0.5">
          {greeting}
        </p>
      </div>

      <SyncStatusBadge />

      <button
        className="glass-panel shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--bg-surface)' }}
        aria-label="Notifications"
      >
        <Bell size={15} color="var(--text-secondary)" />
      </button>
    </header>
  )
}
