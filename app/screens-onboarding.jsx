/* ===================================================================
   Piano Professor — Onboarding spine
   Splash · Who's Playing · Create Profile · Onboarding carousel
   =================================================================== */
const { useState: useS1, useEffect: useE1, useRef: useR1 } = React;

/* small cycling-LED helper */
function useCyclingLit(notes, colors, speed = 420) {
  const [i, setI] = useS1(0);
  useE1(() => {
    const t = setInterval(() => setI((x) => (x + 1) % notes.length), speed);
    return () => clearInterval(t);
  }, []);
  const lit = {};
  notes.forEach((n, idx) => { if (idx <= i || i === notes.length - 1) lit[n] = colors[idx % colors.length]; });
  // sweep style: only the current + trailing
  const sweep = {};
  notes.forEach((n, idx) => { if (Math.abs(idx - i) < 2) sweep[n] = colors[idx % colors.length]; });
  return sweep;
}

/* ----------------------------- SPLASH ----------------------------- */
function ScreenSplash({ ctx }) {
  const [phase, setPhase] = useS1("load"); // load -> ready
  useE1(() => { const t = setTimeout(() => setPhase("ready"), 1500); return () => clearTimeout(t); }, []);
  const lit = useCyclingLit([60, 62, 64, 65, 67, 69, 71, 72], ["#58CC02", "#F5B800", "#5BB8E3", "#FF7A52"], 240);

  return (
    <div className="pp-dark-scene" style={{
      position: "relative", width: "100%", height: "100%", overflow: "hidden",
      background: "radial-gradient(120% 120% at 50% 0%, #FFFDF6 0%, #FFF4D6 55%, #FFE9B8 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* floating notes */}
      {["🎵", "🎶", "♪", "🎹", "✨"].map((e, i) => (
        <span key={i} style={{
          position: "absolute", fontSize: [34, 26, 30, 28, 22][i], opacity: 0.5,
          left: ["10%", "82%", "18%", "88%", "50%"][i], top: ["20%", "26%", "74%", "70%", "12%"][i],
          animation: `pp-float ${3 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
        }}>{e}</span>
      ))}

      <div style={{ animation: "pp-pop .6s cubic-bezier(.3,1.6,.5,1)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Maestro mood="conduct" size={132} ring={6} ringColor="#fff" bg="#5BB8E3" float style={{ boxShadow: "0 14px 34px #2e84ad44, 0 0 0 6px #fff" }} />
        <div style={{ height: 22 }} />
        <h1 style={{
          fontSize: 60, fontWeight: 900, color: "#2E84AD", margin: 0, letterSpacing: -1.5,
          textShadow: "0 3px 0 #ffffff", lineHeight: 1, textAlign: "center", whiteSpace: "nowrap",
        }}>
          Piano<span style={{ color: "var(--ink)" }}> Professor</span>
        </h1>
        <p style={{ fontSize: 21, fontWeight: 800, color: "#A98B2E", margin: "14px 0 0" }}>Real piano. Lit keys. Learn fast.</p>
      </div>

      <div style={{ width: 360, marginTop: 30, opacity: 0.96 }}>
        <Piano low={60} high={72} lit={lit} led interactive={false} hideNoteNames height={120} />
      </div>

      <div style={{ height: 40, marginTop: 28, display: "grid", placeItems: "center" }}>
        {phase === "load" ? (
          <div style={{ width: 220, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <ProgressBar value={70} color="#F5B800" height={10} style={{ width: 220 }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: "#B79A3E" }}>Tuning your keys…</span>
          </div>
        ) : (
          <div style={{ animation: "pp-pop .4s" }}>
            <ChunkyButton variant="sky" size="xl" glow onClick={() => { PP_Audio.ensure(); PP_Audio.arp([60, 64, 67, 72]); ctx.go("who"); }}>
              Let's Play
            </ChunkyButton>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------- WHO'S PLAYING ------------------------- */
function ScreenWho({ ctx }) {
  const [manage, setManage] = useS1(false);
  const profiles = ctx.profiles;
  const pick = (p) => {
    if (manage) { ctx.go("editProfile", { editId: p.id }); return; }
    PP_Audio.correct();
    ctx.setActiveId(p.id);
    ctx.go(p.placed ? "home" : "onboarding");
  };
  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", overflow: "hidden",
      background: "radial-gradient(130% 100% at 50% -10%, #2C7A0E 0%, #1f5e09 60%, #16480a 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff",
    }}>
      {[..."123456"].map((_, i) => (
        <span key={i} style={{ position: "absolute", fontSize: 30, opacity: 0.12,
          left: `${8 + i * 16}%`, top: `${(i % 2) * 70 + 8}%`, transform: `rotate(${i * 24}deg)` }}>♪</span>
      ))}
      <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, marginBottom: 6 }}>Who's playing?</h1>
      <p style={{ fontSize: 18, fontWeight: 700, color: "#CDEFB6", marginBottom: 34 }}>Everyone gets their own streak, songs & progress.</p>

      <div style={{ display: "flex", gap: 26, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center", maxWidth: 980 }}>
        {profiles.map((p) => (
          <div key={p.id} onClick={() => pick(p)} className="pp-prof"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, cursor: "pointer", width: 150, animation: manage ? "pp-jiggle .35s infinite" : "none" }}>
            <div style={{ position: "relative" }}>
              <Maestro mood={p.avatar} size={132} bg="var(--cream)" ring={5} ringColor="#ffffff22" />
              {manage && (
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#00000055", display: "grid", placeItems: "center" }}>
                  <Icon name="pencil" size={34} color="#fff" />
                </div>
              )}
              {!manage && (
                <div style={{ position: "absolute", bottom: -4, right: -4, background: "var(--surface)", borderRadius: 999, padding: "3px 9px", display: "flex", alignItems: "center", gap: 3, boxShadow: "0 2px 6px #0003" }}>
                  <span style={{ fontSize: 14 }}>🔥</span>
                  <span style={{ fontWeight: 900, color: "#C2410C", fontSize: 15 }}>{p.streak}</span>
                </div>
              )}
            </div>
            <span style={{ fontSize: 22, fontWeight: 800 }}>{p.name}</span>
          </div>
        ))}
        {profiles.length < 5 && (
          <div onClick={() => ctx.go("createProfile")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, cursor: "pointer", width: 150 }}>
            <div style={{ width: 132, height: 132, borderRadius: "50%", border: "4px dashed #ffffff44", display: "grid", placeItems: "center", background: "#ffffff10" }}>
              <Icon name="plus" size={56} color="#ffffffcc" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#CDEFB6" }}>Add profile</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 40 }}>
        <ChunkyButton variant={manage ? "white" : "dark"} size="md" onClick={() => setManage((m) => !m)}
          icon={<Icon name={manage ? "check" : "gear"} size={20} color={manage ? "#46A302" : "#fff"} />}>
          {manage ? "Done" : "Manage profiles"}
        </ChunkyButton>
      </div>
    </div>
  );
}

/* ------------------------- CREATE / EDIT PROFILE ------------------ */
function ScreenCreateProfile({ ctx }) {
  const editing = ctx.params.editId ? ctx.profiles.find((p) => p.id === ctx.params.editId) : null;
  const [name, setName] = useS1(editing ? editing.name : "");
  const [sel, setSel] = useS1(editing ? PP_AVATARS.findIndex((a) => a.mood === editing.avatar) : 0);
  const [err, setErr] = useS1("");
  const [lang, setLang] = useS1(editing ? (editing.lang || "en") : "en");
  const av = PP_AVATARS[sel < 0 ? 0 : sel];

  const save = () => {
    if (!name.trim()) { setErr("Give your profile a name"); PP_Audio.wrong(); return; }
    if (editing) {
      ctx.updateProfile(editing.id, { name: name.trim(), avatar: av.mood, bg: av.bg, lang: lang });
      ctx.back();
    } else {
      const id = "p" + Date.now();
      ctx.setProfiles([...ctx.profiles, { id, name: name.trim(), avatar: av.mood, bg: av.bg, color: "#58CC02", streak: 0, xp: 0, gems: 0, hearts: 5, levelId: null, grade: null, placed: false, path: null, lastUnit: null, lang: lang }]);
      ctx.setActiveId(id);
      PP_Audio.success();
      ctx.go("onboarding");
    }
  };
  const del = () => { ctx.setProfiles(ctx.profiles.filter((p) => p.id !== editing.id)); ctx.go("who"); };

  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", padding: "28px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => ctx.back()} style={ghostIcon}><Icon name="chevronLeft" size={28} color="var(--ink)" /></button>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{editing ? t("create.edit", lang) : t("create.title", lang)}</h1>
      </div>

      <div style={{ flex: 1, display: "flex", gap: 50, alignItems: "center", justifyContent: "center" }}>
        {/* preview + name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, width: 320 }}>
          <Maestro mood={av.mood} size={180} bg="var(--cream)" ring={6} ringColor="#fff" float style={{ boxShadow: "0 12px 30px #0002" }} />
          <div style={{ width: "100%" }}>
            <label style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-faint)", marginLeft: 6 }}>FIRST NAME</label>
            <input value={name} maxLength={14} autoFocus
              onChange={(e) => { setName(e.target.value); setErr(""); }}
              placeholder="Type a name"
              style={{
                width: "100%", marginTop: 6, padding: "16px 20px", fontSize: 22, fontWeight: 800,
                fontFamily: "Nunito", borderRadius: 18, border: `2.5px solid ${err ? "#FF4B4B" : "var(--line)"}`,
                background: "var(--surface)", color: "var(--ink)", outline: "none", boxShadow: "inset 0 2px 4px #0000000a",
              }} />
            {err && <span style={{ color: "#FF4B4B", fontWeight: 800, fontSize: 14, marginLeft: 6 }}>{err}</span>}
          </div>
          <div style={{ width: "100%" }}>
            <label style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-faint)", marginLeft: 6 }}>LANGUAGE</label>
            <div style={{ marginTop: 6 }}><LangDropdown value={lang} onChange={setLang} /></div>
          </div>
        </div>

        {/* avatar picker */}
        <div style={{ width: 460 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-faint)", marginBottom: 12 }}>{t("create.pickMaestro", lang).toUpperCase()}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
            {PP_AVATARS.map((a, i) => (
              <div key={a.mood} onClick={() => { setSel(i); PP_Audio.tap(); }}
                style={{ cursor: "pointer", borderRadius: "50%", padding: 3, width: "fit-content", justifySelf: "center", lineHeight: 0, transition: "transform .1s", transform: sel === i ? "scale(1.06)" : "scale(1)",
                  boxShadow: sel === i ? "0 0 0 4px #2F9BD6" : "0 0 0 2px #00000010" }}>
                <Maestro mood={a.mood} size={62} bg="var(--cream)" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 16, alignItems: "center" }}>
        <ChunkyButton variant="sky" size="lg" onClick={save} style={{ minWidth: 280 }}>{editing ? t("common.save", lang) : t("create.create", lang)}</ChunkyButton>
        {editing && ctx.profiles.length > 1 && (
          <ChunkyButton variant="ghost" size="md" onClick={del} icon={<Icon name="trash" size={20} color="#C81E1E" />} style={{ color: "#C81E1E" }}>Delete</ChunkyButton>
        )}
      </div>
    </div>
  );
}

/* --------------------------- ONBOARDING --------------------------- */
function ScreenOnboarding({ ctx }) {
  const [i, setI] = useS1(0);
  const litDemo = useCyclingLit([60, 64, 67, 72], ["#58CC02", "#5BB8E3", "#F5B800", "#FF7A52"], 500);
  const slides = [
    {
      bg: "linear-gradient(160deg,#FFFDF6,#E9F8DC)", accent: "#58CC02",
      art: <Maestro mood="teach" size={220} bg="#D7F5C2" ring={8} ringColor="#fff" float />,
      title: "Meet Maestro", body: "Your friendly AI teacher listens as you play and guides every step — no boring theory, no pressure.",
    },
    {
      bg: "linear-gradient(160deg,#FFFDF6,#DFF1FB)", accent: "#5BB8E3",
      art: <div style={{ width: 420 }}><Piano low={60} high={72} lit={litDemo} led interactive={false} hideNoteNames height={170} /></div>,
      title: "Your keys light up", body: "Clip our LED strip onto any piano. The exact keys glow in real time — just follow the lights and you're playing.",
    },
    {
      bg: "linear-gradient(160deg,#FFFDF6,#FFEFD2)", accent: "#F5B800",
      art: (
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ animation: "pp-float 3s infinite" }}><StatChip kind="streak" value="12" big /></div>
          <div style={{ animation: "pp-float 3s .3s infinite" }}><StatChip kind="xp" value="3480" big /></div>
          <div style={{ animation: "pp-float 3s .6s infinite" }}><StatChip kind="gems" value="240" big /></div>
        </div>
      ),
      title: "Streaks keep you going", body: "Earn XP, collect gems and build a daily streak. Ten minutes a day turns into real songs — fast.",
    },
    {
      bg: "linear-gradient(160deg,#FFFDF6,#E9F8DC)", accent: "#58CC02",
      art: (
        <div style={{ position: "relative", width: 240, height: 240, display: "grid", placeItems: "center" }}>
          <Maestro mood="teach" size={220} bg="#D7F5C2" ring={8} ringColor="#fff" float />
          <div style={{ position: "absolute", bottom: 16, right: 6, width: 74, height: 74, borderRadius: "50%", background: "linear-gradient(180deg,#6FE018,#46A302)", display: "grid", placeItems: "center", boxShadow: "0 6px 0 #3D8E00", border: "4px solid var(--cream)" }}><Icon name="mic" size={38} color="#fff" /></div>
        </div>
      ),
      title: "Maestro listens as you play", body: "Piano Professor uses your microphone to hear the notes you play and give instant feedback. Audio stays on your device — it's never recorded or shared.",
    },
  ];
  const s = slides[i];
  const next = () => { if (i < slides.length - 1) { setI(i + 1); PP_Audio.tap(); } else { PP_Audio.success(); ctx.go("placement"); } };

  return (
    <div className="pp-dark-scene" style={{ width: "100%", height: "100%", background: s.bg, transition: "background .5s", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "22px 30px" }}>
        <button onClick={() => ctx.go("placement")} style={{ ...ghostIcon, width: "auto", padding: "8px 16px", fontWeight: 800, color: "var(--ink-faint)", fontSize: 16 }}>Skip</button>
      </div>
      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, animation: "pp-slide-up .5s", padding: "0 80px" }}>
        <div style={{ height: 240, display: "grid", placeItems: "center" }}>{s.art}</div>
        <div style={{ textAlign: "center", maxWidth: 620 }}>
          <h1 style={{ fontSize: 46, fontWeight: 900, color: "var(--ink)", margin: 0, marginBottom: 14 }}>{s.title}</h1>
          <p style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.45, color: "var(--ink-soft)" }}>{s.body}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 30, padding: "0 0 46px" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {slides.map((_, j) => (
            <div key={j} onClick={() => setI(j)} style={{ width: j === i ? 30 : 12, height: 12, borderRadius: 999, background: j === i ? s.accent : "#0000001f", transition: "all .3s", cursor: "pointer" }} />
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 40, right: 60 }}>
        <ChunkyButton variant={i === slides.length - 1 ? "green" : "sky"} size="lg" glow={i === slides.length - 1} onClick={next} icon={i === slides.length - 1 ? <Icon name="mic" size={22} color="#fff" /> : <Icon name="arrowRight" size={22} color="#fff" />}>
          {i === slides.length - 1 ? "Allow microphone" : "Next"}
        </ChunkyButton>
      </div>
    </div>
  );
}

const ghostIcon = { width: 48, height: 48, borderRadius: 14, border: "2px solid var(--line)", background: "var(--surface)", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 2px 0 var(--line)" };

Object.assign(window, { ScreenSplash, ScreenWho, ScreenCreateProfile, ScreenOnboarding, ghostIcon });
