import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check, Calendar, Clock } from 'lucide-react'
import { Droplet, BookOpen, Leaf, Pill, Dumbbell, Sun, Moon } from 'lucide-react'

const COLORS = ['#6366f1', '#0ea5e9', '#14b8a6', '#22c55e', '#f59e0b', '#f43f5e', '#8b5cf6']

const ICONS: { id: string; el: React.ReactNode }[] = [
  { id: 'droplet', el: <Droplet  size={18} /> },
  { id: 'book',    el: <BookOpen size={18} /> },
  { id: 'leaf',    el: <Leaf     size={18} /> },
  { id: 'pill',    el: <Pill     size={18} /> },
  { id: 'dumb',    el: <Dumbbell size={18} /> },
  { id: 'sun',     el: <Sun      size={18} /> },
  { id: 'moon',    el: <Moon     size={18} /> },
]

const MEASUREMENTS = [
  { id: 'checkbox', label: 'Check',  desc: 'Tap to mark done' },
  { id: 'count',    label: 'Count',  desc: '+ / − toward a goal' },
  { id: 'duration', label: 'Timer',  desc: 'Start / stop minutes' },
  { id: 'numeric',  label: 'Number', desc: 'Log a value' },
  { id: 'rating',   label: 'Rating', desc: '1–5 stars' },
]

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function NewHabit() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'habit' | 'task'>('habit')
  const [measurement, setMeasurement] = useState('count')
  const [selectedColor, setColor] = useState('#0ea5e9')
  const [selectedIcon, setIcon] = useState('droplet')
  const [days, setDays] = useState([1, 2, 3, 4, 5, 6, 0])
  const [title, setTitle] = useState('Drink water')
  const [target, setTarget] = useState(8)
  const [unit, setUnit] = useState('glasses')
  const [reminder, setReminder] = useState(true)

  const currentIcon = ICONS.find(i => i.id === selectedIcon)?.el
  const currentMeasure = MEASUREMENTS.find(m => m.id === measurement)

  return (
    <div className="min-h-screen bg-app pb-28">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="w-[38px] h-[38px] rounded-xl bg-surface border border-[var(--border-subtle)] flex items-center justify-center"
        >
          <X size={18} color="var(--text-secondary)" />
        </button>
        <span className="font-sans font-extrabold text-[15px] text-[var(--text-primary)]">New {mode}</span>
        <button
          className="h-[34px] px-3.5 rounded-xl font-sans font-extrabold text-[13px] text-white"
          style={{ background: 'var(--color-brand-500)', boxShadow: '0 2px 6px rgba(99,102,241,0.3)' }}
        >Save</button>
      </div>

      <div className="px-4">
        {/* Segmented habit/task */}
        <div className="flex bg-surface2 rounded-xl p-[3px] mb-4">
          {([{ id: 'habit', label: 'Habit', sub: 'Recurring' }, { id: 'task', label: 'Task', sub: 'One-off' }] as const).map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="flex-1 py-2.5 rounded-[10px] flex flex-col items-center gap-0.5 transition-all"
              style={{
                background: mode === m.id ? 'var(--bg-surface)' : 'transparent',
                boxShadow: mode === m.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <span className="font-sans font-extrabold text-[14px]"
                style={{ color: mode === m.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{m.label}</span>
              <span className="font-body text-[11px] text-[var(--text-tertiary)]">{m.sub}</span>
            </button>
          ))}
        </div>

        {/* Live preview card */}
        <div className="mb-4">
          <div className="font-sans font-extrabold text-[11px] text-[var(--text-tertiary)] uppercase tracking-[0.4px] mb-2">Preview</div>
          <div
            className="relative overflow-hidden rounded-2xl flex items-center gap-3.5 px-5 py-3.5"
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.08)',
            }}
          >
            <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full" style={{ background: selectedColor }} />
            <div className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0"
              style={{ background: `${selectedColor}1a`, color: selectedColor }}>{currentIcon}</div>
            <div>
              <div className="font-sans font-bold text-[15px] text-[var(--text-primary)]">{title || `New ${mode}`}</div>
              <div className="font-body text-[12px] text-[var(--text-tertiary)] mt-0.5">
                {currentMeasure?.desc}
                {measurement === 'count' && target ? ` · 0 / ${target}${unit ? ' ' + unit : ''}` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Fields */}
        <Field label="Title">
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Drink water"
            className="w-full h-11 rounded-xl border border-[var(--border-default)] bg-surface px-3.5 font-body text-[15px] text-[var(--text-primary)] outline-none focus:border-brand-500 placeholder:text-[var(--text-tertiary)]"
          />
        </Field>

        <Field label="Measurement">
          <div className="flex flex-col gap-1.5">
            {MEASUREMENTS.map(m => {
              const on = measurement === m.id
              return (
                <button key={m.id} onClick={() => setMeasurement(m.id)}
                  className="text-left px-3.5 py-[11px] rounded-xl flex items-center gap-3 transition-colors"
                  style={{
                    background: on ? `${selectedColor}12` : 'var(--bg-surface)',
                    border: on ? `1.5px solid ${selectedColor}` : '1px solid var(--border-subtle)',
                  }}
                >
                  <div className="w-5 h-5 rounded-full shrink-0"
                    style={{
                      border: on ? `6px solid ${selectedColor}` : '2px solid var(--border-default)',
                      background: on ? '#fff' : 'transparent',
                      boxShadow: on ? `inset 0 0 0 2px #fff` : 'none',
                    }}
                  />
                  <div>
                    <div className="font-sans font-extrabold text-[13px] text-[var(--text-primary)]">{m.label}</div>
                    <div className="font-body text-[11.5px] text-[var(--text-secondary)]">{m.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </Field>

        {(measurement === 'count' || measurement === 'duration' || measurement === 'numeric') && (
          <Field label="Target">
            <div className="flex gap-2">
              <input type="number" value={target} onChange={e => setTarget(+e.target.value)}
                className="w-[100px] h-11 rounded-xl border border-[var(--border-default)] bg-surface px-3.5 font-body text-[15px] text-[var(--text-primary)] outline-none focus:border-brand-500" />
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="unit"
                className="flex-1 h-11 rounded-xl border border-[var(--border-default)] bg-surface px-3.5 font-body text-[15px] text-[var(--text-primary)] outline-none focus:border-brand-500 placeholder:text-[var(--text-tertiary)]" />
            </div>
          </Field>
        )}

        {mode === 'habit' && (
          <Field label="Repeats on">
            <div className="flex gap-1.5">
              {DAY_LABELS.map((d, i) => {
                const on = days.includes(i)
                return (
                  <button key={i}
                    onClick={() => setDays(on ? days.filter(x => x !== i) : [...days, i])}
                    className="flex-1 h-10 rounded-xl font-sans font-extrabold text-[13px] transition-colors"
                    style={{
                      background: on ? selectedColor : 'var(--bg-surface)',
                      color: on ? '#fff' : 'var(--text-secondary)',
                      border: on ? 'none' : '1px solid var(--border-subtle)',
                    }}
                  >{d}</button>
                )
              })}
            </div>
          </Field>
        )}

        {mode === 'task' && (
          <Field label="Due">
            <div className="flex gap-2">
              <div className="flex-[1.3] h-11 rounded-xl border border-[var(--border-default)] bg-surface px-3.5 flex items-center gap-2 cursor-pointer">
                <Calendar size={14} color="var(--text-secondary)" />
                <span className="font-body text-[14px] text-[var(--text-primary)]">Fri, Apr 18</span>
              </div>
              <div className="flex-1 h-11 rounded-xl border border-[var(--border-default)] bg-surface px-3.5 flex items-center gap-2 cursor-pointer">
                <Clock size={14} color="var(--text-secondary)" />
                <span className="font-body text-[14px] text-[var(--text-primary)]">9:00 AM</span>
              </div>
            </div>
          </Field>
        )}

        <Field label="Color">
          <div className="flex gap-2.5 flex-wrap">
            {COLORS.map(c => {
              const on = c === selectedColor
              return (
                <button key={c} onClick={() => setColor(c)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-[box-shadow] duration-[150ms]"
                  style={{ background: c, boxShadow: on ? `0 0 0 3px var(--bg-surface), 0 0 0 5px ${c}` : 'none' }}
                >
                  {on && <Check size={14} color="#fff" strokeWidth={3.5} />}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Icon">
          <div className="flex gap-2.5 flex-wrap">
            {ICONS.map(ic => {
              const on = ic.id === selectedIcon
              return (
                <button key={ic.id} onClick={() => setIcon(ic.id)}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: on ? `${selectedColor}18` : 'var(--bg-surface-2)',
                    border: on ? `2px solid ${selectedColor}` : '2px solid transparent',
                    color: on ? selectedColor : 'var(--text-secondary)',
                  }}
                >{ic.el}</button>
              )
            })}
          </div>
        </Field>

        {/* Reminder */}
        <div className="flex items-center justify-between py-3.5 border-t border-[var(--border-subtle)] mt-2">
          <div>
            <div className="font-sans font-semibold text-[14px] text-[var(--text-primary)]">Reminder</div>
            <div className="font-body text-[12px] text-[var(--text-tertiary)]">Daily push notification</div>
          </div>
          <label className="relative cursor-pointer">
            <input type="checkbox" checked={reminder} onChange={e => setReminder(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 rounded-full border-2 border-transparent bg-[var(--border-default)] peer-checked:bg-brand-500 transition-colors duration-[200ms]" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-[200ms] peer-checked:translate-x-5" />
          </label>
        </div>

        {/* Create button */}
        <button
          className="w-full h-12 rounded-2xl mt-4 text-white font-sans font-extrabold text-[15px]"
          style={{ background: 'var(--color-brand-500)', boxShadow: '0 6px 16px rgba(99,102,241,0.35)' }}
        >
          Create {mode}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="font-sans font-bold text-[12px] text-[var(--text-secondary)] uppercase tracking-[0.3px] mb-1.5">{label}</div>
      {children}
    </div>
  )
}
