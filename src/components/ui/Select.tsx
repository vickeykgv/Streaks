import * as RSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  options: readonly SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  ariaLabel?: string
  name?: string
}

export function Select({
  value,
  defaultValue,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  triggerClassName,
  ariaLabel,
  name,
}: SelectProps) {
  return (
    <RSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onChange}
      disabled={disabled}
      name={name}
    >
      <RSelect.Trigger
        aria-label={ariaLabel}
        className={cn(
          'inline-flex w-full items-center justify-between gap-2 rounded-xl px-3.5 h-11',
          'font-sans text-[14px] font-semibold',
          'transition-[border-color,box-shadow] duration-150 outline-none',
          'focus:ring-2 focus:ring-[var(--color-brand-500)]/30 focus:border-[var(--color-brand-500)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'data-[placeholder]:text-[var(--text-tertiary)]',
          className,
          triggerClassName,
        )}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        <RSelect.Value placeholder={placeholder ?? 'Select…'} />
        <RSelect.Icon>
          <ChevronDown size={16} className="text-[var(--text-tertiary)]" />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          className="z-[var(--z-modal)] overflow-hidden rounded-2xl animate-zoom-in-95"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
            minWidth: 'var(--radix-select-trigger-width)',
            maxHeight: '320px',
          }}
        >
          <RSelect.Viewport className="p-1.5">
            {options.map(opt => (
              <RSelect.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'relative flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer outline-none select-none',
                  'font-sans text-[14px] font-semibold text-[var(--text-primary)]',
                  'data-[highlighted]:bg-[var(--bg-surface-2)]',
                  'data-[state=checked]:text-[var(--color-brand-500)]',
                )}
              >
                <RSelect.ItemIndicator className="absolute right-3 inline-flex">
                  <Check size={14} strokeWidth={3} />
                </RSelect.ItemIndicator>
                <RSelect.ItemText>{opt.label}</RSelect.ItemText>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  )
}
