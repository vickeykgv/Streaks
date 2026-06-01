import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2, Check, Pencil, X } from 'lucide-react'
import { tagsRepo } from '@/db/repos/tags'
import { habitsRepo } from '@/db/repos/habits'
import { tasksRepo } from '@/db/repos/tasks'
import { TAG_COLORS } from '@/lib/constants'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import type { Tag } from '@/types'

export default function Tags() {
  const [newName, setNewName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)
  const [deleteUsage, setDeleteUsage] = useState<{ habits: number; tasks: number } | null>(null)

  const tags = useLiveQuery(() => tagsRepo.getAll(), []) ?? []
  const habits = useLiveQuery(() => habitsRepo.getAll(true), []) ?? []
  const tasks = useLiveQuery(() => tasksRepo.getAll(), []) ?? []

  const usageCount = (tagId: string) => ({
    habits: habits.filter(h => h.tags.includes(tagId)).length,
    tasks: tasks.filter(t => t.tags.includes(tagId)).length,
  })

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase())
    if (existing) return
    const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
    await tagsRepo.create(name, color)
    setNewName('')
  }

  const confirmDelete = async (tag: Tag) => {
    const usage = usageCount(tag.id)
    setDeleteTarget(tag)
    setDeleteUsage(usage)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await tagsRepo.delete(deleteTarget.id)
    await habitsRepo.removeTagFromAll(deleteTarget.id)
    await tasksRepo.removeTagFromAll(deleteTarget.id)
    setDeleteTarget(null)
    setDeleteUsage(null)
  }

  return (
    <div className="min-h-screen bg-app pb-24">
      <DesktopPageHeader />
      <div className="mx-auto max-w-3xl px-0">
        <div className="px-4 pt-4">
          <div className="hero-panel rounded-[30px] px-5 py-5">
            <div className="section-kicker mb-2">Label library</div>
            <div className="font-sans text-[30px] font-extrabold tracking-tight text-[var(--text-primary)]">Tags</div>
            <div className="mt-1 font-body text-[13px] text-[var(--text-secondary)]">
              {tags.length} colour-coded labels to organise your habits and tasks.
            </div>
          </div>
        </div>

      {/* Create new */}
      <div className="mx-4 mt-4 flex gap-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
          placeholder="New tag name…"
          className="flex-1 h-11 rounded-xl px-3.5 font-sans font-semibold text-[15px] text-[var(--text-primary)] bg-surface border border-[var(--border-subtle)] outline-none focus:border-[var(--color-brand-500)] transition-colors"
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          className="h-11 px-4 rounded-xl bg-brand-500 text-[var(--text-on-brand)] font-sans font-extrabold text-[14px] flex items-center gap-1.5 shadow-[var(--shadow-glow)] disabled:opacity-40 disabled:shadow-none transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={2.75} /> Add
        </button>
      </div>

      {/* Tags list */}
      <div className="flex flex-col gap-2.5 px-4 mt-4">
        {tags.length === 0 && (
          <div className="hero-panel rounded-[26px] py-16 text-center">
            <div className="text-[40px] mb-3">🏷️</div>
            <p className="font-sans font-bold text-[16px] text-[var(--text-primary)]">No tags yet</p>
            <p className="font-body text-[13px] text-[var(--text-secondary)] mt-1">Add your first tag above to start organising.</p>
          </div>
        )}
        {tags.map(tag => (
          <TagRow key={tag.id} tag={tag} usage={usageCount(tag.id)} onDelete={() => confirmDelete(tag)} />
        ))}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="w-full bg-surface rounded-t-2xl p-5 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <p className="font-sans font-bold text-[16px] text-[var(--text-primary)]">Delete "{deleteTarget.name}"?</p>
            {deleteUsage && (deleteUsage.habits > 0 || deleteUsage.tasks > 0) && (
              <p className="font-body text-[14px] text-[var(--text-secondary)]">
                This will remove the tag from{' '}
                {deleteUsage.habits > 0 && `${deleteUsage.habits} habit${deleteUsage.habits !== 1 ? 's' : ''}`}
                {deleteUsage.habits > 0 && deleteUsage.tasks > 0 && ' and '}
                {deleteUsage.tasks > 0 && `${deleteUsage.tasks} task${deleteUsage.tasks !== 1 ? 's' : ''}`}.
              </p>
            )}
            <button onClick={handleDelete}
              className="w-full h-11 rounded-xl font-sans font-extrabold text-[14px] text-white"
              style={{ background: 'var(--color-overdue)' }}>
              Delete
            </button>
            <button onClick={() => setDeleteTarget(null)}
              className="w-full h-11 rounded-xl font-sans font-bold text-[14px] bg-surface2 text-[var(--text-secondary)]">
              Cancel
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

function TagRow({ tag, usage, onDelete }: { tag: Tag; usage: { habits: number; tasks: number }; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(tag.name)
  const [colorEditing, setColorEditing] = useState(false)

  const saveName = async () => {
    const name = draft.trim()
    if (name && name !== tag.name) {
      await tagsRepo.update(tag.id, { name })
    } else {
      setDraft(tag.name)
    }
    setEditing(false)
  }

  const saveColor = async (color: string) => {
    await tagsRepo.update(tag.id, { color })
    setColorEditing(false)
  }

  const totalUses = usage.habits + usage.tasks

  return (
    <div
      className="group bg-surface border border-[var(--border-subtle)] rounded-2xl overflow-hidden transition-all hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-glow)]"
      style={{ borderLeft: `3px solid ${tag.color}` }}
    >
      <div className="flex items-center gap-3 px-3.5 py-3">
        {/* Color swatch (opens palette) */}
        <button
          onClick={() => setColorEditing(o => !o)}
          className="w-8 h-8 rounded-full shrink-0 transition-transform active:scale-90"
          style={{ background: tag.color, boxShadow: colorEditing ? `0 0 0 3px ${tag.color}44` : `0 0 0 1px ${tag.color}33` }}
          aria-label="Change colour"
        />

        {/* Name / chip preview */}
        {editing ? (
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setDraft(tag.name); setEditing(false) } }}
            autoFocus
            className="flex-1 h-9 rounded-lg px-2.5 font-sans font-semibold text-[14px] text-[var(--text-primary)] bg-surface border border-[var(--color-brand-500)] outline-none"
          />
        ) : (
          <button
            onClick={() => { setDraft(tag.name); setEditing(true) }}
            className="flex-1 min-w-0 flex items-center gap-2.5 text-left"
          >
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-sans font-bold text-[12px] shrink-0 max-w-full truncate"
              style={{ background: `${tag.color}18`, color: tag.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
              <span className="truncate">{tag.name}</span>
            </span>
            <span className="font-body text-[12px] text-[var(--text-tertiary)] truncate">
              {totalUses === 0
                ? 'Unused'
                : `${usage.habits} habit${usage.habits !== 1 ? 's' : ''} · ${usage.tasks} task${usage.tasks !== 1 ? 's' : ''}`}
            </span>
          </button>
        )}

        {/* Actions */}
        {editing ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => { setDraft(tag.name); setEditing(false) }}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface2 text-[var(--text-secondary)]"
              aria-label="Cancel">
              <X size={15} strokeWidth={2.5} />
            </button>
            <button onClick={saveName} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-on-brand)]"
              style={{ background: 'var(--color-brand-500)' }} aria-label="Save name">
              <Check size={15} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100">
            <button onClick={() => { setDraft(tag.name); setEditing(true) }}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Rename tag">
              <Pencil size={14} strokeWidth={2.25} />
            </button>
            <button onClick={onDelete}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface2 hover:bg-[var(--color-overdue)]/10 transition-colors"
              aria-label="Delete tag">
              <Trash2 size={14} color="var(--color-overdue)" strokeWidth={2.25} />
            </button>
          </div>
        )}
      </div>

      {/* Color palette */}
      {colorEditing && (
        <div className="border-t border-[var(--border-subtle)] px-3.5 py-3 flex flex-wrap gap-2">
          {TAG_COLORS.map(c => (
            <button
              key={c}
              onClick={() => saveColor(c)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{ background: c, boxShadow: tag.color === c ? `0 0 0 3px ${c}44, 0 0 0 2px var(--bg-base)` : 'none' }}
            >
              {tag.color === c && <Check size={12} color="#fff" strokeWidth={3} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
