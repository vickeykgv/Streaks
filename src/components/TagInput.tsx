import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { X } from 'lucide-react'
import { tagsRepo } from '@/db/repos/tags'
import { TAG_COLORS } from '@/lib/constants'

interface TagInputProps {
  value: string[]
  onChange: (ids: string[]) => void
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const allTags = useLiveQuery(() => tagsRepo.getAll(), []) ?? []
  const selectedTags = allTags.filter(t => value.includes(t.id))

  const filtered = query.trim()
    ? allTags.filter(t => t.name.toLowerCase().includes(query.toLowerCase()) && !value.includes(t.id))
    : allTags.filter(t => !value.includes(t.id))

  const q = query.trim()
  const exactMatch = allTags.find(t => t.name.toLowerCase() === q.toLowerCase())
  const showCreate = q.length > 0 && !exactMatch

  const addTag = (id: string) => {
    onChange([...value, id])
    setQuery('')
    inputRef.current?.focus()
  }

  const removeTag = (id: string) => onChange(value.filter(v => v !== id))

  const createTag = async () => {
    const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
    const tag = await tagsRepo.create(q, color)
    addTag(tag.id)
  }

  return (
    <div className="relative">
      <div
        className="min-h-11 rounded-xl px-2.5 py-1.5 flex flex-wrap gap-1.5 items-center bg-surface border border-[var(--border-subtle)] focus-within:border-[var(--color-brand-500)] transition-colors cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-sans font-bold text-[12px]"
            style={{ background: `${tag.color}20`, color: tag.color }}
          >
            {tag.name}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(tag.id) }}
              className="rounded-full hover:opacity-70 transition-opacity"
              aria-label={`Remove ${tag.name}`}
            >
              <X size={10} strokeWidth={3} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={value.length === 0 ? 'Add tags…' : ''}
          className="flex-1 min-w-[80px] bg-transparent outline-none font-sans text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
        />
      </div>

      {open && (filtered.length > 0 || showCreate) && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-surface border border-[var(--border-subtle)] rounded-xl shadow-lg overflow-hidden">
          {filtered.map(tag => (
            <button
              key={tag.id}
              type="button"
              onMouseDown={() => addTag(tag.id)}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--bg-surface-2)] transition-colors text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tag.color }} />
              <span className="font-sans font-semibold text-[14px] text-[var(--text-primary)]">{tag.name}</span>
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseDown={createTag}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--bg-surface-2)] transition-colors text-left border-t border-[var(--border-subtle)]"
            >
              <span className="font-sans font-bold text-[13px] text-[var(--color-brand-500)]">+ Create "{q}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
