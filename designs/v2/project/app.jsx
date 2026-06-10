// Piano Professor — App composition (Design Canvas)
// Each artboard wraps a screen in the appropriate device frame.

const { useState, useEffect } = React;

// Pull frame components from globals (set by ios-frame / android-frame)
const Ios = window.IOSDevice;
const Andy = window.AndroidDevice;

// ───────────────────────────────────────────────────────────────
// Phone-sized wrappers
// ───────────────────────────────────────────────────────────────
function IphoneFrame({ children, dark = false, landscape = false }) {
  // Portrait: 390x844. Landscape: swap.
  const w = landscape ? 844 : 390;
  const h = landscape ? 390 : 844;
  return (
    <Ios width={w} height={h} dark={dark}>
      <div style={{
        paddingTop: landscape ? 36 : 60,
        height:'100%', boxSizing:'border-box',
      }}>
        {children}
      </div>
    </Ios>
  );
}
function AndroidFrame({ children, dark = false, landscape = false }) {
  const w = landscape ? 892 : 412;
  const h = landscape ? 412 : 892;
  return (
    <Andy width={w} height={h} dark={dark}>
      <div style={{ height:'100%' }}>{children}</div>
    </Andy>
  );
}

// Each phone screen is 390x720-ish; we tell the screen its inner size.
const IP_W = 390;
const IP_H = 740;  // = 844 - status 64 - home 40

const AND_W = 412;
const AND_H = 776; // = 892 - status 40 - nav 24 - app bar/padding

// Landscape inner dimensions (device dims swapped, minus chrome)
const IP_W_LS = 844;
const IP_H_LS = 320;   // 390 - status 36 - home 34
const AND_W_LS = 892;
const AND_H_LS = 348;  // 412 - status/nav chrome

