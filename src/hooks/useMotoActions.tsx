import { Droplets, Wrench, AlertTriangle, FileText, Cog, FileBadge2, Bike } from 'lucide-react'
import { useMoto } from '@/store/moto'
import { openMotoEditor } from '@/store/motoEditor'
import type { ActionItem } from '@/components/ActionDropdown'

export type MotoActionKind = 'fuel' | 'service' | 'issue' | 'note' | 'part' | 'document' | 'vehicle'

export function useMotoActions(primaryKind: MotoActionKind = 'fuel'): ActionItem[] {
  const { activeVehicleId } = useMoto()
  const vid = activeVehicleId ?? undefined

  const vehicleActions: ActionItem[] = vid ? [
    { label: 'Log Fuel',       icon: <Droplets size={14} strokeWidth={2.5} />,       onClick: () => openMotoEditor({ kind: 'fuel',     vehicleId: vid }) },
    { label: 'Service Log',    icon: <Wrench size={14} strokeWidth={2.5} />,         onClick: () => openMotoEditor({ kind: 'service',  vehicleId: vid }) },
    { label: 'Defect / Issue', icon: <AlertTriangle size={14} strokeWidth={2.5} />,  onClick: () => openMotoEditor({ kind: 'issue',    vehicleId: vid }) },
    { label: 'Add Note',       icon: <FileText size={14} strokeWidth={2.5} />,       onClick: () => openMotoEditor({ kind: 'note',     vehicleId: vid }) },
    { label: 'Spare Part',     icon: <Cog size={14} strokeWidth={2.5} />,            onClick: () => openMotoEditor({ kind: 'part',     vehicleId: vid }) },
    { label: 'Document',       icon: <FileBadge2 size={14} strokeWidth={2.5} />,     onClick: () => openMotoEditor({ kind: 'document', vehicleId: vid }) },
  ] : []

  const addVehicleAction: ActionItem = {
    label: 'Add Vehicle',
    icon: <Bike size={14} strokeWidth={2.5} />,
    onClick: () => openMotoEditor({ kind: 'vehicle' }),
  }

  if (!vid) return [addVehicleAction]

  const kindToIndex: Record<MotoActionKind, number> = {
    fuel: 0, service: 1, issue: 2, note: 3, part: 4, document: 5, vehicle: -1,
  }

  if (primaryKind === 'vehicle') {
    return [addVehicleAction, ...vehicleActions]
  }

  const idx = kindToIndex[primaryKind]
  if (idx < 0) return [...vehicleActions, addVehicleAction]

  const reordered = [...vehicleActions]
  const [primary] = reordered.splice(idx, 1)
  return [primary, ...reordered, addVehicleAction]
}
