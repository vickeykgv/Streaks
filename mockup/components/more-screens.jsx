// Habits list screen + Stats screen + Empty state screen

const { useState: useStateE } = React;

// ───────── HABITS LIST ─────────
function HabitsList() {
  const [filter, setFilter] = useStateE('all');
  const [sort, setSort] = useStateE('name');

  const habits = [
    { id:'h1', title:'Drink water',   icon:<Ic.Droplet s={18}/>, color:'#0ea5e9', streak:12, rate:0.86, tag:'health' },
    { id:'h2', title:'Take vitamins', icon:<Ic.Pill s={18}/>,    color:'#f59e0b', streak:34, rate:0.95, tag:'health' },
    { id:'h3', title:'Meditate',      icon:<Ic.Leaf s={18}/>,    color:'#14b8a6', streak:7,  rate:0.68, tag:'mind' },
    { id:'h4', title:'Read',          icon:<Ic.Book s={18}/>,    color:'#8b5cf6', streak:21, rate:0.74, tag:'mind' },
    { id:'h5', title:'Mood check-in', icon:<Ic.Sun s={18}/>,     color:'#f43f5e', streak:5,  rate:0.60, tag:'mind' },
    { id:'h6', title:'Workout',       icon:<Ic.Dumbbell s={18}/>,color:'#6366f1', streak:3,  rate:0.45, tag:'fitness' },
  ];

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* header */}
      <div style={{ padding:'8px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontFamily:'Nunito Sans', fontSize:12, fontWeight:500, color:'var(--text-tertiary)' }}>6 active</div>
          <div style={{ fontFamily:'Nunito', fontSize:28, fontWeight:800, color:'var(--text-primary)', letterSpacing:-0.6 }}>Habits</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ width:38, height:38, borderRadius:12, background:'var(--surface)', border:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Ic.Search s={16} c="var(--text-secondary)"/>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display:'flex', gap:6, padding:'16px 20px 10px', overflowX:'auto' }}>
        {['All','health','mind','fitness','archived'].map(f => {
          const on = f.toLowerCase() === filter;
          return (
            <button key={f} onClick={() => setFilter(f.toLowerCase())} style={{
              padding:'6px 12px', borderRadius:99,
              background: on ? 'var(--brand-500)' : 'var(--surface)',
              border: on ? 'none' : '1px solid var(--border-subtle)',
              color: on ? '#fff' : 'var(--text-secondary)',
              fontFamily:'Nunito', fontWeight:700, fontSize:12,
              cursor:'pointer', whiteSpace:'nowrap',
            }}>{f}</button>
          );
        })}
      </div>

      {/* Sort */}
      <div style={{ padding:'0 20px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontFamily:'Nunito', fontSize:11, fontWeight:800, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:0.3 }}>All habits</span>
        <button style={{
          display:'flex', alignItems:'center', gap:4, background:'transparent', border:'none', cursor:'pointer',
          fontFamily:'Nunito', fontWeight:700, fontSize:12, color:'var(--text-secondary)',
        }}>Sort: {sort}<Ic.ChevDown s={12} c="var(--text-tertiary)"/></button>
      </div>

      {/* Cards */}
      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:8 }}>
        {habits.map(h => (
          <div key={h.id} style={{
            background:'var(--surface)', borderRadius:14, border:'1px solid var(--border-subtle)',
            padding:'12px 14px', display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{
              width:40, height:40, borderRadius:12,
              background:`${h.color}1a`, color:h.color,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>{h.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Nunito', fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>{h.title}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3 }}>
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:3,
                  fontFamily:'Nunito', fontWeight:800, fontSize:11, color:'var(--streak)',
                }}><Ic.Flame s={10}/>{h.streak}d</span>
                <span style={{ fontFamily:'Nunito Sans', fontSize:11, color:'var(--text-tertiary)' }}>
                  {Math.round(h.rate*100)}% · 30d
                </span>
              </div>
              <div style={{ marginTop:6, height:3, borderRadius:99, background:'var(--bg-surface-2)' }}>
                <div style={{ width:`${h.rate*100}%`, height:'100%', background:h.color, borderRadius:99 }}/>
              </div>
            </div>
            <Ic.ChevRight s={16} c="var(--text-tertiary)"/>
          </div>
        ))}
      </div>

      <BottomNavE active="habits"/>
    </div>
  );
}

