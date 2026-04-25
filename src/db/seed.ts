import { format, subDays } from 'date-fns'
import { habitsRepo } from '@/db/repos/habits'
import { tasksRepo } from '@/db/repos/tasks'
import { tagsRepo } from '@/db/repos/tags'
import { entriesRepo } from '@/db/repos/entries'
import { db } from '@/db/database'

export async function seedIfEmpty() {
  const habitCount = await db.habits.count()
  if (habitCount > 0) return

  const today = format(new Date(), 'yyyy-MM-dd')

  // Tags
  const healthTag = await tagsRepo.create('health', '#22c55e')
  const focusTag = await tagsRepo.create('focus', '#6366f1')

  // Habits
  const drinkWater = await habitsRepo.create({
    title: 'Drink 8 glasses of water',
    tags: [healthTag.id],
    measurementType: 'count',
    target: 8,
    unit: 'glasses',
    recurrence: { type: 'daily' },
    startDate: format(subDays(new Date(), 14), 'yyyy-MM-dd'),
    color: '#06b6d4',
    icon: '💧',
    archived: false,
  })

  const meditation = await habitsRepo.create({
    title: 'Morning meditation',
    tags: [focusTag.id],
    measurementType: 'checkbox',
    recurrence: { type: 'daily' },
    startDate: format(subDays(new Date(), 14), 'yyyy-MM-dd'),
    color: '#8b5cf6',
    icon: '🧘',
    archived: false,
  })

  const moodLog = await habitsRepo.create({
    title: 'Rate your mood',
    tags: [],
    measurementType: 'rating',
    target: 5,
    recurrence: { type: 'daily' },
    startDate: format(subDays(new Date(), 14), 'yyyy-MM-dd'),
    color: '#f59e0b',
    icon: '😊',
    archived: false,
  })

  // Tasks
  await tasksRepo.create({
    title: 'Review weekly goals',
    tags: [focusTag.id],
    measurementType: 'checkbox',
    dueDate: today,
    priority: 'high',
    status: 'pending',
    color: '#6366f1',
    icon: '📋',
  })

  await tasksRepo.create({
    title: 'Plan next sprint',
    tags: [focusTag.id],
    measurementType: 'checkbox',
    dueDate: format(subDays(new Date(), -3), 'yyyy-MM-dd'),
    priority: 'med',
    status: 'pending',
    color: '#6366f1',
    icon: '📅',
  })

  // Past HabitEntries (last 7 days) so streaks are non-zero
  for (let i = 7; i >= 1; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')

    await entriesRepo.upsert(drinkWater.id, date, {
      status: 'done',
      value: 8,
      completedAt: Date.now(),
    })

    await entriesRepo.upsert(meditation.id, date, {
      status: i === 3 ? 'skipped' : 'done',
      completedAt: i === 3 ? undefined : Date.now(),
    })

    await entriesRepo.upsert(moodLog.id, date, {
      status: 'done',
      value: Math.floor(Math.random() * 2) + 4, // 4 or 5
      completedAt: Date.now(),
    })
  }
}
