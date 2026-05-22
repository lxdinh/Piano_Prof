// Piano Professor — Profile, Daily Quest, Songs library

// ───────────────────────────────────────────────────────────────
// PROFILE / STREAK / STATS
// ───────────────────────────────────────────────────────────────
function ScreenProfile({ width = 390, height = 720, streak = 12, hearts = 4, gems = 142, xp = 3240 }) {
  return (
    <div className="pp-art pp-paper" style={{ width, height, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Profile hero band */}
      <div style={{
        background:'linear-gradient(160deg, var(--brand) 0%, var(--brand-deep) 100%)',
        padding:'20px 22px 24px',
        color:'#fff',
        position:'relative', overflow:'hidden',
      }}>
        {/* deco notes */}
        <svg viewBox="0 0 390 200" width="100%" height="200"
             style={{ position:'absolute', top:-10, left:0, opacity:0.18, pointerEvents:'none' }}>
          <NoteSpray/>
        </svg>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative' }}>
          <div style={{ fontSize:11, fontWeight:900, letterSpacing:'0.18em', opacity:0.9 }}>PROFILE</div>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
            <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
          </svg>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:14, position:'relative' }}>
          <CatAvatar size={78} mood="love" ring={false}/>
          <div>
            <div style={{ fontSize:22, fontWeight:900, lineHeight:1.1 }}>maya_keys</div>
            <div style={{ fontSize:13, fontWeight:700, opacity:0.85, marginTop:2 }}>
              Joined March 2026 · 🇯🇵
            </div>
            <div style={{
              marginTop:6, display:'inline-block',
              background:'rgba(255,255,255,0.18)',
              padding:'3px 10px', borderRadius:999,
              fontSize:11, fontWeight:900, letterSpacing:'0.08em',
            }}>★ GRADE 4 · MAJOR SCALES</div>
          </div>
        </div>

        {/* stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginTop:18, position:'relative' }}>
          <ProfileStat icon={<FlameIcon size={16}/>} val={streak} lbl="DAY STREAK"/>
          <ProfileStat icon={<GemIcon size={16}/>}    val={gems}   lbl="GEMS"/>
          <ProfileStat icon={<StarIcon size={14} color="#FFF"/>} val={xp} lbl="TOTAL XP"/>
          <ProfileStat icon={<HeartIcon size={14}/>} val={`${hearts}/5`} lbl="HEARTS"/>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px 70px' }}>
        {/* streak calendar (8 days) */}
        <SectionTitle title="Streak this week" right="View full"/>
        <div style={{
          display:'flex', justifyContent:'space-between',
          background:'#FFFAEC', borderRadius:18, padding:'14px 12px',
          border:'1.5px solid var(--ink-line)',
        }}>
          {['M','T','W','T','F','S','S'].map((d,i)=>{
            const done = i < 5;
            const today = i === 5;
            return (
              <div key={i} style={{ textAlign:'center', flex:1 }}>
                <div style={{ fontSize:10, fontWeight:900, color:'var(--ink-500)', marginBottom:6 }}>{d}</div>
                <div style={{
                  width:32, height:32, borderRadius:'50%',
                  background: done ? 'var(--rust)' : today ? '#FFE6BA' : '#F0E4C9',
                  border: today ? '2.5px dashed var(--rust)' : 'none',
                  display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto',
                }}>
                  {done && <FlameIcon size={16}/>}
                  {today && <FlameIcon size={14} on={false}/>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Achievements */}
        <SectionTitle title="Achievements" right="3 of 24"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          <Achievement title="First Note" sub="LEVEL 5" color="var(--brand)" icon={<NoteIcon size={28} color="#fff"/>} prog={1}/>
          <Achievement title="Hot Streak" sub="LEVEL 2" color="var(--rust)" icon={<FlameIcon size={28}/>} prog={0.65}/>
          <Achievement title="Sharp Ears" sub="LEVEL 1" color="var(--sky)"  icon={<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 12 Q12 4 20 12" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round"/><path d="M7 12 Q12 8 17 12" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round"/></svg>} prog={0.4}/>
          <Achievement title="Stage Star" sub="LOCKED" color="var(--ink-300)" icon={<LockIcon size={26} color="#fff"/>} prog={0} locked/>
          <Achievement title="Chord Boss" sub="LOCKED" color="var(--ink-300)" icon={<LockIcon size={26} color="#fff"/>} prog={0} locked/>
          <Achievement title="Composer"   sub="LOCKED" color="var(--ink-300)" icon={<LockIcon size={26} color="#fff"/>} prog={0} locked/>
        </div>

        {/* favourites */}
        <SectionTitle title="On repeat" right="See all"/>
        <div style={{
          background:'#FFFAEC', borderRadius:18, padding:'4px 0',
          border:'1.5px solid var(--ink-line)', overflow:'hidden',
        }}>
          {[
            { title:"Let It Be", sub:"The Beatles · 4 chords",   diff:"easy"},
            { title:"River Flows In You", sub:"Yiruma · 8 chords", diff:"med"},
            { title:"Despacito", sub:"Axis progression", diff:"easy"},
          ].map((s,i)=>(
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'10px 14px',
              borderTop: i ? '1px solid var(--ink-line)' : 'none',
            }}>
              <MiniPiano width={56} height={22} lit={i%3}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:900 }}>{s.title}</div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-500)' }}>{s.sub}</div>
              </div>
              <div style={{
                fontSize:10, fontWeight:900,
                color: s.diff==='easy' ? 'var(--brand)' : 'var(--butter-d)',
                background: s.diff==='easy' ? 'var(--brand-soft)' : '#FFE6BA',
                padding:'3px 8px', borderRadius:6,
                letterSpacing:'0.1em', textTransform:'uppercase',
              }}>{s.diff}</div>
            </div>
          ))}
        </div>
      </div>

      <PPTabBar active="me"/>
    </div>
  );
}

