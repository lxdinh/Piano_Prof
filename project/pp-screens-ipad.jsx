// Piano Professor — iPad landscape variants (sidebar + content)

function IpadSidebar({ active = "learn" }) {
  const items = [
    { id:"learn", label:"Learn",      icon:<TrebleClef size={22}/>},
    { id:"songs", label:"Songbook",   icon:<NoteIcon size={22}/>},
    { id:"quest", label:"Warm-up",    icon:<FlameIcon size={22}/>},
    { id:"led",   label:"Piano Lights", icon:<BluetoothIcon size={22} color="var(--ink-700)"/>},
    { id:"me",    label:"Profile",    icon:<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="9" r="4" fill="var(--ink-700)"/><path d="M3 22 q9 -10 18 0" fill="var(--ink-700)"/></svg>},
  ];
  return (
    <div style={{
      width:236, padding:'18px 12px',
      background:'#FFFAEC',
      borderRight:'1.5px solid var(--ink-line)',
      display:'flex', flexDirection:'column', gap:4,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 8px 14px' }}>
        <CatAvatar size={36} ring={false}/>
        <div>
          <div style={{ fontSize:9, fontWeight:900, color:'var(--ink-500)', letterSpacing:'0.16em' }}>
            PIANO · PROFESSOR
          </div>
          <div style={{ fontSize:14, fontWeight:900, color:'var(--ink-900)' }}>maya_keys</div>
        </div>
      </div>

      {items.map(it => {
        const on = it.id === active;
        return (
          <div key={it.id} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'12px 14px', borderRadius:12,
            background: on ? 'var(--brand-soft)' : 'transparent',
            color: on ? 'var(--brand-deep)' : 'var(--ink-700)',
            fontWeight:900, fontSize:14,
            border: on ? '1.5px solid var(--brand)' : '1.5px solid transparent',
          }}>
            {it.icon}{it.label}
          </div>
        );
      })}

      <div style={{ flex:1 }}/>

      {/* mini progress card */}
      <div style={{
        background:'linear-gradient(160deg, var(--brand) 0%, var(--brand-deep) 100%)',
        color:'#fff', borderRadius:16, padding:'14px',
        boxShadow:'0 5px 0 var(--brand-deep)',
      }}>
        <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.14em', opacity:0.85 }}>YOUR JOURNEY</div>
        <div style={{ fontSize:22, fontWeight:900, marginTop:2 }}>Grade 4 / 12</div>
        <div style={{ height:8, background:'rgba(0,0,0,0.18)', borderRadius:4, marginTop:8, overflow:'hidden' }}>
          <div style={{ width:'33%', height:'100%', background:'#FFFAEC' }}/>
        </div>
        <div style={{ fontSize:11, fontWeight:800, marginTop:6, opacity:0.9 }}>
          3,240 XP earned
        </div>
      </div>
    </div>
  );
}

