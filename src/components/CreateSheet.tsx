import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

const COLORS: Record<string, string> = {
  indigo: '#6366f1', sky: '#0ea5e9', teal: '#14b8a6', green: '#22c55e',
  amber: '#f59e0b', rose: '#f43f5e', violet: '#8b5cf6',
}

interface CreateSheetProps {
  onClose: () => void
}

export function CreateSheet({ onClose }: CreateSheetProps) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'habit' | 'task'>('habit')
  const [measurement, setMeasurement] = useState('checkbox')

  const measurements = ['checkbox', 'count', 'duration', 'numeric', 'rating']
  const measureLabel: Record<string, string> = { checkbox:'Checkbox', count:'Count', duration:'Timer', numeric:'Number', rating:'Rating' }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm animate-fade-in"
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-surface rounded-t-[22px] px-[18px] pb-8 animate-slide-up"
        style={{ boxShadow: '0 -10px 30px rgba(0,0,0,0.15)', maxHeight: '80%', overflowY: 'auto' }}
      >
        <div className="w-10 h-1 rounded-full bg-[var(--border-default)] mx-auto mt-2.5 mb-3.5" />

        <div className="flex items-center justify-between mb-4">
          <div className="font-sans font-extrabold text-[20px] text-[var(--text-primary)]">New {mode}</div>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-[10px] bg-surface2 flex items-center justify-center"
          >
            <X size={15} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Segmented */}
        <div className="flex bg-surface2 rounded-xl p-[3px] mb-4">
          {(['habit', 'task'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className="flex-1 py-[9px] rounded-[9px] font-sans font-bold text-[13px] capitalize transition-all"
              style={{
                background: mode === m ? 'var(--bg-surface)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: mode === m ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >{m}</button>
          ))}
        </div>

        {/* Title */}
        <div className="mb-3.5">
          <div className="font-sans font-bold text-[12px] text-[var(--text-secondary)] uppercase tracking-[0.3px] mb-1.5">Title</div>
          <input
            placeholder={mode === 'habit' ? 'e.g. Drink water' : 'e.g. Submit report'}
            className="w-full h-11 rounded-xl border border-[var(--border-default)] bg-surface px-3.5 font-body text-[15px] text-[var(--text-primary)] outline-none focus:border-brand-500 placeholder:text-[var(--text-tertiary)]"
          />
        </div>

        {/* Measurement */}
        <div className="mb-3.5">
          <div className="font-sans font-bold text-[12px] text-[var(--text-secondary)] uppercase tracking-[0.3px] mb-1.5">Measurement</div>
          <div className="grid grid-cols-3 gap-2">
            {measurements.map(id => (
              <button key={id} onClick={() => setMeasurement(id)} className="py-[9px] px-2.5 rounded-[10px] font-sans font-bold text-[12px] transition-colors"
                style={{
                  background: measurement === id ? 'var(--color-brand-500)15' : 'var(--bg-surface-2)',
                  border: measurement === id ? '1.5px solid var(--color-brand-500)' : '1.5px solid transparent',
                  color: measurement === id ? 'var(--color-brand-600)' : 'var(--text-secondary)',
                }}
              >{measureLabel[id]}</button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="mb-5">
          <div className="font-sans font-bold text-[12px] text-[var(--text-secondary)] uppercase tracking-[0.3px] mb-1.5">Color</div>
          <div className="flex gap-2.5 flex-wrap">
            {Object.entries(COLORS).map(([k, v]) => (
              <button key={k} className="w-8 h-8 rounded-[10px] cursor-pointer" style={{ background: v }} />
            ))}
          </div>
        </div>

        <button
          onClick={() => { onClose(); navigate('/new') }}
          className="w-full h-12 rounded-2xl bg-brand-500 text-white font-sans font-extrabold text-[15px]"
          style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
        >
          Continue
        </button>
      </div>
    </>
  )
}
