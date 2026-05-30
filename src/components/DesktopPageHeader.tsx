import { format } from 'date-fns'
import { SyncStatusBadge } from '@/components/SyncStatusBadge'
import type { ReactNode } from 'react'

interface DesktopPageHeaderProps {
  extras?: ReactNode
  action?: ReactNode
}

export function DesktopPageHeader({ extras, action }: DesktopPageHeaderProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dateStr = format(new Date(), 'EEEE, MMMM d')

  return (
    <header className="hidden lg:flex sticky top-0 z-20 items-center gap-3 px-6 py-3 border-b border-[var(--border-subtle)] bg-[rgba(var(--bg-app-rgb),0.72)] backdrop-blur-xl">
      <div className="flex-1 min-w-0">
        <p className="section-kicker leading-none">{dateStr}</p>
        <p className="font-sans font-extrabold text-[18px] text-[var(--text-primary)] tracking-tight leading-snug truncate mt-0.5">
          {greeting}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {extras}
        <SyncStatusBadge />
        {action}
      </div>
    </header>
  )
}
