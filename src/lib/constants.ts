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

export const TAG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
]
