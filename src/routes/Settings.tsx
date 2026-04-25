import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor, Download, Upload, Trash2, ChevronRight } from 'lucide-react'
import { setTheme, type Theme } from '@/lib/theme'
import { settingsRepo } from '@/db/repos/settings'
import { db } from '@/db/database'
import { toast } from '@/store/toastStore'

function SettingRow({ icon, label, description, right, onClick }: {
  icon: React.ReactNode
  label: string
  description?: string
  right?: React.ReactNode
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className="flex w-full items-center gap-3 px-4 py-4 text-left">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)] text-[var(--text-secondary)]">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-sans text-[14px] font-semibold text-[var(--text-primary)]">{label}</div>
        {description && <div className="font-body text-[12px] text-[var(--text-tertiary)]">{description}</div>}
      </div>
      {right ?? (onClick && <ChevronRight size={16} color="var(--text-tertiary)" />)}
    </Tag>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="section-kicker mb-2 px-2">{title}</div>
      <div className="glass-panel overflow-hidden rounded-[28px] divide-y divide-[var(--border-subtle)]">
        {children}
      </div>
    </div>
  )
}

export default function Settings() {
  const [theme, setThemeState] = useState<Theme>('system')
  const [weekStart, setWeekStartState] = useState<0 | 1>(1)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    settingsRepo.get<Theme>('theme', 'dark').then(v => setThemeState(v))
    settingsRepo.get<0 | 1>('weekStart', 1).then(v => setWeekStartState(v))
  }, [])

  const handleTheme = async (t: Theme) => {
    setThemeState(t)
    setTheme(t)
    await settingsRepo.set('theme', t)
    toast.success('Theme updated')
  }

  const handleWeekStart = async (v: 0 | 1) => {
    setWeekStartState(v)
    await settingsRepo.set('weekStart', v)
    toast.success('Week start updated')
  }

  const handleClearAll = async () => {
    await Promise.all([
      db.habits.clear(),
      db.tasks.clear(),
      db.habitEntries.clear(),
      db.tags.clear(),
    ])
    setShowClearConfirm(false)
    toast.success('All data cleared')
  }

  const handleExport = () => {
    toast.info('Export coming in a future update')
  }

  const handleImport = () => {
    toast.info('Import coming in a future update')
  }

  const THEMES: { id: Theme; label: string; Icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', Icon: Sun },
    { id: 'dark', label: 'Dark', Icon: Moon },
    { id: 'system', label: 'System', Icon: Monitor },
  ]

  return (
    <div className="min-h-screen bg-app pb-28">
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <div className="hero-panel rounded-[30px] px-5 py-5">
          <div className="section-kicker mb-2">Control room</div>
          <div className="font-sans text-[30px] font-extrabold tracking-tight text-[var(--text-primary)]">Settings</div>
          <div className="mt-1 font-body text-[13px] text-[var(--text-secondary)]">
            Tune the experience, choose your theme, and manage your data safely.
          </div>
        </div>

        <div className="mt-5">
          <SectionCard title="Appearance">
            <div className="px-4 py-4">
              <div className="mb-3 font-sans text-[14px] font-semibold text-[var(--text-primary)]">Theme</div>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map(({ id, label, Icon }) => {
                  const on = theme === id
                  return (
                    <button
                      key={id}
                      onClick={() => handleTheme(id)}
                      className="flex flex-col items-center gap-2 rounded-[22px] px-3 py-3.5 transition-all"
                      style={{
                        background: on ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                        border: on ? 'none' : '1px solid var(--border-subtle)',
                        color: on ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                        boxShadow: on ? 'var(--shadow-glow)' : 'none',
                      }}
                    >
                      <Icon size={18} />
                      <span className="font-sans text-[12px] font-bold">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="px-4 py-4">
              <div className="mb-3 font-sans text-[14px] font-semibold text-[var(--text-primary)]">Week starts on</div>
              <div className="grid grid-cols-2 gap-2">
                {([['Sunday', 0], ['Monday', 1]] as const).map(([label, val]) => {
                  const on = weekStart === val
                  return (
                    <button
                      key={val}
                      onClick={() => handleWeekStart(val)}
                      className="rounded-2xl py-3 font-sans text-[13px] font-bold transition-all"
                      style={{
                        background: on ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                        color: on ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                        border: on ? 'none' : '1px solid var(--border-subtle)',
                        boxShadow: on ? 'var(--shadow-card)' : 'none',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Data">
            <SettingRow
              icon={<Download size={16} />}
              label="Export JSON"
              description="Download all your data"
              onClick={handleExport}
            />
            <SettingRow
              icon={<Upload size={16} />}
              label="Import JSON"
              description="Restore from a backup"
              onClick={handleImport}
            />
            <SettingRow
              icon={<Trash2 size={16} />}
              label="Clear all data"
              description="Removes all habits, tasks, and history"
              onClick={() => setShowClearConfirm(true)}
            />
          </SectionCard>

          <SectionCard title="About">
            <SettingRow
              icon={<span className="text-[16px]">📱</span>}
              label="Version"
              right={<span className="font-body text-[13px] text-[var(--text-tertiary)]">1.0.0</span>}
            />
          </SectionCard>
        </div>

        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-end bg-[var(--bg-overlay)] px-3 pb-3 pt-12" onClick={() => setShowClearConfirm(false)}>
            <div className="glass-panel w-full rounded-[30px] p-5" onClick={e => e.stopPropagation()}>
              <p className="font-sans text-[18px] font-bold text-[var(--text-primary)]">Clear all data?</p>
              <p className="mt-2 font-body text-[14px] text-[var(--text-secondary)]">
                This will permanently delete all habits, tasks, entries, and tags. This cannot be undone.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={handleClearAll}
                  className="h-12 w-full rounded-2xl font-sans text-[14px] font-extrabold text-[var(--text-on-danger)]"
                  style={{ background: 'var(--color-overdue)' }}
                >
                  Clear everything
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="h-12 w-full rounded-2xl bg-[var(--bg-surface-2)] font-sans text-[14px] font-bold text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
