/* ===================================================================
   Piano Professor — PHONE LANDSCAPE (852×394)
   Spine: Splash · Who · Create · Onboarding · Placement · Result · Path
   Reuses window DS components + PP_* data. Native landscape layouts.
   =================================================================== */
const { useState: usePh, useEffect: usePhE, useRef: usePhR } = React;

const phGhost = { width: 38, height: 38, borderRadius: 11, border: "2px solid var(--line)", background: "var(--surface)", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 2px 0 var(--line)", flexShrink: 0 };

/* cycling LED sweep */
function usePhSweep(notes, colors, speed = 240) {
  const [i, setI] = usePh(0);
  usePhE(() => { const t = setInterval(() => setI((x) => (x + 1) % notes.length), speed); return () => clearInterval(t); }, []);
  const o = {}; notes.forEach((n, idx) => { if (Math.abs(idx - i) < 2) o[n] = colors[idx % colors.length]; }); return o;
}

/* ------------------------------ SPLASH ---------------------------- */
function PhSplash({ ctx }) {
  const [ready, setReady] = usePh(false);
  usePhE(() => { const t = setTimeout(() => setReady(true), 1300); return () => clearTimeout(t); }, []);
  const lit = usePhSweep([60, 62, 64, 65, 67, 69, 71, 72], ["#58CC02", "#F5B800", "#5BB8E3", "#FF7A52"], 200);
  return (
    <div className="pp-dark-scene" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 30, padding: "0 46px",
      background: "radial-gradient(120% 130% at 30% 0%, #FFFDF6 0%, #FFF4D6 60%, #FFE9B8 100%)", position: "relative", overflow: "hidden" }}>
      {["🎵", "🎶", "✨"].map((e, i) => <span key={i} style={{ position: "absolute", fontSize: [22, 18, 16][i], opacity: .5, left: ["8%", "90%", "60%"][i], top: ["16%", "20%", "10%"][i], animation: `pp-float ${3 + i * .4}s ${i * .3}s infinite` }}>{e}</span>)}
      {/* left: brand */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <Maestro mood="conduct" size={76} ring={4} ringColor="#fff" bg="#5BB8E3" float style={{ boxShadow: "0 8px 22px #2e84ad44" }} />
        <h1 style={{ fontSize: 40, fontWeight: 900, color: "#2E84AD", margin: "12px 0 0", letterSpacing: -1, lineHeight: .95, whiteSpace: "nowrap" }}>Piano<span style={{ color: "var(--ink)" }}> Professor</span></h1>
        <p style={{ fontSize: 15, fontWeight: 800, color: "#A98B2E", margin: "8px 0 16px" }}>Real piano. Lit keys. Learn fast.</p>
        {ready
          ? <div style={{ animation: "pp-pop .4s" }}><ChunkyButton variant="sky" size="lg" glow onClick={() => { PP_Audio.ensure(); PP_Audio.arp([60, 64, 67, 72]); ctx.go("who"); }}>Let's Play</ChunkyButton></div>
          : <div style={{ width: 180 }}><ProgressBar value={70} color="#F5B800" height={9} /><span style={{ fontSize: 12, fontWeight: 800, color: "#B79A3E", marginTop: 6, display: "block" }}>Tuning your keys…</span></div>}
      </div>
      {/* right: piano */}
      <div style={{ width: 360, flexShrink: 0 }}><Piano low={60} high={72} lit={lit} led interactive={false} hideNoteNames height={120} /></div>
    </div>
  );
}

