import { describe, it, expect } from 'vitest'
import { isEntryComplete } from '../measurement'
import type { Habit, HabitEntry } from '@/types'

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1', title: 'Test', tags: [], measurementType: 'checkbox',
    recurrence: { type: 'daily' }, startDate: '2025-01-01',
    color: '#6366f1', icon: '✅', archived: false,
    createdAt: 0, updatedAt: 0, dirty: false,
    ...overrides,
  }
}

function entry(overrides: Partial<HabitEntry> = {}): HabitEntry {
  return { id: 'h_2025-04-22', habitId: 'h1', date: '2025-04-22', status: 'pending', updatedAt: 0, dirty: false, ...overrides }
}

describe('isEntryComplete', () => {
  it('returns false when entry is undefined', () => {
    expect(isEntryComplete(undefined, habit())).toBe(false)
  })

  it('checkbox: done when status is done', () => {
    expect(isEntryComplete(entry({ status: 'done' }), habit())).toBe(true)
  })

  it('checkbox: not done when status is pending', () => {
    expect(isEntryComplete(entry(), habit())).toBe(false)
  })

  it('count: done when value >= target', () => {
    const h = habit({ measurementType: 'count', target: 8 })
    expect(isEntryComplete(entry({ value: 8 }), h)).toBe(true)
    expect(isEntryComplete(entry({ value: 10 }), h)).toBe(true)
    expect(isEntryComplete(entry({ value: 7 }), h)).toBe(false)
  })

  it('count: done when any value > 0 and no target', () => {
    const h = habit({ measurementType: 'count' })
    expect(isEntryComplete(entry({ value: 1 }), h)).toBe(true)
    expect(isEntryComplete(entry({ value: 0 }), h)).toBe(false)
  })

  it('duration: done when value >= target in minutes', () => {
    const h = habit({ measurementType: 'duration', target: 20 })
    expect(isEntryComplete(entry({ value: 20 }), h)).toBe(true)
    expect(isEntryComplete(entry({ value: 19 }), h)).toBe(false)
  })

  it('numeric: done when value > 0 and no target', () => {
    const h = habit({ measurementType: 'numeric' })
    expect(isEntryComplete(entry({ value: 75 }), h)).toBe(true)
    expect(isEntryComplete(entry({ value: 0 }), h)).toBe(false)
  })

  it('rating: done when value is set (any positive)', () => {
    const h = habit({ measurementType: 'rating' })
    expect(isEntryComplete(entry({ value: 3 }), h)).toBe(true)
    expect(isEntryComplete(entry({ value: 1 }), h)).toBe(true)
    expect(isEntryComplete(entry({ value: 0 }), h)).toBe(false)
    expect(isEntryComplete(entry(), h)).toBe(false)
  })
})
