// Piano Professor — Onboarding + two Lesson-path variants
// Variant A: Sheet-music staff (notes are lesson nodes on a treble staff)
// Variant B: Piano-key ladder (white-key rows form the path)

const PP_LESSONS = [
  { i:1,  name:"The Anchor",        section:"Foundations" },
  { i:2,  name:"Find the Notes",    section:"Foundations" },
  { i:3,  name:"Half & Whole",      section:"Foundations" },
  { i:4,  name:"Major Scale",       section:"Foundations" },
  { i:5,  name:"Minor Mood",        section:"Foundations" },
  { i:6,  name:"Three Big Chords",  section:"Chord Lab" },
  { i:7,  name:"Sad Pop Chords",    section:"Chord Lab" },
  { i:8,  name:"I-V-vi-IV",         section:"Chord Lab" },
  { i:9,  name:"Circle of Fifths",  section:"Chord Lab" },
  { i:10, name:"7ths & Jazz",       section:"Songcraft" },
  { i:11, name:"Smooth Inversions", section:"Songcraft" },
  { i:12, name:"Real Songs",        section:"Songcraft" },
];

// ───────────────────────────────────────────────────────────────
// ONBOARDING — welcome hero: cat sitting at the piano + wandering anim
// ───────────────────────────────────────────────────────────────
function ScreenOnboarding({ width = 390, height = 720 }) {
  return (
    <div className="pp-art pp-paper" style={{
      width, height,
      position:'relative', overflow:'hidden',
      display:'flex', flexDirection:'column',
      padding:'18px 24px 28px',
    }}>
      {/* deco staff lines top */}
      <svg viewBox="0 0 390 200" width="100%" height="200" style={{
        position:'absolute', top:-10, left:0, opacity:0.18, pointerEvents:'none',
      }}>
        {[60,80,100,120,140].map(y => (
          <line key={y} x1="-20" y1={y} x2="420" y2={y} stroke="#4A3622" strokeWidth="1.2"/>
        ))}
        <g transform="translate(20,60)" fill="#4A3622">
          <path d="M14 0c-3 4-6 8-6 14 0 5 2 8 5 11 -4 3 -7 7 -7 12 0 6 5 11 11 11 5 0 9-4 9-9 0-3 -2-6 -5-7 -4-2 -7-5 -7-10 0-3 1-5 3-7"
                fill="none" stroke="#4A3622" strokeWidth="2"/>
        </g>
        <g fill="#C2410C">
          <ellipse cx="100" cy="100" rx="8" ry="6"/>
          <rect x="106" y="76" width="2.4" height="24"/>
          <ellipse cx="180" cy="80" rx="8" ry="6"/>
          <rect x="186" y="56" width="2.4" height="24"/>
          <ellipse cx="270" cy="120" rx="8" ry="6"/>
          <rect x="276" y="96" width="2.4" height="24"/>
        </g>
      </svg>

      {/* skip in top right */}
      <div style={{ display:'flex', justifyContent:'flex-end', position:'relative', zIndex:2 }}>
        <span style={{ fontSize:14, fontWeight:800, color:'var(--ink-500)' }}>SKIP</span>
      </div>

      {/* hero block — cat at the piano */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', textAlign:'center',
        position:'relative', zIndex:2, marginTop:-10,
      }}>
        {/* tagline */}
        <div style={{ fontSize:14, fontWeight:900, letterSpacing:'0.18em',
          color:'var(--rust)', textTransform:'uppercase', marginBottom:6 }}>
          PIANO · PROFESSOR
        </div>
        <h1 style={{ fontSize:30, color:'var(--ink-900)', marginBottom:8, lineHeight:1.1, whiteSpace:'nowrap' }}>
          Real songs.<br/>
          <span style={{ color:'var(--brand)' }}>5 min/day.</span>
        </h1>
        <p style={{
          fontSize:14, fontWeight:700, color:'var(--ink-500)',
          maxWidth:280, lineHeight:1.45, marginBottom:18,
        }}>
          Meet Maestro Penguini — your tuxedo-clad piano teacher. Chords first, sheet music never.
        </p>

        {/* CAT AT PIANO scene */}
        <CatAtPiano width={300} height={240}/>
      </div>

      {/* CTAs */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, position:'relative', zIndex:2 }}>
        <button className="btn-chunk lg" style={{ width:'100%' }}>GET STARTED — FREE</button>
        <button className="btn-chunk ghost" style={{ width:'100%' }}>I ALREADY HAVE AN ACCOUNT</button>
      </div>

      {/* page dots */}
      <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:14, position:'relative', zIndex:2 }}>
        <span style={{ width:24, height:6, borderRadius:3, background:'var(--brand)' }}/>
        <span style={{ width:6, height:6, borderRadius:3, background:'var(--ink-300)' }}/>
        <span style={{ width:6, height:6, borderRadius:3, background:'var(--ink-300)' }}/>
      </div>
    </div>
  );
}

