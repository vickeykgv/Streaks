// Habit + Task cards, section headers, pieces for the dashboard.
const { useState: useStateC } = React;

function TagChip({ name, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: `${color}18`, color,
      fontFamily: 'Nunito', fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 99, background: color }} />
      {name}
    </span>
  );
}

function StreakBadge({ days }) {
  if (!days) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 8px 2px 6px', borderRadius: 999,
      background: 'var(--streak-bg)', color: 'var(--streak)',
      fontFamily: 'Nunito', fontSize: 11, fontWeight: 800,
    }}>
      <Ic.Flame s={11} />{days}
    </span>
  );
}

function HabitIcon({ bg, children }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 13,
      background: `${bg}1a`, color: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>{children}</div>
  );
}

function HabitCard({ habit, entry, onUpdate }) {
  const { id, title, icon, color, tags, streak, type, target, unit } = habit;
  const done = entry?.status === 'done' ||
    (type === 'count' && target && (entry?.value || 0) >= target) ||
    (type === 'duration' && target && (entry?.value || 0) >= target) ||
    (type === 'rating' && (entry?.value || 0) > 0) ||
    (type === 'numeric' && (entry?.value || 0) > 0);

  const ctrl = (() => {
    const p = { color, onChange: v => onUpdate({ value: v }) };
    switch (type) {
      case 'checkbox': return <Controls.CheckboxControl done={done} color={color} onToggle={() => onUpdate({ status: done ? 'pending' : 'done' })} />;
      case 'count':    return <Controls.CountControl value={entry?.value || 0} target={target} unit={unit} {...p} />;
      case 'duration': return <Controls.DurationControl valueMin={entry?.value || 0} target={target} color={color} running={entry?.running} onToggle={() => onUpdate({ running: !entry?.running })} />;
      case 'rating':   return <Controls.RatingControl value={entry?.value || 0} {...p} />;
      case 'numeric':  return <Controls.NumericControl value={entry?.value} unit={unit} {...p} />;
    }
  })();

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: done ? 'var(--done-bg)' : 'var(--surface)',
      borderRadius: 16,
      border: done ? '1px solid var(--done)33' : '1px solid var(--border-subtle)',
      boxShadow: done ? 'none' : '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
      padding: '14px 14px 14px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'background 200ms, border-color 200ms',
    }}>
      <span style={{
        position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 99,
        background: done ? 'var(--done)' : color,
      }} />
      <HabitIcon bg={done ? 'var(--done)' : color}>{done && type === 'checkbox' ? <Ic.Check s={18} c="var(--done)" sw={3}/> : icon}</HabitIcon>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Nunito', fontSize: 15, fontWeight: 700,
          color: done ? 'var(--text-tertiary)' : 'var(--text-primary)',
          textDecoration: done && type === 'checkbox' ? 'line-through' : 'none',
          textDecorationColor: 'var(--done)',
          textDecorationThickness: '2px',
          letterSpacing: -0.1,
        }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          <StreakBadge days={streak} />
          {tags?.map(t => <TagChip key={t.name} {...t} />)}
        </div>
      </div>
      {ctrl}
    </div>
  );
}

function TaskCard({ task, onToggle }) {
  const done = task.status === 'done';
  const prColor = task.priority === 'high' ? 'var(--overdue)' : task.priority === 'med' ? 'var(--partial)' : 'var(--skipped)';
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: done ? 'var(--done-bg)' : 'var(--surface)',
      borderRadius: 16,
      border: done ? '1px solid var(--done)33' : '1px solid var(--border-subtle)',
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: done ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
      transition: 'background 200ms, border-color 200ms',
    }}>
      {done && (
        <span style={{
          position:'absolute', top: 8, right: 8,
          display:'inline-flex', alignItems:'center', gap: 3,
          padding:'2px 7px 2px 5px', borderRadius: 99,
          background: 'var(--done)', color:'#fff',
          fontFamily:'Nunito', fontWeight: 800, fontSize: 10, letterSpacing: 0.3,
        }}>
          <Ic.Check s={10} c="#fff" sw={3.5}/>DONE
        </span>
      )}
      <Controls.CheckboxControl done={done} color={task.color} onToggle={onToggle} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Nunito', fontWeight: 700, fontSize: 14.5,
          color: done ? 'var(--text-tertiary)' : 'var(--text-primary)',
          textDecoration: done ? 'line-through' : 'none',
          textDecorationColor: 'var(--done)',
          textDecorationThickness: '2px',
          transition: 'color 200ms',
        }}>{task.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
          {task.dueTime && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
              <Ic.Clock s={11} />{task.dueTime}
            </span>
          )}
          {task.overdue && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              color: 'var(--overdue)', fontSize: 11, fontWeight: 800,
              background: 'var(--overdue-bg)', padding: '1px 7px', borderRadius: 99,
            }}>
              <Ic.AlertCircle s={10} />overdue
            </span>
          )}
          {task.tags?.map(t => <TagChip key={t.name} {...t} />)}
        </div>
      </div>
      <span style={{
        width: 6, height: 6, borderRadius: 99, background: prColor,
        alignSelf: 'flex-start', marginTop: 8,
      }} title={`${task.priority} priority`} />
    </div>
  );
}

function SectionHeader({ label, count, right, dim }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 4px', marginBottom: 10, marginTop: 22,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontFamily: 'Nunito', fontWeight: 800, fontSize: 14,
          color: dim ? 'var(--text-secondary)' : 'var(--text-primary)',
          letterSpacing: 0.2, textTransform: 'uppercase',
        }}>{label}</span>
        {count != null && (
          <span style={{
            fontFamily: 'Nunito', fontWeight: 700, fontSize: 12,
            color: 'var(--text-tertiary)',
          }}>{count}</span>
        )}
      </div>
      {right}
    </div>
  );
}

window.Cards = { HabitCard, TaskCard, SectionHeader, TagChip, StreakBadge };
