// Piano Professor — Inside-a-lesson + Lesson-complete

// ───────────────────────────────────────────────────────────────
// Big piano keyboard (used in lesson + as a sticker elsewhere)
// White keys: C D E F G A B (one octave + C5). 8 keys.
// ───────────────────────────────────────────────────────────────
function BigPiano({
  width = 354, height = 150,
  lit = {},   // { 'C': 'cyan', 'E': 'green' } etc
  fingerHints = {}, // { 'C': 1, 'E': 3, 'G': 5 }
  showLeds = true,
  ledRowColor = 'var(--brand)',
}) {
  const whites = ['C','D','E','F','G','A','B','C2'];
  const blackPositions = { 'C#':0, 'D#':1, 'F#':3, 'G#':4, 'A#':5 };
  const wW = width / 8;
  const ledH = showLeds ? 18 : 0;
  const keyH = height - ledH;

  return (
    <div style={{
      width, height,
      borderRadius: 14, overflow:'hidden',
      background:'var(--piano-black)',
      padding: 0,
      boxShadow:'inset 0 0 0 3px var(--piano-black), 0 6px 0 #000',
      position:'relative',
    }}>
      {/* LED strip above keys */}
      {showLeds && (
        <div style={{
          height: ledH, display:'flex', alignItems:'center',
          padding:'0 4px', background:'#0A0805', borderBottom:'1px solid #2A1D11',
        }}>
          {whites.map(k => (
            <div key={k} style={{
              flex:1, height: 10, margin:'0 2px', borderRadius: 6,
              background: lit[k]
                ? `radial-gradient(circle, ${litColor(lit[k])}, rgba(0,0,0,0.5))`
                : '#1A1410',
              boxShadow: lit[k] ? `0 0 10px ${litColor(lit[k])}, 0 0 4px ${litColor(lit[k])}` : 'none',
              animation: lit[k] ? 'ppLedBeat 0.9s ease-in-out infinite' : 'none',
            }}/>
          ))}
        </div>
      )}

      {/* white keys */}
      <div style={{ display:'flex', height: keyH, position:'relative' }}>
        {whites.map((k, i) => {
          const note = k.replace('2','');
          const isLit = !!lit[k];
          return (
            <div key={k} style={{
              flex:1, position:'relative',
              background: isLit
                ? `linear-gradient(180deg, ${litColor(lit[k])} 0%, #FFFAEC 60%)`
                : 'linear-gradient(180deg, #FFFAEC 0%, #F0E4C9 100%)',
              border:'1px solid var(--piano-black)',
              borderRadius: '0 0 6px 6px',
              boxShadow: isLit
                ? `inset 0 -6px 0 ${litColor(lit[k])}, inset 0 0 0 2px ${litColor(lit[k])}`
                : 'inset 0 -4px 0 rgba(42,29,17,0.18)',
            }}>
              {/* finger hint dot */}
              {fingerHints[k] && (
                <div style={{
                  position:'absolute', top: 14, left:'50%', transform:'translateX(-50%)',
                  width:22, height:22, borderRadius:'50%',
                  background:'var(--rust)', color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:900,
                  border:'2px solid #FFFAEC',
                  boxShadow:'0 2px 0 var(--rust-dark)',
                }}>{fingerHints[k]}</div>
              )}
              {/* note label */}
              <div style={{
                position:'absolute', bottom:6, left:'50%', transform:'translateX(-50%)',
                fontSize:10, fontWeight:900, color: isLit ? 'var(--ink-900)' : 'var(--ink-500)',
              }}>{note}</div>
            </div>
          );
        })}

        {/* black keys */}
        {Object.entries(blackPositions).map(([k, pos]) => (
          <div key={k} style={{
            position:'absolute', top:0,
            left: (pos+1)*wW - wW*0.28,
            width: wW*0.56, height: keyH*0.62,
            background:'linear-gradient(180deg,#2A1D11,#0A0805)',
            border:'1px solid #000',
            borderRadius:'0 0 4px 4px',
            boxShadow:'inset 0 -2px 0 rgba(255,255,255,0.06), 2px 2px 4px rgba(0,0,0,0.4)',
          }}/>
        ))}
      </div>
    </div>
  );
}

