import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Zap, Gauge } from 'lucide-react'
import { fuelLogSchema, type FuelLogFormValues } from '@/lib/schemas/moto'
import { fuelLogsRepo } from '@/db/repos/moto/fuelLogs'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { toast } from '@/store/toastStore'
import { ConfirmDialog, DatePicker } from '@/components/ui'
import { format } from 'date-fns'
import type { FuelType } from '@/types/moto'

const FUEL_TYPES: { value: FuelType; label: string; emoji: string }[] = [
  { value: 'petrol',   label: 'Petrol',   emoji: '⛽' },
  { value: 'diesel',   label: 'Diesel',   emoji: '🛢️' },
  { value: 'cng',      label: 'CNG',      emoji: '💨' },
  { value: 'electric', label: 'Electric', emoji: '⚡' },
  { value: 'hybrid',   label: 'Hybrid',   emoji: '🔋' },
]

// Field with optional right-aligned hint text
function Field({ label, hint, error, children }: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="font-sans text-[12px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
          {label}
        </label>
        {hint && (
          <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{hint}</span>
        )}
      </div>
      {children}
      {error && <p className="mt-1 text-[11px] text-[var(--color-overdue)]">{error}</p>}
    </div>
  )
}

// Group an integer string with Indian (en-IN) thousands separators, preserving
// the decimal portion exactly as typed (so "1234." and "12.50" survive).
function withCommas(cleaned: string): string {
  if (cleaned === '') return ''
  const dot = cleaned.indexOf('.')
  const intPart = dot === -1 ? cleaned : cleaned.slice(0, dot)
  const decPart = dot === -1 ? '' : cleaned.slice(dot + 1)
  const groupedInt = intPart === '' ? '' : Number(intPart).toLocaleString('en-IN')
  return dot === -1 ? groupedInt : `${groupedInt}.${decPart}`
}

// Format a numeric value for display (used when the value changes externally,
// e.g. auto-calculated total cost).
function formatValue(value: number | undefined, allowDecimal: boolean): string {
  if (value == null || Number.isNaN(value)) return ''
  return value.toLocaleString('en-IN', {
    maximumFractionDigits: allowDecimal ? 2 : 0,
  })
}

// Controlled numeric input with ₹/km/L affix and live comma grouping.
// Emits `number | undefined`, never NaN.
function NumberAffixInput({
  value, onChange, allowDecimal = true, prefix, suffix, ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number | undefined
  onChange: (v: number | undefined) => void
  allowDecimal?: boolean
  prefix?: string
  suffix?: string
}) {
  const [text, setText] = useState(() => formatValue(value, allowDecimal))
  const [focused, setFocused] = useState(false)

  // Re-sync display when the value is changed from outside (auto-calc, reset)
  // and the user isn't actively typing into this field.
  useEffect(() => {
    if (!focused) setText(formatValue(value, allowDecimal))
  }, [value, focused, allowDecimal])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let cleaned = e.target.value.replace(/,/g, '')
    if (!allowDecimal) cleaned = cleaned.replace(/\./g, '')
    // Allow only digits with an optional single decimal point
    if (cleaned !== '' && !/^\d*\.?\d*$/.test(cleaned)) return
    setText(withCommas(cleaned))
    if (cleaned === '' || cleaned === '.') { onChange(undefined); return }
    const num = Number(cleaned)
    onChange(Number.isNaN(num) ? undefined : num)
  }

  return (
    <div
      className="flex items-center h-11 rounded-xl overflow-hidden transition-colors focus-within:border-[var(--color-brand-500)]"
      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}
    >
      {prefix && (
        <span className="pl-3.5 shrink-0 font-mono text-[15px] text-[var(--text-tertiary)]">{prefix}</span>
      )}
      <input
        {...props}
        type="text"
        value={text}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 min-w-0 h-full bg-transparent font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none"
        style={{ paddingLeft: prefix ? '6px' : '14px', paddingRight: suffix ? '6px' : '14px' }}
      />
      {suffix && (
        <span className="pr-3.5 shrink-0 font-mono text-[15px] text-[var(--text-tertiary)]">{suffix}</span>
      )}
    </div>
  )
}

const plainInputCls = 'h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3.5 font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]'

interface FuelLogEditorProps {
  id?: string
  vehicleId: string
  onClose?: () => void
  onSaved?: () => void
}

