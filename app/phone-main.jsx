/* ===================================================================
   Piano Professor — PHONE LANDSCAPE: shell, home, lesson, tabs, money, hw
   =================================================================== */
const { useState: usePh2, useEffect: usePh2E, useRef: usePh2R } = React;

/* ----------------------------- SHELL ------------------------------ */
function PhRail({ ctx, active }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const items = [
    { id: "home", icon: "home" }, { id: "songs", icon: "library" },
    { id: "practice", icon: "piano" }, { id: "profile", icon: "user" },
  ];
  return (
    <div style={{ width: 58, flexShrink: 0, background: "var(--surface)", borderRight: "2px solid var(--line)", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", gap: 4 }}>
      <div onClick={() => ctx.go("home")} style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(150deg,#56B4E8,#1E6E99)", display: "grid", placeItems: "center", boxShadow: "0 3px 0 #1E6E99", marginBottom: 6, cursor: "pointer" }}><Icon name="music" size={20} color="#fff" /></div>
      {items.map((it) => {
        const on = active === it.id;
        return <button key={it.id} onClick={() => { ctx.go(it.id); PP_Audio.tap(); }} style={{ width: 44, height: 40, borderRadius: 12, border: "none", cursor: "pointer", background: on ? "var(--nav-active)" : "transparent", display: "grid", placeItems: "center" }}><Icon name={it.icon} size={22} color={on ? "#2E84AD" : "#B4AA8C"} /></button>;
      })}
      <div style={{ flex: 1 }} />
      <button onClick={() => { ctx.go("pair"); PP_Audio.tap(); }} style={{ width: 44, height: 40, borderRadius: 12, border: "none", cursor: "pointer", background: "transparent", display: "grid", placeItems: "center", position: "relative" }}>
        <Icon name="bluetooth" size={20} color={ctx.led.connected ? "#5BB8E3" : "#B4AA8C"} />
        {ctx.led.connected && <span style={{ position: "absolute", top: 4, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#58CC02", border: "1.5px solid #fff" }} />}
      </button>
      <button onClick={() => { ctx.go("settings"); PP_Audio.tap(); }} style={{ width: 44, height: 40, borderRadius: 12, border: "none", cursor: "pointer", background: active === "settings" ? "var(--nav-active)" : "transparent", display: "grid", placeItems: "center" }}><Icon name="gear" size={20} color={active === "settings" ? "#2E84AD" : "#B4AA8C"} /></button>
    </div>
  );
}

function PhHeader({ ctx, title, sub }) {
  const p = ctx.activeProfile; if (!p) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px 4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Maestro mood={p.avatar} size={38} bg="var(--cream)" ring={2.5} ringColor="#5BB8E3" onClick={() => ctx.go("who")} style={{ cursor: "pointer" }} />
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", margin: 0, lineHeight: 1, whiteSpace: "nowrap" }}>{title || `${t("home.hi", (p.lang||"en"))} ${p.name}!`}</h1>
          <p style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink-faint)", margin: "2px 0 0", whiteSpace: "nowrap" }}>{sub || t("home.ready", (p.lang||"en"))}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <StatChip kind="streak" value={p.streak} />
        <StatChip kind="xp" value={p.xp >= 1000 ? (p.xp / 1000).toFixed(1) + "k" : p.xp} />
        <StatChip kind="hearts" value={p.hearts} onClick={() => p.hearts < 5 && ctx.go("upsell", { reason: "hearts" })} />
        {!ctx.premium && <button onClick={() => ctx.go("paywall")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 999, border: "none", cursor: "pointer", background: "linear-gradient(180deg,#FFCB2E,#F5B800)", boxShadow: "0 2px 0 #C28A00", fontFamily: "Nunito", fontWeight: 900, fontSize: 12, color: "#5a3d00" }}><Icon name="crown" size={15} color="#5a3d00" />PRO</button>}
      </div>
    </div>
  );
}

function PhShell({ ctx, active, children }) {
  return <div style={{ width: "100%", height: "100%", display: "flex", background: "var(--cream)", overflow: "hidden" }}><PhRail ctx={ctx} active={active} /><div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>{children}</div></div>;
}

/* ------------------------- POSTER (compact) ----------------------- */
const PH_KIND_ICON = { lesson: "grad", song: "music", concept: "book", exercise: "bolt2" };
function PhPoster({ item, color, deep, ctx }) {
  const [shake, setShake] = usePh2(false);
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const loc = tItem(item, lang);
  const locked = item.state === "locked", soon = item.state === "soon", done = item.state === "done", activeU = item.state === "active";
  const click = () => {
    if (soon) { ctx.toast(t("card.soon", lang)); return; }
    if (locked) { if (item.premium && !ctx.premium) { ctx.go("paywall"); return; } setShake(true); setTimeout(() => setShake(false), 400); PP_Audio.wrong(); ctx.toast(t("card.locked", lang)); return; }
    PP_Audio.correct(); ctx.go("lesson", { item });
  };
  return (
    <div onClick={click} style={{ width: 150, flexShrink: 0, cursor: "pointer", animation: shake ? "pp-jiggle .4s" : "none", borderRadius: 16, background: "var(--surface)", border: `2px solid ${activeU ? color : "var(--line)"}`, boxShadow: activeU ? `0 4px 0 ${deep}` : "0 3px 0 var(--line)", overflow: "hidden" }}>
      <div style={{ height: 74, position: "relative", background: locked || soon ? "var(--surface-2)" : `linear-gradient(150deg,${color},${deep})`, display: "grid", placeItems: "center" }}>
        {!locked && !soon && <Icon name={PH_KIND_ICON[item.kind]} size={30} color="#ffffffcc" />}
        {(locked || soon) && <div style={{ display: "grid", placeItems: "center", gap: 3 }}><Icon name={soon ? "refresh" : "lock"} size={24} color="#B4AA8C" />{item.premium && !ctx.premium && <span style={{ fontSize: 9, fontWeight: 900, color: "#C28A00", background: "#FFF1C9", padding: "1px 7px", borderRadius: 999 }}>PRO</span>}</div>}
        {done && <div style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "var(--surface)", display: "grid", placeItems: "center", boxShadow: "0 2px 4px #0003" }}><Icon name="check" size={14} color="#58CC02" /></div>}
        <span style={{ position: "absolute", top: 6, left: 7, fontSize: 9, fontWeight: 900, color: locked || soon ? "#9A8F6F" : "#ffffffdd", textTransform: "uppercase", letterSpacing: .5 }}>{t("kind." + item.kind, lang)}</span>
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: locked || soon ? "#9A8F6F" : "var(--ink)", margin: 0, lineHeight: 1.05 }}>{loc.title}</h3>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-faint)", margin: "2px 0 0" }}>{loc.sub}</p>
        {done && <div style={{ display: "flex", gap: 2, marginTop: 6 }}>{[0, 1, 2].map((i) => <Icon key={i} name="star" size={13} color={i < item.stars ? "#F5B800" : "#E4DCC0"} />)}</div>}
        {activeU && <div style={{ marginTop: 7 }}><ProgressBar value={item.progress} color={color} height={8} /><span style={{ fontSize: 10, fontWeight: 800, color, marginTop: 3, display: "block" }}>{item.progress}% · {t("card.continue", lang)}</span></div>}
      </div>
    </div>
  );
}

