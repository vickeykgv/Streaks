# Phase 2 — CRUD
**Estimated time:** Day 3–4  
**Goal:** Full create/edit/delete for habits and tasks, a working tags system, and both list views. After this phase a user can manage their full data set even though the dashboard isn't wired yet.

**Prerequisite:** Phase 1 complete — DB, repos, types, routing stubs all in place.

---

## Step 1 — Shared utility helpers

Before writing UI, add these to `src/lib/` so the form can use them:

### `src/lib/utils.ts`
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### `src/lib/constants.ts`
```ts
export const MEASUREMENT_TYPES = [
  { value: 'checkbox', label: 'Checkbox', description: 'Simple done/not-done' },
  { value: 'count',    label: 'Count',    description: 'Track a number vs target' },
  { value: 'duration', label: 'Duration', description: 'Time-based (minutes)' },
  { value: 'numeric',  label: 'Numeric',  description: 'Log any number (weight, etc.)' },
  { value: 'rating',   label: 'Rating',   description: '1–5 scale' },
] as const

export const PRIORITY_OPTIONS = [
  { value: 'low',  label: 'Low',    color: 'text-slate-400' },
  { value: 'med',  label: 'Medium', color: 'text-amber-500' },
  { value: 'high', label: 'High',   color: 'text-red-500' },
] as const

export const DEFAULT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
]

export const DEFAULT_ICONS = ['✅', '💪', '📚', '💧', '🧘', '🏃', '🎯', '⭐', '🌟', '🔥', '🌱', '💤']
```

---

## Step 2 — Zod validation schemas

Create `src/lib/schemas.ts`. These feed React Hook Form — define them once and reuse in both create and edit paths.

```ts
import { z } from 'zod'

export const recurrenceSchema = z.object({
  type: z.enum(['daily', 'weekly', 'custom']),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  interval: z.number().min(1).max(365).optional(),
})

export const habitSchema = z.object({
  title:           z.string().min(1, 'Title is required').max(100),
  description:     z.string().max(500).optional(),
  tags:            z.array(z.string()).default([]),
  measurementType: z.enum(['checkbox', 'count', 'duration', 'numeric', 'rating']),
  target:          z.number().positive().optional(),
  unit:            z.string().max(20).optional(),
  recurrence:      recurrenceSchema,
  startDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reminderTime:    z.string().regex(/^\d{2}:\d{2}$/).optional(),
  color:           z.string().default('#6366f1'),
  icon:            z.string().default('✅'),
})

export const taskSchema = z.object({
  title:           z.string().min(1, 'Title is required').max(100),
  description:     z.string().max(500).optional(),
  tags:            z.array(z.string()).default([]),
  measurementType: z.enum(['checkbox', 'count', 'duration', 'numeric', 'rating']),
  target:          z.number().positive().optional(),
  unit:            z.string().max(20).optional(),
  dueDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date required'),
  dueTime:         z.string().regex(/^\d{2}:\d{2}$/).optional(),
  priority:        z.enum(['low', 'med', 'high']).default('med'),
  color:           z.string().default('#6366f1'),
  icon:            z.string().default('🎯'),
})

export type HabitFormValues = z.infer<typeof habitSchema>
export type TaskFormValues = z.infer<typeof taskSchema>
```

---

## Step 3 — Reusable form components

Build these small components before the main form — they'll be composed inside it.

### `src/components/TagInput.tsx`
- Shows existing tags as removable chips.
- Autocomplete input: as user types, show matching tags from DB using `useLiveQuery`.
- If typed name doesn't match any tag, show "+ Create 'name'" option.
- On selecting "+ Create", call `tagsRepo.create(name, randomColor)` then add to form value.
- Props: `value: string[]`, `onChange: (ids: string[]) => void`.

### `src/components/RecurrencePicker.tsx`
Three modes selectable via segmented control:
- **Daily** — no extra options.
- **Weekly** — 7 day-of-week toggle buttons (S M T W T F S). Must select at least one.
- **Custom** — "Every N days" number input (1–90).

Props: `value: Recurrence`, `onChange: (r: Recurrence) => void`.

### `src/components/ColorPicker.tsx`
10-swatch grid from `DEFAULT_COLORS`. Selected swatch has a checkmark. Props: `value: string`, `onChange: (hex: string) => void`.

### `src/components/IconPicker.tsx`
Grid of emoji from `DEFAULT_ICONS`. Tapping one selects it. Props: same pattern as ColorPicker.

### `src/components/MeasurementConfig.tsx`
Shows conditionally based on `measurementType`:
- `count` / `duration` / `numeric`: shows a "Target" number input and a "Unit" text input.
- `checkbox` / `rating`: shows nothing (no target needed).

---

## Step 4 — Editor form (`src/routes/Editor.tsx`)

This is the most complex component in Phase 2. Read URL params to determine mode:
- `/new?type=habit` → create habit
- `/new?type=task` → create task
- `/new` → show a mode toggle at the top (Habit | Task), default to habit
- `/edit/habit/:id` → edit existing habit (pre-fill form)
- `/edit/task/:id` → edit existing task

