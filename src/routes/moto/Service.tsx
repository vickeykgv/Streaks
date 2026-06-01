import { useLiveQuery } from 'dexie-react-hooks'
import { Wrench } from 'lucide-react'
import { useMoto } from '@/store/moto'
import { servicesRepo } from '@/db/repos/moto/services'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { openMotoEditor } from '@/store/motoEditor'
import { getServiceDueStatus, type DueStatus } from '@/lib/moto/serviceDue'
import { VehicleSwitcher } from '@/components/moto/VehicleSwitcher'
import { EmptyState } from '@/components/ui'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import { PageHeader } from '@/components/PageHeader'
import { ActionDropdown } from '@/components/ActionDropdown'
import { useMotoActions } from '@/hooks/useMotoActions'
import { format, parseISO } from 'date-fns'
import type { MotoService, ServiceType } from '@/types/moto'

const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  general:    'General',
  oil_change: 'Oil Change',
  tire:       'Tyre',
  brake:      'Brake',
  battery:    'Battery',
  major:      'Major',
  other:      'Other',
}

const SERVICE_TYPE_EMOJI: Record<ServiceType, string> = {
  general:    '🔧',
  oil_change: '🛢️',
  tire:       '🔩',
  brake:      '🛑',
  battery:    '🔋',
  major:      '🏭',
  other:      '⚙️',
}

function DueBadge({ status, daysRemaining, kmRemaining }: {
  status: DueStatus
  daysRemaining?: number
  kmRemaining?: number
}) {
  if (status === 'ok') return null

  const bg = status === 'overdue' ? 'rgba(229,9,20,0.1)' : 'rgba(251,146,60,0.12)'
  const color = status === 'overdue' ? 'var(--color-brand-500)' : '#f97316'

  let label = status === 'overdue' ? 'Overdue' : 'Due soon'
  if (daysRemaining !== undefined) {
    label = daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : `Due in ${daysRemaining}d`
  } else if (kmRemaining !== undefined) {
    label = kmRemaining < 0 ? `${Math.abs(kmRemaining)} km overdue` : `Due in ${kmRemaining} km`
  }

  return (
    <span className="shrink-0 rounded-xl px-2 py-0.5 font-sans text-[10px] font-bold"
      style={{ background: bg, color }}>
      {label}
    </span>
  )
}

function ServiceCard({ service, currentOdoKm }: { service: MotoService; currentOdoKm: number }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const dueResult = getServiceDueStatus(service, currentOdoKm, today)

  return (
    <button
      onClick={() => openMotoEditor({ kind: 'service', id: service.id, vehicleId: service.vehicleId })}
      className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
      style={{ background: 'var(--bg-surface-1)' }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[20px]"
        style={{ background: 'var(--bg-surface-2)' }}>
        {SERVICE_TYPE_EMOJI[service.serviceType]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-[14px] font-bold text-[var(--text-primary)]">
            {SERVICE_TYPE_LABEL[service.serviceType]}
          </span>
          <DueBadge
            status={dueResult.overall}
            daysRemaining={dueResult.daysRemaining}
            kmRemaining={dueResult.kmRemaining}
          />
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="font-body text-[12px] text-[var(--text-secondary)]">
            {format(parseISO(service.date), 'd MMM yyyy')}
          </span>
          <span className="text-[var(--text-tertiary)]">·</span>
          <span className="font-body text-[12px] text-[var(--text-secondary)]">
            {service.odoKm.toLocaleString()} km
          </span>
          {service.workshop && (
            <>
              <span className="text-[var(--text-tertiary)]">·</span>
              <span className="font-body text-[12px] text-[var(--text-tertiary)] truncate">{service.workshop}</span>
            </>
          )}
        </div>
        {(service.nextDueDate || service.nextDueOdoKm) && (
          <div className="mt-1 font-body text-[11px] text-[var(--text-tertiary)]">
            Next due:
            {service.nextDueDate && ` ${format(parseISO(service.nextDueDate), 'd MMM yyyy')}`}
            {service.nextDueDate && service.nextDueOdoKm && ' /'}
            {service.nextDueOdoKm && ` ${service.nextDueOdoKm.toLocaleString()} km`}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="font-sans text-[15px] font-extrabold text-[var(--text-primary)]">
          ₹{service.totalCost.toLocaleString()}
        </div>
      </div>
    </button>
  )
}

export default function MotoService() {
  const { activeVehicleId } = useMoto()
  const motoActions = useMotoActions('service')

  const services = useLiveQuery(
    () => activeVehicleId ? servicesRepo.getAllForVehicle(activeVehicleId) : Promise.resolve([]),
    [activeVehicleId],
  ) ?? []

  const vehicle = useLiveQuery(
    () => activeVehicleId ? vehiclesRepo.getById(activeVehicleId) : Promise.resolve(undefined),
    [activeVehicleId],
  )

  const currentOdoKm = vehicle?.currentOdoKm ?? 0

  return (
    <div className="min-h-screen pb-28 bg-app">
      <DesktopPageHeader action={<ActionDropdown items={motoActions} />} />
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="px-4 pt-4">
          <PageHeader kicker="Moto" title="Service" description="Track service visits and upcoming maintenance due dates." />
        </div>

        {/* Vehicle switcher */}
        <div className="pt-2">
          <VehicleSwitcher />
        </div>

        {/* Content */}
        <div className="px-4 pt-3">
          {!activeVehicleId && (
            <EmptyState
              icon={<Wrench size={20} strokeWidth={1.8} />}
              headline="No vehicle selected"
              subheadline="Select or add a vehicle above to view service history."
            />
          )}

          {activeVehicleId && services.length === 0 && (
            <EmptyState
              icon={<Wrench size={20} strokeWidth={1.8} />}
              headline="No service records yet"
              subheadline="Tap + to log your first service visit and track next due dates."
            />
          )}

          {activeVehicleId && services.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {services.map(s => (
                <ServiceCard key={s.id} service={s} currentOdoKm={currentOdoKm} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