function PhShelf({ shelf, ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const shelfTitle = tLevel(shelf.levelId, lang) + " · " + t("grade", lang) + " " + (shelf.title.match(/\d+/) || [""])[0];
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 18px 7px" }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: shelf.color }} />
        <h2 style={{ fontSize: 15, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{shelfTitle}</h2>
      </div>
      <div className="pp-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", padding: "2px 18px 6px" }}>
        {shelf.items.map((it) => <PhPoster key={it.id} item={it} color={shelf.color} deep={shelf.deep} ctx={ctx} />)}
      </div>
    </div>
  );
}

/* ------------------------------ HOME ------------------------------ */
function PhHomeSkeleton() {
  return (
    <div style={{ flex: 1, overflow: "hidden", padding: "4px 0" }}>
      <div style={{ padding: "4px 18px 14px" }}><Shimmer w="100%" h={92} r={20} /></div>
      {[0, 1].map((s) => (
        <div key={s} style={{ marginBottom: 14 }}>
          <div style={{ padding: "0 18px 7px" }}><Shimmer w={160} h={16} r={6} /></div>
          <div style={{ display: "flex", gap: 12, padding: "0 18px" }}>{[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ width: 150, flexShrink: 0 }}><Shimmer w="100%" h={74} r={16} /><Shimmer w="75%" h={12} r={5} style={{ marginTop: 8 }} /></div>)}</div>
        </div>
      ))}
    </div>
  );
}
function PhHome({ ctx }) {
  const p = ctx.activeProfile;
  const lang = p.lang || "en";
  const lvl = PP_LEVELS.find((l) => l.id === p.levelId) || PP_LEVELS[1];
  const [state, setState] = usePh2(ctx.params.state || "ready");
  usePh2E(() => { if (state === "loading") { const t = setTimeout(() => setState("ready"), 1500); return () => clearTimeout(t); } }, [state]);
  return (
    <PhShell ctx={ctx} active="home">
      <PhHeader ctx={ctx} />
      {state === "loading" && <PhHomeSkeleton />}
      {state === "empty" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 26, padding: 30 }}>
          <Maestro mood="welcome-piano" size={120} bg="#EAF8DC" ring={5} ringColor="#fff" float />
          <div style={{ maxWidth: 360 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Let's play your first note!</h1>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", margin: "8px 0 16px", lineHeight: 1.4 }}>You're placed in {lvl.name}. Your first lesson takes about 3 minutes.</p>
            <div style={{ display: "flex", gap: 10 }}>
              {!ctx.led.connected && <ChunkyButton variant="sky" size="md" onClick={() => ctx.go("pair")} icon={<Icon name="bluetooth" size={18} color="#fff" />}>Pair LED</ChunkyButton>}
              <ChunkyButton variant="sky" size="md" glow onClick={() => { PP_Audio.correct(); ctx.go("lesson", { item: { title: "Your First Notes", kind: "lesson" } }); }} icon={<Icon name="play" size={18} color="#fff" />}>Lesson 1</ChunkyButton>
            </div>
          </div>
        </div>
      )}
      {state === "error" && (
        <StateScaffold mood="confused" moodBg="#FBEEE6" title="Couldn't load your lessons" body="Check your connection — your progress is safe in the cloud."
          primary={<ChunkyButton variant="sky" size="md" onClick={() => setState("loading")} icon={<Icon name="refresh" size={18} color="#fff" />}>Try again</ChunkyButton>}
          secondary={<ChunkyButton variant="ghost" size="md" onClick={() => ctx.go("practice")}>Practice offline</ChunkyButton>} />
      )}
      {state === "ready" && (
        <div className="pp-scroll" style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
          <div style={{ padding: "4px 18px 12px" }}>
            <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: `linear-gradient(120deg,${lvl.color},${lvl.deep})`, padding: "16px 20px", boxShadow: `0 6px 18px ${lvl.color}44` }}>
              <div style={{ position: "absolute", right: -6, top: -10, fontSize: 120, opacity: .12 }}>🎹</div>
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 900, color: "#ffffffcc", letterSpacing: .8, textTransform: "uppercase" }}>{t("home.continueLearning", lang)} · {p.path === "soloist" ? "Soloist" : "Chords"}</span>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "3px 0 2px", textShadow: "0 2px 0 #00000022" }}>{tUnit(p.lastUnit, lang) || "Pop Chords I"}</h2>
                  <p style={{ fontSize: 12.5, fontWeight: 800, color: "#ffffffdd", margin: "0 0 10px" }}>{tLevel(lvl.id, lang)} · {t("grade", lang)} {p.grade} · {t("home.lessonOf", lang)}</p>
                  <div style={{ maxWidth: 280, marginBottom: 12 }}><ProgressBar value={60} color="#fff" track="#ffffff33" height={11} /></div>
                  <ChunkyButton variant="white" size="md" onClick={() => { PP_Audio.correct(); ctx.go("lesson", { item: { title: p.lastUnit || "Pop Chords I", kind: "lesson" } }); }} icon={<Icon name="play" size={18} color="#2E84AD" />}>{t("home.continue", lang)}</ChunkyButton>
                </div>
                <Maestro mood="cool" size={88} bg="#ffffff22" ring={3} ringColor="#ffffff55" float />
              </div>
            </div>
          </div>
          {PP_SHELVES.map((sh) => <PhShelf key={sh.levelId} shelf={sh} ctx={ctx} />)}
        </div>
      )}
    </PhShell>
  );
}

