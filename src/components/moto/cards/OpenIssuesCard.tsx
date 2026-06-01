import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { MotoIssue } from '@/types/moto'

interface Props {
  openIssues: MotoIssue[]
  highPriorityCount: number
}

export function OpenIssuesCard({ openIssues, highPriorityCount }: Props) {
  const navigate = useNavigate()

  if (openIssues.length === 0) return null

  return (
    <button
      onClick={() => navigate('/moto/issues')}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left mb-3 transition-colors hover:bg-[var(--bg-surface-2)]"
      style={{
        background: highPriorityCount > 0 ? 'rgba(229,9,20,0.06)' : 'var(--bg-surface-2)',
        border: highPriorityCount > 0 ? '1px solid rgba(229,9,20,0.2)' : '1px solid var(--border-subtle)',
      }}
    >
      <AlertTriangle
        size={18}
        strokeWidth={2.2}
        color={highPriorityCount > 0 ? 'var(--color-brand-500)' : '#f97316'}
      />
      <div className="flex-1">
        <div className="font-sans text-[14px] font-bold text-[var(--text-primary)]">
          {openIssues.length} open {openIssues.length === 1 ? 'issue' : 'issues'}
          {highPriorityCount > 0 && (
            <span className="ml-2 rounded-xl px-2 py-0.5 font-sans text-[10px] font-bold"
              style={{ background: 'rgba(229,9,20,0.12)', color: 'var(--color-brand-500)' }}>
              {highPriorityCount} high priority
            </span>
          )}
        </div>
        <div className="font-body text-[12px] text-[var(--text-secondary)]">
          {openIssues.slice(0, 2).map(i => i.title).join(' · ')}
          {openIssues.length > 2 && ` · +${openIssues.length - 2} more`}
        </div>
      </div>
      <span className="font-sans text-[12px] text-[var(--text-tertiary)]">›</span>
    </button>
  )
}
