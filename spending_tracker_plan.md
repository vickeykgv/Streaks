# Spending Tracker — Implementation Plan

> **Status:** S0 ✅ S1 ✅ S2 ✅ S3 ✅ S4 ✅ S5 ✅ S6 ✅ S7 ✅ S8 ✅ S9 ✅ S10 ✅ — All phases complete. Deploy: run spending_tables.sql + redeploy Edge Functions.
> **Owner:** vickeykgv
> **Related docs:** [`PLAN.md`](./PLAN.md) (Habit Tracker master plan), [`CLAUDE.md`](./CLAUDE.md) (architecture rules), [`future implementation.md`](./future%20implementation.md).

---

## 1. Context

The Habit Tracker is evolving into a **multi-module personal-life app**. Spending Tracker is the **second module**, alongside the existing Habits/Tasks module. Both modules share:

- Auth (Supabase)
- Sync engine (`src/sync/`)
- Design system (Tailwind tokens + `src/components/ui/`)
- Reusable primitives (Buttons, Cards, Modals, Pickers, DatePicker, TagInput, etc.)
- Toast/undo pattern, swipe-row pattern, RHF + Zod form pattern

A **Module Switcher** at the top of `SideNav` / `BottomNav` lets the user flip between modules; each module owns its own nav items, routes, and Dexie tables — but data and auth flow through the same plumbing.

---

## 2. Decisions locked in

| Question | Decision |
|---|---|
| Module navigation | **Module switcher at the top** of SideNav/BottomNav. Each module shows its own nav items below the switcher. |
| Categories | **New `spendingCategories` table** — dedicated entity (icon, color, type, parent for sub-categories). Tags reused from existing table for optional transaction tags. |
| Currency | **Single base currency** chosen in Settings (default `INR`). Multi-currency deferred. |
| Reports | **Budgets + Reports shipped together in one phase** (S6). |

---

## 3. Architecture overview

### 3.1 Module switcher
- `src/store/module.ts` — Zustand store `useModule` with `activeModule: 'habits' | 'spending'`, persisted to `localStorage('active-module')`.
- `src/components/ModuleSwitcher.tsx` — segmented control rendered at the top of `SideNav` and inside `BottomNav`.
- Single `BrowserRouter`; routes are namespaced. Nav items rendered are conditional on `activeModule`. Switching modules navigates to that module's dashboard.

### 3.2 Routes

**Habits module (unchanged):** `/`, `/habits`, `/tasks`, `/stats`, `/tags`, `/new`, `/edit/:type/:id`

**Spending module (new):**
- `/spending` — Dashboard
- `/spending/transactions` — Transaction history with filters
- `/spending/categories` — Manage categories
- `/spending/accounts` — Accounts list
- `/spending/budgets` — Budget management
- `/spending/reports` — Reports & analytics
- `/spending/recurring` — Recurring transactions
- `/spending/new`, `/spending/edit/:id` — Transaction editor
- `/spending/accounts/new`, `/spending/accounts/edit/:id` — Account editor
- (similar for categories, budgets, recurring)

**Shared:** `/settings`, `/signin`

### 3.3 Data model (Dexie v4)

All entities follow the existing sync-field convention: `id` (nanoid), `ownerId`, `createdAt`, `updatedAt`, `deletedAt?`, `syncedAt?`, `dirty`.

**`spendingAccounts`** — `id, archived, dirty, updatedAt, ownerId`
- `name`, `type: 'cash' | 'bank' | 'credit_card' | 'wallet' | 'other'`, `openingBalance`, `currency`, `color`, `icon`, `archived`

**`spendingCategories`** — `id, type, parentId, dirty, updatedAt, ownerId`
- `name`, `type: 'income' | 'expense'`, `parentId?`, `color`, `icon`, `archived`

**`spendingTransactions`** — `id, date, accountId, categoryId, type, recurringId, dirty, updatedAt, ownerId, *tags`
- `type: 'income' | 'expense' | 'transfer'`, `amount` (positive), `currency`, `date` (ISO), `accountId`, `toAccountId?` (transfers), `categoryId?`, `tags: string[]`, `note?`, `payee?`, `recurringId?`

**`spendingBudgets`** — `id, period, dirty, updatedAt, ownerId`
- `name`, `amount`, `period: 'monthly' | 'weekly' | 'yearly' | 'custom'`, `startDate`, `endDate?`, `categoryIds: string[]`, `rollover: boolean`

**`spendingRecurring`** — `id, nextRunAt, dirty, updatedAt, ownerId`
- Transaction template + `recurrence` (reuse habit Recurrence shape), `nextRunAt`, `lastRunAt?`, `active`

Existing **`tags`** table is reused for optional transaction tags (categories are required, tags are not).

### 3.4 Sync
All five new entities flow through the same `pullChanges → mergeIntoTable → getDirtyRecords → pushChanges` engine. Phase S9 extends `serializers.ts`, `engine.ts`, the Supabase schema, and the Edge Functions.