/* --------------------------- LESSON PLAYER ------------------------ */
function PhLesson({ ctx }) {
  const lesson = PP_LESSON; const p = ctx.activeProfile;
  const [loadState, setLoadState] = usePh2(ctx.params.state === "loading" ? "loading" : "ready");
  const [ledError, setLedError] = usePh2(ctx.params.state === "error");
  const [stepIdx, setStepIdx] = usePh2(0);
  const [hearts, setHearts] = usePh2(p ? p.hearts : 5);
  const [played, setPlayed] = usePh2([]);
  const [feedback, setFeedback] = usePh2(null);
  const [mood, setMood] = usePh2("teach");
  const lang = (p && p.lang) || "en";
  const PROMPT_KEY = { 1: "prompt_playC", 3: "prompt_cChord", 5: "prompt_gChord", 6: "prompt_switch" };
  const stepText = (i) => tLesson("step" + i, lang);
  const stepPrompt = (i) => (PROMPT_KEY[i] ? tLesson(PROMPT_KEY[i], lang) : "");
  const [bubble, setBubble] = usePh2(tLesson("step0", lang));
  const step = lesson.steps[stepIdx]; const totalSteps = lesson.steps.length;
  const say = (txt) => { if (ctx.muted) return; try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = langTTS(lang); u.rate = 1.02; u.pitch = 1.15; u.volume = .9; const vs = window.speechSynthesis.getVoices(); const v = vs.find((x) => x.lang && x.lang.toLowerCase().startsWith(langTTS(lang).slice(0,2))); if (v) u.voice = v; window.speechSynthesis.speak(u); } catch (e) {} };
  usePh2E(() => {
    setBubble(stepText(stepIdx)); setPlayed([]); setFeedback(null);
    if (step.type === "teach") { setMood("teach"); say(stepText(stepIdx)); const n = Object.keys(step.notes || {}).map(Number); n.length === 1 ? PP_Audio.note(n[0], .4) : PP_Audio.chord(n, 1.4); } else setMood("conduct");
    return () => { try { window.speechSynthesis.cancel(); } catch (e) {} };
  }, [stepIdx]);
  usePh2E(() => { if (loadState === "loading") { const t = setTimeout(() => setLoadState("ready"), 1600); return () => clearTimeout(t); } }, [loadState]);
  const advance = () => { if (stepIdx < totalSteps - 1) setStepIdx(stepIdx + 1); else finish(); };
  const finish = () => { const stars = hearts >= 5 ? 3 : hearts >= 3 ? 2 : 1; ctx.updateProfile(p.id, { hearts, xp: p.xp + 40 }); ctx.go("complete", { item: { title: lesson.title }, stars, xp: 40 }); };
  const onPlay = (midi) => {
    if (step.type !== "quiz" || feedback === "correct") return;
    const target = step.target; const np = [...played, midi]; setPlayed(np);
    if (step.seq) { const idx = np.length - 1; if (midi !== target[idx]) { miss(); setPlayed([]); return; } if (np.length === target.length) hit(); }
    else { const need = new Set(target); if (!need.has(midi)) { miss(); setPlayed(np.filter((n) => need.has(n))); return; } if (new Set(np.filter((n) => need.has(n))).size === need.size) hit(); }
  };
  const hit = () => { setFeedback("correct"); setMood("cheer"); setBubble(t("lesson.perfect", lang)); PP_Audio.correct(); setTimeout(advance, 1000); };
  const miss = () => { setFeedback("wrong"); setMood("sad"); setBubble(t("lesson.notQuite", lang)); PP_Audio.wrong(); setHearts((h) => { const nh = Math.max(0, h - 1); if (nh === 0) setTimeout(() => ctx.go("upsell", { reason: "hearts" }), 700); return nh; }); setTimeout(() => { if (hearts > 1) { setFeedback(null); setMood("conduct"); setBubble(step.text); } }, 1100); };
  const lit = step.type === "teach" ? step.notes : (feedback === "correct" ? Object.keys(step.lit).reduce((a, k) => (a[k] = "#58CC02", a), {}) : step.lit);

  if (loadState === "loading") return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "var(--lesson-bg)" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", border: "7px solid var(--line)", borderTopColor: "#58CC02", animation: "pp-spin .9s linear infinite" }} />
      <Maestro mood="idea" size={72} bg="#FFF0CE" float />
      <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Setting up your lesson…</h2>
    </div>
  );

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "var(--lesson-bg)", position: "relative", overflow: "hidden" }}>
      {feedback === "correct" && <Confetti run count={50} />}
      {ledError && (
        <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(20,16,10,.5)", backdropFilter: "blur(5px)", display: "grid", placeItems: "center" }}>
          <div style={{ width: 420, background: "var(--surface)", borderRadius: 22, padding: "22px 26px", boxShadow: "0 20px 50px #0006", textAlign: "center", animation: "pp-pop .3s" }}>
            <Maestro mood="nervous" size={80} bg="#FBEEE6" ring={4} ringColor="#fff" style={{ margin: "0 auto 8px" }} />
            <h2 style={{ fontSize: 21, fontWeight: 900, color: "var(--ink)", margin: "0 0 6px" }}>Lost the LED strip</h2>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", margin: "0 auto 16px", maxWidth: 320, lineHeight: 1.35 }}>Keep going with on-screen keys, or reconnect.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <ChunkyButton variant="ghost" size="sm" onClick={() => setLedError(false)}>On screen</ChunkyButton>
              <ChunkyButton variant="sky" size="sm" onClick={() => { ctx.setLed({ ...ctx.led, connected: true }); setLedError(false); PP_Audio.success(); }} icon={<Icon name="bluetooth" size={16} color="#fff" />}>Reconnect</ChunkyButton>
            </div>
          </div>
        </div>
      )}
      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px 4px" }}>
        <button onClick={() => ctx.go("home")} style={phGhost}><Icon name="close" size={20} color="var(--ink)" /></button>
        <div style={{ flex: 1, display: "flex", gap: 4 }}>{lesson.steps.map((_, i) => <div key={i} style={{ flex: 1, height: 10, borderRadius: 999, background: i < stepIdx ? "#2F9BD6" : i === stepIdx ? "#7FCBED" : "var(--line)", transition: "background .3s" }} />)}</div>
        <div style={{ display: "flex", gap: 2 }}>{[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ fontSize: 17, filter: i < hearts ? "none" : "grayscale(1) opacity(.35)", animation: feedback === "wrong" && i === hearts ? "pp-jiggle .4s" : "none" }}>❤️</span>)}</div>
      </div>
      {/* instructor row */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", minHeight: 0 }}>
        <Maestro mood={mood} size={84} bg={feedback === "wrong" ? "#FFE0E0" : feedback === "correct" ? "#E4F8D2" : "#FFF0CE"} ring={4} ringColor="#fff" float style={{ flexShrink: 0, boxShadow: "0 6px 16px #0002" }} />
        <div style={{ position: "relative", background: "var(--surface)", borderRadius: 18, padding: "12px 18px", boxShadow: "0 4px 0 var(--line)", border: "2px solid var(--line)", flex: 1, minWidth: 0 }}>
          <div style={{ position: "absolute", left: -10, top: 24, width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderRight: "12px solid var(--surface)" }} />
          {step.type === "quiz" && <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EAF8DC", color: "#3D8E00", fontWeight: 900, fontSize: 11.5, padding: "3px 11px", borderRadius: 999, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}><Icon name="target" size={13} color="#3D8E00" />{stepPrompt(stepIdx)}</div>}
          <p style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", margin: 0, lineHeight: 1.25 }}>{bubble}</p>
        </div>
        {step.type === "teach" && <ChunkyButton variant="sky" size="md" onClick={advance} icon={<Icon name="arrowRight" size={18} color="#fff" />} style={{ flexShrink: 0 }}>{t("common.gotIt", lang)}</ChunkyButton>}
        <div style={{ position: "absolute", top: 50, right: 20, display: "flex", alignItems: "center", gap: 6, background: ctx.led.connected ? "var(--sel-sky)" : "#FBEEE6", border: `2px solid ${ctx.led.connected ? "#BBE3F4" : "#F3D3BE"}`, borderRadius: 999, padding: "4px 10px" }}>
          <Icon name="bluetooth" size={13} color={ctx.led.connected ? "#2E84AD" : "#C2410C"} /><span style={{ fontWeight: 800, fontSize: 11, color: ctx.led.connected ? "#2E84AD" : "#C2410C" }}>{ctx.led.connected ? t("lesson.ledOn", lang) : t("lesson.ledOff", lang)}</span>
        </div>
      </div>
      {/* keyboard */}
      <div style={{ padding: "0 14px 12px" }}><Piano low={55} high={84} lit={lit} labels={step.labels || {}} led height={150} onPlay={onPlay} interactive={step.type === "quiz" && feedback !== "correct"} /></div>
    </div>
  );
}

