import { nanoid } from 'nanoid'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/auth/session'

/**
 * Best-effort client error reporting to the `client_errors` Supabase table.
 *
 * Design rules:
 * - MUST never throw or reject (it's called from error handlers — a failure here
 *   must not cascade). All failures are swallowed.
 * - De-dupes identical errors fired in a tight window (render loops, repeated
 *   rejections) so we don't flood the table.
 * - Works signed-out too (user_id is null); the table's insert policy allows anon.
 */

const sentAt = new Map<string, number>()
const DEFAULT_WINDOW_MS = 5_000
// `sync` runs on a 60s interval; a persistent failure would otherwise log every
// cycle (~60 rows/hour) and bury real signal. The UI already surfaces sync errors,
// so we only need an occasional sample.
const WINDOW_BY_CONTEXT: Record<string, number> = { sync: 30 * 60_000 }

export async function logError(error: unknown, context: string): Promise<void> {
  try {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack ?? null : null

    const signature = `${context}:${message}`
    const now = Date.now()
    const windowMs = WINDOW_BY_CONTEXT[context] ?? DEFAULT_WINDOW_MS
    const last = sentAt.get(signature)
    if (last !== undefined && now - last < windowMs) return
    sentAt.set(signature, now)
    // Bound the map so it can't grow unbounded across a long session.
    if (sentAt.size > 200) sentAt.clear()

    const userId = useSession.getState().user?.id ?? null
    const appVersion = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? null

    await supabase.from('client_errors').insert({
      id: nanoid(),
      user_id: userId,
      message: message.slice(0, 2000),
      stack: stack ? stack.slice(0, 8000) : null,
      context,
      url: typeof location !== 'undefined' ? location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      app_version: appVersion,
      created_at: now,
    })
  } catch {
    // Never let error logging throw.
  }
}
