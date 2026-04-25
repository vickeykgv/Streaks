import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  hint,
  error,
  leftIcon,
  rightElement,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[var(--text-primary)] font-sans select-none"
        >
          {label}
          {props.required && <span className="text-[var(--color-overdue)] ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-[var(--text-tertiary)] pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full font-body text-base text-[var(--text-primary)]',
            'bg-surface border border-[var(--border-default)]',
            'rounded-lg px-3 py-2.5 h-11',
            'placeholder:text-[var(--text-tertiary)]',
            'transition-[border-color,box-shadow] duration-[120ms]',
            'outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
            error && 'border-[var(--color-overdue)] focus:border-[var(--color-overdue)] focus:ring-[var(--color-overdue)]/20',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface2',
            leftIcon     && 'pl-10',
            rightElement && 'pr-10',
            className,
          )}
          {...props}
        />

        {rightElement && (
          <span className="absolute right-3 text-[var(--text-tertiary)]">
            {rightElement}
          </span>
        )}
      </div>

      {(hint || error) && (
        <p className={cn(
          'text-xs',
          error ? 'text-[var(--color-overdue)]' : 'text-[var(--text-tertiary)]'
        )}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
})
Input.displayName = 'Input'
