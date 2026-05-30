import { useLiveQuery } from 'dexie-react-hooks'
import { ExternalLink, Pencil, PlusCircle, Trash2 } from 'lucide-react'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { vehicleDocsRepo } from '@/db/repos/moto/vehicleDocs'
import { maintenanceItemsRepo } from '@/db/repos/moto/maintenanceItems'
import { useMoto } from '@/store/moto'
import { openMotoEditor } from '@/store/motoEditor'
import { EmptyState, ConfirmDialog } from '@/components/ui'
import { VehicleSwitcher } from '@/components/moto/VehicleSwitcher'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import { ActionDropdown } from '@/components/ActionDropdown'
import { useMotoActions } from '@/hooks/useMotoActions'
import { cn } from '@/lib/utils'
import { format, parseISO, differenceInDays } from 'date-fns'
import type { MotoVehicle, MotoVehicleDoc, MotoMaintenanceItem } from '@/types/moto'
import { useState } from 'react'
import { toast } from '@/store/toastStore'

const VEHICLE_TYPE_EMOJI: Record<string, string> = {
  bike: '🏍️', car: '🚗', scooter: '🛵', other: '🚐',
}

const FUEL_TYPE_LABEL: Record<string, string> = {
  petrol: 'Petrol', diesel: 'Diesel', cng: 'CNG', electric: 'Electric', hybrid: 'Hybrid',
}

function docValidityStatus(validUntil: string | undefined): { label: string; color: string } {
  if (!validUntil) return { label: 'No expiry', color: 'var(--text-tertiary)' }
  const days = differenceInDays(parseISO(validUntil), new Date())
  if (days < 0)   return { label: `Expired ${Math.abs(days)}d ago`, color: 'var(--color-overdue)' }
  if (days < 30)  return { label: `Expires in ${days}d`, color: '#f97316' }
  return { label: `Valid until ${format(parseISO(validUntil), 'd MMM yyyy')}`, color: '#16a34a' }
}

function VehicleDocRow({ doc }: { doc: MotoVehicleDoc }) {
  const { label, color } = docValidityStatus(doc.validUntil)
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--bg-surface-2)] cursor-pointer"
      onClick={() => openMotoEditor({ kind: 'vehicleDoc', id: doc.id, vehicleId: doc.vehicleId })}
    >
      <span className="text-[18px]">📄</span>
      <div className="flex-1 min-w-0">
        <div className="font-sans text-[13px] font-bold text-[var(--text-primary)] truncate">{doc.name}</div>
        <div className="font-body text-[11px]" style={{ color }}>{label}</div>
      </div>
      {doc.imageUrl && (
        <a
          href={doc.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--color-brand-500)]"
          title="Open image/scan"
        >
          <ExternalLink size={13} strokeWidth={2.2} />
        </a>
      )}
    </div>
  )
}

function MaintenanceRow({ item }: { item: MotoMaintenanceItem }) {
  const [showDelete, setShowDelete] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await maintenanceItemsRepo.toggle(item.id, !item.checked)
  }

  const handleDelete = async () => {
    await maintenanceItemsRepo.delete(item.id)
    toast.info('Item removed')
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 group">
        <button
          onClick={handleToggle}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all"
          style={{
            borderColor: item.checked ? 'var(--color-brand-500)' : 'var(--border-subtle)',
            background:  item.checked ? 'var(--color-brand-500)' : 'transparent',
          }}
        >
          {item.checked && <span className="text-white text-[11px] font-bold leading-none">✓</span>}
        </button>

        <span
          className={cn(
            'flex-1 font-body text-[13px] cursor-pointer',
            item.checked ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]',
          )}
          onClick={() => openMotoEditor({ kind: 'maintenanceItem', id: item.id, vehicleId: item.vehicleId })}
        >
          {item.title}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); setShowDelete(true) }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-overdue)] transition-all"
        >
          <Trash2 size={13} strokeWidth={2.2} />
        </button>
      </div>

      <ConfirmDialog
        open={showDelete} title="Remove item?"
        description="This item will be removed from the maintenance checklist."
        confirmLabel="Remove" onConfirm={handleDelete}
        onClose={() => setShowDelete(false)} danger
      />
    </>
  )
}

