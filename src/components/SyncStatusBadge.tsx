import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useSession } from '@/auth/session'
import { syncNow } from '@/sync/engine'

export function SyncStatusBadge() {
  const { user } = useSession()
  const syncing      = useAppStore(s => s.syncing)
  const syncError    = useAppStore(s => s.syncError)
  const lastSyncedAt = useAppStore(s => s.lastSyncedAt)
  const [, setTick]  = useState(0)

  // Re-render every 30s to keep "X ago" text fresh
  useEffect(() => {
    if (!lastSyncedAt) return
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [lastSyncedAt])

  if (!user) return null

  if (syncing) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--bg-surface-2)]" title="Syncing…">
        <RefreshCw size={11} className="animate-spin" style={{ color: 'var(--color-brand-400)' }} />
        <span className="sr-only">Syncing…</span>
      </div>
    )
  }

  if (syncError) {
    return (
      <button
        onClick={() => syncNow()}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full"
        style={{ background: 'var(--color-overdue-bg)' }}
        title="Sync error — tap to retry"
      >
        <AlertTriangle size={11} style={{ color: 'var(--color-overdue)' }} />
        <span className="sr-only">Sync error — tap to retry</span>
      </button>
    )
  }

  if (!lastSyncedAt) return null

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--bg-surface-2)]"
      title={`Synced ${formatDistanceToNow(lastSyncedAt, { addSuffix: true })}`}
    >
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-done)' }} />
      <span className="sr-only">Synced {formatDistanceToNow(lastSyncedAt, { addSuffix: true })}</span>
    </div>
  )
}
