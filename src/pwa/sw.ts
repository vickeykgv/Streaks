/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { createHandlerBoundToURL } from 'workbox-precaching'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope & typeof globalThis

// ─── Precache ──────────────────────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
clientsClaim()

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})

// ─── SPA fallback ──────────────────────────────────────────────────────────
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//, /^\/functions\//],
  })
)

// ─── Image cache ───────────────────────────────────────────────────────────
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  })
)

// ─── Font cache ────────────────────────────────────────────────────────────
registerRoute(
  ({ url }) => url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com'),
  new StaleWhileRevalidate({ cacheName: 'fonts' })
)

// ─── Background Sync ───────────────────────────────────────────────────────
self.addEventListener('sync', (event: Event & { tag: string; waitUntil: (p: Promise<unknown>) => void }) => {
  if (event.tag === 'habit-sync') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true }).then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SYNC_NOW' }))
      )
    )
  }
})

// ─── Push handler ──────────────────────────────────────────────────────────
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  const data = event.data.json() as {
    title: string
    body: string
    tag: string
    url: string
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

// ─── Notification click ────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  const { action } = event
  const { url, entityId, entityType } = (event.notification.data ?? {}) as {
    url: string
    entityId: string
    entityType: string
  }

  const focusOrOpen = (targetUrl: string) =>
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(targetUrl)
      } else {
        self.clients.openWindow(targetUrl)
      }
    })

  if (action === 'done') {
    // Post to an active client; it has the session and can write the entry.
    // Fall back to opening the app if no client is available.
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        const active = clients.find(c => c.url.includes(self.location.origin))
        if (active) {
          active.postMessage({ type: 'QUICK_COMPLETE', entityId, entityType })
          active.focus()
        } else {
          return self.clients.openWindow(url ?? '/')
        }
      })
    )
    return
  }

  if (action === 'snooze') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        const active = clients.find(c => c.url.includes(self.location.origin))
        if (active) {
          active.postMessage({ type: 'SNOOZE_REMINDER', entityId, entityType, minutes: 60 })
        }
      })
    )
    return
  }

  event.waitUntil(focusOrOpen(url ?? '/'))
})
