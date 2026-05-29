import { ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import type { DocStatus } from '@/lib/moto/documentStatus'
import type { MotoDocument } from '@/types/moto'

const STATUS_CONFIG: Record<DocStatus, { color: string; bg: string }> = {
  expiring: { color: '#f97316', bg: 'rgba(251,146,60,0.12)' },
  expired:  { color: 'var(--color-brand-500)', bg: 'rgba(229,9,20,0.1)' },
  valid:    { color: '#16a34a', bg: 'rgba(34,197,94,0.12)' },
}

const DOC_LABEL: Record<string, string> = {
  insurance: 'Insurance', driving_license: "Driver's Licence",
}

interface AlertDoc {
  doc: MotoDocument
  status: DocStatus
  daysRemaining: number
}

interface Props { alertDocs: AlertDoc[] }

export function ExpiringDocsCard({ alertDocs }: Props) {
  const navigate = useNavigate()

  if (alertDocs.length === 0) return null

  const hasExpired = alertDocs.some(d => d.status === 'expired')

  return (
    <button
      onClick={() => navigate('/moto/documents')}
      className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left mb-3 transition-colors hover:bg-[var(--bg-surface-2)]"
      style={{
        background: hasExpired ? 'rgba(229,9,20,0.06)' : 'rgba(251,146,60,0.06)',
        border: hasExpired ? '1px solid rgba(229,9,20,0.2)' : '1px solid rgba(251,146,60,0.2)',
      }}
    >
      <ShieldAlert
        size={18}
        strokeWidth={2.2}
        color={hasExpired ? 'var(--color-brand-500)' : '#f97316'}
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="font-sans text-[14px] font-bold text-[var(--text-primary)] mb-1">
          {hasExpired ? 'Document expired' : 'Document expiring soon'}
        </div>
        <div className="flex flex-col gap-1">
          {alertDocs.slice(0, 3).map(({ doc, status, daysRemaining }) => {
            const { color, bg } = STATUS_CONFIG[status]
            return (
              <div key={doc.id} className="flex items-center gap-2">
                <span className="font-body text-[12px] text-[var(--text-secondary)] min-w-0 truncate">
                  {DOC_LABEL[doc.type] ?? doc.type}
                  {doc.provider && ` · ${doc.provider}`}
                </span>
                <span className="shrink-0 rounded-xl px-1.5 py-0.5 font-sans text-[10px] font-bold"
                  style={{ background: bg, color }}>
                  {status === 'expired'
                    ? `Expired ${format(parseISO(doc.expiryDate), 'd MMM')}`
                    : daysRemaining === 0
                      ? 'Expires today'
                      : `${daysRemaining}d left`}
                </span>
              </div>
            )
          })}
          {alertDocs.length > 3 && (
            <div className="font-body text-[11px] text-[var(--text-tertiary)]">
              +{alertDocs.length - 3} more
            </div>
          )}
        </div>
      </div>
      <span className="font-sans text-[12px] text-[var(--text-tertiary)] shrink-0">›</span>
    </button>
  )
}
