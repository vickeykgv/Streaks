# Phase 8 — Polish
**Estimated time:** Day 15+  
**Goal:** Production-ready. Stats page, export/import, empty states, animations, onboarding, and accessibility. This phase has no new infrastructure — it's entirely about completeness and feel.

**Prerequisite:** Phases 1–7 complete — all features working.

---

## Step 1 — Stats page (`src/routes/Stats.tsx`)

Three sections, tab-based.

### Tab 1: Overview
- **Today's score**: large `{doneToday} / {totalToday}` ring chart.
- **7-day completion rate** per habit: horizontal bar chart (Recharts `BarChart`).
- **Current streaks**: top 5 habits by streak, ranked list with flame icon.
- **Mood / rating trend**: if any habits use `rating` type, a line chart for the last 30 days.

### Tab 2: History calendar heatmap
A GitHub-style contribution calendar for the last 90 days. Each cell is a day; color intensity = percentage of that day's habits completed (0% = grey, 25% = light green, 50% = medium, 100% = dark green).

Implementation:
```tsx
// 90 cells in a 13-column × 7-row grid (weeks × days)
// Use CSS grid with gap-0.5
// Each cell is a Radix Tooltip showing the date + "X of Y habits done"
```

Clicking a day opens a drawer/modal showing that day's habit entries.

### Tab 3: Per-habit deep dive
Select a habit from a dropdown. Show:
- Completion rate this week / this month / all time.
- Longest streak vs current streak.
- Average value (for count/numeric/duration/rating types).
- Last 90 days line chart (value over time) for quantitative types.
- Full history table: date, status, value, note.

---

## Step 2 — Export & Import

Implement the stubs left in Phase 3.

### Export (`src/lib/exportImport.ts`)
```ts
import { db } from '@/db/database'

export async function exportAll(): Promise<string> {
  const [habits, tasks, entries, tags, settings] = await Promise.all([
    db.habits.toArray(),
    db.tasks.toArray(),
    db.habitEntries.toArray(),
    db.tags.toArray(),
    db.settings.toArray(),
  ])

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { habits, tasks, entries, tags, settings },
  }

  return JSON.stringify(payload, null, 2)
}

export async function downloadExport(): Promise<void> {
  const json = await exportAll()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}
```

### Import
```ts
export async function importAll(json: string): Promise<{ imported: number, errors: string[] }> {
  const payload = JSON.parse(json)
  const errors: string[] = []

  if (payload.version !== 1) {
    throw new Error(`Unsupported export version: ${payload.version}`)
  }

  const { data } = payload
  let imported = 0

  // Use bulkPut — overwrites on conflict (last-import-wins)
  await db.transaction('rw', [db.habits, db.tasks, db.habitEntries, db.tags, db.settings], async () => {
    if (data.habits?.length)   { await db.habits.bulkPut(data.habits);       imported += data.habits.length }
    if (data.tasks?.length)    { await db.tasks.bulkPut(data.tasks);          imported += data.tasks.length }
    if (data.entries?.length)  { await db.habitEntries.bulkPut(data.entries); imported += data.entries.length }
    if (data.tags?.length)     { await db.tags.bulkPut(data.tags);            imported += data.tags.length }
    if (data.settings?.length) { await db.settings.bulkPut(data.settings) }
  })

  return { imported, errors }
}
```

Wire both to the Settings page buttons. For Import:
- Show a `<input type="file" accept=".json">` — no custom drag-drop needed.
- On file selected, read with `FileReader`, call `importAll(json)`.
- Show result toast: "✓ Imported 143 records" or error message.

---

## Step 3 — Onboarding (first-run experience)

Detect first run: check if `settingsRepo.get('onboardingDone', false)` is false.

Show a 3-step onboarding flow on first launch:

**Step 1 — Welcome**
```
🎯 Welcome to Habit Tracker
Track your habits and tasks with streaks,
reminders, and sync across devices.
[Get started]
```

**Step 2 — Create your first habit**
An inline demo: a pre-filled habit form with name "Drink 8 glasses of water" + count type + target 8. User can accept it or change it. Pressing "Add habit" creates it and advances to step 3.

**Step 3 — Enable reminders (optional)**
```
🔔 Get reminded daily
Set a reminder time to never forget.
[Enable reminders] [Skip for now]
```
Enable: calls `requestPushPermission()`. Skip: just moves on.

After onboarding: `settingsRepo.set('onboardingDone', true)`. Never show again.

---

## Step 4 — Empty states

Every list view needs a proper empty state component. An empty state includes: an illustration (SVG or large emoji), a headline, a sub-headline, and an action button.

| Screen | Headline | CTA |
|---|---|---|
| Dashboard — no habits | "Nothing scheduled today" | "Browse your habits" |
| Dashboard — all done | "All done! 🎉" | (confetti animation, no CTA) |
| Habits list (no habits) | "No habits yet" | "Add your first habit" |
| Tasks list (no tasks) | "No tasks" | "Add a task" |
| Stats (no data yet) | "Not enough data yet" | "Complete a few habits first" |
| Overdue section (empty) | "Nothing overdue ✓" | (no CTA — positive state) |

