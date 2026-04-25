import { create } from 'zustand'
import type { World } from '@/types'

type CreateType = 'habit' | 'task'

interface CreateComposerState {
  open: boolean
  type: CreateType
  world: World
}

interface AppState {
  updateAvailable: boolean
  setUpdateAvailable: (v: boolean) => void
  isOnline: boolean
  setOnline: (v: boolean) => void
  createComposer: CreateComposerState
  openCreateComposer: (type?: CreateType, world?: World) => void
  closeCreateComposer: () => void
}

export const useAppStore = create<AppState>((set) => ({
  updateAvailable: false,
  setUpdateAvailable: (v) => set({ updateAvailable: v }),
  isOnline: navigator.onLine,
  setOnline: (v) => set({ isOnline: v }),
  createComposer: {
    open: false,
    type: 'habit',
    world: 'personal',
  },
  openCreateComposer: (type = 'habit', world = 'personal') => set({
    createComposer: { open: true, type, world },
  }),
  closeCreateComposer: () => set((state) => ({
    createComposer: { ...state.createComposer, open: false },
  })),
}))
