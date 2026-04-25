# Phase 3 — Dashboard & Completion
**Estimated time:** Day 5–6  
**Goal:** A fully working dashboard homepage. The user opens the app, sees today's habits and tasks, completes them with the right measurement control for each type, and streaks update correctly. This is the core daily-use loop.

**Prerequisite:** Phase 2 complete — all CRUD working, repos solid.

---

## Step 1 — Business logic library

These are pure functions (no DB calls). Write them in `src/lib/` and unit-test them now — they are the most logic-dense part of the app.

### `src/lib/dates.ts`
```ts
import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns'

/** Returns today as 'YYYY-MM-DD' in the user's local timezone */
export function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Formats a date string for display: "Mon, Apr 17" */
export function formatDisplayDate(date: string): string {
  return format(parseISO(date), 'EEE, MMM d')
}

/** True if date string is before today (local) */
export function isOverdue(date: string): boolean {
  return isBefore(startOfDay(parseISO(date)), startOfDay(new Date()))
}

/** Returns 'YYYY-MM-DD' N days from today */
export function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return format(d, 'yyyy-MM-dd')
}
```

### `src/lib/recurrence.ts`
```ts
import type { Habit } from '@/types'
import { parseISO, isAfter, isBefore, startOfDay, getDay, differenceInDays } from 'date-fns'

/**
 * Returns true if the given habit should appear on the given date.
 * Rules:
 *   - date must be >= habit.startDate
 *   - date must be <= habit.endDate (if set)
 *   - habit must not be archived or deleted
 *   - recurrence.type === 'daily' → always true
 *   - recurrence.type === 'weekly' → date's day-of-week is in daysOfWeek
 *   - recurrence.type === 'custom' → (date - startDate) % interval === 0
 */
export function isHabitDueOn(habit: Habit, date: string): boolean {
  if (habit.archived || habit.deletedAt) return false

  const d = parseISO(date)
  const start = parseISO(habit.startDate)

  if (isBefore(d, startOfDay(start))) return false
  if (habit.endDate && isAfter(d, parseISO(habit.endDate))) return false

  const { recurrence } = habit
  if (recurrence.type === 'daily') return true
  if (recurrence.type === 'weekly') {
    return (recurrence.daysOfWeek ?? []).includes(getDay(d))
  }
  if (recurrence.type === 'custom') {
    const diff = differenceInDays(d, start)
    return diff >= 0 && diff % (recurrence.interval ?? 1) === 0
  }
  return false
}

/** Returns a human-readable recurrence summary */
export function recurrenceLabel(habit: Habit): string {
  const r = habit.recurrence
  if (r.type === 'daily') return 'Every day'
  if (r.type === 'weekly') {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    return (r.daysOfWeek ?? []).map(d => days[d]).join(', ')
  }
  return `Every ${r.interval ?? 1} days`
}
```

### `src/lib/streaks.ts`
```ts
import type { HabitEntry } from '@/types'
import { parseISO, differenceInDays, subDays, format } from 'date-fns'

/**
 * Computes the current streak (consecutive days up to and including today
 * where the entry status is 'done' or 'partial').
 */
export function computeCurrentStreak(entries: HabitEntry[]): number {
  const doneSet = new Set(
    entries.filter(e => e.status === 'done' || e.status === 'partial').map(e => e.date)
  )
  let streak = 0
  let cursor = new Date()
  while (true) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    if (!doneSet.has(dateStr)) break
    streak++
    cursor = subDays(cursor, 1)
  }
  return streak
}

export function computeLongestStreak(entries: HabitEntry[]): number {
  const doneDates = entries
    .filter(e => e.status === 'done' || e.status === 'partial')
    .map(e => e.date)
    .sort()
  if (doneDates.length === 0) return 0

  let longest = 1, current = 1
  for (let i = 1; i < doneDates.length; i++) {
    const diff = differenceInDays(parseISO(doneDates[i]), parseISO(doneDates[i - 1]))
    current = diff === 1 ? current + 1 : 1
    longest = Math.max(longest, current)
  }
  return longest
}

/**
 * Completion rate for the last N days (0.0 – 1.0).
 * Days where the habit wasn't due are excluded from the denominator.
 */
export function computeCompletionRate(entries: HabitEntry[], days = 30): number {
  const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd')
  const recent = entries.filter(e => e.date >= cutoff)
  if (recent.length === 0) return 0
  const done = recent.filter(e => e.status === 'done' || e.status === 'partial').length
  return done / recent.length
}
```

