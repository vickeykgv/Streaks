import type { MotoPart } from '@/types/moto'
import { differenceInMonths, parseISO } from 'date-fns'

export type DueStatus = 'ok' | 'due-soon' | 'overdue'

const DUE_SOON_KM_BUFFER = 500   // warn within 500 km of expected life
const DUE_SOON_MONTH_BUFFER = 1  // warn within 1 month of expected life

export function getPartDueStatus(
  part: MotoPart,
  currentOdoKm: number,
  today: string, // 'YYYY-MM-DD'
): DueStatus {
  const kmStatus = getByKm(part, currentOdoKm)
  const monthStatus = getByMonths(part, today)

  // Return the worst of the two
  if (kmStatus === 'overdue' || monthStatus === 'overdue') return 'overdue'
  if (kmStatus === 'due-soon' || monthStatus === 'due-soon') return 'due-soon'
  return 'ok'
}

function getByKm(part: MotoPart, currentOdoKm: number): DueStatus {
  if (!part.expectedLifeKm) return 'ok'
  const usedKm = currentOdoKm - part.odoKmAtInstall
  const remaining = part.expectedLifeKm - usedKm
  if (remaining <= 0) return 'overdue'
  if (remaining <= DUE_SOON_KM_BUFFER) return 'due-soon'
  return 'ok'
}

function getByMonths(part: MotoPart, today: string): DueStatus {
  if (!part.expectedLifeMonths) return 'ok'
  const monthsUsed = differenceInMonths(parseISO(today), parseISO(part.installedAt))
  const remaining = part.expectedLifeMonths - monthsUsed
  if (remaining <= 0) return 'overdue'
  if (remaining <= DUE_SOON_MONTH_BUFFER) return 'due-soon'
  return 'ok'
}
