import { create } from 'zustand'
import type { AuthUser } from './client'

interface SessionState {
  user: AuthUser | null
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (v: boolean) => void
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  loading: true,
  setUser:    (user)    => set({ user }),
  setLoading: (loading) => set({ loading }),
}))
