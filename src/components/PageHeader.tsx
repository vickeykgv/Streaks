import type { ReactNode } from 'react'

interface PageHeaderProps {
  kicker: string
  title: ReactNode
  description?: ReactNode
  /** Extra classes for the outer hero-panel box, e.g. spacing like "mb-4". */
  className?: string
}

/**
 * Standard page title section used across all modules — a hero-panel "white box"
 * with a kicker, 30px title, and optional description. Keeps headers consistent
 * app-wide. Note: this renders no horizontal padding; the parent must supply it
 * (wrap in `px-4` or rely on a wrapper that already pads).
 */
export function PageHeader({ kicker, title, description, className = '' }: PageHeaderProps) {
  return (
    <div className={`hero-panel rounded-[30px] px-5 py-5 ${className}`}>
      <div className="section-kicker mb-2">{kicker}</div>
      <div className="font-sans text-[30px] font-extrabold tracking-tight text-[var(--text-primary)]">{title}</div>
      {description && (
        <div className="mt-1 font-body text-[13px] text-[var(--text-secondary)]">{description}</div>
      )}
    </div>
  )
}
