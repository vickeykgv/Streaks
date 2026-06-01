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
    <div className="overflow-x-auto px-4 pb-3 scrollbar-none">
      {/* Connected segmented control — one contained track, left-aligned */}
      <div
        className="inline-flex items-center gap-1 rounded-2xl p-1"
        style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}
      >
        {vehicles.map(v => {
          const active = v.id === activeVehicleId
          return (
            <button
              key={v.id}
              onClick={() => setActiveVehicle(v.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all font-sans text-[12px] font-bold',
                active
                  ? 'text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
              style={active ? { background: v.color || 'var(--color-brand-500)' } : undefined}
            >
              <span className="text-[14px]">{VEHICLE_TYPE_EMOJI[v.vehicleType] ?? '🚗'}</span>
              <span>{v.name}</span>
            </button>
          )
        })}

        {/* Divider + add button, inside the same track */}
        <div className="mx-0.5 h-5 w-px shrink-0" style={{ background: 'var(--border-subtle)' }} />
        <button
          onClick={() => openMotoEditor({ kind: 'vehicle' })}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-1)] hover:text-[var(--text-primary)]"
          aria-label="Add vehicle"
        >
          <Plus size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