### `src/lib/measurement.ts`
```ts
import type { Habit, HabitEntry } from '@/types'

/**
 * Returns true if this entry counts as "complete" for the given habit.
 */
export function isEntryComplete(entry: HabitEntry | undefined, habit: Habit): boolean {
  if (!entry) return false
  if (entry.status === 'done') return true
  if (habit.measurementType === 'checkbox') return entry.status === 'done'
  if (['count', 'duration', 'numeric'].includes(habit.measurementType)) {
    if (habit.target && entry.value !== undefined) return entry.value >= habit.target
    return entry.value !== undefined && entry.value > 0
  }
  if (habit.measurementType === 'rating') return entry.value !== undefined
  return false
}

/**
 * Returns a short progress label: "5 / 8 glasses", "3 ★", etc.
 */
export function progressLabel(entry: HabitEntry | undefined, habit: Habit): string {
  if (!entry?.value) return ''
  const v = entry.value
  const unit = habit.unit ?? ''
  if (habit.measurementType === 'count' || habit.measurementType === 'duration') {
    return habit.target ? `${v} / ${habit.target}${unit ? ' ' + unit : ''}` : `${v}${unit ? ' ' + unit : ''}`
  }
  if (habit.measurementType === 'rating') return '★'.repeat(v)
  return `${v}${unit ? ' ' + unit : ''}`
}
```

Write unit tests for all four files in `src/lib/__tests__/`. Test cases to cover:
- `isHabitDueOn`: daily habit, weekly on specific days, custom interval, before startDate, after endDate.
- `computeCurrentStreak`: streak of 0, streak of 5, gap in the middle, today not yet completed.
- `isEntryComplete`: each measurement type, with and without target.

---

## Step 2 — Dashboard data hook

Create `src/hooks/useDashboard.ts`. This is the single data-assembly point for the dashboard — keep all the query logic here, not scattered in components.

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import { today, addDays, isOverdue } from '@/lib/dates'
import { isHabitDueOn } from '@/lib/recurrence'

