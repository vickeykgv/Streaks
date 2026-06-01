import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { fuelLogsRepo } from '@/db/repos/moto/fuelLogs'
import { servicesRepo } from '@/db/repos/moto/services'
import { issuesRepo } from '@/db/repos/moto/issues'
import { documentsRepo } from '@/db/repos/moto/documents'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { partsRepo } from '@/db/repos/moto/parts'
import { latestKmpl as computeLatestKmpl, computeFuelEfficiency } from '@/lib/moto/fuelEfficiency'
import { getServiceDueStatus } from '@/lib/moto/serviceDue'
import { getDocumentStatus } from '@/lib/moto/documentStatus'
import { getPartDueStatus, type DueStatus } from '@/lib/moto/partsLife'
import type { MotoFuelLog, MotoService, MotoPart } from '@/types/moto'

export type RecentActivityItem =
  | { kind: 'fuel'; log: MotoFuelLog; date: string }
  | { kind: 'service'; service: MotoService; date: string }

export interface PartDueItem {
  part: MotoPart
  status: DueStatus
}

export interface EfficiencyPoint {
  date: string
  kmpl: number
}

export function useMotoDashboard(vehicleId: string | null) {
  const today = format(new Date(), 'yyyy-MM-dd')

  const vehicle    = useLiveQuery(() => vehicleId ? vehiclesRepo.getById(vehicleId) : Promise.resolve(undefined), [vehicleId])
  const fuelLogs   = useLiveQuery(() => vehicleId ? fuelLogsRepo.getAllForVehicle(vehicleId) : Promise.resolve([]), [vehicleId]) ?? []
  const services   = useLiveQuery(() => vehicleId ? servicesRepo.getAllForVehicle(vehicleId) : Promise.resolve([]), [vehicleId]) ?? []
  const openIssues = useLiveQuery(() => vehicleId ? issuesRepo.getAllForVehicle(vehicleId, 'open') : Promise.resolve([]), [vehicleId]) ?? []
  const allDocs    = useLiveQuery(() => documentsRepo.getAll(vehicleId ?? undefined), [vehicleId]) ?? []
  const parts      = useLiveQuery(() => vehicleId ? partsRepo.getAllForVehicle(vehicleId) : Promise.resolve([]), [vehicleId]) ?? []

  const { monthStart, monthEnd } = useMemo(() => {
    const now = new Date()
    return { monthStart: startOfMonth(now).getTime(), monthEnd: endOfMonth(now).getTime() }
  }, [])

  const lastFuelLog   = fuelLogs[0] ?? null
  const latestKmpl    = fuelLogs.length > 0 ? computeLatestKmpl(fuelLogs) : null
  const lastService   = services[0] ?? null
  const nextDueStatus = getServiceDueStatus(lastService, vehicle?.currentOdoKm ?? 0, today)

  const monthFuelLogs       = fuelLogs.filter(l => { const t = parseISO(l.date).getTime(); return t >= monthStart && t <= monthEnd })
  const monthFuelSpend      = monthFuelLogs.reduce((s, l) => s + l.totalCost, 0)
  const totalFillsThisMonth = monthFuelLogs.length

  const docsWithStatus = allDocs.map(doc => ({ doc, ...getDocumentStatus(doc, today) }))
  const alertDocs = docsWithStatus
    .filter(d => d.status !== 'valid')
    .sort((a, b) => a.daysRemaining - b.daysRemaining)

  const highPriorityCount = openIssues.filter(i => i.priority === 'high').length

  const partsDue: PartDueItem[] = useMemo(() => {
    if (!vehicle) return []
    return parts
      .map(p => ({ part: p, status: getPartDueStatus(p, vehicle.currentOdoKm, today) }))
      .filter(p => p.status !== 'ok')
  }, [parts, vehicle, today])

  const recentActivity: RecentActivityItem[] = useMemo(() => {
    const fuelItems: RecentActivityItem[] = fuelLogs.slice(0, 6).map(l => ({ kind: 'fuel', log: l, date: l.date }))
    const serviceItems: RecentActivityItem[] = services.slice(0, 6).map(s => ({ kind: 'service', service: s, date: s.date }))
    return [...fuelItems, ...serviceItems]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8)
  }, [fuelLogs, services])

  const efficiencyPoints: EfficiencyPoint[] = useMemo(() =>
    computeFuelEfficiency(fuelLogs)
      .slice(-12)
      .map(e => ({ date: format(parseISO(e.date), 'MMM d'), kmpl: parseFloat(e.kmpl.toFixed(2)) })),
    [fuelLogs],
  )

  return {
    vehicle,
    lastFuelLog,
    latestKmpl,
    monthFuelSpend,
    totalFillsThisMonth,
    lastService,
    nextDueStatus,
    openIssues,
    highPriorityCount,
    alertDocs,
    partsDue,
    recentActivity,
    efficiencyPoints,
    today,
    isLoading: vehicle === undefined && vehicleId !== null,
  }
}
