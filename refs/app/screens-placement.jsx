/* ===================================================================
   Piano Professor — Placement test · Result · Course path
   =================================================================== */
const { useState: useS2, useEffect: useE2 } = React;

function levelFromScore(score) {
  // max raw = 4 scored questions * 3 = 12
  if (score <= 1) return PP_LEVELS[0];
  if (score <= 3) return PP_LEVELS[1];
  if (score <= 6) return PP_LEVELS[2];
  if (score <= 8) return PP_LEVELS[3];
  if (score <= 10) return PP_LEVELS[4];
  return PP_LEVELS[5];
}

function ScreenPlacement({ ctx }) {
  const [step, setStep] = useS2(0);
  const [picks, setPicks] = useS2({});
  const [sel, setSel] = useS2(null);
  const q = PP_PLACEMENT[step];
  const total = PP_PLACEMENT.length;
  const pct = (step / total) * 100;

  const choose = (idx) => { setSel(idx); PP_Audio.note(64 + idx * 2, 0, 0.4, 0.5); };
  const next = () => {
    if (sel == null) return;
    const np = { ...picks, [step]: q.a[sel].v };
    setPicks(np);
    if (step < total - 1) { setStep(step + 1); setSel(null); PP_Audio.tap(); }
    else {
      const score = PP_PLACEMENT.reduce((acc, qq, i) => acc + (qq.noScore ? 0 : (np[i] || 0)), 0);
      const lvl = levelFromScore(score);
      ctx.go("placementResult", { levelId: lvl.id });
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", padding: "26px 60px 40px" }}>
      {/* progress header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => (step === 0 ? ctx.go("onboarding") : (setStep(step - 1), setSel(picks[step - 1] != null ? null : null)))} style={ghostIcon}><Icon name="chevronLeft" size={26} color="var(--ink)" /></button>
        <ProgressBar value={pct} color="#58CC02" height={18} style={{ flex: 1 }} />
        <span style={{ fontWeight: 900, color: "var(--ink-faint)", fontSize: 18, width: 54, textAlign: "right" }}>{step + 1}/{total}</span>
      </div>

      <div key={step} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "pp-slide-up .4s" }}>
        <div style={{ fontSize: 66, marginBottom: 6 }}>{q.emoji}</div>
        <h1 style={{ fontSize: 40, fontWeight: 900, color: "var(--ink)", margin: 0, marginBottom: 34, textAlign: "center", maxWidth: 760 }}>{q.q}</h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: 760 }}>
          {q.a.map((opt, idx) => {
            const on = sel === idx;
            return (
              <button key={idx} onClick={() => choose(idx)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "20px 22px", borderRadius: 18,
                border: `3px solid ${on ? "#58CC02" : "var(--line)"}`, background: on ? "var(--sel-green)" : "var(--surface)",
                cursor: "pointer", fontFamily: "Nunito", textAlign: "left", boxShadow: on ? "0 4px 0 #58CC02" : "0 4px 0 var(--line)",
                transform: on ? "translateY(0)" : "none", transition: "all .12s",
              }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", border: `3px solid ${on ? "#58CC02" : "#D8CDA9"}`, background: on ? "#58CC02" : "transparent", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {on && <Icon name="check" size={18} color="#fff" />}
                </span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>{opt.t}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChunkyButton variant={sel == null ? "dark" : "green"} size="lg" disabled={sel == null} onClick={next} style={{ minWidth: 240 }}>
          {step === total - 1 ? "See my level" : "Continue"}
        </ChunkyButton>
      </div>
    </div>
  );
}

/* --------------------------- RESULT ------------------------------- */
function ScreenPlacementResult({ ctx }) {
  const lvl = PP_LEVELS.find((l) => l.id === ctx.params.levelId) || PP_LEVELS[1];
  const [reveal, setReveal] = useS2(false);
  useE2(() => {
    const t1 = setTimeout(() => { setReveal(true); PP_Audio.success(); }, 700);
    return () => clearTimeout(t1);
  }, []);

  return (
    <div className="pp-dark-scene" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden",
      background: `radial-gradient(120% 120% at 50% 0%, ${lvl.color}22 0%, #FFFDF6 50%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {reveal && <Confetti run count={140} />}
      <p style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-faint)", marginBottom: 6, opacity: reveal ? 1 : 0, transition: ".4s" }}>We found your level…</p>

      <div style={{ position: "relative", marginBottom: 14, transform: reveal ? "scale(1)" : "scale(0.4)", opacity: reveal ? 1 : 0, transition: "all .6s cubic-bezier(.3,1.7,.5,1)" }}>
        <div style={{ width: 200, height: 200, borderRadius: 44, background: `linear-gradient(150deg, ${lvl.color}, ${lvl.deep})`,
          display: "grid", placeItems: "center", boxShadow: `0 18px 40px ${lvl.color}66`, transform: "rotate(-6deg)" }}>
          <span style={{ fontSize: 86, fontWeight: 900, color: "#fff", textShadow: "0 4px 0 #00000022" }}>{lvl.short}</span>
        </div>
        <div style={{ position: "absolute", bottom: -14, right: -22, animation: "pp-float 2.6s infinite" }}>
          <Maestro mood="trophy" size={92} bg="#FFE38A" ring={5} ringColor="#fff" />
        </div>
      </div>

      <h1 style={{ fontSize: 48, fontWeight: 900, color: "var(--ink)", margin: "18px 0 6px", textAlign: "center", opacity: reveal ? 1 : 0, transition: ".5s .2s" }}>
        You're placed in <span style={{ color: lvl.color }}>{lvl.name}</span>
      </h1>
      <p style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 6, opacity: reveal ? 1 : 0, transition: ".5s .3s" }}>Grade {lvl.grade} · {lvl.blurb}</p>

      <div style={{ marginTop: 30, opacity: reveal ? 1 : 0, transform: reveal ? "translateY(0)" : "translateY(16px)", transition: ".5s .4s" }}>
        <ChunkyButton variant="sky" size="xl" glow onClick={() => ctx.go("coursePath", { levelId: lvl.id })}>Continue</ChunkyButton>
      </div>
      <button onClick={() => ctx.go("coursePath", { levelId: lvl.id })} style={{ marginTop: 18, background: "none", border: "none", fontFamily: "Nunito", fontWeight: 800, fontSize: 16, color: "var(--ink-faint)", cursor: "pointer", textDecoration: "underline", opacity: reveal ? 1 : 0, transition: ".5s .5s" }}>
        I'd rather start from the very beginning
      </button>
    </div>
  );
}

/* ------------------------- COURSE PATH ---------------------------- */
function ScreenCoursePath({ ctx }) {
  const [sel, setSel] = useS2(null);
  const lvlId = ctx.params.levelId || "el";
  const paths = [
    { id: "chords", emoji: "🎶", title: "Chords", tag: "Most popular", body: "Play real songs fast by learning chord shapes. Sing along, jam with friends.", color: "#58CC02", deep: "#3D8E00" },
    { id: "soloist", emoji: "🎼", title: "Soloist", tag: "Classic path", body: "Read music and play melodies note-by-note with both hands. Great foundations.", color: "#5BB8E3", deep: "#2E84AD" },
  ];
  const start = () => {
    ctx.updateProfile(ctx.activeId, { placed: true, levelId: lvlId, grade: (PP_LEVELS.find((l) => l.id === lvlId) || {}).grade || 1, path: sel, lastUnit: sel === "chords" ? "Pop Chords I" : "First 3 Notes" });
    PP_Audio.success();
    ctx.go("home");
  };
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 50 }}>
      <h1 style={{ fontSize: 44, fontWeight: 900, color: "var(--ink)", margin: 0, marginBottom: 6 }}>Choose your path</h1>
      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 38 }}>You can switch any time.</p>
      <div style={{ display: "flex", gap: 26 }}>
        {paths.map((p) => {
          const on = sel === p.id;
          return (
            <div key={p.id} onClick={() => { setSel(p.id); PP_Audio.note(p.id === "chords" ? 60 : 67, 0, 0.5); }}
              style={{ width: 320, padding: 30, borderRadius: 28, cursor: "pointer", background: "var(--surface)",
                border: `4px solid ${on ? p.color : "var(--line)"}`, boxShadow: on ? `0 10px 0 ${p.deep}, 0 18px 36px ${p.color}44` : "0 6px 0 var(--line)",
                transform: on ? "translateY(-4px)" : "none", transition: "all .15s", position: "relative" }}>
              {p.tag && <span style={{ position: "absolute", top: -14, left: 24, background: p.color, color: "#fff", fontWeight: 900, fontSize: 13, padding: "5px 13px", borderRadius: 999, boxShadow: `0 3px 0 ${p.deep}` }}>{p.tag}</span>}
              <div style={{ fontSize: 64, marginBottom: 12 }}>{p.emoji}</div>
              <h2 style={{ fontSize: 30, fontWeight: 900, color: "var(--ink)", margin: "0 0 10px" }}>{p.title}</h2>
              <p style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.4, margin: 0 }}>{p.body}</p>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 40 }}>
        <ChunkyButton variant={sel ? "green" : "dark"} size="xl" disabled={!sel} onClick={start} style={{ minWidth: 300 }}>Start learning</ChunkyButton>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenPlacement, ScreenPlacementResult, ScreenCoursePath, levelFromScore });
