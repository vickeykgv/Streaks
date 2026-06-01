import { describe, it, expect } from 'vitest'
import { getDocumentStatus } from '../documentStatus'
import type { MotoDocument } from '@/types/moto'

function makeDoc(overrides: Partial<MotoDocument>): MotoDocument {
  return {
    id: 'd1',
    type: 'insurance',
    expiryDate: '2025-01-01',
    reminderDaysBefore: 30,
    createdAt: 0,
    updatedAt: 0,
    dirty: false,
    ...overrides,
  }
}

describe('getDocumentStatus', () => {
  it('valid when well before expiry', () => {
    const doc = makeDoc({ expiryDate: '2025-01-01', reminderDaysBefore: 30 })
    const result = getDocumentStatus(doc, '2024-11-01')
    expect(result.status).toBe('valid')
    expect(result.daysRemaining).toBe(61)
  })

  it('expiring within reminderDaysBefore window', () => {
    const doc = makeDoc({ expiryDate: '2025-01-01', reminderDaysBefore: 30 })
    const result = getDocumentStatus(doc, '2024-12-15')
    expect(result.status).toBe('expiring')
    expect(result.daysRemaining).toBe(17)
  })

  it('expired when past expiry date', () => {
    const doc = makeDoc({ expiryDate: '2024-01-01' })
    const result = getDocumentStatus(doc, '2024-06-01')
    expect(result.status).toBe('expired')
    expect(result.daysRemaining).toBeLessThan(0)
  })

  it('expiring on the day of expiry', () => {
    const doc = makeDoc({ expiryDate: '2024-06-01', reminderDaysBefore: 30 })
    const result = getDocumentStatus(doc, '2024-06-01')
    expect(result.status).toBe('expiring')
    expect(result.daysRemaining).toBe(0)
  })
})
