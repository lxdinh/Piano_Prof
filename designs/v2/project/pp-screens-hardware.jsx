// Piano Professor — LED Hardware Pairing flow + Settings

// ───────────────────────────────────────────────────────────────
// Drawing of the physical LED strip + controller (used as hero art)
// ───────────────────────────────────────────────────────────────
function LedStripArt({ width = 320, height = 200, glow = true, ledColors = null }) {
  // generate 32 LEDs across the strip width with glowing colors
  const defaults = ['#58CC02','#5BB8E3','#FF7A9C','#F5B800','#C2410C','#8B5CF6'];
  const leds = Array.from({length: 32}, (_, i) => (ledColors?.[i]) || defaults[i % defaults.length]);
  return (
    <svg viewBox="0 0 320 200" width={width} height={height}>
      <defs>
        <radialGradient id="ledGlow">
          <stop offset="0%" stopColor="#fff" stopOpacity="1"/>
          <stop offset="40%" stopColor="#fff" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="pianoBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A2818"/>
          <stop offset="1" stopColor="#1A1410"/>
        </linearGradient>
      </defs>

      {/* shadow */}
      <ellipse cx="160" cy="190" rx="120" ry="6" fill="rgba(42,29,17,0.18)"/>

      {/* controller block (left) */}
      <g transform="translate(8,108)">
        <rect width="48" height="42" rx="6" fill="url(#pianoBody)" stroke="#000" strokeWidth="0.5"/>
        <rect x="6" y="6" width="20" height="14" rx="2" fill="#0A0805"/>
        {/* USB-C port */}
        <rect x="-6" y="14" width="6" height="14" rx="2" fill="#222"/>
        {/* status LED */}
        <circle cx="38" cy="12" r="3" fill="#58CC02">
          {glow && <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite"/>}
        </circle>
        <text x="24" y="34" textAnchor="middle" fontSize="6" fontWeight="900" fill="#888"
              fontFamily="Nunito, system-ui">PIANO PROF</text>
      </g>

      {/* led strip body */}
      <g transform="translate(56,120)">
        <rect width="256" height="22" rx="3" fill="url(#pianoBody)" stroke="#000" strokeWidth="0.5"/>
        {/* LEDs */}
        {leds.map((c, i) => {
          const x = 6 + i * (244/32);
          return (
            <g key={i}>
              {glow && (
                <circle cx={x+3} cy={11} r="12" fill={c} opacity="0.35"/>
              )}
              <circle cx={x+3} cy={11} r="3" fill={c}/>
              <circle cx={x+3} cy={11} r="1.4" fill="#fff"/>
            </g>
          );
        })}
      </g>

      {/* piano keys below (5 octave hint, shown as a strip) */}
      <g transform="translate(56,148)">
        {Array.from({length: 35}).map((_, i) => (
          <rect key={i} x={i*7.3} y={0} width={7} height={40} fill="#FFFAEC" stroke="#000" strokeWidth="0.4"/>
        ))}
        {/* black keys */}
        {[0,1,3,4,5,7,8,10,11,12,14,15,17,18,19,21,22,24,25,26,28,29,31,32,33].map(i => (
          <rect key={i} x={i*7.3 + 5} y={0} width={4.6} height={22} fill="#1A1410"/>
        ))}
      </g>
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────
// HARDWARE — State 1: discover ("Connect your Piano Lights")
// ───────────────────────────────────────────────────────────────
function ScreenHwDiscover({ width = 390, height = 720 }) {
  return (
    <div className="pp-art pp-paper" style={{ width, height, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <PPHeader section="Piano Lights" streak={12} xp={3240} hearts={4} gems={142}/>

      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 70px' }}>
        <div style={{ textAlign:'center', marginBottom:6 }}>
          <div style={{ fontSize:11, fontWeight:900, color:'var(--rust)', letterSpacing:'0.18em' }}>
            STEP 1 OF 3 · CONNECT
          </div>
          <h2 style={{ fontSize:24, marginTop:6, marginBottom:6 }}>Plug in your Piano Lights</h2>
          <p style={{ fontSize:14, fontWeight:700, color:'var(--ink-500)', maxWidth:300, margin:'0 auto', lineHeight:1.5 }}>
            Stick the strip above your keys and connect the USB-C cable. The status dot turns green when ready.
          </p>
        </div>

        <div style={{ display:'flex', justifyContent:'center', marginTop:14 }}>
          <LedStripArt width={340} height={210} glow/>
        </div>

        {/* search card */}
        <div className="pp-card" style={{ padding:'14px 16px', marginTop:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:48, height:48, borderRadius:'50%',
              background:'var(--sky)', color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 3px 0 var(--sky-dark)',
              position:'relative',
            }}>
              <BluetoothIcon size={22}/>
              {/* expanding ring */}
              <span style={{
                position:'absolute', inset:-4, borderRadius:'50%',
                border:'2px solid var(--sky)', opacity:0.55,
                animation:'ppPulse 1.6s ease-out infinite',
              }}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:900 }}>Searching nearby…</div>
              <div style={{ fontSize:11.5, fontWeight:700, color:'var(--ink-500)' }}>
                Bluetooth is on. Holding the BOOT button helps.
              </div>
            </div>
            <div style={{
              width:28, height:28, borderRadius:'50%',
              border:'3px solid var(--ink-line)',
              borderTopColor:'var(--sky)',
              animation:'spin 1s linear infinite',
            }}/>
          </div>

          {/* found device row */}
          <div style={{
            marginTop:14, paddingTop:14, borderTop:'1.5px dashed var(--ink-line)',
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{
              width:40, height:40, borderRadius:10,
              background:'var(--ink-900)', color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:900,
            }}>PP</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:900 }}>Piano-Prof-A8F2</div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--brand)' }}>
                ● Discoverable · signal strong
              </div>
            </div>
            <button className="btn-chunk" style={{ padding:'8px 14px', fontSize:12 }}>
              PAIR
            </button>
          </div>
        </div>

        {/* help row */}
        <div style={{
          marginTop:14,
          display:'flex', alignItems:'center', gap:10,
          padding:'10px 14px',
          background:'#FFE6BA',
          border:'1.5px dashed var(--butter-d)',
          borderRadius:14,
        }}>
          <div style={{ fontSize:18 }}>💡</div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--ink-700)' }}>
            <b>No device showing?</b> Hold BOOT for 3s while plugging in USB-C.
          </div>
        </div>
      </div>

      <PPTabBar active="led"/>

      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// HARDWARE — State 2: pairing in progress
// ───────────────────────────────────────────────────────────────
function ScreenHwPairing({ width = 390, height = 720 }) {
  return (
    <div className="pp-art pp-paper" style={{ width, height, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <PPHeader section="Piano Lights" streak={12} xp={3240} hearts={4} gems={142}/>

      <div style={{ flex:1, padding:'16px 20px', display:'flex', flexDirection:'column' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:11, fontWeight:900, color:'var(--rust)', letterSpacing:'0.18em' }}>
            STEP 2 OF 3 · CALIBRATING
          </div>
          <h2 style={{ fontSize:24, marginTop:6 }}>Press the highlighted keys</h2>
          <p style={{ fontSize:14, fontWeight:700, color:'var(--ink-500)', marginTop:6, lineHeight:1.5 }}>
            We need to learn where your octaves start. Tap each green key on the LED strip.
          </p>
        </div>

        <div style={{ marginTop:18, display:'flex', justifyContent:'center' }}>
          <LedStripArt width={340} height={210}
            ledColors={[
              '#222','#222','#222','#222','#58CC02','#222','#222','#222',
              '#222','#222','#222','#222','#222','#222','#222','#222',
              '#58CC02','#222','#222','#222','#222','#222','#222','#222',
              '#222','#222','#222','#58CC02','#222','#222','#222','#222',
            ]}/>
        </div>

        {/* progress steps */}
        <div className="pp-card" style={{ padding:'14px 16px', marginTop:6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontSize:14, fontWeight:900 }}>Calibration</div>
            <div style={{ fontSize:12, fontWeight:900, color:'var(--brand)' }}>2 / 3 keys</div>
          </div>
          {[
            { name:'Press the LEFT-most green key',  done:true  },
            { name:'Press the MIDDLE green key',     done:true  },
            { name:'Press the RIGHT-most green key', done:false, active:true },
          ].map((step,i)=>(
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'10px 0',
              borderTop: i ? '1px solid var(--ink-line)' : 'none',
              opacity: step.done ? 0.5 : 1,
            }}>
              <div style={{
                width:28, height:28, borderRadius:'50%',
                background: step.done ? 'var(--brand)' : step.active ? '#FFE6BA' : '#F0E4C9',
                border: step.active ? '2.5px dashed var(--butter-d)' : 'none',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontWeight:900,
              }}>
                {step.done && <CheckIcon size={16}/>}
                {step.active && <span style={{ color:'var(--ink-900)', fontSize:13 }}>{i+1}</span>}
              </div>
              <div style={{ fontSize:13, fontWeight:800,
                color: step.active ? 'var(--ink-900)' : 'var(--ink-500)' }}>
                {step.name}
              </div>
              {step.active && (
                <div style={{ marginLeft:'auto', width:8, height:8, borderRadius:'50%',
                  background:'var(--brand)',
                  boxShadow:'0 0 0 0 rgba(88,204,2,0.6)',
                  animation:'ppPulse 1.4s ease-out infinite' }}/>
              )}
            </div>
          ))}
        </div>

        <div style={{ flex:1 }}/>
        <button className="btn-chunk ghost" style={{ width:'100%' }}>SKIP CALIBRATION</button>
      </div>

      <PPTabBar active="led"/>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// HARDWARE — State 3: connected ("Piano Lights are ON")
// ───────────────────────────────────────────────────────────────
function ScreenHwConnected({ width = 390, height = 720 }) {
  return (
    <div className="pp-art" style={{
      width, height,
      background:'linear-gradient(180deg,#0F1117 0%, #1A1F2E 70%, var(--cream-50) 100%)',
      color:'#fff',
      display:'flex', flexDirection:'column', overflow:'hidden',
      position:'relative',
    }}>
      {/* deco starry dots */}
      <svg viewBox="0 0 390 720" width="100%" height="100%" preserveAspectRatio="none"
           style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        {Array.from({length:60}).map((_,i)=>(
          <circle key={i} cx={(i*47)%390} cy={(i*73)%500} r={0.8 + (i%3)*0.4}
            fill="#fff" opacity={0.15 + (i%5)*0.1}/>
        ))}
      </svg>

      <div style={{ padding:'16px 20px 0', position:'relative', display:'flex', justifyContent:'space-between' }}>
        <div style={{ fontSize:13, fontWeight:900, color:'#5BB8E3', letterSpacing:'0.16em' }}>‹ BACK</div>
        <div style={{ fontSize:13, fontWeight:900, opacity:0.6 }}>SETTINGS</div>
      </div>

      <div style={{ flex:1, padding:'30px 20px 0', position:'relative', display:'flex', flexDirection:'column' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'rgba(88,204,2,0.18)', color:'#58CC02',
            padding:'5px 12px', borderRadius:999,
            fontSize:11, fontWeight:900, letterSpacing:'0.16em',
            border:'1px solid rgba(88,204,2,0.4)',
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#58CC02',
              boxShadow:'0 0 8px #58CC02' }}/>
            CONNECTED · 60 LEDs
          </div>
          <h1 style={{ fontSize:30, color:'#fff', marginTop:14 }}>
            Your piano just woke up.
          </h1>
          <p style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.7)', maxWidth:320,
            margin:'8px auto 0', lineHeight:1.5 }}>
            Piano-Prof-A8F2 is online. Every lesson now lights up the keys above your hand.
          </p>
        </div>

        {/* the lit strip — full color rainbow demo */}
        <div style={{ marginTop:20, display:'flex', justifyContent:'center' }}>
          <LedStripArt width={340} height={210} glow
            ledColors={(() => {
              const arr = [];
              const cs = ['#FF4B4B','#FF9600','#F5B800','#58CC02','#5BB8E3','#8B5CF6','#FF7A9C'];
              for (let i=0;i<32;i++) arr.push(cs[(i + Math.floor(i/4))%cs.length]);
              return arr;
            })()}/>
        </div>

        {/* status grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:14 }}>
          <DarkStat val="60" lbl="LEDs"/>
          <DarkStat val="-42 dB" lbl="SIGNAL"/>
          <DarkStat val="100%" lbl="BATTERY"/>
        </div>

        <div style={{ flex:1 }}/>
      </div>

      <div style={{ padding:'14px 20px 24px', position:'relative' }}>
        <button className="btn-chunk lg" style={{ width:'100%' }}>
          START YOUR FIRST LIT LESSON
        </button>
        <div style={{ display:'flex', justifyContent:'center', marginTop:10 }}>
          <span style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.55)' }}>
            Run light show test →
          </span>
        </div>
      </div>
    </div>
  );
}

function DarkStat({ val, lbl }) {
  return (
    <div style={{
      background:'rgba(255,255,255,0.06)',
      border:'1px solid rgba(255,255,255,0.12)',
      borderRadius:14, padding:'10px 0', textAlign:'center',
    }}>
      <div style={{ fontSize:20, fontWeight:900, color:'#fff' }}>{val}</div>
      <div style={{ fontSize:9, fontWeight:900, opacity:0.6, letterSpacing:'0.1em' }}>{lbl}</div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// SETTINGS
// ───────────────────────────────────────────────────────────────
function ScreenSettings({ width = 390, height = 720 }) {
  return (
    <div className="pp-art pp-paper" style={{ width, height, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{
        padding:'14px 18px 12px',
        background:'#FFFAEC',
        borderBottom:'1.5px solid var(--ink-line)',
        display:'flex', alignItems:'center', gap:8,
      }}>
        <span style={{ fontSize:20, fontWeight:900, color:'var(--ink-700)' }}>‹</span>
        <h2 style={{ fontSize:18 }}>Settings</h2>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 70px' }}>
        <SettingsGroup title="Account">
          <SettingRow icon="👤" title="maya_keys" sub="maya@piano.prof"/>
          <SettingRow icon="🎓" title="Skill level" right="Grade 4 ›"/>
          <SettingRow icon="⏰" title="Daily reminder" right="6:30 PM ›"/>
        </SettingsGroup>

        <SettingsGroup title="Piano Lights (LED Hardware)">
          <SettingRow icon="🎹" title="Piano-Prof-A8F2"
            sub={<><span style={{ color:'var(--brand)' }}>●</span> Connected · 60 LEDs</>}
            right="DISCONNECT" rightAccent="var(--rust)"/>
          <SettingRow icon="✨" title="Light brightness" right="80% ›"/>
          <SettingRow icon="🎨" title="Color theme" right="Rainbow ›"/>
          <SettingRow icon="🔧" title="Re-calibrate keys" right="›"/>
        </SettingsGroup>

        <SettingsGroup title="Sound & Practice">
          <SettingRow icon="🔊" title="Voice volume" right="MED ›"/>
          <SettingRow icon="🎧" title="Instructor voice" right="Penguini ›"/>
          <SettingRow icon="🎼" title="Metronome ticks" right="Wood ›"/>
          <SettingToggle icon="🎵" title="Auto-play examples" on/>
        </SettingsGroup>

        <SettingsGroup title="App">
          <SettingToggle icon="🌙" title="Dark mode" on={false}/>
          <SettingRow icon="🌍" title="Language" right="English ›"/>
          <SettingRow icon="❓" title="Help center" right="›"/>
          <SettingRow icon="📜" title="Terms & privacy" right="›"/>
        </SettingsGroup>

        <div style={{ marginTop:18, textAlign:'center' }}>
          <button className="btn-chunk ghost" style={{ width:'100%', color:'var(--rust)' }}>
            SIGN OUT
          </button>
          <div style={{ fontSize:10, fontWeight:800, color:'var(--ink-300)', marginTop:14, letterSpacing:'0.08em' }}>
            Piano Professor v2.4.0 · made with ♥ for slow learners
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{
        fontSize:10, fontWeight:900, color:'var(--ink-500)',
        textTransform:'uppercase', letterSpacing:'0.16em',
        margin:'0 4px 8px',
      }}>{title}</div>
      <div style={{
        background:'#FFFAEC', borderRadius:16,
        border:'1.5px solid var(--ink-line)',
        overflow:'hidden',
      }}>{children}</div>
    </div>
  );
}

function SettingRow({ icon, title, sub, right, rightAccent }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'12px 14px',
      borderTop:'1px solid var(--ink-line)',
    }}>
      <div style={{
        width:34, height:34, borderRadius:10,
        background:'#FFE6BA', display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:18,
      }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:900 }}>{title}</div>
        {sub && <div style={{ fontSize:11.5, fontWeight:700, color:'var(--ink-500)' }}>{sub}</div>}
      </div>
      {right && (
        <div style={{ fontSize:12, fontWeight:900, color: rightAccent || 'var(--ink-500)',
          letterSpacing:'0.04em' }}>{right}</div>
      )}
    </div>
  );
}

function SettingToggle({ icon, title, on }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'12px 14px',
      borderTop:'1px solid var(--ink-line)',
    }}>
      <div style={{
        width:34, height:34, borderRadius:10,
        background:'#FFE6BA', display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:18,
      }}>{icon}</div>
      <div style={{ flex:1, fontSize:14, fontWeight:900 }}>{title}</div>
      <div style={{
        width:48, height:28, borderRadius:14,
        background: on ? 'var(--brand)' : '#DFCB97',
        position:'relative',
        boxShadow: on ? '0 2px 0 var(--brand-dark)' : 'inset 0 2px 0 rgba(42,29,17,0.1)',
      }}>
        <div style={{
          width:22, height:22, borderRadius:'50%',
          background:'#fff',
          position:'absolute', top:3, left: on ? 23 : 3,
          boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
        }}/>
      </div>
    </div>
  );
}

Object.assign(window, {
  ScreenHwDiscover, ScreenHwPairing, ScreenHwConnected, ScreenSettings,
  LedStripArt,
});
