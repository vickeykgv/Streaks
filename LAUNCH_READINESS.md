# Launch Readiness — MVP Research (All 3 Modules)

> Scope decision: the research validates **Habits/Tasks + Spending + Moto** together.
> That means every module must be data-safe before launch — including Moto, which
> currently is **not**. Assessment date: 2026-06-01.

---

## TL;DR

The app is in good shape structurally: clean production build, 69 passing unit
tests, no stray TODOs, a real PWA, a well-engineered last-write-wins sync engine,
and **Row-Level Security enabled on all server tables** (users cannot read each
other's data — the #1 silent multi-user killer is already handled).

**One blocker makes it unsafe to launch with all 3 modules: Moto has no backend
and loses data silently.** Fix that, add error visibility, and confirm auth
redirects, and this is launchable for a research cohort.

---

## P0 — Launch blockers (must fix before any external user)

### 1. Moto module: silent cross-device data loss  ✅ FIXED (2026-06-01)
**Resolution:** The fix code already existed locally but had never been deployed.
Applied to the live `Streaks` project (`wqyczvawzbfudvrlmuvg`):
- Migration `moto_tables` → 7 tables created, RLS enabled + `using/with check`
  policies, `(user_id, updated_at)` + `vehicle_id` indexes. Verified via `list_tables`
  (all 7 show `rls_enabled: true`) and `get_advisors` (no new security lints).
- `sync-push` deployed **v6** — now upserts all 7 moto tables.
- `sync-pull` deployed **v6** — now selects all 7 moto tables.
- Liveness: both endpoints return 401 (gateway live, no boot error).
- Schema probe: inserted a row with the exact columns `motoVehicleToServer` emits →
  accepted → deleted. Confirms the live schema matches the client payload shape.

**⚠️ One-time backfill needed for EXISTING local moto data.** Records created before this
fix were pushed to the old server, silently dropped, but still marked `dirty:false`
(falsely "synced"). `getDirtyRecords` only pushes `dirty===true`, so they will **never**
upload on their own — they're stranded on whatever device created them (likely your dev
device). Fresh research users are unaffected. To rescue existing data, run this **once per
device that already has moto data**, in the browser console on the app, then let it sync:
```js
const { db } = await import('/src/db/database.ts') // or use the app's db in DevTools
for (const t of [db.motoVehicles, db.motoFuelLogs, db.motoServices, db.motoParts,
                 db.motoIssues, db.motoNotes, db.motoDocuments]) {
  await t.toCollection().modify({ dirty: true })
}
```
(Do this *before* your round-trip test below, or device B will look empty and the fix
will appear to have failed.) Ask me if you'd prefer a guarded one-time auto-backfill in code.

