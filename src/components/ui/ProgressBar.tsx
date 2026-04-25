interface ProgressBarProps {
  value: number
  color?: string
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export function ProgressBar({ value, color, size = 'sm', showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${height} bg-surface2 rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-[width] duration-[350ms] ease-[var(--ease-out)]"
          style={{
            width: `${clamped}%`,
            backgroundColor: color ?? 'var(--color-brand-500)',
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold font-sans text-[var(--text-secondary)] tabular-nums w-8 text-right">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  )
}
