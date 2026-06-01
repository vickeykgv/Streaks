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
  syncing: boolean
  setSyncing: (v: boolean) => void
  lastSyncedAt: number | null
  setLastSyncedAt: (v: number) => void
  syncError: boolean
  setSyncError: (v: boolean) => void
  createComposer: CreateComposerState
  openCreateComposer: (type?: CreateType, world?: World) => void
  closeCreateComposer: () => void
}

export const useAppStore = create<AppState>((set) => ({
  updateAvailable: false,
  setUpdateAvailable: (v) => set({ updateAvailable: v }),
  isOnline: navigator.onLine,
  setOnline: (v) => set({ isOnline: v }),
  syncing: false,
  setSyncing: (v) => set({ syncing: v }),
  lastSyncedAt: null,
  setLastSyncedAt: (v) => set({ lastSyncedAt: v }),
  syncError: false,
  setSyncError: (v) => set({ syncError: v }),
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
