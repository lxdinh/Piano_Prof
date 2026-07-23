/* ===================================================================
   Piano Professor — Interactive Circle of Fifths trainer
   A teaching tool (not free play): tap a wheel segment to hear the key,
   see its scale light up, its key signature, relative minor, and the
   I-IV-V "neighbours" that build most songs. Tablet + phone.
   =================================================================== */
const { useState: useCoF, useEffect: useCoFE } = React;

/* Clockwise from C (12 o'clock). Each ascending fifth adds one sharp;
   each counter-clockwise step adds one flat. */
const COF_KEYS = [
  { maj:"C",  min:"Am",  root:60, minRoot:57, sig:0, acc:"#", scale:["C","D","E","F","G","A","B"] },
  { maj:"G",  min:"Em",  root:67, minRoot:64, sig:1, acc:"#", scale:["G","A","B","C","D","E","F♯"] },
  { maj:"D",  min:"Bm",  root:62, minRoot:59, sig:2, acc:"#", scale:["D","E","F♯","G","A","B","C♯"] },
  { maj:"A",  min:"F♯m", root:69, minRoot:66, sig:3, acc:"#", scale:["A","B","C♯","D","E","F♯","G♯"] },
  { maj:"E",  min:"C♯m", root:64, minRoot:61, sig:4, acc:"#", scale:["E","F♯","G♯","A","B","C♯","D♯"] },
  { maj:"B",  min:"G♯m", root:71, minRoot:68, sig:5, acc:"#", scale:["B","C♯","D♯","E","F♯","G♯","A♯"] },
  { maj:"G♭", min:"E♭m", root:66, minRoot:63, sig:6, acc:"b", scale:["G♭","A♭","B♭","C♭","D♭","E♭","F"] },
  { maj:"D♭", min:"B♭m", root:61, minRoot:58, sig:5, acc:"b", scale:["D♭","E♭","F","G♭","A♭","B♭","C"] },
  { maj:"A♭", min:"Fm",  root:68, minRoot:65, sig:4, acc:"b", scale:["A♭","B♭","C","D♭","E♭","F","G"] },
  { maj:"E♭", min:"Cm",  root:63, minRoot:60, sig:3, acc:"b", scale:["E♭","F","G","A♭","B♭","C","D"] },
  { maj:"B♭", min:"Gm",  root:70, minRoot:67, sig:2, acc:"b", scale:["B♭","C","D","E♭","F","G","A"] },
  { maj:"F",  min:"Dm",  root:65, minRoot:62, sig:1, acc:"b", scale:["F","G","A","B♭","C","D","E"] },
];
const COF_SHARP_ORDER = ["F♯","C♯","G♯","D♯","A♯","E♯","B♯"];
const COF_FLAT_ORDER  = ["B♭","E♭","A♭","D♭","G♭","C♭","F♭"];

const majTriad = (r) => [r, r + 4, r + 7];
const minTriad = (r) => [r, r + 3, r + 7];
const majScaleMidi = (r) => [0,2,4,5,7,9,11].map((s) => r + s);
const minScaleMidi = (r) => [0,2,3,5,7,8,10].map((s) => r + s);

function cofSigText(k, lang) {
  if (k.sig === 0) return t("cof.sig0", lang);
  const order = k.acc === "#" ? COF_SHARP_ORDER : COF_FLAT_ORDER;
  const plural = k.acc === "#" ? t("cof.sharps", lang) : t("cof.flats", lang);
  const singular = k.acc === "#" ? t("cof.sharp1", lang) : t("cof.flat1", lang);
  const word = k.sig === 1 ? singular : plural;
  return `${k.sig} ${word} · ${order.slice(0, k.sig).join(" ")}`;
}

/* ---- the wheel (SVG) ---- */
const pol = (cx, cy, r, deg) => { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
function annular(cx, cy, ri, ro, a0, a1) {
  const [x0, y0] = pol(cx, cy, ro, a0), [x1, y1] = pol(cx, cy, ro, a1);
  const [x2, y2] = pol(cx, cy, ri, a1), [x3, y3] = pol(cx, cy, ri, a0);
  return `M${x0} ${y0} A${ro} ${ro} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${ri} ${ri} 0 0 0 ${x3} ${y3} Z`;
}

function CofWheel({ sel, mode, onPick, size = 440, quiz = false, flash = null, reveal = null, refIdx = null, hub = null }) {
  const cx = size / 2, cy = size / 2;
  const RO = size * 0.477, R1 = size * 0.30, RI = size * 0.172; // outer, ring split, hole
  const wedge = (i) => ({ a0: i * 30 - 15, a1: i * 30 + 15 });

  const fillFor = (i, ring) => {
    if (quiz) {
      if (flash && flash.i === i && flash.ring === ring) return flash.ok ? { f: "#58CC02", s: "#46A302", c: "#fff", w: 3 } : { f: "#FF4B4B", s: "#C2410C", c: "#fff", w: 3 };
      if (reveal && reveal.i === i && reveal.ring === ring) return { f: "rgba(88,204,2,.32)", s: "#58CC02", c: "var(--ink)", w: 3 };
      if (refIdx === i && ring === "maj") return { f: "rgba(91,184,227,.28)", s: "#5BB8E3", c: "var(--ink)", w: 2.5 };
      return ring === "maj" ? { f: "var(--surface)", s: "var(--line)", c: "var(--ink)", w: 1.5 } : { f: "var(--surface-2)", s: "var(--line)", c: "var(--ink-soft)", w: 1.5 };
    }
    const isSel = sel === i;
    if (ring === "maj") {
      if (isSel && mode === "maj") return { f: "#58CC02", s: "#46A302", c: "#fff", w: 2.5 };
      if (sel != null && i === (sel + 1) % 12) return { f: "rgba(245,184,0,.24)", s: "#F5B800", c: "var(--ink)", w: 2 };  // V (dominant), clockwise
      if (sel != null && i === (sel + 11) % 12) return { f: "rgba(91,184,227,.24)", s: "#5BB8E3", c: "var(--ink)", w: 2 }; // IV (subdominant), ccw
      return { f: "var(--surface)", s: "var(--line)", c: "var(--ink)", w: 1.5 };
    }
    // minor inner ring
    if (isSel && mode === "min") return { f: "#8B5CF6", s: "#6D28D9", c: "#fff", w: 2.5 };
    if (isSel) return { f: "rgba(139,92,246,.22)", s: "#8B5CF6", c: "var(--ink)", w: 2 }; // relative minor of selected major
    return { f: "var(--surface-2)", s: "var(--line)", c: "var(--ink-soft)", w: 1.5 };
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
      {COF_KEYS.map((k, i) => {
        const { a0, a1 } = wedge(i);
        const oMid = (RO + R1) / 2, iMid = (R1 + RI) / 2;
        const [olx, oly] = pol(cx, cy, oMid, i * 30);
        const [ilx, ily] = pol(cx, cy, iMid, i * 30);
        const fo = fillFor(i, "maj"), fi = fillFor(i, "min");
        return (
          <g key={k.maj}>
            <path className="cof-wedge" d={annular(cx, cy, R1, RO, a0, a1)} fill={fo.f} stroke={fo.s} strokeWidth={fo.w}
              onClick={() => onPick(i, "maj")} style={{ cursor: "pointer" }} />
            <text x={olx} y={oly} fill={fo.c} fontSize={size * 0.052} fontWeight="900" textAnchor="middle" dominantBaseline="central"
              fontFamily="Nunito, sans-serif" style={{ pointerEvents: "none" }}>{k.maj}</text>
            <path className="cof-wedge" d={annular(cx, cy, RI, R1, a0, a1)} fill={fi.f} stroke={fi.s} strokeWidth={fi.w}
              onClick={() => onPick(i, "min")} style={{ cursor: "pointer" }} />
            <text x={ilx} y={ily} fill={fi.c} fontSize={size * 0.034} fontWeight="800" textAnchor="middle" dominantBaseline="central"
              fontFamily="Nunito, sans-serif" style={{ pointerEvents: "none" }}>{k.min}</text>
          </g>
        );
      })}
      {/* hub */}
      <circle cx={cx} cy={cy} r={RI - 4} fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
      {hub != null ? (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontFamily="Nunito, sans-serif" fontSize={size * 0.12} fontWeight="900" fill="var(--ink-faint)" style={{ pointerEvents: "none" }}>{hub}</text>
      ) : sel != null ? (
        <g style={{ pointerEvents: "none" }}>
          <text x={cx} y={cy - size * 0.028} textAnchor="middle" dominantBaseline="central" fontFamily="Nunito, sans-serif"
            fontSize={size * 0.11} fontWeight="900" fill="var(--ink)">{mode === "min" ? COF_KEYS[sel].min : COF_KEYS[sel].maj}</text>
          <text x={cx} y={cy + size * 0.055} textAnchor="middle" dominantBaseline="central" fontFamily="Nunito, sans-serif"
            fontSize={size * 0.032} fontWeight="800" fill={mode === "min" ? "#8B5CF6" : "#58CC02"} letterSpacing="1">
            {(mode === "min" ? t("cof.minor", "en") : t("cof.major", "en")).toUpperCase()}</text>
        </g>
      ) : (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontFamily="Nunito, sans-serif"
          fontSize={size * 0.038} fontWeight="800" fill="var(--ink-faint)" style={{ pointerEvents: "none" }}>♪</text>
      )}
    </svg>
  );
}

/* ---- legend dot ---- */
function CofDot({ c, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>
      <span style={{ width: 12, height: 12, borderRadius: 4, background: c, flexShrink: 0 }} />{label}
    </span>
  );
}

/* ---- chord chip ---- */
function CofChord({ name, role, color, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, border: `2px solid ${color}`, background: "var(--surface)", borderRadius: 14, padding: "10px 6px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", transition: "transform .1s" }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.96)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "none")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}>
      <span style={{ fontSize: 11, fontWeight: 900, color, letterSpacing: 1 }}>{role}</span>
      <span style={{ fontSize: 20, fontWeight: 900, color: "var(--ink)" }}>{name}</span>
    </button>
  );
}

