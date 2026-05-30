import { lazy, Suspense, useState, useEffect } from 'react'
import { BottomSheet, Modal } from '@/components/ui'
import { useSpendingEditor, closeSpendingEditor } from '@/store/spendingEditor'

const TransactionEditor = lazy(() => import('@/routes/spending/TransactionEditor'))

export function SpendingEditorHost() {
  const { editor } = useSpendingEditor()
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const sync = (e?: MediaQueryListEvent) => setIsDesktop(e ? e.matches : media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  if (editor.kind === 'closed') return null

  const isEditing = !!editor.id
  const title = isEditing ? 'Edit Transaction' : 'Add Transaction'
  const content = editor.kind === 'transaction' ? (
    <Suspense fallback={null}>
      <TransactionEditor
        embedded
        initialId={editor.id}
        initialType={editor.type}
        initialCategoryId={editor.categoryId}
        onClose={closeSpendingEditor}
        onSaved={closeSpendingEditor}
      />
    </Suspense>
  ) : null

  return isDesktop ? (
    <Modal open onClose={closeSpendingEditor} title={title} size="lg">
      {content}
    </Modal>
  ) : (
    <BottomSheet open onClose={closeSpendingEditor} title={title}>
      {content}
    </BottomSheet>
  )
}
