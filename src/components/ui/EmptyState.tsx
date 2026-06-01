import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  headline: string
  subheadline?: string
  action?: { label: string; to?: string; onClick?: () => void }
  hero?: boolean
}

export function EmptyState({ icon, headline, subheadline, action, hero = false }: EmptyStateProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center text-center" style={{ padding: hero ? '52px 24px 44px' : '36px 20px 28px' }}>
      {/* Icon */}
      <div
        className="mb-5 flex items-center justify-center rounded-[18px]"
        style={{
          width: hero ? 60 : 48,
          height: hero ? 60 : 48,
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-tertiary)',
        }}
      >
        {icon ?? <Sparkles size={hero ? 26 : 20} strokeWidth={1.8} />}
      </div>

      {/* Text */}
      <h3
        className="font-sans font-extrabold tracking-tight"
        style={{ fontSize: hero ? 20 : 16, color: 'var(--text-primary)', lineHeight: 1.25 }}
      >
        {headline}
      </h3>
      {subheadline && (
        <p
          className="font-body mt-1.5 max-w-[210px]"
          style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}
        >
          {subheadline}
        </p>
      )}

      {/* CTA */}
      {action && (
        <Button
          variant="primary"
          size={hero ? 'md' : 'sm'}
          className="mt-5"
          onClick={() => {
            if (action.onClick) action.onClick()
            else if (action.to) navigate(action.to)
          }}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