/* ===== the trainer (shared by tablet + phone) ===== */
function CircleTrainer({ ctx, lang, compact }) {
  const [sel, setSel] = useCoF(0);
  const [mode, setMode] = useCoF("maj");
  const k = sel != null ? COF_KEYS[sel] : null;

  /* ---- quiz / ear-training state ---- */
  const [subMode, setSubMode] = useCoF("learn");
  const [round, setRound] = useCoF(null);
  const [score, setScore] = useCoF(0);
  const [total, setTotal] = useCoF(0);
  const [streak, setStreak] = useCoF(0);
  const [answered, setAnswered] = useCoF(false);
  const [flash, setFlash] = useCoF(null);
  const [reveal, setReveal] = useCoF(null);

  const makeQ = () => {
    const types = ["sig", "sig", "relmin", "dom", "subdom", "locate"];
    const ty = types[Math.floor(Math.random() * types.length)];
    const i = Math.floor(Math.random() * 12); const kk = COF_KEYS[i];
    if (ty === "sig") {
      if (kk.sig === 0) return { kind: "quiz", concept: "sig", teachIdx: i, prompt: t("q.sig0", lang), target: { i, ring: "maj" }, ansKey: kk.maj };
      const tmpl = kk.sig === 1
        ? (kk.acc === "#" ? t("q.sigSharp1", lang) : t("q.sigFlat1", lang))
        : (kk.acc === "#" ? t("q.sigSharp", lang) : t("q.sigFlat", lang));
      return { kind: "quiz", concept: "sig", teachIdx: i, prompt: tmpl.replace("{n}", kk.sig), target: { i, ring: "maj" }, ansKey: kk.maj };
    }
    if (ty === "relmin") return { kind: "quiz", concept: "relmin", teachIdx: i, prompt: t("q.relmin", lang).replace("{key}", kk.maj), target: { i, ring: "min" }, ansKey: kk.min };
    if (ty === "dom") { const j = (i + 1) % 12; return { kind: "quiz", concept: "dom", teachIdx: i, prompt: t("q.dom", lang).replace("{key}", kk.maj), target: { i: j, ring: "maj" }, ansKey: COF_KEYS[j].maj }; }
    if (ty === "subdom") { const j = (i + 11) % 12; return { kind: "quiz", concept: "subdom", teachIdx: i, prompt: t("q.subdom", lang).replace("{key}", kk.maj), target: { i: j, ring: "maj" }, ansKey: COF_KEYS[j].maj }; }
    return { kind: "quiz", concept: "locate", teachIdx: i, prompt: t("q.locate", lang).replace("{key}", kk.maj), target: { i, ring: "maj" }, ansKey: kk.maj };
  };
  const makeEar = () => {
    const i = Math.floor(Math.random() * 12); const dir = Math.random() < 0.5 ? "IV" : "V";
    const j = dir === "V" ? (i + 1) % 12 : (i + 11) % 12;
    return { kind: "ear", concept: dir === "V" ? "dom" : "subdom", teachIdx: i, tonic: i, dir, target: { i: j, ring: "maj" }, ansKey: COF_KEYS[j].maj };
  };
  const playEar = (r) => {
    if (!r || r.kind !== "ear") return;
    PP_Audio.chord(majTriad(COF_KEYS[r.tonic].root), 0.9);
    setTimeout(() => PP_Audio.chord(majTriad(COF_KEYS[r.target.i].root), 1.2), 1000);
  };
  const nextRound = () => {
    setFlash(null); setReveal(null); setAnswered(false);
    if (subMode === "ear") { const r = makeEar(); setRound(r); setTimeout(() => playEar(r), 450); }
    else { setRound(makeQ()); }
  };
  useCoFE(() => {
    if (subMode === "learn") return;
    setScore(0); setTotal(0); setStreak(0); setFlash(null); setReveal(null); setAnswered(false);
    if (subMode === "ear") { const r = makeEar(); setRound(r); const id = setTimeout(() => playEar(r), 500); return () => clearTimeout(id); }
    setRound(makeQ());
  }, [subMode]);
  const playLoop = (i) => {
    const I = COF_KEYS[i], V = COF_KEYS[(i + 1) % 12], IV = COF_KEYS[(i + 11) % 12];
    const seq = [majTriad(I.root), majTriad(IV.root), majTriad(V.root), majTriad(I.root)];
    seq.forEach((ch, n) => setTimeout(() => PP_Audio.chord(ch, 0.62), n * 600));
  };
  const answer = (i, ring) => {
    if (subMode === "learn" || answered || !round) return;
    const ansOk = i === round.target.i && ring === round.target.ring;
    setAnswered(true); setFlash({ i, ring, ok: ansOk }); setTotal((x) => x + 1);
    if (ansOk) { setScore((s) => s + 1); setStreak((s) => s + 1); PP_Audio.correct(); }
    else { setStreak(0); setReveal(round.target); PP_Audio.wrong(); }
    const ak = COF_KEYS[round.target.i];
    setTimeout(() => PP_Audio.chord(round.target.ring === "min" ? minTriad(ak.minRoot) : majTriad(ak.root), 1.0), ansOk ? 260 : 680);
  };
  const onWheelPick = (i, ring) => { if (subMode === "learn") pick(i, ring); else answer(i, ring); };

  const pick = (i, m) => {
    setSel(i); setMode(m);
    const kk = COF_KEYS[i];
    PP_Audio.chord(m === "min" ? minTriad(kk.minRoot) : majTriad(kk.root), 1.1);
    PP_Audio.haptic(10);
  };
  const playScale = () => {
    if (!k) return;
    const midis = mode === "min" ? minScaleMidi(k.minRoot) : majScaleMidi(k.root);
    PP_Audio.arp([...midis, midis[0] + 12], 0.16);
  };
  const playCadence = () => {
    if (!k) return;
    const seq = mode === "min"
      ? [minTriad(k.minRoot), minTriad(k.minRoot + 5), minTriad(k.minRoot + 7), minTriad(k.minRoot)]
      : [majTriad(k.root), majTriad(k.root + 5), majTriad(k.root + 7), majTriad(k.root)];
    seq.forEach((ch, i) => setTimeout(() => PP_Audio.chord(ch, 0.7), i * 620));
  };

  // piano lighting: scale notes, labelled with proper spelling
  const lit = {}, labels = {};
  if (k) {
    const midis = mode === "min" ? minScaleMidi(k.minRoot) : majScaleMidi(k.root);
    const names = mode === "min"
      ? k.scale.slice(5).concat(k.scale.slice(0, 5))   // natural minor = relative major from the 6th
      : k.scale;
    const tonic = mode === "min" ? k.minRoot : k.root;
    midis.forEach((m, i) => { lit[m] = m === tonic ? (mode === "min" ? "#8B5CF6" : "#58CC02") : (mode === "min" ? "#C4B5FD" : "#A8E66B"); labels[m] = names[i]; });
  }

  const vKey = k ? COF_KEYS[(sel + 1) % 12] : null;   // dominant
  const ivKey = k ? COF_KEYS[(sel + 11) % 12] : null; // subdominant
  const pianoLow = compact ? 55 : 53, pianoHigh = compact ? 79 : 81;
  const wheelSize = compact ? 250 : 396;

  return (
    <div style={{ display: "flex", gap: compact ? 14 : 26, alignItems: "stretch", height: "100%", minHeight: 0 }}>
      {/* wheel */}
      <div style={{ width: wheelSize, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: compact ? 8 : 12 }}>
        <div style={{ width: "100%" }}>
          <CofWheel size={wheelSize} mode={mode} onPick={onWheelPick}
            sel={subMode === "learn" ? sel : null}
            quiz={subMode !== "learn"} flash={flash} reveal={reveal}
            refIdx={subMode === "ear" && round && round.kind === "ear" ? round.tonic : null}
            hub={subMode === "learn" ? null : "?"} />
        </div>
        {!compact && subMode === "learn" && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, rowGap: 7, maxWidth: wheelSize }}>
            <CofDot c="#58CC02" label={t("cof.selected", lang)} />
            <CofDot c="#F5B800" label={t("cof.dominant", lang)} />
            <CofDot c="#5BB8E3" label={t("cof.subdominant", lang)} />
            <CofDot c="#8B5CF6" label={t("cof.relMinor", lang)} />
          </div>
        )}
      </div>

      {/* info panel */}
      <div className="pp-scroll" style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: compact ? 9 : 13, paddingRight: compact ? 10 : 16 }}>
        <Segmented options={[{ label: t("cof.learn", lang), value: "learn" }, { label: t("cof.quiz", lang), value: "quiz" }, { label: t("cof.ear", lang), value: "ear" }]} value={subMode} onChange={(v) => { setSubMode(v); PP_Audio.tap(); }} />
        {subMode !== "learn" && <CofQuizPanel kind={subMode} round={round} score={score} total={total} streak={streak} answered={answered} flash={flash} lang={lang} compact={compact} onReplay={() => playEar(round)} onNext={nextRound} onPlayLoop={playLoop} />}
        {subMode === "learn" && <>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: compact ? 26 : 34, fontWeight: 900, color: "var(--ink)", margin: 0, lineHeight: 1 }}>
              {mode === "min" ? k.min : k.maj} <span style={{ fontSize: compact ? 15 : 19, color: mode === "min" ? "#8B5CF6" : "#58CC02" }}>{mode === "min" ? t("cof.minor", lang) : t("cof.major", lang)}</span>
            </h2>
            <p style={{ fontSize: compact ? 12.5 : 14.5, fontWeight: 800, color: "var(--ink-faint)", margin: "4px 0 0" }}>
              {mode === "min"
                ? `${t("cof.relMajorOf", lang)} ${k.maj} ${t("cof.major", lang)}`
                : `${t("cof.relMinorIs", lang)} ${k.min}`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <ChunkyButton variant="green" size={compact ? "sm" : "md"} onClick={playScale} icon={<Icon name="play" size={compact ? 15 : 18} color="#fff" />}>{t("cof.playScale", lang)}</ChunkyButton>
          </div>
        </div>

        {/* key signature */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-2)", borderRadius: 14, padding: compact ? "10px 12px" : "12px 16px" }}>
          <span style={{ fontSize: compact ? 22 : 28, fontWeight: 900, color: k.sig === 0 ? "var(--ink-faint)" : (k.acc === "#" ? "#2E84AD" : "#C2410C"), minWidth: 34, textAlign: "center" }}>
            {k.sig === 0 ? "♮" : (k.acc === "#" ? "♯" : "♭")}
          </span>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 1 }}>{t("cof.keySig", lang)}</div>
            <div style={{ fontSize: compact ? 14 : 16, fontWeight: 800, color: "var(--ink)" }}>{cofSigText(k, lang)}</div>
          </div>
        </div>

        {/* power chords = the neighbours */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 1 }}>{t("cof.powerTitle", lang)}</span>
            <button onClick={playCadence} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 900, color: "#58CC02", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="play" size={13} color="#58CC02" />{t("cof.playCadence", lang)}
            </button>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {mode === "min" ? (
              <>
                <CofChord name={k.min} role="i" color="#8B5CF6" onClick={() => PP_Audio.chord(minTriad(k.minRoot), 1.1)} />
                <CofChord name={COF_KEYS[(sel + 11) % 12].min} role="iv" color="#5BB8E3" onClick={() => PP_Audio.chord(minTriad(k.minRoot + 5), 1.1)} />
                <CofChord name={COF_KEYS[(sel + 1) % 12].min} role="v" color="#F5B800" onClick={() => PP_Audio.chord(minTriad(k.minRoot + 7), 1.1)} />
              </>
            ) : (
              <>
                <CofChord name={ivKey.maj} role="IV" color="#5BB8E3" onClick={() => PP_Audio.chord(majTriad(k.root + 5), 1.1)} />
                <CofChord name={k.maj} role="I" color="#58CC02" onClick={() => PP_Audio.chord(majTriad(k.root), 1.1)} />
                <CofChord name={vKey.maj} role="V" color="#F5B800" onClick={() => PP_Audio.chord(majTriad(k.root + 7), 1.1)} />
              </>
            )}
          </div>
          <p style={{ fontSize: compact ? 12 : 13.5, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.4, margin: "8px 0 0" }}>{t("cof.powerSub", lang)}</p>
        </div>

        {/* maestro tip */}
        {!compact && (
          <div style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--surface-2)", borderRadius: 16, padding: "12px 16px", marginTop: 2 }}>
            <Maestro mood="teach" size={52} bg="#EAF8DC" />
            <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.4, margin: 0 }}>{t("cof.tip", lang)}</p>
          </div>
        )}

        {/* piano (hidden on the cramped phone landscape) */}
        {!compact && (
          <div style={{ marginTop: "auto", paddingTop: 10 }}>
            <Piano low={pianoLow} high={pianoHigh} lit={lit} labels={labels} led height={150} interactive={false} />
          </div>
        )}
        </>}
      </div>
    </div>
  );
}

