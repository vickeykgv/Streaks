import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Pencil } from 'lucide-react'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { useMoto } from '@/store/moto'
import { openMotoEditor } from '@/store/motoEditor'
import { EmptyState } from '@/components/ui'
import { VehicleSwitcher } from '@/components/moto/VehicleSwitcher'
import { cn } from '@/lib/utils'

const VEHICLE_TYPE_EMOJI: Record<string, string> = {
  bike: '🏍️', car: '🚗', scooter: '🛵', other: '🚐',
}

const FUEL_TYPE_LABEL: Record<string, string> = {
  petrol: 'Petrol', diesel: 'Diesel', cng: 'CNG', electric: 'Electric', hybrid: 'Hybrid',
}

export default function MotoVehicles() {
  const vehicles = useLiveQuery(() => vehiclesRepo.getAll(), []) ?? []
  const { activeVehicleId } = useMoto()

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg-app)' }}>
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="px-4 pt-5 pb-2">
          <div className="section-kicker mb-1">Moto</div>
          <h1 className="font-sans text-[28px] font-extrabold tracking-tight text-[var(--text-primary)]">Garage</h1>
          <p className="mt-0.5 font-body text-[13px] text-[var(--text-secondary)]">
            Your vehicles — tap a card to edit, or add a new one.
          </p>
        </div>

        {/* Vehicle switcher */}
        <div className="pt-2">
          <VehicleSwitcher />
        </div>

        {/* Vehicle list */}
        {vehicles.length === 0 ? (
          <div className="px-4">
            <div className="glass-panel rounded-[28px] overflow-hidden">
              <EmptyState
                icon={<span className="text-[28px]">🏍️</span>}
                headline="No vehicles yet"
                subheadline="Add your first vehicle to start logging fuel, services, and more."
                action={{ label: 'Add vehicle', onClick: () => openMotoEditor({ kind: 'vehicle' }) }}
                hero
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4">
            {vehicles.map(v => {
              const isActive = v.id === activeVehicleId
              return (
                <div
                  key={v.id}
                  className={cn(
                    'glass-panel rounded-[24px] p-4 transition-all',
                    isActive && 'ring-2 ring-[var(--color-brand-500)]',
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Color + emoji icon */}
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[26px]"
                      style={{ background: v.color ? `${v.color}22` : 'var(--bg-surface-2)', border: `2px solid ${v.color || 'var(--border-subtle)'}` }}
                    >
                      {VEHICLE_TYPE_EMOJI[v.vehicleType] ?? '🚗'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[16px] font-extrabold text-[var(--text-primary)] truncate">{v.name}</span>
                        {isActive && (
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-bold text-white"
                            style={{ background: 'var(--color-brand-500)' }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 font-body text-[13px] text-[var(--text-secondary)]">
                        {v.make} {v.model} · {v.year}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {v.registrationNo && (
                          <span className="rounded-lg px-2 py-0.5 font-sans text-[11px] font-bold text-[var(--text-secondary)]"
                            style={{ background: 'var(--bg-surface-2)' }}>
                            {v.registrationNo}
                          </span>
                        )}
                        <span className="rounded-lg px-2 py-0.5 font-sans text-[11px] font-bold text-[var(--text-secondary)]"
                          style={{ background: 'var(--bg-surface-2)' }}>
                          {FUEL_TYPE_LABEL[v.fuelType]}
                        </span>
                        <span className="rounded-lg px-2 py-0.5 font-sans text-[11px] font-bold text-[var(--text-secondary)]"
                          style={{ background: 'var(--bg-surface-2)' }}>
                          {v.currentOdoKm.toLocaleString()} km
                        </span>
                      </div>
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => openMotoEditor({ kind: 'vehicle', id: v.id })}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Pencil size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => openMotoEditor({ kind: 'vehicle' })}
        className="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 lg:bottom-6"
        style={{ background: 'var(--color-brand-500)', boxShadow: '0 4px 20px rgba(229,9,20,0.45)' }}
        aria-label="Add vehicle"
      >
        <Plus size={22} strokeWidth={2.5} color="#fff" />
      </button>
    </div>
  )
}