export function FuelLogEditor({ id, vehicleId, onClose, onSaved }: FuelLogEditorProps) {
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)
  const [vehicleOdo, setVehicleOdo] = useState<number | null>(null)
  // Once the user manually overrides the total, stop auto-calculating it until
  // they change volume or price again.
  const [totalEdited, setTotalEdited] = useState(false)

  const {
    register, handleSubmit, control, watch, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      odoKm: undefined, litres: undefined, pricePerL: undefined, totalCost: undefined,
      fuelType: 'petrol', fullTank: true,
    },
  })

  const fuelType  = watch('fuelType')
  const fullTank  = watch('fullTank')
  const litres    = watch('litres')
  const pricePerL = watch('pricePerL')
  const odoKm     = watch('odoKm')

  // Auto-compute totalCost from litres × pricePerL until the user overrides it.
  useEffect(() => {
    if (!totalEdited && litres && pricePerL && litres > 0 && pricePerL > 0) {
      setValue('totalCost', parseFloat((litres * pricePerL).toFixed(2)))
    }
  }, [litres, pricePerL, totalEdited, setValue])

  useEffect(() => {
    if (!isEdit) {
      vehiclesRepo.getById(vehicleId).then(v => {
        if (v) {
          setValue('fuelType', v.fuelType)
          setValue('odoKm', v.currentOdoKm)
          setVehicleOdo(v.currentOdoKm)
        }
      })
      return
    }
    fuelLogsRepo.getById(id).then(l => {
      if (!l) { onClose?.(); return }
      reset({
        date: l.date, odoKm: l.odoKm, litres: l.litres, pricePerL: l.pricePerL,
        totalCost: l.totalCost, fuelType: l.fuelType, station: l.station ?? '',
        fullTank: l.fullTank, note: l.note ?? '',
      })
      setTotalEdited(true) // keep the saved total; don't recompute on load
      setLoading(false)
    })
  }, [id, isEdit, vehicleId, onClose, reset, setValue])

  // Live km/L estimate: only when odo > last known and litres > 0
  const distSinceLastFill = vehicleOdo !== null && odoKm > vehicleOdo ? odoKm - vehicleOdo : null
  const liveKmpl = distSinceLastFill !== null && litres > 0
    ? distSinceLastFill / litres
    : null

  const done = () => { onSaved?.(); onClose?.() }

  const onSubmit = async (data: FuelLogFormValues) => {
    try {
      const payload = {
        vehicleId,
        date:      data.date,
        odoKm:     data.odoKm,
        litres:    data.litres,
        pricePerL: data.pricePerL,
        totalCost: data.totalCost,
        fuelType:  data.fuelType,
        station:   data.station || undefined,
        fullTank:  data.fullTank,
        note:      data.note || undefined,
      }
      if (isEdit) {
        await fuelLogsRepo.update(id, payload)
        toast.success('Fuel fill updated')
      } else {
        await fuelLogsRepo.create(payload)
        toast.success('Fuel fill logged')
      }
      const vehicle = await vehiclesRepo.getById(vehicleId)
      if (vehicle && data.odoKm > vehicle.currentOdoKm) {
        await vehiclesRepo.update(vehicleId, { currentOdoKm: data.odoKm })
      }
      done()
    } catch {
      toast.error('Failed to save fuel fill')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await fuelLogsRepo.delete(id)
    toast.info('Fuel fill deleted')
    done()
  }

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
    </div>
  )

  return (
    <div className="overflow-y-auto px-5 pb-6 pt-2">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Date + Odometer */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="When" error={errors.date?.message}>
            <Controller
              control={control}
              name="date"
              render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
            />
          </Field>
          <Field
            label="Odometer"
            hint={vehicleOdo !== null ? `last: ${vehicleOdo.toLocaleString()} km` : undefined}
            error={errors.odoKm?.message}
          >
            <Controller
              control={control}
              name="odoKm"
              render={({ field }) => (
                <NumberAffixInput
                  value={field.value}
                  onChange={field.onChange}
                  allowDecimal={false}
                  inputMode="numeric"
                  suffix="km"
                  placeholder="0"
                />
              )}
            />
          </Field>
        </div>

        {/* Volume + per-litre price (drive the auto-calculated total) */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Volume" error={errors.litres?.message}>
            <Controller
              control={control}
              name="litres"
              render={({ field }) => (
                <NumberAffixInput
                  value={field.value}
                  onChange={(v) => { field.onChange(v); setTotalEdited(false) }}
                  inputMode="decimal"
                  suffix="L"
                  placeholder="0.0"
                />
              )}
            />
          </Field>
          <Field label="Price / litre" error={errors.pricePerL?.message}>
            <Controller
              control={control}
              name="pricePerL"
              render={({ field }) => (
                <NumberAffixInput
                  value={field.value}
                  onChange={(v) => { field.onChange(v); setTotalEdited(false) }}
                  inputMode="decimal"
                  prefix="₹"
                  suffix="/L"
                  placeholder="0.00"
                />
              )}
            />
          </Field>
        </div>

        {/* Total cost — auto-calculated, editable */}
        <Field
          label="Total cost"
          hint="auto = volume × price"
          error={errors.totalCost?.message}
        >
          <Controller
            control={control}
            name="totalCost"
            render={({ field }) => (
              <NumberAffixInput
                value={field.value}
                onChange={(v) => { field.onChange(v); setTotalEdited(true) }}
                inputMode="decimal"
                prefix="₹"
                placeholder="0"
              />
            )}
          />
        </Field>

        {/* Live km/L strip */}
        {liveKmpl !== null && (
          <div
            className="flex items-center gap-3 rounded-[13px] px-4 py-3"
            style={{
              background: 'color-mix(in srgb, var(--color-brand-500) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-brand-500) 30%, transparent)',
            }}
          >
            <Gauge size={18} color="var(--color-brand-500)" strokeWidth={1.8} className="shrink-0" />
            <div className="min-w-0">
              <span className="font-mono text-[17px] font-semibold text-[var(--text-primary)]">
                ≈ {liveKmpl.toFixed(1)} km/L
              </span>
              <span className="font-body text-[12.5px] text-[var(--text-secondary)] ml-2">
                over {distSinceLastFill!.toLocaleString()} km since last fill
              </span>
            </div>
          </div>
        )}

        {/* Fuel type */}
        <Field label="Fuel type">
          <div className="grid grid-cols-5 gap-1.5">
            {FUEL_TYPES.map(({ value, label, emoji }) => {
              const on = fuelType === value
              return (
                <button
                  key={value} type="button"
                  onClick={() => setValue('fuelType', value)}
                  className="flex flex-col items-center gap-1 rounded-2xl py-2 transition-all"
                  style={{
                    background: on ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                    border: on ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <span className="text-[18px]">{emoji}</span>
                  <span className="font-sans text-[9px] font-bold" style={{ color: on ? '#fff' : 'var(--text-secondary)' }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </Field>

        {/* Full tank toggle */}
        <div
          className="flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: 'var(--bg-surface-2)' }}
        >
          <div className="flex items-center gap-2">
            <Zap size={15} color="var(--color-brand-500)" strokeWidth={2.4} />
            <div>
              <div className="font-sans text-[13px] font-bold text-[var(--text-primary)]">Filled to the brim</div>
              <div className="font-body text-[11px] text-[var(--text-tertiary)]">Keeps the mileage maths honest</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setValue('fullTank', !fullTank)}
            className="relative h-7 w-12 rounded-full transition-colors"
            style={{ background: fullTank ? 'var(--color-brand-500)' : 'var(--bg-surface-3)' }}
          >
            <span
              className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
              style={{ transform: fullTank ? 'translateX(20px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        {/* Station */}
        <Field label="Station — optional">
          <input {...register('station')} className={plainInputCls} placeholder="e.g. HP, Indian Oil…" />
        </Field>

        {/* Note */}
        <Field label="Note — optional">
          <textarea
            {...register('note')} rows={2}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3.5 py-2.5 font-body text-[14px] text-[var(--text-primary)] outline-none resize-none focus:border-[var(--color-brand-500)]"
            placeholder="Any remarks…"
          />
        </Field>

        {isEdit && (
          <button
            type="button" onClick={() => setShowDelete(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-overdue)] py-3 font-sans text-[14px] font-bold text-[var(--color-overdue)]"
          >
            <Trash2 size={15} strokeWidth={2.4} /> Delete fill
          </button>
        )}

        <button
          type="submit" disabled={isSubmitting}
          className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)] disabled:opacity-60"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)', height: '52px' }}
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Save fill-up'}
        </button>
      </form>

      <ConfirmDialog
        open={showDelete} title="Delete fuel fill?"
        description="This fill will be permanently removed."
        confirmLabel="Delete" onConfirm={handleDelete}
        onClose={() => setShowDelete(false)} danger
      />
    </div>
  )
}
