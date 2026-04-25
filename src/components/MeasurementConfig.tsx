import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { MeasurementType } from '@/types'

interface Props {
  measurementType: MeasurementType
  register: UseFormRegister<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
}

export function MeasurementConfig({ measurementType, register, errors }: Props) {
  if (measurementType === 'checkbox' || measurementType === 'rating') return null

  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="block font-sans font-bold text-[12px] text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
          Target
        </label>
        <input
          type="number"
          min={1}
          step={1}
          placeholder="e.g. 8"
          {...register('target', { valueAsNumber: true })}
          className="w-full h-11 rounded-xl px-3.5 font-sans font-semibold text-[15px] text-[var(--text-primary)] bg-surface border border-[var(--border-subtle)] outline-none focus:border-[var(--color-brand-500)] transition-colors"
        />
        {'target' in errors && (
          <p className="text-[11px] text-[var(--color-overdue)] mt-1">{String(errors.target?.message ?? '')}</p>
        )}
      </div>
      <div className="flex-1">
        <label className="block font-sans font-bold text-[12px] text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
          Unit
        </label>
        <input
          type="text"
          placeholder={measurementType === 'duration' ? 'min' : 'e.g. glasses'}
          {...register('unit')}
          className="w-full h-11 rounded-xl px-3.5 font-sans font-semibold text-[15px] text-[var(--text-primary)] bg-surface border border-[var(--border-subtle)] outline-none focus:border-[var(--color-brand-500)] transition-colors"
        />
      </div>
    </div>
  )
}