// ───────── STATS SCREEN ─────────
function StatsScreen() {
  // Last 26 weeks × 7 days heatmap
  const weeks = 26;
  const cells = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const seed = (w * 13 + d * 7 + 3) % 10;
      let level = 0;
      if (seed > 8) level = 4;
      else if (seed > 6) level = 3;
      else if (seed > 4) level = 2;
      else if (seed > 2) level = 1;
      col.push(level);
    }
    cells.push(col);
  }
  const accent = 'var(--brand-500)';
  const levelColor = lv => {
    if (lv === 0) return 'var(--bg-surface-2)';
    if (lv === 1) return `${accent}30`.replace('var(--brand-500)','#6366f1');
    if (lv === 2) return `${accent}60`.replace('var(--brand-500)','#6366f1');
    if (lv === 3) return `${accent}a0`.replace('var(--brand-500)','#6366f1');
    return accent;
  };
  // Use CSS vars via inline style won't blend — use direct hex mirror
  const lvHex = ['var(--bg-surface-2)','#6366f140','#6366f180','#6366f1c0','#6366f1'];

  const barWeeks = [0.4, 0.62, 0.78, 0.55, 0.9, 0.7, 0.82, 0.95];

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding:'8px 20px 0' }}>
        <div style={{ fontFamily:'Nunito Sans', fontSize:12, fontWeight:500, color:'var(--text-tertiary)' }}>Last 6 months</div>
        <div style={{ fontFamily:'Nunito', fontSize:28, fontWeight:800, color:'var(--text-primary)', letterSpacing:-0.6 }}>Stats</div>
      </div>

      {/* Top KPI */}
      <div style={{ padding:'16px 16px 0', display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:10 }}>
        <div style={{
          background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color:'#fff', borderRadius:18, padding:'14px 16px',
          boxShadow:'0 8px 20px rgba(99,102,241,0.25)',
        }}>
          <div style={{ fontFamily:'Nunito', fontSize:11, fontWeight:700, opacity:0.8, textTransform:'uppercase', letterSpacing:0.4 }}>Completion · 30d</div>
          <div style={{ fontFamily:'Nunito', fontSize:36, fontWeight:800, letterSpacing:-1, lineHeight:1.1, marginTop:2 }}>74%</div>
          <div style={{ fontFamily:'Nunito Sans', fontSize:12, opacity:0.85, marginTop:2 }}>↑ 8% vs last month</div>
        </div>
        <div style={{
          background:'var(--surface)', border:'1px solid var(--border-subtle)',
          borderRadius:18, padding:'14px 16px',
        }}>
          <div style={{ fontFamily:'Nunito', fontSize:11, fontWeight:700, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:0.4 }}>Best streak</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:2 }}>
            <Ic.Flame s={18} c="var(--streak)"/>
            <span style={{ fontFamily:'Nunito', fontSize:32, fontWeight:800, color:'var(--streak)', letterSpacing:-0.8 }}>34</span>
          </div>
          <div style={{ fontFamily:'Nunito Sans', fontSize:12, color:'var(--text-secondary)' }}>Vitamins</div>
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ padding:'22px 16px 0' }}>
        <Cards.SectionHeader label="Activity" />
        <div style={{
          background:'var(--surface)', border:'1px solid var(--border-subtle)',
          borderRadius:16, padding:14,
        }}>
          <div style={{ display:'flex', gap:3 }}>
            {cells.map((col, ci) => (
              <div key={ci} style={{ display:'flex', flexDirection:'column', gap:3, flex:1 }}>
                {col.map((lv, ri) => (
                  <div key={ri} style={{
                    aspectRatio:'1', borderRadius:3, background:lvHex[lv],
                  }}/>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10 }}>
            <span style={{ fontFamily:'Nunito Sans', fontSize:11, color:'var(--text-tertiary)' }}>Nov</span>
            <span style={{ fontFamily:'Nunito Sans', fontSize:11, color:'var(--text-tertiary)' }}>Feb</span>
            <span style={{ fontFamily:'Nunito Sans', fontSize:11, color:'var(--text-tertiary)' }}>Apr</span>
          </div>
        </div>
      </div>

      {/* Weekly bars */}
      <div style={{ padding:'18px 16px 0' }}>
        <Cards.SectionHeader label="Last 8 weeks" right={
          <span style={{ fontFamily:'Nunito', fontWeight:700, fontSize:11, color:'var(--text-tertiary)' }}>% complete</span>
        }/>
        <div style={{
          background:'var(--surface)', border:'1px solid var(--border-subtle)',
          borderRadius:16, padding:'18px 16px 14px',
          display:'flex', gap:10, alignItems:'flex-end', height:140,
        }}>
          {barWeeks.map((v, i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%' }}>
              <div style={{ flex:1, width:'100%', display:'flex', alignItems:'flex-end' }}>
                <div style={{
                  width:'100%', height:`${v*100}%`,
                  background: i === barWeeks.length-1 ? 'var(--brand-500)' : 'var(--bg-surface-2)',
                  borderRadius:'6px 6px 3px 3px',
                  transition:'height 350ms',
                }}/>
              </div>
              <span style={{ fontFamily:'Nunito', fontSize:10, fontWeight:700, color: i === barWeeks.length-1 ? 'var(--brand-600)' : 'var(--text-tertiary)' }}>
                W{i+1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top habits */}
      <div style={{ padding:'18px 16px 0' }}>
        <Cards.SectionHeader label="Top habits · 30d"/>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border-subtle)', borderRadius:16, overflow:'hidden' }}>
          {[
            { name:'Take vitamins', c:'#f59e0b', v:0.95, icon:<Ic.Pill s={14}/> },
            { name:'Drink water',   c:'#0ea5e9', v:0.86, icon:<Ic.Droplet s={14}/> },
            { name:'Read',          c:'#8b5cf6', v:0.74, icon:<Ic.Book s={14}/> },
            { name:'Meditate',      c:'#14b8a6', v:0.68, icon:<Ic.Leaf s={14}/> },
          ].map((r, i, arr) => (
            <div key={r.name} style={{
              padding:'12px 14px', display:'flex', alignItems:'center', gap:12,
              borderBottom: i < arr.length-1 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <div style={{ width:28, height:28, borderRadius:9, background:`${r.c}1a`, color:r.c, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {r.icon}
              </div>
              <span style={{ fontFamily:'Nunito', fontWeight:700, fontSize:13, color:'var(--text-primary)', flex:1 }}>{r.name}</span>
              <div style={{ width:90, height:4, borderRadius:99, background:'var(--bg-surface-2)', overflow:'hidden' }}>
                <div style={{ width:`${r.v*100}%`, height:'100%', background:r.c, borderRadius:99 }}/>
              </div>
              <span style={{ fontFamily:'Nunito', fontWeight:800, fontSize:12, color:'var(--text-secondary)', width:34, textAlign:'right' }}>
                {Math.round(r.v*100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <BottomNavE active="stats"/>
    </div>
  );
}

// ───────── EMPTY STATE ─────────
function EmptyScreen() {
  return (
    <div style={{ padding:'8px 20px 100px', height:'100%', display:'flex', flexDirection:'column' }}>
      <div>
        <div style={{ fontFamily:'Nunito Sans', fontSize:12, fontWeight:500, color:'var(--text-tertiary)' }}>Thursday, April 17</div>
        <div style={{ fontFamily:'Nunito', fontSize:28, fontWeight:800, color:'var(--text-primary)', letterSpacing:-0.6 }}>Good morning</div>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'0 20px' }}>
        {/* Abstract illustration using shapes only */}
        <div style={{
          position:'relative', width: 180, height: 180, marginBottom: 24,
        }}>
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:'radial-gradient(circle at 35% 30%, var(--brand-100), transparent 65%)',
          }}/>
          <div style={{
            position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)',
            width: 96, height: 96, borderRadius: 28, background:'var(--surface)',
            border:'1px solid var(--border-subtle)',
            boxShadow:'0 10px 30px rgba(99,102,241,0.18)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background:'var(--brand-500)', color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Ic.Plus s={26} c="#fff" sw={2.6}/>
            </div>
          </div>
          {/* floating dots */}
          <div style={{ position:'absolute', top:10, right:20, width:14, height:14, borderRadius:99, background:'var(--streak)'}}/>
          <div style={{ position:'absolute', bottom:20, left:10, width:10, height:10, borderRadius:99, background:'#14b8a6'}}/>
          <div style={{ position:'absolute', bottom:40, right:8, width:8, height:8, borderRadius:99, background:'#8b5cf6'}}/>
        </div>

        <div style={{ fontFamily:'Nunito', fontWeight:800, fontSize:22, color:'var(--text-primary)', letterSpacing:-0.4 }}>
          Build your first habit
        </div>
        <div style={{ fontFamily:'Nunito Sans', fontSize:14, color:'var(--text-secondary)', marginTop:6, maxWidth:260, lineHeight:1.5 }}>
          Pick something small you can do daily. Consistency beats intensity — start with one thing.
        </div>

        <button style={{
          marginTop: 22, height: 46, padding:'0 22px', borderRadius: 14,
          background:'var(--brand-500)', color:'#fff', border:'none',
          fontFamily:'Nunito', fontWeight:800, fontSize:14,
          boxShadow:'0 6px 16px rgba(99,102,241,0.35)',
          cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8,
        }}>
          <Ic.Plus s={16} c="#fff" sw={2.5}/>
          New habit
        </button>

        <div style={{ marginTop:18, fontFamily:'Nunito Sans', fontSize:12, color:'var(--text-tertiary)' }}>
          or <span style={{ color:'var(--brand-600)', fontWeight:700 }}>browse templates</span>
        </div>
      </div>

      <BottomNavE active="home"/>
    </div>
  );
}

// ───────── Shared bottom nav (same as dashboard's) ─────────
function BottomNavE({ active = 'home' }) {
  const items = [
    { id:'home',    label:'Today',    Icon: Ic.Home },
    { id:'habits',  label:'Habits',   Icon: Ic.List },
    { id:'tasks',   label:'Tasks',    Icon: Ic.Calendar },
    { id:'stats',   label:'Stats',    Icon: Ic.Chart },
    { id:'settings',label:'Settings', Icon: Ic.Settings },
  ];
  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0,
      height:80, background:'var(--surface)',
      borderTop:'1px solid var(--border-subtle)',
      display:'flex', alignItems:'flex-start', paddingTop:8, paddingBottom:26,
      zIndex:10,
    }}>
      {items.map(({ id, label, Icon }) => {
        const a = id === active;
        return (
          <button key={id} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            background:'transparent', border:'none', cursor:'pointer',
            color: a ? 'var(--brand-500)' : 'var(--text-tertiary)',
          }}>
            <Icon s={22} c="currentColor" sw={a ? 2.4 : 2} filled={a && id === 'home'}/>
            <span style={{ fontFamily:'Nunito', fontSize:10, fontWeight:a ? 800 : 600 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

window.HabitsList = HabitsList;
window.StatsScreen = StatsScreen;
window.EmptyScreen = EmptyScreen;