/* ===== quiz / ear-training panel ===== */
function CofScorePill({ icon, label, value }) {
  return (
    <div style={{ flex: 1, background: "var(--surface-2)", borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: "var(--ink)" }}>{value}</div>
      </div>
    </div>
  );
}
function CofQuizPanel({ kind, round, score, total, streak, answered, flash, lang, compact, onReplay, onNext, onPlayLoop }) {
  const ok = flash && flash.ok;
  const mood = answered ? (ok ? "star" : "confused") : "teach";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 10 : 14, marginTop: 4 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <CofScorePill icon="🎯" label={t("cof.score", lang)} value={`${score}/${total}`} />
        <CofScorePill icon="🔥" label={t("cof.streak", lang)} value={streak} />
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", background: "var(--surface-2)", borderRadius: 18, padding: compact ? "14px 16px" : "18px 20px" }}>
        <Maestro mood={mood} size={compact ? 50 : 64} bg="#EAF8DC" />
        <div style={{ flex: 1, minWidth: 0 }}>
          {kind === "ear" ? (
            <>
              <p style={{ fontSize: compact ? 14 : 16, fontWeight: 800, color: "var(--ink)", margin: 0, lineHeight: 1.35 }}>{t("ear.instr", lang)}</p>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                <ChunkyButton variant="sky" size={compact ? "sm" : "md"} onClick={onReplay} icon={<Icon name="play" size={compact ? 15 : 18} color="#fff" />}>{t("ear.again", lang)}</ChunkyButton>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-faint)" }}>{t("ear.home", lang)}: <b style={{ color: "#5BB8E3" }}>{round && round.kind === "ear" ? COF_KEYS[round.tonic].maj : ""}</b></span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: compact ? 17 : 21, fontWeight: 900, color: "var(--ink)", margin: 0, lineHeight: 1.25 }}>{round ? round.prompt : ""}</p>
          )}
        </div>
      </div>
      <div style={{ minHeight: answered ? 0 : 30 }}>
        {answered ? (
          <div style={{ fontSize: compact ? 15 : 18, fontWeight: 900, color: ok ? "#46A302" : "#C2410C" }}>
            {ok ? "✓ " + t("cof.correct", lang) : "✗ " + t("cof.wrongWas", lang).replace("{key}", round ? round.ansKey : "")}
          </div>
        ) : (
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-faint)", margin: 0 }}>{t("cof.tapToAnswer", lang)}</p>
        )}
      </div>
      {answered && round && <CofTeachCard concept={round.concept} teachIdx={round.teachIdx} lang={lang} compact={compact} onPlayLoop={onPlayLoop} />}
      {answered && <ChunkyButton variant="green" size={compact ? "md" : "lg"} glow full onClick={onNext} icon={<Icon name="arrowRight" size={compact ? 18 : 20} color="#fff" />}>{t("teach.next", lang)}</ChunkyButton>}
    </div>
  );
}