function IpadLandscapePath({ width = 1180, height = 820 }) {
  const sections = [];
  PP_LESSONS.forEach(l => {
    let s = sections.find(s => s.name === l.section);
    if (!s) { s = { name: l.section, lessons: [] }; sections.push(s); }
    s.lessons.push(l);
  });

  return (
    <div className="pp-art pp-paper" style={{
      width, height, display:'flex', overflow:'hidden',
    }}>
      <IpadSidebar active="learn"/>

      {/* main area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* top bar */}
        <div style={{
          padding:'18px 28px', display:'flex',
          alignItems:'center', justifyContent:'space-between',
          background:'rgba(255,250,236,0.7)', backdropFilter:'blur(10px)',
          borderBottom:'1.5px solid var(--ink-line)',
        }}>
          <div>
            <div style={{ fontSize:11, fontWeight:900, color:'var(--rust)', letterSpacing:'0.18em' }}>
              SECTION 1 · FOUNDATIONS
            </div>
            <h1 style={{ fontSize:26, marginTop:2 }}>Welcome back, Maya 👋</h1>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <StatPill icon={<FlameIcon size={18}/>} value="12 day streak" color="#FF7A1C"/>
            <StatPill icon={<GemIcon size={18}/>}   value="142"/>
            <StatPill icon={<HeartIcon size={18}/>} value="4/5" color="#FF4B4B"/>
          </div>
        </div>

        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          {/* center: staff path */}
          <div style={{ flex:1, padding:'18px 28px 28px', overflowY:'auto' }}>
            {sections.map((s, sIdx) => (
              <div key={s.name} style={{ marginBottom:14 }}>
                <StaffRowWide rowIndex={sIdx} sectionLabel={s.name} lessons={s.lessons}
                  currentI={3} mascotI={3}/>
              </div>
            ))}
          </div>

          {/* right rail: today panel */}
          <div style={{
            width:300, padding:'18px 22px 22px',
            background:'rgba(255,250,236,0.5)',
            borderLeft:'1.5px solid var(--ink-line)',
            overflowY:'auto',
          }}>
            <div style={{
              background:'linear-gradient(160deg,#FFE6BA,#FFFAEC)',
              border:'1.5px solid var(--butter-d)',
              borderRadius:18, padding:'14px',
              boxShadow:'0 4px 0 var(--butter-d)',
            }}>
              <div style={{ fontSize:11, fontWeight:900, color:'var(--rust)', letterSpacing:'0.16em' }}>
                UP NEXT
              </div>
              <div style={{ fontSize:20, fontWeight:900, marginTop:4 }}>Lesson 3: Half &amp; Whole</div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--ink-500)', marginTop:4, lineHeight:1.4 }}>
                Learn the DNA of music — two distances every melody is built from.
              </div>
              <div style={{ display:'flex', gap:6, marginTop:10 }}>
                <div className="chip">⏱ 5 min</div>
                <div className="chip">⭐ +50 XP</div>
              </div>
              <button className="btn-chunk" style={{ width:'100%', marginTop:12 }}>
                <PlayIcon size={14}/>START LESSON
              </button>
            </div>

            <div style={{ marginTop:14, fontSize:11, fontWeight:900, color:'var(--ink-500)',
              letterSpacing:'0.14em', textTransform:'uppercase' }}>TODAY</div>

            {[
              { t:"Daily warm-up", sub:"7/10 min", c:"var(--brand)", icon:<NoteIcon size={20} color="#fff"/> },
              { t:"3 perfect lessons", sub:"2/3", c:"var(--sky)", icon:<TrebleClef size={20} color="#fff"/> },
              { t:"Beat 80 BPM", sub:"not started", c:"var(--plum)", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2"/><path d="M12 6V12L16 14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/></svg> },
            ].map((q,i) => (
              <div key={i} style={{
                display:'flex', gap:10, alignItems:'center',
                background:'#FFFAEC', border:'1.5px solid var(--ink-line)',
                borderRadius:14, padding:'10px 12px', marginTop:8,
              }}>
                <div style={{
                  width:38, height:38, borderRadius:10,
                  background: q.c, display:'flex', alignItems:'center', justifyContent:'center',
                }}>{q.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:900 }}>{q.t}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-500)' }}>{q.sub}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop:18, fontSize:11, fontWeight:900, color:'var(--ink-500)',
              letterSpacing:'0.14em', textTransform:'uppercase' }}>PIANO LIGHTS</div>
            <div style={{
              background:'var(--ink-900)', color:'#fff', borderRadius:14,
              padding:'12px 14px', marginTop:8,
              display:'flex', alignItems:'center', gap:10,
            }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#58CC02',
                boxShadow:'0 0 10px #58CC02' }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:900 }}>Connected · 60 LEDs</div>
                <div style={{ fontSize:10, fontWeight:700, opacity:0.7 }}>Piano-Prof-A8F2</div>
              </div>
              <BluetoothIcon size={18} color="rgba(255,255,255,0.7)"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wider version of StaffRow for iPad
