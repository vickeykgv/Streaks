# Phase M0 — Module Switcher + Scaffolding

**Estimated time:** ~0.5 day
**Goal:** Add Moto Logging as the third module behind the existing module switcher. No data layer, no editors, no business logic — just the navigational shell, three modules visible, and `/moto/*` placeholder routes that render an `EmptyState`.

This is the smallest possible vertical slice that makes Module #3 *exist* and lets later phases land code without touching shared shell files again.

Plan reference: `moto_spending_implementation.md` (root).

---

## What ships in M0

### 1. Module store
- Extend `ActiveModule` in `src/store/module.ts` to `'habits' | 'spending' | 'moto'`.
- No persistence migration needed — existing `localStorage('active-module')` values remain valid.

### 2. Module switchers
- `src/components/ModuleSwitcher.tsx` (bottom-nav, mobile): add Moto chip with `Bike` icon → `/moto`.
- `src/components/SideNav.tsx` `SideModuleSwitcher`: add Moto button with same icon.

### 3. Nav items per module
- `src/components/SideNav.tsx`: add `motoMainItems` and render conditionally on `activeModule === 'moto'`. Show Settings in the footer block for moto too.
- `src/components/BottomNav.tsx`: add `motoItems` (Dashboard, Vehicles, Fuel, Service, Settings — 5 items max for thumb reach).

### 4. Placeholder routes
Create one file per moto route under `src/routes/moto/` that renders an `EmptyState` with a friendly headline. No data binding.

- `src/routes/moto/Dashboard.tsx`
- `src/routes/moto/Vehicles.tsx`
- `src/routes/moto/Fuel.tsx`
- `src/routes/moto/Service.tsx`
- `src/routes/moto/Parts.tsx`
- `src/routes/moto/Issues.tsx`
- `src/routes/moto/Notes.tsx`
- `src/routes/moto/Documents.tsx`
- `src/routes/moto/Reports.tsx`

### 5. Router wiring
- `src/App.tsx`: register all nine `/moto/*` routes under the existing `<Routes>` block.

---

## Acceptance criteria

- [ ] `npm run build` passes with no new TypeScript errors.
- [ ] Module switcher shows three chips: Habits / Money / Moto.
- [ ] Clicking the Moto chip navigates to `/moto` and the bottom/side nav updates to show moto nav items only.
- [ ] All nine `/moto/*` routes render an `EmptyState` without crashing.
- [ ] Refreshing on `/moto/fuel` (or any sub-route) restores the moto nav items because `activeModule` is persisted to localStorage.
- [ ] Switching back to Habits or Money still works; nav items revert correctly.
- [ ] No visual regressions on Habits or Spending pages.

---

## Out of scope (deferred to M1+)

- Dexie tables / repos (M1)
- Vehicle switcher inside the module (M2)
- Real editors / modals (M2+)
- Settings unit-system toggle (M1)
