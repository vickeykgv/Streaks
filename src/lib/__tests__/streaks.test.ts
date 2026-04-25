import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computeStreak, computeLongestStreak, computeCompletionRate } from '../streaks'
import type { HabitEntry } from '@/types'

function entry(date: string, status: HabitEntry['status'] = 'done'): HabitEntry {
  return { id: `h_${date}`, habitId: 'h1', date, status, updatedAt: 0, dirty: false }
}

describe('computeStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-04-22T10:00:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns 0 when no entries', () => {
    expect(computeStreak([])).toBe(0)
  })

  it('returns 0 when today and yesterday are not done', () => {
    expect(computeStreak([entry('2025-04-19')])).toBe(0)
  })

  it('counts streak ending today', () => {
    const entries = [entry('2025-04-20'), entry('2025-04-21'), entry('2025-04-22')]
    expect(computeStreak(entries)).toBe(3)
  })

  it('counts streak ending yesterday when today not done', () => {
    const entries = [entry('2025-04-19'), entry('2025-04-20'), entry('2025-04-21')]
    expect(computeStreak(entries)).toBe(3)
  })

  it('stops at gap', () => {
    const entries = [entry('2025-04-19'), entry('2025-04-21'), entry('2025-04-22')]
    expect(computeStreak(entries)).toBe(2)
  })

  it('counts partial as done', () => {
    expect(computeStreak([entry('2025-04-22', 'partial')])).toBe(1)
  })

  it('does not count skipped', () => {
    expect(computeStreak([entry('2025-04-22', 'skipped')])).toBe(0)
  })
})

describe('computeLongestStreak', () => {
  it('returns 0 for empty', () => {
    expect(computeLongestStreak([])).toBe(0)
  })

  it('finds longest run', () => {
    const entries = [
      entry('2025-01-01'), entry('2025-01-02'), entry('2025-01-03'), // 3
      entry('2025-01-10'), entry('2025-01-11'),                       // 2
      entry('2025-01-20'), entry('2025-01-21'), entry('2025-01-22'), entry('2025-01-23'), // 4
    ]
    expect(computeLongestStreak(entries)).toBe(4)
  })
})

describe('computeCompletionRate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-04-22T10:00:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns 0 when no entries', () => {
    expect(computeCompletionRate([], 7)).toBe(0)
  })

  it('computes rate from recent entries only', () => {
    const entries = [
      entry('2025-04-22'), // within 7 days
      entry('2025-04-21'), // within 7 days
      entry('2025-04-20', 'pending'), // within 7 days, not done
      entry('2025-04-01'), // outside 7 days
    ]
    const rate = computeCompletionRate(entries, 7)
    // 2 done out of 3 recent entries
    expect(rate).toBeCloseTo(2 / 3)
  })
})