### Structure
```tsx
// top of form
<ModeToggle value={mode} onChange={setMode} />  // only shown when creating

// shared fields
<TitleInput />
<DescriptionTextarea />
<IconPicker />
<ColorPicker />
<TagInput />
<MeasurementTypeSelect />
<MeasurementConfig />  // shows target/unit only if relevant

// conditional: habit fields
{mode === 'habit' && (
  <>
    <RecurrencePicker />
    <StartDateInput />   // default: today
    <EndDateInput />     // optional
    <ReminderTimeInput />
  </>
)}

// conditional: task fields
{mode === 'task' && (
  <>
    <DueDateInput />
    <DueTimeInput />
    <PrioritySelect />
  </>
)}

<SubmitButton />
<DeleteButton />  // only shown in edit mode
```

### Submit logic
- Validate with Zod via `zodResolver`.
- On success: call `habitsRepo.create()` or `tasksRepo.create()`, then `navigate(-1)`.
- On edit: call `habitsRepo.update(id, data)`, then `navigate(-1)`.
- On delete: show a confirmation dialog, then `habitsRepo.archive(id)` (habits) or `tasksRepo.delete(id)` (tasks), then `navigate('/')`.

---

## Step 5 — Habits list (`src/routes/Habits.tsx`)

```
┌─────────────────────────────────┐
│ Habits            [+ New habit] │
│ 🔍 Search...          ▼ Filter  │
├─────────────────────────────────┤
│ [All tags][health][focus]       │
├─────────────────────────────────┤
│ ✅ Take vitamins  🔥7  →        │
│    daily · health               │
│ 💧 Drink water   🔥3  →        │
│    daily · 0/8 glasses          │
│ ...                             │
└─────────────────────────────────┘
```

Data: `useLiveQuery(() => habitsRepo.getAll(showArchived))`.

Features:
- Search filters by `title` (case-insensitive, client-side — DB is local so fast).
- Tag filter: clicking a tag chip filters to habits with that tag.
- Each row shows: icon, title, recurrence summary (e.g. "Daily", "Mon Wed Fri"), streak badge.
- Tap row → navigate to `/habits/:id`.
- "Show archived" toggle at bottom.
- Empty state component when list is empty.

---

## Step 6 — Habit detail (`src/routes/HabitDetail.tsx`)

Load habit by `id` param. If not found → redirect to `/habits`.

Sections:
1. **Header** — icon, title, color accent, tag chips.
2. **Info row** — measurement type, recurrence, reminder time.
3. **Stats row** — current streak, longest streak, 30-day completion %.
4. **Description** — rendered markdown (use a lightweight renderer or just `<pre>` for now).
5. **History** — last 30 days rendered as a simple grid of colored squares (green = done, grey = pending, yellow = partial). Implement this as `MiniHeatmap` component.
6. **Actions** — Edit button (navigate to `/edit/habit/:id`), Archive button.

Streak and completion % live in `src/lib/streaks.ts` — implement `computeStreak(habitId, entries)` and `computeCompletionRate(entries, days)` here. These are pure functions, no DB calls.

---

## Step 7 — Tasks list (`src/routes/Tasks.tsx`)

Three tabs: **Pending** | **Done** | **All**

```
Pending tab shows:
  [Overdue section]     — red accent, sorted oldest first
  [Due today]           — normal
  [Upcoming]            — grouped by date

Done tab shows:
  Completed tasks, sorted by completedAt desc

All tab: flat list, sorted by dueDate
```

Each task row: icon, title, due date badge (red if overdue, amber if today, grey if future), priority indicator, tag chips.

Filters: by tag, by priority. Both are multi-select chip toggles above the list.

Tap row → navigate to `/tasks/:id`.

---

## Step 8 — Task detail (`src/routes/TaskDetail.tsx`)

Sections:
1. Header — icon, title, priority badge.
2. Due date/time, description, tags.
3. Progress — for `count`/`duration`/`numeric` types, show a progress bar (`progress / target`).
4. Actions — **Mark Done**, **Skip**, **Edit**.
   - Mark Done: `tasksRepo.complete(id)`, navigate back.
   - Skip: `tasksRepo.skip(id)`, navigate back.
   - Edit: navigate to `/edit/task/:id`.

---

## Step 9 — Tags management (`src/routes/Tags.tsx`)

Simple CRUD page:
- List all tags as rows: colored dot, name, count of habits/tasks using it.
- Inline rename: click name → input appears.
- Color picker per tag.
- Delete button: show confirmation dialog. If tag is in use by any habit/task, warn "This will remove the tag from X habits and Y tasks."

On delete: call `tagsRepo.delete(id)`, then also `habitsRepo.removeTagFromAll(tagId)` and `tasksRepo.removeTagFromAll(tagId)`.

---

## Step 10 — Wire the floating "+" button

In `AppShell`, the `+` button currently goes to `/new`. Update it to show a bottom sheet with two options:
- **Add Habit** → navigate to `/new?type=habit`
- **Add Task** → navigate to `/new?type=task`

Use a Radix `Dialog` or a simple Tailwind-animated slide-up div.

---

## ✅ Phase 2 done when

- [ ] Can create a habit of every measurement type and see it in the Habits list.
- [ ] Can create a task with a due date and priority.
- [ ] Can edit any existing habit or task; changes persist after page reload.
- [ ] Archive a habit → disappears from list (reappears with "Show archived" toggle).
- [ ] Tags can be created inline from the form; appear in Tags page.
- [ ] Deleting a tag warns about usage and removes it from affected records.
- [ ] Habit detail shows streak and mini heatmap (even if stats are simple for now).
- [ ] Task detail shows Mark Done / Skip — status changes persist.
- [ ] TypeScript compiles clean; no `any` types.