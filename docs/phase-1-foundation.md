# Phase 1 — Foundation
**Estimated time:** Day 1–2  
**Goal:** A running app shell with routing, a working Dexie database, typed repos, seed data, and a consistent layout. Nothing fancy — just a skeleton you can build every other feature on top of.

---

## Step 1 — Scaffold the project

```bash
npm create vite@latest habit-tracker -- --template react-ts
cd habit-tracker
npm install
```

Install all dependencies up front so you don't interrupt flow later:

```bash
# Core
npm install react-router-dom dexie dexie-react-hooks zustand
npm install date-fns nanoid zod react-hook-form @hookform/resolvers

# UI
npm install tailwindcss @tailwindcss/vite
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs
npm install @radix-ui/react-checkbox @radix-ui/react-popover @radix-ui/react-tooltip
npm install lucide-react clsx tailwind-merge

# PWA (install now, configure in Phase 4)
npm install -D vite-plugin-pwa

# Dev
npm install -D @types/node vitest @vitest/ui jsdom @testing-library/react
```

Configure Tailwind in `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Add to `src/index.css`:
```css
@import "tailwindcss";
```

Add path alias in `tsconfig.app.json` and `vite.config.ts`:
```json
// tsconfig.app.json
"paths": { "@/*": ["./src/*"] }
```
```ts
// vite.config.ts
resolve: { alias: { '@': '/src' } }
```

---

## Step 2 — TypeScript types

Create `src/types/index.ts` with the full data model. Every field from PLAN.md §2 must be present — **including all sync fields** even though sync won't be implemented until Phase 6. Do not omit them; retrofitting later breaks the schema.

```ts
// src/types/index.ts

export type MeasurementType = 'checkbox' | 'count' | 'duration' | 'numeric' | 'rating'

export type RecurrenceType = 'daily' | 'weekly' | 'custom'

export interface Recurrence {
  type: RecurrenceType
  daysOfWeek?: number[]   // 0 = Sun, 6 = Sat
  interval?: number        // e.g. every 2 days
}

export interface SyncMeta {
  updatedAt: number        // ms timestamp
  syncedAt?: number
  deletedAt?: number       // tombstone
  dirty: boolean
  ownerId?: string
}

export interface Habit extends SyncMeta {
  id: string
  title: string
  description?: string
  tags: string[]
  measurementType: MeasurementType
  target?: number
  unit?: string
  recurrence: Recurrence
  startDate: string        // 'YYYY-MM-DD'
  endDate?: string
  reminderTime?: string    // 'HH:mm'
  color: string
  icon: string
  archived: boolean
  createdAt: number
}

export interface Task extends SyncMeta {
  id: string
  title: string
  description?: string
  tags: string[]
  measurementType: MeasurementType
  target?: number
  unit?: string
  dueDate: string          // 'YYYY-MM-DD'
  dueTime?: string         // 'HH:mm'
  priority: 'low' | 'med' | 'high'
  status: 'pending' | 'done' | 'skipped'
  completedAt?: number
  progress?: number
  color: string
  icon: string
  createdAt: number
}

export type EntryStatus = 'done' | 'partial' | 'skipped' | 'pending'

export interface HabitEntry extends Pick<SyncMeta, 'updatedAt' | 'syncedAt' | 'deletedAt' | 'dirty'> {
  id: string               // `${habitId}_${YYYY-MM-DD}`
  habitId: string
  date: string             // 'YYYY-MM-DD'
  status: EntryStatus
  value?: number
  note?: string
  completedAt?: number
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface Settings {
  key: string
  value: unknown
}
```

---

## Step 3 — Dexie database

Create `src/db/database.ts`. Define all stores with indexes. Use `version(1)` — future migrations go in `version(2)`, etc.

```ts
// src/db/database.ts
import Dexie, { type Table } from 'dexie'
import type { Habit, Task, HabitEntry, Tag, Settings } from '@/types'

export class HabitTrackerDB extends Dexie {
  habits!: Table<Habit, string>
  tasks!: Table<Task, string>
  habitEntries!: Table<HabitEntry, string>
  tags!: Table<Tag, string>
  settings!: Table<Settings, string>

  constructor() {
    super('HabitTrackerDB')

    this.version(1).stores({
      habits:       'id, archived, *tags, dirty, updatedAt, ownerId',
      tasks:        'id, status, dueDate, *tags, priority, dirty, updatedAt, ownerId',
      habitEntries: 'id, habitId, date, [habitId+date], dirty, updatedAt',
      tags:         'id, name',
      settings:     'key',
    })
  }
}

export const db = new HabitTrackerDB()
```

---

## Step 4 — Repository layer

One file per entity. All DB access goes through these — **components never import `db` directly**.

### `src/db/repos/habits.ts`
```ts
import { db } from '@/db/database'
import type { Habit } from '@/types'
import { nanoid } from 'nanoid'

const now = () => Date.now()

export const habitsRepo = {
  async getAll(includeArchived = false) {
    const q = db.habits.filter(h => !h.deletedAt)
    return includeArchived ? q.toArray() : q.filter(h => !h.archived).toArray()
  },

  async getById(id: string) {
    return db.habits.get(id)
  },

  async create(data: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'syncedAt' | 'deletedAt'>) {
    const habit: Habit = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      dirty: true,
    }
    await db.habits.add(habit)
    return habit
  },

  async update(id: string, patch: Partial<Habit>) {
    await db.habits.update(id, { ...patch, updatedAt: now(), dirty: true })
  },

