import { create } from 'zustand'

export type MotoEditorPayload =
  | { kind: 'closed' }
  | { kind: 'vehicle';           id?: string }
  | { kind: 'fuel';              id?: string; vehicleId: string }
  | { kind: 'service';           id?: string; vehicleId: string }
  | { kind: 'part';              id?: string; vehicleId: string }
  | { kind: 'issue';             id?: string; vehicleId: string }
  | { kind: 'note';              id?: string; vehicleId: string }
  | { kind: 'document';          id?: string; vehicleId?: string }
  | { kind: 'vehicleDoc';        id?: string; vehicleId: string }
  | { kind: 'maintenanceItem';   id?: string; vehicleId: string }

interface MotoEditorState {
  editor: MotoEditorPayload
  open: (payload: Exclude<MotoEditorPayload, { kind: 'closed' }>) => void
  close: () => void
}

export const useMotoEditor = create<MotoEditorState>((set) => ({
  editor: { kind: 'closed' },
  open:  (payload) => set({ editor: payload }),
  close: ()        => set({ editor: { kind: 'closed' } }),
}))

export const openMotoEditor  = (payload: Exclude<MotoEditorPayload, { kind: 'closed' }>) =>
  useMotoEditor.getState().open(payload)

export const closeMotoEditor = () => useMotoEditor.getState().close()
