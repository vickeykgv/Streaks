import type { MotoDocument } from '@/types/moto'
import { differenceInDays, parseISO } from 'date-fns'

export type DocStatus = 'valid' | 'expiring' | 'expired'

export interface DocumentStatusResult {
  status: DocStatus
  daysRemaining: number
}

export function getDocumentStatus(doc: MotoDocument, today: string): DocumentStatusResult {
  const daysRemaining = differenceInDays(parseISO(doc.expiryDate), parseISO(today))

  let status: DocStatus = 'valid'
  if (daysRemaining < 0) {
    status = 'expired'
  } else if (daysRemaining <= doc.reminderDaysBefore) {
    status = 'expiring'
  }

  return { status, daysRemaining }
}
