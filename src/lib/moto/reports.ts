import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import type { MotoFuelLog, MotoService, MotoPart } from '@/types/moto'
import { computeFuelEfficiency } from './fuelEfficiency'

export type MotoReportPeriod = '3m' | '6m' | '12m'

export interface MotoMonthlyBar {
  month: string   // 'Jan', 'Feb', …
  fuel: number
  service: number
  parts: number
}

export interface MotoEfficiencyPoint {
  date: string   // 'MMM d'
  kmpl: number
}

export interface MotoServiceTimelineItem {
  date: string
  odoKm: number
  serviceType: string
  totalCost: number
  intervalKm?: number   // km since previous service
}

export interface MotoReportData {
  totalFuelCost: number
  totalServiceCost: number
  totalPartsCost: number
  totalCost: number
  totalDistanceKm: number
  costPerKm: number | null
  avgMonthlySpend: number
  fillCount: number
  avgKmpl: number | null
  monthlyBars: MotoMonthlyBar[]
  costSplit: { name: string; value: number; color: string }[]
  efficiencyPoints: MotoEfficiencyPoint[]
  serviceTimeline: MotoServiceTimelineItem[]
  monthCount: number
}

function periodRange(p: MotoReportPeriod): { from: string; to: string; months: number } {
  const months = p === '3m' ? 3 : p === '6m' ? 6 : 12
  const now = new Date()
  return {
    from:   format(startOfMonth(subMonths(now, months - 1)), 'yyyy-MM-dd'),
    to:     format(endOfMonth(now), 'yyyy-MM-dd'),
    months,
  }
}

export function computeMotoReportData(
  fuelLogs: MotoFuelLog[],
  services: MotoService[],
  parts: MotoPart[],
  period: MotoReportPeriod,
): MotoReportData {
  const { from, to, months } = periodRange(period)

  const fuelInRange    = fuelLogs.filter(l => l.date >= from && l.date <= to)
  const servicesInRange = services.filter(s => s.date >= from && s.date <= to)
  const partsInRange   = parts.filter(p => p.installedAt >= from && p.installedAt <= to)

  const totalFuelCost    = fuelInRange.reduce((s, l) => s + l.totalCost, 0)
  const totalServiceCost = servicesInRange.reduce((s, sv) => s + sv.totalCost, 0)
  const totalPartsCost   = partsInRange.reduce((s, p) => s + p.cost, 0)
  const totalCost        = totalFuelCost + totalServiceCost + totalPartsCost

  // Distance: difference between max and min odometer in range fuel logs
  const odos = fuelInRange.map(l => l.odoKm)
  const totalDistanceKm = odos.length >= 2
    ? Math.max(...odos) - Math.min(...odos)
    : 0
  const costPerKm = totalDistanceKm > 0 ? totalCost / totalDistanceKm : null

  const avgMonthlySpend = totalCost / months

  // Monthly bars — build a bucket per calendar month in range
  const bars: MotoMonthlyBar[] = []
  for (let i = months - 1; i >= 0; i--) {
    const monthDate  = subMonths(new Date(), i)
    const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd')
    const monthEnd   = format(endOfMonth(monthDate),   'yyyy-MM-dd')
    const label      = format(monthDate, 'MMM')

    const fuel    = fuelLogs.filter(l => l.date >= monthStart && l.date <= monthEnd).reduce((s, l) => s + l.totalCost, 0)
    const service = services.filter(s => s.date >= monthStart && s.date <= monthEnd).reduce((s, sv) => s + sv.totalCost, 0)
    const p       = parts.filter(pt => pt.installedAt >= monthStart && pt.installedAt <= monthEnd).reduce((s, pt) => s + pt.cost, 0)

    bars.push({ month: label, fuel, service, parts: p })
  }

  // Cost split for pie
  const costSplit = [
    { name: 'Fuel',    value: totalFuelCost,    color: '#e50914' },
    { name: 'Service', value: totalServiceCost,  color: '#f97316' },
    { name: 'Parts',   value: totalPartsCost,    color: '#6366f1' },
  ].filter(s => s.value > 0)

  // Fuel efficiency trend — use full sorted log history (not just period) for accurate fill-to-fill
  const efficiencySeries = computeFuelEfficiency(fuelLogs)
  const pointsInRange = efficiencySeries.filter(e => e.date >= from && e.date <= to)
  const efficiencyPoints: MotoEfficiencyPoint[] = pointsInRange.map(e => ({
    date: format(parseISO(e.date), 'MMM d'),
    kmpl: parseFloat(e.kmpl.toFixed(2)),
  }))
  const avgKmpl = efficiencyPoints.length > 0
    ? efficiencyPoints.reduce((s, e) => s + e.kmpl, 0) / efficiencyPoints.length
    : null

  // Service timeline — sorted oldest first, annotate with km gap from previous
  const allServicesSorted = [...services]
    .sort((a, b) => a.date.localeCompare(b.date))
  const serviceTimeline: MotoServiceTimelineItem[] = allServicesSorted
    .slice(-10)  // last 10 services for the timeline
    .map((sv, i, arr) => ({
      date:        sv.date,
      odoKm:       sv.odoKm,
      serviceType: sv.serviceType,
      totalCost:   sv.totalCost,
      intervalKm:  i > 0 ? sv.odoKm - arr[i - 1].odoKm : undefined,
    }))
    .reverse()   // newest first for display

  return {
    totalFuelCost,
    totalServiceCost,
    totalPartsCost,
    totalCost,
    totalDistanceKm,
    costPerKm,
    avgMonthlySpend,
    fillCount: fuelInRange.length,
    avgKmpl,
    monthlyBars: bars,
    costSplit,
    efficiencyPoints,
    serviceTimeline,
    monthCount: months,
  }
}

export function motoReportPeriodLabel(p: MotoReportPeriod): string {
  return p === '3m' ? 'Last 3 months' : p === '6m' ? 'Last 6 months' : 'Last 12 months'
}
