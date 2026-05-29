import { describe, it, expect } from 'vitest'
import { computeMotoReportData } from '../reports'
import type { MotoFuelLog, MotoService, MotoPart } from '@/types/moto'
import { format, subMonths } from 'date-fns'

function date(monthsAgo: number): string {
  return format(subMonths(new Date(), monthsAgo), 'yyyy-MM-dd')
}

const syncMeta = { updatedAt: 0, dirty: false as const, createdAt: 0 }

function fuel(id: string, daysAgo: number, odoKm: number, litres: number, totalCost: number, fullTank = true): MotoFuelLog {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return {
    id, vehicleId: 'v1',
    date: format(d, 'yyyy-MM-dd'),
    odoKm, litres, pricePerL: totalCost / litres, totalCost,
    fuelType: 'petrol', fullTank,
    ...syncMeta,
  }
}

function service(id: string, monthsAgo: number, odoKm: number, totalCost: number): MotoService {
  return {
    id, vehicleId: 'v1',
    date: date(monthsAgo),
    odoKm, serviceType: 'oil_change',
    laborCost: totalCost, partsCost: 0, totalCost,
    linkedIssueIds: [],
    ...syncMeta,
  }
}

function part(id: string, monthsAgo: number, cost: number): MotoPart {
  return {
    id, vehicleId: 'v1',
    partName: 'Air filter',
    installedAt: date(monthsAgo),
    odoKmAtInstall: 5000,
    cost,
    ...syncMeta,
  }
}

describe('computeMotoReportData', () => {
  it('returns zeros when all lists empty', () => {
    const r = computeMotoReportData([], [], [], '3m')
    expect(r.totalCost).toBe(0)
    expect(r.costPerKm).toBeNull()
    expect(r.avgKmpl).toBeNull()
    expect(r.serviceTimeline).toHaveLength(0)
  })

  it('sums costs correctly within period', () => {
    const logs = [fuel('f1', 5, 1000, 10, 1000), fuel('f2', 10, 900, 8, 800)]
    const sv = [service('s1', 1, 900, 500)]
    const pts = [part('p1', 1, 300)]
    const r = computeMotoReportData(logs, sv, pts, '3m')
    expect(r.totalFuelCost).toBe(1800)
    expect(r.totalServiceCost).toBe(500)
    expect(r.totalPartsCost).toBe(300)
    expect(r.totalCost).toBe(2600)
  })

  it('excludes records outside the period', () => {
    const old = fuel('old', 200, 500, 10, 1000) // ~6 months ago, outside 3m
    const recent = fuel('new', 5, 600, 8, 800)
    const r = computeMotoReportData([old, recent], [], [], '3m')
    expect(r.totalFuelCost).toBe(800)
    expect(r.fillCount).toBe(1)
  })

  it('computes cost per km from odo range', () => {
    const logs = [
      fuel('f1', 30, 1000, 10, 500),
      fuel('f2', 5,  1500, 12, 600),
    ]
    const r = computeMotoReportData(logs, [], [], '3m')
    // distance = 1500 - 1000 = 500 km; total = 1100
    expect(r.totalDistanceKm).toBe(500)
    expect(r.costPerKm).toBeCloseTo(1100 / 500, 2)
  })

  it('builds monthly bars with correct month count', () => {
    const r = computeMotoReportData([], [], [], '6m')
    expect(r.monthlyBars).toHaveLength(6)
  })

  it('service timeline is newest first and includes interval', () => {
    const sv = [
      service('s1', 5, 1000, 200),
      service('s2', 2, 1500, 300),
    ]
    const r = computeMotoReportData([], sv, [], '6m')
    expect(r.serviceTimeline[0].odoKm).toBe(1500)  // newest first
    expect(r.serviceTimeline[0].intervalKm).toBe(500)
    expect(r.serviceTimeline[1].intervalKm).toBeUndefined()
  })
})