// ───────────────────────────────────────────────────────────────
// Tweaks defaults — persisted between sessions
// ───────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "streak": 12,
  "xp": 3240,
  "hearts": 4,
  "gems": 142,
  "current": 3,
  "frame": "iphone"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Decide what wrapper to use per artboard, based on the tweak
  // OR per artboard intrinsic device.
  // We expose a `frame` switch for the main row but most artboards specify their own frame.

  return (
    <>
      <TweaksPanel title="Tweaks">
        <TweakSection title="Numbers">
          <TweakSlider label="Streak (days)"  value={t.streak}  onChange={v=>setTweak('streak',v)}  min={0} max={365}/>
          <TweakSlider label="Total XP"        value={t.xp}      onChange={v=>setTweak('xp',v)}      min={0} max={10000} step={10}/>
          <TweakSlider label="Hearts (0–5)"    value={t.hearts}  onChange={v=>setTweak('hearts',v)}  min={0} max={5}/>
          <TweakSlider label="Gems"            value={t.gems}    onChange={v=>setTweak('gems',v)}    min={0} max={9999}/>
          <TweakSlider label="Current lesson"  value={t.current} onChange={v=>setTweak('current',v)} min={1} max={12}/>
        </TweakSection>
        <TweakSection title="Device">
          <TweakRadio label="Phone frame"
            value={t.frame}
            options={[
              { value:'iphone', label:'iPhone' },
              { value:'android', label:'Android' },
            ]}
            onChange={v=>setTweak('frame',v)}/>
        </TweakSection>
      </TweaksPanel>

      <DesignCanvas>
        {/* ============================================================
            1. ONBOARDING & WELCOME
        ============================================================ */}
        <DCSection id="onboarding" title="01 · Onboarding & Welcome"
          subtitle="First-launch hero. Cat mascot front and center.">
          <DCArtboard id="ob-iphone" label="iPhone · Welcome" width={420} height={870}>
            <DeviceFrame kind={t.frame}>
              <ScreenOnboarding width={t.frame==='android'?AND_W:IP_W} height={t.frame==='android'?AND_H:IP_H}/>
            </DeviceFrame>
          </DCArtboard>
        </DCSection>

        {/* ============================================================
            2. LESSON PATH — TWO VARIANTS
        ============================================================ */}
        <DCSection id="path-variants" title="02 · Lesson Path — two takes"
          subtitle="Variant A: notes on a treble staff. Variant B: piano keys laid vertically.">
          <DCArtboard id="path-staff" label="A · Sheet-music staff path"
            width={420} height={870}>
            <DeviceFrame kind={t.frame}>
              <ScreenPathStaff
                width={t.frame==='android'?AND_W:IP_W}
                height={t.frame==='android'?AND_H:IP_H}
                streak={t.streak} xp={t.xp} hearts={t.hearts} gems={t.gems} current={t.current}/>
            </DeviceFrame>
          </DCArtboard>
          <DCArtboard id="path-keys" label="B · Piano-key ladder path"
            width={420} height={870}>
            <DeviceFrame kind={t.frame}>
              <ScreenPathKeys
                width={t.frame==='android'?AND_W:IP_W}
                height={t.frame==='android'?AND_H:IP_H}
                streak={t.streak} xp={t.xp} hearts={t.hearts} gems={t.gems} current={t.current}/>
            </DeviceFrame>
          </DCArtboard>
        </DCSection>

        {/* ============================================================
            3. INSIDE A LESSON
        ============================================================ */}
        <DCSection id="inside" title="03 · Inside a Lesson"
          subtitle="Mascot teaches, piano lights show, beat ticks. The 8-key magnified view sits above a slidable 88-key strip so the student can locate any key on a real piano.">
          <DCArtboard id="lesson-iphone" label="iPhone · Lesson playing"
            width={420} height={870}>
            <DeviceFrame kind="iphone">
              <ScreenLesson width={IP_W} height={IP_H} hearts={t.hearts}/>
            </DeviceFrame>
          </DCArtboard>
          <DCArtboard id="lesson-android" label="Android · Lesson playing"
            width={440} height={920}>
            <DeviceFrame kind="android">
              <ScreenLesson width={AND_W} height={AND_H} hearts={t.hearts}/>
            </DeviceFrame>
          </DCArtboard>
        </DCSection>

        {/* ============================================================
            3b. LESSON — LANDSCAPE (phones held sideways)
        ============================================================ */}
        <DCSection id="inside-landscape" title="03b · Lesson · Landscape phones"
          subtitle="For students without a tablet: rotate the phone for an iPad-style split — cat + step on the left, full keyboard on the right.">
          <DCArtboard id="lesson-iphone-ls" label="iPhone · Landscape"
            width={880} height={420}>
            <DeviceFrame kind="iphone" landscape>
              <ScreenLessonLandscape width={IP_W_LS} height={IP_H_LS} hearts={t.hearts}/>
            </DeviceFrame>
          </DCArtboard>
          <DCArtboard id="lesson-android-ls" label="Android · Landscape"
            width={930} height={440}>
            <DeviceFrame kind="android" landscape>
              <ScreenLessonLandscape width={AND_W_LS} height={AND_H_LS} hearts={t.hearts}/>
            </DeviceFrame>
          </DCArtboard>
        </DCSection>

        {/* ============================================================
            4. LESSON COMPLETE
        ============================================================ */}
        <DCSection id="complete" title="04 · Lesson Complete"
          subtitle="Confetti, stars, stats, encore.">
          <DCArtboard id="complete-iphone" label="iPhone · Encore" width={420} height={870}>
            <DeviceFrame kind={t.frame}>
              <ScreenComplete
                width={t.frame==='android'?AND_W:IP_W}
                height={t.frame==='android'?AND_H:IP_H}/>
            </DeviceFrame>
          </DCArtboard>
        </DCSection>

        {/* ============================================================
            5. DAILY WARM-UP / STREAK
        ============================================================ */}
        <DCSection id="warmup" title="05 · Daily Warm-up & Streak"
          subtitle="The 'show up daily' driver — quests + 30-day streak goal.">
          <DCArtboard id="quests-iphone" label="iPhone · Warm-up" width={420} height={870}>
            <DeviceFrame kind={t.frame}>
              <ScreenQuests
                width={t.frame==='android'?AND_W:IP_W}
                height={t.frame==='android'?AND_H:IP_H}/>
            </DeviceFrame>
          </DCArtboard>
        </DCSection>

        {/* ============================================================
            6. PROFILE
        ============================================================ */}
        <DCSection id="profile" title="06 · Profile & Stats"
          subtitle="Player ID, streak calendar, badges, on-repeat songs.">
          <DCArtboard id="profile-iphone" label="iPhone · Profile" width={420} height={870}>
            <DeviceFrame kind={t.frame}>
              <ScreenProfile
                width={t.frame==='android'?AND_W:IP_W}
                height={t.frame==='android'?AND_H:IP_H}/>
            </DeviceFrame>
          </DCArtboard>
        </DCSection>

        {/* ============================================================
            7. SONGS LIBRARY
        ============================================================ */}
        <DCSection id="songs" title="07 · Songbook"
          subtitle="Real songs to play after the course. Featured + categories.">
          <DCArtboard id="songs-iphone" label="iPhone · Songbook" width={420} height={870}>
            <DeviceFrame kind={t.frame}>
              <ScreenSongs
                width={t.frame==='android'?AND_W:IP_W}
                height={t.frame==='android'?AND_H:IP_H}/>
            </DeviceFrame>
          </DCArtboard>
        </DCSection>

        {/* ============================================================
            8. LED HARDWARE PAIRING (the differentiator)
        ============================================================ */}
        <DCSection id="hardware" title="08 · LED Hardware — Pairing Flow"
          subtitle="Discover → Calibrate → Connected. This is the moment that sets Piano Professor apart from Duolingo.">
          <DCArtboard id="hw-1" label="1 · Discover BLE" width={420} height={870}>
            <DeviceFrame kind={t.frame}>
              <ScreenHwDiscover
                width={t.frame==='android'?AND_W:IP_W}
                height={t.frame==='android'?AND_H:IP_H}/>
            </DeviceFrame>
          </DCArtboard>
          <DCArtboard id="hw-2" label="2 · Calibrate keys" width={420} height={870}>
            <DeviceFrame kind={t.frame}>
              <ScreenHwPairing
                width={t.frame==='android'?AND_W:IP_W}
                height={t.frame==='android'?AND_H:IP_H}/>
            </DeviceFrame>
          </DCArtboard>
          <DCArtboard id="hw-3" label="3 · Lights are ON 🎉" width={420} height={870}>
            <DeviceFrame kind={t.frame}>
              <ScreenHwConnected
                width={t.frame==='android'?AND_W:IP_W}
                height={t.frame==='android'?AND_H:IP_H}/>
            </DeviceFrame>
          </DCArtboard>
        </DCSection>

        {/* ============================================================
            9. SETTINGS
        ============================================================ */}
        <DCSection id="settings" title="09 · Settings"
          subtitle="Account, LED hardware, sound, app preferences.">
          <DCArtboard id="settings-iphone" label="iPhone · Settings" width={420} height={870}>
            <DeviceFrame kind={t.frame}>
              <ScreenSettings
                width={t.frame==='android'?AND_W:IP_W}
                height={t.frame==='android'?AND_H:IP_H}/>
            </DeviceFrame>
          </DCArtboard>
        </DCSection>

        {/* ============================================================
            10. iPad LANDSCAPE
        ============================================================ */}
        <DCSection id="ipad" title="10 · iPad Landscape"
          subtitle="Tablet layout uses a sidebar + right rail to expose more density.">
          <DCArtboard id="ipad-home" label="iPad · Home / Path" width={1200} height={840}>
            <IpadHero>
              <IpadLandscapePath width={1180} height={820}/>
            </IpadHero>
          </DCArtboard>
          <DCArtboard id="ipad-lesson" label="iPad · Inside a lesson" width={1200} height={840}>
            <IpadHero>
              <IpadLandscapeLesson width={1180} height={820}/>
            </IpadHero>
          </DCArtboard>
        </DCSection>

        {/* ============================================================
            Type & system reference
        ============================================================ */}
        <DCSection id="ds" title="11 · Mini Design System"
          subtitle="Quick reference: colors, buttons, mascot moods, piano key.">
          <DCArtboard id="ds-tokens" label="Tokens & components" width={760} height={520}>
            <DesignTokens/>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>
    </>
  );
}

