import { z } from 'zod'

const optionalPositiveNumber = z.preprocess(
  v => (v === '' || v == null ? undefined : Number(v)),
  z.number().positive().optional()
)

export const vehicleSchema = z.object({
  name:           z.string().min(1, 'Nickname is required').max(60),
  make:           z.string().min(1, 'Make is required').max(60),
  model:          z.string().min(1, 'Model is required').max(60),
  year:           z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  registrationNo: z.string().max(20).default(''),
  vehicleType:    z.enum(['bike', 'car', 'scooter', 'other']).default('bike'),
  fuelType:       z.enum(['petrol', 'diesel', 'cng', 'electric', 'hybrid']).default('petrol'),
  currentOdoKm:  z.coerce.number().min(0, 'Odometer must be 0 or more').default(0),
  tankCapacityL:  optionalPositiveNumber,
  purchaseDate:   z.string().optional(),
  color:          z.string().min(1).default('#e50914'),
})
export type VehicleFormValues = z.infer<typeof vehicleSchema>

export const fuelLogSchema = z.object({
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date required'),
  odoKm:       z.coerce.number().min(0, 'Odometer required'),
  litres:      z.coerce.number().positive('Litres must be > 0'),
  pricePerL:   z.coerce.number().min(0, 'Price must be ≥ 0'),
  totalCost:   z.coerce.number().min(0, 'Cost must be ≥ 0'),
  fuelType:    z.enum(['petrol', 'diesel', 'cng', 'electric', 'hybrid']).default('petrol'),
  station:     z.string().max(100).optional(),
  fullTank:    z.boolean().default(true),
  note:        z.string().max(500).optional(),
})
export type FuelLogFormValues = z.infer<typeof fuelLogSchema>

export const serviceSchema = z.object({
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date required'),
  odoKm:          z.coerce.number().min(0, 'Odometer required'),
  serviceType:    z.enum(['general', 'oil_change', 'tire', 'brake', 'battery', 'major', 'other']).default('general'),
  workshop:       z.string().max(100).optional(),
  laborCost:      z.coerce.number().min(0).default(0),
  partsCost:      z.coerce.number().min(0).default(0),
  totalCost:      z.coerce.number().min(0).default(0),
  nextDueDate:    z.string().optional(),
  nextDueOdoKm:  optionalPositiveNumber,
  note:           z.string().max(500).optional(),
  linkedIssueIds: z.array(z.string()).default([]),
})
export type ServiceFormValues = z.infer<typeof serviceSchema>

export const partSchema = z.object({
  partName:          z.string().min(1, 'Part name required').max(100),
  brand:             z.string().max(60).optional(),
  partNumber:        z.string().max(60).optional(),
  installedAt:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Install date required'),
  odoKmAtInstall:    z.coerce.number().min(0, 'Odometer required'),
  cost:              z.coerce.number().min(0).default(0),
  expectedLifeKm:    optionalPositiveNumber,
  expectedLifeMonths: optionalPositiveNumber,
  linkedServiceId:   z.string().optional(),
  note:              z.string().max(500).optional(),
})
export type PartFormValues = z.infer<typeof partSchema>

export const issueSchema = z.object({
  title:       z.string().min(1, 'Title required').max(120),
  description: z.string().max(1000).optional(),
  priority:    z.enum(['low', 'medium', 'high']).default('medium'),
  reportedAt:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date required'),
})
export type IssueFormValues = z.infer<typeof issueSchema>

export const noteSchema = z.object({
  title:  z.string().max(120).optional(),
  body:   z.string().min(1, 'Note body required').max(5000),
  pinned: z.boolean().default(false),
})
export type NoteFormValues = z.infer<typeof noteSchema>

export const documentSchema = z.object({
  type:               z.enum(['insurance', 'driving_license']),
  vehicleId:          z.string().optional(),
  provider:           z.string().max(100).optional(),
  policyNo:           z.string().max(60).optional(),
  issuedDate:         z.string().optional(),
  expiryDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date required'),
  premium:            optionalPositiveNumber,
  reminderDaysBefore: z.coerce.number().int().min(1).max(365).default(30),
  note:               z.string().max(500).optional(),
})
export type DocumentFormValues = z.infer<typeof documentSchema>

export const vehicleDocSchema = z.object({
  name:       z.string().min(1, 'Document name is required').max(100),
  validUntil: z.string().optional(),
  imageUrl:   z.string().max(500).optional(),
  note:       z.string().max(500).optional(),
})
export type VehicleDocFormValues = z.infer<typeof vehicleDocSchema>

export const maintenanceItemSchema = z.object({
  title: z.string().min(1, 'Description required').max(200),
})
export type MaintenanceItemFormValues = z.infer<typeof maintenanceItemSchema>
