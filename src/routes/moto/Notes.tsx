import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, StickyNote, Pin } from 'lucide-react'
import { useMoto } from '@/store/moto'
import { notesRepo } from '@/db/repos/moto/notes'
import { openMotoEditor } from '@/store/motoEditor'
import { VehicleSwitcher } from '@/components/moto/VehicleSwitcher'
import { EmptyState } from '@/components/ui'
import type { MotoNote } from '@/types/moto'

function NoteCard({ note }: { note: MotoNote }) {
  return (
    <button
      onClick={() => openMotoEditor({ kind: 'note', id: note.id, vehicleId: note.vehicleId })}
      className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
      style={{
        background: 'var(--bg-surface-1)',
        border: note.pinned ? '1.5px solid var(--color-brand-500)' : '1.5px solid transparent',
      }}
    >
      {note.pinned && (
        <Pin size={13} className="mt-0.5 shrink-0" color="var(--color-brand-500)" strokeWidth={2.5} />
      )}
      <div className="flex-1 min-w-0">
        {note.title && (
          <div className="font-sans text-[14px] font-bold text-[var(--text-primary)] mb-0.5 truncate">
            {note.title}
          </div>
        )}
        <p className="font-body text-[13px] text-[var(--text-secondary)] line-clamp-3 whitespace-pre-wrap">
          {note.body}
        </p>
      </div>
    </button>
  )
}

export default function MotoNotes() {
  const { activeVehicleId } = useMoto()

  const notes = useLiveQuery(
    () => activeVehicleId ? notesRepo.getAllForVehicle(activeVehicleId) : Promise.resolve([]),
    [activeVehicleId],
  ) ?? []

  const pinned   = notes.filter(n => n.pinned)
  const unpinned = notes.filter(n => !n.pinned)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-28">
      <VehicleSwitcher />

      {!activeVehicleId && (
        <EmptyState
          icon={<StickyNote size={20} strokeWidth={1.8} />}
          headline="No vehicle selected"
          subheadline="Select or add a vehicle above to view its notes."
        />
      )}

      {activeVehicleId && notes.length === 0 && (
        <EmptyState
          icon={<StickyNote size={20} strokeWidth={1.8} />}
          headline="No notes yet"
          subheadline="Tap + to save a mechanic's number, a tip, or anything useful."
        />
      )}

      {pinned.length > 0 && (
        <>
          <div className="mb-2 flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
            <Pin size={11} strokeWidth={2.5} /> Pinned
          </div>
          <div className="flex flex-col gap-1.5 mb-4">
            {pinned.map(n => <NoteCard key={n.id} note={n} />)}
          </div>
        </>
      )}

      {unpinned.length > 0 && (
        <>
          {pinned.length > 0 && (
            <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
              Notes
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {unpinned.map(n => <NoteCard key={n.id} note={n} />)}
          </div>
        </>
      )}

      {activeVehicleId && (
        <button
          onClick={() => openMotoEditor({ kind: 'note', vehicleId: activeVehicleId })}
          className="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 md:bottom-8"
          style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
          aria-label="Add note"
        >
          <Plus size={24} color="white" strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
