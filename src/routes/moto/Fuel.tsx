import { useLiveQuery } from 'dexie-react-hooks'
import { Fuel, Droplets } from 'lucide-react'
import { useMoto } from '@/store/moto'
import { fuelLogsRepo } from '@/db/repos/moto/fuelLogs'
import { openMotoEditor } from '@/store/motoEditor'
import { computeFuelEfficiency } from '@/lib/moto/fuelEfficiency'
import { VehicleSwitcher } from '@/components/moto/VehicleSwitcher'
import { EmptyState } from '@/components/ui'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import { ActionDropdown } from '@/components/ActionDropdown'
import { useMotoActions } from '@/hooks/useMotoActions'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import type { MotoFuelLog } from '@/types/moto'

const FUEL_TYPE_EMOJI: Record<string, string> = {
  petrol: '⛽', diesel: '🛢️', cng: '💨', electric: '⚡', hybrid: '🔋',
}

function KmplBadge({ kmpl }: { kmpl: number }) {
  return (
    <span className="shrink-0 rounded-xl px-2 py-0.5 font-sans text-[11px] font-bold"
      style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
      {kmpl.toFixed(1)} km/L
    </span>
  )
}

function FuelRow({ log, kmpl }: { log: MotoFuelLog; kmpl?: number }) {
  return (
    <button
      onClick={() => openMotoEditor({ kind: 'fuel', id: log.id, vehicleId: log.vehicleId })}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
      style={{ background: 'var(--bg-surface-1)' }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[20px]"
        style={{ background: 'var(--bg-surface-2)' }}>
        {FUEL_TYPE_EMOJI[log.fuelType] ?? '⛽'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-sans text-[14px] font-bold text-[var(--text-primary)]">
            {format(parseISO(log.date), 'd MMM yyyy')}
          </span>
          {log.fullTank && kmpl !== undefined && <KmplBadge kmpl={kmpl} />}
          {!log.fullTank && (
            <span className="rounded-xl px-2 py-0.5 font-sans text-[10px] font-bold text-[var(--text-tertiary)]"
              style={{ background: 'var(--bg-surface-2)' }}>
              partial
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-body text-[12px] text-[var(--text-secondary)]">
            {log.odoKm.toLocaleString()} km
          </span>
          <span className="text-[var(--text-tertiary)]">·</span>
          <span className="font-body text-[12px] text-[var(--text-secondary)]">
            {log.litres} L @ ₹{log.pricePerL}/L
          </span>
          {log.station && (
            <>
              <span className="text-[var(--text-tertiary)]">·</span>
              <span className="font-body text-[12px] text-[var(--text-tertiary)] truncate">{log.station}</span>
            </>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-sans text-[15px] font-extrabold text-[var(--text-primary)]">
          ₹{log.totalCost.toLocaleString()}
        </div>
      </div>
    </button>
  )
}

export default function MotoFuel() {
  const { activeVehicleId } = useMoto()
  const motoActions = useMotoActions('fuel')

  const logs = useLiveQuery(
    () => activeVehicleId ? fuelLogsRepo.getAllForVehicle(activeVehicleId) : Promise.resolve([]),
    [activeVehicleId],
  ) ?? []

  const efficiencySeries = computeFuelEfficiency(logs)
  const kmplByLogId = new Map(efficiencySeries.map(e => [e.logId, e.kmpl]))

  const now = new Date()
  const monthStart = startOfMonth(now).getTime()
  const monthEnd = endOfMonth(now).getTime()
  const monthLogs = logs.filter(l => {
    const t = parseISO(l.date).getTime()
    return t >= monthStart && t <= monthEnd
  })
  const monthSpend = monthLogs.reduce((s, l) => s + l.totalCost, 0)
  const latestKmpl = efficiencySeries.length > 0 ? efficiencySeries[efficiencySeries.length - 1].kmpl : null

  return (
    <div className="min-h-screen bg-app">
      <DesktopPageHeader action={<ActionDropdown items={motoActions} />} />
      <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-28">
      <VehicleSwitcher />

      {activeVehicleId && logs.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-surface-2)' }}>
            <div className="font-body text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">This month</div>
            <div className="font-sans text-[20px] font-extrabold text-[var(--text-primary)]">₹{monthSpend.toLocaleString()}</div>
          </div>
          <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-surface-2)' }}>
            <div className="font-body text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">Latest efficiency</div>
            <div className="font-sans text-[20px] font-extrabold text-[var(--text-primary)]">
              {latestKmpl !== null ? `${latestKmpl.toFixed(1)} km/L` : '—'}
            </div>
          </div>
        </div>
      )}

      {!activeVehicleId && (
        <EmptyState
          icon={<Fuel size={20} strokeWidth={1.8} />}
          headline="No vehicle selected"
          subheadline="Select or add a vehicle above to view its fuel log."
        />
      )}

      {activeVehicleId && logs.length === 0 && (
        <EmptyState
          icon={<Droplets size={20} strokeWidth={1.8} />}
          headline="No fuel fills yet"
          subheadline="Tap + to log your first fill — litres, price, odometer."
        />
      )}

      {activeVehicleId && logs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {logs.map(log => (
            <FuelRow key={log.id} log={log} kmpl={kmplByLogId.get(log.id)} />
          ))}
        </div>
      )}

      </div>
    </div>
  )
}
