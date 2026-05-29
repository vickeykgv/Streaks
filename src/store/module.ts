import { create } from 'zustand'

export type ActiveModule = 'habits' | 'spending' | 'moto'

interface ModuleState {
  activeModule: ActiveModule
  setModule: (m: ActiveModule) => void
}

const rawStored = localStorage.getItem('active-module')
const stored: ActiveModule =
  rawStored === 'habits' || rawStored === 'spending' || rawStored === 'moto'
    ? rawStored
    : 'habits'

export const useModule = create<ModuleState>((set) => ({
  activeModule: stored,
  setModule: (m) => {
    localStorage.setItem('active-module', m)
    set({ activeModule: m })
  },
}))
