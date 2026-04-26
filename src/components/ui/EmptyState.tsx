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
    <div className="relative flex flex-col items-center text-center overflow-hidden" style={{ padding: hero ? '52px 24px 44px' : '36px 20px 28px' }}>
      {/* Atmospheric glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(229,9,20,0.13) 0%, rgba(229,9,20,0.04) 55%, transparent 75%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-30%', left: '10%', right: '10%', height: '70%',
          background: 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(255,100,60,0.07) 0%, transparent 70%)',
          filter: 'blur(18px)',
        }}
      />

      {/* Icon */}
      <div
        className="relative mb-5 flex items-center justify-center rounded-[18px]"
        style={{
          width: hero ? 60 : 48,
          height: hero ? 60 : 48,
          background: 'linear-gradient(135deg, rgba(229,9,20,0.18) 0%, rgba(229,9,20,0.06) 100%)',
          border: '1px solid rgba(229,9,20,0.22)',
          boxShadow: '0 0 40px rgba(229,9,20,0.14), 0 8px 24px rgba(0,0,0,0.28)',
          color: 'var(--color-brand-500)',
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
