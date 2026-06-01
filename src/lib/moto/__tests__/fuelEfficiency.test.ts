import { describe, it, expect } from 'vitest'
import { computeFuelEfficiency, latestKmpl } from '../fuelEfficiency'
import type { MotoFuelLog } from '@/types/moto'

function makeFuelLog(overrides: Partial<MotoFuelLog> & { id: string; date: string; odoKm: number; litres: number; fullTank: boolean }): MotoFuelLog {
  return {
    vehicleId: 'v1',
    pricePerL: 100,
    totalCost: overrides.litres * 100,
    fuelType: 'petrol',
    createdAt: 0,
    updatedAt: 0,
    dirty: false,
    ...overrides,
  }
}

describe('computeFuelEfficiency', () => {
  it('returns empty for no logs', () => {
    expect(computeFuelEfficiency([])).toEqual([])
  })

  it('returns empty for single full-tank fill (no baseline)', () => {
    const logs = [makeFuelLog({ id: '1', date: '2024-01-01', odoKm: 1000, litres: 10, fullTank: true })]
    expect(computeFuelEfficiency(logs)).toHaveLength(0)
  })

  it('computes kmpl for two consecutive full-tank fills', () => {
    const logs = [
      makeFuelLog({ id: '1', date: '2024-01-01', odoKm: 1000, litres: 10, fullTank: true }),
      makeFuelLog({ id: '2', date: '2024-01-10', odoKm: 1300, litres: 15, fullTank: true }),
    ]
    const result = computeFuelEfficiency(logs)
    expect(result).toHaveLength(1)
    expect(result[0].kmpl).toBeCloseTo(20, 1) // 300 km / 15 L
  })

  it('resets baseline after a partial fill', () => {
    const logs = [
      makeFuelLog({ id: '1', date: '2024-01-01', odoKm: 1000, litres: 10, fullTank: true }),
      makeFuelLog({ id: '2', date: '2024-01-05', odoKm: 1100, litres: 5, fullTank: false }),
      makeFuelLog({ id: '3', date: '2024-01-10', odoKm: 1300, litres: 15, fullTank: true }),
    ]
    // partial fill resets baseline, so no computation possible for fill #3
    expect(computeFuelEfficiency(logs)).toHaveLength(0)
  })

  it('latestKmpl returns null when no data', () => {
    expect(latestKmpl([])).toBeNull()
  })

  it('latestKmpl returns the last computed value', () => {
    const logs = [
      makeFuelLog({ id: '1', date: '2024-01-01', odoKm: 1000, litres: 10, fullTank: true }),
      makeFuelLog({ id: '2', date: '2024-01-10', odoKm: 1300, litres: 15, fullTank: true }),
      makeFuelLog({ id: '3', date: '2024-01-20', odoKm: 1600, litres: 10, fullTank: true }),
    ]
    expect(latestKmpl(logs)).toBeCloseTo(30, 1) // 300 km / 10 L
  })
})
