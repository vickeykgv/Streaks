import type { SyncMeta } from '@/types'

export type VehicleType = 'bike' | 'car' | 'scooter' | 'other'
export type FuelType = 'petrol' | 'diesel' | 'cng' | 'electric' | 'hybrid'
export type ServiceType = 'general' | 'oil_change' | 'tire' | 'brake' | 'battery' | 'major' | 'other'
export type IssuePriority = 'low' | 'medium' | 'high'
export type IssueStatus = 'open' | 'resolved'
export type DocumentType = 'insurance' | 'driving_license'
export type UnitSystem = 'metric' | 'imperial'

export interface MotoVehicle extends SyncMeta {
  id: string
  name: string
  make: string
  model: string
  year: number
  registrationNo: string
  vehicleType: VehicleType
  fuelType: FuelType
  tankCapacityL?: number
  purchaseDate?: string       // 'YYYY-MM-DD'
  purchaseOdoKm?: number
  currentOdoKm: number
  color: string
  archived: boolean
  createdAt: number
}

export interface MotoFuelLog extends SyncMeta {
  id: string
  vehicleId: string
  date: string               // 'YYYY-MM-DD'
  odoKm: number
  litres: number
  pricePerL: number
  totalCost: number
  fuelType: FuelType
  station?: string
  fullTank: boolean
  note?: string
  createdAt: number
}

export interface MotoService extends SyncMeta {
  id: string
  vehicleId: string
  date: string               // 'YYYY-MM-DD'
  odoKm: number
  serviceType: ServiceType
  workshop?: string
  laborCost: number
  partsCost: number
  totalCost: number
  nextDueDate?: string       // 'YYYY-MM-DD'
  nextDueOdoKm?: number
  note?: string
  linkedIssueIds: string[]
  createdAt: number
}

export interface MotoPart extends SyncMeta {
  id: string
  vehicleId: string
  partName: string
  partNumber?: string
  brand?: string
  installedAt: string        // 'YYYY-MM-DD'
  odoKmAtInstall: number
  cost: number
  expectedLifeKm?: number
  expectedLifeMonths?: number
  linkedServiceId?: string
  note?: string
  createdAt: number
}

export interface MotoIssue extends SyncMeta {
  id: string
  vehicleId: string
  title: string
  description?: string
  status: IssueStatus
  priority: IssuePriority
  reportedAt: string         // 'YYYY-MM-DD'
  resolvedAt?: string        // 'YYYY-MM-DD'
  resolvedByServiceId?: string
  createdAt: number
}

export interface MotoNote extends SyncMeta {
  id: string
  vehicleId: string
  title?: string
  body: string
  pinned: boolean
  createdAt: number
}

export interface MotoDocument extends SyncMeta {
  id: string
  vehicleId?: string         // undefined for driving_license (personal)
  type: DocumentType
  provider?: string
  policyNo?: string          // policy number for insurance, licence number for DL
  issuedDate?: string        // 'YYYY-MM-DD'
  expiryDate: string         // 'YYYY-MM-DD'
  premium?: number
  reminderDaysBefore: number
  note?: string
  createdAt: number
}

// Generic vehicle-specific document (RC book, PUC, fitness cert, etc.)
export interface MotoVehicleDoc extends SyncMeta {
  id: string
  vehicleId: string
  name: string               // free-form: "RC Book", "PUC Certificate", etc.
  validUntil?: string        // 'YYYY-MM-DD'
  imageUrl?: string          // optional link to scan/photo
  note?: string
  createdAt: number
}

// Maintenance checklist item — notes to bring up at the next service
export interface MotoMaintenanceItem extends SyncMeta {
  id: string
  vehicleId: string
  title: string              // e.g. "Front brake feels soft"
  checked: boolean           // true = addressed / told to mechanic
  createdAt: number
}
