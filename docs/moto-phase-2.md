# Phase M2 — Vehicles CRUD (Modal-driven)

**Estimated time:** ~1 day
**Goal:** Full add/edit/archive for vehicles. Introduces the `useMotoEditor` Zustand store, the `MotoEditorHost` mounted once in `AppShell`, and the in-module `VehicleSwitcher` that scopes every page to an active vehicle. After this phase the Garage page is fully functional.

Plan reference: `moto_spending_implementation.md` §2.3 (modal pattern).

---

## What ships in M2

### 1. `src/hooks/useIsMobile.ts`
Shared hook that returns `true` when viewport < `lg` (1024 px). Used by `MotoEditorHost` to choose `Modal` vs `BottomSheet`. Mirrors the inline `isDesktop` state already in several Spending pages but extracted as a reusable hook.

### 2. `src/store/moto.ts`
Zustand store persisted to `localStorage('moto-active-vehicle')`:
```ts
{ activeVehicleId: string | null; setActiveVehicle: (id: string | null) => void }
```

### 3. `src/store/motoEditor.ts`
Zustand store (no persistence) for modal state:
```ts
type MotoEditorState =
  | { kind: 'closed' }
  | { kind: 'vehicle'; id?: string }
  // future: fuel, service, part, issue, note, document
```
Exported: `useMotoEditor`, `openMotoEditor(state)`, `closeMotoEditor()`

### 4. `src/lib/schemas/moto.ts`
Zod schemas for every moto entity form (vehicle schema ships now; others added per phase):
- `vehicleSchema` → `VehicleFormValues`

### 5. `src/components/moto/editors/VehicleEditor.tsx`
Embedded-only RHF + Zod form (no standalone route):
- Fields: nickname, make, model, year, vehicleType (chip selector), fuelType (chip selector), registrationNo, currentOdoKm, tankCapacityL (optional), purchaseDate (optional), color picker
- On save: `vehiclesRepo.create()` or `.update()`; updates `useMoto.activeVehicleId` to the new vehicle on create
- On delete: `vehiclesRepo.archive()` with undo toast
- Accepts `id?: string` prop (undefined = new vehicle)

### 6. `src/components/moto/MotoEditorHost.tsx`
Mounted once in `AppShell` (below the existing Editor modal block). Reads `useMotoEditor` state; renders:
- `kind === 'vehicle'` → `Modal` on desktop / `BottomSheet` on mobile containing `<VehicleEditor id={state.id} />`
- `kind === 'closed'` → nothing

### 7. `src/components/moto/VehicleSwitcher.tsx`
Horizontal scrollable row rendered at the top of every moto route (imported by each page):
- Shows all non-archived vehicles as chips
- Active vehicle chip is highlighted brand-red
- Tapping a chip calls `useMoto.setActiveVehicle(id)`
- "+" button calls `openMotoEditor({ kind: 'vehicle' })`
- When no vehicles exist: single "Add your first vehicle →" button

### 8. `src/routes/moto/Vehicles.tsx` (updated)
Full Garage page:
- Page header "Garage"
- `VehicleSwitcher` at top
- Live list of vehicles via `useLiveQuery`
- Vehicle card: name, make/model/year, registration, vehicle type icon, current odo, color accent
- Tapping a card → `openMotoEditor({ kind: 'vehicle', id })`
- FAB `+` → `openMotoEditor({ kind: 'vehicle' })`
- Empty state when no vehicles

### 9. `src/components/AppShell.tsx` (updated)
Mount `<MotoEditorHost />` after the existing Editor Modal/BottomSheet block.

---

## Acceptance criteria

- [ ] `npm run build` — no TypeScript errors.
- [ ] Tapping the `+` FAB on the Garage page opens the `VehicleEditor` modal (desktop) or full-screen sheet (mobile).
- [ ] Creating a vehicle persists it to `motoVehicles` IndexedDB table and appears in the list without reload.
- [ ] Editing a vehicle pre-fills the form and saves changes.
- [ ] Archiving a vehicle removes it from the list; undo toast restores it.
- [ ] `VehicleSwitcher` renders on the Garage page; switching active vehicle persists across hard refresh (localStorage).
- [ ] No regressions on Habits or Spending pages.

---

## Out of scope (deferred to M3+)

- Dashboard snapshot cards (M8)
- Fuel log editor (M3)
- Service/parts editors (M4)
