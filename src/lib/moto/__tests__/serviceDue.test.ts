import { describe, it, expect } from 'vitest'
import { getServiceDueStatus } from '../serviceDue'
import type { MotoService } from '@/types/moto'

function makeService(overrides: Partial<MotoService>): MotoService {
  return {
    id: 's1',
    vehicleId: 'v1',
    date: '2024-01-01',
    odoKm: 10000,
    serviceType: 'general',
    laborCost: 0,
    partsCost: 0,
    totalCost: 0,
    linkedIssueIds: [],
    createdAt: 0,
    updatedAt: 0,
    dirty: false,
    ...overrides,
  }
}

describe('getServiceDueStatus', () => {
  it('ok when no last service', () => {
    const result = getServiceDueStatus(null, 12000, '2024-06-01')
    expect(result.overall).toBe('ok')
  })

  it('ok when both due dates are far away', () => {
    const service = makeService({ nextDueDate: '2025-01-01', nextDueOdoKm: 20000 })
    const result = getServiceDueStatus(service, 12000, '2024-06-01')
    expect(result.overall).toBe('ok')
  })

  it('due-soon by date within 14 days', () => {
    const service = makeService({ nextDueDate: '2024-06-10' })
    const result = getServiceDueStatus(service, 12000, '2024-06-01')
    expect(result.byDate).toBe('due-soon')
    expect(result.daysRemaining).toBe(9)
  })

  it('overdue by date', () => {
    const service = makeService({ nextDueDate: '2024-05-01' })
    const result = getServiceDueStatus(service, 12000, '2024-06-01')
    expect(result.byDate).toBe('overdue')
    expect(result.overall).toBe('overdue')
  })

  it('due-soon by odo within 500 km', () => {
    const service = makeService({ nextDueOdoKm: 15000 })
    const result = getServiceDueStatus(service, 14600, '2024-06-01')
    expect(result.byOdo).toBe('due-soon')
    expect(result.kmRemaining).toBe(400)
  })

  it('overdue by odo', () => {
    const service = makeService({ nextDueOdoKm: 15000 })
    const result = getServiceDueStatus(service, 15500, '2024-06-01')
    expect(result.byOdo).toBe('overdue')
    expect(result.overall).toBe('overdue')
  })
})
