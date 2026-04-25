import { Flame } from 'lucide-react'
import { BookOpen, Droplet, Leaf, Pill } from 'lucide-react'

// 26 weeks × 7 days
const WEEKS = 26
const cells: number[][] = []
for (let w = 0; w < WEEKS; w++) {
  const col: number[] = []
  for (let d = 0; d < 7; d++) {
    const seed = (w * 13 + d * 7 + 3) % 10
    col.push(seed > 8 ? 4 : seed > 6 ? 3 : seed > 4 ? 2 : seed > 2 ? 1 : 0)
  }
  cells.push(col)
}
const LV_HEX = ['var(--bg-surface-2)', '#6366f140', '#6366f180', '#6366f1c0', '#6366f1']

const BAR_DATA = [0.4, 0.62, 0.78, 0.55, 0.9, 0.7, 0.82, 0.95]

const TOP_HABITS = [
  { name: 'Take vitamins', c: '#f59e0b', v: 0.95, icon: <Pill     size={14} /> },
  { name: 'Drink water',   c: '#0ea5e9', v: 0.86, icon: <Droplet  size={14} /> },
  { name: 'Read',          c: '#8b5cf6', v: 0.74, icon: <BookOpen size={14} /> },
  { name: 'Meditate',      c: '#14b8a6', v: 0.68, icon: <Leaf     size={14} /> },
]

export default function Stats() {
  return (
    <div className="min-h-screen bg-app pb-24">
      <div className="max-w-2xl mx-auto px-0">
      {/* Header */}
      <div className="px-5 pt-3">
        <div className="font-body text-[12px] font-medium text-[var(--text-tertiary)]">Last 6 months</div>
        <div className="font-sans text-[28px] font-extrabold text-[var(--text-primary)] tracking-tight">Stats</div>
      </div>

      {/* KPI hero */}
      <div className="px-4 mt-4 grid gap-2.5" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        <div className="rounded-[18px] p-4 text-white" style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-soft)' }}>
          <div className="font-sans text-[11px] font-bold opacity-80 uppercase tracking-[0.4px]">Completion · 30d</div>
          <div className="font-sans text-[36px] font-extrabold tracking-tight leading-[1.1] mt-0.5">74%</div>
          <div className="font-body text-[12px] opacity-85 mt-0.5">↑ 8% vs last month</div>
        </div>
        <div className="bg-surface border border-[var(--border-subtle)] rounded-[18px] p-4">
          <div className="font-sans text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.4px]">Best streak</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <Flame size={18} fill="var(--color-streak)" stroke="none" />
            <span className="font-sans text-[32px] font-extrabold tracking-tight" style={{ color: 'var(--color-streak)' }}>34</span>
          </div>
          <div className="font-body text-[12px] text-[var(--text-secondary)]">Vitamins</div>
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="px-4 mt-5">
        <div className="font-sans font-extrabold text-[14px] uppercase tracking-[0.2px] text-[var(--text-primary)] mb-2.5">Activity</div>
        <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl p-3.5">
          <div className="flex gap-[3px]">
            {cells.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px] flex-1">
                {col.map((lv, ri) => (
                  <div key={ri} className="rounded-[3px]" style={{ aspectRatio: '1', background: LV_HEX[lv] }} />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <span className="font-body text-[11px] text-[var(--text-tertiary)]">Nov</span>
            <span className="font-body text-[11px] text-[var(--text-tertiary)]">Feb</span>
            <span className="font-body text-[11px] text-[var(--text-tertiary)]">Apr</span>
          </div>
        </div>
      </div>

      {/* Weekly bars */}
      <div className="px-4 mt-5">
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="font-sans font-extrabold text-[14px] uppercase tracking-[0.2px] text-[var(--text-primary)]">Last 8 weeks</span>
          <span className="font-sans font-bold text-[11px] text-[var(--text-tertiary)]">% complete</span>
        </div>
        <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl px-4 pb-3.5 pt-[18px] flex gap-2.5 items-end h-[140px]">
          {BAR_DATA.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
              <div className="flex-1 w-full flex items-end">
                <div
                  className="w-full rounded-t-[6px] rounded-b-[3px] transition-[height]"
                  style={{
                    height: `${v * 100}%`,
                    background: i === BAR_DATA.length - 1 ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                  }}
                />
              </div>
              <span className="font-sans text-[10px] font-bold"
                style={{ color: i === BAR_DATA.length - 1 ? 'var(--color-brand-600)' : 'var(--text-tertiary)' }}>
                W{i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top habits */}
      <div className="px-4 mt-5">
        <div className="font-sans font-extrabold text-[14px] uppercase tracking-[0.2px] text-[var(--text-primary)] mb-2.5">Top habits · 30d</div>
        <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
          {TOP_HABITS.map((r, i) => (
            <div key={r.name} className="flex items-center gap-3 px-3.5 py-3"
              style={{ borderBottom: i < TOP_HABITS.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
              <div className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0"
                style={{ background: `${r.c}1a`, color: r.c }}>{r.icon}</div>
              <span className="font-sans font-bold text-[13px] text-[var(--text-primary)] flex-1">{r.name}</span>
              <div className="w-[90px] h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
                <div className="h-full rounded-full" style={{ width: `${r.v * 100}%`, background: r.c }} />
              </div>
              <span className="font-sans font-extrabold text-[12px] text-[var(--text-secondary)] w-[34px] text-right">
                {Math.round(r.v * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      </div>
    </div>
  )
}
