import { forwardRef, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  autoGrow?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, hint, error, autoGrow = true, className, ...props
}, ref) => {
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const el = (ref as React.RefObject<HTMLTextAreaElement>) ?? internalRef

  useEffect(() => {
    if (!autoGrow || !el.current) return
    el.current.style.height = 'auto'
    el.current.style.height = el.current.scrollHeight + 'px'
  }, [props.value, autoGrow, el])

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-[var(--text-primary)] font-sans select-none">
          {label}
        </label>
      )}
      <textarea
        ref={el}
        rows={3}
        className={cn(
          'w-full font-body text-base text-[var(--text-primary)]',
          'bg-surface border border-[var(--border-default)]',
          'rounded-lg px-3 py-2.5 resize-none overflow-hidden',
          'placeholder:text-[var(--text-tertiary)]',
          'transition-[border-color,box-shadow] duration-[120ms]',
          'outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          error && 'border-[var(--color-overdue)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
      {(hint || error) && (
        <p className={cn('text-xs', error ? 'text-[var(--color-overdue)]' : 'text-[var(--text-tertiary)]')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
})
Textarea.displayName = 'Textarea'
