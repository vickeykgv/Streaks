import { Gauge } from 'lucide-react'
import { openMotoEditor } from '@/store/motoEditor'
import type { MotoVehicle } from '@/types/moto'

const VEHICLE_TYPE_EMOJI: Record<string, string> = {
  bike: '🏍️', car: '🚗', scooter: '🛵', other: '🚐',
}

const FUEL_TYPE_LABEL: Record<string, string> = {
  petrol: 'Petrol', diesel: 'Diesel', cng: 'CNG', electric: 'Electric', hybrid: 'Hybrid',
}

interface Props { vehicle: MotoVehicle }

export function VehicleSnapshotCard({ vehicle }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl px-5 py-5 mb-4"
      style={{ background: `linear-gradient(135deg, ${vehicle.color}22 0%, var(--bg-surface-2) 100%)`, border: `1.5px solid ${vehicle.color}44` }}
    >
      {/* colour accent bar */}
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-3xl" style={{ background: vehicle.color }} />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[32px]">{VEHICLE_TYPE_EMOJI[vehicle.vehicleType] ?? '🚗'}</span>
          <div>
            <div className="font-sans text-[18px] font-extrabold text-[var(--text-primary)]">{vehicle.name}</div>
            <div className="font-body text-[13px] text-[var(--text-secondary)]">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </div>
            {vehicle.registrationNo && (
              <div className="mt-0.5 inline-block rounded-lg bg-[var(--bg-surface-3)] px-2 py-0.5 font-sans text-[11px] font-bold tracking-widest text-[var(--text-secondary)]">
                {vehicle.registrationNo}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => openMotoEditor({ kind: 'vehicle', id: vehicle.id })}
          className="rounded-xl bg-[var(--bg-surface-3)] px-3 py-1.5 font-sans text-[12px] font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          Edit
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Gauge size={16} color={vehicle.color} strokeWidth={2.2} />
        <span className="font-sans text-[22px] font-extrabold text-[var(--text-primary)]">
          {vehicle.currentOdoKm.toLocaleString()}
        </span>
        <span className="font-body text-[13px] text-[var(--text-tertiary)]">km</span>
        <span
          className="ml-auto rounded-xl px-2 py-0.5 font-sans text-[11px] font-bold"
          style={{ background: `${vehicle.color}22`, color: vehicle.color }}
        >
          {FUEL_TYPE_LABEL[vehicle.fuelType] ?? vehicle.fuelType}
        </span>
      </div>
    </div>
  )
}