function NoteSpray() {
  return (
    <g fill="#fff">
      <path d="M40 30 q4 -2 6 2 v-16 l8 -2 v-5 l-8 2 v16 q-6 -1 -6 3z"/>
      <path d="M120 80 q4 -2 6 2 v-14 l8 -2 v-5 l-8 2 v14 q-6 -1 -6 3z"/>
      <path d="M200 40 q3 -2 5 2 v-12 l6 -2 v-4 l-6 2 v12 q-5 -1 -5 2z"/>
      <path d="M300 90 q4 -2 6 2 v-16 l8 -2 v-5 l-8 2 v16 q-6 -1 -6 3z"/>
      <path d="M340 30 q3 -2 5 2 v-12 l6 -2 v-4 l-6 2 v12 q-5 -1 -5 2z"/>
    </g>
  );
}

function ProfileStat({ icon, val, lbl }) {
  return (
    <div style={{
      background:'rgba(255,255,255,0.18)',
      borderRadius:14, padding:'10px 4px', textAlign:'center',
      border:'1px solid rgba(255,255,255,0.25)',
    }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:2 }}>{icon}</div>
      <div style={{ fontSize:18, fontWeight:900, lineHeight:1 }}>{val}</div>
      <div style={{ fontSize:8.5, fontWeight:900, letterSpacing:'0.1em', opacity:0.85, marginTop:2 }}>{lbl}</div>
    </div>
  );
}

function SectionTitle({ title, right }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline',
      margin:'18px 4px 10px' }}>
      <h3 style={{ fontSize:15, fontWeight:900 }}>{title}</h3>
      {right && <span style={{ fontSize:12, fontWeight:900, color:'var(--brand)' }}>{right}</span>}
    </div>
  );
}