**⚠️ Remaining manual verification (needs a signed-in session — I can't do this for you):**
- [ ] On device A: sign in, create a vehicle + a fuel log, wait for sync (green badge).
- [ ] On device B (or a fresh browser profile): sign in with the same account → confirm
      the vehicle + fuel log **hydrate**. This is the real proof the round-trip works.

**Original evidence (for the record):**
- Postgres has **no moto tables** (only habits, tasks, habit_entries, tags, and
  the 5 spending tables).
- `sync-push` edge fn (v5) destructures only habits/tasks/tags/spending — it
  **ignores all 7 moto keys** and still returns `{ ok: true }`.
- `sync-pull` edge fn (v5) likewise **never selects moto tables**.
- Client (`src/sync/engine.ts`, `src/sync/client.ts`) pushes & merges all 7 moto
  tables and, on the bogus `ok:true`, marks them `dirty:false` + `syncedAt`.

**Impact:** User logs vehicle/fuel/service data → sees "Synced ✓" → opens a 2nd
device or reinstalls → **all moto data is gone, permanently, with no error.**

**Fix:**
- [ ] Add 7 Postgres tables: `moto_vehicles`, `moto_fuel_logs`, `moto_services`,
      `moto_parts`, `moto_issues`, `moto_notes`, `moto_documents`.
      Each needs: `id` PK, `user_id`, `updated_at` (bigint, ms), `deleted_at`,
      and the module columns. Mirror the snake_case shape the serializers emit
      (`src/sync/serializers.ts`).
- [ ] Index `(user_id, updated_at)` on each (the pull query filters on both).
- [ ] Enable RLS + policy `user_id = auth.uid()` on all 7 (match existing tables).
- [ ] Extend `sync-push/index.ts`: destructure + `upsert(stamp(...))` the 7 tables.
- [ ] Extend `sync-pull/index.ts`: add 7 `.select('*').eq('user_id').gt('updated_at')`
      queries and return them under the matching `changes.moto*` keys.
- [ ] **Verify a real round-trip:** create moto data on device A → sync → fresh
      browser/profile on device B → sign in → confirm moto data hydrates.

### 2. Confirm Supabase Auth redirect URLs for the production domain  🔴 HARD BLOCKER
**Confirmed a blocker:** `SignIn.tsx` uses **sign-up with email confirmation** AND
**magic links** — both rely on the redirect URL. If the allowlist isn't set to the prod
domain, new research users who click their email link **cannot sign in (only you can).**
This is a dashboard action — no tool/API can verify or set it from here.
- [ ] Supabase Dashboard → Authentication → URL Configuration: set **Site URL** to the
      production URL (e.g. `https://vickeykgv.github.io/Streaks/`) and add it to
      **Redirect URLs** (include the trailing path GitHub Pages serves under).
- [ ] Test sign-up confirmation + magic-link end-to-end from a clean browser on the
      deployed URL — not localhost.
- [ ] (Optional) If email deliverability is shaky for research, password sign-in works
      without redirects; consider leading with that.

### 3. Verify push notifications actually fire (infra is live, untested end-to-end)
The `send-reminders` + `quick-complete` functions are deployed, the
`reminders` / `push_subscriptions` tables exist, and a **`pg_cron` job (jobid 2) runs
every minute** (`* * * * *`) calling `send-reminders` via `pg_net`. So the scheduler
is wired — verified 2026-06-01. What's left is a real end-to-end test:
- [ ] Confirm `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (and `VITE_VAPID_PUBLIC_KEY` in
      the client build) are set, and the subscribe flow writes a `push_subscriptions` row.
- [ ] Set a reminder, close the app, confirm a notification **actually arrives** (incl.
      iOS installed-to-home-screen path).
- [ ] If a real push can't be made to fire before launch → **hide the reminder-time UI**
      rather than ship a dead feature.
- [ ] Hygiene (not a blocker): the cron job hardcodes a `service_role` JWT in
      `cron.job.command`. Fine functionally; rotate/relocate to Vault if you tighten security.

---

## P1 — UI / UX (a stated top-three priority)

A Lighthouse run exists in the repo, **but it was taken against the Vite dev server**
(`http://192.168.0.107:5173/Streaks/`), so several scores are measurement artifacts,
not real problems. Triaged below.

> ⚠️ **The report is STALE** (a pre-fix dev-server run). Verified against current code:
> `<main>` landmark already exists (`AppShell.tsx:83`) and the meta description already
> exists (`index.html:7`). Those two findings are **already resolved**. Re-run before
> trusting anything else here.

**Real, actionable (independent of dev mode):**
- [x] **Color contrast — partially fixed (2026-06-01).** Computed WCAG AA ratios for the
      high-traffic token pairs. **Dark theme passes everything.** Light theme had failures
      (matches the recent light-theme commits). Fixed in `src/styles/tokens.css` (light only):
      `--color-overdue` / `--color-priority-high` #d51f2a→**#b00d16** (was 3.4:1; this also
      fixed the new sync-error pill in both themes), and `--text-tertiary` #998a83→**#79675f**
      (was 3.2:1). Re-verified: 4.76 / 6.98 / 5.20 — all pass.
