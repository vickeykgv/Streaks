import { Droplets } from 'lucide-react'
import { openMotoEditor } from '@/store/motoEditor'
import { format, parseISO } from 'date-fns'
import type { MotoFuelLog } from '@/types/moto'

interface Props {
  lastFuelLog: MotoFuelLog | null
  latestKmpl: number | null
  monthFuelSpend: number
  vehicleId: string
}

export function LastFuelCard({ lastFuelLog, latestKmpl, monthFuelSpend, vehicleId }: Props) {
  if (!lastFuelLog) {
    return (
      <button
        onClick={() => openMotoEditor({ kind: 'fuel', vehicleId })}
        className="flex flex-col gap-1 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
        style={{ background: 'var(--bg-surface-2)', border: '1px dashed var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <Droplets size={15} color="var(--text-tertiary)" strokeWidth={2} />
          <span className="font-sans text-[13px] font-bold text-[var(--text-tertiary)]">Fuel</span>
        </div>
        <span className="font-body text-[12px] text-[var(--text-tertiary)]">No fills yet — tap to log</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => openMotoEditor({ kind: 'fuel', id: lastFuelLog.id, vehicleId })}
      className="flex flex-col gap-2 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
      style={{ background: 'var(--bg-surface-2)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets size={15} color="var(--color-brand-500)" strokeWidth={2} />
          <span className="font-sans text-[12px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Last fill</span>
        </div>
        {latestKmpl !== null && (
          <span className="rounded-xl px-2 py-0.5 font-sans text-[11px] font-bold"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
            {latestKmpl.toFixed(1)} km/L
          </span>
        )}
      </div>
      <div className="font-sans text-[20px] font-extrabold text-[var(--text-primary)]">
        ₹{lastFuelLog.totalCost.toLocaleString()}
      </div>
      <div className="font-body text-[12px] text-[var(--text-secondary)]">
        {lastFuelLog.litres} L · {format(parseISO(lastFuelLog.date), 'd MMM')}
      </div>
      {monthFuelSpend > 0 && (
        <div className="font-body text-[11px] text-[var(--text-tertiary)]">
          ₹{monthFuelSpend.toLocaleString()} this month
        </div>
      )}
    </button>
  )
}
