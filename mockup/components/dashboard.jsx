// Dashboard screen — the app's landing page. Renders inside the iOS frame.

const { useState: useStateD, useEffect: useEffectD, useMemo } = React;

// ─── Seed data ────────────────────────────────────────────────────
const COLORS = {
  indigo: '#6366f1',
  green:  '#22c55e',
  sky:    '#0ea5e9',
  amber:  '#f59e0b',
  rose:   '#f43f5e',
  violet: '#8b5cf6',
  teal:   '#14b8a6',
};

const initialHabits = [
  { id: 'h1', title: 'Drink water', icon: <Ic.Droplet s={18}/>, color: COLORS.sky,    tags:[{name:'health',color:COLORS.green}], streak: 12, type:'count',    target: 8, unit:'glasses' },
  { id: 'h2', title: 'Take vitamins',            icon: <Ic.Pill s={18}/>, color: COLORS.amber,  tags:[{name:'health',color:COLORS.green}], streak: 34, type:'checkbox' },
  { id: 'h3', title: 'Meditate',                 icon: <Ic.Leaf s={18}/>, color: COLORS.teal,   tags:[{name:'mind',color:COLORS.violet}],  streak: 7,  type:'duration', target: 15, unit:'min' },
  { id: 'h4', title: 'Read',                     icon: <Ic.Book s={18}/>, color: COLORS.violet, tags:[{name:'mind',color:COLORS.violet}],  streak: 21, type:'count',    target: 20, unit:'pages' },
  { id: 'h5', title: 'Mood check-in',            icon: <Ic.Sun  s={18}/>, color: COLORS.rose,   tags:[],                                   streak: 5,  type:'rating' },
  { id: 'h6', title: 'Workout',                  icon: <Ic.Dumbbell s={18}/>, color: COLORS.indigo, tags:[{name:'fitness',color:COLORS.rose}], streak: 3, type:'checkbox' },
];

const initialEntries = {
  h1: { value: 5 },
  h2: { status: 'done' },
  h3: { value: 8, running: false },
  h4: { value: 0 },
  h5: { value: 0 },
  h6: { status: 'pending' },
};

const initialTasks = [
  { id: 't1', title: 'Submit expense report', dueTime: '17:00', priority: 'high', overdue: false, status: 'pending', color: COLORS.indigo, tags:[{name:'work',color:COLORS.indigo}] },
  { id: 't2', title: 'Call mom',              dueTime: '19:30', priority: 'med',  status:'pending', color: COLORS.rose, tags:[{name:'personal',color:COLORS.rose}] },
  { id: 't3', title: 'Reply to landlord',     priority: 'low', status:'pending', color: COLORS.teal, tags:[] },
];

const overdueTasks = [
  { id: 'o1', title: 'Renew passport',   priority:'high', overdue:true, status:'pending', color: COLORS.rose, tags:[{name:'admin',color:COLORS.amber}] },
];

// ─── Greeting ────────────────────────────────────────────────────
function Greeting({ doneCount, totalCount, currentStreak }) {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  return (
    <div style={{ padding: '8px 20px 4px' }}>
      <div style={{ fontFamily:'Nunito Sans', fontSize: 13, fontWeight: 500, color: 'var(--text-tertiary)', letterSpacing: 0.2 }}>
        {dateStr}
      </div>
      <div style={{
        fontFamily:'Nunito', fontSize: 28, fontWeight: 800,
        color:'var(--text-primary)', letterSpacing: -0.5, marginTop: 2,
      }}>
        {greet}, Sam
      </div>

      {/* Stat strip */}
      <div style={{
        display:'flex', gap: 10, marginTop: 16,
      }}>
        <StatTile
          label="Today"
          value={`${doneCount}/${totalCount}`}
          sub={`${pct}% complete`}
          accent="var(--brand-500)"
          progress={pct}
        />
        <StatTile
          label="Streak"
          value={currentStreak}
          sub="days in a row"
          accent="var(--streak)"
          icon={<Ic.Flame s={14} c="var(--streak)"/>}
        />
      </div>
    </div>
  );
}