function VehicleCard({ vehicle, isActive }: { vehicle: MotoVehicle; isActive: boolean }) {
  const docs = useLiveQuery(
    () => vehicleDocsRepo.getAllForVehicle(vehicle.id),
    [vehicle.id],
  ) ?? []

  const maintenanceItems = useLiveQuery(
    () => maintenanceItemsRepo.getAllForVehicle(vehicle.id),
    [vehicle.id],
  ) ?? []

  const openItems   = maintenanceItems.filter(i => !i.checked)
  const closedItems = maintenanceItems.filter(i => i.checked)

  return (
    <div
      className={cn(
        'glass-panel rounded-[24px] overflow-hidden transition-all',
        isActive && 'ring-2 ring-[var(--color-brand-500)]',
      )}
    >
      {/* Vehicle summary row */}
      <div className="flex items-start gap-4 p-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[26px]"
          style={{ background: vehicle.color ? `${vehicle.color}22` : 'var(--bg-surface-2)', border: `2px solid ${vehicle.color || 'var(--border-subtle)'}` }}
        >
          {VEHICLE_TYPE_EMOJI[vehicle.vehicleType] ?? '🚗'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[16px] font-extrabold text-[var(--text-primary)] truncate">{vehicle.name}</span>
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
            {vehicle.make} {vehicle.model} · {vehicle.year}
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {vehicle.registrationNo && (
              <span className="rounded-lg px-2 py-0.5 font-sans text-[11px] font-bold text-[var(--text-secondary)]"
                style={{ background: 'var(--bg-surface-2)' }}>
                {vehicle.registrationNo}
              </span>
            )}
            <span className="rounded-lg px-2 py-0.5 font-sans text-[11px] font-bold text-[var(--text-secondary)]"
              style={{ background: 'var(--bg-surface-2)' }}>
              {FUEL_TYPE_LABEL[vehicle.fuelType]}
            </span>
            <span className="rounded-lg px-2 py-0.5 font-sans text-[11px] font-bold text-[var(--text-secondary)]"
              style={{ background: 'var(--bg-surface-2)' }}>
              {vehicle.currentOdoKm.toLocaleString()} km
            </span>
          </div>
        </div>

        <button
          onClick={() => openMotoEditor({ kind: 'vehicle', id: vehicle.id })}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Pencil size={15} strokeWidth={2.2} />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-[var(--border-subtle)]" />

      {/* Documents section */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            📄 Documents
          </span>
          <button
            onClick={() => openMotoEditor({ kind: 'vehicleDoc', vehicleId: vehicle.id })}
            className="flex items-center gap-1 rounded-lg px-2 py-1 font-sans text-[11px] font-bold text-[var(--color-brand-500)] hover:bg-[var(--bg-surface-2)] transition-colors"
          >
            <PlusCircle size={12} strokeWidth={2.2} /> Add
          </button>
        </div>

        {docs.length === 0 ? (
          <p className="px-3 py-2 font-body text-[12px] text-[var(--text-tertiary)]">
            No documents yet — add RC Book, PUC, Fitness Cert, etc.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {docs.map(doc => <VehicleDocRow key={doc.id} doc={doc} />)}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-[var(--border-subtle)]" />

      {/* Maintenance checklist section */}
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            🔧 Maintenance log
          </span>
          <button
            onClick={() => openMotoEditor({ kind: 'maintenanceItem', vehicleId: vehicle.id })}
            className="flex items-center gap-1 rounded-lg px-2 py-1 font-sans text-[11px] font-bold text-[var(--color-brand-500)] hover:bg-[var(--bg-surface-2)] transition-colors"
          >
            <PlusCircle size={12} strokeWidth={2.2} /> Add
          </button>
        </div>

        {maintenanceItems.length === 0 ? (
          <p className="px-3 py-2 font-body text-[12px] text-[var(--text-tertiary)]">
            No items yet — jot down issues to mention at your next service.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {openItems.map(item => <MaintenanceRow key={item.id} item={item} />)}
            {closedItems.length > 0 && openItems.length > 0 && (
              <div className="my-1 mx-3 border-t border-[var(--border-subtle)]" />
            )}
            {closedItems.map(item => <MaintenanceRow key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MotoVehicles() {
  const vehicles = useLiveQuery(() => vehiclesRepo.getAll(), []) ?? []
  const { activeVehicleId } = useMoto()
  const motoActions = useMotoActions('vehicle')

  return (
    <div className="min-h-screen pb-28 bg-app">
      <DesktopPageHeader action={<ActionDropdown items={motoActions} />} />
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
            {vehicles.map(v => (
              <VehicleCard key={v.id} vehicle={v} isActive={v.id === activeVehicleId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
