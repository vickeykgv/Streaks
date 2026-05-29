import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, ChevronRight, Tag } from 'lucide-react'
import { categoriesRepo } from '@/db/repos/spending/categories'
import { transactionsRepo } from '@/db/repos/spending/transactions'
import { Modal, BottomSheet } from '@/components/ui'
import CategoryEditor from '@/routes/spending/CategoryEditor'
import { cn } from '@/lib/utils'
import type { CategoryType, SpendingCategory } from '@/types/spending'

type Tab = CategoryType

function useCategoryStats() {
  const transactions = useLiveQuery(() => transactionsRepo.getAll(), []) ?? []
  const countByCategory: Record<string, number> = {}
  for (const tx of transactions) {
    if (tx.categoryId) {
      countByCategory[tx.categoryId] = (countByCategory[tx.categoryId] ?? 0) + 1
    }
  }
  return countByCategory
}

function CategoryRow({
  cat,
  children,
  txCount,
  onEdit,
}: {
  cat: SpendingCategory
  children?: SpendingCategory[]
  txCount: number
  onEdit: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = children && children.length > 0

  return (
    <div>
      <button
        onClick={() => onEdit(cat.id)}
        className="glass-panel flex items-center gap-3.5 rounded-[22px] px-4 py-3.5 w-full text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        {/* Icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] text-[22px]"
          style={{ background: `${cat.color}22` }}
        >
          {cat.icon}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="font-sans text-[14px] font-semibold text-[var(--text-primary)] truncate">{cat.name}</div>
          <div className="font-body text-[12px] text-[var(--text-tertiary)]">
            {txCount > 0 ? `${txCount} transaction${txCount !== 1 ? 's' : ''}` : 'No transactions'}
            {hasChildren ? ` · ${children.length} sub` : ''}
          </div>
        </div>

        {/* Colour dot + expand chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-3 w-3 rounded-full" style={{ background: cat.color }} />
          {hasChildren ? (
            <button
              onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--bg-surface-2)] transition-transform"
              style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <ChevronRight size={14} color="var(--text-tertiary)" />
            </button>
          ) : (
            <ChevronRight size={16} color="var(--text-tertiary)" />
          )}
        </div>
      </button>

      {/* Sub-categories */}
      {hasChildren && expanded && (
        <div className="ml-6 mt-2 flex flex-col gap-2">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => onEdit(child.id)}
              className="flex items-center gap-3 rounded-[18px] px-3.5 py-3 w-full text-left transition-all"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] text-[18px]"
                style={{ background: `${child.color}22` }}
              >
                {child.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[13px] font-semibold text-[var(--text-primary)] truncate">{child.name}</div>
              </div>
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: child.color }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SpendingCategories() {
  const [tab, setTab] = useState<Tab>('expense')
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false,
  )
  const [editorState, setEditorState] = useState<{ open: boolean; id?: string; type?: CategoryType }>({ open: false })

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const sync = (e?: MediaQueryListEvent) => setIsDesktop(e ? e.matches : media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const openNew  = (type: CategoryType) => setEditorState({ open: true, type })
  const openEdit = (id: string) => setEditorState({ open: true, id })
  const closeEditor = () => setEditorState({ open: false })

  const allCategories = useLiveQuery(() => categoriesRepo.getAll(), []) ?? []
  const txCounts = useCategoryStats()

  const filtered = allCategories.filter(c => c.type === tab)
  const parents  = filtered.filter(c => !c.parentId)
  const childMap: Record<string, SpendingCategory[]> = {}
  for (const c of filtered.filter(c => c.parentId)) {
    ;(childMap[c.parentId!] ??= []).push(c)
  }

  const expenseCount = allCategories.filter(c => c.type === 'expense').length
  const incomeCount  = allCategories.filter(c => c.type === 'income').length

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-3xl px-4 pt-4">

        {/* Header */}
        <div className="hero-panel rounded-[30px] px-5 py-5 mb-5">
          <div className="section-kicker mb-2">Organise</div>
          <div className="font-sans text-[30px] font-extrabold tracking-tight text-[var(--text-primary)]">Categories</div>
          <div className="mt-1 font-body text-[13px] text-[var(--text-secondary)]">
            {allCategories.length} categor{allCategories.length !== 1 ? 'ies' : 'y'} total
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex rounded-2xl p-[4px] gap-1 mb-5"
          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}
        >
          {(['expense', 'income'] as Tab[]).map(t => {
            const active = tab === t
            const count  = t === 'expense' ? expenseCount : incomeCount
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[14px] font-sans font-bold text-[13px] transition-all duration-150 capitalize"
                style={{
                  background: active ? (t === 'expense' ? '#ef4444' : '#22c55e') : 'transparent',
                  color: active ? '#fff' : 'var(--text-tertiary)',
                  boxShadow: active ? `0 4px 14px ${t === 'expense' ? '#ef444455' : '#22c55e55'}` : 'none',
                }}
              >
                {t}
                <span
                  className={cn(
                    'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 font-sans text-[10px] font-extrabold transition-all',
                    active ? 'bg-white/25 text-white' : 'bg-[var(--bg-surface-3)] text-[var(--text-tertiary)]',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Category list */}
        {parents.length === 0 ? (
          <div className="flex flex-col items-center gap-4 mt-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-[var(--bg-surface-2)]">
              <Tag size={28} strokeWidth={1.5} color="var(--text-tertiary)" />
            </div>
            <p className="font-sans text-[15px] font-bold text-[var(--text-primary)]">
              No {tab} categories
            </p>
            <p className="max-w-xs font-body text-[13px] text-[var(--text-tertiary)]">
              Add categories to organise your transactions.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {parents.map(cat => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                children={childMap[cat.id]}
                txCount={txCounts[cat.id] ?? 0}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => openNew(tab)}
        className="fixed bottom-40 right-5 flex h-14 w-14 items-center justify-center rounded-full shadow-[var(--shadow-fab)] z-10"
        style={{ background: 'var(--color-brand-500)' }}
        aria-label="Add category"
      >
        <Plus size={24} strokeWidth={2.5} color="#fff" />
      </button>

      {isDesktop ? (
        <Modal
          open={editorState.open}
          onClose={closeEditor}
          title={editorState.id ? 'Edit Category' : 'New Category'}
          size="md"
        >
          <CategoryEditor
            embedded
            initialId={editorState.id}
            initialType={editorState.type}
            onClose={closeEditor}
            onSaved={closeEditor}
          />
        </Modal>
      ) : (
        <BottomSheet
          open={editorState.open}
          onClose={closeEditor}
          title={editorState.id ? 'Edit Category' : 'New Category'}
        >
          <CategoryEditor
            embedded
            initialId={editorState.id}
            initialType={editorState.type}
            onClose={closeEditor}
            onSaved={closeEditor}
          />
        </BottomSheet>
      )}
    </div>
  )
}
