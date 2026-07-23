/* ===================================================================
   Piano Professor — Hardware: BLE Pairing · Calibration · LED Settings
   plus Settings & Profile/Stats
   =================================================================== */
const { useState: useSH, useEffect: useEH, useRef: useRH } = React;

/* ----------------------------- PAIRING ---------------------------- */
function ScreenPair({ ctx }) {
  // phases: scan -> found -> connecting -> success -> failed -> (troubleshoot)
  const [phase, setPhase] = useSH(ctx.led.connected ? "success" : (ctx.params.state === "error" ? "failed" : "scan"));
  const [trouble, setTrouble] = useSH(false);
  const litSweep = (() => {
    const [i, setI] = useSH(0);
    useEH(() => { const t = setInterval(() => setI((x) => (x + 1) % 12), 110); return () => clearInterval(t); }, []);
    const o = {}; for (let k = 0; k < 3; k++) { const m = 60 + ((i + k) % 12); o[m] = ["#58CC02", "#F5B800", "#5BB8E3"][k]; } return o;
  })();

  useEH(() => {
    if (phase === "scan") { const t = setTimeout(() => setPhase("found"), 2400); return () => clearTimeout(t); }
    if (phase === "connecting") { const t = setTimeout(() => { setPhase("success"); ctx.setLed({ ...ctx.led, connected: true }); PP_Audio.success(); }, 2000); return () => clearTimeout(t); }
  }, [phase]);

  return (
    <div className="pp-dark-scene" style={{ width: "100%", height: "100%", background: "radial-gradient(120% 100% at 50% 0%, var(--sel-sky) 0%, #FFFAEC 60%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <button onClick={() => ctx.back()} style={{ ...ghostIcon, position: "absolute", top: 22, left: 22 }}><Icon name="close" size={24} color="var(--ink)" /></button>
      {phase === "success" && <Confetti run count={90} />}

      {(phase === "scan" || phase === "found") && (
        <>
          {/* radar */}
          <div style={{ position: "relative", width: 260, height: 260, display: "grid", placeItems: "center", marginBottom: 20 }}>
            {phase === "scan" && [0, 1, 2].map((i) => (
              <div key={i} style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", border: "3px solid #5BB8E3", animation: `pp-ring 2s ${i * 0.6}s ease-out infinite` }} />
            ))}
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(150deg,#7FCBED,#5BB8E3)", display: "grid", placeItems: "center", boxShadow: "0 10px 30px #5BB8E366", zIndex: 2 }}>
              <Icon name="bluetooth" size={56} color="#fff" />
            </div>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{phase === "scan" ? "Looking for your LED strip…" : "Found it!"}</h1>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-soft)", marginTop: 10, marginBottom: 26 }}>{phase === "scan" ? "Make sure the controller is plugged in and blinking blue." : "Tap to connect your Piano Professor LED strip."}</p>

          {phase === "found" && (
            <div onClick={() => { setPhase("connecting"); PP_Audio.blip(660, 0.1); }} style={{ display: "flex", alignItems: "center", gap: 16, background: "var(--surface)", border: "3px solid #5BB8E3", borderRadius: 20, padding: "16px 24px", cursor: "pointer", boxShadow: "0 6px 0 #2E84AD", animation: "pp-pop .3s" }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: "var(--sel-sky)", display: "grid", placeItems: "center" }}><span style={{ fontSize: 26 }}>🎹</span></div>
              <div style={{ textAlign: "left" }}>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Piano Professor LED</h3>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#5BB8E3", margin: 0 }}>PP-Strip · 88 keys · Signal strong</p>
              </div>
              <Icon name="chevronRight" size={26} color="#5BB8E3" />
            </div>
          )}
        </>
      )}

      {phase === "connecting" && (
        <>
          <div style={{ width: 90, height: 90, borderRadius: "50%", border: "8px solid #D7ECF7", borderTopColor: "#5BB8E3", animation: "pp-spin .9s linear infinite", marginBottom: 24 }} />
          <h1 style={{ fontSize: 34, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Connecting…</h1>
          <p style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-soft)", marginTop: 10 }}>Shaking hands with your strip.</p>
        </>
      )}

      {phase === "failed" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", animation: "pp-pop .35s" }}>
          <Maestro mood="confused" size={124} bg="#FBEEE6" ring={6} ringColor="#fff" float style={{ marginBottom: 12 }} />
          <h1 style={{ fontSize: 38, fontWeight: 900, color: "var(--ink)", margin: 0 }}>No strip found</h1>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-soft)", margin: "10px 0 24px", maxWidth: 440, lineHeight: 1.4 }}>We scanned but couldn't find your LED controller. Make sure it's powered on and blinking blue, then try again.</p>
          <div style={{ display: "flex", gap: 14 }}>
            <ChunkyButton variant="ghost" size="lg" onClick={() => setTrouble(true)}>Troubleshoot</ChunkyButton>
            <ChunkyButton variant="sky" size="lg" glow onClick={() => setPhase("scan")} icon={<Icon name="refresh" size={20} color="#fff" />}>Scan again</ChunkyButton>
          </div>
        </div>
      )}

      {phase === "success" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: "pp-pop .4s" }}>
          <Maestro mood="wow" size={130} bg="#EAF8DC" ring={6} ringColor="#fff" float style={{ marginBottom: 6 }} />
          <h1 style={{ fontSize: 44, fontWeight: 900, color: "var(--ink)", margin: "10px 0 6px" }}>Your keys light up! ✨</h1>
          <p style={{ fontSize: 19, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 22 }}>Watch the strip — the magic is real.</p>
          <div style={{ width: 460, marginBottom: 28 }}><Piano low={60} high={72} lit={litSweep} led interactive={false} hideNoteNames height={130} /></div>
          <div style={{ display: "flex", gap: 14 }}>
            <ChunkyButton variant="ghost" size="lg" onClick={() => ctx.go("ledSettings")}>LED settings</ChunkyButton>
            <ChunkyButton variant="sky" size="lg" glow onClick={() => ctx.go("calibration")} icon={<Icon name="arrowRight" size={20} color="#fff" />}>Calibrate & start</ChunkyButton>
          </div>
        </div>
      )}

      {/* troubleshoot link */}
      {(phase === "scan" || phase === "found") && (
        <button onClick={() => setTrouble(true)} style={{ position: "absolute", bottom: 30, background: "none", border: "none", fontFamily: "Nunito", fontWeight: 800, fontSize: 15, color: "var(--ink-faint)", textDecoration: "underline", cursor: "pointer" }}>Can't find your strip?</button>
      )}
      {trouble && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(20,16,10,.5)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center" }} onClick={() => setTrouble(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 480, background: "var(--surface)", borderRadius: 24, padding: 30, boxShadow: "0 20px 60px #0005" }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", margin: "0 0 16px" }}>Troubleshooting</h2>
            {["Plug the controller into power — the LED should blink blue.", "Keep your tablet within 3 metres of the strip.", "Turn Bluetooth off and on, then scan again.", "Still stuck? Tap the reset button for 5 seconds."].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--sel-sky)", color: "#2E84AD", fontWeight: 900, display: "grid", placeItems: "center", flexShrink: 0, fontSize: 14 }}>{i + 1}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.35 }}>{t}</span>
              </div>
            ))}
            <ChunkyButton variant="sky" size="md" full onClick={() => { setTrouble(false); setPhase("scan"); }} style={{ marginTop: 10 }}>Scan again</ChunkyButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- CALIBRATION -------------------------- */
