import { Wrench } from 'lucide-react'
import { openMotoEditor } from '@/store/motoEditor'
import { format, parseISO } from 'date-fns'
import type { ServiceDueResult } from '@/lib/moto/serviceDue'
import type { MotoService } from '@/types/moto'

const SERVICE_TYPE_LABEL: Record<string, string> = {
  general: 'General', oil_change: 'Oil Change', tire: 'Tyre',
  brake: 'Brake', battery: 'Battery', major: 'Major', other: 'Other',
}

interface Props {
  lastService: MotoService | null
  nextDueStatus: ServiceDueResult
  vehicleId: string
}

export function NextServiceCard({ lastService, nextDueStatus, vehicleId }: Props) {
  if (!lastService) {
    return (
      <button
        onClick={() => openMotoEditor({ kind: 'service', vehicleId })}
        className="flex flex-col gap-1 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
        style={{ background: 'var(--bg-surface-2)', border: '1px dashed var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <Wrench size={15} color="var(--text-tertiary)" strokeWidth={2} />
          <span className="font-sans text-[13px] font-bold text-[var(--text-tertiary)]">Service</span>
        </div>
        <span className="font-body text-[12px] text-[var(--text-tertiary)]">No records yet — tap to log</span>
      </button>
    )
  }

  const { overall, daysRemaining, kmRemaining } = nextDueStatus
  const dueColor = overall === 'overdue' ? 'var(--color-brand-500)' : overall === 'due-soon' ? '#f97316' : '#16a34a'
  const dueBg    = overall === 'overdue' ? 'rgba(229,9,20,0.1)' : overall === 'due-soon' ? 'rgba(251,146,60,0.12)' : 'rgba(34,197,94,0.12)'

  return (
    <button
      onClick={() => openMotoEditor({ kind: 'service', id: lastService.id, vehicleId })}
      className="flex flex-col gap-2 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
      style={{ background: 'var(--bg-surface-2)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench size={15} color="var(--color-brand-500)" strokeWidth={2} />
          <span className="font-sans text-[12px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Last service</span>
        </div>
        {overall !== 'ok' && (
          <span className="rounded-xl px-2 py-0.5 font-sans text-[11px] font-bold"
            style={{ background: dueBg, color: dueColor }}>
            {overall === 'overdue' ? 'Overdue' : 'Due soon'}
          </span>
        )}
      </div>
      <div className="font-sans text-[15px] font-extrabold text-[var(--text-primary)]">
        {SERVICE_TYPE_LABEL[lastService.serviceType] ?? lastService.serviceType}
      </div>
      <div className="font-body text-[12px] text-[var(--text-secondary)]">
        {format(parseISO(lastService.date), 'd MMM yyyy')} · {lastService.odoKm.toLocaleString()} km
      </div>
      {(lastService.nextDueDate || lastService.nextDueOdoKm) && (
        <div className="font-body text-[11px]" style={{ color: dueColor }}>
          Next:
          {lastService.nextDueDate && ` ${format(parseISO(lastService.nextDueDate), 'd MMM yyyy')}`}
          {lastService.nextDueDate && lastService.nextDueOdoKm && ' /'}
          {lastService.nextDueOdoKm && ` ${lastService.nextDueOdoKm.toLocaleString()} km`}
          {daysRemaining !== undefined && ` (${daysRemaining >= 0 ? `${daysRemaining}d left` : `${Math.abs(daysRemaining)}d overdue`})`}
          {kmRemaining !== undefined && daysRemaining === undefined && ` (${kmRemaining >= 0 ? `${kmRemaining} km left` : `${Math.abs(kmRemaining)} km overdue`})`}
        </div>
      )}
    </button>
  )
}
