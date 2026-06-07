import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/db/database'
import { mergeIntoTable } from '@/sync/engine'
import type { Habit } from '@/types'

function makeHabit(over: Partial<Habit> & Pick<Habit, 'id'>): Habit {
  return {
    title: 'Habit',
    tags: [],
    measurementType: 'checkbox',
    recurrence: { type: 'daily' },
    startDate: '2026-01-01',
    color: '#6366f1',
    icon: '✅',
    archived: false,
    createdAt: 1000,
    updatedAt: 1000,
    dirty: false,
    ...over,
  }
}

describe('mergeIntoTable', () => {
  beforeEach(async () => {
    await db.habits.clear()
  })

  it('adds a server record that is missing locally, regardless of its timestamp', async () => {
    // Simulates a full pull bringing down "Change Bank Address" written on another
    // device whose clock (updatedAt) is far behind this device.
    await mergeIntoTable(db.habits, [makeHabit({ id: 'a', title: 'Change Bank Address', updatedAt: 5 })])

    const got = await db.habits.get('a')
    expect(got?.title).toBe('Change Bank Address')
    expect(got?.dirty).toBe(false)
  })

  it('does not overwrite a locally dirty record even when the server copy has a newer timestamp', async () => {
    // This is the clock-skew data-loss case: after the server stamps updated_at on
    // push, a behind-clock device could see serverRecord.updatedAt > its pending edit.
    await db.habits.add(makeHabit({ id: 'b', title: 'Local edit', updatedAt: 100, dirty: true }))

    await mergeIntoTable(db.habits, [makeHabit({ id: 'b', title: 'Server copy', updatedAt: 9999 })])

    const got = await db.habits.get('b')
    expect(got?.title).toBe('Local edit')
    expect(got?.dirty).toBe(true)
  })

  it('applies a newer server record over a clean local copy', async () => {
    await db.habits.add(makeHabit({ id: 'c', title: 'Old', updatedAt: 100, dirty: false }))

    await mergeIntoTable(db.habits, [makeHabit({ id: 'c', title: 'New', updatedAt: 200 })])

    const got = await db.habits.get('c')
    expect(got?.title).toBe('New')
    expect(got?.dirty).toBe(false)
  })

  it('applies a server deletion to a clean local copy', async () => {
    await db.habits.add(makeHabit({ id: 'd', updatedAt: 100, dirty: false }))

    await mergeIntoTable(db.habits, [makeHabit({ id: 'd', updatedAt: 200, deletedAt: 200 })])

    const got = await db.habits.get('d')
    expect(got?.deletedAt).toBe(200)
  })
})
