import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  interactive?: boolean
  accent?: string
  onClick?: () => void
}

export function Card({ children, className, interactive, accent, onClick }: CardProps) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      onClick={onClick}
      className={cn(
        'relative w-full bg-surface rounded-lg shadow-card',
        'border border-[var(--border-subtle)]',
        'overflow-hidden text-left',
        interactive && [
          'cursor-pointer',
          'transition-[transform,box-shadow] duration-[120ms]',
          'hover:shadow-md hover:-translate-y-px',
          'active:scale-[0.99] active:shadow-xs',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        ],
        className,
      )}
    >
      {accent && (
        <span
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: accent }}
        />
      )}
      <div className={cn(accent && 'pl-4')}>
        {children}
      </div>
    </Tag>
  )
}