function litColor(c) {
  return ({
    cyan: '#00F0FF',
    green: '#58CC02',
    magenta: '#D600FF',
    yellow: '#FFC800',
    orange: '#FF9600',
    brand: '#58CC02',
  })[c] || '#58CC02';
}

// ───────────────────────────────────────────────────────────────
// MINI 88-KEY KEYBOARD — slide-bar context strip below the magnified piano.
// Shows the full 88-key range with tiny LEDs above each key.
// A bracket marks which 8 keys are currently magnified above.
// LEDs flash in time with the lesson's lit notes.
// ───────────────────────────────────────────────────────────────
function Mini88Keyboard({
  width = 358,
  // Pitch classes (0=C..11=B) to light up across ALL octaves. e.g. ['C','E','G']
  litPCs = [],
  // The 8-key magnified range — shows as a "viewfinder" bracket. Octave 4 by default.
  focusOctave = 4,
  // Whether the LED line should beat-pulse
  beat = true,
}) {
  // 88 keys: MIDI 21 (A0) → 108 (C8). 52 white, 36 black.
  const PC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const isBlackPC = (pc) => [1,3,6,8,10].includes(pc);

  // Build white-key list
  const whites = [];
  const blacks = [];
  for (let m = 21; m <= 108; m++) {
    const pc = m % 12;
    const oct = Math.floor(m / 12) - 1;
    if (isBlackPC(pc)) blacks.push({ midi:m, pc, oct, name: PC[pc]+oct });
    else whites.push({ midi:m, pc, oct, name: PC[pc]+oct });
  }
  const W = whites.length; // 52
  const wW = 8;            // each white key 8 px wide
  const stripW = W * wW;   // 416 px total
  const stripH = 38;
  const ledH = 10;
  const keyH = stripH - ledH;

  // Pitch-class lookup
  const lit = (pcName) => litPCs.includes(pcName);
  const pcFromName = (n) => PC.indexOf(n);
  const litPCIdx = new Set(litPCs.map(pcFromName));

  // Focus range: 7 whites of focusOctave + first white of next octave.
  // First white key of octave N is C_N (pc=0)
  const focusStartIdx = whites.findIndex(w => w.oct === focusOctave && w.pc === 0);
  const focusEndIdx   = focusStartIdx + 7; // C of next octave (8 whites total)
  const focusX = focusStartIdx * wW;
  const focusW = (focusEndIdx - focusStartIdx + 1) * wW;

  // Beat pulse: a fast tick state so the lit LEDs visually breathe in unison.
  const [pulse, setPulse] = React.useState(0);
  React.useEffect(() => {
    if (!beat) return;
    const id = setInterval(() => setPulse(p => (p + 1) % 2), 380);
    return () => clearInterval(id);
  }, [beat]);

  // Scroll: center the focus range on mount.
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const center = focusX + focusW/2;
    el.scrollLeft = Math.max(0, center - width/2);
  }, [focusX, focusW, width]);

  return (
    <div style={{
      width, position:'relative',
      background:'#0A0805',
      borderRadius: 10,
      border:'2px solid var(--piano-black)',
      boxShadow:'0 3px 0 #000',
      padding:'4px 4px 6px',
      boxSizing:'border-box',
    }}>
      {/* SLIDE-BAR label */}
      <div style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'1px 4px 3px',
      }}>
        <div style={{ fontSize:9, fontWeight:900, color:'#FFFAEC',
          letterSpacing:'0.14em', textTransform:'uppercase', opacity:0.7 }}>
          88 KEYS · SLIDE TO LOCATE
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ fontSize:9, fontWeight:900, color:'#58CC02',
          letterSpacing:'0.12em', textTransform:'uppercase' }}>
          ◀ A0 ··· C8 ▶
        </div>
      </div>

      <div ref={scrollRef} style={{
        width: '100%', overflowX:'auto', overflowY:'hidden',
        scrollbarWidth:'thin',
      }}>
        <svg viewBox={`0 0 ${stripW} ${stripH}`} width={stripW} height={stripH}
             style={{ display:'block' }}>
          {/* LED row */}
          <rect x="0" y="0" width={stripW} height={ledH} fill="#0A0805"/>
          {/* white-key LEDs */}
          {whites.map((w, i) => {
            const on = litPCIdx.has(w.pc);
            const cx = i*wW + wW/2;
            const cy = ledH/2;
            const r = on ? 2 : 1.1;
            const col = on ? '#58CC02' : '#1A1410';
            return (
              <g key={`wled-${i}`} opacity={on ? (pulse ? 1 : 0.55) : 1}>
                {on && <circle cx={cx} cy={cy} r={r*2.4} fill={col} opacity="0.35"/>}
                <circle cx={cx} cy={cy} r={r} fill={col}/>
              </g>
            );
          })}
          {/* black-key LEDs — offset between two whites */}
          {blacks.map((b, i) => {
            // find the white key immediately BELOW (pc-1)
            const prevWhitePc = b.pc - 1; // valid because black pcs are 1,3,6,8,10
            const whiteIdx = whites.findIndex(w => w.oct === b.oct && w.pc === prevWhitePc);
            if (whiteIdx < 0) return null;
            const cx = (whiteIdx + 1) * wW;
            const cy = ledH/2;
            const on = litPCIdx.has(b.pc);
            const r = on ? 1.8 : 1;
            const col = on ? '#FF9600' : '#241814';
            return (
              <g key={`bled-${i}`} opacity={on ? (pulse ? 1 : 0.55) : 1}>
                {on && <circle cx={cx} cy={cy} r={r*2.2} fill={col} opacity="0.35"/>}
                <circle cx={cx} cy={cy} r={r} fill={col}/>
              </g>
            );
          })}

          {/* white keys */}
          {whites.map((w, i) => {
            const isC = w.pc === 0;
            const isLit = litPCIdx.has(w.pc);
            return (
              <g key={`w-${i}`}>
                <rect x={i*wW} y={ledH} width={wW - 0.4} height={keyH}
                  fill={isLit ? '#E6FFC2' : '#FFFAEC'}
                  stroke="#2A1D11" strokeWidth="0.4"/>
                {isC && (
                  <text x={i*wW + wW/2} y={ledH + keyH - 2} textAnchor="middle"
                    fontSize="5" fontWeight="900" fill="#C2410C"
                    style={{ fontFamily:"Nunito, system-ui, sans-serif" }}>
                    {w.name}
                  </text>
                )}
              </g>
            );
          })}
          {/* black keys */}
          {blacks.map((b, i) => {
            const prevWhitePc = b.pc - 1;
            const whiteIdx = whites.findIndex(w => w.oct === b.oct && w.pc === prevWhitePc);
            if (whiteIdx < 0) return null;
            const x = (whiteIdx + 1) * wW - (wW*0.34);
            const isLit = litPCIdx.has(b.pc);
            return (
              <rect key={`b-${i}`} x={x} y={ledH} width={wW*0.68} height={keyH*0.6}
                fill={isLit ? '#FF9600' : '#1A1410'}/>
            );
          })}

          {/* focus viewfinder bracket — shows what's magnified above */}
          <g pointerEvents="none">
            <rect x={focusX - 1} y={ledH - 2}
              width={focusW + 2} height={keyH + 4}
              fill="none" stroke="#F5B800" strokeWidth="1.6" rx="2"
              style={{ filter:'drop-shadow(0 0 3px rgba(245,184,0,0.7))' }}/>
            {/* top tabs of the bracket */}
            <rect x={focusX - 1} y={ledH - 2} width={focusW + 2} height={2.4} fill="#F5B800" rx="1"/>
            <text x={focusX + focusW/2} y={ledH - 3.5}
              textAnchor="middle" fontSize="5" fontWeight="900" fill="#F5B800"
              style={{ fontFamily:'Nunito, system-ui, sans-serif', letterSpacing:'0.1em' }}>
              MAGNIFIED ABOVE
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// SPEECH BUBBLE
// ───────────────────────────────────────────────────────────────
function SpeechBubble({ children, ttl = "Maestro Penguini" }) {
  return (
    <div style={{ position:'relative', flex:1 }}>
      <div style={{
        background:'#FFFAEC',
        border:'2px solid var(--ink-900)',
        borderRadius:'18px 18px 18px 4px',
        padding:'12px 16px',
        boxShadow:'0 3px 0 var(--ink-900)',
      }}>
        <div style={{ fontSize:11, fontWeight:900, color:'var(--rust)',
          textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
          {ttl}
        </div>
        <div style={{ fontSize:14, fontWeight:700, color:'var(--ink-900)', lineHeight:1.4 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// IN-LESSON SCREEN
// Header: progress + hearts. Body: mascot + bubble + content. Bottom: piano.
// ───────────────────────────────────────────────────────────────
function ScreenLesson({ width = 390, height = 720, hearts = 4 }) {
  return (
    <div className="pp-art pp-paper" style={{
      width, height,
      display:'flex', flexDirection:'column', overflow:'hidden',
    }}>
      {/* top progress bar */}
      <div style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'12px 16px 10px',
      }}>
        <div style={{
          width:30, height:30, borderRadius:'50%',
          background:'#FFFAEC', border:'1.5px solid var(--ink-line)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:20, fontWeight:900, color:'var(--ink-500)',
        }}>×</div>
        <div style={{
          flex:1, height:14, borderRadius:7,
          background:'#F0E4C9',
          overflow:'hidden',
          boxShadow:'inset 0 2px 0 rgba(42,29,17,0.08)',
        }}>
          <div style={{
            width:'55%', height:'100%',
            background:'linear-gradient(180deg,var(--brand) 0%, var(--brand-dark) 100%)',
            borderRadius:7,
            boxShadow:'inset 0 -3px 0 var(--brand-deep), inset 0 3px 0 rgba(255,255,255,0.35)',
            position:'relative',
          }}>
            <div style={{
              position:'absolute', top:2, left:6, right:'30%', height:3,
              background:'rgba(255,255,255,0.5)', borderRadius:2,
            }}/>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
          <HeartIcon size={18}/>
          <span style={{ fontWeight:900, color:'#FF4B4B', fontSize:14 }}>{hearts}</span>
        </div>
      </div>

      {/* mascot + bubble row */}
      <div style={{ display:'flex', gap:10, padding:'4px 16px 10px', alignItems:'flex-end' }}>
        <div style={{
          width:88, height:88, borderRadius:'50%',
          background:'linear-gradient(180deg,#FFE6BA,#E5B987)',
          boxShadow:'0 0 0 3px var(--brand), 0 0 0 6px #FFFAEC',
          display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
          flexShrink: 0, padding: 0,
        }}>
          <MoodCycler
            size={92}
            moods={['teach','idea','conduct','cheer','wow']}
            interval={2600}
            style={{ marginTop: 4 }}
          />
        </div>
        <SpeechBubble>
          Place finger <b style={{color:'var(--rust)'}}>1</b> on C, finger <b style={{color:'var(--rust)'}}>3</b> on E, finger <b style={{color:'var(--rust)'}}>5</b> on G.
          That's a <b style={{color:'var(--brand)'}}>C major chord</b>.
        </SpeechBubble>
      </div>

      {/* current step card */}
      <div style={{
        margin:'4px 16px 10px',
        background:'#FFFAEC',
        border:'1.5px solid var(--ink-line)',
        borderRadius:18,
        padding:'14px 16px',
        boxShadow:'0 3px 0 rgba(42,29,17,0.08)',
      }}>
        <div style={{
          fontSize:11, fontWeight:900, color:'var(--rust)',
          letterSpacing:'0.14em', textTransform:'uppercase',
        }}>NOW · STEP 6 of 11</div>
        <div style={{ fontSize:18, fontWeight:900, color:'var(--ink-900)', marginTop:4 }}>
          Play C–E–G in order
        </div>

        {/* beat ticker */}
        <div style={{ display:'flex', gap:8, marginTop:12, alignItems:'center' }}>
          <div style={{ fontSize:10, fontWeight:900, color:'var(--ink-500)',
            letterSpacing:'0.1em', textTransform:'uppercase' }}>BEAT</div>
          {[1,2,3,4].map(b => (
            <div key={b} style={{
              width:28, height:28, borderRadius:8,
              background: b === 2 ? 'var(--brand)' : '#F0E4C9',
              color: b === 2 ? '#fff' : 'var(--ink-300)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:900,
              boxShadow: b === 2 ? '0 3px 0 var(--brand-deep)' : 'inset 0 -2px 0 rgba(42,29,17,0.08)',
            }}>{b}</div>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:'50%',
              background:'#00C853', boxShadow:'0 0 8px #00C853' }}/>
            <span style={{ fontSize:11, fontWeight:900, color:'var(--ink-500)' }}>
              LEDs CONNECTED
            </span>
          </div>
        </div>

        {/* chord chips */}
        <div style={{ display:'flex', gap:6, marginTop:10 }}>
          {['C','E','G'].map((n,i) => (
            <div key={n} style={{
              padding:'4px 12px', borderRadius:8,
              background: i === 0 ? 'var(--brand)' : '#F0E4C9',
              color: i === 0 ? '#fff' : 'var(--ink-500)',
              fontSize:13, fontWeight:900,
              border: i === 0 ? 'none' : '1px solid var(--ink-line)',
            }}>{n}</div>
          ))}
          <div style={{ marginLeft:'auto', fontSize:11, fontWeight:900,
            color:'var(--ink-500)', alignSelf:'center' }}>
            ♩ = 80 BPM
          </div>
        </div>
      </div>

      {/* spacer */}
      <div style={{ flex:1 }}/>

      {/* piano keyboard area — 8-key magnified + 88-key slide bar */}
      <div style={{
        padding:'8px 16px 14px',
        background:'linear-gradient(180deg, transparent, rgba(42,29,17,0.08))',
        display:'flex', flexDirection:'column', gap:8,
      }}>
        <BigPiano
          width={358} height={148}
          lit={{ C:'green' }}
          fingerHints={{ C:1, E:3, G:5 }}
        />
        <Mini88Keyboard
          width={358}
          litPCs={['C','E','G']}
          focusOctave={4}
        />
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// LANDSCAPE LESSON — for iPhone/Android in horizontal mode.
// Cat + step info on the left, big keyboard on the right/bottom.
// ───────────────────────────────────────────────────────────────
function ScreenLessonLandscape({ width = 844, height = 390, hearts = 4 }) {
  return (
    <div className="pp-art pp-paper" style={{
      width, height,
      display:'flex', flexDirection:'column', overflow:'hidden',
    }}>
      {/* slim top progress bar */}
      <div style={{
        display:'flex', alignItems:'center', gap:14,
        padding:'10px 22px 8px',
        borderBottom:'1px solid var(--ink-line)',
      }}>
        <div style={{
          width:26, height:26, borderRadius:'50%',
          background:'#FFFAEC', border:'1.5px solid var(--ink-line)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:18, fontWeight:900, color:'var(--ink-500)',
        }}>×</div>
        <div style={{ fontSize:11, fontWeight:900, color:'var(--ink-500)',
          letterSpacing:'0.14em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
          L3 · HALF &amp; WHOLE · STEP 6/11
        </div>
        <div style={{
          flex:1, height:12, borderRadius:6, background:'#F0E4C9',
          boxShadow:'inset 0 2px 0 rgba(42,29,17,0.08)', overflow:'hidden',
        }}>
          <div style={{
            width:'55%', height:'100%',
            background:'linear-gradient(180deg,var(--brand) 0%, var(--brand-dark) 100%)',
            boxShadow:'inset 0 -3px 0 var(--brand-deep), inset 0 3px 0 rgba(255,255,255,0.35)',
            borderRadius:6,
          }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <HeartIcon size={16}/>
          <span style={{ fontWeight:900, color:'#FF4B4B', fontSize:13 }}>{hearts}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, marginLeft:6 }}>
          <div style={{ width:7, height:7, borderRadius:'50%',
            background:'#00C853', boxShadow:'0 0 8px #00C853' }}/>
          <span style={{ fontSize:10, fontWeight:900, color:'var(--ink-500)',
            letterSpacing:'0.08em' }}>LEDs ON</span>
        </div>
      </div>

      {/* body: left teacher panel + right keyboard stack */}
      <div style={{
        flex:1, display:'flex', overflow:'hidden',
      }}>
        {/* LEFT: cat + bubble + beat */}
        <div style={{
          width: width * 0.38,
          padding:'12px 14px 10px 22px',
          display:'flex', flexDirection:'column', gap:8,
          borderRight:'1.5px solid var(--ink-line)',
        }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
            <div style={{
              width:72, height:72, borderRadius:'50%',
              background:'linear-gradient(180deg,#FFE6BA,#E5B987)',
              boxShadow:'0 0 0 3px var(--brand), 0 0 0 5px #FFFAEC',
              display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
              flexShrink:0,
            }}>
              <MoodCycler
                size={76}
                moods={['teach','idea','conduct','cheer']}
                interval={2600}
              />
            </div>
            <SpeechBubble>
              C–E–G is the <b style={{color:'var(--brand)'}}>C-major chord</b>.
              Thumb on C, middle on E, pinky on G.
            </SpeechBubble>
          </div>

          {/* compact beat ticker */}
          <div style={{
            background:'#FFFAEC',
            border:'1.5px solid var(--ink-line)',
            borderRadius:14,
            padding:'8px 10px',
            display:'flex', flexDirection:'column', gap:6,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ fontSize:10, fontWeight:900, color:'var(--ink-500)',
                letterSpacing:'0.1em' }}>BEAT</div>
              {[1,2,3,4].map(b => (
                <div key={b} style={{
                  width:22, height:22, borderRadius:6,
                  background: b === 2 ? 'var(--brand)' : '#F0E4C9',
                  color: b === 2 ? '#fff' : 'var(--ink-300)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:900,
                  boxShadow: b === 2 ? '0 2px 0 var(--brand-deep)' : 'none',
                }}>{b}</div>
              ))}
              <div style={{ marginLeft:'auto', fontSize:10, fontWeight:900, color:'var(--ink-500)' }}>
                ♩=80
              </div>
            </div>
            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
              {['C','E','G'].map((n,i) => (
                <div key={n} style={{
                  padding:'3px 9px', borderRadius:6,
                  background: i === 0 ? 'var(--brand)' : '#F0E4C9',
                  color: i === 0 ? '#fff' : 'var(--ink-500)',
                  fontSize:11, fontWeight:900,
                  border: i === 0 ? 'none' : '1px solid var(--ink-line)',
                }}>{n}</div>
              ))}
              <button className="btn-chunk" style={{
                marginLeft:'auto', padding:'6px 14px', fontSize:11, borderRadius:8,
              }}>I PLAYED IT</button>
            </div>
          </div>
        </div>

        {/* RIGHT: piano area */}
        <div style={{
          flex:1, padding:'10px 18px 12px',
          display:'flex', flexDirection:'column', gap:8,
          background:'linear-gradient(180deg, transparent, rgba(42,29,17,0.08))',
          minWidth: 0,
        }}>
          <BigPiano
            width={width * 0.6 - 36}
            height={Math.min(170, height - 130)}
            lit={{ C:'green' }}
            fingerHints={{ C:1, E:3, G:5 }}
          />
          <Mini88Keyboard
            width={width * 0.6 - 36}
            litPCs={['C','E','G']}
            focusOctave={4}
          />
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// LESSON COMPLETE
// ───────────────────────────────────────────────────────────────
function ScreenComplete({ width = 390, height = 720 }) {
  return (
    <div className="pp-art" style={{
      width, height,
      background:'linear-gradient(180deg, #FFE6BA 0%, var(--cream-50) 60%)',
      display:'flex', flexDirection:'column', overflow:'hidden',
      position:'relative',
    }}>
      {/* confetti */}
      <svg viewBox="0 0 390 720" width={width} height={height}
           style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        {Array.from({length: 30}).map((_, i) => {
          const colors = ['#58CC02','#F5B800','#FF7A9C','#5BB8E3','#C2410C'];
          const x = (i * 23 + 13) % 390;
          const y = ((i * 41) % 360) + 30;
          const rot = (i * 47) % 360;
          const c = colors[i % colors.length];
          return i % 2 === 0
            ? <rect key={i} x={x} y={y} width="8" height="3" fill={c} transform={`rotate(${rot} ${x+4} ${y+1.5})`}/>
            : <circle key={i} cx={x} cy={y} r="3" fill={c}/>;
        })}
      </svg>

      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', textAlign:'center',
        padding:'40px 28px 0', position:'relative', zIndex:2,
      }}>
        {/* trophy ring with maestro celebrating */}
        <div style={{
          width:210, height:210, borderRadius:'50%',
          background:'radial-gradient(circle, #FFFAEC 0%, #FFE6BA 80%)',
          border:'5px solid var(--butter)',
          boxShadow:'0 0 0 5px #FFFAEC, 0 8px 0 var(--butter-d), 0 0 60px rgba(245,184,0,0.45)',
          display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom:24,
          position:'relative', overflow:'hidden',
        }}>
          <ProfessorCatHero size={200} mood="trophy" animate="bob"/>
          {/* sparkle stars around the ring */}
          {[[-14,30],[210,40],[-20,170],[210,160]].map(([x,y],i)=>(
            <div key={i} style={{
              position:'absolute', left:x, top:y,
            }}>
              <StarIcon size={22}/>
            </div>
          ))}
        </div>

        <div style={{
          fontSize:13, fontWeight:900, color:'var(--rust)',
          letterSpacing:'0.18em', textTransform:'uppercase',
        }}>LESSON 1 · COMPLETE</div>
        <h1 style={{ fontSize:36, color:'var(--ink-900)', margin:'6px 0 8px' }}>
          Encore! 🎹
        </h1>
        <p style={{ fontSize:15, fontWeight:700, color:'var(--ink-500)', maxWidth:280, lineHeight:1.5, marginBottom:18 }}>
          You played your first chord. The Maestro is taking a bow.
        </p>

        {/* stars row */}
        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          <StarBig active/><StarBig active/><StarBig />
        </div>

        {/* stat rows */}
        <div style={{ width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
          <StatCard label="TOTAL XP" value="+50" color="var(--butter)" sub="Tempo points"/>
          <StatCard label="ACCURACY" value="92%" color="var(--brand)" sub="9 of 10"/>
          <StatCard label="TIME" value="4:12" color="var(--sky)" sub="Quick!"/>
          <StatCard label="STREAK" value="8 🔥" color="var(--rust)" sub="+1 day"/>
        </div>
      </div>

      <div style={{ padding:'10px 24px 28px', position:'relative', zIndex:2 }}>
        <button className="btn-chunk lg" style={{ width:'100%' }}>CONTINUE</button>
        <div style={{ display:'flex', justifyContent:'center', marginTop:10 }}>
          <span style={{ fontSize:13, fontWeight:800, color:'var(--ink-500)' }}>
            Share with the class →
          </span>
        </div>
      </div>
    </div>
  );
}

function StarBig({ active }) {
  return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: active ? 'var(--butter)' : '#F0E4C9',
      border: `3px solid ${active ? 'var(--butter-d)' : 'var(--ink-line)'}`,
      boxShadow: active ? '0 4px 0 var(--butter-d), 0 0 18px rgba(245,184,0,0.4)' : '0 3px 0 rgba(42,29,17,0.08)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <StarIcon size={30} color={active ? '#fff' : 'var(--ink-300)'}/>
    </div>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div className="pp-card" style={{ padding:'12px 14px' }}>
      <div style={{ fontSize:10, fontWeight:900, color:'var(--ink-500)',
        letterSpacing:'0.12em', textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:900, color, lineHeight:1.05, marginTop:2 }}>
        {value}
      </div>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-500)', marginTop:2 }}>{sub}</div>
    </div>
  );
}

Object.assign(window, { ScreenLesson, ScreenLessonLandscape, ScreenComplete, BigPiano, SpeechBubble, Mini88Keyboard });