### 3.5 Reuse map
- `WorldSwitcher` pattern → `ModuleSwitcher`, `PeriodSwitcher`
- `useDashboard` → `useSpendingDashboard`
- `Editor.tsx` (RHF + Zod) → `TransactionEditor`, `AccountEditor`, `CategoryEditor`, `BudgetEditor`, `RecurringEditor`
- `habitsRepo` patterns (ownerId stamping, dirty/updatedAt, soft-delete, restore) → all spending repos
- Toast undo, swipe-row, confirm dialog, FAB, EmptyState, Card, Modal, BottomSheet, Select, DatePicker, TagInput, IconPicker, ColorPicker, ProgressBar — all reused as-is

---

## 4. Phased rollout

| Phase | Title | Estimate | Goal |
|---|---|---|---|
| **S0** ✅ | Module switcher + scaffolding | ~0.5 d | Switch between Habits/Spending; Spending shows placeholder routes |
| **S1** ✅ | Data layer + currency setting | ~1 d | All Dexie tables, repos, types, base-currency setting, seeded default categories |
| **S2** ✅ | Transactions CRUD + Accounts | ~1.5 d | Add/edit/delete income, expense, transfers across accounts |
| **S3** ✅ | Spending Dashboard | ~1 d | First screen of the module: stat cards, category breakdown, recents |
| **S4** ✅ | Categories management + Tags | ~0.5 d | Full CRUD with sub-categories; tag autocomplete on transactions |
| **S5** ✅ | History sort & filters | ~0.5 d | Date range, type, account, category, tags, amount, search; URL-shareable |
| **S6** ✅ | Budgets + Reports & Analytics | ~2 d | Budgets with progress; reports with trends, pie, cashflow (recharts) |
| **S7** ✅ | Recurring transactions | ~1 d | Schedule templates; runner creates transactions on the due date |
| **S8** ✅ | Export & Import | ~0.5 d | JSON full-export/import; CSV transaction export |
| **S9** ✅ | Sync + Backend | ~1 d | Serializers, engine, Edge Functions done — run spending_tables.sql to activate |
| **S10** ✅ | Polish | ~0.5 d | Skeleton loaders, empty states, reduced-motion safe animations |

**Total estimate:** ~9 working days end-to-end.

Detailed acceptance criteria for each phase live in `docs/spending-phase-N.md` (created at the start of each phase, mirroring the existing `docs/phase-*.md` style).

---

## 5. Critical files

### New files
- `src/store/module.ts`
- `src/components/ModuleSwitcher.tsx`
- `src/types/spending.ts`
- `src/db/repos/spending/{accounts,categories,transactions,budgets,recurring}.ts`
- `src/lib/spending/{filters,budgets,reports,recurringRunner}.ts`
- `src/lib/schemas/spending.ts`
- `src/routes/spending/{Dashboard,Transactions,Categories,Budgets,Reports,Accounts,Recurring,TransactionEditor,AccountEditor,CategoryEditor,BudgetEditor,RecurringEditor}.tsx`
- `src/hooks/useSpendingDashboard.ts`
- `docs/spending-phase-0.md` … `docs/spending-phase-10.md`

### Modified files
- `src/db/database.ts` — bump to v4, add 5 stores
- `src/App.tsx` — register Spending routes
- `src/components/SideNav.tsx` — render `ModuleSwitcher`, conditional nav items
- `src/components/BottomNav.tsx` — same
- `src/routes/Settings.tsx` — add base currency + Spending export/import section
- `src/sync/serializers.ts`, `src/sync/engine.ts` — handle new entities
- `PLAN.md` — pointer to this file
- `CLAUDE.md` — pointer to this file

---

## 6. Architecture rules (apply to all spending code)

Same as the project's master rules in `CLAUDE.md`:

1. **No direct Dexie calls in components.** Use repos in `src/db/repos/spending/`.
2. **No business logic in components.** Filters, budget math, report aggregation, recurring runner all live in `src/lib/spending/` as pure functions.
3. **Sync fields on every write.** `updatedAt: Date.now()` and `dirty: true` every time.
4. **`ownerId` on creates.** `useSession.getState().user?.id`.
5. **No `any` types.**

---

## 7. Verification per phase

After each phase:

1. `npm run build` — TypeScript compiles cleanly.
2. `npm run test` — unit tests pass.
3. Manual smoke: open the app, switch to Spending module, exercise the phase's feature, refresh, verify persistence.
4. After S9: sign in on a second profile, confirm cross-device sync.
5. After S10: DevTools → Network Offline — app remains fully functional.

---

## 8. Open items / parking lot

- **Multi-currency.** Defer to a future "Phase S11". The `currency` field on transactions/accounts already leaves room.
- **Recurring snooze/skip UX.** Reuse the task snooze pattern from `future implementation.md` once it ships.
- **Photo receipts.** Deferred — needs Supabase Storage.
- **Splitwise-style split transactions.** Out of scope for v1.
