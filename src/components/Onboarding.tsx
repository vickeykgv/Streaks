import { useState } from 'react'
import { format } from 'date-fns'
import { habitsRepo } from '@/db/repos/habits'
import { requestPushPermission } from '@/push/subscribe'

interface Props {
  onComplete: () => void
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [habitName, setHabitName] = useState('Drink 8 glasses of water')
  const [creating, setCreating] = useState(false)

  const createHabitAndAdvance = async () => {
    setCreating(true)
    try {
      await habitsRepo.create({
        title: habitName.trim() || 'Drink 8 glasses of water',
        measurementType: 'count',
        target: 8,
        unit: 'glasses',
        recurrence: { type: 'daily' },
        startDate: format(new Date(), 'yyyy-MM-dd'),
        color: '#0ea5e9',
        icon: '💧',
        tags: [],
        archived: false,
        world: 'personal',
      })
      setStep(3)
    } finally {
      setCreating(false)
    }
  }

  const enableReminders = async () => {
    await requestPushPermission()
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg-app)' }}>

      {/* Step dots */}
      <div className="absolute top-12 flex gap-2">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: step === s ? 24 : 6,
              background: step === s ? 'var(--color-brand-500)' : 'var(--border-subtle)',
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex max-w-sm flex-col items-center text-center">
          <div className="mb-6 text-6xl">🎯</div>
          <h1 className="font-sans text-[28px] font-extrabold tracking-tight text-[var(--text-primary)]">
            Welcome to Streaks
          </h1>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Track habits and tasks with streaks, reminders, and sync across all your devices.
          </p>
          <button
            onClick={() => setStep(2)}
            className="mt-8 w-full h-13 rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)]"
            style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)', height: 52 }}
          >
            Get started
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex w-full max-w-sm flex-col">
          <div className="mb-6 text-center">
            <div className="mb-3 text-4xl">💧</div>
            <h2 className="font-sans text-[22px] font-extrabold tracking-tight text-[var(--text-primary)]">
              Create your first habit
            </h2>
            <p className="mt-2 font-body text-[13px] text-[var(--text-secondary)]">
              Start with something simple. You can always edit it later.
            </p>
          </div>

          <div
            className="rounded-[24px] p-5 mb-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <label className="mb-1.5 block font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              Habit name
            </label>
            <input
              value={habitName}
              onChange={e => setHabitName(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-transparent px-3.5 font-sans text-[15px] font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)]"
              placeholder="e.g. Drink 8 glasses of water"
              autoFocus
            />
            <div className="mt-3 flex gap-2 text-[12px] text-[var(--text-tertiary)] font-body">
              <span>📊 Count · Target: 8 · Every day</span>
            </div>
          </div>

          <button
            onClick={createHabitAndAdvance}
            disabled={creating}
            className="h-13 w-full rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)] transition-opacity disabled:opacity-60"
            style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)', height: 52 }}
          >
            {creating ? 'Creating…' : 'Add habit →'}
          </button>
          <button
            onClick={() => setStep(3)}
            className="mt-3 text-center font-body text-[13px] text-[var(--text-tertiary)]"
          >
            Skip for now
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="flex max-w-sm flex-col items-center text-center">
          <div className="mb-6 text-6xl">🔔</div>
          <h2 className="font-sans text-[22px] font-extrabold tracking-tight text-[var(--text-primary)]">
            Get reminded daily
          </h2>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Set a reminder time on any habit and we'll send you a notification — even when the app is closed.
          </p>
          <button
            onClick={enableReminders}
            className="mt-8 w-full rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)]"
            style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)', height: 52 }}
          >
            Enable reminders
          </button>
          <button
            onClick={onComplete}
            className="mt-3 font-body text-[13px] text-[var(--text-tertiary)]"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  )
}
