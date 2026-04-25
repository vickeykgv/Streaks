# Habit Tracker PWA — Project Plan

## 1. Product Overview

A Progressive Web App for tracking **recurring habits** and **one-off tasks with deadlines**, with flexible measurement types (checkbox, counter, duration, etc.), tags, descriptions, and a dashboard that surfaces *today's* items for quick completion. Fully offline-capable with local-only storage.

**Core principles**
- **Local-first**: IndexedDB is the source of truth; the app is fully usable with no server.
- **Offline-first**: works with zero network via service worker.
- **Installable**: installable on mobile/desktop as a standalone app.
- **Fast mark-done flow**: the common case (opening app → ticking today's items) should take ≤ 2 taps.
- **Push reminders**: real OS-level notifications via the Push API + service worker, scheduled by a lightweight backend.
- **Optional cloud sync**: opt-in account-based sync so the same data follows the user across devices; the app still works fully without signing in.

---

## 2. Core Concepts / Data Model

Two primary entity types share a lot of structure but differ in recurrence:

### 2.1 Habit (recurring)
A thing the user wants to do on a schedule (daily, weekly, custom days).

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | primary key |
| `title` | string | required |
| `description` | string | optional, markdown allowed |
| `tags` | string[] | references Tag.id |
| `measurementType` | enum | `checkbox` \| `count` \| `duration` \| `numeric` \| `rating` |
| `target` | number? | e.g. 8 (glasses), 30 (minutes), 5 (rating) |
| `unit` | string? | e.g. "glasses", "min", "pages" |
| `recurrence` | object | see below |
| `startDate` | ISO date | when habit becomes active |
| `endDate` | ISO date? | optional end |
| `reminderTime` | "HH:mm"? | optional local-time reminder |
| `color` | string | hex for UI |
| `icon` | string | emoji or icon id |
| `archived` | boolean | soft-delete |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | used for sync conflict resolution |
| `deletedAt` | timestamp? | tombstone for sync (soft-delete) |
| `syncedAt` | timestamp? | last successful server ack |
| `dirty` | boolean | true if local changes pending upload |
| `ownerId` | string? | set when user is signed in |

**Recurrence object**
```
{
  type: "daily" | "weekly" | "custom",
  daysOfWeek?: number[],   // 0-6, for weekly/custom
  interval?: number         // e.g. every 2 days
}
```

### 2.2 Task (one-off with deadline)
A single to-do item with a due date.

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | |
| `title` | string | required |
| `description` | string | optional |
| `tags` | string[] | |
| `measurementType` | enum | same set as habits |
| `target` | number? | |
| `unit` | string? | |
| `dueDate` | ISO date | required |
| `dueTime` | "HH:mm"? | optional |
| `priority` | enum | `low` \| `med` \| `high` |
| `status` | enum | `pending` \| `done` \| `skipped` |
| `completedAt` | timestamp? | |
| `progress` | number? | for count/duration types |
| `color`, `icon` | | |
| `createdAt`, `updatedAt` | | `updatedAt` used for sync |
| `deletedAt`, `syncedAt`, `dirty`, `ownerId` | | sync metadata (same as Habit) |

### 2.3 HabitEntry (daily log)
One row per (habit, date). This is the source of truth for completion history.

| Field | Type |
|---|---|
| `id` | `${habitId}_${YYYY-MM-DD}` |
| `habitId` | string |
| `date` | ISO date (local) |
| `status` | `done` \| `partial` \| `skipped` \| `pending` |
| `value` | number (for count/duration types) |
| `note` | string? |
| `completedAt` | timestamp? |
| `updatedAt` | timestamp (for sync) |
| `syncedAt`, `dirty`, `deletedAt` | sync metadata |

### 2.4 Tag
| Field | Type |
|---|---|
| `id` | string |
| `name` | string (unique, case-insensitive) |
| `color` | string |

---

## 3. Measurement Types — Input UX

Each type drives a different completion control on the dashboard card:

| Type | Dashboard control | Example |
|---|---|---|
| `checkbox` | Single tap toggle ✅ | "Take vitamins" |
| `count` | `−` / `+` stepper vs target | "Drink 8 glasses of water" |
| `duration` | Start/stop timer + manual entry | "Meditate 20 min" |
| `numeric` | Number input | "Weigh in — kg" |
| `rating` | 1–5 star/emoji picker | "Mood today" |

Completion rules:
- `checkbox` → done on tap.
- `count` / `duration` / `numeric` → done when `value ≥ target` (if target set), otherwise done when any value recorded.
- `rating` → done once a rating is given.

---

## 4. Screens / Features

### 4.1 Dashboard (home `/`)
The landing screen. Sections, in order:

1. **World tab switcher** — Personal | Professional tabs. Filters all sections. Selection persists in localStorage.
2. **Header** — today's date, greeting, quick stats (X of Y done today, current streak).
3. **Overdue** (collapsible) — tasks past `dueDate` and still pending, filtered by active world.
4. **Today's Habits** (pending only) — habit cards whose recurrence matches today and are not yet complete.
5. **Today's Tasks** (pending only) — tasks with `dueDate === today` and `status === 'pending'`.
6. **Upcoming** (next 7 days, collapsible) — tasks due soon.
7. **Completed today** (collapsible, at bottom) — habits and tasks completed today. Checking/unchecking reverts completion so mistakes can be undone.
8. **Floating "+" button** — create habit or task, pre-seeded with the active world.

Each card shows: icon, title, progress control, tag chips, streak badge (habits only).

**World field**: Every Habit and Task has an optional `world: 'personal' | 'professional'` field (defaults to `'personal'` for records created before this field was added). Set in the Editor via the **Context** picker.

### 4.2 Habits list `/habits`
- Filter by tag, search by title, sort (name / streak / completion rate).
- Toggle archived view.
- Tap a habit → detail view.

### 4.3 Tasks list `/tasks`
- Tabs: `Pending` / `Done` / `All`.
- Filter by tag, priority, date range.
- Sort by due date (default), priority, created.

### 4.4 Habit/Task detail
- Full info, edit, archive/delete.
- Habit: history heatmap (last 90 days), streak, completion %.
- Task: progress bar if count/duration type, done/skip actions.

### 4.5 Create / Edit form
Shared form with mode switch at top: **Habit** vs **Task**.
Conditional fields:
- Habit → recurrence picker (Daily / specific weekdays / every N days), reminder time.
- Task → due date/time, priority.
- Both → title, description, tags (with autocomplete + create new), measurement type + target + unit, color, icon.

### 4.6 Tags `/tags`
CRUD for tag names and colors. Merge / rename.

### 4.7 Stats `/stats` (nice-to-have for v1)
- Completion rate per habit (7d, 30d, all-time).
- Heatmap calendar.
- Tag-based breakdown.

### 4.8 Settings `/settings`
- Theme (light / dark / system).
- Week start day.
- Data: **Export JSON**, **Import JSON**, **Clear all data**.
- About / version.

---

## 5. Tech Stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| Framework | **React + Vite** | Fast dev, easy PWA plugin |
| Language | TypeScript | type-safety for the data model |
| Routing | React Router | |
| State | Zustand or React Context + hooks | Lightweight, local-only app |
| Styling | Tailwind CSS | Quick, consistent UI |
| UI primitives | shadcn/ui or Radix | Accessible components |
| Local DB | **Dexie.js** (IndexedDB wrapper) | Schema, indexes, migrations, reactive queries via `useLiveQuery` |
| PWA / SW | **vite-plugin-pwa** (Workbox under the hood) | Manifest + SW generation |
| Dates | `date-fns` | small, immutable |
| IDs | `uuid` or `nanoid` | |
| Forms | React Hook Form + Zod | validation |
| Charts (stats) | Recharts | heatmap/trends |
| Backend | **Supabase** (Postgres + Auth + Edge Functions) | Fastest path for auth + sync + push scheduling |
| Push | `web-push` (server) + Push API (client) | Standard, cross-browser where supported |
| Scheduler | Supabase Edge Function on cron, or `node-cron` | Fires reminder pushes |

> Alternative if you prefer: Vue 3 + Pinia + Dexie, or Svelte + Dexie. Same architecture.

---

## 6. Storage Layer (IndexedDB via Dexie)

Define one Dexie DB with these object stores:

```
habits       — indexed by: id, archived, tags*
tasks        — indexed by: id, status, dueDate, tags*
habitEntries — indexed by: id, habitId, date, [habitId+date]
tags         — indexed by: id, name
settings     — single key-value store (theme, weekStart, etc.)
```

Versioning: use Dexie's `version(n).stores(...).upgrade(...)` so future schema changes migrate safely.

Data access goes through a **repository layer** (`src/db/repos/*.ts`) so UI never touches Dexie directly — easier to swap storage later and easier to test.

Reactive reads: use `useLiveQuery` so components update automatically on writes.

---

## 7. PWA & Offline Strategy

### 7.1 Manifest
`manifest.webmanifest` with: name, short_name, start_url `/`, display `standalone`, theme/background colors, icons (192, 512, maskable).

### 7.2 Service Worker (via vite-plugin-pwa / Workbox)

Caching strategies:
- **App shell** (HTML, JS, CSS, fonts, icons) → **precache** at install (Workbox `precacheAndRoute`).
- **Navigation requests** → serve `index.html` from cache (SPA fallback).
- **Images** → `CacheFirst` with expiration (30 days, max 50 entries).
- **Runtime assets** → `StaleWhileRevalidate`.

Update flow:
- Register SW with `registerType: 'autoUpdate'`.
- Show a toast "New version available — reload" when a new SW activates (Workbox `skipWaiting` + client notify).

### 7.3 Offline behavior
Because **all data is in IndexedDB**, the app is fully functional offline by default. No sync required for v1. Show a small "offline" indicator in the header if `navigator.onLine === false` — purely informational.

### 7.4 Install prompt
Capture `beforeinstallprompt`, stash the event, show a custom "Install app" button on the dashboard once (dismissible).

---

## 8. Push Notifications (Reminders)

Real reminders that fire even when the app is closed require the **Push API** (server-sent push that wakes the service worker). `setTimeout` / `Notification.schedule` alone don't survive tab close on most platforms, so we use a small backend to schedule pushes.

### 8.1 Permission flow
1. User creates a habit with `reminderTime` (or enables reminders in Settings).
2. App requests `Notification.requestPermission()` at that moment (never on first load — iOS especially penalizes premature prompts).
3. On grant → call `serviceWorkerRegistration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`.
4. POST the resulting `PushSubscription` to the backend along with the user's schedule.

### 8.2 Scheduling model
The backend holds a small table:

```
reminders
  id, userId, habitId|taskId, localTime ("HH:mm"),
  daysOfWeek[], timezone, pushSubscription, nextFireAt
```

A cron/worker scans `nextFireAt <= now()` every minute and sends a Web Push to matching subscriptions, then advances `nextFireAt`. Timezone is stored per subscription so "09:00" means 09:00 in the user's local time even if they travel.

### 8.3 Service worker handlers
In the SW file:

```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/192.png',
      badge: '/icons/badge.png',
      tag: data.tag,              // coalesces duplicates
      data: { url: data.url },    // e.g. /habits/abc
      actions: [
        { action: 'done', title: 'Mark done' },
        { action: 'snooze', title: 'Snooze 1h' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  if (event.action === 'done') {
    // Open hidden client + post message to mark done, or hit an API route
  }
  event.waitUntil(clients.openWindow(url));
});
```

### 8.4 Platform caveats
- **iOS**: Web Push only works for apps **installed to Home Screen** (iOS 16.4+). UI must guide users to "Add to Home Screen" first before prompting for notification permission.
- **Desktop / Android Chrome**: works in-browser once installed or even as a regular tab.
- **VAPID keys** generated once, public key shipped to the client, private key stays on the server.
- Respect quiet hours / Do Not Disturb — add a user setting for quiet-hours window.

### 8.5 Graceful fallback
If permission is denied or push is unsupported: show **in-app reminders** instead — a banner on the dashboard for any habit/task whose reminder time has passed today and is still pending.

### 8.6 Backend surface (minimal)
```
POST /api/push/subscribe    { subscription, timezone }
POST /api/push/unsubscribe  { endpoint }
POST /api/reminders         { habitId|taskId, localTime, daysOfWeek }
DELETE /api/reminders/:id
```
Backend tech: anything small — **Node + Fastify + `web-push` library**, or **Supabase Edge Functions**, or **Cloudflare Workers + Durable Objects** for the scheduler. See §9 for the concrete recommendation.

---

## 9. Cloud Sync (opt-in)

Sync is optional: the app is fully usable signed-out. Signing in turns on bidirectional sync so data follows the user across devices.

### 9.1 Model — last-write-wins with tombstones
Pragmatic and well-suited to a single-user-per-account app. CRDTs are overkill here.

- Every record has `updatedAt`, `syncedAt`, `dirty`, `deletedAt`.
- Writes locally: set `updatedAt = now()`, `dirty = true`.
- Deletes locally: set `deletedAt = now()`, `dirty = true` (tombstone kept until synced, then can be purged after a grace period).
- **Push**: upload all `dirty` records; on ack, clear `dirty` and set `syncedAt`.
- **Pull**: request records where `server.updatedAt > client.lastPulledAt`. Merge per record: **whichever side has the newer `updatedAt` wins** for the whole record. Tombstones always win if newer.

### 9.2 Sync protocol
```
POST /api/sync/pull   { lastPulledAt }
  → { serverTime, changes: { habits[], tasks[], entries[], tags[] } }

POST /api/sync/push   { changes: { habits[], tasks[], entries[], tags[] } }
  → { accepted: [...ids], conflicts: [...] }
```

Run **pull → merge → push** in that order. Use `serverTime` (not client clock) as the next `lastPulledAt` to avoid drift.

### 9.3 When to sync
- On app start (if signed in + online).
- After any local write (debounced 2–5s).
- Periodically while open (every 60s).
- On `online` event (coming back from offline).
- Optionally: **Background Sync API** (`sync` / `periodicsync` events in the SW) to flush dirty records when the OS next has network, even if the tab is closed.

### 9.4 Auth
- Email + password or magic link is fine for v1.
- Store short-lived access token in memory + refresh token in httpOnly cookie (or both in IndexedDB if pure SPA backend).
- On sign-out: keep local data (don't wipe), just stop syncing.
- On sign-in on a fresh device: full pull, then hydrate IndexedDB.

### 9.5 Backend recommendation
**Supabase** is the shortest path for this shape of app:
- Postgres tables mirroring the client schema, with `user_id` column + Row-Level Security.
- Built-in auth (email/password, magic link, OAuth).
- Edge Functions for the push-notification scheduler and `web-push` dispatch.
- Realtime subscriptions as a nice-to-have upgrade later (swap polling sync for live updates).

Alternative if you want to own the stack: **Node/Fastify + Postgres + web-push + node-cron**.

### 9.6 Conflict UX
With last-write-wins most conflicts are invisible. For the rare case where a user edits the same habit on two offline devices: the later `updatedAt` wins silently. If you want to be fancier later, keep a `history` table server-side so a user can "restore a previous version".

### 9.7 Data ownership & privacy
- Sign-out option: **Export then wipe local data**.
- Delete account: cascade delete on server + wipe local.
- Encrypt at rest is Postgres-level; end-to-end encryption is a stretch goal and would complicate sync — skip for v1.

---

## 10. Business Logic — Key Functions

Centralize these in `src/lib/` so they're unit-testable:

- `getHabitsDueOn(date, habits)` — filters habits by recurrence rule.
- `getTasksDueOn(date, tasks)` and `getOverdueTasks(today, tasks)`.
- `computeStreak(habitId, entries)` — current + longest streak.
- `computeCompletionRate(habitId, entries, range)`.
- `isEntryComplete(entry, habit)` — applies measurement-type rules.
- `upsertEntryForToday(habitId, patch)` — creates or updates today's entry.
- `exportAll()` / `importAll(json)` — JSON dump of all stores with a version field.
- `syncNow()` — runs pull → merge → push; idempotent; no-op if signed out.
- `scheduleReminder(entity)` / `cancelReminder(entityId)` — calls backend reminder API.

---

## 11. Folder Structure

```
src/
  main.tsx
  App.tsx
  routes/
    Dashboard.tsx
    Habits.tsx
    HabitDetail.tsx
    Tasks.tsx
    TaskDetail.tsx
    Editor.tsx           // shared create/edit form
    Tags.tsx
    Stats.tsx
    Settings.tsx
    SignIn.tsx           // optional: enables sync + push
  components/
    HabitCard.tsx
    TaskCard.tsx
    MeasurementControl.tsx
    TagChip.tsx
    RecurrencePicker.tsx
    EmptyState.tsx
    InstallPrompt.tsx
    UpdateToast.tsx
    ReminderPermissionPrompt.tsx
    SyncStatusBadge.tsx
  db/
    database.ts           // Dexie instance + schema
    repos/
      habits.ts
      tasks.ts
      entries.ts
      tags.ts
      settings.ts
  lib/
    dates.ts
    recurrence.ts
    streaks.ts
    measurement.ts
    exportImport.ts
  sync/
    client.ts             // pull/push API calls
    engine.ts             // merge logic, debounced sync loop
    conflicts.ts
  auth/
    client.ts             // sign-in / sign-out / session
    session.ts            // token storage + refresh
  push/
    subscribe.ts          // permission + pushManager.subscribe
    api.ts                // talk to /api/reminders
  store/                  // Zustand stores (UI state only)
  styles/
  pwa/
    registerSW.ts
    sw.ts                 // custom SW: push + notificationclick + bg-sync

server/                   // separate deploy (Supabase functions or Node)
  routes/
    sync.ts
    reminders.ts
    push.ts
    auth.ts
  scheduler/
    cron.ts               // scans reminders, sends web-push

public/
  icons/
  manifest.webmanifest
```

---

## 12. Build Phases (suggested order)

**Phase 1 — Foundation (Day 1–2)**
- Scaffold Vite + React + TS + Tailwind + Router.
- Set up Dexie schema (with sync fields from day 1), repos, seed data.
- Layout shell, navigation, theme.

**Phase 2 — CRUD (Day 3–4)**
- Editor form (habit/task toggle).
- Habits list, Tasks list, detail pages.
- Tags management.

**Phase 3 — Dashboard & Completion (Day 5–6)**
- Dashboard with today's habits + tasks + overdue.
- Measurement controls (checkbox, count, duration, numeric, rating).
- `HabitEntry` writes + streak calculation.

**Phase 4 — PWA shell (Day 7)**
- `vite-plugin-pwa` config, manifest, icons.
- Service worker precaching + update toast.
- Verify offline behavior end-to-end.

**Phase 5 — Backend + Auth (Day 8–9)**
- Stand up Supabase (or Node/Fastify + Postgres).
- Schema mirroring client + RLS policies.
- Sign-up / sign-in / session in the client.

**Phase 6 — Sync engine (Day 10–12)**
- Implement pull/push endpoints and client sync engine.
- Debounced auto-sync + sync-status UI badge.
- Background Sync API registration in the SW.
- Test: edit offline on device A, sign in on B, see changes.

**Phase 7 — Push notifications (Day 13–14)**
- VAPID key setup, backend `web-push` integration.
- Client permission flow + subscription upload.
- SW `push` + `notificationclick` handlers.
- Reminder scheduler cron.
- iOS install-to-home-screen guidance flow.

**Phase 8 — Polish (Day 15+)**
- Stats page + heatmap.
- Export / Import.
- Quiet hours, snooze actions on notifications.
- Empty states, animations, onboarding.

---

## 13. Testing Checklist

**Core**
- [ ] Create habits of each measurement type; verify today's dashboard shows the right control.
- [ ] Weekly habit on Mon/Wed/Fri only shows on those days.
- [ ] Marking done writes a `HabitEntry` and updates streak.
- [ ] Task overdue appears in Overdue section.
- [ ] Close all network, reload app — still works.
- [ ] Install as PWA on Android/iOS/desktop; launches standalone.
- [ ] Export → clear data → Import → everything restored.
- [ ] Update the app, reload — update toast appears.
- [ ] Timezone/DST: create entry late at night, check it counts for today.

**Sync**
- [ ] Sign in on fresh device → full pull hydrates IndexedDB.
- [ ] Create habit offline → goes online → uploads cleanly.
- [ ] Edit same habit on two offline devices → later `updatedAt` wins; no data corruption.
- [ ] Delete on device A → tombstone propagates to device B.
- [ ] Sign out keeps local data; sign in on same device doesn't duplicate.
- [ ] Sync loop is idempotent (running `syncNow()` twice is a no-op the second time).

**Push**
- [ ] Permission prompt only appears on user action, never on first load.
- [ ] Reminder at 09:00 local fires at 09:00 after traveling across a timezone.
- [ ] Notification "Mark done" action updates the entry without opening UI.
- [ ] iOS: flow works only after install-to-home-screen; pre-install is clearly guided.
- [ ] Unsubscribe on sign-out; no orphaned subscriptions firing.
- [ ] Quiet hours suppress notifications in-window.

---

## 14. Open Questions (confirm before building)

1. Single-user per account, or should one account support **multi-profile** (e.g. couples, family)?
2. Backend choice: **Supabase** (recommended, fastest) vs self-hosted Node/Postgres vs Cloudflare Workers?
3. Do you want **sub-tasks** / checklists inside a single task, or keep tasks flat?
4. Sign-in methods: email+password, magic link, Google OAuth — which for v1?
5. Target platforms priority: mobile-first only, or equal desktop polish?
6. Notification actions: just "Mark done" + "Snooze", or richer (e.g. "Log value")?

---

## 15. Stretch Ideas (post-v1)

- Natural-language quick add ("read 20 pages every weekday at 9pm").
- Widgets (home screen summary via `launch_handler` + shortcuts).
- Drag-to-reorder dashboard.
- Habit templates gallery.
- Encrypted export / end-to-end encryption for sync.
- Realtime sync via Supabase Realtime (replaces polling loop).
- Shared habits (accountability partners).
- Apple Watch / Wear OS companion via web share targets.