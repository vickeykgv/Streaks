# Habit Tracker PWA

## What this project is
A Progressive Web App for tracking recurring habits and one-off tasks with deadlines.
Full plan: see `PLAN.md`. Phase-by-phase execution guides: see `docs/phase-*.md`.

## Modules
The app is multi-module. Each module has its own nav items behind a top-of-nav module switcher, but shares auth, sync, and the design system.
- **Habits / Tasks** (module #1, current) — see `PLAN.md` and `docs/phase-*.md`.
- **Spending Tracker** (module #2, planned) — see `spending_tracker_plan.md` and `docs/spending-phase-*.md`.
- **Moto Logging** (module #3, planned) — see `moto_spending_implementation.md` and `docs/moto-phase-*.md`.

## Architecture rules (enforce always)
1. **No direct Dexie calls in components.** All DB access goes through `src/db/repos/`. If you need a query that doesn't exist in a repo, add it there.
2. **No business logic in components.** Recurrence, streaks, completion rules, merge logic all live in `src/lib/` or `src/sync/` as pure functions.
3. **Sync fields on every write.** Every repo create/update must set `updatedAt: Date.now()` and `dirty: true`. Never omit these.
4. **`ownerId` on creates.** Repo create methods must stamp `ownerId: useSession.getState().user?.id` when signed in.
5. **No `any` types.** Use `unknown` and narrow, or define a proper type.

## Tech stack
- React 18 + Vite + TypeScript
- Tailwind CSS (utility classes only, no custom CSS except CSS variables)
- React Router v6 (file-based routes in `src/routes/`)
- Dexie.js for IndexedDB (`src/db/`)
- Zustand for UI-only state (`src/store/`)
- date-fns for all date math (no raw `new Date()` arithmetic)
- React Hook Form + Zod for all forms
- Supabase JS client for auth + sync (`src/lib/supabase.ts`)
- vite-plugin-pwa (injectManifest strategy after Phase 4)

## Folder structure (abbreviated)
```
src/
  routes/      ← page components (one file per route)
  components/  ← reusable UI components
  db/
    database.ts          ← Dexie instance
    repos/               ← ALL DB access lives here
  lib/          ← pure business logic, no DB calls, fully unit-testable
  sync/         ← pull/push/merge engine
  auth/         ← session, sign-in/out
  push/         ← push subscription, reminder API
  store/        ← Zustand UI stores
  pwa/          ← SW registration, custom service worker
```

## Current phase
Check `docs/` for which phase to work on. Read the current phase file fully before writing any code.
Phase files: `docs/phase-1-foundation.md` through `docs/phase-8-polish.md`.

## Test command
```bash
npm run test        # vitest unit tests
npm run build       # TypeScript compile check
```

## Key invariants to never break
- App must work fully offline (no errors when DevTools network is set to Offline).
- Completing a habit must create/update a HabitEntry in IndexedDB — never modify the Habit record.
- `syncNow()` must be idempotent — calling it twice must not duplicate data.
- Push permission must never be requested on page load — only on user action (setting a reminderTime).
