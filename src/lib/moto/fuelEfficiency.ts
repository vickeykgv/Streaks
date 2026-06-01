import type { MotoFuelLog } from '@/types/moto'

export interface FuelEfficiencyPoint {
  logId: string
  date: string
  odoKm: number
  kmpl: number
  litres: number
}

/**
 * Fill-to-fill fuel efficiency: only computes kmpl for full-tank fills that
 * follow another full-tank fill. Partial fills and the first full-tank fill
 * are returned without a kmpl value.
 */
export function computeFuelEfficiency(logs: MotoFuelLog[]): FuelEfficiencyPoint[] {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date) || a.odoKm - b.odoKm)
  const result: FuelEfficiencyPoint[] = []
  let prevFullTank: MotoFuelLog | null = null

  for (const log of sorted) {
    if (!log.fullTank) {
      prevFullTank = null // partial fill resets the baseline
      continue
    }
    if (prevFullTank !== null) {
      const distKm = log.odoKm - prevFullTank.odoKm
      if (distKm > 0 && log.litres > 0) {
        result.push({
          logId: log.id,
          date: log.date,
          odoKm: log.odoKm,
          kmpl: distKm / log.litres,
          litres: log.litres,
        })
      }
    }
    prevFullTank = log
  }

  return result
}

/** Latest kmpl value from the efficiency series, or null if insufficient data */
export function latestKmpl(logs: MotoFuelLog[]): number | null {
  const series = computeFuelEfficiency(logs)
  return series.length > 0 ? series[series.length - 1].kmpl : null
}