function StaffRowWide({ rowIndex, sectionLabel, lessons, currentI, mascotI }) {
  const W = 670;
  const H = 152;
  const TOP = 44;
  const GAP = 14;
  const noteY = (deg) => TOP + (8 - deg) * (GAP/2);
  const pitches = [2, 5, 3, 7, 4, 6];

  return (
    <div style={{ position:'relative', height: H, marginBottom: 8, width: W }}>
      {sectionLabel && (
        <div style={{
          position:'absolute', top:0, left:0, right:0,
          display:'flex', alignItems:'center', gap:10,
          height:30,
        }}>
          <div style={{
            width:36, fontSize:14, fontWeight:900, color:'var(--rust)',
            textAlign:'center', letterSpacing:'0.05em', lineHeight:1,
          }}>4<br/>4</div>
          <div style={{ flex:1, height:2, background:'var(--ink-300)' }}/>
          <div style={{
            fontSize:12, fontWeight:900, color:'var(--rust)',
            background:'#FFE6BA', padding:'4px 14px', borderRadius:999,
            letterSpacing:'0.14em', textTransform:'uppercase',
          }}>{sectionLabel}</div>
          <div style={{ flex:1, height:2, background:'var(--ink-300)' }}/>
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}
           style={{ position:'absolute', top:0, left:0 }}>
        {[0,1,2,3,4].map(i => (
          <line key={i}
            x1={rowIndex === 0 ? 56 : 12} x2={W - 12}
            y1={TOP + i*GAP} y2={TOP + i*GAP}
            stroke="var(--staff)" strokeWidth="1.4" opacity="0.6"/>
        ))}
        {rowIndex === 0 && (
          <g transform={`translate(12,${TOP - 18})`} fill="none" stroke="var(--staff)" strokeWidth="2">
            <path d="M16 4c-3 4-6 8-6 14 0 5 2 8 5 11 -4 3 -7 7 -7 14 0 8 5 14 13 14 6 0 11-4 11-11 0-4 -2-7 -6-9 -5-2 -9-6 -9-13 0-4 1-7 4-9 3-2 5 0 5 3 0 3 -2 5 -4 5"/>
            <circle cx="15" cy="40" r="3.5" fill="var(--staff)"/>
          </g>
        )}
        {[0.33, 0.66].map(p => (
          <line key={p} x1={W*p} y1={TOP-2} x2={W*p} y2={TOP + 4*GAP + 2}
                stroke="var(--staff)" strokeWidth="1.3" opacity="0.5"/>
        ))}
        <line x1={W-7} y1={TOP-2} x2={W-7} y2={TOP + 4*GAP + 2}
              stroke="var(--staff)" strokeWidth="1.3" opacity="0.5"/>
        <line x1={W-3} y1={TOP-2} x2={W-3} y2={TOP + 4*GAP + 2}
              stroke="var(--staff)" strokeWidth="2" opacity="0.7"/>
      </svg>

      {lessons.map((l, idx) => {
        const xStart = rowIndex === 0 ? 90 : 36;
        const xSpan = W - xStart - 24;
        const x = xStart + (idx + 0.5) * (xSpan / lessons.length);
        const y = noteY(pitches[idx % pitches.length]);
        const done = l.i < currentI;
        const cur = l.i === currentI;
        const lock = l.i > currentI;
        const fill = done ? 'var(--brand)' : cur ? 'var(--butter)' : '#FFFAEC';
        const stroke = done ? 'var(--brand-deep)' : cur ? 'var(--butter-d)' : 'var(--ink-300)';
        return (
          <div key={l.i} style={{
            position:'absolute', left:x-26, top:y-26, width:52, height:52,
          }}>
            <svg viewBox="0 0 52 52" width="52" height="52" style={{ overflow:'visible' }}>
              <ellipse cx="26" cy="26" rx="21" ry="16" transform="rotate(-18 26 26)"
                fill={fill} stroke={stroke} strokeWidth="3"
                style={{ filter: cur ? 'drop-shadow(0 0 14px rgba(245,184,0,0.55))' : 'none' }}/>
              {!lock && (
                <rect x="42" y="-14" width="3.4" height="40" fill={stroke} transform="rotate(-18 26 26)"/>
              )}
              {done && (
                <path d="M16 26 L23 33 L36 19" stroke="#fff" strokeWidth="3.4"
                  fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              )}
              {lock && (
                <g transform="translate(18,16)">
                  <rect x="2" y="6" width="12" height="11" rx="1.5" fill="var(--ink-300)"/>
                  <path d="M4 6 V4 a3 3 0 0 1 8 0 V6" stroke="var(--ink-300)" strokeWidth="1.6" fill="none"/>
                </g>
              )}
              {cur && (
                <text x="26" y="32" textAnchor="middle" fontSize="16" fontWeight="900" fill="#fff"
                  style={{ fontFamily:"Nunito, system-ui, sans-serif" }}>{l.i}</text>
              )}
            </svg>
            <div style={{
              position:'absolute', top:54, left:'50%', transform:'translateX(-50%)',
              fontSize:11, fontWeight:900, whiteSpace:'nowrap',
              color: cur ? 'var(--ink-900)' : 'var(--ink-500)',
              textTransform:'uppercase', letterSpacing:'0.04em',
            }}>{l.name}</div>
            {l.i === mascotI && (
              <div style={{
                position:'absolute', top:-50, left:'50%', transform:'translateX(-50%)',
                textAlign:'center',
              }}>
                <div style={{
                  background:'var(--ink-900)', color:'#fff',
                  fontSize:10, fontWeight:900, letterSpacing:'0.1em',
                  padding:'3px 8px', borderRadius:6, marginBottom:2,
                  whiteSpace:'nowrap',
                }}>START</div>
                <CatChip size={42}/>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function IpadLandscapeLesson({ width = 1180, height = 820 }) {
  return (
    <div className="pp-art pp-paper" style={{
      width, height, display:'flex', overflow:'hidden',
    }}>
      <IpadSidebar active="learn"/>

      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        {/* progress bar */}
        <div style={{
          padding:'18px 32px', display:'flex', alignItems:'center', gap:18,
          borderBottom:'1.5px solid var(--ink-line)',
          background:'rgba(255,250,236,0.7)',
        }}>
          <div style={{
            width:36, height:36, borderRadius:'50%',
            background:'#FFFAEC', border:'1.5px solid var(--ink-line)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, fontWeight:900, color:'var(--ink-500)',
          }}>×</div>
          <div style={{ fontSize:13, fontWeight:900, color:'var(--ink-500)' }}>L3 · HALF &amp; WHOLE</div>
          <div style={{
            flex:1, height:14, borderRadius:7, background:'#F0E4C9',
            boxShadow:'inset 0 2px 0 rgba(42,29,17,0.08)', overflow:'hidden',
          }}>
            <div style={{
              width:'55%', height:'100%',
              background:'linear-gradient(180deg,var(--brand) 0%, var(--brand-dark) 100%)',
              boxShadow:'inset 0 -3px 0 var(--brand-deep), inset 0 3px 0 rgba(255,255,255,0.35)',
              borderRadius:7,
            }}/>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <StatPill icon={<HeartIcon size={16}/>} value="4" color="#FF4B4B"/>
            <StatPill icon={<FlameIcon size={16}/>} value="12" color="#FF7A1C"/>
          </div>
        </div>

        {/* main split: teacher panel + piano */}
        <div style={{ flex:1, padding:'24px 36px 18px', display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
            <div style={{
              width:200, height:200, borderRadius:'50%',
              background:'linear-gradient(180deg,#FFE6BA,#FFFAEC)',
              boxShadow:'0 0 0 5px var(--brand), 0 0 0 10px #FFFAEC, 0 0 40px rgba(88,204,2,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
              flexShrink:0,
            }}>
              <MoodCycler
                size={200}
                variant="hero"
                moods={['conduct','idea','cheer','teach','wow']}
                interval={3000}
              />
            </div>

            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:900, color:'var(--rust)', letterSpacing:'0.18em' }}>
                STEP 6 of 11 · MAESTRO PENGUINI
              </div>
              <h1 style={{ fontSize:32, marginTop:6, lineHeight:1.15 }}>
                Play <span style={{ color:'var(--brand)' }}>C – E – G</span> in order on beat <span style={{ color:'var(--rust)' }}>1</span>.
              </h1>
              <p style={{ fontSize:15, fontWeight:700, color:'var(--ink-500)', marginTop:8, lineHeight:1.5, maxWidth:540 }}>
                Thumb on C, middle on E, pinky on G. Skip a finger each time —
                that's the C-major chord shape every pop song is built from.
              </p>

              {/* beat meter big */}
              <div style={{ display:'flex', gap:10, marginTop:14, alignItems:'center' }}>
                <div style={{ fontSize:12, fontWeight:900, color:'var(--ink-500)',
                  letterSpacing:'0.12em' }}>BEAT</div>
                {[1,2,3,4].map(b => (
                  <div key={b} style={{
                    width:46, height:46, borderRadius:12,
                    background: b === 2 ? 'var(--brand)' : '#F0E4C9',
                    color: b === 2 ? '#fff' : 'var(--ink-300)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:22, fontWeight:900,
                    boxShadow: b === 2 ? '0 4px 0 var(--brand-deep)' : 'inset 0 -2px 0 rgba(42,29,17,0.08)',
                  }}>{b}</div>
                ))}
                <div style={{ marginLeft:14, fontSize:13, fontWeight:900, color:'var(--ink-500)' }}>
                  ♩ = 80 BPM
                </div>
                <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%',
                    background:'#00C853', boxShadow:'0 0 10px #00C853' }}/>
                  <span style={{ fontSize:12, fontWeight:900, color:'var(--ink-500)' }}>
                    PIANO LIGHTS · CONNECTED
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex:1 }}/>

          {/* Big keyboard at bottom */}
          <div style={{ marginTop:18, display:'flex', flexDirection:'column', gap:10 }}>
            <BigPiano width={870} height={200} lit={{ C:'green' }} fingerHints={{ C:1, E:3, G:5 }}/>
            <Mini88Keyboard width={870} litPCs={['C','E','G']} focusOctave={4}/>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              <button className="btn-chunk ghost" style={{ padding:'12px 22px' }}>HINT</button>
              <button className="btn-chunk lg" style={{ padding:'14px 36px' }}>I PLAYED IT</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { IpadLandscapePath, IpadLandscapeLesson });
