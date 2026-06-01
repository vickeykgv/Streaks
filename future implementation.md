# Future Implementation Ideas

A prioritized backlog of improvements for the Habit Tracker PWA — high-impact items first, each with the tradeoff so we can decide what's worth the time.

---

## ✅ Completed

- **Undo toast after destructive actions.** Toast store extended to support an inline action button; `tasksRepo.restore()` and `habitsRepo.restore()` clear the tombstone. Delete via 3-dot menu or swipe-left now shows "Deleted X · UNDO" for 5s. Replaces the old confirm dialog.
- **Swipe gestures on rows.** Touch-drag right to complete, left to delete. Axis-locked on first 8px so vertical scrolling still works; damped translate up to 140px; springs back below 80px threshold. Colored backdrops (green/red) fade in proportionally as the user drags.
- **Tap row to expand inline.** Row body click toggles an expansion panel with a note textarea (saves to today's `HabitEntry.note` for habits, `Task.description` for tasks), View/Edit shortcuts, and Snooze-1-day for tasks. Completion is now via the explicit checkbox button or swipe-right (no more accidental completes from tapping the row).
- **Empty-state for "All done!"** Green→indigo gradient banner with an animated party-popper appears above the Today list when `doneToday === totalToday`. Subline references the current best streak.
- **Completion burst animation.** Tapping the checkbox triggers a 480ms in-place celebration: ring-burst, check-pop, four colored confetti dots, row breathe, green glow shadow. Real DB write deferred until animation plays so the user sees the win before the row reorders.
- **Tasks carry forward + overdue highlight.** Pending tasks now appear on Today every day until done; rows past their due date get a red-tinted background, border, and an "Overdue · due MMM d" chip. Removed the separate collapsible Overdue alert section (redundant).
- **Themed Select / DatePicker / TimePicker.** Replaced all native `<select>`, `<input type="date">`, and `<input type="time">` in Editor and Settings with Radix-based themed components matching the design system (portaled popovers, brand-glow selected state, zoom-in animation, scrollable hour/minute columns, Today/Clear footer actions).
- **ConfirmDialog event-bubbling fix.** Stopped `onClick`/`onPointerDown` propagation on `Dialog.Content` so confirm clicks no longer leak through the React portal tree to ancestor row handlers.

---

## Quick wins (a day or less each)

- **Haptic + sound on completion.** `navigator.vibrate(15)` on mark-complete and a tiny "pop" sound (toggleable). The visual burst feels twice as good with a 15ms buzz. Free dopamine.

---

## Engagement features (a few days each)

- **Snooze / reschedule a task** — picker for tomorrow / next week / pick-a-date. (Snooze-1-day is done; this would extend it with multiple options.)
- **Skip-with-reason for habits.** "Sick day", "rest day" — counts as a non-break in the streak. Streaks that punish illness are streaks people abandon.
- **Weekly review screen.** Sunday-evening recap: streaks held, top habit, missed days, suggestion for the coming week. Becomes a reason to open the app.
- **Habit grouping / "routines".** "Morning routine" = 4 habits the user marks done together. One tap completes the group.
- **Heatmap on habit detail.** GitHub-style year view of completions. Highly motivating; cheap to build with the entry data we already have.

---

## Reliability & polish

- **Optimistic UI everywhere.** We have it for completion now — extend to edits and deletes so the UI never waits on Dexie/Supabase.
- **Sync conflict UI.** When the merge engine resolves a conflict, surface it ("kept your local change") instead of silently picking a winner.
- **Background sync.** Register `periodicsync` so the SW pulls changes when the app isn't open.
- **Offline indicator on writes.** "Saved locally — will sync when online" subtext when a write happens offline. Builds trust in the PWA story.

---

## Accessibility / inclusivity

- **Keyboard navigation.** We handle Enter on rows, but Tab order through the dashboard is rough. Arrow-key navigation between rows would help.
- **High-contrast / reduced-motion respect.** Wrap the new burst animations in `@media (prefers-reduced-motion: no-preference)`. Required for App Store-style polish.
- **Font size setting.** Some users want bigger text — easy with the CSS-var design system we already have.

---

## Smart features (bigger bets)

- **Reminder smarts.** Instead of a fixed `reminderTime`, nudge based on completion patterns ("you usually do this around 9am").
- **Streak freeze tokens.** Earn one freeze per N-day streak; auto-applies on a missed day. Duolingo-style retention mechanic.
- **Import / export JSON.** Lowers the "what if I lose my data" fear and makes the PWA feel respectful.
- **Widgets (iOS 16+ home screen / Android).** PWAs can do this now with the badging API and shortcuts — would make daily check-ins one-tap from the home screen.

---

## Quality-of-code (invisible to users but matters)

- **E2E tests with Playwright** for the critical paths: create habit → complete → see streak. We have unit tests but no integration.
- **Bundle analyzer pass.** The main bundle is 252 kB gzipped — Lucide icons especially are worth a tree-shake check. Easy 50–100 kB win on initial load.

---

## Recommended next three

With swipe gestures, undo toast, all-done state, and inline expand now shipped, the next high-impact set is:

1. **Year heatmap on habit detail** — the feature people screenshot and share.
2. **Skip-with-reason for habits** — protects streaks; big retention win.
3. **Haptic + sound feedback on completion** — small effort, huge feel upgrade on top of the existing burst animation.
