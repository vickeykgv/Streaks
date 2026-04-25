import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2, Check } from 'lucide-react'
import { tagsRepo } from '@/db/repos/tags'
import { habitsRepo } from '@/db/repos/habits'
import { tasksRepo } from '@/db/repos/tasks'
import { TAG_COLORS } from '@/lib/constants'
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
      <div className="max-w-3xl mx-auto">
      <div className="px-5 pt-3">
        <div className="font-body text-[12px] font-medium text-[var(--text-tertiary)]">{tags.length} tags</div>
        <div className="font-sans text-[28px] font-extrabold text-[var(--text-primary)] tracking-tight">Tags</div>
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
          className="w-11 h-11 rounded-xl bg-brand-500 text-white flex items-center justify-center disabled:opacity-40"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Tags list */}
      <div className="flex flex-col gap-2 px-4 mt-4">
        {tags.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-[40px] mb-3">🏷️</div>
            <p className="font-sans font-bold text-[16px] text-[var(--text-primary)]">No tags yet</p>
            <p className="font-body text-[13px] text-[var(--text-secondary)] mt-1">Create one above</p>
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

  return (
    <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-3.5 py-3">
        {/* Color swatch */}
        <button
          onClick={() => setColorEditing(o => !o)}
          className="w-7 h-7 rounded-full shrink-0 transition-transform active:scale-90"
          style={{ background: tag.color, boxShadow: colorEditing ? `0 0 0 3px ${tag.color}44` : 'none' }}
          aria-label="Change color"
        />

        {/* Name */}
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
            className="flex-1 text-left font-sans font-bold text-[15px] text-[var(--text-primary)]"
          >
            {tag.name}
          </button>
        )}

        {/* Usage count */}
        <span className="font-body text-[12px] text-[var(--text-tertiary)] shrink-0">
          {usage.habits + usage.tasks} uses
        </span>

        {editing ? (
          <button onClick={saveName} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-brand-500)' }}>
            <Check size={14} color="#fff" strokeWidth={3} />
          </button>
        ) : (
          <button onClick={onDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--bg-surface-2)' }}>
            <Trash2 size={14} color="var(--color-overdue)" />
          </button>
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
