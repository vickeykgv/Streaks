import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, AlertTriangle } from 'lucide-react'
import { useMoto } from '@/store/moto'
import { issuesRepo } from '@/db/repos/moto/issues'
import { openMotoEditor } from '@/store/motoEditor'
import { VehicleSwitcher } from '@/components/moto/VehicleSwitcher'
import { EmptyState } from '@/components/ui'
import { format, parseISO } from 'date-fns'
import type { MotoIssue, IssuePriority } from '@/types/moto'

const PRIORITY_COLORS: Record<IssuePriority, { bg: string; color: string }> = {
  high:   { bg: 'rgba(229,9,20,0.1)',    color: 'var(--color-brand-500)' },
  medium: { bg: 'rgba(251,146,60,0.12)', color: '#f97316' },
  low:    { bg: 'var(--bg-surface-3)',   color: 'var(--text-tertiary)' },
}

function IssueCard({ issue }: { issue: MotoIssue }) {
  const { bg, color } = PRIORITY_COLORS[issue.priority]
  const isResolved = issue.status === 'resolved'

  return (
    <button
      onClick={() => openMotoEditor({ kind: 'issue', id: issue.id, vehicleId: issue.vehicleId })}
      className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
      style={{ background: 'var(--bg-surface-1)', opacity: isResolved ? 0.7 : 1 }}
    >
      <div
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{ background: isResolved ? 'rgba(34,197,94,0.15)' : bg }}
      >
        <span className="text-[10px]">{isResolved ? '✓' : '!'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="font-sans text-[14px] font-bold text-[var(--text-primary)] truncate"
            style={{ textDecoration: isResolved ? 'line-through' : 'none' }}
          >
            {issue.title}
          </span>
          <span className="shrink-0 rounded-xl px-2 py-0.5 font-sans text-[10px] font-bold capitalize"
            style={{ background: bg, color }}>
            {issue.priority}
          </span>
        </div>
        {issue.description && (
          <p className="mt-0.5 font-body text-[12px] text-[var(--text-tertiary)] line-clamp-2">
            {issue.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className="font-body text-[11px] text-[var(--text-tertiary)]">
            {format(parseISO(issue.reportedAt), 'd MMM yyyy')}
          </span>
          {isResolved && issue.resolvedAt && (
            <>
              <span className="text-[var(--text-tertiary)]">·</span>
              <span className="font-body text-[11px] text-[#16a34a]">
                Resolved {format(parseISO(issue.resolvedAt), 'd MMM yyyy')}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  )
}

export default function MotoIssues() {
  const { activeVehicleId } = useMoto()
  const [showResolved, setShowResolved] = useState(false)

  const openIssues = useLiveQuery(
    () => activeVehicleId ? issuesRepo.getAllForVehicle(activeVehicleId, 'open') : Promise.resolve([]),
    [activeVehicleId],
  ) ?? []

  const resolvedIssues = useLiveQuery(
    () => activeVehicleId && showResolved ? issuesRepo.getAllForVehicle(activeVehicleId, 'resolved') : Promise.resolve([]),
    [activeVehicleId, showResolved],
  ) ?? []

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-28">
      <VehicleSwitcher />

      {!activeVehicleId && (
        <EmptyState
          icon={<AlertTriangle size={20} strokeWidth={1.8} />}
          headline="No vehicle selected"
          subheadline="Select or add a vehicle above to track its issues."
        />
      )}

      {activeVehicleId && openIssues.length === 0 && !showResolved && (
        <EmptyState
          icon={<AlertTriangle size={20} strokeWidth={1.8} />}
          headline="No open issues"
          subheadline="Tap + to note a problem so it's ready for the next service visit."
        />
      )}

      {activeVehicleId && openIssues.length > 0 && (
        <>
          <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
            Open ({openIssues.length})
          </div>
          <div className="flex flex-col gap-1.5 mb-4">
            {openIssues.map(i => <IssueCard key={i.id} issue={i} />)}
          </div>
        </>
      )}

      {activeVehicleId && (
        <button
          onClick={() => setShowResolved(v => !v)}
          className="mb-3 font-sans text-[13px] font-bold text-[var(--text-secondary)] underline underline-offset-2"
        >
          {showResolved ? 'Hide resolved' : 'Show resolved'}
        </button>
      )}

      {showResolved && resolvedIssues.length > 0 && (
        <>
          <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
            Resolved ({resolvedIssues.length})
          </div>
          <div className="flex flex-col gap-1.5">
            {resolvedIssues.map(i => <IssueCard key={i.id} issue={i} />)}
          </div>
        </>
      )}

      {activeVehicleId && (
        <button
          onClick={() => openMotoEditor({ kind: 'issue', vehicleId: activeVehicleId })}
          className="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 md:bottom-8"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
          aria-label="Report issue"
        >
          <Plus size={24} color="white" strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