function ScreenCalibration({ ctx }) {
  const [step, setStep] = useSH(0); // 0 align, 1 first-key, 2 mic, 3 done
  const [hitKey, setHitKey] = useSH(false);
  const steps = ["Align the strip", "Test the first key", "Mic check", "All set"];
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", padding: "26px 50px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <button onClick={() => ctx.back()} style={ghostIcon}><Icon name="chevronLeft" size={26} color="var(--ink)" /></button>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Calibration</h1>
      </div>
      {/* stepper */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 8, borderRadius: 999, background: i <= step ? "#58CC02" : "var(--line)" }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: i <= step ? "#46A302" : "#A99F82" }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        {step === 0 && (
          <>
            <div style={{ width: 480, marginBottom: 24 }}>
              <div style={{ position: "relative" }}>
                <Piano low={60} high={72} lit={{ 60: "#58CC02", 72: "#58CC02" }} led interactive={false} hideNoteNames height={150} />
                <div style={{ position: "absolute", top: -6, left: 0, right: 0, textAlign: "center", fontWeight: 900, color: "#46A302", fontSize: 14 }}>↓ line the strip up with these glowing ends ↓</div>
              </div>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", margin: "0 0 8px" }}>Line up the strip</h2>
            <p style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-soft)", maxWidth: 440 }}>Slide the LED strip so the two green lights sit over your lowest and highest keys.</p>
            <div style={{ marginTop: 24 }}><ChunkyButton variant="sky" size="lg" onClick={() => setStep(1)}>It's lined up</ChunkyButton></div>
          </>
        )}
        {step === 1 && (
          <>
            <div style={{ width: 480, marginBottom: 24 }}>
              <Piano low={60} high={72} lit={{ 60: hitKey ? "#58CC02" : "#F5B800" }} led height={150} onPlay={(m) => { if (m === 60) { setHitKey(true); PP_Audio.correct(); setTimeout(() => setStep(2), 900); } else PP_Audio.wrong(); }} />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", margin: "0 0 8px" }}>{hitKey ? "Perfect! 🎉" : "Press the glowing key"}</h2>
            <p style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-soft)", maxWidth: 440 }}>This checks the strip lines up with the right note.</p>
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ position: "relative", width: 140, height: 140, display: "grid", placeItems: "center", marginBottom: 20 }}>
              {[0, 1].map((i) => <div key={i} style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", border: "3px solid #58CC02", animation: `pp-ring 1.8s ${i * 0.7}s ease-out infinite` }} />)}
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(150deg,#6FE018,#46A302)", display: "grid", placeItems: "center", zIndex: 2 }}><Icon name="mic" size={40} color="#fff" /></div>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", margin: "0 0 8px" }}>Listening…</h2>
            <p style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-soft)", maxWidth: 440 }}>Play any few notes so Maestro can hear your piano.</p>
            <div style={{ marginTop: 24 }}><ChunkyButton variant="sky" size="lg" onClick={() => { PP_Audio.success(); setStep(3); }}>Sounds great</ChunkyButton></div>
          </>
        )}
        {step === 3 && (
          <>
            <Maestro mood="cheer" size={130} bg="#EAF8DC" ring={6} ringColor="#fff" float style={{ marginBottom: 10 }} />
            <h2 style={{ fontSize: 34, fontWeight: 900, color: "var(--ink)", margin: "0 0 8px" }}>You're all set!</h2>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-soft)", maxWidth: 440 }}>Your strip is aligned and listening. Time for your first lesson.</p>
            <div style={{ marginTop: 26 }}><ChunkyButton variant="sky" size="xl" glow onClick={() => ctx.go("home")} icon={<Icon name="arrowRight" size={22} color="#fff" />}>Start learning</ChunkyButton></div>
          </>
        )}
      </div>
    </div>
  );
}

