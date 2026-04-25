// Habit detail screen — shows heatmap, stats, history. Second screen we showcase.

const { useState: useStateHD } = React;

function HabitDetail() {
  const habit = {
    title: 'Read',
    icon: <Ic.Book s={24} />,
    color: '#8b5cf6',
    tags: [{ name:'mind', color:'#8b5cf6' }],
    description: '20 pages a day keeps the brain awake.',
    recurrence: 'Every day',
    reminder: '21:00',
  };

  // 90-day heatmap data — pseudo-random but deterministic
  const today = new Date();
  const days = Array.from({ length: 91 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (90 - i));
    const seed = (d.getDate() * 7 + d.getMonth() * 31) % 10;
    let status = 'none';
    if (seed > 7) status = 'done';
    else if (seed > 5) status = 'partial';
    else if (seed > 4) status = 'skipped';
    return { date: d, status };
  });

  const currentStreak = 21;
  const longestStreak = 28;
  const rate7  = 0.86;
  const rate30 = 0.74;

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{
        padding: '16px 20px 22px',
        background: `linear-gradient(180deg, ${habit.color}18, transparent)`,
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 18 }}>
          <button style={roundBtn}><Ic.ChevRight s={18} c="var(--text-secondary)" sw={2.4}/><span style={{marginLeft:-22, transform:'rotate(180deg)', display:'flex'}}/></button>
          <div style={{ display:'flex', gap: 8 }}>
            <button style={roundBtn}><Ic.Bell s={16} c="var(--text-secondary)"/></button>
            <button style={roundBtn}>•••</button>
          </div>
        </div>

        <div style={{
          width: 62, height: 62, borderRadius: 18,
          background: `${habit.color}22`, color: habit.color,
          display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom: 12,
        }}>{habit.icon}</div>

        <div style={{ fontFamily:'Nunito', fontSize: 30, fontWeight: 800, color:'var(--text-primary)', letterSpacing: -0.6 }}>
          {habit.title}
        </div>
        <div style={{ fontFamily:'Nunito Sans', fontSize: 14, color:'var(--text-secondary)', marginTop: 4 }}>
          {habit.description}
        </div>
        <div style={{ display:'flex', gap: 6, marginTop: 12, flexWrap:'wrap' }}>
          <Cards.TagChip {...habit.tags[0]} />
          <span style={metaChip}><Ic.Calendar s={11} c="var(--text-secondary)"/>{habit.recurrence}</span>
          <span style={metaChip}><Ic.Clock s={11} c="var(--text-secondary)"/>{habit.reminder}</span>
        </div>
      </div>

      {/* Stat grid */}
      <div style={{ padding:'0 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
        <BigStat label="Current streak" value={currentStreak} unit="days" accent="var(--streak)" icon={<Ic.Flame s={16} c="var(--streak)"/>} />
        <BigStat label="Longest streak"  value={longestStreak} unit="days" accent="var(--text-primary)" />
        <BigStat label="Last 7 days"  value={Math.round(rate7*100)}  unit="%" accent={habit.color} bar={rate7} />
        <BigStat label="Last 30 days" value={Math.round(rate30*100)} unit="%" accent={habit.color} bar={rate30} />
      </div>

      {/* Heatmap */}
      <div style={{ padding: '22px 16px 0' }}>
        <Cards.SectionHeader label="Last 90 days" right={
          <div style={{ display:'flex', gap: 10, fontFamily:'Nunito Sans', fontSize: 11, color:'var(--text-tertiary)' }}>
            <LegendDot c="var(--bg-surface-2)"/>
            <LegendDot c={`${habit.color}40`}/>
            <LegendDot c={`${habit.color}80`}/>
            <LegendDot c={habit.color}/>
          </div>
        }/>
        <div style={{
          background:'var(--surface)', border:'1px solid var(--border-subtle)',
          borderRadius: 16, padding: 14,
          display:'grid', gridTemplateColumns:'repeat(13, 1fr)', gap: 4,
        }}>
          {days.map((d, i) => {
            const bg = d.status === 'done' ? habit.color
              : d.status === 'partial' ? `${habit.color}70`
              : d.status === 'skipped' ? 'var(--skipped-bg)'
              : 'var(--bg-surface-2)';
            return <div key={i} style={{ aspectRatio:'1', borderRadius: 4, background: bg }} title={d.date.toDateString()} />;
          })}
        </div>
      </div>

      {/* Recent history */}
      <div style={{ padding: '10px 16px 0' }}>
        <Cards.SectionHeader label="Recent" />
        <div style={{ background:'var(--surface)', border:'1px solid var(--border-subtle)', borderRadius: 16, overflow:'hidden' }}>
          {[
            { d:'Today',     v:'12 pages', s:'partial' },
            { d:'Yesterday', v:'24 pages', s:'done' },
            { d:'Sun',       v:'22 pages', s:'done' },
            { d:'Sat',       v:'—',        s:'skipped' },
            { d:'Fri',       v:'30 pages', s:'done' },
          ].map((r, i, arr) => (
            <div key={r.d} style={{
              display:'flex', alignItems:'center', padding:'12px 14px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <div style={{ fontFamily:'Nunito', fontWeight:700, fontSize:14, color:'var(--text-primary)', flex:1 }}>{r.d}</div>
              <div style={{ fontFamily:'Nunito Sans', fontSize:13, color:'var(--text-secondary)', marginRight: 10 }}>{r.v}</div>
              <StatusPill s={r.s} color={habit.color}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const roundBtn = {
  width: 36, height: 36, borderRadius: 12,
  background:'var(--surface)', border:'1px solid var(--border-subtle)',
  display:'flex', alignItems:'center', justifyContent:'center',
  cursor:'pointer', fontFamily:'Nunito', fontWeight: 800, fontSize: 14,
  color:'var(--text-secondary)',
};

const metaChip = {
  display:'inline-flex', alignItems:'center', gap:4,
  background:'var(--bg-surface-2)', padding:'3px 8px', borderRadius: 99,
  fontFamily:'Nunito', fontSize: 11, fontWeight: 700, color:'var(--text-secondary)',
};

function BigStat({ label, value, unit, accent, icon, bar }) {
  return (
    <div style={{
      background:'var(--surface)', border:'1px solid var(--border-subtle)',
      borderRadius: 14, padding: 14,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:'Nunito', fontSize: 11, fontWeight:700, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing: 0.3 }}>{label}</span>
        {icon}
      </div>
      <div style={{
        fontFamily:'Nunito', fontSize: 28, fontWeight: 800, color: accent,
        lineHeight: 1.1, marginTop: 2, letterSpacing:-0.5,
      }}>
        {value}<span style={{ fontSize: 13, color:'var(--text-tertiary)', fontWeight:600, marginLeft: 3 }}>{unit}</span>
      </div>
      {bar != null && (
        <div style={{ marginTop: 8, height: 4, borderRadius: 99, background:'var(--bg-surface-2)' }}>
          <div style={{ width: `${bar*100}%`, height:'100%', background: accent, borderRadius: 99 }}/>
        </div>
      )}
    </div>
  );
}

function StatusPill({ s, color }) {
  const map = {
    done:    { label:'Done',    bg: `${color}18`, fg: color },
    partial: { label:'Partial', bg:'var(--partial-bg)', fg:'var(--partial)' },
    skipped: { label:'Skipped', bg:'var(--skipped-bg)', fg:'var(--skipped)' },
  };
  const v = map[s];
  return <span style={{
    padding:'3px 10px', borderRadius: 99, background: v.bg, color: v.fg,
    fontFamily:'Nunito', fontWeight: 800, fontSize: 11,
  }}>{v.label}</span>;
}

function LegendDot({ c }) {
  return <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display:'inline-block' }}/>;
}

window.HabitDetail = HabitDetail;
