import { create } from 'zustand'
import type { TransactionType } from '@/types/spending'

export type SpendingEditorPayload =
  | { kind: 'closed' }
  | { kind: 'transaction'; id?: string; type?: TransactionType; categoryId?: string }

interface SpendingEditorState {
  editor: SpendingEditorPayload
  open: (payload: Exclude<SpendingEditorPayload, { kind: 'closed' }>) => void
  close: () => void
}

export const useSpendingEditor = create<SpendingEditorState>((set) => ({
  editor: { kind: 'closed' },
  open:  (payload) => set({ editor: payload }),
  close: ()        => set({ editor: { kind: 'closed' } }),
}))

export const openSpendingEditor = (payload: Exclude<SpendingEditorPayload, { kind: 'closed' }>) =>
  useSpendingEditor.getState().open(payload)

export const closeSpendingEditor = () => useSpendingEditor.getState().close()
