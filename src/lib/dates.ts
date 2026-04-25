import { format, parseISO, isBefore, startOfDay } from 'date-fns'

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatDisplayDate(date: string): string {
  return format(parseISO(date + 'T12:00:00'), 'EEE, MMM d')
}

export function isOverdue(date: string): boolean {
  return isBefore(startOfDay(parseISO(date + 'T12:00:00')), startOfDay(new Date()))
}

export function addDaysFromToday(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return format(d, 'yyyy-MM-dd')
}
