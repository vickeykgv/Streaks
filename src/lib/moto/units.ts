import type { UnitSystem } from '@/types/moto'

const KM_TO_MI = 0.621371
const L_TO_GAL = 0.264172

export function kmToDisplay(km: number, system: UnitSystem): number {
  return system === 'imperial' ? parseFloat((km * KM_TO_MI).toFixed(1)) : km
}

export function displayToKm(val: number, system: UnitSystem): number {
  return system === 'imperial' ? parseFloat((val / KM_TO_MI).toFixed(1)) : val
}

export function litresToDisplay(l: number, system: UnitSystem): number {
  return system === 'imperial' ? parseFloat((l * L_TO_GAL).toFixed(2)) : l
}

export function displayToLitres(val: number, system: UnitSystem): number {
  return system === 'imperial' ? parseFloat((val / L_TO_GAL).toFixed(2)) : val
}

export function distanceLabel(system: UnitSystem): string {
  return system === 'imperial' ? 'mi' : 'km'
}

export function volumeLabel(system: UnitSystem): string {
  return system === 'imperial' ? 'gal' : 'L'
}

export function efficiencyLabel(system: UnitSystem): string {
  return system === 'imperial' ? 'mpg' : 'km/L'
}

/** Convert stored metric kmpl → display efficiency in chosen system */
export function kmplToDisplay(kmpl: number, system: UnitSystem): number {
  if (system === 'imperial') {
    // km/L → mi/gal: multiply by (0.621371 / 0.264172)
    return parseFloat((kmpl * (KM_TO_MI / L_TO_GAL)).toFixed(1))
  }
  return parseFloat(kmpl.toFixed(1))
}
