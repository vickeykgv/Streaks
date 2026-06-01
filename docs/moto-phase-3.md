# Phase M3 — Fuel Logging

**Estimated time:** ~1 day
**Goal:** Users can log every fuel fill for the active vehicle. The Fuel page shows chronological history with per-fill cost and a kmpl efficiency badge where computable. Saving a fill auto-updates the vehicle odometer if the logged odo is greater than the stored value.

Plan reference: `moto_spending_implementation.md` §2.4 (`motoFuelLogs`).

---

## What ships in M3

### 1. `fuelLogSchema` in `src/lib/schemas/moto.ts`
Fields: `vehicleId`, `date`, `odoKm`, `litres`, `pricePerL`, `totalCost`, `fuelType`, `station?`, `fullTank`, `note?`

### 2. `src/components/moto/editors/FuelLogEditor.tsx`
Embedded RHF + Zod form:
- Date picker (default today)
- Odometer reading (km)
- Litres + price per litre → `totalCost` auto-computed via `watch` (editable override)
- Fuel type chip selector (inherits from vehicle, user can change)
- Station name (optional text)
- Full tank toggle (boolean) — required for fill-to-fill kmpl
- Note (optional)
- On save: `fuelLogsRepo.create()` or `.update()`; if `odoKm > vehicle.currentOdoKm` → `vehiclesRepo.update(vehicleId, { currentOdoKm: odoKm })`
- On delete: `fuelLogsRepo.delete()` with undo via restore pattern

### 3. `MotoEditorHost.tsx` updated
Add `kind === 'fuel'` branch → `<FuelLogEditor id={editor.id} vehicleId={editor.vehicleId} />`
Title: `'Edit Fuel Fill'` (edit) / `'Log Fuel Fill'` (new)

### 4. `src/routes/moto/Fuel.tsx` (updated)
- Page header + `VehicleSwitcher`
- Live query `fuelLogsRepo.getAllForVehicle(activeVehicleId)` (most recent first)
- Efficiency series computed via `computeFuelEfficiency(logs)`
- Each log row: date, odo, litres, total cost, price/L, station if present, kmpl badge if available, full-tank indicator
- FAB `+` → `openMotoEditor({ kind: 'fuel', vehicleId: activeVehicleId })`
- Tap row → `openMotoEditor({ kind: 'fuel', id, vehicleId })`
- Empty state when no vehicle selected or no logs
- Summary strip at top: total spent this month, latest kmpl

---

## Acceptance criteria

- [ ] `npm run build` passes.
- [ ] Add a fuel fill → appears in list immediately; vehicle odometer updates if new odo is higher.
- [ ] Edit a fill → form pre-filled; changes persist.
- [ ] Delete a fill → row disappears with undo toast.
- [ ] kmpl badge appears on fills that follow a full-tank fill.
- [ ] Switching active vehicle re-renders the fuel list for that vehicle.
- [ ] Empty state shown when no logs exist.