function Achievement({ title, sub, icon, color, prog, locked }) {
  return (
    <div style={{
      background:'#FFFAEC',
      border:'1.5px solid var(--ink-line)',
      borderRadius:16, padding:'12px 8px', textAlign:'center',
      opacity: locked ? 0.5 : 1,
    }}>
      <div style={{
        width:56, height:56, borderRadius:'50%',
        background: color, color:'#fff',
        display:'flex', alignItems:'center', justifyContent:'center',
        margin:'0 auto 6px',
        boxShadow:`0 3px 0 ${shade(color)}`,
      }}>{icon}</div>
      <div style={{ fontSize:11, fontWeight:900, lineHeight:1.15 }}>{title}</div>
      <div style={{ fontSize:9, fontWeight:900, color:'var(--ink-500)', marginTop:2,
        letterSpacing:'0.1em' }}>{sub}</div>
      {prog > 0 && (
        <div style={{ height:5, background:'#F0E4C9', borderRadius:3, marginTop:6, overflow:'hidden' }}>
          <div style={{ width:`${prog*100}%`, height:'100%', background: color }}/>
        </div>
      )}
    </div>
  );
}
function shade() { return 'rgba(42,29,17,0.18)'; }

// ───────────────────────────────────────────────────────────────
// DAILY QUEST / WARM-UP
// ───────────────────────────────────────────────────────────────
function ScreenQuests({ width = 390, height = 720 }) {
  return (
    <div className="pp-art pp-paper" style={{ width, height, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <PPHeader section="Daily Warm-up" streak={12} xp={3240} hearts={4} gems={142}/>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 70px' }}>
        {/* big streak card */}
        <div style={{
          background:'linear-gradient(160deg,#FFB347 0%, var(--rust) 100%)',
          color:'#fff',
          borderRadius:22, padding:'18px 18px 16px',
          boxShadow:'0 6px 0 var(--rust-dark)',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:78, height:78, borderRadius:'50%',
              background:'rgba(0,0,0,0.18)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'inset 0 0 0 3px rgba(255,255,255,0.25)',
            }}>
              <FlameIcon size={48}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:900, letterSpacing:'0.14em', opacity:0.85 }}>STREAK</div>
              <div style={{ fontSize:42, fontWeight:900, lineHeight:1 }}>12 days</div>
              <div style={{ fontSize:13, fontWeight:800, opacity:0.9 }}>Keep the metronome ticking!</div>
            </div>
          </div>
          {/* week pips */}
          <div style={{ display:'flex', gap:5, marginTop:14 }}>
            {Array.from({length:30}).map((_,i)=>(
              <div key={i} style={{
                flex:1, height:6, borderRadius:3,
                background: i < 12 ? '#FFFAEC' : 'rgba(255,255,255,0.25)',
              }}/>
            ))}
          </div>
          <div style={{ fontSize:11, fontWeight:900, marginTop:6, opacity:0.9 }}>
            12 / 30 days · next reward at <b>30</b>
          </div>
        </div>

        {/* quests */}
        <SectionTitle title="Today's Warm-up" right="3h 14m left"/>
        <Quest
          icon={<NoteIcon size={26} color="#fff"/>}
          color="var(--brand)"
          title="Play 10 minutes"
          prog={0.7} progText="7 / 10 min"
          reward={<RewardChip icon={<GemIcon size={14}/>} val={20}/>}
        />
        <Quest
          icon={<TrebleClef size={26} color="#fff"/>}
          color="var(--sky)"
          title="Land 3 perfect lessons"
          prog={0.66} progText="2 / 3"
          reward={<RewardChip icon={<StarIcon size={14} color="#fff"/>} val={30} c="var(--butter)"/>}
        />
        <Quest
          icon={<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
            <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2.4" fill="none"/>
            <path d="M12 6 V12 L16 14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/>
          </svg>}
          color="var(--plum)"
          title="Beat the metronome at 80 BPM"
          prog={0} progText="not started"
          reward={<RewardChip icon={<GemIcon size={14}/>} val={50}/>}
        />

        <SectionTitle title="Weekly challenge"/>
        <div style={{
          background:'#FFFAEC', borderRadius:18,
          border:'1.5px solid var(--ink-line)',
          padding:'14px 16px',
          display:'flex', alignItems:'center', gap:14,
        }}>
          <div style={{
            width:60, height:60, borderRadius:14,
            background:'linear-gradient(135deg,#F5B800,#C2410C)',
            display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
            boxShadow:'0 3px 0 var(--rust-dark)',
          }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="#fff">
              <path d="M12 2 L4 7 V13 C 4 18 8 22 12 22 C 16 22 20 18 20 13 V7 Z"/>
              <path d="M9 12 L11 14 L15 10" stroke="#C2410C" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:900 }}>Play Let It Be all the way through</div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-500)', marginTop:2 }}>
              Ends Sunday · Reward 200 XP
            </div>
          </div>
          <ChevronRight/>
        </div>
      </div>

      <PPTabBar active="quest"/>
    </div>
  );
}

