import { Flame } from 'lucide-react'

interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak <= 0) return null

  const pulse = streak >= 7

  return (
    <span
      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-sans font-extrabold text-[11px] shrink-0"
      style={{
        background: 'var(--color-streak-bg)',
        color: 'var(--color-streak)',
        animation: pulse ? 'streakPulse 2s ease-in-out infinite' : 'none',
      }}
    >
      <Flame size={11} fill="var(--color-streak)" stroke="none" />
      {streak}
    </span>
  )
}
