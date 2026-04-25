import { DEFAULT_ICONS } from '@/lib/constants'

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DEFAULT_ICONS.map(icon => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange(icon)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[22px] transition-all active:scale-90"
          style={{
            background: value === icon ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
            border: value === icon ? 'none' : '1px solid var(--border-subtle)',
            boxShadow: value === icon ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
          }}
          aria-label={icon}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
