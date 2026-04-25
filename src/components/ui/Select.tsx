import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label, hint, error, options, placeholder, className, ...props
}, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-semibold text-[var(--text-primary)] font-sans select-none">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none font-body text-base text-[var(--text-primary)]',
          'bg-surface border border-[var(--border-default)]',
          'rounded-lg px-3 py-2.5 h-11 pr-9',
          'transition-[border-color,box-shadow] duration-[120ms]',
          'outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          error && 'border-[var(--color-overdue)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
      />
    </div>
    {(hint || error) && (
      <p className={cn('text-xs', error ? 'text-[var(--color-overdue)]' : 'text-[var(--text-tertiary)]')}>
        {error ?? hint}
      </p>
    )}
  </div>
))
Select.displayName = 'Select'
