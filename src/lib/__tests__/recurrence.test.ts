import { describe, it, expect } from 'vitest'
import { isHabitDueOn } from '../recurrence'
import type { Habit } from '@/types'

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    title: 'Test',
    tags: [],
    measurementType: 'checkbox',
    recurrence: { type: 'daily' },
    startDate: '2025-01-01',
    color: '#6366f1',
    icon: '✅',
    archived: false,
    createdAt: 0,
    updatedAt: 0,
    dirty: false,
    ...overrides,
  }
}

describe('isHabitDueOn', () => {
  it('daily habit is due every day', () => {
    const h = makeHabit({ recurrence: { type: 'daily' }, startDate: '2025-01-01' })
    expect(isHabitDueOn(h, '2025-04-22')).toBe(true)
    expect(isHabitDueOn(h, '2025-12-31')).toBe(true)
  })

  it('not due before startDate', () => {
    const h = makeHabit({ recurrence: { type: 'daily' }, startDate: '2025-06-01' })
    expect(isHabitDueOn(h, '2025-05-31')).toBe(false)
    expect(isHabitDueOn(h, '2025-06-01')).toBe(true)
  })

  it('not due after endDate', () => {
    const h = makeHabit({ recurrence: { type: 'daily' }, startDate: '2025-01-01', endDate: '2025-03-01' })
    expect(isHabitDueOn(h, '2025-03-01')).toBe(true)
    expect(isHabitDueOn(h, '2025-03-02')).toBe(false)
  })

  it('archived habit is never due', () => {
    const h = makeHabit({ archived: true })
    expect(isHabitDueOn(h, '2025-04-22')).toBe(false)
  })

  it('weekly habit only on specified days', () => {
    // Mon=1, Wed=3, Fri=5
    const h = makeHabit({ recurrence: { type: 'weekly', daysOfWeek: [1, 3, 5] }, startDate: '2025-01-01' })
    expect(isHabitDueOn(h, '2025-04-21')).toBe(true)  // Monday
    expect(isHabitDueOn(h, '2025-04-22')).toBe(false) // Tuesday
    expect(isHabitDueOn(h, '2025-04-23')).toBe(true)  // Wednesday
    expect(isHabitDueOn(h, '2025-04-25')).toBe(true)  // Friday
    expect(isHabitDueOn(h, '2025-04-26')).toBe(false) // Saturday
  })

  it('custom interval every 2 days', () => {
    const h = makeHabit({ recurrence: { type: 'custom', interval: 2 }, startDate: '2025-04-20' })
    expect(isHabitDueOn(h, '2025-04-20')).toBe(true)  // day 0
    expect(isHabitDueOn(h, '2025-04-21')).toBe(false) // day 1
    expect(isHabitDueOn(h, '2025-04-22')).toBe(true)  // day 2
    expect(isHabitDueOn(h, '2025-04-23')).toBe(false) // day 3
    expect(isHabitDueOn(h, '2025-04-24')).toBe(true)  // day 4
  })

  it('custom interval every 3 days', () => {
    const h = makeHabit({ recurrence: { type: 'custom', interval: 3 }, startDate: '2025-04-01' })
    expect(isHabitDueOn(h, '2025-04-01')).toBe(true)  // day 0
    expect(isHabitDueOn(h, '2025-04-02')).toBe(false)
    expect(isHabitDueOn(h, '2025-04-03')).toBe(false)
    expect(isHabitDueOn(h, '2025-04-04')).toBe(true)  // day 3
  })
})