/* ===== teaching card: concept + a real 4-chord song with chords over lyrics ===== */
const COF_ROLE_COLOR = { I: "#46A302", IV: "#2B8CC0", V: "#C99700", vi: "#7C3AED" };
const chordForRole = (role, i) => role === "I" ? COF_KEYS[i].maj : role === "V" ? COF_KEYS[(i + 1) % 12].maj : role === "IV" ? COF_KEYS[(i + 11) % 12].maj : COF_KEYS[i].min;
function CofTeachCard({ concept, teachIdx, lang, compact, onPlayLoop }) {
  const hi = { dom: "V", subdom: "IV", relmin: "vi", sig: "I", locate: "I" }[concept] || "I";
  const song = (PP_COF_SONG[lang] || PP_COF_SONG.en);
  const legend = [
    { role: "I", label: t("role.home", lang) },
    { role: "IV", label: t("role.subdom", lang) },
    { role: "V", label: t("role.dom", lang) },
    { role: "vi", label: t("role.relmin", lang) },
  ];
  return (
    <div style={{ background: "var(--surface)", border: "2px solid var(--line)", borderRadius: 18, padding: compact ? "14px 15px" : "18px 20px", display: "flex", flexDirection: "column", gap: compact ? 11 : 14 }}>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: COF_ROLE_COLOR[hi] + "22", color: COF_ROLE_COLOR[hi], fontWeight: 900, fontSize: compact ? 11 : 12, padding: "4px 11px", borderRadius: 999, marginBottom: 7, textTransform: "uppercase", letterSpacing: .5 }}>
          <Icon name="sparkle" size={compact ? 13 : 15} color={COF_ROLE_COLOR[hi]} />{t("teach.tag", lang)}
        </div>
        <h3 style={{ fontSize: compact ? 16 : 19, fontWeight: 900, color: "var(--ink)", margin: "0 0 5px" }}>{t("teach." + concept + ".title", lang)}</h3>
        <p style={{ fontSize: compact ? 13 : 14.5, fontWeight: 600, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 }}>{t("teach." + concept + ".body", lang)}</p>
      </div>

      {/* legend: role → chord in this key */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {legend.map((L) => {
          const on = L.role === hi;
          return (
            <div key={L.role} style={{ display: "flex", alignItems: "center", gap: 7, background: on ? COF_ROLE_COLOR[L.role] + "1f" : "var(--surface-2)", border: on ? `2px solid ${COF_ROLE_COLOR[L.role]}` : "2px solid transparent", borderRadius: 11, padding: compact ? "5px 9px" : "6px 11px" }}>
              <span style={{ fontWeight: 900, fontSize: compact ? 13 : 15, color: COF_ROLE_COLOR[L.role] }}>{chordForRole(L.role, teachIdx)}</span>
              <span style={{ fontWeight: 800, fontSize: compact ? 10.5 : 11.5, color: "var(--ink-faint)" }}>{L.role} · {L.label}{on ? " ← " + t("teach.yourAnswer", lang) : ""}</span>
            </div>
          );
        })}
      </div>

      {/* song with chords over lyrics */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 9, flexWrap: "wrap" }}>
          <span style={{ fontSize: compact ? 12 : 13, fontWeight: 800, color: "var(--ink-faint)" }}>{t("teach.songHdr", lang).replace("{song}", song.name).replace("{key}", COF_KEYS[teachIdx].maj)}</span>
          <ChunkyButton variant="sky" size="sm" onClick={() => onPlayLoop(teachIdx)} icon={<Icon name="play" size={14} color="#fff" />}>{t("teach.playLoop", lang)}</ChunkyButton>
        </div>
        <div style={{ background: "var(--surface-2)", borderRadius: 13, padding: compact ? "12px 13px" : "15px 17px", display: "flex", flexDirection: "column", gap: compact ? 9 : 11 }}>
          {song.lines.map((line, li) => (
            <div key={li} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", rowGap: 7 }}>
              {line.map((seg, si) => (
                <span key={si} style={{ display: "inline-flex", flexDirection: "column", marginRight: "0.32em" }}>
                  <span style={{ fontWeight: 900, fontSize: compact ? 13 : 15, lineHeight: 1, color: COF_ROLE_COLOR[seg[0]], marginBottom: 3 }}>{chordForRole(seg[0], teachIdx)}</span>
                  <span style={{ fontWeight: 700, fontSize: compact ? 14 : 16, color: "var(--ink)", lineHeight: 1.15 }}>{seg[1].trim()}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* i18n — UI strings written natively per language (note letters stay universal) */
Object.assign(PP_I18N, {
  "cof.learn":   { en:"Explore", zh:"玩一玩", es:"Explora", fr:"Explore", de:"Stöbern", ja:"さがす", ko:"둘러보기", vi:"Khám phá", pt:"Explorar", it:"Esplora" },
  "cof.quiz":    { en:"Quiz", zh:"挑战", es:"Reto", fr:"Défi", de:"Quiz", ja:"クイズ", ko:"퀴즈", vi:"Đố vui", pt:"Desafio", it:"Sfida" },
  "cof.ear":     { en:"Ear", zh:"听音", es:"Oído", fr:"Oreille", de:"Gehör", ja:"耳トレ", ko:"청음", vi:"Nghe", pt:"Ouvido", it:"Orecchio" },
  "cof.score":   { en:"Score", zh:"得分", es:"Aciertos", fr:"Score", de:"Punkte", ja:"スコア", ko:"점수", vi:"Điểm", pt:"Pontos", it:"Punti" },
  "cof.streak":  { en:"Streak", zh:"连击", es:"Racha", fr:"Série", de:"Serie", ja:"連続", ko:"연속", vi:"Chuỗi", pt:"Sequência", it:"Serie" },
  "cof.correct": { en:"Nailed it!", zh:"答对啦！", es:"¡Lo clavaste!", fr:"Dans le mille !", de:"Sitzt!", ja:"やったー！", ko:"정답이야!", vi:"Chuẩn luôn!", pt:"Mandou bem!", it:"Perfetto!" },
  "cof.wrongWas":{ en:"Nope — it was {key}", zh:"差一点，是 {key}", es:"Casi… era {key}", fr:"Raté — c'était {key}", de:"Knapp — es war {key}", ja:"惜しい！正解は {key}", ko:"아깝다 — 정답은 {key}", vi:"Hụt rồi — là {key}", pt:"Quase… era {key}", it:"Quasi… era {key}" },
  "cof.tapToAnswer":{ en:"Tap your answer on the wheel", zh:"在圈上点出你的答案", es:"Toca tu respuesta en la rueda", fr:"Touche ta réponse sur la roue", de:"Tipp deine Antwort aufs Rad", ja:"輪っかで答えをタップ", ko:"휠에서 답을 눌러", vi:"Chạm đáp án trên vòng nhé", pt:"Toca a resposta na roda", it:"Tocca la risposta sulla ruota" },
  "q.sig0":      { en:"Which key has no sharps or flats?", zh:"哪个调没有升降号？", es:"¿Qué tono no tiene sostenidos ni bemoles?", fr:"Quelle tonalité n'a aucun dièse ni bémol ?", de:"Welche Tonart hat keine Vorzeichen?", ja:"調号がない調はどれ？", ko:"올림표·내림표가 없는 조는?", vi:"Giọng nào không có thăng giáng?", pt:"Qual tom não tem sustenidos nem bemóis?", it:"Quale tonalità non ha diesis né bemolli?" },
  "q.sigSharp":  { en:"Which key has {n} sharps?", zh:"哪个调有 {n} 个升号？", es:"¿Qué tono tiene {n} sostenidos?", fr:"Quelle tonalité a {n} dièses ?", de:"Welche Tonart hat {n} Kreuze?", ja:"シャープが {n} つの調はどれ？", ko:"올림표가 {n}개인 조는?", vi:"Giọng nào có {n} dấu thăng?", pt:"Qual tom tem {n} sustenidos?", it:"Quale tonalità ha {n} diesis?" },
  "q.sigSharp1": { en:"Which key has {n} sharp?", zh:"哪个调有 {n} 个升号？", es:"¿Qué tono tiene {n} sostenido?", fr:"Quelle tonalité a {n} dièse ?", de:"Welche Tonart hat {n} Kreuz?", ja:"シャープが {n} つの調はどれ？", ko:"올림표가 {n}개인 조는?", vi:"Giọng nào có {n} dấu thăng?", pt:"Qual tom tem {n} sustenido?", it:"Quale tonalità ha {n} diesis?" },
  "q.sigFlat":   { en:"Which key has {n} flats?", zh:"哪个调有 {n} 个降号？", es:"¿Qué tono tiene {n} bemoles?", fr:"Quelle tonalité a {n} bémols ?", de:"Welche Tonart hat {n} b-Vorzeichen?", ja:"フラットが {n} つの調はどれ？", ko:"내림표가 {n}개인 조는?", vi:"Giọng nào có {n} dấu giáng?", pt:"Qual tom tem {n} bemóis?", it:"Quale tonalità ha {n} bemolli?" },
  "q.sigFlat1":  { en:"Which key has {n} flat?", zh:"哪个调有 {n} 个降号？", es:"¿Qué tono tiene {n} bemol?", fr:"Quelle tonalité a {n} bémol ?", de:"Welche Tonart hat {n} b-Vorzeichen?", ja:"フラットが {n} つの調はどれ？", ko:"내림표가 {n}개인 조는?", vi:"Giọng nào có {n} dấu giáng?", pt:"Qual tom tem {n} bemol?", it:"Quale tonalità ha {n} bemolle?" },
  "q.relmin":    { en:"Tap the relative minor of {key} major", zh:"点出 {key} 大调的关系小调", es:"Toca la menor relativa de {key} mayor", fr:"Touche le mineur relatif de {key} majeur", de:"Tipp die Paralleltonart von {key}-Dur", ja:"{key} 長調の平行短調をタップ", ko:"{key} 장조의 나란한 단조를 눌러", vi:"Chạm giọng thứ song song của {key} trưởng", pt:"Toca a menor relativa de {key} maior", it:"Tocca la minore relativa di {key} maggiore" },
  "q.dom":       { en:"Tap the dominant (V) of {key}", zh:"点出 {key} 的属调（V）", es:"Toca la dominante (V) de {key}", fr:"Touche la dominante (V) de {key}", de:"Tipp die Dominante (V) von {key}", ja:"{key} の属調（V）をタップ", ko:"{key}의 딸림조(V)를 눌러", vi:"Chạm giọng át (V) của {key}", pt:"Toca a dominante (V) de {key}", it:"Tocca la dominante (V) di {key}" },
  "q.subdom":    { en:"Tap the subdominant (IV) of {key}", zh:"点出 {key} 的下属调（IV）", es:"Toca la subdominante (IV) de {key}", fr:"Touche la sous-dominante (IV) de {key}", de:"Tipp die Subdominante (IV) von {key}", ja:"{key} の下属調（IV）をタップ", ko:"{key}의 버금딸림조(IV)를 눌러", vi:"Chạm giọng hạ át (IV) của {key}", pt:"Toca a subdominante (IV) de {key}", it:"Tocca la sottodominante (IV) di {key}" },
  "q.locate":    { en:"Find {key} major on the wheel", zh:"在圈上找到 {key} 大调", es:"Encuentra {key} mayor en la rueda", fr:"Trouve {key} majeur sur la roue", de:"Finde {key}-Dur auf dem Rad", ja:"輪っかで {key} 長調を探して！", ko:"휠에서 {key} 장조를 찾아봐", vi:"Tìm {key} trưởng trên vòng", pt:"Acha {key} maior na roda", it:"Trova {key} maggiore sulla ruota" },
  "ear.instr":   { en:"Maestro plays home, then a neighbour. Which one did you catch? Tap it!", zh:"Maestro 先弹主和弦，再弹一个邻居。你听出是哪个？点它！", es:"Maestro toca el acorde de casa y luego un vecino. ¿Cuál pillaste? ¡Tócalo!", fr:"Maestro joue l'accord maison, puis un voisin. T'as capté lequel ? Appuie !", de:"Maestro spielt den Heimat-Akkord, dann einen Nachbarn. Welchen hast du erwischt? Tipp drauf!", ja:"マエストロがホームの和音の次に、おとなりを鳴らすよ。どっちだった？タップ！", ko:"마에스트로가 으뜸화음 다음에 이웃 화음을 쳐. 어느 쪽이었게? 눌러봐!", vi:"Maestro đánh hợp âm gốc rồi tới một hợp âm hàng xóm. Bạn bắt được cái nào? Chạm vô liền!", pt:"O Maestro toca o acorde de casa e depois um vizinho. Qual você pegou? Toca nele!", it:"Maestro suona l'accordo di casa, poi un vicino. Quale hai beccato? Toccalo!" },
  "ear.again":   { en:"Play again", zh:"再听一次", es:"Otra vez", fr:"Rejouer", de:"Nochmal", ja:"もう一回", ko:"다시", vi:"Nghe lại", pt:"De novo", it:"Ancora" },
  "ear.home":    { en:"Home", zh:"主音", es:"Tónica", fr:"Tonique", de:"Grundton", ja:"主音", ko:"으뜸음", vi:"Chủ âm", pt:"Tônica", it:"Tonica" },
  "cof.tab":     { en:"Circle of 5ths", zh:"五度圈", es:"Círculo de quintas", fr:"Cycle des quintes", de:"Quintenzirkel", ja:"五度圏", ko:"5도권", vi:"Vòng quãng năm", pt:"Ciclo das quintas", it:"Circolo delle quinte" },
  "cof.hint":    { en:"Tap any key on the wheel to explore it", zh:"点圈上任意一个调来看看", es:"Toca cualquier tono de la rueda para verlo", fr:"Touche une tonalité sur la roue pour la découvrir", de:"Tipp eine Tonart auf dem Rad an", ja:"輪っかの調をタップして見てみよう", ko:"휠에서 아무 조나 눌러서 살펴봐", vi:"Chạm một giọng trên vòng để xem", pt:"Toca qualquer tom na roda pra ver", it:"Tocca una tonalità sulla ruota per scoprirla" },
  "cof.major":   { en:"major", zh:"大调", es:"mayor", fr:"majeur", de:"Dur", ja:"長調", ko:"장조", vi:"trưởng", pt:"maior", it:"maggiore" },
  "cof.minor":   { en:"minor", zh:"小调", es:"menor", fr:"mineur", de:"Moll", ja:"短調", ko:"단조", vi:"thứ", pt:"menor", it:"minore" },
  "cof.keySig":  { en:"Key signature", zh:"调号", es:"Armadura", fr:"Armure", de:"Vorzeichen", ja:"調号", ko:"조표", vi:"Hóa biểu", pt:"Armadura de clave", it:"Armatura" },
  "cof.sig0":    { en:"No sharps or flats", zh:"无升降号", es:"Sin sostenidos ni bemoles", fr:"Ni dièse ni bémol", de:"Keine Vorzeichen", ja:"シャープもフラットもなし", ko:"올림표·내림표 없음", vi:"Không thăng không giáng", pt:"Sem sustenidos nem bemóis", it:"Né diesis né bemolli" },
  "cof.sharps":  { en:"sharps", zh:"个升号", es:"sostenidos", fr:"dièses", de:"Kreuze", ja:"個のシャープ", ko:"개의 올림표", vi:"dấu thăng", pt:"sustenidos", it:"diesis" },
  "cof.sharp1":  { en:"sharp", zh:"个升号", es:"sostenido", fr:"dièse", de:"Kreuz", ja:"個のシャープ", ko:"개의 올림표", vi:"dấu thăng", pt:"sustenido", it:"diesis" },
  "cof.flats":   { en:"flats", zh:"个降号", es:"bemoles", fr:"bémols", de:"Be", ja:"個のフラット", ko:"개의 내림표", vi:"dấu giáng", pt:"bemóis", it:"bemolli" },
  "cof.flat1":   { en:"flat", zh:"个降号", es:"bemol", fr:"bémol", de:"Be", ja:"個のフラット", ko:"개의 내림표", vi:"dấu giáng", pt:"bemol", it:"bemolle" },
  "cof.relMinorIs": { en:"Relative minor:", zh:"关系小调：", es:"Menor relativa:", fr:"Mineur relatif :", de:"Paralleltonart:", ja:"平行調（短調）:", ko:"나란한 단조:", vi:"Giọng thứ song song:", pt:"Menor relativa:", it:"Minore relativa:" },
  "cof.relMajorOf": { en:"Relative minor of", zh:"关系小调，源自", es:"Menor relativa de", fr:"Mineur relatif de", de:"Paralleltonart von", ja:"平行調（短調）—", ko:"나란한 단조 —", vi:"Giọng thứ song song của", pt:"Menor relativa de", it:"Minore relativa di" },
  "cof.relMinor":   { en:"Relative minor", zh:"关系小调", es:"Menor relativa", fr:"Mineur relatif", de:"Paralleltonart", ja:"平行短調", ko:"나란한 단조", vi:"Giọng thứ song song", pt:"Menor relativa", it:"Minore relativa" },
  "cof.selected":   { en:"Selected key", zh:"所选调", es:"Tonalidad", fr:"Tonalité", de:"Gewählte Tonart", ja:"選択中の調", ko:"선택한 조", vi:"Giọng đã chọn", pt:"Tonalidade", it:"Tonalità scelta" },
  "cof.dominant":   { en:"V dominant", zh:"V 属调", es:"V dominante", fr:"V dominante", de:"V Dominante", ja:"V 属調", ko:"V 딸림", vi:"V át", pt:"V dominante", it:"V dominante" },
  "cof.subdominant":{ en:"IV subdominant", zh:"IV 下属调", es:"IV subdominante", fr:"IV sous-dom.", de:"IV Subdominante", ja:"IV 下属調", ko:"IV 버금딸림", vi:"IV hạ át", pt:"IV subdominante", it:"IV sottodom." },
  "cof.powerTitle": { en:"Your 3 power chords", zh:"你的三大常用和弦", es:"Tus 3 acordes clave", fr:"Tes 3 accords clés", de:"Deine 3 Hauptakkorde", ja:"3つの基本コード", ko:"3개의 핵심 코드", vi:"3 hợp âm chủ lực", pt:"Seus 3 acordes-chave", it:"I tuoi 3 accordi base" },
  "cof.powerSub":   { en:"The keys either side of a tonic are its closest friends — together I, IV and V build most pop songs.", zh:"主音两边的调就是它最好的朋友——I、IV、V 一起就能撑起大多数流行歌。", es:"Los tonos a cada lado son sus mejores amigos: juntos, I, IV y V arman casi todo el pop.", fr:"Les tonalités voisines sont ses meilleures amies : ensemble, I, IV et V font presque toute la pop.", de:"Die Tonarten links und rechts sind die besten Freunde – I, IV und V tragen zusammen fast jeden Popsong.", ja:"主音の両隣はいちばん仲良し。I・IV・V の3つでだいたいのポップスができちゃう。", ko:"으뜸음 양옆 조가 제일 친한 친구 — I, IV, V 셋이면 웬만한 팝송 다 만들어져.", vi:"Hai giọng kề bên là bạn thân nhất — I, IV và V gộp lại dựng nên hầu hết nhạc pop.", pt:"Os tons dos dois lados são os melhores amigos — juntos, I, IV e V montam quase todo pop.", it:"Le tonalità ai due lati sono le migliori amiche: insieme, I, IV e V reggono quasi tutto il pop." },
  "cof.playScale":  { en:"Play scale", zh:"播放音阶", es:"Tocar escala", fr:"Jouer la gamme", de:"Tonleiter", ja:"音階を再生", ko:"음계 듣기", vi:"Phát âm giai", pt:"Tocar escala", it:"Suona scala" },
  "cof.playCadence":{ en:"Hear I–IV–V", zh:"试听 I–IV–V", es:"Oír I–IV–V", fr:"Écouter I–IV–V", de:"I–IV–V hören", ja:"I–IV–V を聴く", ko:"I–IV–V 듣기", vi:"Nghe I–IV–V", pt:"Ouvir I–IV–V", it:"Ascolta I–IV–V" },
  "cof.tip":        { en:"Each step clockwise adds one sharp ♯; each step the other way adds one flat ♭. That's why the wheel is your map of every key.", zh:"顺时针每走一格多一个升号 ♯，逆时针每走一格多一个降号 ♭。所以这个圈就是你所有调的地图。", es:"Cada paso en sentido horario suma un sostenido ♯; al revés, un bemol ♭. Por eso la rueda es tu mapa de todos los tonos.", fr:"Chaque pas dans le sens horaire ajoute un dièse ♯ ; dans l'autre sens, un bémol ♭. La roue est ta carte de toutes les tonalités.", de:"Im Uhrzeigersinn kommt je ein Kreuz ♯ dazu, andersrum je ein b ♭. Darum ist das Rad deine Landkarte aller Tonarten.", ja:"時計回りに1つ進むとシャープ ♯ が1個増え、逆回りでフラット ♭ が1個増える。だからこの輪は全部の調の地図になるんだ。", ko:"시계 방향으로 한 칸 갈 때마다 올림표 ♯ 하나, 반대로는 내림표 ♭ 하나씩 늘어나. 그래서 이 휠이 모든 조의 지도야.", vi:"Mỗi bước theo chiều kim đồng hồ thêm một dấu thăng ♯; ngược lại thêm một dấu giáng ♭. Vậy nên vòng tròn là bản đồ mọi giọng.", pt:"Cada passo no sentido horário soma um sustenido ♯; ao contrário, um bemol ♭. Por isso a roda é o mapa de todos os tons.", it:"Ogni passo in senso orario aggiunge un diesis ♯; nell'altro verso un bemolle ♭. Per questo la ruota è la mappa di ogni tonalità." },
});

Object.assign(PP_I18N, {
  "cof.learn":   { en:"Explore", zh:"玩一玩", es:"Explora", fr:"Explore", de:"Stöbern", ja:"さがす", ko:"둘러보기", vi:"Khám phá", pt:"Explorar", it:"Esplora" },
  "cof.quiz":    { en:"Quiz", zh:"挑战", es:"Reto", fr:"Défi", de:"Quiz", ja:"クイズ", ko:"퀴즈", vi:"Đố vui", pt:"Desafio", it:"Sfida" },
  "cof.ear":     { en:"Ear", zh:"听音", es:"Oído", fr:"Oreille", de:"Gehör", ja:"耳トレ", ko:"청음", vi:"Nghe", pt:"Ouvido", it:"Orecchio" },
  "cof.score":   { en:"Score", zh:"得分", es:"Aciertos", fr:"Score", de:"Punkte", ja:"スコア", ko:"점수", vi:"Điểm", pt:"Pontos", it:"Punti" },
  "cof.streak":  { en:"Streak", zh:"连击", es:"Racha", fr:"Série", de:"Serie", ja:"連続", ko:"연속", vi:"Chuỗi", pt:"Sequência", it:"Serie" },
  "cof.correct": { en:"Nailed it!", zh:"答对啦！", es:"¡Lo clavaste!", fr:"Dans le mille !", de:"Sitzt!", ja:"やったー！", ko:"정답이야!", vi:"Chuẩn luôn!", pt:"Mandou bem!", it:"Perfetto!" },
  "cof.wrongWas":{ en:"Nope — it was {key}", zh:"差一点，是 {key}", es:"Casi… era {key}", fr:"Raté — c'était {key}", de:"Knapp — es war {key}", ja:"惜しい！正解は {key}", ko:"아깝다 — 정답은 {key}", vi:"Hụt rồi — là {key}", pt:"Quase… era {key}", it:"Quasi… era {key}" },
  "cof.tapToAnswer":{ en:"Tap your answer on the wheel", zh:"在圈上点出你的答案", es:"Toca tu respuesta en la rueda", fr:"Touche ta réponse sur la roue", de:"Tipp deine Antwort aufs Rad", ja:"輪っかで答えをタップ", ko:"휠에서 답을 눌러", vi:"Chạm đáp án trên vòng nhé", pt:"Toca a resposta na roda", it:"Tocca la risposta sulla ruota" },
  "q.sig0":      { en:"Which key has no sharps or flats?", zh:"哪个调没有升降号？", es:"¿Qué tono no tiene sostenidos ni bemoles?", fr:"Quelle tonalité n'a aucun dièse ni bémol ?", de:"Welche Tonart hat keine Vorzeichen?", ja:"調号がない調はどれ？", ko:"올림표·내림표가 없는 조는?", vi:"Giọng nào không có thăng giáng?", pt:"Qual tom não tem sustenidos nem bemóis?", it:"Quale tonalità non ha diesis né bemolli?" },
  "q.sigSharp":  { en:"Which key has {n} sharps?", zh:"哪个调有 {n} 个升号？", es:"¿Qué tono tiene {n} sostenidos?", fr:"Quelle tonalité a {n} dièses ?", de:"Welche Tonart hat {n} Kreuze?", ja:"シャープが {n} つの調はどれ？", ko:"올림표가 {n}개인 조는?", vi:"Giọng nào có {n} dấu thăng?", pt:"Qual tom tem {n} sustenidos?", it:"Quale tonalità ha {n} diesis?" },
  "q.sigSharp1": { en:"Which key has {n} sharp?", zh:"哪个调有 {n} 个升号？", es:"¿Qué tono tiene {n} sostenido?", fr:"Quelle tonalité a {n} dièse ?", de:"Welche Tonart hat {n} Kreuz?", ja:"シャープが {n} つの調はどれ？", ko:"올림표가 {n}개인 조는?", vi:"Giọng nào có {n} dấu thăng?", pt:"Qual tom tem {n} sustenido?", it:"Quale tonalità ha {n} diesis?" },
  "q.sigFlat":   { en:"Which key has {n} flats?", zh:"哪个调有 {n} 个降号？", es:"¿Qué tono tiene {n} bemoles?", fr:"Quelle tonalité a {n} bémols ?", de:"Welche Tonart hat {n} b-Vorzeichen?", ja:"フラットが {n} つの調はどれ？", ko:"내림표가 {n}개인 조는?", vi:"Giọng nào có {n} dấu giáng?", pt:"Qual tom tem {n} bemóis?", it:"Quale tonalità ha {n} bemolli?" },
  "q.sigFlat1":  { en:"Which key has {n} flat?", zh:"哪个调有 {n} 个降号？", es:"¿Qué tono tiene {n} bemol?", fr:"Quelle tonalité a {n} bémol ?", de:"Welche Tonart hat {n} b-Vorzeichen?", ja:"フラットが {n} つの調はどれ？", ko:"내림표가 {n}개인 조는?", vi:"Giọng nào có {n} dấu giáng?", pt:"Qual tom tem {n} bemol?", it:"Quale tonalità ha {n} bemolle?" },
  "q.relmin":    { en:"Tap the relative minor of {key} major", zh:"点出 {key} 大调的关系小调", es:"Toca la menor relativa de {key} mayor", fr:"Touche le mineur relatif de {key} majeur", de:"Tipp die Paralleltonart von {key}-Dur", ja:"{key} 長調の平行短調をタップ", ko:"{key} 장조의 나란한 단조를 눌러", vi:"Chạm giọng thứ song song của {key} trưởng", pt:"Toca a menor relativa de {key} maior", it:"Tocca la minore relativa di {key} maggiore" },
  "q.dom":       { en:"Tap the dominant (V) of {key}", zh:"点出 {key} 的属调（V）", es:"Toca la dominante (V) de {key}", fr:"Touche la dominante (V) de {key}", de:"Tipp die Dominante (V) von {key}", ja:"{key} の属調（V）をタップ", ko:"{key}의 딸림조(V)를 눌러", vi:"Chạm giọng át (V) của {key}", pt:"Toca a dominante (V) de {key}", it:"Tocca la dominante (V) di {key}" },
  "q.subdom":    { en:"Tap the subdominant (IV) of {key}", zh:"点出 {key} 的下属调（IV）", es:"Toca la subdominante (IV) de {key}", fr:"Touche la sous-dominante (IV) de {key}", de:"Tipp die Subdominante (IV) von {key}", ja:"{key} の下属調（IV）をタップ", ko:"{key}의 버금딸림조(IV)를 눌러", vi:"Chạm giọng hạ át (IV) của {key}", pt:"Toca a subdominante (IV) de {key}", it:"Tocca la sottodominante (IV) di {key}" },
  "q.locate":    { en:"Find {key} major on the wheel", zh:"在圈上找到 {key} 大调", es:"Encuentra {key} mayor en la rueda", fr:"Trouve {key} majeur sur la roue", de:"Finde {key}-Dur auf dem Rad", ja:"輪っかで {key} 長調を探して！", ko:"휠에서 {key} 장조를 찾아봐", vi:"Tìm {key} trưởng trên vòng", pt:"Acha {key} maior na roda", it:"Trova {key} maggiore sulla ruota" },
  "ear.instr":   { en:"Maestro plays home, then a neighbour. Which one did you catch? Tap it!", zh:"Maestro 先弹主和弦，再弹一个邻居。你听出是哪个？点它！", es:"Maestro toca el acorde de casa y luego un vecino. ¿Cuál pillaste? ¡Tócalo!", fr:"Maestro joue l'accord maison, puis un voisin. T'as capté lequel ? Appuie !", de:"Maestro spielt den Heimat-Akkord, dann einen Nachbarn. Welchen hast du erwischt? Tipp drauf!", ja:"マエストロがホームの和音の次に、おとなりを鳴らすよ。どっちだった？タップ！", ko:"마에스트로가 으뜸화음 다음에 이웃 화음을 쳐. 어느 쪽이었게? 눌러봐!", vi:"Maestro đánh hợp âm gốc rồi tới một hợp âm hàng xóm. Bạn bắt được cái nào? Chạm vô liền!", pt:"O Maestro toca o acorde de casa e depois um vizinho. Qual você pegou? Toca nele!", it:"Maestro suona l'accordo di casa, poi un vicino. Quale hai beccato? Toccalo!" },
  "ear.again":   { en:"Play again", zh:"再听一次", es:"Otra vez", fr:"Rejouer", de:"Nochmal", ja:"もう一回", ko:"다시", vi:"Nghe lại", pt:"De novo", it:"Ancora" },
  "ear.home":    { en:"Home", zh:"主音", es:"Tónica", fr:"Tonique", de:"Grundton", ja:"主音", ko:"으뜸음", vi:"Chủ âm", pt:"Tônica", it:"Tonica" },
  "cof.tab":     { en:"Circle of 5ths", zh:"五度圈", es:"Círculo de quintas", fr:"Cycle des quintes", de:"Quintenzirkel", ja:"五度圏", ko:"5도권", vi:"Vòng quãng năm", pt:"Ciclo das quintas", it:"Circolo delle quinte" },
  "cof.hint":    { en:"Tap any key on the wheel to explore it", zh:"点圈上任意一个调来看看", es:"Toca cualquier tono de la rueda para verlo", fr:"Touche une tonalité sur la roue pour la découvrir", de:"Tipp eine Tonart auf dem Rad an", ja:"輪っかの調をタップして見てみよう", ko:"휠에서 아무 조나 눌러서 살펴봐", vi:"Chạm một giọng trên vòng để xem", pt:"Toca qualquer tom na roda pra ver", it:"Tocca una tonalità sulla ruota per scoprirla" },
  "cof.major":   { en:"major", zh:"大调", es:"mayor", fr:"majeur", de:"Dur", ja:"長調", ko:"장조", vi:"trưởng", pt:"maior", it:"maggiore" },
  "cof.minor":   { en:"minor", zh:"小调", es:"menor", fr:"mineur", de:"Moll", ja:"短調", ko:"단조", vi:"thứ", pt:"menor", it:"minore" },
  "cof.keySig":  { en:"Key signature", zh:"调号", es:"Armadura", fr:"Armure", de:"Vorzeichen", ja:"調号", ko:"조표", vi:"Hóa biểu", pt:"Armadura de clave", it:"Armatura" },
  "cof.sig0":    { en:"No sharps or flats", zh:"无升降号", es:"Sin sostenidos ni bemoles", fr:"Ni dièse ni bémol", de:"Keine Vorzeichen", ja:"シャープもフラットもなし", ko:"올림표·내림표 없음", vi:"Không thăng không giáng", pt:"Sem sustenidos nem bemóis", it:"Né diesis né bemolli" },
  "cof.sharps":  { en:"sharps", zh:"个升号", es:"sostenidos", fr:"dièses", de:"Kreuze", ja:"個のシャープ", ko:"개의 올림표", vi:"dấu thăng", pt:"sustenidos", it:"diesis" },
  "cof.sharp1":  { en:"sharp", zh:"个升号", es:"sostenido", fr:"dièse", de:"Kreuz", ja:"個のシャープ", ko:"개의 올림표", vi:"dấu thăng", pt:"sustenido", it:"diesis" },
  "cof.flats":   { en:"flats", zh:"个降号", es:"bemoles", fr:"bémols", de:"Be", ja:"個のフラット", ko:"개의 내림표", vi:"dấu giáng", pt:"bemóis", it:"bemolli" },
  "cof.flat1":   { en:"flat", zh:"个降号", es:"bemol", fr:"bémol", de:"Be", ja:"個のフラット", ko:"개의 내림표", vi:"dấu giáng", pt:"bemol", it:"bemolle" },
  "cof.relMinorIs": { en:"Relative minor:", zh:"关系小调：", es:"Menor relativa:", fr:"Mineur relatif :", de:"Paralleltonart:", ja:"平行調（短調）:", ko:"나란한 단조:", vi:"Giọng thứ song song:", pt:"Menor relativa:", it:"Minore relativa:" },
  "cof.relMajorOf": { en:"Relative minor of", zh:"关系小调，源自", es:"Menor relativa de", fr:"Mineur relatif de", de:"Paralleltonart von", ja:"平行調（短調）—", ko:"나란한 단조 —", vi:"Giọng thứ song song của", pt:"Menor relativa de", it:"Minore relativa di" },
  "cof.relMinor":   { en:"Relative minor", zh:"关系小调", es:"Menor relativa", fr:"Mineur relatif", de:"Paralleltonart", ja:"平行短調", ko:"나란한 단조", vi:"Giọng thứ song song", pt:"Menor relativa", it:"Minore relativa" },
  "cof.selected":   { en:"Selected key", zh:"所选调", es:"Tonalidad", fr:"Tonalité", de:"Gewählte Tonart", ja:"選択中の調", ko:"선택한 조", vi:"Giọng đã chọn", pt:"Tonalidade", it:"Tonalità scelta" },
  "cof.dominant":   { en:"V dominant", zh:"V 属调", es:"V dominante", fr:"V dominante", de:"V Dominante", ja:"V 属調", ko:"V 딸림", vi:"V át", pt:"V dominante", it:"V dominante" },
  "cof.subdominant":{ en:"IV subdominant", zh:"IV 下属调", es:"IV subdominante", fr:"IV sous-dom.", de:"IV Subdominante", ja:"IV 下属調", ko:"IV 버금딸림", vi:"IV hạ át", pt:"IV subdominante", it:"IV sottodom." },
  "cof.powerTitle": { en:"Your 3 power chords", zh:"你的三大常用和弦", es:"Tus 3 acordes clave", fr:"Tes 3 accords clés", de:"Deine 3 Hauptakkorde", ja:"3つの基本コード", ko:"3개의 핵심 코드", vi:"3 hợp âm chủ lực", pt:"Seus 3 acordes-chave", it:"I tuoi 3 accordi base" },
  "cof.powerSub":   { en:"The keys either side of a tonic are its closest friends — together I, IV and V build most pop songs.", zh:"主音两边的调就是它最好的朋友——I、IV、V 一起就能撑起大多数流行歌。", es:"Los tonos a cada lado son sus mejores amigos: juntos, I, IV y V arman casi todo el pop.", fr:"Les tonalités voisines sont ses meilleures amies : ensemble, I, IV et V font presque toute la pop.", de:"Die Tonarten links und rechts sind die besten Freunde – I, IV und V tragen zusammen fast jeden Popsong.", ja:"主音の両隣はいちばん仲良し。I・IV・V の3つでだいたいのポップスができちゃう。", ko:"으뜸음 양옆 조가 제일 친한 친구 — I, IV, V 셋이면 웬만한 팝송 다 만들어져.", vi:"Hai giọng kề bên là bạn thân nhất — I, IV và V gộp lại dựng nên hầu hết nhạc pop.", pt:"Os tons dos dois lados são os melhores amigos — juntos, I, IV e V montam quase todo pop.", it:"Le tonalità ai due lati sono le migliori amiche: insieme, I, IV e V reggono quasi tutto il pop." },
  "cof.playScale":  { en:"Play scale", zh:"播放音阶", es:"Tocar escala", fr:"Jouer la gamme", de:"Tonleiter", ja:"音階を再生", ko:"음계 듣기", vi:"Phát âm giai", pt:"Tocar escala", it:"Suona scala" },
  "cof.playCadence":{ en:"Hear I–IV–V", zh:"试听 I–IV–V", es:"Oír I–IV–V", fr:"Écouter I–IV–V", de:"I–IV–V hören", ja:"I–IV–V を聴く", ko:"I–IV–V 듣기", vi:"Nghe I–IV–V", pt:"Ouvir I–IV–V", it:"Ascolta I–IV–V" },
  "cof.tip":        { en:"Each step clockwise adds one sharp ♯; each step the other way adds one flat ♭. That's why the wheel is your map of every key.", zh:"顺时针每走一格多一个升号 ♯，逆时针每走一格多一个降号 ♭。所以这个圈就是你所有调的地图。", es:"Cada paso en sentido horario suma un sostenido ♯; al revés, un bemol ♭. Por eso la rueda es tu mapa de todos los tonos.", fr:"Chaque pas dans le sens horaire ajoute un dièse ♯ ; dans l'autre sens, un bémol ♭. La roue est ta carte de toutes les tonalités.", de:"Im Uhrzeigersinn kommt je ein Kreuz ♯ dazu, andersrum je ein b ♭. Darum ist das Rad deine Landkarte aller Tonarten.", ja:"時計回りに1つ進むとシャープ ♯ が1個増え、逆回りでフラット ♭ が1個増える。だからこの輪は全部の調の地図になるんだ。", ko:"시계 방향으로 한 칸 갈 때마다 올림표 ♯ 하나, 반대로는 내림표 ♭ 하나씩 늘어나. 그래서 이 휠이 모든 조의 지도야.", vi:"Mỗi bước theo chiều kim đồng hồ thêm một dấu thăng ♯; ngược lại thêm một dấu giáng ♭. Vậy nên vòng tròn là bản đồ mọi giọng.", pt:"Cada passo no sentido horário soma um sustenido ♯; ao contrário, um bemol ♭. Por isso a roda é o mapa de todos os tons.", it:"Ogni passo in senso orario aggiunge un diesis ♯; nell'altro verso un bemolle ♭. Per questo la ruota è la mappa di ogni tonalità." },
});

/* ===== teaching song: a REAL, public-domain folk song everyone in that country knows.
   Charted by scale-degree role [role, lyric] and transposed to the question's key,
   so the chords shown are the same I-IV-V the quiz is asking about. ===== */
const PP_COF_SONG = {
  en: { name: "When the Saints Go Marching In", lines: [[["I","Oh when the saints "],["IV","go marching "],["I","in,"]],[["I","I want to be "],["V","in that "],["I","number."]]] },
  zh: { name: "茉莉花", lines: [[["I","好一朵 "],["IV","美丽的 "],["I","茉莉花,"]],[["IV","芬芳美丽 "],["V","满枝 "],["I","桠。"]]] },
  es: { name: "De Colores", lines: [[["I","De co"],["IV","lores, de co"],["I","lores,"]],[["I","se visten los "],["V","campos en la prima"],["I","vera."]]] },
  fr: { name: "Au clair de la lune", lines: [[["I","Au clair de la "],["V","lune, "],["I","mon ami Pier"],["V","rot,"]],[["I","prête-moi ta "],["IV","plume pour é"],["V","crire un "],["I","mot."]]] },
  de: { name: "Hänschen klein", lines: [[["I","Hänschen "],["V","klein ging al"],["I","lein,"]],[["I","in die "],["IV","weite "],["V","Welt hin"],["I","ein."]]] },
  ja: { name: "ふるさと", lines: [[["I","兎追いし "],["IV","かの"],["I","山,"]],[["IV","小鮒釣りし "],["V","かの"],["I","川。"]]] },
  ko: { name: "아리랑", lines: [[["I","아리랑 "],["IV","아리랑 "],["I","아라리요,"]],[["I","아리랑 "],["V","고개로 "],["I","넘어간다."]]] },
  vi: { name: "Kìa con bướm vàng", lines: [[["I","Kìa con bướm "],["V","vàng, "],["I","kìa con bướm "],["V","vàng,"]],[["I","xòe đôi "],["V","cánh, "],["I","xòe đôi "],["V","cánh."]]] },
  pt: { name: "Peixe Vivo", lines: [[["I","Como pode o "],["IV","peixe "],["I","vivo,"]],[["I","viver fora da "],["V","água "],["I","fria?"]]] },
  it: { name: "Santa Lucia", lines: [[["I","Sul mare "],["V","luccica "],["I","l'astro d'argento,"]],[["IV","placida è l'"],["I","onda, "],["V","prospero il "],["I","vento."]]] },
};

Object.assign(PP_I18N, {
  "teach.tag":        { en:"Why it matters", zh:"为什么重要", es:"Por qué importa", fr:"Pourquoi ça compte", de:"Warum's zählt", ja:"なぜ大事？", ko:"왜 중요할까", vi:"Vì sao quan trọng", pt:"Por que importa", it:"Perché conta" },
  "teach.next":       { en:"Next question", zh:"下一题", es:"Siguiente", fr:"Suivante", de:"Nächste Frage", ja:"次の問題", ko:"다음 문제", vi:"Câu tiếp theo", pt:"Próxima", it:"Prossima" },
  "teach.yourAnswer": { en:"your answer", zh:"你的答案", es:"tu respuesta", fr:"ta réponse", de:"deine Antwort", ja:"あなたの答え", ko:"네 답", vi:"đáp án của bạn", pt:"sua resposta", it:"la tua risposta" },
  "teach.songHdr":    { en:"Hear it in {song} — in {key}:", zh:"在《{song}》里听听看——{key} 调：", es:"Escúchalo en «{song}» — en {key}:", fr:"Écoute-le dans « {song} » — en {key} :", de:"Hör's in „{song}“ — in {key}:", ja:"『{song}』で聴いてみよう——{key} で：", ko:"〈{song}〉으로 들어봐 — {key} 조에서:", vi:"Nghe trong “{song}” — giọng {key}:", pt:"Ouça em “{song}” — em {key}:", it:"Ascoltalo in «{song}» — in {key}:" },
  "teach.playLoop":   { en:"Play loop", zh:"播放", es:"Tocar", fr:"Jouer", de:"Abspielen", ja:"再生", ko:"재생", vi:"Phát", pt:"Tocar", it:"Suona" },
  "role.home":        { en:"Home", zh:"主和弦", es:"Casa", fr:"Maison", de:"Heimat", ja:"ホーム", ko:"홈", vi:"Gốc", pt:"Casa", it:"Casa" },
  "role.dom":         { en:"Dominant", zh:"属和弦", es:"Dominante", fr:"Dominante", de:"Dominante", ja:"属", ko:"딸림", vi:"Át", pt:"Dominante", it:"Dominante" },
  "role.subdom":      { en:"Subdominant", zh:"下属", es:"Subdom.", fr:"Sous-dom.", de:"Subdom.", ja:"下属", ko:"버금딸림", vi:"Hạ át", pt:"Subdom.", it:"Sottodom." },
  "role.relmin":      { en:"Rel. minor", zh:"关系小调", es:"Menor rel.", fr:"Mineur rel.", de:"Parallele", ja:"平行短調", ko:"나란한 단조", vi:"Thứ song song", pt:"Menor rel.", it:"Minore rel." },

  "teach.dom.title":  { en:"What's the dominant (V)?", zh:"什么是属和弦（V）？", es:"¿Qué es la dominante (V)?", fr:"C'est quoi la dominante (V) ?", de:"Was ist die Dominante (V)?", ja:"属和音（V）って？", ko:"딸림화음(V)이 뭐야?", vi:"Hợp âm át (V) là gì?", pt:"O que é a dominante (V)?", it:"Cos'è la dominante (V)?" },
  "teach.dom.body":   { en:"It's one step clockwise on the wheel — the most restless chord in the key. It builds tension and practically begs to fall back home to I. That 'about to drop' feeling right before a chorus? That's the V doing its job.", zh:"它在圈上顺时针一格——调里最'坐不住'的和弦。它制造紧张感，迫不及待想回到主和弦 I。副歌前那种'要炸了'的感觉？就是 V 在干活。", es:"Está un paso a la derecha en la rueda: el acorde más inquieto del tono. Crea tensión y suplica volver a casa (I). ¿Esa sensación de 'ya va a explotar' antes del estribillo? Es la V haciendo su trabajo.", fr:"Un cran dans le sens horaire sur la roue : l'accord le plus agité du morceau. Il crée la tension et supplie de rentrer à la maison (I). Ce frisson juste avant le refrain ? C'est la V qui bosse.", de:"Ein Schritt im Uhrzeigersinn auf dem Rad – der ruheloseste Akkord der Tonart. Er baut Spannung auf und will unbedingt nach Hause zu I. Dieses 'gleich kracht's'-Gefühl vorm Refrain? Das ist die V.", ja:"輪を時計回りに1つ進んだ場所——調の中でいちばん落ち着かない和音。緊張を生み、主和音 I に戻りたくてたまらない。サビ直前の『くるぞ！』って感覚、それが V の仕事。", ko:"휠에서 시계 방향 한 칸 — 그 조에서 가장 안절부절못하는 화음이야. 긴장을 만들고 집(I)으로 돌아가고 싶어 안달이지. 후렴 직전의 '터질 것 같은' 그 느낌? 그게 V가 일하는 거야.", vi:"Một bước theo chiều kim đồng hồ trên vòng — hợp âm 'đứng ngồi không yên' nhất của giọng. Nó tạo căng thẳng và rất muốn về nhà I. Cái cảm giác 'sắp bùng' ngay trước điệp khúc? Đó là V đang làm việc.", pt:"Um passo no sentido horário na roda — o acorde mais inquieto do tom. Cria tensão e implora pra voltar pra casa (I). Aquela sensação de 'vai explodir' antes do refrão? É a V trabalhando.", it:"Un passo in senso orario sulla ruota — l'accordo più irrequieto della tonalità. Crea tensione e vuole tornare a casa (I). Quella sensazione di 'sta per partire' prima del ritornello? È la V che lavora." },
  "teach.subdom.title":{ en:"What's the subdominant (IV)?", zh:"什么是下属和弦（IV）？", es:"¿Qué es la subdominante (IV)?", fr:"C'est quoi la sous-dominante (IV) ?", de:"Was ist die Subdominante (IV)?", ja:"下属和音（IV）って？", ko:"버금딸림화음(IV)이 뭐야?", vi:"Hợp âm hạ át (IV) là gì?", pt:"O que é a subdominante (IV)?", it:"Cos'è la sottodominante (IV)?" },
  "teach.subdom.body": { en:"One step counter-clockwise on the wheel. It steps away from home and feels big, open and hopeful — the lift that sets up the dominant. Tons of choruses jump straight to the IV for that 'open the windows' rush.", zh:"在圈上逆时针一格。它离开主和弦，感觉开阔、明亮、充满希望——为属和弦做铺垫的那个'抬升'。超多副歌一上来就跳到 IV，就为那种'打开窗户'的畅快。", es:"Un paso a la izquierda en la rueda. Se aleja de casa y suena grande, abierta y esperanzadora: el impulso que prepara la dominante. Muchísimos estribillos saltan directo a la IV por esa subida de 'abrir las ventanas'.", fr:"Un cran dans le sens antihoraire. Elle s'éloigne de la maison et sonne grande, ouverte, pleine d'espoir : l'élan qui prépare la dominante. Plein de refrains sautent direct sur la IV pour ce souffle 'grand air'.", de:"Ein Schritt gegen den Uhrzeigersinn. Sie geht weg von zu Hause und klingt groß, offen und hoffnungsvoll – der Schwung, der die Dominante vorbereitet. Viele Refrains springen direkt zur IV für dieses 'Fenster auf'-Gefühl.", ja:"輪を反時計回りに1つ。家から離れて、大きく開けた希望のある響き——属和音への助走になる'持ち上げ'。多くのサビはいきなり IV に飛んで、あの'窓を開ける'爽快感を出すんだ。", ko:"휠에서 반시계 방향 한 칸. 집에서 멀어지며 크고 탁 트인 희망찬 느낌 — 딸림화음을 준비하는 '들어올림'이야. 수많은 후렴이 바로 IV로 점프해서 '창문 활짝' 같은 시원함을 줘.", vi:"Một bước ngược chiều kim đồng hồ. Nó rời nhà, nghe rộng mở và đầy hy vọng — cú nâng để dọn đường cho hợp âm át. Cực nhiều điệp khúc nhảy thẳng vào IV để có cảm giác 'mở toang cửa sổ'.", pt:"Um passo no sentido anti-horário. Se afasta de casa e soa grande, aberta e esperançosa — o impulso que prepara a dominante. Muitos refrões pulam direto pra IV por aquela onda de 'abrir as janelas'.", it:"Un passo in senso antiorario. Si allontana da casa e suona grande, aperta e piena di speranza — la spinta che prepara la dominante. Tantissimi ritornelli saltano dritti alla IV per quella sensazione di 'finestre spalancate'." },
  "teach.relmin.title":{ en:"What's the relative minor (vi)?", zh:"什么是关系小调（vi）？", es:"¿Qué es la menor relativa (vi)?", fr:"C'est quoi le mineur relatif (vi) ?", de:"Was ist die Paralleltonart (vi)?", ja:"平行短調（vi）って？", ko:"나란한 단조(vi)가 뭐야?", vi:"Giọng thứ song song (vi) là gì?", pt:"O que é a menor relativa (vi)?", it:"Cos'è la minore relativa (vi)?" },
  "teach.relmin.body": { en:"It shares the exact same notes as its major key — it just starts on a moodier note. That's why a song can slide between I and vi without anything sounding 'wrong'. It's the major key's emotional twin.", zh:"它和大调用的音一模一样——只是从一个更忧郁的音开始。所以歌曲能在 I 和 vi 之间自由切换，一点都不'跑偏'。它就是大调的情绪双胞胎。", es:"Usa exactamente las mismas notas que su tono mayor — solo empieza en una nota más melancólica. Por eso una canción puede deslizarse entre I y vi sin que suene 'mal'. Es la gemela emocional del tono mayor.", fr:"Il utilise exactement les mêmes notes que sa tonalité majeure — il démarre juste sur une note plus mélancolique. C'est pour ça qu'un morceau glisse entre I et vi sans que ça sonne 'faux'. C'est le jumeau émotionnel du majeur.", de:"Sie nutzt exakt dieselben Töne wie ihre Dur-Tonart – beginnt nur auf einem melancholischeren Ton. Darum gleitet ein Song zwischen I und vi, ohne dass etwas 'falsch' klingt. Der emotionale Zwilling der Dur-Tonart.", ja:"長調とまったく同じ音を使う——ただ、もっと切ない音から始まるだけ。だから曲は I と vi を行き来しても'外れて'聞こえない。長調の感情面の双子なんだ。", ko:"장조와 정확히 같은 음을 써 — 그냥 더 우울한 음에서 시작할 뿐이야. 그래서 곡이 I과 vi 사이를 오가도 하나도 '어긋나게' 들리지 않아. 장조의 감정 쌍둥이지.", vi:"Nó dùng đúng những nốt như giọng trưởng — chỉ là bắt đầu từ một nốt 'tâm trạng' hơn. Vì vậy bài hát có thể lượn giữa I và vi mà chẳng nghe 'sai' chút nào. Nó là cặp song sinh cảm xúc của giọng trưởng.", pt:"Usa exatamente as mesmas notas do tom maior — só começa numa nota mais melancólica. Por isso uma música desliza entre I e vi sem soar 'errado'. É a gêmea emocional do tom maior.", it:"Usa esattamente le stesse note della tonalità maggiore — parte solo da una nota più malinconica. Per questo un brano scivola tra I e vi senza suonare 'sbagliato'. È il gemello emotivo del maggiore." },
  "teach.sig.title":  { en:"What's a key signature?", zh:"什么是调号？", es:"¿Qué es una armadura?", fr:"C'est quoi une armure ?", de:"Was ist eine Tonart-Vorzeichnung?", ja:"調号って？", ko:"조표가 뭐야?", vi:"Hóa biểu là gì?", pt:"O que é uma armadura?", it:"Cos'è l'armatura di chiave?" },
  "teach.sig.body":   { en:"It's the set of sharps or flats you keep for the whole song — the key's fingerprint. Each step clockwise on the wheel adds one sharp; each step the other way adds one flat. Read the wheel and you never have to memorise them.", zh:"它是整首歌都保留的那组升号或降号——调的'指纹'。在圈上顺时针走一格多一个升号，逆时针走一格多一个降号。会看圈，就不用死记。", es:"Es el conjunto de sostenidos o bemoles que mantienes toda la canción — la huella del tono. Cada paso horario en la rueda suma un sostenido; al revés, un bemol. Lee la rueda y nunca tendrás que memorizar.", fr:"C'est l'ensemble de dièses ou bémols gardé tout le morceau — l'empreinte de la tonalité. Chaque cran horaire ajoute un dièse ; l'autre sens, un bémol. Lis la roue et tu n'as rien à mémoriser.", de:"Das ist die Gruppe von Kreuzen oder Bes, die den ganzen Song über gilt – der Fingerabdruck der Tonart. Jeder Schritt im Uhrzeigersinn fügt ein Kreuz hinzu, andersrum ein b. Lies das Rad, dann musst du nichts auswendig lernen.", ja:"曲全体で保つシャープやフラットのセット——調の'指紋'。輪を時計回りに1つでシャープが1個、逆回りでフラットが1個増える。輪を読めれば、暗記いらず。", ko:"곡 전체에 유지하는 올림표나 내림표 묶음 — 조의 '지문'이야. 휠에서 시계 방향 한 칸마다 올림표 하나, 반대로는 내림표 하나씩 늘어. 휠을 읽을 줄 알면 외울 필요가 없어.", vi:"Đó là bộ dấu thăng hoặc giáng giữ suốt cả bài — 'vân tay' của giọng. Mỗi bước theo chiều kim đồng hồ thêm một dấu thăng; ngược lại thêm một dấu giáng. Biết đọc vòng thì khỏi cần học thuộc.", pt:"É o conjunto de sustenidos ou bemóis que você mantém a música toda — a impressão digital do tom. Cada passo horário na roda soma um sustenido; ao contrário, um bemol. Saiba ler a roda e nunca precisa decorar.", it:"È l'insieme di diesis o bemolli che tieni per tutto il brano — l'impronta della tonalità. Ogni passo orario sulla ruota aggiunge un diesis; nell'altro verso un bemolle. Leggi la ruota e non devi memorizzare nulla." },
  "teach.locate.title":{ en:"Reading the wheel", zh:"如何看这个圈", es:"Leer la rueda", fr:"Lire la roue", de:"Das Rad lesen", ja:"輪の読み方", ko:"휠 읽는 법", vi:"Đọc vòng tròn", pt:"Lendo a roda", it:"Leggere la ruota" },
  "teach.locate.body": { en:"Home (I) always sits between its two closest friends: the dominant (V) one step clockwise, the subdominant (IV) one step back. Those three chords — plus the relative minor (vi) — build most songs ever written.", zh:"主和弦（I）总是夹在两个最亲近的邻居中间：顺时针一格是属和弦（V），逆时针一格是下属（IV）。这三个和弦——加上关系小调（vi）——撑起了几乎所有歌。", es:"La casa (I) siempre está entre sus dos amigos más cercanos: la dominante (V) un paso horario, la subdominante (IV) un paso atrás. Esos tres acordes — más la menor relativa (vi) — arman casi todas las canciones.", fr:"La maison (I) est toujours entre ses deux plus proches amis : la dominante (V) un cran à droite, la sous-dominante (IV) un cran à gauche. Ces trois accords — plus le mineur relatif (vi) — font presque toutes les chansons.", de:"Die Heimat (I) sitzt immer zwischen ihren zwei engsten Freunden: die Dominante (V) ein Schritt im Uhrzeigersinn, die Subdominante (IV) einen zurück. Diese drei Akkorde – plus die Paralleltonart (vi) – bauen fast jeden Song.", ja:"ホーム（I）はいつも一番仲の良い2人の間にいる：時計回りに1つが属（V）、1つ戻ると下属（IV）。この3つ——さらに平行短調（vi）——でほとんどの曲ができてる。", ko:"홈(I)은 늘 가장 친한 두 친구 사이에 있어: 시계 방향 한 칸이 딸림(V), 한 칸 뒤가 버금딸림(IV). 이 세 화음 — 거기에 나란한 단조(vi)까지 — 으로 거의 모든 곡이 만들어져.", vi:"Nhà (I) luôn nằm giữa hai người bạn thân nhất: hợp âm át (V) một bước theo chiều kim đồng hồ, hạ át (IV) lùi một bước. Ba hợp âm đó — cộng thêm thứ song song (vi) — dựng nên gần như mọi bài hát.", pt:"A casa (I) fica sempre entre seus dois amigos mais próximos: a dominante (V) um passo horário, a subdominante (IV) um passo atrás. Esses três acordes — mais a menor relativa (vi) — montam quase toda música.", it:"La casa (I) sta sempre tra i suoi due amici più stretti: la dominante (V) un passo in senso orario, la sottodominante (IV) un passo indietro. Questi tre accordi — più la minore relativa (vi) — costruiscono quasi tutte le canzoni." },
});

Object.assign(window, { COF_KEYS, CircleTrainer, CofWheel });
