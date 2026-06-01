# Moto Logging — Implementation Plan

> **Status:** M0 ✅ M1 ✅ M2 ✅ — Vehicles CRUD + modal pattern shipped. Next: M3 (Fuel logging).
> **Owner:** vickeykgv
> **Related docs:** [`PLAN.md`](./PLAN.md) (Habit Tracker master plan), [`spending_tracker_plan.md`](./spending_tracker_plan.md) (Module #2), [`CLAUDE.md`](./CLAUDE.md) (architecture rules).

---

## Context

The Habit Tracker PWA is evolving into a multi-module personal-life app. Today it ships **Module #1 Habits/Tasks** and **Module #2 Spending Tracker**. This plan adds **Module #3: Moto Logging** — a handy, modern logger for vehicle owners.

**Why:** Vehicle owners need an offline-first, mobile-friendly place to capture fuel fills, services, spare-part changes, problems noted on the road, and document renewals (insurance, driving license). Today they juggle notes apps, paper receipts, and SMS reminders. Moto gives them one source of truth with reports that answer: *"What is my real cost per km? When is the next service due? What problems are pending for the next visit?"*

**Scope locked with user:**
- **Multi-vehicle** support (bike, car, scooter — switcher inside the module).
- **Isolated** from Spending Tracker in v1 (no auto-mirroring; Moto has its own cost analytics).
- **Document reminders in v1:** Insurance expiry + Driver's License renewal only. (RC, road tax, PUC deferred to v2.)
- **Units:** Metric default (km / L / INR), user-switchable in Settings. Stored canonically as metric.
- **Add UX:** **Every add/edit is a modal/bottom-sheet** (`Modal` on desktop, `BottomSheet` on mobile) — no dedicated full-page editor routes. This is the key UX difference from the Spending module.

Shared with existing modules: Supabase auth, sync engine, design system, all UI primitives, toast/undo, RHF + Zod form pattern.

---

## 1. Decisions locked in

| Question | Decision |
|---|---|
| Module navigation | Reuse existing `ModuleSwitcher` (top of `SideNav` / `BottomNav`). Add `'moto'` to `ActiveModule`. |
| Vehicles | Multi-vehicle. A `VehicleSwitcher` inside the module scopes every screen to one active vehicle (`useMoto.activeVehicleId`). |
| Editor UX | Modal-based — `Modal` on `md+`, `BottomSheet` on mobile. No `/moto/new` route; modals are opened from FAB / row click and managed by `useMotoEditor` Zustand store. |
| Coupling to Spending | Isolated in v1. Moto stores its own expenses. A "Mirror to Spending" toggle is parked for v2. |
| Documents in v1 | Insurance + DL only. PUC / RC / road tax deferred. |
| Units | `unitSystem: 'metric' \| 'imperial'` in Settings. Stored as metric; conversion is a presentation-layer pure function. |
| Currency | Reuse the base-currency setting already added by Spending module. |
| Reports | Cost/km, monthly spend split (fuel / service / parts / other), service interval timeline, fuel-efficiency trend. |

---

## 2. Architecture overview

### 2.1 Module switcher integration
- `src/store/module.ts` → extend `ActiveModule` type to `'habits' \| 'spending' \| 'moto'`.
- `src/components/ModuleSwitcher.tsx` → add Moto chip.
- `src/components/SideNav.tsx` / `BottomNav.tsx` → add `motoMainItems` array, conditional on `activeModule === 'moto'`.

### 2.2 Routes (all `/moto/*` — flat, no editor sub-routes)
- `/moto` — **Dashboard** (active vehicle's snapshot)
- `/moto/vehicles` — Garage / vehicle list
- `/moto/fuel` — Fuel log history + filters
- `/moto/service` — Service & maintenance history
- `/moto/parts` — Spare parts replacements log
- `/moto/issues` — Open problems / to-fix list
- `/moto/notes` — Free-form notes per vehicle
- `/moto/documents` — Insurance + DL expiry tracker
- `/moto/reports` — Analytics

No `/new` / `/edit/:id` routes — all CRUD is modal-driven from the page that owns it.

### 2.3 Modal-driven editor pattern (new)
- `src/store/motoEditor.ts` — Zustand store:
  ```ts
  type MotoEditorState =
    | { kind: 'closed' }
    | { kind: 'vehicle';  id?: string }
    | { kind: 'fuel';     id?: string; vehicleId: string }
    | { kind: 'service';  id?: string; vehicleId: string }
    | { kind: 'part';     id?: string; vehicleId: string }
    | { kind: 'issue';    id?: string; vehicleId: string }
    | { kind: 'note';     id?: string; vehicleId: string }
    | { kind: 'document'; id?: string; vehicleId?: string };
  ```
- `src/components/moto/MotoEditorHost.tsx` — single mount point in `AppShell`; renders the right modal component based on store state. Uses `Modal` at `md+`, `BottomSheet` on mobile via a `useIsMobile()` hook.
- Each editor component (`VehicleEditor.tsx`, `FuelLogEditor.tsx`, …) is a self-contained RHF + Zod form rendered inside the host. No routing involved.
- FABs and row clicks call `useMotoEditor.getState().open({ kind: 'fuel', vehicleId })`.

### 2.4 Data model (Dexie v5)

All entities follow the existing sync convention: `id` (nanoid), `ownerId`, `createdAt`, `updatedAt`, `deletedAt?`, `syncedAt?`, `dirty`.

**`motoVehicles`** — `id, archived, dirty, updatedAt, ownerId`
- `name` (nickname), `make`, `model`, `year`, `registrationNo`, `vehicleType: 'bike' \| 'car' \| 'scooter' \| 'other'`, `fuelType: 'petrol' \| 'diesel' \| 'cng' \| 'electric' \| 'hybrid'`, `tankCapacityL?`, `purchaseDate?`, `purchaseOdoKm?`, `currentOdoKm`, `color`, `photo?` (data URL, deferred to v2 if Storage not ready), `archived`

**`motoFuelLogs`** — `id, vehicleId, date, dirty, updatedAt, ownerId`
- `vehicleId`, `date` (ISO), `odoKm`, `litres`, `pricePerL`, `totalCost`, `fuelType`, `station?`, `fullTank: boolean`, `note?`
- Derived `kmpl` computed in `src/lib/moto/fuelEfficiency.ts` (pure function over a sorted history).

**`motoServices`** — `id, vehicleId, date, dirty, updatedAt, ownerId`
- `vehicleId`, `date`, `odoKm`, `serviceType: 'general' \| 'oil_change' \| 'tire' \| 'brake' \| 'battery' \| 'major' \| 'other'`, `workshop?`, `laborCost`, `partsCost`, `totalCost`, `nextDueDate?`, `nextDueOdoKm?`, `note?`, `linkedIssueIds: string[]` (issues closed by this service)

**`motoParts`** — `id, vehicleId, installedAt, dirty, updatedAt, ownerId`
- `vehicleId`, `partName`, `partNumber?`, `brand?`, `installedAt` (ISO), `odoKmAtInstall`, `cost`, `expectedLifeKm?`, `expectedLifeMonths?`, `linkedServiceId?`, `note?`
- Derived "due" badge in `src/lib/moto/partsLife.ts`.

**`motoIssues`** — `id, vehicleId, status, priority, dirty, updatedAt, ownerId`
- `vehicleId`, `title`, `description?`, `status: 'open' \| 'resolved'`, `priority: 'low' \| 'medium' \| 'high'`, `reportedAt`, `resolvedAt?`, `resolvedByServiceId?`

**`motoNotes`** — `id, vehicleId, dirty, updatedAt, ownerId`
- `vehicleId`, `title?`, `body`, `pinned: boolean`

**`motoDocuments`** — `id, vehicleId, type, expiryDate, dirty, updatedAt, ownerId`
- `vehicleId?` (null for DL — personal), `type: 'insurance' \| 'driving_license'`, `provider?`, `policyNo?` (DL number for DL), `issuedDate?`, `expiryDate`, `premium?`, `reminderDaysBefore: number` (default 30), `note?`

### 2.5 Sync
All seven new entities register through the existing `pullChanges → mergeIntoTable → getDirtyRecords → pushChanges` engine. Phase M10 extends `serializers.ts`, `engine.ts`, the Supabase schema (`moto_tables.sql`), and adds branches to the existing Edge Functions (`/sync/pull`, `/sync/push`).

### 2.6 Reuse map
- `ModuleSwitcher`, `BottomNav`, `SideNav` — unchanged shells; add moto items.
- `Modal`, `BottomSheet`, `Button`, `Input`, `Select`, `DatePicker`, `Textarea`, `Card`, `EmptyState`, `ConfirmDialog`, `Toast`, `IconPicker`, `ColorPicker`, `ProgressBar`, `Badge` — all reused as-is.
- RHF + Zod editor pattern from `TransactionEditor.tsx` → moto editor components.
- `useSpendingDashboard` shape → `useMotoDashboard`.
- Repo conventions (ownerId, dirty/updatedAt, soft-delete, `scheduleSyncSoon()`) → all moto repos.
- Base-currency setting from Spending — reused for cost fields.
- Existing reminder/notification plumbing (`src/push/`) → document expiry reminders.

---

## 3. Phased rollout

| Phase | Title | Estimate | Goal |
|---|---|---|---|
| **M0** | Module switcher + scaffolding | ~0.5 d | `'moto'` added to `ActiveModule`; `/moto/*` routes render placeholders; switcher shows three modules. |
| **M1** | Data layer + types + unit setting | ~1 d | Dexie v5 with 7 stores, all repos, `src/types/moto.ts`, `unitSystem` setting, unit-conversion pure fns. |
| **M2** | Vehicles CRUD (modal-driven) | ~1 d | Garage page + `VehicleEditor` modal + `MotoEditorHost`. Active-vehicle Zustand + `VehicleSwitcher`. |
| **M3** | Fuel logging | ~1 d | Fuel page, `FuelLogEditor` modal, kmpl derivation, recent fills card. |
| **M4** | Services + spare parts | ~1.5 d | Service log, parts log, link parts ↔ service, next-due-by-date / next-due-by-odo. |
| **M5** | Issues / problems to fix | ~0.5 d | Open issues list, modal editor, "resolved by service" linking. |
| **M6** | Notes per vehicle | ~0.5 d | Notes list, pinning, modal editor. |
| **M7** | Documents + reminders | ~1 d | Insurance + DL tracker, status chip (Valid / Expiring / Expired), push reminder at `reminderDaysBefore`. |
| **M8** | Moto Dashboard | ~1 d | Active vehicle snapshot: current odo, last fuel, last service, open issues, next-due banner, expiring docs. |
| **M9** | Reports & analytics | ~1.5 d | Cost/km, monthly spend split (recharts pie + bar), fuel-efficiency trend line, service interval timeline. |
| **M10** | Sync + Backend | ~1 d | `moto_tables.sql`, serializers, engine wiring, Edge Function branches, end-to-end sync test. |
| **M11** | Export / Import + Polish | ~0.5 d | JSON export/import for moto; skeleton loaders; empty states; reduced-motion safe. |

**Total estimate:** ~11 working days end-to-end.

Acceptance criteria for each phase live in `docs/moto-phase-M.md` (created at the start of each phase, mirroring `docs/phase-*.md` style).

---

## 4. Critical files

### New files
- `moto_spending_implementation.md` (root — this plan)
- `docs/moto-phase-0.md` … `docs/moto-phase-11.md`
- `src/types/moto.ts`
- `src/db/repos/moto/{vehicles,fuelLogs,services,parts,issues,notes,documents}.ts`
- `src/lib/moto/{fuelEfficiency,partsLife,serviceDue,reports,filters,units,documentStatus}.ts`
- `src/lib/schemas/moto.ts` (Zod schemas, one per entity)
- `src/store/moto.ts` (`activeVehicleId`, `unitSystem` selector)
- `src/store/motoEditor.ts` (editor modal state — see §2.3)
- `src/components/moto/MotoEditorHost.tsx`
- `src/components/moto/VehicleSwitcher.tsx`
- `src/components/moto/editors/{VehicleEditor,FuelLogEditor,ServiceEditor,PartEditor,IssueEditor,NoteEditor,DocumentEditor}.tsx`
- `src/components/moto/cards/{VehicleSnapshotCard,LastFuelCard,NextServiceCard,OpenIssuesCard,ExpiringDocsCard}.tsx`
- `src/routes/moto/{Dashboard,Vehicles,Fuel,Service,Parts,Issues,Notes,Documents,Reports}.tsx`
- `src/hooks/useMotoDashboard.ts`
- `src/hooks/useIsMobile.ts` (if not already present — used by `MotoEditorHost`)
- `supabase/moto_tables.sql`

### Modified files
- `CLAUDE.md` — add Module #3 bullet + pointer to `moto_spending_implementation.md` and `docs/moto-phase-*.md`.
- `PLAN.md` — pointer to this plan.
- `src/store/module.ts` — extend `ActiveModule` to include `'moto'`.
- `src/components/ModuleSwitcher.tsx` — add Moto entry.
- `src/components/SideNav.tsx`, `src/components/BottomNav.tsx` — add `motoMainItems` and conditional rendering.
- `src/components/AppShell.tsx` — mount `<MotoEditorHost />` once.
- `src/App.tsx` — register `/moto/*` routes.
- `src/db/database.ts` — bump to v5; add 7 moto stores with indexes.
- `src/sync/serializers.ts`, `src/sync/engine.ts` — register moto entities (camelCase ↔ snake_case).
- `src/routes/Settings.tsx` — add `unitSystem` toggle + Moto export/import.
- `supabase/functions/sync-pull/index.ts`, `supabase/functions/sync-push/index.ts` — add moto branches.

---

## 5. Architecture rules (apply to all moto code)

Same as the project's master rules in `CLAUDE.md`:

1. **No direct Dexie calls in components.** Use `src/db/repos/moto/*`.
2. **No business logic in components.** Fuel efficiency, parts life, service-due, report aggregation all live in `src/lib/moto/` as pure functions.
3. **Sync fields on every write.** `updatedAt: Date.now()` and `dirty: true`.
4. **`ownerId` on creates.** `useSession.getState().user?.id`.
5. **No `any` types.**
6. **Modal-only adds.** No `/moto/new` or `/moto/edit/:id` routes. All CRUD opens through `useMotoEditor`.
7. **Units stored as metric.** Imperial is a presentation concern handled by `src/lib/moto/units.ts`.

---

## 6. Verification per phase

After each phase:

1. `npm run build` — TypeScript compiles cleanly.
2. `npm run test` — unit tests pass (each `src/lib/moto/*` function gets a Vitest spec).
3. Manual smoke: switch to Moto module, exercise the phase's feature, refresh — verify persistence; modal opens/closes cleanly on both desktop (`md+`) and mobile widths.
4. After M7: set a reminder, verify push fires at the expected lead time.
5. After M10: sign in on a second profile, confirm cross-device moto sync; run sync twice — verify idempotence.
6. After M11: DevTools → Network Offline — every moto screen continues to work.

---

## 7. Open items / parking lot (v2)

- **Photo attachments** for vehicles, fuel receipts, documents — needs Supabase Storage policy work.
- **Auto-mirror to Spending module** — opt-in toggle to write fuel/service costs as Spending transactions.
- **Additional document types**: RC, road tax, PUC, fitness certificate.
- **OCR fuel receipts** — capture pricePerL + litres from a photo.
- **Geo-tagged fuel stations** + nearest-station suggestions.
- **Trip / odometer auto-tracking** via PWA Geolocation.
- **Multi-driver per vehicle** (family car shared between users).
- **CSV export** of fuel + service for tax / reimbursement.
