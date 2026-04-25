# Phase 7 — Push Notifications
**Estimated time:** Day 13–14  
**Goal:** Real OS-level reminders that fire at the user's chosen time even when the app is closed. A server-side scheduler sends Web Push to the service worker, which shows a notification with "Mark done" and "Snooze 1h" action buttons.

**Prerequisite:** Phase 6 complete — sync working, Supabase backend live.

---

## Step 1 — Generate VAPID keys

VAPID (Voluntary Application Server Identification) is how the push service authenticates your server.

```bash
# In your server/supabase functions environment
npx web-push generate-vapid-keys
```

Output:
```
Public Key:  BNtjEaD...  (share this with the client)
Private Key: vKjQ...     (NEVER commit — server-side only)
```

Store in Supabase Edge Function environment variables:
- `VAPID_PUBLIC_KEY` — safe to put in `.env.local` on the client too
- `VAPID_PRIVATE_KEY` — server only, set via `supabase secrets set VAPID_PRIVATE_KEY=...`
- `VAPID_SUBJECT` — `mailto:you@yourdomain.com`

Add to client `.env.local`:
```
VITE_VAPID_PUBLIC_KEY=BNtjEaD...
```

---

## Step 2 — Switch service worker to `injectManifest` strategy

Phase 4 used the generated (auto) SW. Now we need a custom SW file so we can add `push` and `notificationclick` event handlers.

Update `vite.config.ts`:
```ts
VitePWA({
  registerType: 'prompt',
  injectRegister: null,
  manifest: false,
  strategies: 'injectManifest',   // ← switch from default generated SW
  srcDir: 'src/pwa',
  filename: 'sw.ts',
  injectManifest: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  },
})
```

Create `src/pwa/sw.ts` (this replaces the auto-generated SW):