function Quest({ icon, color, title, prog, progText, reward }) {
  return (
    <div style={{
      background:'#FFFAEC', borderRadius:18,
      border:'1.5px solid var(--ink-line)',
      padding:'12px 14px', marginBottom:10,
      display:'flex', alignItems:'center', gap:12,
    }}>
      <div style={{
        width:54, height:54, borderRadius:14,
        background: color,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:`0 3px 0 ${shade()}`,
      }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:900 }}>{title}</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
          <div style={{ flex:1, height:8, background:'#F0E4C9', borderRadius:4, overflow:'hidden' }}>
            <div style={{
              width:`${prog*100}%`, height:'100%', background:color,
              boxShadow:`inset 0 -2px 0 ${shade()}`,
            }}/>
          </div>
          <div style={{ fontSize:11, fontWeight:900, color:'var(--ink-500)', whiteSpace:'nowrap' }}>
            {progText}
          </div>
        </div>
      </div>
      {reward}
    </div>
  );
}

function RewardChip({ icon, val, c }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:3,
      background: c || 'var(--sky)',
      color:'#fff',
      borderRadius:10, padding:'4px 9px',
      fontWeight:900, fontSize:13,
      boxShadow:`0 2px 0 ${shade()}`,
    }}>{icon}{val}</div>
  );
}

