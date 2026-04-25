// Full-screen "New habit / task" creation flow

const { useState: useStateN } = React;

function NewHabitScreen() {
  const [mode, setMode] = useStateN('habit');
  const [measurement, setMeasurement] = useStateN('count');
  const [selectedColor, setColor] = useStateN('#0ea5e9');
  const [selectedIcon, setIconId] = useStateN('droplet');
  const [days, setDays] = useStateN([1,2,3,4,5,6,0]);
  const [title, setTitle] = useStateN('Drink water');
  const [target, setTarget] = useStateN(8);
  const [unit, setUnit] = useStateN('glasses');
  const [reminder, setReminder] = useStateN(true);

  const colors = ['#6366f1','#0ea5e9','#14b8a6','#22c55e','#f59e0b','#f43f5e','#8b5cf6'];
  const icons = [
    { id:'droplet', el: <Ic.Droplet s={18}/> },
    { id:'book',    el: <Ic.Book s={18}/> },
    { id:'leaf',    el: <Ic.Leaf s={18}/> },
    { id:'pill',    el: <Ic.Pill s={18}/> },
    { id:'dumb',    el: <Ic.Dumbbell s={18}/> },
    { id:'sun',     el: <Ic.Sun s={18}/> },
    { id:'moon',    el: <Ic.Moon s={18}/> },
  ];
  const measurements = [
    { id:'checkbox', label:'Check', desc:'Tap to mark done' },
    { id:'count',    label:'Count', desc:'+ / − toward a goal' },
    { id:'duration', label:'Timer', desc:'Start / stop minutes' },
    { id:'numeric',  label:'Number',desc:'Log a value' },
    { id:'rating',   label:'Rating',desc:'1–5 stars' },
  ];
  const dayLabels = ['S','M','T','W','T','F','S'];

  return (
    <div style={{ paddingBottom: 110, background:'var(--bg-app)', minHeight:'100%' }}>
      {/* Top bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 16px 14px',
      }}>
        <button style={iconBtn}>
          <Ic.X s={18} c="var(--text-secondary)"/>
        </button>
        <span style={{ fontFamily:'Nunito', fontWeight:800, fontSize:15, color:'var(--text-primary)' }}>
          New {mode}
        </span>
        <button style={{
          height:34, padding:'0 14px', borderRadius:11,
          background:'var(--brand-500)', color:'#fff', border:'none',
          fontFamily:'Nunito', fontWeight:800, fontSize:13, cursor:'pointer',
          boxShadow:'0 2px 6px rgba(99,102,241,0.3)',
        }}>Save</button>
      </div>

      {/* Segmented habit/task */}
      <div style={{ padding:'0 16px 16px' }}>
        <div style={{
          display:'flex', background:'var(--bg-surface-2)', borderRadius:12, padding:3,
        }}>
          {[
            { id:'habit', label:'Habit', sub:'Recurring' },
            { id:'task',  label:'Task',  sub:'One-off' },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              flex:1, padding:'10px 0', borderRadius:10,
              background: mode === m.id ? 'var(--surface)' : 'transparent',
              border:'none', cursor:'pointer',
              boxShadow: mode === m.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display:'flex', flexDirection:'column', alignItems:'center', gap:1,
            }}>
              <span style={{ fontFamily:'Nunito', fontWeight:800, fontSize:14, color: mode === m.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{m.label}</span>
              <span style={{ fontFamily:'Nunito Sans', fontSize:11, color:'var(--text-tertiary)' }}>{m.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live preview card */}
      <div style={{ padding:'0 16px 18px' }}>
        <div style={{ fontFamily:'Nunito', fontWeight:800, fontSize:11, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:0.4, marginBottom:8 }}>
          Preview
        </div>
        <div style={{
          position:'relative', overflow:'hidden',
          background:'var(--surface)', borderRadius:16,
          border:'1px solid var(--border-subtle)',
          padding:'14px 14px 14px 16px',
          display:'flex', alignItems:'center', gap:14,
          boxShadow:'0 4px 16px rgba(99,102,241,0.08)',
        }}>
          <span style={{ position:'absolute', left:0, top:10, bottom:10, width:3, borderRadius:99, background:selectedColor }}/>
          <div style={{ width:44, height:44, borderRadius:13, background:`${selectedColor}1a`, color:selectedColor, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {icons.find(i => i.id === selectedIcon)?.el}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'Nunito', fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>
              {title || 'New ' + mode}
            </div>
            <div style={{ fontFamily:'Nunito Sans', fontSize:12, color:'var(--text-tertiary)', marginTop:2 }}>
              {measurements.find(m => m.id === measurement)?.desc}
              {measurement === 'count' && target ? ` · 0 / ${target}${unit ? ' ' + unit : ''}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:16 }}>
        <Field label="Title">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Drink water" style={textInput} />
        </Field>

        <Field label="Measurement">
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {measurements.map(m => {
              const on = measurement === m.id;
              return (
                <button key={m.id} onClick={() => setMeasurement(m.id)} style={{
                  textAlign:'left', padding:'11px 14px', borderRadius:12,
                  background: on ? `${selectedColor}12` : 'var(--surface)',
                  border: on ? `1.5px solid ${selectedColor}` : '1px solid var(--border-subtle)',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:12,
                }}>
                  <div style={{
                    width:20, height:20, borderRadius:99,
                    border: on ? `6px solid ${selectedColor}` : '2px solid var(--border-default)',
                    background: on ? '#fff' : 'transparent',
                    flexShrink:0, boxShadow: on ? `inset 0 0 0 2px #fff` : 'none',
                  }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Nunito', fontWeight:800, fontSize:13, color:'var(--text-primary)' }}>{m.label}</div>
                    <div style={{ fontFamily:'Nunito Sans', fontSize:11.5, color:'var(--text-secondary)' }}>{m.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        {(measurement === 'count' || measurement === 'duration' || measurement === 'numeric') && (
          <Field label="Target">
            <div style={{ display:'flex', gap:8 }}>
              <input type="number" value={target} onChange={e => setTarget(+e.target.value)} style={{ ...textInput, width:100 }}/>
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="unit" style={{ ...textInput, flex:1 }}/>
            </div>
          </Field>
        )}

        {mode === 'habit' && (
          <Field label="Repeats on">
            <div style={{ display:'flex', gap:6 }}>
              {dayLabels.map((d, i) => {
                const on = days.includes(i);
                return (
                  <button key={i} onClick={() => setDays(on ? days.filter(x => x!==i) : [...days, i])} style={{
                    flex:1, height:40, borderRadius:11,
                    background: on ? selectedColor : 'var(--surface)',
                    color: on ? '#fff' : 'var(--text-secondary)',
                    border: on ? 'none' : '1px solid var(--border-subtle)',
                    fontFamily:'Nunito', fontWeight:800, fontSize:13, cursor:'pointer',
                  }}>{d}</button>
                );
              })}
            </div>
          </Field>
        )}

        {mode === 'task' && (
          <Field label="Due">
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ ...textInput, flex:1.3, display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <Ic.Calendar s={14} c="var(--text-secondary)"/>
                <span style={{ fontFamily:'Nunito Sans', fontSize:14, color:'var(--text-primary)' }}>Fri, Apr 18</span>
              </div>
              <div style={{ ...textInput, flex:1, display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <Ic.Clock s={14} c="var(--text-secondary)"/>
                <span style={{ fontFamily:'Nunito Sans', fontSize:14, color:'var(--text-primary)' }}>9:00 AM</span>
              </div>
            </div>
          </Field>
        )}

        <Field label="Color">
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {colors.map(c => {
              const on = c === selectedColor;
              return (
                <button key={c} onClick={() => setColor(c)} style={{
                  width:36, height:36, borderRadius:12, background:c, border:'none', cursor:'pointer',
                  position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow: on ? `0 0 0 3px var(--surface), 0 0 0 5px ${c}` : 'none',
                  transition:'box-shadow 150ms',
                }}>
                  {on && <Ic.Check s={14} c="#fff" sw={3.5}/>}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Icon">
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {icons.map(ic => {
              const on = ic.id === selectedIcon;
              return (
                <button key={ic.id} onClick={() => setIconId(ic.id)} style={{
                  width:44, height:44, borderRadius:12,
                  background: on ? `${selectedColor}1a` : 'var(--surface)',
                  border: on ? `1.5px solid ${selectedColor}` : '1px solid var(--border-subtle)',
                  color: on ? selectedColor : 'var(--text-secondary)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer',
                }}>{ic.el}</button>
              );
            })}
          </div>
        </Field>

        {mode === 'habit' && (
          <Field label="Reminder">
            <div style={{
              background:'var(--surface)', border:'1px solid var(--border-subtle)',
              borderRadius:12, padding:'12px 14px',
              display:'flex', alignItems:'center', gap:12,
            }}>
              <Ic.Bell s={16} c={reminder ? selectedColor : 'var(--text-tertiary)'}/>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'Nunito', fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>Remind me at</div>
                <div style={{ fontFamily:'Nunito Sans', fontSize:12, color:'var(--text-tertiary)' }}>
                  {reminder ? '9:00 AM · daily' : 'Off'}
                </div>
              </div>
              <button onClick={() => setReminder(!reminder)} style={{
                width:42, height:24, borderRadius:99,
                background: reminder ? selectedColor : 'var(--border-default)',
                border:'none', position:'relative', cursor:'pointer',
                transition:'background 200ms',
              }}>
                <span style={{
                  position:'absolute', top:2, left: reminder ? 20 : 2,
                  width:20, height:20, borderRadius:99, background:'#fff',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                  transition:'left 200ms cubic-bezier(0.34,1.56,0.64,1)',
                }}/>
              </button>
            </div>
          </Field>
        )}
      </div>

      {/* Big bottom CTA */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        padding:'12px 16px 32px', background:'var(--bg-app)',
        borderTop:'1px solid var(--border-subtle)',
      }}>
        <button style={{
          width:'100%', height:52, borderRadius:16,
          background:'var(--brand-500)', color:'#fff', border:'none',
          fontFamily:'Nunito', fontWeight:800, fontSize:15, cursor:'pointer',
          boxShadow:'0 6px 16px rgba(99,102,241,0.35)',
          display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
          <Ic.Plus s={16} c="#fff" sw={2.6}/>
          Create {mode}
        </button>
      </div>
    </div>
  );
}

const iconBtn = {
  width:36, height:36, borderRadius:11,
  background:'var(--surface)', border:'1px solid var(--border-subtle)',
  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
};

const textInput = {
  width:'100%', height:44, borderRadius:12,
  border:'1px solid var(--border-default)',
  background:'var(--surface)', padding:'0 14px',
  fontSize:14, fontFamily:'Nunito Sans', fontWeight:600,
  color:'var(--text-primary)', outline:'none',
};

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontFamily:'Nunito', fontWeight:800, fontSize:11, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:0.4, marginBottom:8 }}>{label}</div>
      {children}
    </div>
  );
}

window.NewHabitScreen = NewHabitScreen;
