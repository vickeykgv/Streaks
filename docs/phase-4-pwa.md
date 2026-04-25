# Phase 4 — PWA Shell
**Estimated time:** Day 7  
**Goal:** The app is installable on mobile and desktop, works offline end-to-end, shows an update banner when a new version is deployed, and passes Lighthouse's PWA audit. No new features — this phase hardens the infrastructure.

**Prerequisite:** Phase 3 complete — working dashboard and completion loop.

---

## Step 1 — Icons

You need icons in multiple sizes. If you don't have a designer, use a single 512×512 SVG (the app's logo/icon) and auto-generate the rest.

Required files in `public/icons/`:
```
icon-72.png
icon-96.png
icon-128.png
icon-144.png
icon-152.png
icon-192.png
icon-384.png
icon-512.png
icon-maskable-192.png   ← same image but with safe-zone padding for Android
icon-maskable-512.png
apple-touch-icon.png    ← 180×180 for iOS
favicon.ico             ← 32×32
```

Simple approach: create an SVG icon at `src/assets/icon.svg`, then in a node script:
```bash
npm install -D sharp
node scripts/generate-icons.js
```

`scripts/generate-icons.js` — use `sharp` to resize the SVG to all required sizes.

For the maskable icon, add 10% padding around the icon so it looks good in all Android icon shapes.

---

## Step 2 — Web App Manifest

Create `public/manifest.webmanifest`:

```json
{
  "name": "Habit Tracker",
  "short_name": "Habits",
  "description": "Track your habits and tasks with streaks, reminders, and sync.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "categories": ["productivity", "lifestyle"],
  "icons": [
    { "src": "/icons/icon-72.png",  "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-96.png",  "sizes": "96x96",   "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Add Habit",
      "short_name": "New Habit",
      "url": "/new?type=habit",
      "icons": [{ "src": "/icons/icon-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Add Task",
      "short_name": "New Task",
      "url": "/new?type=task",
      "icons": [{ "src": "/icons/icon-96.png", "sizes": "96x96" }]
    }
  ]
}
```

Link it in `index.html`:
```html
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<meta name="theme-color" content="#6366f1" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Habits" />
```

---

## Step 3 — Vite PWA plugin config

Update `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',    // 'prompt' not 'autoUpdate' — we control the UI
      injectRegister: null,      // we register manually in src/pwa/registerSW.ts
      manifest: false,           // we have our own manifest.webmanifest

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // SPA fallback — serve index.html for any navigation
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],

        runtimeCaching: [
          {
            // Images: cache-first, expire after 30 days
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // Google Fonts and other CDN assets: stale-while-revalidate
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fonts' },
          },
        ],

        // Don't precache source maps in production
        dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
      },

      // Custom SW file — we'll add push handlers in Phase 7
      // strategies: 'injectManifest',
      // srcDir: 'src/pwa',
      // filename: 'sw.ts',
      // NOTE: switch to injectManifest in Phase 7 when custom SW handlers are needed.
      // For Phase 4, the generated SW is fine.
    }),
  ],
})
```

**Why `registerType: 'prompt'` instead of `'autoUpdate'`?**  
`autoUpdate` silently reloads the page on update, which can discard an in-progress timer (duration measurement). We instead show a "New version available — tap to update" toast and let the user choose when to reload.

---

## Step 4 — Manual SW registration

Create `src/pwa/registerSW.ts`:

```ts
import { registerSW } from 'virtual:pwa-register'

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | undefined

export function initServiceWorker(
  onUpdateAvailable: () => void
) {
  updateSWFn = registerSW({
    onNeedRefresh() {
      // New SW is waiting — notify the UI
      onUpdateAvailable()
    },
    onOfflineReady() {
      console.log('[SW] App ready to work offline')
    },
    onRegisteredSW(swUrl, registration) {
      // Check for updates every 60 minutes while the app is open
      setInterval(() => registration?.update(), 60 * 60 * 1000)
    },
  })
}

export function applyUpdate() {
  updateSWFn?.(true)   // reload page with new SW
}
```

Call `initServiceWorker` in `main.tsx`:
```tsx
import { initServiceWorker } from '@/pwa/registerSW'
import { useAppStore } from '@/store/appStore'

// Inside the root render or App.tsx, wire the callback:
initServiceWorker(() => {
  useAppStore.getState().setUpdateAvailable(true)
})
```

---

## Step 5 — Update toast

Create `src/components/UpdateToast.tsx`:

