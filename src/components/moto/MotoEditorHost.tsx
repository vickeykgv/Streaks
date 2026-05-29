import { Modal, BottomSheet } from '@/components/ui'
import { useMotoEditor } from '@/store/motoEditor'
import { useIsMobile } from '@/hooks/useIsMobile'
import { VehicleEditor } from '@/components/moto/editors/VehicleEditor'
import { FuelLogEditor } from '@/components/moto/editors/FuelLogEditor'
import { ServiceEditor } from '@/components/moto/editors/ServiceEditor'
import { PartEditor } from '@/components/moto/editors/PartEditor'
import { IssueEditor } from '@/components/moto/editors/IssueEditor'
import { NoteEditor } from '@/components/moto/editors/NoteEditor'
import { DocumentEditor } from '@/components/moto/editors/DocumentEditor'

export function MotoEditorHost() {
  const { editor, close } = useMotoEditor()
  const isMobile = useIsMobile()
  const open = editor.kind !== 'closed'

  const title = (() => {
    switch (editor.kind) {
      case 'vehicle':  return editor.id ? 'Edit Vehicle' : 'Add Vehicle'
      case 'fuel':     return editor.id ? 'Edit Fuel Fill' : 'Log Fuel Fill'
      case 'service':  return editor.id ? 'Edit Service' : 'Log Service'
      case 'part':     return editor.id ? 'Edit Spare Part' : 'Add Spare Part'
      case 'issue':    return editor.id ? 'Edit Issue' : 'Report Issue'
      case 'note':     return editor.id ? 'Edit Note' : 'Add Note'
      case 'document': return editor.id ? 'Edit Document' : 'Add Document'
      default:         return ''
    }
  })()

  const content = (() => {
    if (editor.kind === 'vehicle') {
      return <VehicleEditor id={editor.id} onClose={close} onSaved={close} />
    }
    if (editor.kind === 'fuel') {
      return <FuelLogEditor id={editor.id} vehicleId={editor.vehicleId} onClose={close} onSaved={close} />
    }
    if (editor.kind === 'service') {
      return <ServiceEditor id={editor.id} vehicleId={editor.vehicleId} onClose={close} onSaved={close} />
    }
    if (editor.kind === 'part') {
      return <PartEditor id={editor.id} vehicleId={editor.vehicleId} onClose={close} onSaved={close} />
    }
    if (editor.kind === 'issue') {
      return <IssueEditor id={editor.id} vehicleId={editor.vehicleId} onClose={close} onSaved={close} />
    }
    if (editor.kind === 'note') {
      return <NoteEditor id={editor.id} vehicleId={editor.vehicleId} onClose={close} onSaved={close} />
    }
    if (editor.kind === 'document') {
      return <DocumentEditor id={editor.id} vehicleId={editor.vehicleId} onClose={close} onSaved={close} />
    }
    return null
  })()

  if (!content) return null

  if (isMobile) {
    return (
      <BottomSheet open={open} onClose={close} title={title}>
        <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
          <span className="font-sans text-[18px] font-extrabold text-[var(--text-primary)]">{title}</span>
          <button
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)] font-sans text-[13px] font-bold text-[var(--text-secondary)]"
          >
            ✕
          </button>
        </div>
        {content}
      </BottomSheet>
    )
  }

  return (
    <Modal open={open} onClose={close} title={title} size="md">
      {content}
    </Modal>
  )
}