```ts
/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, NavigationRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & typeof globalThis

// ─── Precache (injected by vite-plugin-pwa) ───────────────────────────
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ─── SPA fallback ─────────────────────────────────────────────────────
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), {
  denylist: [/^\/api\//, /^\/functions\//],
}))

// ─── Image caching ────────────────────────────────────────────────────
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  })
)

// ─── Background Sync ──────────────────────────────────────────────────
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'habit-sync') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true }).then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SYNC_NOW' }))
      )
    )
  }
})

// ─── Push handler ─────────────────────────────────────────────────────
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  const data = event.data.json() as {
    title: string
    body: string
    tag: string          // e.g. 'habit_abc123'
    url: string          // e.g. '/habits/abc123'
    entityId: string
    entityType: 'habit' | 'task'
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: data.tag,
      renotify: false,
      data: { url: data.url, entityId: data.entityId, entityType: data.entityType },
      actions: [
        { action: 'done',   title: '✅ Mark done' },
        { action: 'snooze', title: '⏰ Snooze 1h'  },
      ],
    } as NotificationOptions)
  )
})

// ─── Notification click handler ───────────────────────────────────────
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  const { action } = event
  const { url, entityId, entityType } = event.notification.data ?? {}

  if (action === 'done') {
    // Mark the entity done without opening the UI:
    event.waitUntil(
      fetch(`${self.location.origin}/api/quick-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // This endpoint (Phase 7 Step 6) will call the sync push function
        body: JSON.stringify({ entityId, entityType }),
        credentials: 'include',
      }).catch(() => {
        // If offline or not signed in, open the app and let the user complete manually
        return self.clients.openWindow(url ?? '/')
      })
    )
    return
  }

  if (action === 'snooze') {
    // Tell the server to re-fire the notification in 1 hour
    event.waitUntil(
      fetch(`${self.location.origin}/api/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, entityType, minutes: 60 }),
        credentials: 'include',
      }).catch(() => null)  // snooze failure is non-critical
    )
    return
  }

  // Default: open/focus the app at the entity's URL
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(url ?? '/')
      } else {
        self.clients.openWindow(url ?? '/')
      }
    })
  )
})
```

---

## Step 3 — Client: subscribe to push

Create `src/push/subscribe.ts`:

```ts
import { supabase } from '@/lib/supabase'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export async function requestPushPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  const permission = await requestPushPermission()
  if (permission !== 'granted') return null

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  })

  // Upload subscription + timezone to Supabase
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: subscription.endpoint,
    p256dh:   btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
    auth:     btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }, { onConflict: 'endpoint' })

  if (error) console.error('[Push] Failed to save subscription:', error)
  return subscription
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}
```

Create `src/push/api.ts` — talks to Supabase `reminders` table:

```ts
import { supabase } from '@/lib/supabase'

export const reminderApi = {
  async set(params: {
    entityType: 'habit' | 'task'
    entityId: string
    localTime: string      // 'HH:mm'
    daysOfWeek: number[]
  }) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const nextFire = computeNextFireAt(params.localTime, params.daysOfWeek, timezone)

    const { error } = await supabase.from('reminders').upsert({
      entity_type:  params.entityType,
      entity_id:    params.entityId,
      local_time:   params.localTime,
      days_of_week: params.daysOfWeek,
      timezone,
      next_fire_at: nextFire.toISOString(),
      active:       true,
    }, { onConflict: 'entity_id' })

    if (error) throw error
  },

  async cancel(entityId: string) {
    await supabase.from('reminders').update({ active: false }).eq('entity_id', entityId)
  },
}

function computeNextFireAt(localTime: string, daysOfWeek: number[], timezone: string): Date {
  // Find the next datetime in the user's timezone that matches localTime + daysOfWeek
  const [hours, minutes] = localTime.split(':').map(Number)
  const now = new Date()

  for (let offset = 0; offset < 8; offset++) {
    const candidate = new Date(now)
    candidate.setDate(candidate.getDate() + offset)
    // Set the local time in the user's timezone
    const local = new Date(candidate.toLocaleString('en-US', { timeZone: timezone }))
    local.setHours(hours, minutes, 0, 0)

    if (daysOfWeek.includes(local.getDay()) && local > now) {
      return local
    }
  }
  return now // fallback
}
```

---

## Step 4 — Permission flow UX

**Rule: never ask for notification permission on first load.** Prompt only when the user sets a `reminderTime` on a habit or task.

In `src/routes/Editor.tsx` — after the form submits successfully:
```ts
if (formValues.reminderTime) {
  const permission = await requestPushPermission()
  if (permission === 'granted') {
    await subscribeToPush()
    await reminderApi.set({
      entityType: mode,
      entityId: savedId,
      localTime: formValues.reminderTime,
      daysOfWeek: habit ? (recurrence.daysOfWeek ?? [0,1,2,3,4,5,6]) : [new Date().getDay()],
    })
  }
}
```

Create `src/components/ReminderPermissionPrompt.tsx` — shown when:
- The user is on iOS AND
- The app is NOT installed yet AND
- The user has set a `reminderTime`

The prompt explains: "To receive reminders on iOS, you need to add this app to your Home Screen first." Show a visual guide (screenshot + arrows) with the steps: Share → Add to Home Screen. Only iOS needs this — Android and desktop Chrome work in-browser.

Detect iOS: `const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)`. Detect standalone: `window.matchMedia('(display-mode: standalone)').matches`.

```tsx
export function ReminderPermissionPrompt({ onDismiss }: { onDismiss: () => void }) {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  if (!isIOS || isStandalone) return null

  return (
    <Dialog open onOpenChange={onDismiss}>
      <DialogContent>
        <h2 className="font-bold text-lg">One more step for reminders on iOS</h2>
        <p className="text-sm text-slate-600 mt-2">
          To get push reminders on iPhone, add this app to your Home Screen first:
        </p>
        <ol className="mt-3 space-y-2 text-sm">
          <li>1. Tap the <strong>Share</strong> button (box with arrow) in Safari</li>
          <li>2. Tap <strong>"Add to Home Screen"</strong></li>
          <li>3. Open the app from your Home Screen</li>
          <li>4. Come back to this habit and tap "Enable reminders" again</li>
        </ol>
        <button onClick={onDismiss} className="mt-4 w-full btn-primary">Got it</button>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Step 5 — Scheduler Edge Function

This is the cron job that fires push notifications. Deploy as a Supabase Edge Function and invoke it on a schedule.

`supabase/functions/send-reminders/index.ts`:

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3'

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!   // service role — this is server-side only
  )

  const now = new Date()

  // Find all active reminders due in the past 5 minutes (to handle any delay)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60_000)

  const { data: reminders } = await supabase
    .from('reminders')
    .select('*, push_subscriptions(*)')
    .eq('active', true)
    .lte('next_fire_at', now.toISOString())
    .gte('next_fire_at', fiveMinutesAgo.toISOString())

  if (!reminders?.length) return new Response('No reminders due', { status: 200 })

  for (const reminder of reminders) {
    const subs = reminder.push_subscriptions as any[]
    if (!subs?.length) continue

    // Fetch the entity name
    const table = reminder.entity_type === 'habit' ? 'habits' : 'tasks'
    const { data: entity } = await supabase.from(table).select('title, icon').eq('id', reminder.entity_id).single()

    const payload = JSON.stringify({
      title: `${entity?.icon ?? '🎯'} ${entity?.title ?? 'Time to check in'}`,
      body:  'Tap to log your progress.',
      tag:   `${reminder.entity_type}_${reminder.entity_id}`,
      url:   `/${reminder.entity_type}s/${reminder.entity_id}`,
      entityId:   reminder.entity_id,
      entityType: reminder.entity_type,
    })

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch (err: any) {
        if (err.statusCode === 410) {
          // Subscription expired — remove it
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }

    // Advance next_fire_at to the next occurrence
    const nextFire = computeNextFireAt(reminder.local_time, reminder.days_of_week, reminder.timezone, now)
    await supabase.from('reminders').update({ next_fire_at: nextFire }).eq('id', reminder.id)
  }

  return new Response(`Processed ${reminders.length} reminders`, { status: 200 })
})

function computeNextFireAt(localTime: string, daysOfWeek: number[], timezone: string, after: Date): Date {
  const [hours, minutes] = localTime.split(':').map(Number)
  for (let offset = 1; offset <= 8; offset++) {
    const candidate = new Date(after)
    candidate.setDate(candidate.getDate() + offset)
    const local = new Date(candidate.toLocaleString('en-US', { timeZone: timezone }))
    local.setHours(hours, minutes, 0, 0)
    if (daysOfWeek.includes(local.getDay())) return local
  }
  return after
}
```

Deploy:
```bash
supabase functions deploy send-reminders
```

Schedule it every minute via Supabase's built-in cron (Dashboard → Database → Extensions → enable `pg_cron`, then):
```sql
select cron.schedule(
  'send-reminders',
  '* * * * *',
  $$
    select net.http_post(
      url := 'https://xxxx.supabase.co/functions/v1/send-reminders',
      headers := json_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
    )
  $$
);
```

---

## Step 6 — Quick-complete API route

For the "Mark done" notification action (handled in the SW without opening the app):

`supabase/functions/quick-complete/index.ts`:
```ts
// Authenticate the user via their session cookie,
// then write a HabitEntry (status: 'done') or update Task (status: 'done') in Postgres,
// and return 200. The next sync cycle on the client will pull this change.
```

Implementation is straightforward — follow the same auth pattern as sync-pull.

---

## Step 7 — Sign-out cleanup

In `authClient.signOut()`, also:
```ts
await unsubscribeFromPush()
await reminderApi.cancelAll()   // set active = false for all reminders belonging to this user
```

This prevents orphaned subscriptions from firing after sign-out.

---

## Step 8 — Quiet hours setting

Add to Settings page:

```
Notifications
  Quiet hours: [OFF] | [ON]
  From: [22:00]  To: [08:00]
```

Store in `settingsRepo` as `{ quietHoursEnabled, quietFrom, quietTo }`.

In the scheduler Edge Function, before sending a push, check if the current local time for that user's timezone falls within quiet hours. If so, skip sending and advance `next_fire_at` to after the quiet period ends.

---

## ✅ Phase 7 done when

- [ ] Set a reminder time on a habit → permission prompt appears only then (not on app load).
- [ ] Grant permission → push subscription saved to `push_subscriptions` table in Supabase.
- [ ] Wait for the reminder time → notification fires on Android Chrome (tab can be closed).
- [ ] Tap "Mark done" action → entry created without opening the app.
- [ ] Tap "Snooze 1h" → no notification for 1 hour, then fires again.
- [ ] Sign out → push subscription is removed from Supabase.
- [ ] iOS: attempting to enable reminders before installing shows the install guidance screen.
- [ ] iOS (after install to Home Screen): push works on iOS 16.4+.
- [ ] Quiet hours: notifications don't fire between 22:00 and 08:00 local time.
- [ ] Expired subscription (410 error from push service) → entry deleted from `push_subscriptions`.