export function useDashboard() {
  const todayStr = today()

  const habits = useLiveQuery(() =>
    db.habits.filter(h => !h.archived && !h.deletedAt).toArray(), [])

  const todaysHabits = habits?.filter(h => isHabitDueOn(h, todayStr)) ?? []

  const todayEntries = useLiveQuery(() =>
    db.habitEntries.where('date').equals(todayStr).toArray(), [todayStr])

  const tasks = useLiveQuery(() =>
    db.tasks.filter(t => !t.deletedAt).toArray(), [])

  const overdueTasks = tasks?.filter(
    t => t.status === 'pending' && isOverdue(t.dueDate)
  ) ?? []

  const todaysTasks = tasks?.filter(
    t => t.status === 'pending' && t.dueDate === todayStr
  ) ?? []

  const upcomingTasks = tasks?.filter(t => {
    const sevenDaysOut = addDays(7)
    return t.status === 'pending' && t.dueDate > todayStr && t.dueDate <= sevenDaysOut
  }) ?? []

  const doneToday = todayEntries?.filter(e => e.status === 'done' || e.status === 'partial').length ?? 0
  const totalToday = todaysHabits.length + todaysTasks.length

  return {
    todaysHabits,
    todayEntries: todayEntries ?? [],
    overdueTasks,
    todaysTasks,
    upcomingTasks,
    doneToday,
    totalToday,
  }
}
```

---

## Step 3 — Measurement controls

Create `src/components/MeasurementControl.tsx`. This is the interactive completion widget rendered on each habit card.

It must handle all 5 types:

### `checkbox`
Single button. Shows ✅ when done, empty circle when pending. Tapping toggles between `done` and `pending`. One tap — done.

### `count`
Shows `[−] {value} [+]` with the target shown as `/ {target} {unit}`. Tapping `+` increments `entry.value` by 1. If `value >= target`, card gets a green tint. Tapping `−` decrements (min 0).

### `duration`
Two modes:
- **Timer mode**: Start/Pause/Stop buttons. A running timer shows `MM:SS`. On Stop, `entry.value = elapsed seconds ÷ 60` (store as minutes). 
- **Manual mode**: A number input for minutes. Toggle between modes with a small link.
- If `value >= target`, mark complete.

### `numeric`
An inline number input (no buttons). Blur or Enter commits the value.

### `rating`
5 clickable stars (or emoji). Tapping a star sets `entry.value = star number` and status to `done`.

### Write path for all types
On every value change call `entriesRepo.upsert(habitId, todayStr, { value, status })`. The `status` is derived by `isEntryComplete(entry, habit)` — set to `'done'` if complete, `'partial'` otherwise.

Props:
```ts
interface MeasurementControlProps {
  habit: Habit
  entry: HabitEntry | undefined
  onComplete?: () => void  // optional callback for animation trigger
}
```

---

## Step 4 — Habit card (`src/components/HabitCard.tsx`)

```
┌──────────────────────────────────────┐
│ {icon}  {title}              🔥{streak}│
│         {tag chips}                  │
│         [MeasurementControl]         │
└──────────────────────────────────────┘
```

- Left color accent bar matches `habit.color`.
- Tapping the title area navigates to `/habits/:id`.
- The MeasurementControl occupies the bottom row.
- When the entry is `done`, the card gets a subtle green background or a checkmark overlay. Use a smooth CSS transition.
- Streak badge only shows if streak > 0.

---

## Step 5 — Task card (`src/components/TaskCard.tsx`)

```
┌──────────────────────────────────────┐
│ {icon}  {title}           {priority} │
│         Due: {date}  {tag chips}     │
│         [Mark done]  [Skip]          │
└──────────────────────────────────────┘
```

- Due date shown in red if overdue, amber if today, grey otherwise.
- For `count`/`duration`/`numeric` task types: show a progress bar and a `+` stepper instead of the Mark Done button. Mark Done appears once progress reaches target.
- Tapping title navigates to `/tasks/:id`.
- Mark Done: calls `tasksRepo.complete(id)`.
- Skip: calls `tasksRepo.skip(id)`. Cards disappear from the dashboard after completion/skip (they're filtered out of `todaysTasks` automatically by `useLiveQuery`).

---

## Step 6 — Dashboard route (`src/routes/Dashboard.tsx`)

```
┌──────────────────────────────────────┐
│ Good morning 👋                      │
│ Thursday, Apr 17  · 3 of 7 done      │
├──────────────────────────────────────┤
│ ⚠ Overdue (2)                 [▼]   │
│   [TaskCard] [TaskCard]              │
├──────────────────────────────────────┤
│ Today's Habits (4)                   │
│   [HabitCard] [HabitCard] ...        │
├──────────────────────────────────────┤
│ Today's Tasks (1)                    │
│   [TaskCard]                         │
├──────────────────────────────────────┤
│ Upcoming (3)                  [▼]   │
│   Apr 18  — TaskCard                 │
│   Apr 19  — TaskCard                 │
│   Apr 22  — TaskCard                 │
└──────────────────────────────────────┘
```

Implementation:
- Use `useDashboard()` hook for all data.
- Greeting changes based on time of day: "Good morning" before 12, "Good afternoon" before 17, "Good evening" otherwise.
- **Overdue** and **Upcoming** sections are collapsible (persist collapse state in `useState`, no need to persist to DB).
- If everything for today is done: show a full-width congratulations banner (confetti animation optional but nice).
- Empty state for each section: "Nothing overdue ✓", "No habits for today", etc.

### Scroll to top on tab switch
On mount (and every time the Dashboard route is activated), scroll to top. Use `useEffect` + `window.scrollTo(0, 0)`.

---

## Step 7 — Settings page stub wiring

Settings route now needs to work. Implement `src/routes/Settings.tsx`:

```
Theme:     [Light] [Dark] [System]
Week start: [Sunday] [Monday]
───────────────────────────────
Data
  [Export JSON]   [Import JSON]
  [Clear all data]
───────────────────────────────
Version: 1.0.0
```

- Theme: reads/writes `settingsRepo.set('theme', value)` and applies class to `<html>`.
- Week start: stored in settings, used by the RecurrencePicker "weekly" day display order.
- Export/Import: implement stubs now (alert "Coming in Phase 8"). Wire up real logic in Phase 8.
- Clear all: confirmation dialog, then `db.habits.clear()`, etc. for all tables.

---

## Step 8 — Streak badge component

Create `src/components/StreakBadge.tsx`. A small `🔥{n}` badge. Conditionally render in HabitCard only when streak > 0. Animate with a pulse if streak > 7.

---

## ✅ Phase 3 done when

- [ ] Dashboard loads with today's habits and tasks.
- [ ] Checkbox habit: tap once → card turns green.
- [ ] Count habit: tap `+` → value increments; at target → card turns green.
- [ ] Duration habit: start timer → stop → value recorded; card turns green at target.
- [ ] Rating habit: tap 3 stars → entry saved as value 3, marked done.
- [ ] Numeric habit: type a number → blur → entry saved.
- [ ] Completing all today's items shows a congratulations state.
- [ ] Overdue task appears in Overdue section (red accent).
- [ ] Task Mark Done removes it from the dashboard immediately.
- [ ] Streak increments after marking a habit done.
- [ ] Refreshing the page (F5) shows the same done state — entries are persisted.
- [ ] Week-start setting changes the RecurrencePicker display order.
- [ ] All `src/lib/__tests__/` unit tests pass.