// Cat seated behind a piano, with floating music notes and a soft pedestal glow
function CatAtPiano({ width = 300, height = 240 }) {
  return (
    <div style={{
      width, height, position:'relative',
    }}>
      {/* floor / pedestal glow */}
      <div style={{
        position:'absolute', left:'50%', bottom:14,
        transform:'translateX(-50%)',
        width: width * 0.86, height: 26,
        background:'radial-gradient(ellipse at center, rgba(245,184,0,0.35) 0%, transparent 70%)',
        filter:'blur(6px)',
      }}/>

      {/* floating music notes - emitted from cat */}
      <FloatingNotes/>

      {/* THE MAESTRO — cycles moods to react to the music below */}
      <div style={{
        position:'absolute', left:'50%', top: -6,
        transform:'translateX(-50%)',
        width: 190, height: 175,
        display:'flex', alignItems:'flex-end', justifyContent:'center',
      }}>
        <MoodCycler
          size={185}
          moods={['conduct','cheer','idea','wow','star','swoon']}
          interval={2200}
        />
      </div>

      {/* PIANO — small grand-piano-style bench + keys */}
      <div style={{
        position:'absolute', left:'50%', bottom:0,
        transform:'translateX(-50%)',
        width: width * 0.94,
      }}>
        <TinyGrandPiano width={width * 0.94} height={66}/>
      </div>
    </div>
  );
}

function FloatingNotes() {
  // 4 staggered floating music notes
  const notes = [
    { x: '14%',  delay: 0,   r:'-14deg', size: 22, color:'var(--rust)'  },
    { x: '78%',  delay: 1.3, r:'18deg',  size: 18, color:'var(--brand)' },
    { x: '22%',  delay: 2.6, r:'-6deg',  size: 16, color:'var(--butter-d)' },
    { x: '70%',  delay: 3.9, r:'12deg',  size: 20, color:'var(--sky-dark)' },
  ];
  return (
    <>
      {notes.map((n, i) => (
        <div key={i} style={{
          position:'absolute', top:'48%', left:n.x,
          animation: `ppNoteFloat 5.2s ease-out ${n.delay}s infinite`,
          ['--r']: n.r,
        }}>
          <NoteIcon size={n.size} color={n.color}/>
        </div>
      ))}
    </>
  );
}

