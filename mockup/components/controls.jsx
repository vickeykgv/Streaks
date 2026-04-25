// Measurement controls for habits/tasks — each returns a dashboard-card right-side control.
// Styling matches phase-0 design system: rounded, tactile, color blooms on completion.

const { useState, useEffect, useRef } = React;

// ─── Checkbox (big tactile tap target) ────────────────────────────
function CheckboxControl({ done, color, onToggle }) {
  const c = color || 'var(--brand-500)';
  return (
    <button
      onClick={onToggle}
      aria-label={done ? 'Mark not done' : 'Mark done'}
      style={{
        width: 40, height: 40, borderRadius: 12,
        border: done ? `2px solid ${c}` : '2px solid var(--border-default)',
        background: done ? c : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: done ? 'scale(1)' : 'scale(1)',
        boxShadow: done ? `0 0 0 6px ${c}12` : 'none',
      }}
    >
      {done && <Ic.Check s={22} c="#fff" sw={3} />}
    </button>
  );
}

// ─── Count stepper ───────────────────────────────────────────────
function CountControl({ value, target, unit, color, onChange }) {
  const c = color || 'var(--brand-500)';
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  const complete = target && value >= target;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          style={stepBtn(false)}
          aria-label="Decrease"
        ><Ic.Minus s={16} c="var(--text-secondary)" /></button>
        <div style={{
          minWidth: 58, textAlign: 'center',
          fontFamily: 'Nunito', fontWeight: 800, fontSize: 15,
          color: complete ? c : 'var(--text-primary)',
          lineHeight: 1,
        }}>
          <span style={{ fontSize: 18 }}>{value}</span>
          {target && <span style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 13 }}>/{target}</span>}
        </div>
        <button
          onClick={() => onChange(value + 1)}
          style={stepBtn(true, c)}
          aria-label="Increase"
        ><Ic.Plus s={16} c={complete ? '#fff' : c} /></button>
      </div>
      {target && (
        <div style={{ width: 124, height: 4, borderRadius: 99, background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 99,
            background: c, transition: 'width 350ms cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
      )}
    </div>
  );
}

const stepBtn = (primary, color) => ({
  width: 32, height: 32, borderRadius: 10,
  border: primary ? `1.5px solid ${color || 'var(--brand-500)'}` : '1.5px solid var(--border-subtle)',
  background: 'transparent',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: 'all 120ms',
});

// ─── Duration timer (start/stop + manual) ─────────────────────────
function DurationControl({ valueMin, target, color, running, onToggle }) {
  const c = color || 'var(--brand-500)';
  const pct = target ? Math.min(100, (valueMin / target) * 100) : 0;
  const mm = String(Math.floor(valueMin)).padStart(2, '0');
  const complete = target && valueMin >= target;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          fontFamily: 'Nunito', fontWeight: 800, fontSize: 18,
          color: complete ? c : 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        }}>
          {mm}
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 13 }}>
            {target ? `/${target}` : ''}m
          </span>
        </div>
        <button
          onClick={onToggle}
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: running ? c : 'transparent',
            border: `2px solid ${c}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 200ms',
          }}
          aria-label={running ? 'Pause' : 'Start'}
        >
          {running ? <Ic.Pause s={16} c="#fff" /> : <Ic.Play s={16} c={c} />}
        </button>
      </div>
      {target && (
        <div style={{ width: 124, height: 4, borderRadius: 99, background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: c, transition: 'width 350ms' }} />
        </div>
      )}
    </div>
  );
}

// ─── Rating (1–5 stars) ───────────────────────────────────────────
function RatingControl({ value, color, onChange }) {
  const c = color || 'var(--brand-500)';
  return (
    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n === value ? 0 : n)}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 2, display: 'flex',
            transform: n <= value ? 'scale(1)' : 'scale(0.95)',
            transition: 'transform 120ms cubic-bezier(0.34,1.56,0.64,1)',
          }}
          aria-label={`Rate ${n}`}
        >
          <Ic.Star s={20} filled={n <= value} c={n <= value ? c : 'var(--border-default)'} />
        </button>
      ))}
    </div>
  );
}

// ─── Numeric input ────────────────────────────────────────────────
function NumericControl({ value, unit, color, onChange }) {
  const c = color || 'var(--brand-500)';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  return editing ? (
    <input
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { onChange(Number(draft) || 0); setEditing(false); }}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      style={{
        width: 90, height: 40, borderRadius: 12, textAlign: 'right', paddingRight: 10,
        fontFamily: 'Nunito', fontWeight: 800, fontSize: 16,
        border: `2px solid ${c}`, outline: 'none', color: 'var(--text-primary)',
        background: 'var(--bg-surface)',
      }}
    />
  ) : (
    <button
      onClick={() => { setDraft(value ?? ''); setEditing(true); }}
      style={{
        display: 'flex', alignItems: 'baseline', gap: 4,
        padding: '8px 14px', height: 40, borderRadius: 12,
        background: value ? `${c}15` : 'var(--bg-surface-2)',
        border: 'none', cursor: 'pointer', flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: value ? c : 'var(--text-tertiary)' }}>
        {value || '—'}
      </span>
      {unit && <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{unit}</span>}
    </button>
  );
}

window.Controls = { CheckboxControl, CountControl, DurationControl, RatingControl, NumericControl };
