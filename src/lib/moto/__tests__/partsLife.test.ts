import { describe, it, expect } from 'vitest'
import { getPartDueStatus } from '../partsLife'
import type { MotoPart } from '@/types/moto'

function makePart(overrides: Partial<MotoPart>): MotoPart {
  return {
    id: 'p1',
    vehicleId: 'v1',
    partName: 'Oil Filter',
    installedAt: '2024-01-01',
    odoKmAtInstall: 10000,
    cost: 500,
    createdAt: 0,
    updatedAt: 0,
    dirty: false,
    ...overrides,
  }
}

describe('getPartDueStatus', () => {
  it('ok when well within life limits', () => {
    const part = makePart({ expectedLifeKm: 5000, odoKmAtInstall: 10000 })
    expect(getPartDueStatus(part, 12000, '2024-03-01')).toBe('ok')
  })

  it('due-soon when within 500 km buffer', () => {
    const part = makePart({ expectedLifeKm: 5000, odoKmAtInstall: 10000 })
    // used = 14600, remaining = 400 → due-soon
    expect(getPartDueStatus(part, 14600, '2024-03-01')).toBe('due-soon')
  })

  it('overdue when life km exceeded', () => {
    const part = makePart({ expectedLifeKm: 5000, odoKmAtInstall: 10000 })
    expect(getPartDueStatus(part, 16000, '2024-03-01')).toBe('overdue')
  })

  it('overdue by months', () => {
    const part = makePart({ expectedLifeMonths: 6, installedAt: '2024-01-01' })
    expect(getPartDueStatus(part, 11000, '2024-09-01')).toBe('overdue')
  })

  it('ok when no life limits specified', () => {
    const part = makePart({})
    expect(getPartDueStatus(part, 99999, '2030-01-01')).toBe('ok')
  })
})
