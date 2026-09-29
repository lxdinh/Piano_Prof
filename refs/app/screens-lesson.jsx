/* ===================================================================
   Piano Professor — Lesson Player (landscape) + Lesson Complete
   =================================================================== */
const { useState: useSL, useEffect: useEL, useRef: useRL } = React;

function ScreenLesson({ ctx }) {
  const lesson = PP_LESSON;
  const p = ctx.activeProfile;
  const [loadState, setLoadState] = useSL(ctx.params.state === "loading" ? "loading" : "ready");
  const [ledError, setLedError] = useSL(ctx.params.state === "error");
  const [stepIdx, setStepIdx] = useSL(0);
  const [hearts, setHearts] = useSL(p ? p.hearts : 5);
  const [played, setPlayed] = useSL([]);       // notes pressed for current quiz
  const [feedback, setFeedback] = useSL(null);   // 'correct' | 'wrong' | null
  const [mood, setMood] = useSL("teach");
  const lang = (p && p.lang) || "en";
  const [bubble, setBubble] = useSL(tLesson("step0", lang));
  const [done, setDone] = useSL(false);
  const step = lesson.steps[stepIdx];
  const totalSteps = lesson.steps.length;
  // localized prompt per quiz step
  const PROMPT_KEY = { 1: "prompt_playC", 3: "prompt_cChord", 5: "prompt_gChord", 6: "prompt_switch" };
  const stepText = (i) => tLesson("step" + i, lang);
  const stepPrompt = (i) => (PROMPT_KEY[i] ? tLesson(PROMPT_KEY[i], lang) : "");

  // narrate via TTS — instructor voice in the profile's language
  const say = (text) => {
    if (ctx.muted) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = langTTS(lang);
      u.rate = 1.02; u.pitch = 1.15; u.volume = 0.9;
      const vs = window.speechSynthesis.getVoices();
      const v = vs.find((x) => x.lang && x.lang.toLowerCase().startsWith(langTTS(lang).slice(0,2)));
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  };

  useEL(() => {
    setBubble(stepText(stepIdx)); setPlayed([]); setFeedback(null);
    if (step.type === "teach") {
      setMood("teach");
      say(stepText(stepIdx));
      // auto-demo the notes
      const notes = Object.keys(step.notes || {}).map(Number);
      if (notes.length === 1) PP_Audio.note(notes[0], 0.4);
      else PP_Audio.chord(notes, 1.4);
    } else {
      setMood("conduct");
    }
    return () => { try { window.speechSynthesis.cancel(); } catch (e) {} };
  }, [stepIdx]);

  const advance = () => {
    if (stepIdx < totalSteps - 1) setStepIdx(stepIdx + 1);
    else finish();
  };

  const finish = () => {
    const stars = hearts >= 5 ? 3 : hearts >= 3 ? 2 : 1;
    const xpGain = 40;
    ctx.updateProfile(p.id, { hearts, xp: p.xp + xpGain, streak: p.streak });
    ctx.go("complete", { item: { title: lesson.title }, stars, xp: xpGain });
  };

  // handle a key press during a quiz
  const onPlay = (midi) => {
    if (step.type !== "quiz" || feedback === "correct") return;
    const target = step.target;
    const np = [...played, midi];
    setPlayed(np);

    if (step.seq) {
      // sequential: must match in order
      const idx = np.length - 1;
      if (midi !== target[idx]) { miss(); setPlayed([]); return; }
      if (np.length === target.length) { hit(); }
    } else {
      // chord/single: collect the set
      const need = new Set(target);
      if (!need.has(midi)) { miss(); setPlayed(np.filter((n) => need.has(n))); return; }
      const have = new Set(np.filter((n) => need.has(n)));
      if (have.size === need.size) { hit(); }
    }
  };

  const hit = () => {
    setFeedback("correct"); setMood("cheer"); setBubble(t("lesson.perfect", lang));
    PP_Audio.correct();
    setTimeout(advance, 1100);
  };
  const miss = () => {
    setFeedback("wrong"); setMood("sad"); setBubble(t("lesson.notQuite", lang));
    PP_Audio.wrong();
    setHearts((h) => {
      const nh = Math.max(0, h - 1);
      if (nh === 0) setTimeout(() => ctx.go("upsell", { reason: "hearts" }), 700);
      return nh;
    });
    setTimeout(() => { if (hearts > 1) { setFeedback(null); setMood("conduct"); setBubble(stepText(stepIdx)); } }, 1200);
  };

  // which keys glow
  const lit = step.type === "teach" ? step.notes : (feedback === "correct" ? Object.keys(step.lit).reduce((a, k) => (a[k] = "#58CC02", a), {}) : step.lit);
  const labels = step.labels || {};

  // auto-resolve loading
  useEL(() => {
    if (loadState === "loading") { const t = setTimeout(() => setLoadState("ready"), 1700); return () => clearTimeout(t); }
  }, [loadState]);

  if (loadState === "loading") {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, background: "var(--lesson-bg)" }}>
        <div style={{ width: 84, height: 84, borderRadius: "50%", border: "8px solid var(--line)", borderTopColor: "#58CC02", animation: "pp-spin .9s linear infinite" }} />
        <Maestro mood="idea" size={96} bg="#FFF0CE" float />
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Setting up your lesson…</h2>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-faint)" }}>Loading notes, audio and LED cues.</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: "var(--lesson-bg)", position: "relative", overflow: "hidden" }}>
      {feedback === "correct" && <Confetti run count={60} />}

      {/* LED-dropped error overlay */}
      {ledError && (
        <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(20,16,10,.5)", backdropFilter: "blur(5px)", display: "grid", placeItems: "center" }}>
          <div style={{ width: 500, background: "var(--surface)", borderRadius: 26, padding: "34px 36px", boxShadow: "0 24px 60px #0006", textAlign: "center", animation: "pp-pop .3s" }}>
            <Maestro mood="nervous" size={108} bg="#FBEEE6" ring={5} ringColor="#fff" style={{ margin: "0 auto 10px" }} />
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", margin: "0 0 8px" }}>Lost the LED strip</h2>
            <p style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.4, margin: "0 auto 22px", maxWidth: 380 }}>We can't reach your strip. You can keep going with the on-screen keys, or reconnect.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ChunkyButton variant="sky" size="lg" full onClick={() => { ctx.setLed({ ...ctx.led, connected: true }); setLedError(false); PP_Audio.success(); }} icon={<Icon name="bluetooth" size={20} color="#fff" />}>Reconnect strip</ChunkyButton>
              <ChunkyButton variant="ghost" size="md" full onClick={() => setLedError(false)}>Continue on screen</ChunkyButton>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR: progress + hearts */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 26px 8px" }}>
        <button onClick={() => ctx.go("home")} style={ghostIcon}><Icon name="close" size={24} color="var(--ink)" /></button>
        <div style={{ flex: 1, display: "flex", gap: 6 }}>
          {lesson.steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 14, borderRadius: 999, background: i < stepIdx ? "#2F9BD6" : i === stepIdx ? "#7FCBED" : "var(--line)",
              boxShadow: i <= stepIdx ? "inset 0 -2px 0 #00000010" : "none", transition: "background .3s" }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} style={{ fontSize: 24, filter: i < hearts ? "none" : "grayscale(1) opacity(.35)", transition: "filter .3s", animation: feedback === "wrong" && i === hearts ? "pp-jiggle .4s" : "none" }}>❤️</span>
          ))}
        </div>
      </div>

      {/* MID: instructor + quiz prompt */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 24, padding: "0 50px", position: "relative" }}>
        {/* Maestro + bubble */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, maxWidth: 720 }}>
          <Maestro mood={mood} size={150} bg={feedback === "wrong" ? "#FFE0E0" : feedback === "correct" ? "#E4F8D2" : "#FFF0CE"} ring={6} ringColor="#fff" float style={{ boxShadow: "0 10px 26px #0002", flexShrink: 0 }} />
          <div style={{ position: "relative", background: "var(--surface)", borderRadius: 24, padding: "20px 26px", boxShadow: "0 6px 0 var(--line), 0 10px 24px #0000000f", border: "2px solid var(--line)" }}>
            <div style={{ position: "absolute", left: -12, top: 40, width: 0, height: 0, borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderRight: "14px solid var(--surface)" }} />
            {step.type === "quiz" && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EAF8DC", color: "#3D8E00", fontWeight: 900, fontSize: 14, padding: "5px 14px", borderRadius: 999, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>
                <Icon name="target" size={16} color="#3D8E00" /> {stepPrompt(stepIdx)}
              </div>
            )}
            <p style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: 0, lineHeight: 1.3 }}>{bubble}</p>
            {step.type === "teach" && (
              <button onClick={() => say(stepText(stepIdx))} style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 7, background: "var(--sel-sky)", border: "2px solid #BBE3F4", borderRadius: 999, padding: "7px 15px", cursor: "pointer", fontFamily: "Nunito", fontWeight: 800, fontSize: 14, color: "#2E84AD" }}>
                <Icon name="sound" size={16} color="#2E84AD" /> {t("lesson.hearAgain", lang)}
              </button>
            )}
          </div>
        </div>

        {step.type === "teach" && (
          <ChunkyButton variant="sky" size="lg" onClick={advance} icon={<Icon name="arrowRight" size={20} color="#fff" />} style={{ flexShrink: 0 }}>{t("common.gotIt", lang)}</ChunkyButton>
        )}

        {/* LED hardware status pill */}
        <div style={{ position: "absolute", top: 6, right: 60, display: "flex", alignItems: "center", gap: 8, background: ctx.led.connected ? "var(--sel-sky)" : "#FBEEE6", border: `2px solid ${ctx.led.connected ? "#BBE3F4" : "#F3D3BE"}`, borderRadius: 999, padding: "7px 14px" }}>
          <Icon name="bluetooth" size={16} color={ctx.led.connected ? "#2E84AD" : "#C2410C"} />
          <span style={{ fontWeight: 800, fontSize: 13, color: ctx.led.connected ? "#2E84AD" : "#C2410C" }}>{ctx.led.connected ? t("lesson.ledOn", lang) : t("lesson.ledOff", lang)}</span>
        </div>
      </div>

      {/* BOTTOM: full keyboard */}
      <div style={{ padding: "0 20px 18px" }}>
        <Piano low={55} high={84} lit={lit} labels={labels} led height={200} onPlay={onPlay} interactive={step.type === "quiz" && feedback !== "correct"} />
      </div>
    </div>
  );
}