/* --------------------------- WHO'S PLAYING ------------------------ */
function PhWho({ ctx }) {
  const [manage, setManage] = usePh(false);
  const pick = (p) => { if (manage) { ctx.go("editProfile", { editId: p.id }); return; } PP_Audio.correct(); ctx.setActiveId(p.id); ctx.go(p.placed ? "home" : "onboarding"); };
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff",
      background: "radial-gradient(130% 110% at 50% -10%, #2C7A0E 0%, #1f5e09 60%, #16480a 100%)", position: "relative", overflow: "hidden" }}>
      {[..."12345"].map((_, i) => <span key={i} style={{ position: "absolute", fontSize: 22, opacity: .12, left: `${10 + i * 18}%`, top: `${(i % 2) * 72 + 10}%` }}>♪</span>)}
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: 0 }}>Who's playing?</h1>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#CDEFB6", margin: "4px 0 18px" }}>Everyone gets their own streak &amp; progress.</p>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {ctx.profiles.map((p) => (
          <div key={p.id} onClick={() => pick(p)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer", width: 96, animation: manage ? "pp-jiggle .35s infinite" : "none" }}>
            <div style={{ position: "relative" }}>
              <Maestro mood={p.avatar} size={84} bg="var(--cream)" ring={3} ringColor="#ffffff22" />
              {manage && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#00000055", display: "grid", placeItems: "center" }}><Icon name="pencil" size={24} color="#fff" /></div>}
              {!manage && <div style={{ position: "absolute", bottom: -3, right: -3, background: "var(--surface)", borderRadius: 999, padding: "2px 7px", display: "flex", alignItems: "center", gap: 2, boxShadow: "0 2px 5px #0003" }}><span style={{ fontSize: 11 }}>🔥</span><span style={{ fontWeight: 900, color: "#C2410C", fontSize: 12 }}>{p.streak}</span></div>}
            </div>
            <span style={{ fontSize: 16, fontWeight: 800 }}>{p.name}</span>
          </div>
        ))}
        {ctx.profiles.length < 5 && (
          <div onClick={() => ctx.go("createProfile")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer", width: 96 }}>
            <div style={{ width: 84, height: 84, borderRadius: "50%", border: "3px dashed #ffffff44", display: "grid", placeItems: "center", background: "#ffffff10" }}><Icon name="plus" size={38} color="#ffffffcc" /></div>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#CDEFB6" }}>Add</span>
          </div>
        )}
      </div>
      <div style={{ marginTop: 22 }}>
        <ChunkyButton variant={manage ? "white" : "dark"} size="sm" onClick={() => setManage((m) => !m)} icon={<Icon name={manage ? "check" : "gear"} size={16} color={manage ? "#46A302" : "#fff"} />}>{manage ? "Done" : "Manage"}</ChunkyButton>
      </div>
    </div>
  );
}

