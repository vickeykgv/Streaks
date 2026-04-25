import { z } from 'zod'

export const recurrenceSchema = z.object({
  type: z.enum(['daily', 'weekly', 'custom']),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  interval: z.number().min(1).max(365).optional(),
})

const worldSchema = z.enum(['personal', 'professional']).default('personal')

export const habitSchema = z.object({
  title:           z.string().min(1, 'Title is required').max(100),
  description:     z.string().max(500).optional(),
  tags:            z.array(z.string()).default([]),
  measurementType: z.enum(['checkbox', 'count', 'duration', 'numeric', 'rating']),
  target:          z.number().positive().optional(),
  unit:            z.string().max(20).optional(),
  recurrence:      recurrenceSchema,
  startDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).transform(v => v || undefined),
  reminderTime:    z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')).transform(v => v || undefined),
  color:           z.string().default('#6366f1'),
  icon:            z.string().default('✅'),
  world:           worldSchema,
})

export const taskSchema = z.object({
  title:           z.string().min(1, 'Title is required').max(100),
  description:     z.string().max(500).optional(),
  tags:            z.array(z.string()).default([]),
  measurementType: z.enum(['checkbox', 'count', 'duration', 'numeric', 'rating']),
  target:          z.number().positive().optional(),
  unit:            z.string().max(20).optional(),
  dueDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date is required'),
  dueTime:         z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')).transform(v => v || undefined),
  priority:        z.enum(['low', 'med', 'high']).default('med'),
  color:           z.string().default('#6366f1'),
  icon:            z.string().default('🎯'),
  world:           worldSchema,
})

export type HabitFormValues = z.infer<typeof habitSchema>
export type TaskFormValues  = z.infer<typeof taskSchema>