```tsx
import { applyUpdate } from '@/pwa/registerSW'
import { useAppStore } from '@/store/appStore'

export function UpdateToast() {
  const updateAvailable = useAppStore(s => s.updateAvailable)
  if (!updateAvailable) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-indigo-600 text-white
                    rounded-xl p-4 shadow-lg flex items-center justify-between">
      <span className="text-sm font-medium">New version available</span>
      <button
        onClick={applyUpdate}
        className="ml-4 text-sm font-semibold underline"
      >
        Update now
      </button>
    </div>
  )
}
```

Mount `<UpdateToast />` inside `AppShell` above the nav bar.

---

## Step 6 — Install prompt

Create `src/components/InstallPrompt.tsx`:

```tsx
import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('install-dismissed') === 'true'
  )

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const install = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'dismissed') {
      localStorage.setItem('install-dismissed', 'true')
      setDismissed(true)
    }
    setDeferredPrompt(null)
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-white dark:bg-slate-800
                    border border-slate-200 dark:border-slate-700
                    rounded-xl p-4 shadow-lg flex items-center gap-3">
      <span className="text-2xl">📲</span>
      <div className="flex-1">
        <p className="text-sm font-semibold">Install Habit Tracker</p>
        <p className="text-xs text-slate-500">Add to your home screen for the best experience</p>
      </div>
      <button onClick={install} className="text-sm font-semibold text-indigo-600">Install</button>
      <button onClick={() => setDismissed(true)} className="text-slate-400 text-xs">✕</button>
    </div>
  )
}
```

Mount in `AppShell`. The prompt only fires when the browser decides the install criteria are met (typically: SW registered, manifest present, user visited site twice).

---

## Step 7 — Zustand app store

Create `src/store/appStore.ts` — this holds UI-only state that needs to survive re-renders:

```ts
import { create } from 'zustand'

interface AppState {
  updateAvailable: boolean
  setUpdateAvailable: (v: boolean) => void
  isOnline: boolean
  setOnline: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  updateAvailable: false,
  setUpdateAvailable: (v) => set({ updateAvailable: v }),
  isOnline: navigator.onLine,
  setOnline: (v) => set({ isOnline: v }),
}))
```

Wire `isOnline` in `AppShell.tsx`:
```tsx
useEffect(() => {
  const onOnline  = () => useAppStore.getState().setOnline(true)
  const onOffline = () => useAppStore.getState().setOnline(false)
  window.addEventListener('online',  onOnline)
  window.addEventListener('offline', onOffline)
  return () => {
    window.removeEventListener('online',  onOnline)
    window.removeEventListener('offline', onOffline)
  }
}, [])
```

Show a small "Offline" pill in the header when `isOnline === false`. It's purely informational — the app still works fully.

---

## Step 8 — Verify offline behavior manually

1. Run `npm run build && npm run preview`.
2. Open Chrome DevTools → Network → select "Offline" throttle.
3. Reload the page — app should load from cache.
4. Navigate between tabs — all routes work.
5. Create a habit — it saves to IndexedDB.
6. Come back online (remove throttle) — no errors.

---

## Step 9 — Lighthouse audit

Run in Chrome:
1. DevTools → Lighthouse → select "Progressive Web App" → Generate report.

Target scores:
- Performance: ≥ 90
- PWA: all green checkmarks

Common fixes if PWA fails:
- Missing icon sizes → add them to manifest.
- `start_url` not cached → ensure Workbox precache covers `/`.
- Not HTTPS → Lighthouse PWA checks require HTTPS in production (localhost is exempt).

---

## ✅ Phase 4 done when

- [ ] Chrome DevTools → Application → Service Workers shows the SW as "Activated and is running".
- [ ] IndexedDB → HabitTrackerDB is present in Application tab.
- [ ] With DevTools network set to Offline: reload works, all routes work, creating data works.
- [ ] Build the app (`npm run build`), deploy to Vercel/Netlify, open on Android Chrome → "Add to Home Screen" prompt appears within a session or two.
- [ ] Install the app → launches in standalone mode (no browser chrome).
- [ ] App shortcuts ("Add Habit", "Add Task") work from the home screen long-press on Android.
- [ ] Update toast appears when you deploy a new build and reload (simulate by making a visible change, re-building, and hard-refreshing).
- [ ] Lighthouse PWA audit: all checkmarks green.
- [ ] `npm run build` produces no TypeScript errors.