/* ------------------------- CREATE / EDIT -------------------------- */
function PhCreateProfile({ ctx }) {
  const editing = ctx.params.editId ? ctx.profiles.find((p) => p.id === ctx.params.editId) : null;
  const [name, setName] = usePh(editing ? editing.name : "");
  const [sel, setSel] = usePh(editing ? Math.max(0, PP_AVATARS.findIndex((a) => a.mood === editing.avatar)) : 0);
  const [err, setErr] = usePh("");
  const av = PP_AVATARS[sel];
  const save = () => {
    if (!name.trim()) { setErr("Name?"); PP_Audio.wrong(); return; }
    if (editing) { ctx.updateProfile(editing.id, { name: name.trim(), avatar: av.mood, bg: av.bg }); ctx.back(); }
    else { const id = "p" + Date.now(); ctx.setProfiles([...ctx.profiles, { id, name: name.trim(), avatar: av.mood, bg: av.bg, color: "#58CC02", streak: 0, xp: 0, gems: 0, hearts: 5, levelId: null, grade: null, placed: false, path: null, lastUnit: null, lang: lang }]); ctx.setActiveId(id); PP_Audio.success(); ctx.go("onboarding"); }
  };
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", padding: "14px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <button onClick={() => ctx.back()} style={phGhost}><Icon name="chevronLeft" size={22} color="var(--ink)" /></button>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{editing ? "Edit profile" : "Create profile"}</h1>
      </div>
      <div style={{ flex: 1, display: "flex", gap: 28, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 200 }}>
          <Maestro mood={av.mood} size={104} bg="var(--cream)" ring={4} ringColor="#fff" float style={{ boxShadow: "0 8px 20px #0002" }} />
          <input value={name} maxLength={14} autoFocus onChange={(e) => { setName(e.target.value); setErr(""); }} placeholder="First name"
            style={{ width: "100%", padding: "11px 16px", fontSize: 17, fontWeight: 800, fontFamily: "Nunito", borderRadius: 13, border: `2.5px solid ${err ? "#FF4B4B" : "var(--line)"}`, background: "var(--surface)", color: "var(--ink)", outline: "none", textAlign: "center" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-faint)", margin: "0 0 8px" }}>PICK A MAESTRO</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 8 }}>
            {PP_AVATARS.map((a, i) => (
              <div key={a.mood} onClick={() => { setSel(i); PP_Audio.tap(); }} style={{ cursor: "pointer", borderRadius: "50%", width: "fit-content", justifySelf: "center", lineHeight: 0, transition: "transform .1s", transform: sel === i ? "scale(1.07)" : "scale(1)", boxShadow: sel === i ? "0 0 0 3px #2F9BD6" : "0 0 0 2px #00000010" }}>
                <Maestro mood={a.mood} size={46} bg="var(--cream)" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <ChunkyButton variant="sky" size="md" onClick={save} style={{ minWidth: 200 }}>{editing ? "Save" : "Create profile"}</ChunkyButton>
        {editing && ctx.profiles.length > 1 && <ChunkyButton variant="ghost" size="md" onClick={() => { ctx.setProfiles(ctx.profiles.filter((x) => x.id !== editing.id)); ctx.go("who"); }} icon={<Icon name="trash" size={18} color="#C81E1E" />} style={{ color: "#C81E1E" }}>Delete</ChunkyButton>}
      </div>
    </div>
  );
}

/* --------------------------- ONBOARDING --------------------------- */
function PhOnboarding({ ctx }) {
  const [i, setI] = usePh(0);
  const litDemo = usePhSweep([60, 64, 67, 72], ["#58CC02", "#5BB8E3", "#F5B800", "#FF7A52"], 420);
  const slides = [
    { bg: "linear-gradient(160deg,#FFFDF6,#E9F8DC)", accent: "#58CC02", art: <Maestro mood="teach" size={150} bg="#D7F5C2" ring={6} ringColor="#fff" float />, title: "Meet Maestro", body: "Your AI teacher listens as you play and guides every step — no boring theory." },
    { bg: "linear-gradient(160deg,#FFFDF6,#DFF1FB)", accent: "#5BB8E3", art: <div style={{ width: 320 }}><Piano low={60} high={72} lit={litDemo} led interactive={false} hideNoteNames height={120} /></div>, title: "Your keys light up", body: "Clip our LED strip on any piano. The right keys glow — just follow the lights." },
    { bg: "linear-gradient(160deg,#FFFDF6,#FFEFD2)", accent: "#F5B800", art: <div style={{ display: "flex", gap: 10 }}><div style={{ animation: "pp-float 3s infinite" }}><StatChip kind="streak" value="12" big /></div><div style={{ animation: "pp-float 3s .3s infinite" }}><StatChip kind="xp" value="3480" big /></div></div>, title: "Streaks keep you going", body: "Earn XP, gems and a daily streak. Ten minutes a day becomes real songs — fast." },
    { bg: "linear-gradient(160deg,#FFFDF6,#E9F8DC)", accent: "#58CC02", art: <div style={{ position: "relative", width: 150, height: 150, display: "grid", placeItems: "center" }}><Maestro mood="teach" size={140} bg="#D7F5C2" ring={6} ringColor="#fff" float /><div style={{ position: "absolute", bottom: 8, right: 2, width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(180deg,#6FE018,#46A302)", display: "grid", placeItems: "center", boxShadow: "0 4px 0 #3D8E00", border: "3px solid var(--cream)" }}><Icon name="mic" size={24} color="#fff" /></div></div>, title: "Maestro listens as you play", body: "We use your mic to hear the notes you play and give instant feedback. Audio stays on your device — never recorded or shared." },
  ];
  const s = slides[i];
  const next = () => { if (i < slides.length - 1) { setI(i + 1); PP_Audio.tap(); } else { PP_Audio.success(); ctx.go("placement"); } };
  return (
    <div className="pp-dark-scene" style={{ width: "100%", height: "100%", background: s.bg, transition: "background .5s", display: "flex", alignItems: "center", padding: "0 46px", position: "relative" }}>
      <button onClick={() => ctx.go("placement")} style={{ position: "absolute", top: 14, right: 20, background: "none", border: "none", fontFamily: "Nunito", fontWeight: 800, fontSize: 14, color: "var(--ink-faint)", cursor: "pointer" }}>Skip</button>
      <div key={i} style={{ flex: 1, display: "grid", placeItems: "center", height: 200, animation: "pp-pop .4s" }}>{s.art}</div>
      <div style={{ flex: 1, animation: "pp-slide-up .4s" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{s.title}</h1>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.4, margin: "10px 0 18px", maxWidth: 360 }}>{s.body}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", gap: 8 }}>{slides.map((_, j) => <div key={j} onClick={() => setI(j)} style={{ width: j === i ? 26 : 10, height: 10, borderRadius: 999, background: j === i ? s.accent : "#0000001f", transition: "all .3s", cursor: "pointer" }} />)}</div>
          <ChunkyButton variant={i === slides.length - 1 ? "green" : "sky"} size="md" glow={i === slides.length - 1} onClick={next} icon={i === slides.length - 1 ? <Icon name="mic" size={18} color="#fff" /> : <Icon name="arrowRight" size={18} color="#fff" />}>{i === slides.length - 1 ? "Allow mic" : "Next"}</ChunkyButton>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- PLACEMENT --------------------------- */
function PhPlacement({ ctx }) {
  const [step, setStep] = usePh(0);
  const [picks, setPicks] = usePh({});
  const [sel, setSel] = usePh(null);
  const q = PP_PLACEMENT[step]; const total = PP_PLACEMENT.length;
  const next = () => {
    if (sel == null) return;
    const np = { ...picks, [step]: q.a[sel].v }; setPicks(np);
    if (step < total - 1) { setStep(step + 1); setSel(null); PP_Audio.tap(); }
    else { const score = PP_PLACEMENT.reduce((a, qq, idx) => a + (qq.noScore ? 0 : (np[idx] || 0)), 0); ctx.go("placementResult", { levelId: levelFromScore(score).id }); }
  };
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", padding: "14px 30px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <button onClick={() => (step === 0 ? ctx.go("onboarding") : setStep(step - 1))} style={phGhost}><Icon name="chevronLeft" size={20} color="var(--ink)" /></button>
        <ProgressBar value={(step / total) * 100} color="#58CC02" height={14} style={{ flex: 1 }} />
        <span style={{ fontWeight: 900, color: "var(--ink-faint)", fontSize: 15 }}>{step + 1}/{total}</span>
      </div>
      <div key={step} style={{ flex: 1, display: "flex", alignItems: "center", gap: 26, animation: "pp-slide-up .35s" }}>
        <div style={{ width: 200, textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 50 }}>{q.emoji}</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", margin: "6px 0 0", lineHeight: 1.1 }}>{q.q}</h1>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {q.a.map((opt, idx) => {
            const on = sel === idx;
            return (
              <button key={idx} onClick={() => { setSel(idx); PP_Audio.note(64 + idx * 2, 0, .4, .5); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 13, border: `2.5px solid ${on ? "#58CC02" : "var(--line)"}`, background: on ? "var(--sel-green)" : "var(--surface)", cursor: "pointer", fontFamily: "Nunito", textAlign: "left", boxShadow: on ? "0 3px 0 #58CC02" : "0 3px 0 var(--line)" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", border: `2.5px solid ${on ? "#58CC02" : "#D8CDA9"}`, background: on ? "#58CC02" : "transparent", display: "grid", placeItems: "center", flexShrink: 0 }}>{on && <Icon name="check" size={13} color="#fff" />}</span>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{opt.t}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChunkyButton variant={sel == null ? "dark" : "green"} size="md" disabled={sel == null} onClick={next} style={{ minWidth: 180 }}>{step === total - 1 ? "See my level" : "Continue"}</ChunkyButton>
      </div>
    </div>
  );
}

/* ----------------------------- RESULT ----------------------------- */
function PhPlacementResult({ ctx }) {
  const lvl = PP_LEVELS.find((l) => l.id === ctx.params.levelId) || PP_LEVELS[1];
  const [reveal, setReveal] = usePh(false);
  usePhE(() => { const t = setTimeout(() => { setReveal(true); PP_Audio.success(); }, 600); return () => clearTimeout(t); }, []);
  return (
    <div className="pp-dark-scene" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 36, position: "relative", overflow: "hidden",
      background: `radial-gradient(120% 130% at 50% 0%, ${lvl.color}22 0%, #FFFDF6 55%)` }}>
      {reveal && <Confetti run count={110} />}
      <div style={{ position: "relative", transform: reveal ? "scale(1)" : "scale(.4)", opacity: reveal ? 1 : 0, transition: "all .6s cubic-bezier(.3,1.7,.5,1)" }}>
        <div style={{ width: 150, height: 150, borderRadius: 34, background: `linear-gradient(150deg,${lvl.color},${lvl.deep})`, display: "grid", placeItems: "center", boxShadow: `0 14px 32px ${lvl.color}66`, transform: "rotate(-6deg)" }}>
          <span style={{ fontSize: 64, fontWeight: 900, color: "#fff", textShadow: "0 3px 0 #00000022" }}>{lvl.short}</span>
        </div>
        <div style={{ position: "absolute", bottom: -10, right: -16, animation: "pp-float 2.6s infinite" }}><Maestro mood="trophy" size={70} bg="#FFE38A" ring={4} ringColor="#fff" /></div>
      </div>
      <div style={{ maxWidth: 380, opacity: reveal ? 1 : 0, transition: ".5s .2s" }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-faint)", margin: 0 }}>We found your level…</p>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: "var(--ink)", margin: "6px 0" }}>You're in <span style={{ color: lvl.color }}>{lvl.name}</span></h1>
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-soft)", margin: "0 0 16px" }}>Grade {lvl.grade} · {lvl.blurb}</p>
        <ChunkyButton variant="sky" size="lg" glow onClick={() => ctx.go("coursePath", { levelId: lvl.id })}>Continue</ChunkyButton>
      </div>
    </div>
  );
}

/* --------------------------- COURSE PATH -------------------------- */
function PhCoursePath({ ctx }) {
  const [sel, setSel] = usePh(null);
  const lvlId = ctx.params.levelId || "el";
  const paths = [
    { id: "chords", emoji: "🎶", title: "Chords", tag: "Popular", body: "Play real songs fast with chord shapes.", color: "#58CC02", deep: "#3D8E00" },
    { id: "soloist", emoji: "🎼", title: "Soloist", tag: "Classic", body: "Read music & play melodies note-by-note.", color: "#5BB8E3", deep: "#2E84AD" },
  ];
  const start = () => { ctx.updateProfile(ctx.activeId, { placed: true, levelId: lvlId, grade: (PP_LEVELS.find((l) => l.id === lvlId) || {}).grade || 1, path: sel, lastUnit: sel === "chords" ? "Pop Chords I" : "First 3 Notes" }); PP_Audio.success(); ctx.go("home"); };
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Choose your path</h1>
      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", margin: "4px 0 18px" }}>You can switch any time.</p>
      <div style={{ display: "flex", gap: 18 }}>
        {paths.map((p) => {
          const on = sel === p.id;
          return (
            <div key={p.id} onClick={() => { setSel(p.id); PP_Audio.note(p.id === "chords" ? 60 : 67, 0, .5); }} style={{ width: 250, padding: "18px 20px", borderRadius: 22, cursor: "pointer", background: "var(--surface)", border: `3px solid ${on ? p.color : "var(--line)"}`, boxShadow: on ? `0 7px 0 ${p.deep}` : "0 5px 0 var(--line)", transform: on ? "translateY(-3px)" : "none", transition: "all .15s", position: "relative" }}>
              <span style={{ position: "absolute", top: -11, left: 18, background: p.color, color: "#fff", fontWeight: 900, fontSize: 11, padding: "3px 11px", borderRadius: 999, boxShadow: `0 2px 0 ${p.deep}` }}>{p.tag}</span>
              <div style={{ fontSize: 44, marginBottom: 6 }}>{p.emoji}</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", margin: "0 0 6px" }}>{p.title}</h2>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.35, margin: 0 }}>{p.body}</p>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 22 }}><ChunkyButton variant={sel ? "green" : "dark"} size="lg" disabled={!sel} onClick={start} style={{ minWidth: 240 }}>Start learning</ChunkyButton></div>
    </div>
  );
}

Object.assign(window, { PhSplash, PhWho, PhCreateProfile, PhOnboarding, PhPlacement, PhPlacementResult, PhCoursePath, phGhost, usePhSweep });
