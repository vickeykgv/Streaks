import { useNavigate } from 'react-router-dom'
import { Button } from './Button'

interface EmptyStateProps {
  emoji: string
  headline: string
  subheadline?: string
  action?: { label: string; to?: string; onClick?: () => void }
  ideas?: string[]
  /** If true, renders a larger hero-style empty state */
  hero?: boolean
}

export function EmptyState({
  emoji,
  headline,
  subheadline,
  action,
  ideas,
  hero = false,
}: EmptyStateProps) {
  const navigate = useNavigate()

  return (
    <div className={`flex flex-col items-center text-center ${hero ? 'py-12 px-5' : 'py-10 px-5'}`}>
      {/* Glow orb */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Outer glow ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: hero ? 120 : 96,
            height: hero ? 120 : 96,
            background: 'radial-gradient(circle, rgba(229,9,20,0.18) 0%, rgba(255,180,87,0.08) 60%, transparent 80%)',
          }}
        />
        {/* Mid ring */}
        <div
          className="absolute rounded-full border"
          style={{
            width: hero ? 88 : 70,
            height: hero ? 88 : 70,
            borderColor: 'rgba(229,9,20,0.14)',
            background: 'rgba(229,9,20,0.06)',
          }}
        />
        {/* Emoji container */}
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: hero ? 64 : 52,
            height: hero ? 64 : 52,
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
            fontSize: hero ? 28 : 22,
          }}
        >
          {emoji}
        </div>
        {/* Decorative floating dots */}
        <div
          className="absolute top-0 right-2 w-2 h-2 rounded-full"
          style={{ background: 'var(--color-brand-500)', opacity: 0.5 }}
        />
        <div
          className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--color-streak)', opacity: 0.6 }}
        />
      </div>

      {/* Text */}
      <h3
        className="font-sans font-extrabold tracking-tight"
        style={{
          fontSize: hero ? 22 : 17,
          color: 'var(--text-primary)',
          lineHeight: 1.25,
        }}
      >
        {headline}
      </h3>
      {subheadline && (
        <p
          className="font-body mt-1.5 max-w-[220px]"
          style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}
        >
          {subheadline}
        </p>
      )}

      {/* Quick-start idea chips */}
      {ideas && ideas.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-[280px]">
          <p
            className="w-full font-sans font-bold mb-0.5"
            style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}
          >
            Popular ideas
          </p>
          {ideas.map(idea => (
            <span
              key={idea}
              className="chip-soft rounded-full px-3 py-1 font-body"
              style={{ fontSize: 12 }}
            >
              {idea}
            </span>
          ))}
        </div>
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