Create `src/components/EmptyState.tsx`:
```tsx
interface EmptyStateProps {
  icon: string
  headline: string
  subheadline?: string
  action?: { label: string; to: string }
}
```

---

## Step 5 — Animations and micro-interactions

Keep animations purposeful. Use Tailwind's `transition` utilities for most things; only reach for CSS keyframes for special cases.

### Required animations:
- **Habit card completion**: when status changes to `done`, animate a green wash across the card. Use `transition-colors duration-300`.
- **Streak badge**: pulse animation when streak > 7. `animate-pulse` from Tailwind.
- **Congratulations banner**: when `doneToday === totalToday && totalToday > 0`, show a banner with a confetti burst. Use a lightweight CSS-only confetti (a few `@keyframes` with colored squares falling). No library needed.
- **"+" FAB**: scale up slightly on mount (`scale-0 → scale-100` with `transition-transform duration-200`).
- **Tab transitions**: page content fades in (`opacity-0 → opacity-100`) on route change. Use React Router's `useLocation` and a `key` prop on the outlet.
- **Toast notifications**: slide in from bottom, slide out after 3 seconds.

### Avoid:
- Animating list reorders (complex, not worth it for v1).
- Animating number counters (distracting in a productivity app).
- Any animation longer than 300ms.

---

## Step 6 — Accessibility

Before shipping, verify:
- [ ] All interactive elements have visible focus rings (`focus-visible:ring-2`).
- [ ] All icon-only buttons have `aria-label`.
- [ ] Color is never the only means of conveying status (always pair with icon or text).
- [ ] Habit/task cards are keyboard-navigable (Tab → Enter to complete).
- [ ] MeasurementControl inputs have proper `<label>` associations.
- [ ] Modal dialogs trap focus (`Radix Dialog` handles this automatically).
- [ ] Reduced motion: wrap all animations in `@media (prefers-reduced-motion: no-preference)`.

---

## Step 7 — Performance audit

Run `npm run build` then serve `dist/` with `npm run preview`:

- Open Chrome DevTools → Performance → record a reload.
- Largest Contentful Paint (LCP) should be < 2.5s on a simulated mid-range device.
- No layout shifts (CLS = 0) — all image sizes declared in the manifest.
- Bundle size check: `npx vite-bundle-visualizer`. If any single chunk > 100kb, lazy-load it.

Likely optimizations needed:
- Lazy-load the Stats route (Recharts is large): `const Stats = lazy(() => import('./routes/Stats'))`
- Code-split by route: React Router + `React.lazy` for each route component.
- Ensure Dexie is not imported in the SW bundle (it's browser-only).

---

## Step 8 — Error boundaries and crash recovery

Wrap each route in a React Error Boundary. If a component crashes:
```tsx
<ErrorBoundary fallback={
  <div className="p-8 text-center">
    <p className="text-lg font-semibold">Something went wrong</p>
    <button onClick={() => window.location.reload()}>Reload</button>
  </div>
}>
  <Outlet />
</ErrorBoundary>
```

Also handle the case where IndexedDB is unavailable (private browsing in some browsers, storage quota exceeded):
- On DB open failure, show a top-level banner: "Storage unavailable. Data won't be saved. Try exiting private browsing mode."

---

## Step 9 — Final production checklist

### Code quality
- [ ] `npm run build` — zero TypeScript errors.
- [ ] `npm run test` — all unit tests pass.
- [ ] No `console.log` statements (only `console.error` in catch blocks).
- [ ] No `any` types in production code paths.

### PWA
- [ ] Lighthouse PWA: all green.
- [ ] Lighthouse Performance: ≥ 90 mobile.
- [ ] Lighthouse Accessibility: ≥ 95.
- [ ] Works offline (all routes).
- [ ] Update toast works on new deploy.

### Data
- [ ] Export → Import round-trip: data is identical.
- [ ] Clear all data: wipes IndexedDB, app returns to empty state.

### Sync
- [ ] Sync badge shows correct status.
- [ ] Dirty records clear after sync.
- [ ] Sign out → sign in on different device → data appears.

### Notifications
- [ ] Android push works in background.
- [ ] iOS push works from Home Screen.
- [ ] Quiet hours suppresses notifications.
- [ ] Sign out removes subscription.

### UX
- [ ] All empty states have CTAs.
- [ ] Onboarding runs on first launch, never again.
- [ ] No jarring layout shifts on load.
- [ ] Dark mode looks intentional, not just inverted.

---

## Deployment

**Frontend:** Deploy `dist/` to Vercel or Netlify.
- Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`.
- Enable HTTPS (required for PWA install + push).
- Set `Cache-Control: no-cache` on `index.html` so SW update detection works.

**Backend:** Already deployed on Supabase (Edge Functions + Postgres + cron).

**Domain:** A custom domain is strongly recommended for iOS install-to-home-screen — some users trust bare `vercel.app` domains less, and iOS may behave differently with generic subdomains.