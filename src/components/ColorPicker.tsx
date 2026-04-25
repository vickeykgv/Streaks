import { Check } from 'lucide-react'
import { DEFAULT_COLORS } from '@/lib/constants'

interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {DEFAULT_COLORS.map(hex => (
        <button
          key={hex}
          type="button"
          onClick={() => onChange(hex)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90"
          style={{ background: hex, boxShadow: value === hex ? `0 0 0 3px ${hex}44, 0 0 0 2px var(--bg-base)` : 'none' }}
          aria-label={hex}
        >
          {value === hex && <Check size={14} color="#fff" strokeWidth={3} />}
        </button>
      ))}
    </div>
  )
}
