import { create } from 'zustand'

interface MotoState {
  activeVehicleId: string | null
  setActiveVehicle: (id: string | null) => void
}

const stored = localStorage.getItem('moto-active-vehicle') ?? null

export const useMoto = create<MotoState>((set) => ({
  activeVehicleId: stored,
  setActiveVehicle: (id) => {
    if (id) localStorage.setItem('moto-active-vehicle', id)
    else localStorage.removeItem('moto-active-vehicle')
    set({ activeVehicleId: id })
  },
}))
