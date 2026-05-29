# Phase M1 — Data Layer + Types + Unit Setting

**Estimated time:** ~1 day
**Goal:** Everything the rest of the module needs to read/write data: Dexie v5 tables, typed repos, pure business-logic functions, and the `unitSystem` setting. No UI widgets yet — phase ends with a clean build and passing unit tests.

Plan reference: `moto_spending_implementation.md` §2.4.

---

## What ships in M1

### 1. Types — `src/types/moto.ts`
Seven interfaces all extending `SyncMeta`:
- `MotoVehicle`, `MotoFuelLog`, `MotoService`, `MotoPart`, `MotoIssue`, `MotoNote`, `MotoDocument`
- Supporting union types: `VehicleType`, `FuelType`, `ServiceType`, `IssuePriority`, `IssueStatus`, `DocumentType`

### 2. Database — `src/db/database.ts` v5
Add 7 new Dexie stores with indexes. No migration required (new stores only).
```
motoVehicles:  'id, archived, dirty, updatedAt, ownerId'
motoFuelLogs:  'id, vehicleId, date, dirty, updatedAt, ownerId'
motoServices:  'id, vehicleId, date, dirty, updatedAt, ownerId'
motoParts:     'id, vehicleId, installedAt, dirty, updatedAt, ownerId'
motoIssues:    'id, vehicleId, status, priority, dirty, updatedAt, ownerId'
motoNotes:     'id, vehicleId, dirty, updatedAt, ownerId'
motoDocuments: 'id, vehicleId, type, expiryDate, dirty, updatedAt, ownerId'
```

### 3. Repos — `src/db/repos/moto/`
One file per entity, each following the established pattern:
- `vehiclesRepo` — `getAll(includeArchived)`, `getById`, `create`, `update`, `archive`, `delete`, `restore`
- `fuelLogsRepo` — `getAllForVehicle(vehicleId)`, `getById`, `create`, `update`, `delete`
- `servicesRepo` — `getAllForVehicle(vehicleId)`, `getById`, `create`, `update`, `delete`
- `partsRepo` — `getAllForVehicle(vehicleId)`, `getById`, `create`, `update`, `delete`
- `issuesRepo` — `getAllForVehicle(vehicleId, status?)`, `getById`, `create`, `update`, `resolve(id, serviceId?)`, `delete`
- `notesRepo` — `getAllForVehicle(vehicleId)`, `getById`, `create`, `update`, `delete`
- `documentsRepo` — `getAll(vehicleId?)`, `getById`, `create`, `update`, `delete`

### 4. Pure functions — `src/lib/moto/`
- `units.ts` — `toDisplay(km, system)`, `fromDisplay(val, system)`, `unitLabel(system)`, `volumeLabel(system)`, `toDisplayVolume`, `fromDisplayVolume`
- `fuelEfficiency.ts` — `computeKmpl(logs: MotoFuelLog[])` returns the fill-to-fill efficiency for each full-tank fill
- `partsLife.ts` — `getPartDueStatus(part, currentOdoKm, today)` → `'ok' | 'due-soon' | 'overdue'`
- `serviceDue.ts` — `getServiceDueStatus(lastService, today, currentOdoKm)` → `{ byDate: DueStatus, byOdo: DueStatus }`
- `documentStatus.ts` — `getDocumentStatus(doc, today)` → `'valid' | 'expiring' | 'expired'` (expiring = within `reminderDaysBefore` days)

### 5. Unit setting — `src/routes/Settings.tsx`
Add a `unitSystem` row in the Settings page (Moto section) with a `metric | imperial` toggle, persisted via `settingsRepo.set('unitSystem', value)`.

---

## Acceptance criteria

- [ ] `npm run build` passes — 0 TypeScript errors.
- [ ] `npm run test` passes — all new unit tests in `src/lib/moto/__tests__/` green.
- [ ] `db.motoVehicles`, `db.motoFuelLogs`, etc. are accessible in browser console without errors.
- [ ] Switching to metric/imperial in Settings persists across refresh.
- [ ] No regressions to existing Habits or Spending data (separate Dexie version adds new stores only).

---

## Out of scope (deferred to M2+)

- UI editors / modals (M2+)
- Vehicle switcher Zustand store (M2)
- `useMotoEditor` store (M2)
- Zod schemas (M2 — needed alongside editor forms)