/* ------------------------ LESSON COMPLETE ------------------------- */
function ScreenComplete({ ctx }) {
  const stars = ctx.params.stars != null ? ctx.params.stars : 3;
  const xp = ctx.params.xp || 40;
  const title = (ctx.params.item && ctx.params.item.title) || "Pop Chords I";
  const p = ctx.activeProfile;
  const [shownStars, setShownStars] = useSL(0);
  const [phase, setPhase] = useSL(0);

  useEL(() => {
    PP_Audio.success();
    const timers = [];
    for (let i = 1; i <= stars; i++) timers.push(setTimeout(() => { setShownStars(i); PP_Audio.star(i - 1); }, 500 + i * 360));
    timers.push(setTimeout(() => setPhase(1), 500 + stars * 360 + 300));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="pp-dark-scene" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden",
      background: "radial-gradient(120% 120% at 50% -10%, #FFF6D6 0%, #FFFAEC 55%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Confetti run count={150} />

      <p style={{ fontSize: 22, fontWeight: 900, color: "#F5B800", letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>Lesson complete</p>
      <h1 style={{ fontSize: 46, fontWeight: 900, color: "var(--ink)", margin: "6px 0 18px" }}>{title}</h1>

      {/* stars */}
      <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ transform: i < shownStars ? "scale(1) rotate(0)" : "scale(0) rotate(-40deg)", transition: "transform .4s cubic-bezier(.3,1.8,.5,1)" }}>
            <Icon name="star" size={i === 1 ? 92 : 76} color={i < stars ? "#F5B800" : "#E4DCC0"} style={{ filter: i < shownStars ? "drop-shadow(0 6px 0 #C28A00)" : "none", marginTop: i === 1 ? -14 : 8 }} />
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 26 }}>
        <Maestro mood={stars === 3 ? "trophy" : "cheer"} size={120} bg="#FFE38A" ring={5} ringColor="#fff" float />
      </div>

      {/* reward chips */}
      <div style={{ display: "flex", gap: 16, marginBottom: 32, opacity: phase ? 1 : 0, transform: phase ? "translateY(0)" : "translateY(16px)", transition: ".5s" }}>
        {[
          { label: "XP earned", val: "+" + xp, c: "#F5B800", e: "⚡" },
          { label: "Streak", val: (p ? p.streak : 12) + " days", c: "#FF7A52", e: "🔥" },
          { label: "Accuracy", val: stars === 3 ? "100%" : stars === 2 ? "85%" : "70%", c: "#58CC02", e: "🎯" },
        ].map((r) => (
          <div key={r.label} style={{ background: "var(--surface)", borderRadius: 20, padding: "16px 24px", border: "2px solid var(--line)", boxShadow: "0 4px 0 var(--line)", textAlign: "center", minWidth: 130 }}>
            <div style={{ fontSize: 30 }}>{r.e}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: r.c, margin: "2px 0" }}>{r.val}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 0.5 }}>{r.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 14, opacity: phase ? 1 : 0, transition: ".5s .1s" }}>
        <ChunkyButton variant="ghost" size="lg" onClick={() => ctx.go("home")}>Back to learn</ChunkyButton>
        <ChunkyButton variant="gold" size="lg" glow onClick={() => { PP_Audio.success(); ctx.go("diploma"); }} icon={<Icon name="grad" size={20} color="#5a3d00" />}>{t("dip.getDiploma", (p && p.lang) || "en")}</ChunkyButton>
        <ChunkyButton variant="sky" size="lg" glow onClick={() => { PP_Audio.correct(); ctx.go("lesson", { item: { title: "Both Hands" } }); }} icon={<Icon name="arrowRight" size={20} color="#fff" />}>Next lesson</ChunkyButton>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenLesson, ScreenComplete });
