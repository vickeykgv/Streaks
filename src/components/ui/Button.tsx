import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:   'text-[var(--text-on-brand)] shadow-[var(--shadow-glow)] hover:brightness-105 active:brightness-95',
  secondary: 'bg-surface border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-surface2 active:bg-surface2 shadow-card',
  ghost:     'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-surface2 active:bg-surface2',
  danger:    'bg-[var(--color-overdue)] text-white hover:opacity-90 active:opacity-80',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8  px-3  text-xs  gap-1.5 rounded-md',
  md: 'h-10 px-4  text-sm  gap-2   rounded-lg',
  lg: 'h-12 px-6  text-base gap-2.5 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-sans font-semibold',
        'select-none outline-none cursor-pointer',
        'transition-all duration-[120ms]',
        'active:scale-[0.97]',
        'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-app)]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variant === 'primary' && 'bg-[var(--color-brand-500)]',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner size={size === 'sm' ? 'xs' : 'sm'} />
      ) : (
        <>
          {icon && iconPosition === 'left'  && <span className="shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  )
})
Button.displayName = 'Button'
