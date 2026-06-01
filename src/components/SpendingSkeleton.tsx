export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="glass-panel rounded-[24px] p-5 animate-pulse">
      <div className="h-3 w-24 rounded-full bg-[var(--bg-surface-2)] mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--border-subtle)] last:border-0">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-[var(--bg-surface-2)]" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-3 w-32 rounded-full bg-[var(--bg-surface-2)]" />
            <div className="h-2.5 w-20 rounded-full bg-[var(--bg-surface-2)]" />
          </div>
          <div className="h-3 w-14 rounded-full bg-[var(--bg-surface-2)]" />
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 animate-pulse">
      {[0, 1, 2].map(i => (
        <div key={i} className="glass-panel rounded-[20px] p-4">
          <div className="h-2.5 w-12 rounded-full bg-[var(--bg-surface-2)] mb-3" />
          <div className="h-5 w-20 rounded-full bg-[var(--bg-surface-2)]" />
        </div>
      ))}
    </div>
  )
}

export function HeroPanelSkeleton() {
  return (
    <div className="hero-panel rounded-[30px] px-5 py-5 mb-5 animate-pulse">
      <div className="h-2.5 w-16 rounded-full bg-[var(--bg-surface-2)] mb-2" />
      <div className="h-8 w-36 rounded-2xl bg-[var(--bg-surface-2)]" />
    </div>
  )
}
