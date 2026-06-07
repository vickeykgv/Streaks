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
        onClick={() => syncNow({ full: true })}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{ background: 'var(--color-overdue-bg)' }}
        title="Couldn't sync — your changes are saved on this device and will retry automatically. Tap to retry now."
      >
        <AlertTriangle size={11} style={{ color: 'var(--color-overdue)' }} />
        <span className="font-sans text-[11px] font-bold" style={{ color: 'var(--color-overdue)' }}>
          Sync failed · Retry
        </span>
      </button>
    )
  }

  const syncedLabel = lastSyncedAt
    ? `Synced ${formatDistanceToNow(lastSyncedAt, { addSuffix: true })} · Tap to sync now`
    : 'Tap to sync now'

  return (
    <button
      onClick={() => syncNow({ full: true })}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--bg-surface-2)]"
      title={syncedLabel}
      aria-label={syncedLabel}
    >
      <RefreshCw size={11} style={{ color: 'var(--text-secondary)' }} />
      {lastSyncedAt && (
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-done)' }} />
      )}
    </button>
  )
}
