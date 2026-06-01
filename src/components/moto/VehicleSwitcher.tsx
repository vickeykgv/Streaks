import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { useMoto } from '@/store/moto'
import { openMotoEditor } from '@/store/motoEditor'
import { cn } from '@/lib/utils'

const VEHICLE_TYPE_EMOJI: Record<string, string> = {
  bike: '🏍️', car: '🚗', scooter: '🛵', other: '🚐',
}

export function VehicleSwitcher() {
  const vehicles = useLiveQuery(() => vehiclesRepo.getAll(), []) ?? []
  const { activeVehicleId, setActiveVehicle } = useMoto()

  if (vehicles.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
      {vehicles.map(v => {
        const active = v.id === activeVehicleId
        return (
          <button
            key={v.id}
            onClick={() => setActiveVehicle(v.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 transition-all font-sans text-[12px] font-bold',
              active
                ? 'text-white shadow-[0_2px_8px_rgba(229,9,20,0.35)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
            style={{
              background: active ? v.color || 'var(--color-brand-500)' : 'var(--bg-surface-2)',
              border: active ? 'none' : '1px solid var(--border-subtle)',
            }}
          >
            <span className="text-[14px]">{VEHICLE_TYPE_EMOJI[v.vehicleType] ?? '🚗'}</span>
            <span>{v.name}</span>
          </button>
        )
      })}
      <button
        onClick={() => openMotoEditor({ kind: 'vehicle' })}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
        style={{ border: '1px solid var(--border-subtle)' }}
        aria-label="Add vehicle"
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}
