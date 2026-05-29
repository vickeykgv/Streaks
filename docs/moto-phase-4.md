# Phase M4 — Services + Spare Parts

**Estimated time:** ~1.5 days
**Goal:** Full CRUD for service visits and spare part replacements. Service entries can link to open issues (resolving them on save). Parts show a due-status badge (ok / due-soon / overdue) based on `partsLife.ts` logic already written in M1.

Plan reference: `moto_spending_implementation.md` §2.4 (`motoServices`, `motoParts`).

---

## What ships in M4

### 1. `serviceSchema` + `partSchema` in `src/lib/schemas/moto.ts`

**serviceSchema**: `vehicleId`, `date`, `odoKm`, `serviceType`, `workshop?`, `laborCost`, `partsCost`, `totalCost` (auto = labor+parts, editable override), `nextDueDate?`, `nextDueOdoKm?`, `note?`, `linkedIssueIds[]`

**partSchema**: `vehicleId`, `partName`, `brand?`, `partNumber?`, `installedAt`, `odoKmAtInstall`, `cost`, `expectedLifeKm?`, `expectedLifeMonths?`, `linkedServiceId?`, `note?`

### 2. `src/components/moto/editors/ServiceEditor.tsx`
- Service type chip (General / Oil Change / Tire / Brake / Battery / Major / Other)
- Date + odometer
- Workshop (optional)
- Labour cost + parts cost → total auto-computed (editable)
- Next due by date (optional) + next due by odo (optional)
- Open issues checklist for `linkedIssueIds` — checking resolves them on save
- Note
- On save: if `odoKm > vehicle.currentOdoKm` → update vehicle odometer; resolve checked issues via `issuesRepo.resolve(id, serviceId)`

### 3. `src/components/moto/editors/PartEditor.tsx`
- Part name + brand + part number (optional)
- Install date + odometer at install
- Cost
- Expected life km (optional) + expected life months (optional)
- Link to a service (optional dropdown of recent services)
- Note

### 4. `MotoEditorHost.tsx` updated
Add `kind === 'service'` and `kind === 'part'` branches.

### 5. `src/routes/moto/Service.tsx` (updated)
- Page header + `VehicleSwitcher`
- Live query sorted newest first
- Service card: date, odo, service type badge, workshop, total cost, next-due indicator (due-status from `serviceDue.ts`)
- FAB + tap-to-edit pattern
- Empty state

### 6. `src/routes/moto/Parts.tsx` (updated)
- Page header + `VehicleSwitcher`
- Live query sorted by install date desc
- Part card: name, brand, install date, odo, cost, due-status badge coloured by severity
- FAB + tap-to-edit
- Empty state

---

## Acceptance criteria

- [ ] `npm run build` passes.
- [ ] Add a service → appears in list; vehicle odometer updates if higher.
- [ ] Checking open issues in the service form → those issues show as resolved after save.
- [ ] Edit a service → form pre-filled; delete with undo.
- [ ] Add a part → due-status badge shows immediately when life limits are set.
- [ ] Parts with `overdue` status show red badge; `due-soon` shows amber.
- [ ] Switching active vehicle updates both Service and Parts pages.