/* ------------------------- LESSON COMPLETE ------------------------ */
function PhComplete({ ctx }) {
  const stars = ctx.params.stars != null ? ctx.params.stars : 3;
  const xp = ctx.params.xp || 40; const title = (ctx.params.item && ctx.params.item.title) || "Pop Chords I"; const p = ctx.activeProfile;
  const [shown, setShown] = usePh2(0); const [phase, setPhase] = usePh2(0);
  usePh2E(() => { PP_Audio.success(); const ts = []; for (let i = 1; i <= stars; i++) ts.push(setTimeout(() => { setShown(i); PP_Audio.star(i - 1); }, 400 + i * 320)); ts.push(setTimeout(() => setPhase(1), 400 + stars * 320 + 300)); return () => ts.forEach(clearTimeout); }, []);
  return (
    <div className="pp-dark-scene" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 36, position: "relative", overflow: "hidden", background: "radial-gradient(120% 130% at 50% -10%, #FFF6D6 0%, #FFFAEC 55%)" }}>
      <Confetti run count={120} />
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 6, justifyContent: "center" }}>{[0, 1, 2].map((i) => <div key={i} style={{ transform: i < shown ? "scale(1)" : "scale(0)", transition: "transform .4s cubic-bezier(.3,1.8,.5,1)" }}><Icon name="star" size={i === 1 ? 66 : 54} color={i < stars ? "#F5B800" : "#E4DCC0"} style={{ filter: i < shown ? "drop-shadow(0 4px 0 #C28A00)" : "none", marginTop: i === 1 ? -10 : 6 }} /></div>)}</div>
        <Maestro mood={stars === 3 ? "trophy" : "cheer"} size={92} bg="#FFE38A" ring={4} ringColor="#fff" float style={{ margin: "0 auto" }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 900, color: "#F5B800", letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>Lesson complete</p>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--ink)", margin: "4px 0 14px" }}>{title}</h1>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, opacity: phase ? 1 : 0, transform: phase ? "none" : "translateY(12px)", transition: ".5s" }}>
          {[{ e: "⚡", v: "+" + xp, l: "XP", c: "#F5B800" }, { e: "🔥", v: (p ? p.streak : 12), l: "Streak", c: "#FF7A52" }, { e: "🎯", v: stars === 3 ? "100%" : stars === 2 ? "85%" : "70%", l: "Accuracy", c: "#58CC02" }].map((r) => (
            <div key={r.l} style={{ background: "var(--surface)", borderRadius: 15, padding: "10px 16px", border: "2px solid var(--line)", boxShadow: "0 3px 0 var(--line)", textAlign: "center", minWidth: 84 }}>
              <div style={{ fontSize: 22 }}>{r.e}</div><div style={{ fontSize: 20, fontWeight: 900, color: r.c }}>{r.v}</div><div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase" }}>{r.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, opacity: phase ? 1 : 0, transition: ".5s .1s" }}>
          <ChunkyButton variant="ghost" size="md" onClick={() => ctx.go("home")}>Learn</ChunkyButton>
          <ChunkyButton variant="gold" size="md" glow onClick={() => { PP_Audio.success(); ctx.go("diploma"); }} icon={<Icon name="grad" size={18} color="#5a3d00" />}>{t("dip.getDiploma", (p && p.lang) || "en")}</ChunkyButton>
          <ChunkyButton variant="sky" size="md" glow onClick={() => { PP_Audio.correct(); ctx.go("lesson", { item: { title: "Both Hands" } }); }} icon={<Icon name="arrowRight" size={18} color="#fff" />}>Next lesson</ChunkyButton>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PhRail, PhHeader, PhShell, PhPoster, PhShelf, PhHome, PhLesson, PhComplete });
