import { useLiveQuery } from 'dexie-react-hooks'
import { FileText, PlusCircle } from 'lucide-react'
import { useMoto } from '@/store/moto'
import { documentsRepo } from '@/db/repos/moto/documents'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { openMotoEditor } from '@/store/motoEditor'
import { getDocumentStatus, type DocStatus } from '@/lib/moto/documentStatus'
import { VehicleSwitcher } from '@/components/moto/VehicleSwitcher'
import { EmptyState } from '@/components/ui'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import { PageHeader } from '@/components/PageHeader'
import { ActionDropdown } from '@/components/ActionDropdown'
import { useMotoActions } from '@/hooks/useMotoActions'
import { format, parseISO } from 'date-fns'
import type { MotoDocument, MotoVehicle } from '@/types/moto'

const STATUS_CONFIG: Record<DocStatus, { label: string; bg: string; color: string }> = {
  valid:    { label: 'Valid',    bg: 'rgba(34,197,94,0.12)',  color: '#16a34a' },
  expiring: { label: 'Expiring', bg: 'rgba(251,146,60,0.12)', color: '#f97316' },
  expired:  { label: 'Expired',  bg: 'rgba(229,9,20,0.1)',   color: 'var(--color-brand-500)' },
}

const DOC_EMOJI: Record<string, string> = {
  insurance:       '🛡️',
  driving_license: '📋',
}

const DOC_LABEL: Record<string, string> = {
  insurance:       'Insurance',
  driving_license: "Driver's Licence",
}

function DocumentCard({ doc, vehicles }: { doc: MotoDocument; vehicles: MotoVehicle[] }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { status, daysRemaining } = getDocumentStatus(doc, today)
  const { label, bg, color } = STATUS_CONFIG[status]
  const vehicle = doc.vehicleId ? vehicles.find(v => v.id === doc.vehicleId) : undefined

  return (
    <button
      onClick={() => openMotoEditor({ kind: 'document', id: doc.id, vehicleId: doc.vehicleId })}
      className="flex w-full items-start gap-3 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
      style={{ background: 'var(--bg-surface-1)' }}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[22px]"
        style={{ background: 'var(--bg-surface-2)' }}>
        {DOC_EMOJI[doc.type] ?? '📄'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="font-sans text-[14px] font-bold text-[var(--text-primary)]">
            {DOC_LABEL[doc.type] ?? doc.type}
          </span>
          <span className="shrink-0 rounded-xl px-2 py-0.5 font-sans text-[10px] font-bold"
            style={{ background: bg, color }}>
            {label}
          </span>
        </div>
        {vehicle && (
          <div className="font-body text-[12px] text-[var(--text-secondary)] mb-0.5">{vehicle.name}</div>
        )}
        {doc.provider && (
          <div className="font-body text-[12px] text-[var(--text-secondary)]">{doc.provider}</div>
        )}
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="font-body text-[12px] text-[var(--text-secondary)]">
            Expires {format(parseISO(doc.expiryDate), 'd MMM yyyy')}
          </span>
          {status !== 'expired' && (
            <>
              <span className="text-[var(--text-tertiary)]">·</span>
              <span className="font-body text-[12px]" style={{ color }}>
                {daysRemaining === 0 ? 'Today' : `${daysRemaining}d remaining`}
              </span>
            </>
          )}
          {status === 'expired' && (
            <>
              <span className="text-[var(--text-tertiary)]">·</span>
              <span className="font-body text-[12px]" style={{ color }}>
                {Math.abs(daysRemaining)}d ago
              </span>
            </>
          )}
        </div>
        {doc.policyNo && (
          <div className="mt-0.5 font-body text-[11px] text-[var(--text-tertiary)]">
            {doc.type === 'driving_license' ? 'Licence' : 'Policy'}: {doc.policyNo}
          </div>
        )}
      </div>
    </button>
  )
}

export default function MotoDocuments() {
  const { activeVehicleId } = useMoto()
  const motoActions = useMotoActions('document')

  const documents = useLiveQuery(
    () => documentsRepo.getAll(activeVehicleId ?? undefined),
    [activeVehicleId],
  ) ?? []

  const vehicles = useLiveQuery(() => vehiclesRepo.getAll(true), []) ?? []

  // Sort: expired → expiring → valid; within each group by expiry date asc
  const sorted = [...documents].sort((a, b) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const statusOrder: Record<DocStatus, number> = { expired: 0, expiring: 1, valid: 2 }
    const sa = getDocumentStatus(a, today).status
    const sb = getDocumentStatus(b, today).status
    if (sa !== sb) return statusOrder[sa] - statusOrder[sb]
    return a.expiryDate.localeCompare(b.expiryDate)
  })

  return (
    <div className="min-h-screen bg-app">
      <DesktopPageHeader action={<ActionDropdown items={motoActions} />} />
      <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-28">
      <PageHeader kicker="Moto" title="Documents" description="Insurance, registration, and other paperwork in one place." className="mb-4" />
      <div className="flex items-center justify-between mb-3">
        <VehicleSwitcher />
        <button
          onClick={() => openMotoEditor({ kind: 'document', vehicleId: activeVehicleId ?? undefined })}
          className="lg:hidden flex items-center gap-1.5 h-9 px-3.5 rounded-xl font-sans text-[13px] font-bold shrink-0 ml-3 transition-all active:scale-95"
          style={{ background: 'var(--color-brand-500)', color: 'var(--text-on-brand)', boxShadow: 'var(--shadow-glow)' }}
        >
          <PlusCircle size={15} strokeWidth={2.2} />
          Add doc
        </button>
      </div>

      {documents.length === 0 && (
        <EmptyState
          icon={<FileText size={20} strokeWidth={1.8} />}
          headline="No documents yet"
          subheadline="Add your insurance or driving licence to track expiry and get reminders."
        />
      )}

      {sorted.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {sorted.map(doc => (
            <DocumentCard key={doc.id} doc={doc} vehicles={vehicles} />
          ))}
        </div>
      )}

      </div>
    </div>
  )
}