function StatTile({ label, value, sub, accent, progress, icon }) {
  return (
    <div style={{
      flex: 1, background: 'var(--surface)', borderRadius: 16,
      border: '1px solid var(--border-subtle)',
      padding: '12px 14px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        fontFamily:'Nunito', fontSize: 11, fontWeight: 700,
        color:'var(--text-tertiary)', letterSpacing: 0.5, textTransform:'uppercase',
      }}>
        <span>{label}</span>{icon}
      </div>
      <div style={{
        fontFamily:'Nunito', fontSize: 26, fontWeight: 800,
        color: accent, marginTop: 2, lineHeight: 1.1,
        letterSpacing: -0.8, fontVariantNumeric:'tabular-nums',
      }}>{value}</div>
      <div style={{ fontFamily:'Nunito Sans', fontSize: 12, color:'var(--text-secondary)' }}>{sub}</div>
      {progress != null && (
        <div style={{
          marginTop: 8, height: 4, borderRadius: 99,
          background: 'var(--bg-surface-2)', overflow:'hidden',
        }}>
          <div style={{ width: `${progress}%`, height:'100%', background: accent, transition:'width 350ms cubic-bezier(0.16,1,0.3,1)' }} />
        </div>
      )}
    </div>
  );
}

// ─── Collapsible Overdue section ─────────────────────────────────
function OverdueSection({ tasks, onToggle }) {
  const [open, setOpen] = useStateD(true);
  if (!tasks.length) return null;
  return (
    <div style={{ margin: '14px 16px 0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width:'100%', display:'flex', alignItems:'center', gap: 8,
          background:'var(--overdue-bg)', border: '1px solid var(--overdue)22',
          borderRadius: 14, padding: '10px 14px', cursor:'pointer',
        }}
      >
        <Ic.AlertCircle s={16} c="var(--overdue)" />
        <span style={{ fontFamily:'Nunito', fontWeight: 800, fontSize: 13, color:'var(--overdue)', flex: 1, textAlign:'left' }}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} need{tasks.length === 1 ? 's' : ''} attention
        </span>
        <span style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms', display:'flex' }}>
          <Ic.ChevDown s={14} c="var(--overdue)" />
        </span>
      </button>
      {open && (
        <div style={{ display:'flex', flexDirection:'column', gap: 8, marginTop: 8 }}>
          {tasks.map(t => <Cards.TaskCard key={t.id} task={t} onToggle={() => onToggle(t.id)} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────
function Dashboard() {
  const [habits] = useStateD(initialHabits);
  const [entries, setEntries] = useStateD(initialEntries);
  const [tasks, setTasks] = useStateD(initialTasks);
  const [overdue, setOverdue] = useStateD(overdueTasks);
  const [sheetOpen, setSheetOpen] = useStateD(false);

  // Duration timer tick
  useEffectD(() => {
    const id = setInterval(() => {
      setEntries(prev => {
        const next = { ...prev };
        habits.forEach(h => {
          if (h.type === 'duration' && next[h.id]?.running) {
            next[h.id] = { ...next[h.id], value: (next[h.id].value || 0) + (1/60) };
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [habits]);

  const updateEntry = (hid, patch) =>
    setEntries(e => ({ ...e, [hid]: { ...e[hid], ...patch } }));

  const toggleTask = (id) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t));
    setOverdue(ts => ts.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t));
  };

  // Completion counts
  const doneCount = useMemo(() => {
    let n = 0;
    habits.forEach(h => {
      const e = entries[h.id];
      const done = e?.status === 'done'
        || (h.type === 'count' && h.target && (e?.value || 0) >= h.target)
        || (h.type === 'duration' && h.target && (e?.value || 0) >= h.target)
        || (h.type === 'rating' && (e?.value || 0) > 0)
        || (h.type === 'numeric' && (e?.value || 0) > 0);
      if (done) n++;
    });
    tasks.forEach(t => { if (t.status === 'done') n++; });
    return n;
  }, [habits, entries, tasks]);

  const totalCount = habits.length + tasks.length;

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Top bar — compact header with search + bell */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding: '6px 20px 0',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 99,
          background: 'linear-gradient(135deg, var(--brand-500), #8b5cf6)',
          color: '#fff', display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'Nunito', fontWeight: 800, fontSize: 14,
        }}>S</div>
        <div style={{ display:'flex', gap: 8 }}>
          <IconBtn><Ic.Search s={18} c="var(--text-secondary)" /></IconBtn>
          <IconBtn dot><Ic.Bell s={18} c="var(--text-secondary)" /></IconBtn>
        </div>
      </div>

      <Greeting doneCount={doneCount} totalCount={totalCount} currentStreak={34} />

      <OverdueSection tasks={overdue} onToggle={toggleTask} />

      <div style={{ padding: '0 16px' }}>
        <Cards.SectionHeader label="Today's habits" count={habits.length} />
        <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
          {habits.map(h => (
            <Cards.HabitCard
              key={h.id}
              habit={h}
              entry={entries[h.id]}
              onUpdate={patch => updateEntry(h.id, patch)}
            />
          ))}
        </div>

        <Cards.SectionHeader label="Today's tasks" count={tasks.length} />
        <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
          {tasks.map(t => <Cards.TaskCard key={t.id} task={t} onToggle={() => toggleTask(t.id)} />)}
        </div>

        <Cards.SectionHeader label="Upcoming" count={3} dim
          right={<span style={{ fontFamily:'Nunito', fontSize: 12, fontWeight: 700, color:'var(--brand-600)' }}>Next 7 days</span>}
        />
        <UpcomingRow date="Tomorrow" items={['Dentist appt', 'Gym with Alex']} />
        <UpcomingRow date="Wed, Apr 22" items={['Submit Q2 report']} />
        <UpcomingRow date="Fri, Apr 24" items={['Grocery run']} />
      </div>

      {/* FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        style={{
          position:'absolute', bottom: 96, right: 18,
          width: 58, height: 58, borderRadius: 20,
          background: 'var(--brand-500)', color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          border: 'none', cursor:'pointer',
          boxShadow: '0 6px 16px rgba(99,102,241,0.45), 0 2px 4px rgba(99,102,241,0.3)',
          zIndex: 20,
        }}
        aria-label="Add habit or task"
      >
        <Ic.Plus s={24} c="#fff" sw={2.5} />
      </button>

      {/* Bottom sheet */}
      {sheetOpen && <CreateSheet onClose={() => setSheetOpen(false)} />}

      {/* Bottom nav */}
      <BottomNav active="home" />
    </div>
  );
}

function UpcomingRow({ date, items }) {
  return (
    <div style={{
      display:'flex', gap: 12, padding: '10px 4px 10px 4px',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        minWidth: 92,
        fontFamily:'Nunito', fontWeight: 700, fontSize: 13,
        color:'var(--text-secondary)',
      }}>{date}</div>
      <div style={{ flex: 1, display:'flex', flexDirection:'column', gap: 4 }}>
        {items.map((it, i) => (
          <div key={i} style={{ fontFamily:'Nunito Sans', fontSize: 14, color:'var(--text-primary)' }}>{it}</div>
        ))}
      </div>
    </div>
  );
}

function IconBtn({ children, dot }) {
  return (
    <button style={{
      width: 38, height: 38, borderRadius: 12,
      background: 'var(--surface)', border: '1px solid var(--border-subtle)',
      display:'flex', alignItems:'center', justifyContent:'center',
      cursor:'pointer', position:'relative',
    }}>
      {children}
      {dot && <span style={{
        position:'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 99,
        background:'var(--overdue)', border: '2px solid var(--surface)',
      }}/>}
    </button>
  );
}

// ─── Bottom nav ──────────────────────────────────────────────────
function BottomNav({ active = 'home' }) {
  const items = [
    { id:'home',    label:'Today',    Icon: Ic.Home },
    { id:'habits',  label:'Habits',   Icon: Ic.List },
    { id:'tasks',   label:'Tasks',    Icon: Ic.Calendar },
    { id:'stats',   label:'Stats',    Icon: Ic.Chart },
    { id:'settings',label:'Settings', Icon: Ic.Settings },
  ];
  return (
    <div style={{
      position:'absolute', bottom: 0, left: 0, right: 0,
      height: 80, background: 'var(--surface)',
      borderTop: '1px solid var(--border-subtle)',
      display:'flex', alignItems:'flex-start',
      paddingTop: 8, paddingBottom: 26,
      zIndex: 10,
    }}>
      {items.map(({ id, label, Icon }) => {
        const a = id === active;
        return (
          <button key={id} style={{
            flex: 1, display:'flex', flexDirection:'column', alignItems:'center', gap: 2,
            background:'transparent', border:'none', cursor:'pointer',
            color: a ? 'var(--brand-500)' : 'var(--text-tertiary)',
          }}>
            <Icon s={22} c="currentColor" sw={a ? 2.4 : 2} filled={a && id === 'home'} />
            <span style={{
              fontFamily:'Nunito', fontSize: 10, fontWeight: a ? 800 : 600,
              letterSpacing: 0.2,
            }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Create bottom sheet (simple) ────────────────────────────────
function CreateSheet({ onClose }) {
  const [mode, setMode] = useStateD('habit');
  const [measurement, setMeasurement] = useStateD('checkbox');
  return (
    <>
      <div onClick={onClose} style={{
        position:'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(2px)', zIndex: 30,
        animation: 'fadeIn 160ms ease-out',
      }}/>
      <div style={{
        position:'absolute', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: '10px 18px 32px', zIndex: 40,
        animation: 'slideUp 240ms cubic-bezier(0.16,1,0.3,1)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
        maxHeight: '80%', overflowY:'auto',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 99, background:'var(--border-default)', margin:'0 auto 14px' }}/>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily:'Nunito', fontWeight: 800, fontSize: 20, color:'var(--text-primary)' }}>New {mode}</div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 10, background:'var(--bg-surface-2)',
            border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          }}><Ic.X s={15} c="var(--text-secondary)"/></button>
        </div>

        {/* Segmented Habit / Task */}
        <div style={{
          display:'flex', background:'var(--bg-surface-2)', borderRadius: 12,
          padding: 3, marginBottom: 16,
        }}>
          {['habit','task'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '9px 0', borderRadius: 9,
              background: mode === m ? 'var(--surface)' : 'transparent',
              border: 'none', cursor:'pointer',
              fontFamily:'Nunito', fontWeight: 700, fontSize: 13,
              color: mode === m ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: mode === m ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              textTransform:'capitalize',
            }}>{m}</button>
          ))}
        </div>

        <FormField label="Title">
          <input placeholder={mode === 'habit' ? 'e.g. Drink water' : 'e.g. Submit report'} style={inputStyle} />
        </FormField>

        <FormField label="Measurement">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 8 }}>
            {[
              { id:'checkbox', label:'Checkbox' },
              { id:'count',    label:'Count' },
              { id:'duration', label:'Timer' },
              { id:'numeric',  label:'Number' },
              { id:'rating',   label:'Rating' },
            ].map(o => (
              <button key={o.id} onClick={() => setMeasurement(o.id)} style={{
                padding:'9px 10px', borderRadius: 10,
                background: measurement === o.id ? 'var(--brand-500)15' : 'var(--bg-surface-2)',
                border: measurement === o.id ? '1.5px solid var(--brand-500)' : '1.5px solid transparent',
                cursor:'pointer',
                fontFamily:'Nunito', fontSize: 12, fontWeight: 700,
                color: measurement === o.id ? 'var(--brand-600)' : 'var(--text-secondary)',
              }}>{o.label}</button>
            ))}
          </div>
        </FormField>

        {mode === 'habit' && (
          <FormField label="Repeats">
            <div style={{ display:'flex', gap: 6 }}>
              {['S','M','T','W','T','F','S'].map((d, i) => {
                const on = i >= 1 && i <= 5;
                return (
                  <button key={i} style={{
                    flex: 1, height: 38, borderRadius: 10,
                    background: on ? 'var(--brand-500)' : 'var(--bg-surface-2)',
                    color: on ? '#fff' : 'var(--text-secondary)',
                    border:'none', cursor:'pointer',
                    fontFamily:'Nunito', fontWeight: 800, fontSize: 13,
                  }}>{d}</button>
                );
              })}
            </div>
          </FormField>
        )}

        {mode === 'task' && (
          <FormField label="Due date">
            <div style={{ display:'flex', gap: 8 }}>
              <input type="date" style={{ ...inputStyle, flex: 1 }} defaultValue="2026-04-18" />
              <input type="time" style={{ ...inputStyle, width: 110 }} defaultValue="09:00" />
            </div>
          </FormField>
        )}

        <FormField label="Color">
          <div style={{ display:'flex', gap: 10, flexWrap:'wrap' }}>
            {Object.entries(COLORS).map(([k, v]) => (
              <button key={k} style={{
                width: 32, height: 32, borderRadius: 10, background: v,
                border: k === 'indigo' ? '3px solid var(--surface)' : '3px solid transparent',
                outline: k === 'indigo' ? `2px solid ${v}` : 'none',
                cursor:'pointer',
              }}/>
            ))}
          </div>
        </FormField>

        <button style={{
          width:'100%', height: 48, borderRadius: 14, marginTop: 8,
          background:'var(--brand-500)', color:'#fff', border:'none',
          fontFamily:'Nunito', fontWeight: 800, fontSize: 15, cursor:'pointer',
          boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
        }}>
          Create {mode}
        </button>
      </div>
    </>
  );
}

const inputStyle = {
  width:'100%', height: 44, borderRadius: 12,
  border: '1px solid var(--border-default)',
  background:'var(--surface)',
  padding:'0 14px', fontSize: 15, fontFamily:'Nunito Sans',
  color:'var(--text-primary)', outline:'none',
};
function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily:'Nunito', fontWeight: 700, fontSize: 12, color:'var(--text-secondary)', marginBottom: 6, textTransform:'uppercase', letterSpacing: 0.3 }}>{label}</div>
      {children}
    </div>
  );
}

window.Dashboard = Dashboard;