/* --------------------------- LED SETTINGS ------------------------- */
const LED_THEMES = [
  { id: "rainbow", name: "Rainbow", colors: ["#FF4B4B", "#F5B800", "#58CC02", "#5BB8E3", "#9b6bff"] },
  { id: "grass", name: "Grass", colors: ["#58CC02", "#46A302", "#9BE05A"] },
  { id: "ocean", name: "Ocean", colors: ["#5BB8E3", "#2E84AD", "#7FCBED"] },
  { id: "sunset", name: "Sunset", colors: ["#FF7A52", "#F5B800", "#FF4B4B"] },
  { id: "mono", name: "Mono white", colors: ["#FFFFFF", "var(--line)"] },
];
function ScreenLedSettings({ ctx }) {
  const connected = ctx.led.connected;
  const [theme, setTheme] = useSH(ctx.led.theme);
  const [bright, setBright] = useSH(ctx.led.brightness);
  const cur = LED_THEMES.find((t) => t.id === theme) || LED_THEMES[0];
  const demoLit = (() => { const o = {}; const ns = [60, 62, 64, 65, 67, 69, 71, 72]; ns.forEach((m, i) => { const c = cur.colors[i % cur.colors.length]; o[m] = c; }); return o; })();
  useEH(() => { ctx.setLed({ ...ctx.led, theme, brightness: bright }); }, [theme, bright]);

  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", padding: "26px 50px", overflow: "auto" }} className="pp-scroll">
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        <button onClick={() => ctx.back()} style={ghostIcon}><Icon name="chevronLeft" size={26} color="var(--ink)" /></button>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--ink)", margin: 0 }}>LED settings</h1>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: connected ? "#EAF8DC" : "#FBEEE6", border: `2px solid ${connected ? "#CFEAAE" : "#F3D3BE"}`, borderRadius: 999, padding: "7px 14px" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: connected ? "#58CC02" : "#C2410C" }} />
          <span style={{ fontWeight: 800, fontSize: 14, color: connected ? "#3D8E00" : "#C2410C" }}>{connected ? "Connected" : "Not connected"}</span>
        </div>
      </div>

      {!connected && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#FBEEE6", border: "2px solid #F3D3BE", borderRadius: 18, padding: 18, marginBottom: 20 }}>
          <Icon name="bluetooth" size={26} color="#C2410C" />
          <span style={{ flex: 1, fontWeight: 800, color: "#9A4B1E", fontSize: 16 }}>Connect your LED strip to preview themes live.</span>
          <ChunkyButton variant="sky" size="sm" onClick={() => ctx.go("pair")}>Pair now</ChunkyButton>
        </div>
      )}

      {/* live preview */}
      <div style={{ borderRadius: 22, background: "#1a1814", padding: 18, marginBottom: 22, opacity: connected ? 1 : 0.5 }}>
        <Piano low={60} high={72} lit={demoLit} led interactive={false} hideNoteNames height={140} />
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>Color theme</h3>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 26 }}>
        {LED_THEMES.map((t) => {
          const on = theme === t.id;
          return (
            <button key={t.id} onClick={() => { setTheme(t.id); PP_Audio.arp([60, 64, 67]); }} style={{ width: 150, padding: 12, borderRadius: 18, cursor: "pointer", border: `3px solid ${on ? "#58CC02" : "var(--line)"}`, background: "var(--surface)", boxShadow: on ? "0 4px 0 #46A302" : "0 4px 0 var(--line)", fontFamily: "Nunito" }}>
              <div style={{ display: "flex", height: 30, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
                {t.colors.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
              </div>
              <span style={{ fontWeight: 900, fontSize: 16, color: "var(--ink)" }}>{t.name}</span>
            </button>
          );
        })}
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>Brightness</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 16, maxWidth: 600 }}>
        <Icon name="sound" size={20} color="#A99F82" />
        <input type="range" min="10" max="100" value={bright} onChange={(e) => setBright(+e.target.value)} style={{ flex: 1, accentColor: "#58CC02", height: 8 }} />
        <span style={{ fontWeight: 900, fontSize: 18, color: "var(--ink)", width: 54, textAlign: "right" }}>{bright}%</span>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenPair, ScreenCalibration, ScreenLedSettings, LED_THEMES });