  async archive(id: string) {
    await db.habits.update(id, { archived: true, updatedAt: now(), dirty: true })
  },

  async delete(id: string) {
    // Soft-delete (tombstone) so sync can propagate the deletion
    await db.habits.update(id, { deletedAt: now(), updatedAt: now(), dirty: true })
  },
}
```

### `src/db/repos/tasks.ts`
Same pattern as habits. Key differences:
- No `archived` field — use `status: 'done'` or `'skipped'` instead.
- `complete(id)` sets `status: 'done'`, `completedAt: now()`.
- `skip(id)` sets `status: 'skipped'`.

### `src/db/repos/entries.ts`
```ts
import { db } from '@/db/database'
import type { HabitEntry, EntryStatus } from '@/types'

const now = () => Date.now()

export const entriesRepo = {
  async getForHabit(habitId: string) {
    return db.habitEntries.where('habitId').equals(habitId).toArray()
  },

  async getForDate(date: string) {
    return db.habitEntries.where('date').equals(date).toArray()
  },

  async getByHabitAndDate(habitId: string, date: string) {
    return db.habitEntries.get(`${habitId}_${date}`)
  },

  async upsert(habitId: string, date: string, patch: Partial<HabitEntry>) {
    const id = `${habitId}_${date}`
    const existing = await db.habitEntries.get(id)
    if (existing) {
      await db.habitEntries.update(id, { ...patch, updatedAt: now(), dirty: true })
    } else {
      await db.habitEntries.add({
        id,
        habitId,
        date,
        status: 'pending',
        updatedAt: now(),
        dirty: true,
        ...patch,
      } as HabitEntry)
    }
    return db.habitEntries.get(id)
  },
}
```

### `src/db/repos/tags.ts`
Simple CRUD — `getAll()`, `create(name, color)`, `update(id, patch)`, `delete(id)`.

### `src/db/repos/settings.ts`
```ts
import { db } from '@/db/database'

export const settingsRepo = {
  async get<T>(key: string, fallback: T): Promise<T> {
    const row = await db.settings.get(key)
    return row ? (row.value as T) : fallback
  },
  async set(key: string, value: unknown) {
    await db.settings.put({ key, value })
  },
}
```

---

## Step 5 — Seed data (development only)

Create `src/db/seed.ts`. Import and call `seedIfEmpty()` from `main.tsx` when `import.meta.env.DEV` is true.

The seed should create:
- 3 habits covering different measurement types: one `checkbox` (daily), one `count` (daily, target 8), one `rating` (daily).
- 2 tasks: one due today, one due in 3 days.
- 2 tags: "health" (green), "focus" (blue).
- Some HabitEntry records for the past 7 days so streaks are non-zero from the start.

Use real past dates so `computeStreak` has something to work with immediately.

---

## Step 6 — App layout and routing

### `src/App.tsx`
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import Dashboard from '@/routes/Dashboard'
import Habits from '@/routes/Habits'
import Tasks from '@/routes/Tasks'
import Editor from '@/routes/Editor'
import Tags from '@/routes/Tags'
import Settings from '@/routes/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/habits"     element={<Habits />} />
          <Route path="/habits/:id" element={<HabitDetail />} />
          <Route path="/tasks"      element={<Tasks />} />
          <Route path="/tasks/:id"  element={<TaskDetail />} />
          <Route path="/new"        element={<Editor />} />
          <Route path="/edit/:type/:id" element={<Editor />} />
          <Route path="/tags"       element={<Tags />} />
          <Route path="/settings"   element={<Settings />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
```

### `src/components/AppShell.tsx`
Renders a fixed bottom nav bar (mobile-first) with 4 tabs: Dashboard, Habits, Tasks, Settings. Active tab highlighted. A floating `+` button lives above the nav and navigates to `/new`.

Bottom nav tabs and icons:
- `/` — Home (LayoutDashboard icon)
- `/habits` — Habits (Repeat icon)
- `/tasks` — Tasks (CheckSquare icon)
- `/settings` — Settings (SlidersHorizontal icon)

The main content area has `pb-20` to clear the nav bar.

### Route stubs
Create stub files for every route — just `export default function RouteName() { return <div>RouteName</div> }`. They'll be filled in subsequent phases. Routes needed now: Dashboard, Habits, HabitDetail, Tasks, TaskDetail, Editor, Tags, Settings.

---

## Step 7 — Theme setup

### Light / dark mode
Use Tailwind's `dark:` classes. Read the `theme` setting from `settingsRepo` on mount in `main.tsx` and apply `document.documentElement.classList.toggle('dark', ...)`. Default to `'system'` (respect `prefers-color-scheme`).

### Color palette
Define CSS variables for the app's accent color (indigo works well for habits). Keep all interactive elements accessible (4.5:1 contrast ratio minimum).

---

## Step 8 — Vitest setup

Create `src/db/seed.test.ts` with one smoke test that opens the DB, inserts a habit, reads it back, and asserts it matches. This validates the Dexie schema is correct before you build anything on top of it.

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: { environment: 'jsdom', globals: true },
})
```

---

## ✅ Phase 1 done when

- [ ] `npm run dev` opens the app at `localhost:5173` with no console errors.
- [ ] All 4 nav tabs are present and navigate correctly.
- [ ] `db` is accessible in browser devtools: `indexedDB` shows `HabitTrackerDB` with all 5 stores.
- [ ] Seed data is present: inspect DB in devtools → Application → IndexedDB.
- [ ] Vitest smoke test passes: `npm run test`.
- [ ] TypeScript compiles clean: `npm run build` with zero errors.