// ───────────────────────────────────────────────────────────────
// Device frame switcher
// ───────────────────────────────────────────────────────────────
function DeviceFrame({ kind, landscape = false, children }) {
  if (kind === 'android') return <AndroidFrame landscape={landscape}>{children}</AndroidFrame>;
  return <IphoneFrame landscape={landscape}>{children}</IphoneFrame>;
}

// iPad hero just renders without device frame (tablet content is the full artboard)
function IpadHero({ children }) {
  return (
    <div style={{
      width: 1200, height: 840,
      borderRadius: 28, overflow:'hidden',
      background:'#000', padding: 10,
      boxShadow:'0 40px 80px rgba(0,0,0,0.2)',
    }}>
      <div style={{
        width:'100%', height:'100%', borderRadius:18, overflow:'hidden',
        background:'#FBF5E4',
      }}>{children}</div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Tiny design-system reference card
// ───────────────────────────────────────────────────────────────
function DesignTokens() {
  const swatches = [
    ['Cream-50','#FBF5E4'],
    ['Cream-200','#ECDDB4'],
    ['Ink-900','#2A1D11'],
    ['Brand','#58CC02'],
    ['Rust','#C2410C'],
    ['Butter','#F5B800'],
    ['Sky','#5BB8E3'],
    ['Coral','#FF7A9C'],
    ['Plum','#8B5CF6'],
  ];
  return (
    <div className="pp-art pp-paper" style={{
      width: 760, height: 520, padding:'24px 28px', overflow:'hidden',
    }}>
      <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
        <div>
          <ProfessorCat size={120} mood="teach"/>
          <div style={{ height: 10 }}/>
          <ProfessorCat size={120} mood="cheer"/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:900, color:'var(--rust)', letterSpacing:'0.18em' }}>
            PIANO PROFESSOR · DESIGN TOKENS
          </div>
          <h2 style={{ fontSize:30, marginTop:4 }}>Warm paper, big green button.</h2>
          <p style={{ fontSize:14, fontWeight:700, color:'var(--ink-500)', marginTop:6, lineHeight:1.5, maxWidth:420 }}>
            Cream surfaces, ink-brown type, Duolingo green primary, accents pulled from the cat
            (rust, butter, sky, coral). Nunito 900 everywhere headlines need weight.
          </p>

          <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
            {swatches.map(([n,c])=>(
              <div key={n} style={{
                background:c,
                color: ['#FBF5E4','#ECDDB4','#F5B800'].includes(c) ? '#2A1D11' : '#fff',
                padding:'10px 12px', borderRadius:10, minWidth:108,
                fontSize:11, fontWeight:900, letterSpacing:'0.06em',
                border:'1px solid var(--ink-line)',
              }}>
                {n}<br/>
                <span style={{ opacity:0.7, fontWeight:700, fontSize:10 }}>{c}</span>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:10, marginTop:20, flexWrap:'wrap' }}>
            <button className="btn-chunk">PRIMARY</button>
            <button className="btn-chunk rust">RUST</button>
            <button className="btn-chunk butter">BUTTER</button>
            <button className="btn-chunk sky">SKY</button>
            <button className="btn-chunk plum">PLUM</button>
            <button className="btn-chunk ghost">GHOST</button>
          </div>

          <div style={{ marginTop:18 }}>
            <BigPiano width={420} height={88} lit={{ C:'green', E:'cyan', G:'magenta' }}
              fingerHints={{ C:1, E:3, G:5 }} showLeds={false}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// Render
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
