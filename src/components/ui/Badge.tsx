import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'brand' | 'done' | 'partial' | 'overdue' | 'skipped' | 'streak' | 'priority-high' | 'priority-med' | 'priority-low'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const badgeStyles: Record<BadgeVariant, string> = {
  default:         'bg-surface2 text-[var(--text-secondary)] border border-[var(--border-subtle)]',
  brand:           'bg-brand-100 text-brand-700',
  done:            'bg-[var(--color-done-bg)] text-[var(--color-done)]',
  partial:         'bg-[var(--color-partial-bg)] text-[var(--color-partial)]',
  overdue:         'bg-[var(--color-overdue-bg)] text-[var(--color-overdue)]',
  skipped:         'bg-[var(--color-skipped-bg)] text-[var(--color-skipped)]',
  streak:          'bg-[var(--color-streak-bg)] text-[var(--color-streak)]',
  'priority-high': 'bg-[var(--color-overdue-bg)] text-[var(--color-overdue)]',
  'priority-med':  'bg-[var(--color-partial-bg)] text-[var(--color-partial)]',
  'priority-low':  'bg-surface2 text-[var(--text-tertiary)]',
}

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5',
      'text-xs font-semibold font-sans rounded-full',
      'whitespace-nowrap select-none',
      badgeStyles[variant],
      className,
    )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