// Tiny grand piano styled to look like the cat's instrument.
// Now has an LED for every white AND black key, and the LEDs flash through
// a simplified Canon-in-D melody (Pachelbel's most-recognizable hook).
function TinyGrandPiano({ width, height }) {
  // 14 white keys: index 0..13. The black-key indices (between white i and i+1):
  const blackAfter = [0,1,3,4,5,7,8,10,11,12]; // 10 black keys
  // Build a single ordered list of all key slots (white + black) for LED rendering.
  // Each entry: { kind, wIdx, color, x } — black keys sit BETWEEN whites.

  // ── Canon in D simplified melody — note names mapped to our 14-key bed.
  // Our 14 whites span C-major, but Canon in D uses sharps. We re-map the
  // melody onto our keyboard so the AUDIENCE sees recognizable up-down motion.
  // Sequence: D A B F# G D G A  (Pachelbel ground bass / right-hand hook)
  // We pick keys by VISIBLE position so it looks musical.
  // 'w'=white idx, 'b'=black idx (= white idx BEFORE the black).
  const SEQ = React.useMemo(() => [
    { kind:'w', i:1, color:'#58CC02' }, // D
    { kind:'w', i:5, color:'#5BB8E3' }, // A
    { kind:'w', i:6, color:'#FF7A9C' }, // B
    { kind:'b', i:3, color:'#F5B800' }, // F#
    { kind:'w', i:4, color:'#58CC02' }, // G
    { kind:'w', i:1, color:'#8B5CF6' }, // D
    { kind:'w', i:4, color:'#5BB8E3' }, // G
    { kind:'w', i:5, color:'#F5B800' }, // A
    // 2nd half — continue the line up
    { kind:'w', i:8, color:'#58CC02' }, // D (upper)
    { kind:'w', i:12,color:'#5BB8E3' }, // A (upper)
    { kind:'b', i:10,color:'#FF7A9C' }, // G# upper
    { kind:'w', i:11,color:'#F5B800' }, // A
    { kind:'w', i:10,color:'#58CC02' }, // G upper
    { kind:'w', i:8, color:'#8B5CF6' }, // D upper
    { kind:'w', i:11,color:'#5BB8E3' }, // A
    { kind:'w', i:12,color:'#F5B800' }, // B upper
  ], []);

  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % SEQ.length), 380);
    return () => clearInterval(id);
  }, []);

  // ── Geometry
  const padX = width * 0.04 + 2;
  const kbW = width * 0.92 - 4;
  const wW = kbW / 14;           // white key width
  const kbTop = height * 0.36;
  const kbH = height * 0.54;
  const blkH = kbH * 0.62;
  const blkW = wW * 0.64;

  // LED strip dimensions — sits in the "fallboard" strip ABOVE the keys
  const ledStripTop = height * 0.32 + 1;
  const ledStripH = (kbTop - ledStripTop) - 1;

  // Active key for this step
  const active = SEQ[step];
  const isWhiteLit = (i) => active.kind === 'w' && active.i === i;
  const isBlackLit = (i) => active.kind === 'b' && active.i === i;
  // also light the PREVIOUS step at lower intensity for trail
  const prev = SEQ[(step - 1 + SEQ.length) % SEQ.length];
  const isWhiteTrail = (i) => prev.kind === 'w' && prev.i === i;
  const isBlackTrail = (i) => prev.kind === 'b' && prev.i === i;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display:'block' }}>
      <defs>
        <linearGradient id="lidGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A2818"/>
          <stop offset="1" stopColor="#1A1410"/>
        </linearGradient>
        <linearGradient id="litGradGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#58CC02" stopOpacity="0.95"/>
          <stop offset="0.55" stopColor="#FFFAEC" stopOpacity="0.65"/>
          <stop offset="1" stopColor="#FFFAEC"/>
        </linearGradient>
      </defs>

      {/* piano lid (curved top) */}
      <path d={`M ${width*0.04} ${height*0.18}
                Q ${width*0.5} -8 ${width*0.96} ${height*0.18}
                L ${width*0.94} ${height*0.32}
                L ${width*0.06} ${height*0.32} Z`}
            fill="url(#lidGrad)" stroke="#000" strokeWidth="0.8"/>

      {/* gold rim line */}
      <path d={`M ${width*0.06} ${height*0.20}
                Q ${width*0.5} -4 ${width*0.94} ${height*0.20}`}
            fill="none" stroke="#F5B800" strokeWidth="1.4" opacity="0.7"/>

      {/* LED strip housing */}
      <rect x={width*0.04} y={ledStripTop - 1} width={width*0.92} height={ledStripH + 1}
        fill="#0A0805"/>

      {/* LEDs — one per white key */}
      {Array.from({length: 14}).map((_, i) => {
        const x = padX + i * wW + wW/2;
        const cy = ledStripTop + ledStripH/2;
        const on = isWhiteLit(i);
        const trail = isWhiteTrail(i);
        const col = on ? active.color : trail ? prev.color : '#1A1410';
        const r = on ? Math.min(wW*0.32, 3.4) : Math.min(wW*0.26, 2.6);
        const op = on ? 1 : trail ? 0.45 : 1;
        return (
          <g key={`lw${i}`} opacity={op}>
            {on && (
              <circle cx={x} cy={cy} r={r*2.4} fill={col} opacity="0.35"/>
            )}
            <circle cx={x} cy={cy} r={r} fill={col}/>
          </g>
        );
      })}
      {/* LEDs — one per black key (offset to sit above black) */}
      {blackAfter.map((i) => {
        const x = padX + (i+1) * wW; // boundary between white i and i+1
        const cy = ledStripTop + ledStripH/2;
        const on = isBlackLit(i);
        const trail = isBlackTrail(i);
        const col = on ? active.color : trail ? prev.color : '#241814';
        const r = on ? 3.0 : 2.2;
        const op = on ? 1 : trail ? 0.45 : 1;
        return (
          <g key={`lb${i}`} opacity={op}>
            {on && <circle cx={x} cy={cy} r={r*2.4} fill={col} opacity="0.35"/>}
            <circle cx={x} cy={cy} r={r} fill={col}/>
          </g>
        );
      })}

      {/* keyboard backing */}
      <rect x={width*0.04} y={kbTop - 2} width={width*0.92} height={kbH + 2}
        rx="3" fill="#1A1410"/>
      <rect x={padX} y={kbTop} width={kbW} height={kbH} fill="#FFFAEC"/>

      {/* white keys */}
      {Array.from({length: 14}).map((_, i) => {
        const x = padX + i * wW;
        const on = isWhiteLit(i);
        return (
          <g key={`wk${i}`}>
            <rect x={x} y={kbTop} width={wW - 0.6} height={kbH}
              fill="#FFFAEC" stroke="#1A1410" strokeWidth="0.5"/>
            {on && (
              <rect x={x} y={kbTop} width={wW - 0.6} height={kbH}
                fill={`url(#litGradGreen)`} style={{
                  filter:`drop-shadow(0 0 4px ${active.color})`,
                }}/>
            )}
            {on && (
              <rect x={x} y={kbTop} width={wW - 0.6} height={kbH}
                fill={active.color} opacity="0.32"/>
            )}
          </g>
        );
      })}
      {/* black keys */}
      {blackAfter.map(i => {
        const x = padX + (i+1) * wW - blkW/2;
        const on = isBlackLit(i);
        return (
          <g key={`bk${i}`}>
            <rect x={x} y={kbTop} width={blkW} height={blkH} fill="#1A1410"/>
            {on && (
              <rect x={x} y={kbTop} width={blkW} height={blkH}
                fill={active.color} opacity="0.7" style={{
                  filter:`drop-shadow(0 0 6px ${active.color})`,
                }}/>
            )}
          </g>
        );
      })}

      {/* shadow under piano */}
      <ellipse cx={width/2} cy={height-2} rx={width*0.42} ry="3" fill="rgba(42,29,17,0.2)"/>
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────
// HEADER bar used on path / songs screens
// ───────────────────────────────────────────────────────────────
function PPHeader({ section, streak, xp, hearts, gems }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'10px 18px 12px',
      background:'#FFFAEC',
      borderBottom:'1.5px solid var(--ink-line)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <CatAvatar size={36} ring={false}/>
        <div>
          <div style={{ fontSize:10, fontWeight:900, color:'var(--ink-500)',
            letterSpacing:'0.12em', textTransform:'uppercase' }}>SECTION 1</div>
          <div style={{ fontSize:14, fontWeight:900, color:'var(--ink-900)' }}>{section}</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <StatPill icon={<FlameIcon size={16}/>} value={streak} color="#FF7A1C"/>
        <StatPill icon={<GemIcon size={16}/>}   value={gems}/>
        <StatPill icon={<HeartIcon size={16}/>} value={hearts} color="#FF4B4B"/>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// VARIANT A — sheet-music STAFF PATH
// Lessons are notes positioned on staff lines / spaces
// ───────────────────────────────────────────────────────────────
const STAFF_W = 354;     // staff width inside frame
const ROW_H   = 132;     // height of one staff row
const STAFF_TOP = 38;    // top padding inside row
const LINE_GAP  = 12;    // gap between staff lines

function StaffRow({ rowIndex, sectionLabel, lessons, currentI, mascotI }) {
  // staff lines at y = STAFF_TOP + 0..4 * LINE_GAP
  // notes pitch positions (degree from bottom line):
  //   bottom line = 0, top line = 8, etc.
  // Visually: y = STAFF_TOP + (4 - degree/2) * LINE_GAP
  const noteY = (deg) => STAFF_TOP + (8 - deg) * (LINE_GAP/2);
  // give each lesson a position pattern that hops around (musical)
  const pitches = [2, 5, 3, 7, 4, 6]; // pleasing zig-zag

  return (
    <div style={{ position:'relative', height: ROW_H, marginBottom: 8 }}>
      {/* section label as time signature header */}
      {sectionLabel && (
        <div style={{
          position:'absolute', top:0, left:0, right:0,
          display:'flex', alignItems:'center', gap:8,
          padding:'0 4px', height:24,
        }}>
          <div style={{
            width:32, textAlign:'center',
            fontSize:13, fontWeight:900, color:'var(--rust)',
            letterSpacing:'0.05em',
          }}>4<br/>4</div>
          <div style={{ flex:1, height:2, background:'var(--ink-300)' }}/>
          <div style={{
            fontSize:11, fontWeight:900, color:'var(--rust)',
            background:'#FFE6BA', padding:'3px 10px', borderRadius:999,
            letterSpacing:'0.1em', textTransform:'uppercase',
          }}>{sectionLabel}</div>
          <div style={{ flex:1, height:2, background:'var(--ink-300)' }}/>
        </div>
      )}

      <svg viewBox={`0 0 ${STAFF_W} ${ROW_H}`} width={STAFF_W} height={ROW_H}
           style={{ position:'absolute', top:0, left:0 }}>
        {/* 5 staff lines */}
        {[0,1,2,3,4].map(i => (
          <line key={i}
            x1={rowIndex === 0 ? 36 : 6}
            x2={STAFF_W - 6}
            y1={STAFF_TOP + i*LINE_GAP}
            y2={STAFF_TOP + i*LINE_GAP}
            stroke="var(--staff)"
            strokeWidth="1.4"
            opacity="0.6"
          />
        ))}
        {/* treble clef on first row */}
        {rowIndex === 0 && (
          <g transform={`translate(8,${STAFF_TOP - 14})`} fill="none" stroke="var(--staff)" strokeWidth="1.8">
            <path d="M14 4c-3 4-6 8-6 14 0 5 2 8 5 11 -4 3 -7 7 -7 13 0 7 5 13 12 13 6 0 10-4 10-10 0-4 -2-7 -6-9 -5-2 -8-6 -8-12 0-4 1-7 4-9 3-2 5 0 5 3 0 3 -2 5 -4 5"/>
            <circle cx="13" cy="38" r="3" fill="var(--staff)"/>
          </g>
        )}
        {/* bar lines */}
        <line x1={STAFF_W*0.5} y1={STAFF_TOP-2} x2={STAFF_W*0.5} y2={STAFF_TOP + 4*LINE_GAP + 2}
              stroke="var(--staff)" strokeWidth="1.3" opacity="0.5"/>
        {/* final double bar */}
        <line x1={STAFF_W-7} y1={STAFF_TOP-2} x2={STAFF_W-7} y2={STAFF_TOP + 4*LINE_GAP + 2}
              stroke="var(--staff)" strokeWidth="1.3" opacity="0.5"/>
        <line x1={STAFF_W-3} y1={STAFF_TOP-2} x2={STAFF_W-3} y2={STAFF_TOP + 4*LINE_GAP + 2}
              stroke="var(--staff)" strokeWidth="2" opacity="0.7"/>
      </svg>

      {/* notes (lesson nodes) */}
      {lessons.map((l, idx) => {
        const xStart = rowIndex === 0 ? 60 : 26;
        const xSpan  = (STAFF_W - xStart - 16);
        const x = xStart + (idx + 0.5) * (xSpan / lessons.length);
        const y = noteY(pitches[idx % pitches.length]);
        const done = l.i < currentI;
        const cur  = l.i === currentI;
        const lock = l.i > currentI;
        const fill = done ? 'var(--brand)' : cur ? 'var(--butter)' : '#FFFAEC';
        const stroke = done ? 'var(--brand-deep)' : cur ? 'var(--butter-d)' : 'var(--ink-300)';
        return (
          <div key={l.i} style={{
            position:'absolute', left:x-22, top:y-22, width:44, height:44,
            cursor:'pointer',
          }}>
            <svg viewBox="0 0 44 44" width="44" height="44" style={{ overflow:'visible' }}>
              {/* note head */}
              <ellipse cx="22" cy="22" rx="18" ry="14" transform="rotate(-18 22 22)"
                fill={fill} stroke={stroke} strokeWidth="3"
                style={{ filter: cur ? 'drop-shadow(0 0 12px rgba(245,184,0,0.55))' : 'none' }}/>
              {/* stem */}
              {!lock && (
                <rect x="36" y="-12" width="3" height="34" fill={stroke} transform="rotate(-18 22 22)"/>
              )}
              {/* checkmark for done */}
              {done && (
                <path d="M14 22 L20 28 L30 16" stroke="#fff" strokeWidth="3"
                  fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              )}
              {/* lock for locked */}
              {lock && (
                <g transform="translate(15,14)">
                  <rect x="2" y="6" width="10" height="9" rx="1.5" fill="var(--ink-300)"/>
                  <path d="M4 6 V4 a3 3 0 0 1 6 0 V6" stroke="var(--ink-300)" strokeWidth="1.6" fill="none"/>
                </g>
              )}
              {/* number for current */}
              {cur && (
                <text x="22" y="27" textAnchor="middle"
                  fontSize="14" fontWeight="900" fill="#fff"
                  style={{ fontFamily:"Nunito, system-ui, sans-serif" }}>{l.i}</text>
              )}
            </svg>

            {/* label below */}
            <div style={{
              position:'absolute', top:46, left:'50%', transform:'translateX(-50%)',
              fontSize:9.5, fontWeight:900, whiteSpace:'nowrap',
              color: cur ? 'var(--ink-900)' : 'var(--ink-500)',
              textTransform:'uppercase', letterSpacing:'0.04em',
            }}>{l.name}</div>

            {/* mascot perched on current */}
            {l.i === mascotI && (
              <div style={{
                position:'absolute', top:-44, left:'50%', transform:'translateX(-50%)',
              }}>
                <div style={{
                  background:'var(--ink-900)', color:'#fff',
                  fontSize:10, fontWeight:900, letterSpacing:'0.1em',
                  padding:'3px 8px', borderRadius:6, marginBottom:2,
                  whiteSpace:'nowrap',
                }}>START</div>
                <CatChip size={36}/>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ScreenPathStaff({ width = 390, height = 720, streak = 7, xp = 240, hearts = 4, gems = 18, current = 3 }) {
  // group lessons by section
  const sections = [];
  PP_LESSONS.forEach(l => {
    let s = sections.find(s => s.name === l.section);
    if (!s) { s = { name: l.section, lessons: [] }; sections.push(s); }
    s.lessons.push(l);
  });

  return (
    <div className="pp-art pp-paper" style={{
      width, height,
      display:'flex', flexDirection:'column', overflow:'hidden',
    }}>
      <PPHeader section="Foundations" streak={streak} xp={xp} hearts={hearts} gems={gems}/>

      <div style={{ flex:1, overflowY:'auto', padding:'10px 8px 60px' }}>
        {sections.map((s, sIdx) => (
          <StaffRow key={s.name} rowIndex={sIdx} sectionLabel={s.name}
            lessons={s.lessons}
            currentI={current}
            mascotI={current}/>
        ))}
        <div style={{
          textAlign:'center', marginTop:14,
          fontSize:11, fontWeight:900, color:'var(--ink-300)',
          letterSpacing:'0.18em', textTransform:'uppercase',
        }}>~ FINALE ~</div>
      </div>

      {/* bottom nav */}
      <PPTabBar active="learn"/>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// VARIANT B — piano-key ladder PATH
// Each lesson is a piano key laid horizontally. Black keys = bonus.
// ───────────────────────────────────────────────────────────────
function ScreenPathKeys({ width = 390, height = 720, streak = 7, xp = 240, hearts = 4, gems = 18, current = 3 }) {
  // 12 lessons + 3 sections; render alternating cream key bars
  // sections become dividers
  return (
    <div className="pp-art pp-paper" style={{
      width, height,
      display:'flex', flexDirection:'column', overflow:'hidden',
    }}>
      <PPHeader section="Foundations" streak={streak} xp={xp} hearts={hearts} gems={gems}/>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 18px 70px', position:'relative' }}>
        {/* vertical piano spine */}
        <div style={{
          position:'absolute', left:18, top:14, bottom:70, width:6,
          background:'linear-gradient(180deg, var(--piano-black) 0%, #2A1D11 100%)',
          borderRadius:3,
        }}/>

        {PP_LESSONS.map((l, idx) => {
          const newSection = idx === 0 || l.section !== PP_LESSONS[idx-1].section;
          const done = l.i < current;
          const cur  = l.i === current;
          const lock = l.i > current;
          return (
            <React.Fragment key={l.i}>
              {newSection && idx > 0 && (
                <div style={{
                  display:'flex', alignItems:'center', gap:8, margin:'14px 0 10px 18px',
                }}>
                  <div style={{ flex:1, height:2,
                    backgroundImage:'repeating-linear-gradient(90deg, var(--ink-300) 0 6px, transparent 6px 12px)'}}/>
                </div>
              )}
              {newSection && (
                <div style={{
                  marginLeft:18, marginBottom:8, marginTop: idx === 0 ? 0 : 4,
                  fontSize:11, fontWeight:900, color:'var(--rust)',
                  letterSpacing:'0.18em', textTransform:'uppercase',
                }}>
                  {l.section}
                </div>
              )}
              <KeyLessonRow lesson={l} done={done} cur={cur} lock={lock} side={idx%2===0?'right':'right'}/>
            </React.Fragment>
          );
        })}
        <div style={{
          textAlign:'center', marginTop:14,
          fontSize:11, fontWeight:900, color:'var(--ink-300)',
          letterSpacing:'0.18em', textTransform:'uppercase',
        }}>~ FINALE ~</div>
      </div>

      <PPTabBar active="learn"/>
    </div>
  );
}

function KeyLessonRow({ lesson, done, cur, lock }) {
  const bg = done ? 'var(--brand)' : cur ? '#FFFAEC' : '#F0E4C9';
  const txt = done ? '#fff' : cur ? 'var(--ink-900)' : 'var(--ink-300)';
  const stroke = cur ? 'var(--butter)' : 'var(--ink-line)';
  return (
    <div style={{
      position:'relative',
      marginLeft: 32, marginBottom: 10,
      height: cur ? 84 : 60,
      display:'flex',
    }}>
      {/* dock/tab notch (connects to spine) */}
      <div style={{
        position:'absolute', left:-22, top:'50%', transform:'translateY(-50%)',
        width:18, height:8,
        background: done ? 'var(--brand)' : 'var(--piano-black)',
      }}/>
      {/* the "key" card */}
      <div style={{
        flex:1,
        background: bg,
        border: `2.5px solid ${stroke}`,
        borderLeft: '6px solid var(--piano-black)',
        borderRadius: 14,
        boxShadow: cur ? '0 6px 0 var(--butter-d)' : '0 3px 0 rgba(42,29,17,0.1)',
        padding:'10px 14px',
        display:'flex', alignItems:'center', gap:12,
      }}>
        <div style={{
          width: cur ? 44 : 34, height: cur ? 44 : 34,
          borderRadius:'50%',
          background: done ? 'rgba(255,255,255,0.25)' :
                      cur ? 'var(--brand)' : 'transparent',
          border: lock ? '2.5px solid var(--ink-300)' : 'none',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: cur ? 18 : 15, fontWeight:900,
          color: done || cur ? '#fff' : 'var(--ink-300)',
        }}>
          {done ? <CheckIcon size={20}/> : lock ? <LockIcon size={16} color="var(--ink-300)"/> : lesson.i}
        </div>

        <div style={{ flex:1 }}>
          <div style={{ fontSize: cur ? 16 : 14, fontWeight:900, color: txt, lineHeight:1.15 }}>
            {lesson.name}
          </div>
          {cur && (
            <div style={{ marginTop:4, display:'flex', alignItems:'center', gap:6 }}>
              <MiniPiano width={70} height={18} lit={2}/>
              <span style={{ fontSize:11, fontWeight:900, color:'var(--rust)',
                letterSpacing:'0.08em', textTransform:'uppercase' }}>
                READY TO PLAY
              </span>
            </div>
          )}
          {!cur && !lock && !done && (
            <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-500)' }}>
              {lesson.section}
            </div>
          )}
          {done && (
            <div style={{ display:'flex', gap:2, marginTop:2 }}>
              <StarIcon size={12} color="#fff"/>
              <StarIcon size={12} color="#fff"/>
              <StarIcon size={12} color="rgba(255,255,255,0.4)"/>
            </div>
          )}
        </div>

        {cur && (
          <button className="btn-chunk" style={{ padding:'10px 16px', fontSize:13, borderRadius:12 }}>
            START
          </button>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Shared bottom tab bar
// ───────────────────────────────────────────────────────────────
function PPTabBar({ active = "learn" }) {
  const tabs = [
    { id:'learn',  label:'Learn',  icon:(c)=>(<TrebleClef size={22} color={c}/>) },
    { id:'songs',  label:'Songs',  icon:(c)=>(<NoteIcon size={22} color={c}/>) },
    { id:'quest',  label:'Quests', icon:(c)=>(<FlameIcon size={22} on={c==='var(--brand)'}/>) },
    { id:'led',    label:'LEDs',   icon:(c)=>(<BluetoothIcon size={22} color={c}/>) },
    { id:'me',     label:'Me',     icon:(c)=>(
      <svg viewBox="0 0 24 24" width="22" height="22">
        <circle cx="12" cy="9" r="4" fill={c}/>
        <path d="M3 22 q9 -10 18 0" fill={c}/>
      </svg>
    )},
  ];
  return (
    <div style={{
      borderTop:'1.5px solid var(--ink-line)',
      background:'#FFFAEC',
      padding:'8px 4px 10px',
      display:'flex',
    }}>
      {tabs.map(t => {
        const on = t.id === active;
        const c = on ? 'var(--brand)' : 'var(--ink-300)';
        return (
          <div key={t.id} style={{
            flex:1,
            display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            position:'relative',
          }}>
            {/* fixed-size icon container — keeps every icon centered on the same line */}
            <div style={{
              width:44, height:28, borderRadius:10,
              display:'flex', alignItems:'center', justifyContent:'center',
              background: on ? 'var(--brand-soft)' : 'transparent',
            }}>
              {t.icon(c)}
            </div>
            <div style={{
              fontSize:10, fontWeight:900, color:c,
              letterSpacing:'0.06em', textTransform:'uppercase',
              lineHeight:1,
            }}>
              {t.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  ScreenOnboarding, ScreenPathStaff, ScreenPathKeys,
  PPHeader, PPTabBar, PP_LESSONS,
});
