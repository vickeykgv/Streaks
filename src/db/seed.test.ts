import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/db/database'

beforeEach(async () => {
  await db.habits.clear()
})

describe('Dexie schema smoke test', () => {
  it('inserts and reads back a habit', async () => {
    const id = 'test-habit-1'
    await db.habits.add({
      id,
      title: 'Test Habit',
      tags: [],
      measurementType: 'checkbox',
      recurrence: { type: 'daily' },
      startDate: '2026-01-01',
      color: '#6366f1',
      icon: '✅',
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dirty: true,
    })

    const habit = await db.habits.get(id)
    expect(habit).toBeDefined()
    expect(habit!.title).toBe('Test Habit')
    expect(habit!.dirty).toBe(true)
  })

  it('all 5 stores are accessible', async () => {
    expect(db.habits).toBeDefined()
    expect(db.tasks).toBeDefined()
    expect(db.habitEntries).toBeDefined()
    expect(db.tags).toBeDefined()
    expect(db.settings).toBeDefined()
  })
})
