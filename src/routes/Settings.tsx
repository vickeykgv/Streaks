import { useState, useEffect, useRef } from 'react'
import { Moon, Sun, Monitor, Download, Upload, Trash2, ChevronRight, LogIn, LogOut, User, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { setTheme, type Theme } from '@/lib/theme'
import { settingsRepo } from '@/db/repos/settings'
import { db } from '@/db/database'
import { toast } from '@/store/toastStore'
import { authClient } from '@/auth/client'
import { useSession } from '@/auth/session'
import { downloadExport, importAll } from '@/lib/exportImport'
import { TimePicker } from '@/components/ui'
import { isAppBadgeSupported } from '@/lib/appBadge'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [dirtyCount, setDirtyCount] = useState(0)
  const [quietEnabled, setQuietEnabled] = useState(false)
  const [quietFrom, setQuietFrom] = useState('22:00')
  const [quietTo, setQuietTo] = useState('08:00')
  const { user } = useSession()

  useEffect(() => {
    settingsRepo.get<Theme>('theme', 'dark').then(v => setThemeState(v))
    settingsRepo.get<0 | 1>('weekStart', 1).then(v => setWeekStartState(v))
    settingsRepo.get<{ enabled: boolean; from: string; to: string }>(
      'quietHours',
      { enabled: false, from: '22:00', to: '08:00' },
    ).then(v => {
      setQuietEnabled(v.enabled)
      setQuietFrom(v.from)
      setQuietTo(v.to)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    Promise.all([
      db.habits.where('dirty').equals(1).count(),
      db.tasks.where('dirty').equals(1).count(),
      db.habitEntries.where('dirty').equals(1).count(),
    ]).then(([h, t, e]) => setDirtyCount(h + t + e)).catch(() => {
      // dirty is stored as boolean; fall back to a full scan
      Promise.all([
        db.habits.filter(r => !!r.dirty).count(),
        db.tasks.filter(r => !!r.dirty).count(),
        db.habitEntries.filter(r => !!r.dirty).count(),
      ]).then(([h, t, e]) => setDirtyCount(h + t + e))
    })
  }, [user])

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

  const handleExport = async () => {
    try {
      await downloadExport()
      toast.success('Backup downloaded')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const { imported } = await importAll(text)
      toast.success(`Imported ${imported} records`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      e.target.value = ''
    }
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    setShowSignOutConfirm(false)
    toast.success('Signed out')
  }

  const handleDeleteAccount = () => {
    toast.info('Contact support to delete your account')
  }

  const saveQuietHours = async (enabled: boolean, from: string, to: string) => {
    await settingsRepo.set('quietHours', { enabled, from, to })
  }

  const THEMES: { id: Theme; label: string; Icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', Icon: Sun },
    { id: 'dark', label: 'Dark', Icon: Moon },
    { id: 'system', label: 'System', Icon: Monitor },
  ]

  return (
    <>
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

          <SectionCard title="Account">
            {user ? (
              <>
                <SettingRow
                  icon={<User size={16} />}
                  label="Signed in as"
                  description={user.email}
                  right={<span />}
                />
                <SettingRow
                  icon={<LogOut size={16} />}
                  label="Sign out"
                  onClick={() => {
                    if (dirtyCount > 0) {
                      setShowSignOutConfirm(true)
                    } else {
                      handleSignOut()
                    }
                  }}
                />
                <SettingRow
                  icon={<Trash2 size={16} />}
                  label="Delete account"
                  description="Removes all server data"
                  onClick={handleDeleteAccount}
                />
              </>
            ) : (
              <div className="px-4 py-4">
                <p className="mb-3 font-body text-[13px] text-[var(--text-secondary)]">
                  Signing in enables sync across devices.
                </p>
                <Link
                  to="/signin?return=/settings"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl font-sans text-[14px] font-bold text-[var(--text-on-brand)]"
                  style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
                >
                  <LogIn size={15} />
                  Sign in / Create account
                </Link>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Notifications">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-surface-2)] text-[var(--text-secondary)]">
                    <Bell size={16} />
                  </div>
                  <div>
                    <div className="font-sans text-[14px] font-semibold text-[var(--text-primary)]">Quiet hours</div>
                    <div className="font-body text-[12px] text-[var(--text-tertiary)]">Silence reminders during sleep</div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const next = !quietEnabled
                    setQuietEnabled(next)
                    await saveQuietHours(next, quietFrom, quietTo)
                  }}
                  className="relative h-6 w-11 rounded-full transition-colors"
                  style={{ background: quietEnabled ? 'var(--color-brand-500)' : 'var(--bg-surface-2)' }}
                  aria-label="Toggle quiet hours"
                >
                  <span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                    style={{ transform: quietEnabled ? 'translateX(20px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>

              {quietEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">From</label>
                    <TimePicker
                      value={quietFrom}
                      onChange={async (v) => {
                        setQuietFrom(v)
                        await saveQuietHours(quietEnabled, v, quietTo)
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">To</label>
                    <TimePicker
                      value={quietTo}
                      onChange={async (v) => {
                        setQuietTo(v)
                        await saveQuietHours(quietEnabled, quietFrom, v)
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Home screen">
            <SettingRow
              icon={<span className="text-[16px]">🔴</span>}
              label="App icon badge"
              description={isAppBadgeSupported()
                ? 'A red badge shows the count of items pending today.'
                : 'Install the app to your home screen to see a pending-count badge on the icon.'}
              right={
                <span
                  className="font-sans text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                  style={{
                    background: isAppBadgeSupported() ? 'rgba(34,197,94,0.14)' : 'var(--bg-surface-2)',
                    color: isAppBadgeSupported() ? 'var(--color-done)' : 'var(--text-tertiary)',
                  }}
                >
                  {isAppBadgeSupported() ? 'Active' : 'Unavailable'}
                </span>
              }
            />
            <SettingRow
              icon={<span className="text-[16px]">⚡</span>}
              label="Home-screen shortcuts"
              description="Long-press the installed app icon for Today, Add Habit, and Add Task shortcuts."
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

        {showSignOutConfirm && (
          <div className="fixed inset-0 z-50 flex items-end bg-[var(--bg-overlay)] px-3 pb-3 pt-12" onClick={() => setShowSignOutConfirm(false)}>
            <div className="glass-panel w-full rounded-[30px] p-5" onClick={e => e.stopPropagation()}>
              <p className="font-sans text-[18px] font-bold text-[var(--text-primary)]">Sign out?</p>
              <p className="mt-2 font-body text-[14px] text-[var(--text-secondary)]">
                You have {dirtyCount} unsynced change{dirtyCount !== 1 ? 's' : ''}. Sign out anyway?
                Your local data will be kept.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={handleSignOut}
                  className="h-12 w-full rounded-2xl font-sans text-[14px] font-extrabold text-[var(--text-on-danger)]"
                  style={{ background: 'var(--color-overdue)' }}
                >
                  Sign out anyway
                </button>
                <button
                  onClick={() => setShowSignOutConfirm(false)}
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
    <input
      ref={fileInputRef}
      type="file"
      accept=".json"
      className="sr-only"
      onChange={handleImportFile}
    />
    </>
  )
}
