import { create } from 'zustand'

export type ActiveModule = 'habits' | 'spending'

interface ModuleState {
  activeModule: ActiveModule
  setModule: (m: ActiveModule) => void
}

const stored = (localStorage.getItem('active-module') ?? 'habits') as ActiveModule

export const useModule = create<ModuleState>((set) => ({
  activeModule: stored,
  setModule: (m) => {
    localStorage.setItem('active-module', m)
    set({ activeModule: m })
  },
}))
