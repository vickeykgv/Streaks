# Future Implementation Ideas

A prioritized backlog of improvements for the Habit Tracker PWA — high-impact items first, each with the tradeoff so we can decide what's worth the time.

---

## Quick wins (a day or less each)

- **Haptic + sound on completion.** `navigator.vibrate(15)` on mark-complete and a tiny "pop" sound (toggleable). The visual burst feels twice as good with a 15ms buzz. Free dopamine.
- **Undo toast after destructive actions.** When deleting or completing a task via the row swipe/menu, show a toast with an "Undo" button for 4s before committing. Lowers anxiety about taps.
- **Swipe gestures on rows.** Right-swipe to complete, left-swipe to delete (with confirm). Standard mobile pattern; people expect it on a PWA.
- **Empty-state for "All done!".** When `doneToday === totalToday` and > 0, show a celebratory state in the Today list (not just the percent chip). It's a wasted moment of joy right now.
- **Tap row to expand inline** instead of jumping to the detail page for quick edits (notes, snooze, reschedule). Detail page is overkill for "I want to add a note about today."

---

## Engagement features (a few days each)

- **Snooze / reschedule a task** to tomorrow / next week / pick-a-date. Right now an overdue task just sits there — letting users defer is huge for not feeling defeated.
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
- **Bundle analyzer pass.** Lucide icons especially — make sure tree-shaking is working. Easy 50–100kb win on initial load.

---

## Recommended next three

If picking only three to do next:

1. **Swipe gestures + undo toast** — interaction feel.
2. **Snooze / skip-with-reason** — kindness toward the user.
3. **Year heatmap on habit detail** — the feature people will screenshot and share.
