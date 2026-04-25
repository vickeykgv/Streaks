export const copy = {
  // Dashboard
  greetingMorning:   'Good morning',
  greetingAfternoon: 'Good afternoon',
  greetingEvening:   'Good evening',
  allDoneToday:      "All done for today! 🎉",
  nothingToday:      "Nothing scheduled — enjoy the day",
  overdueSection:    (n: number) => `${n} task${n !== 1 ? 's' : ''} need${n === 1 ? 's' : ''} attention`,

  // Habits
  noHabits:     "No habits yet",
  noHabitsHint: "Build a routine — add your first habit",
  habitArchived: "Habit archived",
  habitDeleted:  "Habit removed",
  streakLabel:   (n: number) => `🔥 ${n} day${n !== 1 ? 's' : ''} in a row`,

  // Tasks
  noTasks:    "All clear",
  noTasksHint:"No tasks due — you're on top of it",
  taskDone:   "Done! ✓",
  taskSkipped:"Skipped",

  // Sync
  syncingNow:    "Syncing…",
  syncDone:      "All caught up ✓",
  syncError:     "Sync failed — tap to retry",
  offlineBanner: "You're offline — changes sync when you're back",

  // Auth
  signOutDone: "Signed out. Your local data is still here.",

  // Generic
  saved:         "Saved!",
  deleted:       "Deleted",
  confirmDelete: (thing: string) => `Delete this ${thing}? This can't be undone.`,
  error:         "Something went wrong. Try again?",
} as const
