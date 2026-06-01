import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { vehicleSchema, type VehicleFormValues } from '@/lib/schemas/moto'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { useMoto } from '@/store/moto'
import { toast } from '@/store/toastStore'
import { ConfirmDialog } from '@/components/ui'
import { ColorPicker } from '@/components/ColorPicker'
import type { VehicleType, FuelType } from '@/types/moto'

const VEHICLE_TYPES: { value: VehicleType; label: string; emoji: string }[] = [
  { value: 'bike',    label: 'Bike',    emoji: '🏍️' },
  { value: 'car',     label: 'Car',     emoji: '🚗' },
  { value: 'scooter', label: 'Scooter', emoji: '🛵' },
  { value: 'other',   label: 'Other',   emoji: '🚐' },
]

const FUEL_TYPES: { value: FuelType; label: string; emoji: string }[] = [
  { value: 'petrol',   label: 'Petrol',   emoji: '⛽' },
  { value: 'diesel',   label: 'Diesel',   emoji: '🛢️' },
  { value: 'cng',      label: 'CNG',      emoji: '💨' },
  { value: 'electric', label: 'Electric', emoji: '⚡' },
  { value: 'hybrid',   label: 'Hybrid',   emoji: '🔋' },
]

const inputCls = 'h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3.5 font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-sans text-[12px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-[var(--color-overdue)]">{error}</p>}
    </div>
  )
}

interface VehicleEditorProps {
  id?: string
  onClose?: () => void
  onSaved?: () => void
}

export function VehicleEditor({ id, onClose, onSaved }: VehicleEditorProps) {
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [showDelete, setShowDelete] = useState(false)
  const { setActiveVehicle } = useMoto()

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: '', make: '', model: '', year: new Date().getFullYear(),
      registrationNo: '', vehicleType: 'bike', fuelType: 'petrol',
      currentOdoKm: 0, color: '#e50914',
    },
  })

  const vehicleType = watch('vehicleType')
  const fuelType    = watch('fuelType')

  useEffect(() => {
    if (!isEdit) return
    vehiclesRepo.getById(id).then(v => {
      if (!v) { onClose?.(); return }
      reset({
        name: v.name, make: v.make, model: v.model, year: v.year,
        registrationNo: v.registrationNo, vehicleType: v.vehicleType,
        fuelType: v.fuelType, currentOdoKm: v.currentOdoKm,
        tankCapacityL: v.tankCapacityL, purchaseDate: v.purchaseDate,
        color: v.color,
      })
      setLoading(false)
    })
  }, [id, isEdit, onClose, reset])

  const done = () => { onSaved?.(); onClose?.() }

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      const payload = {
        name:           data.name,
        make:           data.make,
        model:          data.model,
        year:           data.year,
        registrationNo: data.registrationNo ?? '',
        vehicleType:    data.vehicleType,
        fuelType:       data.fuelType,
        currentOdoKm:  data.currentOdoKm,
        tankCapacityL:  data.tankCapacityL,
        purchaseDate:   data.purchaseDate,
        color:          data.color,
        archived:       false as const,
      }
      if (isEdit) {
        await vehiclesRepo.update(id, payload)
        toast.success('Vehicle updated')
      } else {
        const v = await vehiclesRepo.create(payload)
        setActiveVehicle(v.id)
        toast.success('Vehicle added')
      }
      done()
    } catch {
      toast.error('Failed to save vehicle')
    }
  }

  const handleArchive = async () => {
    if (!id) return
    await vehiclesRepo.archive(id)
    toast.info('Vehicle archived', {
      label: 'Undo',
      onClick: () => vehiclesRepo.restore(id),
    })
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

        {/* Nickname */}
        <Field label="Nickname" error={errors.name?.message}>
          <input {...register('name')} className={inputCls} placeholder="e.g. My Honda" autoFocus />
        </Field>

        {/* Color */}
        <Field label="Color">
          <Controller
            control={control}
            name="color"
            render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
          />
        </Field>

        {/* Make / Model / Year */}
        <div className="grid grid-cols-3 gap-2">
          <Field label="Make" error={errors.make?.message}>
            <input {...register('make')} className={inputCls} placeholder="Honda" />
          </Field>
          <Field label="Model" error={errors.model?.message}>
            <input {...register('model')} className={inputCls} placeholder="CB350" />
          </Field>
          <Field label="Year" error={errors.year?.message}>
            <input type="number" {...register('year')} className={inputCls} placeholder="2022" />
          </Field>
        </div>

        {/* Vehicle type */}
        <Field label="Type">
          <div className="grid grid-cols-4 gap-2">
            {VEHICLE_TYPES.map(({ value, label, emoji }) => {
              const on = vehicleType === value
              return (
                <button
                  key={value} type="button"
                  onClick={() => setValue('vehicleType', value, { shouldValidate: true })}
                  className="flex flex-col items-center gap-1.5 rounded-2xl py-2.5 transition-all"
                  style={{
                    background: on ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                    border: on ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <span className="text-[22px]">{emoji}</span>
                  <span className="font-sans text-[10px] font-bold" style={{ color: on ? '#fff' : 'var(--text-secondary)' }}>{label}</span>
                </button>
              )
            })}
          </div>
        </Field>

        {/* Fuel type */}
        <Field label="Fuel">
          <div className="grid grid-cols-5 gap-1.5">
            {FUEL_TYPES.map(({ value, label, emoji }) => {
              const on = fuelType === value
              return (
                <button
                  key={value} type="button"
                  onClick={() => setValue('fuelType', value, { shouldValidate: true })}
                  className="flex flex-col items-center gap-1.5 rounded-2xl py-2.5 transition-all"
                  style={{
                    background: on ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                    border: on ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <span className="text-[18px]">{emoji}</span>
                  <span className="font-sans text-[9px] font-bold" style={{ color: on ? '#fff' : 'var(--text-secondary)' }}>{label}</span>
                </button>
              )
            })}
          </div>
        </Field>

        {/* Registration + Current Odo */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Registration No.">
            <input {...register('registrationNo')} className={inputCls} placeholder="MH01AB1234" />
          </Field>
          <Field label="Odometer (km)" error={errors.currentOdoKm?.message}>
            <input type="number" {...register('currentOdoKm')} className={inputCls} placeholder="0" />
          </Field>
        </div>

        {/* Tank + Purchase date (optional) */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Tank capacity (L) — optional">
            <input type="number" step="0.1" {...register('tankCapacityL')} className={inputCls} placeholder="e.g. 14.5" />
          </Field>
          <Field label="Purchase date — optional">
            <Controller
              control={control}
              name="purchaseDate"
              render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" />}
            />
          </Field>
        </div>

        {/* Archive */}
        {isEdit && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-overdue)] py-3 font-sans text-[14px] font-bold text-[var(--color-overdue)]"
          >
            <Trash2 size={15} strokeWidth={2.4} />
            Archive vehicle
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)] disabled:opacity-60"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)', height: '52px' }}
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add vehicle'}
        </button>
      </form>

      <ConfirmDialog
        open={showDelete}
        title="Archive vehicle?"
        description="The vehicle will be hidden. All logs and records are preserved."
        confirmLabel="Archive"
        onConfirm={handleArchive}
        onClose={() => setShowDelete(false)}
        danger
      />
    </div>
  )
}