- [ ] **Remaining contrast (light mode, needs component-level care):** red link *text* using
      `--color-brand-400` (#f55466, 3.2:1) and `--color-done` as text (#168f43, 4.0:1) still
      miss AA. These tokens double as borders/markers (where 3:1 is fine), so the fix is at
      text usage sites (use `--text-brand` for red link text), not a blind token change —
      left for a focused pass to avoid disrupting the in-flight theme refactor.
- [x] ~~Missing `<main>` landmark~~ — already present (`AppShell.tsx:83`).
- [x] ~~Missing meta description~~ — already present (`index.html:7`).
- [ ] **Console errors (Best Practices = 0 in stale report).** The new error log
      (`client_errors` table, see below) will now surface any real runtime errors with
      stack traces — check it after a test session.

**Re-measure before trusting these (dev-mode artifacts):**
- [ ] Performance scored **54, but on the dev server** — unminified/unbundled with HMR.
      Your prod build is minified + gzipped. **Re-run Lighthouse against `npm run build`
      → `npm run preview` (or the deployed GitHub Pages URL)** for a real number before
      deciding if perf needs work.
- [ ] "Does not use HTTPS" / "redirect to HTTPS" failures are because the test URL was
      `http://192.168…`. GitHub Pages serves HTTPS — these should pass in prod. Confirm.

Note: a11y overall already scores **94** — it's in good shape; the above are the few gaps.

## P1 — Production essentials (needed for a credible research run)

- [x] **Error visibility — DONE (2026-06-01).** Built a no-vendor error log:
      `client_errors` Supabase table (RLS: insert-only for anon+authenticated, no client
      reads), `src/lib/errorLog.ts` (guarded, de-duped), wired into `window.onerror` +
      `unhandledrejection` (`main.tsx`), the React `ErrorBoundary` (`componentDidCatch`),
      and the sync engine's catch. Verified: anon insert → 201, anon read → `[]` (blocked).
      **View errors:** Supabase Dashboard → Table Editor → `client_errors` (or SQL:
      `select * from client_errors order by created_at desc`).
      - Note: the insert policy is intentionally `with check (true)` so pre-sign-in crashes
        (e.g. the auth-redirect blocker) are captured. Supabase flags this as
        `rls_policy_always_true` (WARN) — **accepted for MVP**; harden post-launch by
        moving ingestion behind an edge function with rate limiting if abuse appears.
- [x] **Sync-error UX — DONE.** `SyncStatusBadge` error state is now a **visible**
      "Sync failed · Retry" pill (was icon-only) with a reassuring tooltip: "your changes
      are saved on this device and will retry automatically."
- [x] **Backup already discoverable.** `Settings.tsx` already exposes Export JSON, Export
      Moto JSON, Export transactions CSV, and Import. No work needed.
- [ ] **Enable leaked-password protection.** ⚠️ HANDOFF — Supabase security advisor flags
      it disabled (WARN). One toggle: Dashboard → Authentication → Policies/Settings.
      https://supabase.com/docs/guides/auth/password-security
- [ ] **First-run onboarding & empty states.** Verify `Onboarding.tsx` + empty states
      across all 3 modules read well for someone seeing the app cold.
- [x] **Product analytics — deferred** per decision (skip for v1; revisit post-launch).

---

## P2 — Polish (post-launch or if time allows)

- [x] **Test config — DONE (2026-06-01).** vitest was collecting copies of the suite
      from `.claude/worktrees/`, inflating the count to 153. Added
      `exclude: [...configDefaults.exclude, '**/.claude/**']` to `vitest.config.ts`.
      Real count is now **69 tests / 10 files**, all passing.
- [x] **Bundle size — CONFIRMED OK (2026-06-01).** recharts is imported only by the
      chart routes (moto Dashboard/Reports, spending Dashboard/Reports), and every one
      is `lazy()`-loaded in `App.tsx`. `Stats.tsx` imports no chart code. The build
      emits `CategoricalChart`/`CartesianChart` as separate chunks (not in `index`), so
      the ~287 KB only loads on chart routes. No change needed.
- [x] **Lighthouse — RE-MEASURED on prod (2026-06-01).** Ran against the deployed URL
      `https://vickeykgv.github.io/Streaks/` (desktop preset). The stale dev-server
      report was indeed artifacts: **Performance 97** (was 54), **Accessibility 100**,
      **Best Practices 100**, **SEO 100**. The old HTTPS/`<main>`/meta-description
      failures are all gone. Remaining perf diagnostics are GitHub Pages CDN cache-header
      behaviors (`uses-long-cache-ttl`, `cache-insight`) — out of app control. **No perf
      work needed.** (Deleted the stale `streaks app lighhouse report.txt` from scope.)
- [~] **Accessibility pass:** Lighthouse automated a11y = **100, zero failing audits**.
      Automated coverage is clean. Manual focus-order/label review + the light-mode
      contrast leftovers (red link *text* via `--color-brand-400`, `--color-done` as text
      — see P1) are the only remaining pieces; those are subjective/component-level and
      left for a focused pass.
- [x] **Timezone/DST — VERIFIED, no bug (2026-06-01).** The completion path
      (`MeasurementControl.tsx` → `entriesRepo.upsert(habit.id, today(), ...)`) keys
      entries off `today()` = `format(new Date(), 'yyyy-MM-dd')`, which is **local** time —
      so a 3am IST completion files under the correct local day. Grepped all of `src`:
      no `toISOString().slice(0,10)` UTC date keys exist; every date key uses local
      `format(...)`. Display parsing anchors at noon (`dates.ts`) so DST can't shift the
      day. Also removed the one raw-`Date` arithmetic in `addDaysFromToday` (CLAUDE.md
      rule) in favor of date-fns `addDays`.

---

## What's already solid (don't re-litigate)

- ✅ Clean `tsc -b && vite build`; no `any`-type or compile errors.
- ✅ Sync engine: in-progress guard, 30s timeouts, idempotent, correct LWW + tombstone
      merge. **LWW is the right model here (single-user-per-account) — do not add CRDTs.**
- ✅ RLS enabled on all 11 existing server tables.
- ✅ Spending sync works end-to-end (tables exist + both edge fns handle it).
- ✅ Export/Import covers all 16 tables incl. moto + a moto-only export + txn CSV.
- ✅ PWA: service worker, offline, install prompt, update toast.

---

## Caveat: UI is mid-refactor (uncommitted)

This assessment ran against a working tree with **~12 modified UI files** (Settings,
Stats, Tags, several moto routes, VehicleSwitcher) plus a **new untracked
`src/components/PageHeader.tsx`**. The build and tests pass against it, but the UI is
in an in-progress, uncommitted state — "is the UI good?" can't be fully answered until
this refactor is committed and stable. Commit or stash it before the launch polish pass
so you're hardening a known-good baseline.
