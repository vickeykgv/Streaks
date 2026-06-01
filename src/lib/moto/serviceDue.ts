import type { MotoService } from '@/types/moto'
import { differenceInDays, parseISO } from 'date-fns'

export type DueStatus = 'ok' | 'due-soon' | 'overdue'

const DUE_SOON_DAYS = 14
const DUE_SOON_KM = 500

export interface ServiceDueResult {
  byDate: DueStatus
  byOdo: DueStatus
  overall: DueStatus
  daysRemaining?: number
  kmRemaining?: number
}

export function getServiceDueStatus(
  lastService: MotoService | null,
  currentOdoKm: number,
  today: string, // 'YYYY-MM-DD'
): ServiceDueResult {
  const byDate = getByDate(lastService, today)
  const byOdo = getByOdo(lastService, currentOdoKm)

  let overall: DueStatus = 'ok'
  if (byDate === 'overdue' || byOdo === 'overdue') overall = 'overdue'
  else if (byDate === 'due-soon' || byOdo === 'due-soon') overall = 'due-soon'

  const daysRemaining = lastService?.nextDueDate
    ? differenceInDays(parseISO(lastService.nextDueDate), parseISO(today))
    : undefined

  const kmRemaining = lastService?.nextDueOdoKm != null
    ? lastService.nextDueOdoKm - currentOdoKm
    : undefined

  return { byDate, byOdo, overall, daysRemaining, kmRemaining }
}

function getByDate(service: MotoService | null, today: string): DueStatus {
  if (!service?.nextDueDate) return 'ok'
  const days = differenceInDays(parseISO(service.nextDueDate), parseISO(today))
  if (days < 0) return 'overdue'
  if (days <= DUE_SOON_DAYS) return 'due-soon'
  return 'ok'
}

function getByOdo(service: MotoService | null, currentOdoKm: number): DueStatus {
  if (!service?.nextDueOdoKm) return 'ok'
  const remaining = service.nextDueOdoKm - currentOdoKm
  if (remaining <= 0) return 'overdue'
  if (remaining <= DUE_SOON_KM) return 'due-soon'
  return 'ok'
}
