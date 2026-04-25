import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(({
  label, description, className, ...props
}, ref) => (
  <label className="flex items-center justify-between gap-4 cursor-pointer select-none group">
    {(label || description) && (
      <div className="flex flex-col gap-0.5">
        {label && <span className="text-sm font-semibold text-[var(--text-primary)] font-sans">{label}</span>}
        {description && <span className="text-xs text-[var(--text-tertiary)] font-body">{description}</span>}
      </div>
    )}
    <div className="relative shrink-0">
      <input ref={ref} type="checkbox" className="sr-only peer" {...props} />
      <div className={cn(
        'w-11 h-6 rounded-full border-2 border-transparent',
        'bg-[var(--border-default)]',
        'peer-checked:bg-brand-500',
        'transition-colors duration-[200ms]',
        'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2',
        className,
      )} />
      <div className={cn(
        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm',
        'transition-transform duration-[200ms] ease-[var(--ease-spring)]',
        'peer-checked:translate-x-5',
      )} />
    </div>
  </label>
))
Toggle.displayName = 'Toggle'