// ───────────────────────────────────────────────────────────────
// SONGS LIBRARY
// ───────────────────────────────────────────────────────────────
function ScreenSongs({ width = 390, height = 720 }) {
  const featured = {
    title:"River Flows In You",
    artist:"Yiruma",
    chords:"Am F C G",
    plays:"2.3M plays",
  };
  const cats = [
    { name:"Just learned", color:"var(--brand)", songs:[
      { t:"Let It Be", a:"The Beatles", lvl:1, color:"var(--sky)" },
      { t:"Lean On Me", a:"Bill Withers", lvl:1, color:"var(--brand)" },
      { t:"Hallelujah", a:"L. Cohen", lvl:2, color:"var(--rust)" },
    ]},
    { name:"Trending pop", color:"var(--rust)", songs:[
      { t:"Despacito", a:"L. Fonsi", lvl:2, color:"var(--coral)" },
      { t:"Faded", a:"Alan Walker", lvl:3, color:"var(--plum)" },
      { t:"Stay", a:"K.Laroi", lvl:3, color:"var(--butter)" },
    ]},
  ];

  return (
    <div className="pp-art pp-paper" style={{ width, height, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <PPHeader section="Songbook" streak={12} xp={3240} hearts={4} gems={142}/>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 70px' }}>
        {/* search */}
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:'#FFFAEC',
          border:'1.5px solid var(--ink-line)',
          borderRadius:14, padding:'10px 14px',
          marginBottom:14,
        }}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <circle cx="10" cy="10" r="6" stroke="var(--ink-500)" strokeWidth="2.4" fill="none"/>
            <path d="M14.5 14.5 L19 19" stroke="var(--ink-500)" strokeWidth="2.4" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--ink-300)' }}>
            Search 4,000 songs…
          </span>
        </div>

        {/* featured hero */}
        <div style={{
          background:'linear-gradient(160deg, var(--plum) 0%, var(--rust) 100%)',
          color:'#fff', borderRadius:22,
          padding:'18px 18px 16px',
          boxShadow:'0 6px 0 rgba(42,29,17,0.2)',
          position:'relative', overflow:'hidden',
        }}>
          <svg viewBox="0 0 380 200" width="100%" height="100%"
               style={{ position:'absolute', inset:0, opacity:0.18 }}>
            <NoteSpray/>
          </svg>
          <div style={{ position:'relative' }}>
            <div style={{ fontSize:11, fontWeight:900, letterSpacing:'0.16em', opacity:0.85 }}>
              FEATURED · PIANIST'S PICK
            </div>
            <div style={{ fontSize:26, fontWeight:900, lineHeight:1.1, marginTop:4 }}>
              {featured.title}
            </div>
            <div style={{ fontSize:14, fontWeight:700, opacity:0.9, marginTop:2 }}>
              {featured.artist} · {featured.plays}
            </div>

            <div style={{ display:'flex', gap:5, marginTop:12, flexWrap:'wrap' }}>
              {featured.chords.split(' ').map(c => (
                <div key={c} style={{
                  fontSize:12, fontWeight:900,
                  background:'rgba(255,255,255,0.2)',
                  border:'1px solid rgba(255,255,255,0.3)',
                  borderRadius:8, padding:'4px 10px',
                }}>{c}</div>
              ))}
            </div>

            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <button className="btn-chunk butter" style={{ padding:'10px 18px', fontSize:13 }}>
                <PlayIcon size={16} color="var(--ink-900)"/>PLAY
              </button>
              <button className="btn-chunk ghost" style={{
                background:'rgba(255,255,255,0.18)', borderColor:'rgba(255,255,255,0.3)',
                color:'#fff', boxShadow:'none', padding:'10px 18px', fontSize:13,
              }}>PRACTICE</button>
            </div>
          </div>
        </div>

        {/* chip filter row */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', margin:'14px 0 6px' }}>
          {[['All',true],['Easy',false],['Pop',false],['Classical',false],['Jazz',false]].map(([l,on],i)=>(
            <div key={i} style={{
              fontSize:12, fontWeight:900,
              padding:'7px 14px', borderRadius:999,
              background: on ? 'var(--ink-900)' : '#FFFAEC',
              color: on ? '#fff' : 'var(--ink-700)',
              border:'1.5px solid var(--ink-line)',
              whiteSpace:'nowrap',
            }}>{l}</div>
          ))}
        </div>

        {/* category rows */}
        {cats.map(cat => (
          <div key={cat.name} style={{ marginTop:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline',
              margin:'0 4px 8px' }}>
              <h3 style={{ fontSize:15, fontWeight:900 }}>
                <span style={{ color:cat.color }}>♪</span> {cat.name}
              </h3>
              <span style={{ fontSize:12, fontWeight:900, color:'var(--brand)' }}>See all</span>
            </div>
            <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
              {cat.songs.map((s,i)=><SongCard key={i} s={s}/>)}
            </div>
          </div>
        ))}
      </div>

      <PPTabBar active="songs"/>
    </div>
  );
}

function SongCard({ s }) {
  return (
    <div style={{
      width:130, flexShrink:0,
      background:'#FFFAEC', borderRadius:14,
      border:'1.5px solid var(--ink-line)',
      overflow:'hidden',
      boxShadow:'0 3px 0 rgba(42,29,17,0.08)',
    }}>
      <div style={{
        height:78, background: s.color,
        position:'relative', overflow:'hidden',
        display:'flex', alignItems:'flex-end', justifyContent:'center',
      }}>
        <NoteIcon size={50} color="rgba(255,255,255,0.5)"/>
        <div style={{
          position:'absolute', top:6, right:6,
          background:'rgba(0,0,0,0.4)', color:'#fff',
          fontSize:9, fontWeight:900, padding:'2px 6px', borderRadius:6,
          letterSpacing:'0.1em',
        }}>LVL {s.lvl}</div>
      </div>
      <div style={{ padding:'8px 10px' }}>
        <div style={{ fontSize:13, fontWeight:900, lineHeight:1.15, overflow:'hidden',
          textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.t}</div>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-500)' }}>{s.a}</div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenProfile, ScreenQuests, ScreenSongs });
