import { forwardRef } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label, description, className, ...props
}, ref) => (
  <label className="flex items-start gap-3 cursor-pointer group select-none">
    <div className="relative mt-0.5 shrink-0">
      <input ref={ref} type="checkbox" className="sr-only peer" {...props} />
      <div className={cn(
        'w-5 h-5 rounded-[5px] border-2 border-[var(--border-default)]',
        'transition-all duration-[120ms]',
        'peer-checked:bg-brand-500 peer-checked:border-brand-500',
        'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2',
        'group-hover:border-brand-400',
        className,
      )} />
      <Check
        size={13}
        strokeWidth={3}
        className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-[120ms]"
      />
    </div>
    {(label || description) && (
      <div className="flex flex-col gap-0.5">
        {label && <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>}
        {description && <span className="text-xs text-[var(--text-tertiary)]">{description}</span>}
      </div>
    )}
  </label>
))
Checkbox.displayName = 'Checkbox'
