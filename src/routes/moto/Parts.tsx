import { useLiveQuery } from 'dexie-react-hooks'
import { Cog } from 'lucide-react'
import { useMoto } from '@/store/moto'
import { partsRepo } from '@/db/repos/moto/parts'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { openMotoEditor } from '@/store/motoEditor'
import { getPartDueStatus, type DueStatus } from '@/lib/moto/partsLife'
import { VehicleSwitcher } from '@/components/moto/VehicleSwitcher'
import { EmptyState } from '@/components/ui'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import { ActionDropdown } from '@/components/ActionDropdown'
import { useMotoActions } from '@/hooks/useMotoActions'
import { format, parseISO } from 'date-fns'
import type { MotoPart } from '@/types/moto'

function DueBadge({ status }: { status: DueStatus }) {
  if (status === 'ok') return null

  const bg = status === 'overdue' ? 'rgba(229,9,20,0.1)' : 'rgba(251,146,60,0.12)'
  const color = status === 'overdue' ? 'var(--color-brand-500)' : '#f97316'
  const label = status === 'overdue' ? 'Overdue' : 'Due soon'

  return (
    <span className="shrink-0 rounded-xl px-2 py-0.5 font-sans text-[10px] font-bold"
      style={{ background: bg, color }}>
      {label}
    </span>
  )
}

function PartCard({ part, currentOdoKm }: { part: MotoPart; currentOdoKm: number }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const dueStatus = getPartDueStatus(part, currentOdoKm, today)

  return (
    <button
      onClick={() => openMotoEditor({ kind: 'part', id: part.id, vehicleId: part.vehicleId })}
      className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
      style={{ background: 'var(--bg-surface-1)' }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[18px]"
        style={{ background: 'var(--bg-surface-2)' }}>
        ⚙️
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-[14px] font-bold text-[var(--text-primary)] truncate">
            {part.partName}
          </span>
          <DueBadge status={dueStatus} />
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {part.brand && (
            <span className="font-body text-[12px] text-[var(--text-secondary)]">{part.brand}</span>
          )}
          {part.brand && <span className="text-[var(--text-tertiary)]">·</span>}
          <span className="font-body text-[12px] text-[var(--text-secondary)]">
            {format(parseISO(part.installedAt), 'd MMM yyyy')}
          </span>
          <span className="text-[var(--text-tertiary)]">·</span>
          <span className="font-body text-[12px] text-[var(--text-secondary)]">
            {part.odoKmAtInstall.toLocaleString()} km
          </span>
        </div>
        {(part.expectedLifeKm || part.expectedLifeMonths) && (
          <div className="mt-1 font-body text-[11px] text-[var(--text-tertiary)]">
            Life:
            {part.expectedLifeKm && ` ${part.expectedLifeKm.toLocaleString()} km`}
            {part.expectedLifeKm && part.expectedLifeMonths && ' /'}
            {part.expectedLifeMonths && ` ${part.expectedLifeMonths} mo`}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="font-sans text-[14px] font-bold text-[var(--text-primary)]">
          ₹{part.cost.toLocaleString()}
        </div>
      </div>
    </button>
  )
}

export default function MotoParts() {
  const { activeVehicleId } = useMoto()
  const motoActions = useMotoActions('part')

  const parts = useLiveQuery(
    () => activeVehicleId ? partsRepo.getAllForVehicle(activeVehicleId) : Promise.resolve([]),
    [activeVehicleId],
  ) ?? []

  const vehicle = useLiveQuery(
    () => activeVehicleId ? vehiclesRepo.getById(activeVehicleId) : Promise.resolve(undefined),
    [activeVehicleId],
  )

  const currentOdoKm = vehicle?.currentOdoKm ?? 0

  return (
    <div className="min-h-screen bg-app">
      <DesktopPageHeader action={<ActionDropdown items={motoActions} />} />
      <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-28">
      <VehicleSwitcher />

      {!activeVehicleId && (
        <EmptyState
          icon={<Cog size={20} strokeWidth={1.8} />}
          headline="No vehicle selected"
          subheadline="Select or add a vehicle above to view its spare parts."
        />
      )}

      {activeVehicleId && parts.length === 0 && (
        <EmptyState
          icon={<Cog size={20} strokeWidth={1.8} />}
          headline="No parts logged yet"
          subheadline="Tap + to track a spare part replacement and its expected life."
        />
      )}

      {activeVehicleId && parts.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {parts.map(p => (
            <PartCard key={p.id} part={p} currentOdoKm={currentOdoKm} />
          ))}
        </div>
      )}

      </div>
    </div>
  )
}
