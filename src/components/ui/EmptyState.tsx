import { useNavigate } from 'react-router-dom'
import { Button } from './Button'

interface EmptyStateProps {
  emoji: string
  headline: string
  subheadline?: string
  action?: { label: string; to: string }
}

export function EmptyState({ emoji, headline, subheadline, action }: EmptyStateProps) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="text-5xl mb-4 select-none">{emoji}</span>
      <h3 className="text-lg font-extrabold font-sans text-[var(--text-primary)]">{headline}</h3>
      {subheadline && <p className="text-sm text-[var(--text-secondary)] mt-1 font-body">{subheadline}</p>}
      {action && (
        <Button
          variant="primary"
          size="md"
          className="mt-5"
          onClick={() => navigate(action.to)}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
