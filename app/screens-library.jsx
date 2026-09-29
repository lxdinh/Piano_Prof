/* ===================================================================
   Piano Professor — Song Library + Practice
   =================================================================== */
const { useState: useSS, useRef: useRS, useEffect: useES } = React;

function SongCover({ song, size = 150, onClick, ctx }) {
  const premium = song.premium && !(ctx && ctx.premium);
  return (
    <div onClick={onClick} style={{ width: size, flexShrink: 0, cursor: "pointer" }}>
      <div style={{ width: size, height: size, borderRadius: 20, background: artBg(song.hue), position: "relative", overflow: "hidden", boxShadow: "0 6px 16px #0002", display: "grid", placeItems: "center" }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}>
        <Icon name="music" size={size * 0.34} color="#ffffff55" />
        {/* vinyl sheen */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 60% at 70% 20%, #ffffff33, transparent)" }} />
        {premium && <div style={{ position: "absolute", top: 8, right: 8, background: "var(--surface)", borderRadius: 999, padding: "3px 8px", display: "flex", alignItems: "center", gap: 3 }}><Icon name="crown" size={13} color="#C28A00" /><span style={{ fontSize: 11, fontWeight: 900, color: "#C28A00" }}>PRO</span></div>}
        <button style={{ position: "absolute", bottom: 8, right: 8, width: 38, height: 38, borderRadius: "50%", border: "none", background: "var(--surface)", display: "grid", placeItems: "center", boxShadow: "0 3px 8px #0003", cursor: "pointer" }}><Icon name="play" size={18} color="#46A302" /></button>
      </div>
      <h4 style={{ fontSize: 16, fontWeight: 900, color: "var(--ink)", margin: "8px 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</h4>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-faint)", margin: "1px 2px" }}>{song.artist}</p>
    </div>
  );
}

function SongShelf({ title, songs, ctx, dot }) {
  const ref = useRS(null);
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {dot && <span style={{ width: 12, height: 12, borderRadius: 4, background: dot }} />}
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{title}</h2>
        </div>
        <button onClick={() => ref.current && ref.current.scrollBy({ left: 440, behavior: "smooth" })} style={{ ...ghostIcon, width: 40, height: 40 }}><Icon name="chevronRight" size={22} color="var(--ink)" /></button>
      </div>
      <div ref={ref} className="pp-scroll" style={{ display: "flex", gap: 18, overflowX: "auto", padding: "4px 30px 10px" }}>
        {songs.map((s) => <SongCover key={s.id} song={s} ctx={ctx} onClick={() => { PP_Audio.arp([60, 64, 67, 71]); ctx.go("songPreview", { song: s }); }} />)}
      </div>
    </div>
  );
}

function ScreenSongs({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const chart = (window.PP_CHARTS && PP_CHARTS[lang]) || PP_SONGS.trending;
  const f = chart[0] || PP_SONGS.featured;
  return (
    <AppShell ctx={ctx} active="songs">
      <AppHeader ctx={ctx} title={t("songs.title", lang)} sub="" />
      <div className="pp-scroll" style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }}>
        {/* featured hero */}
        <div style={{ padding: "10px 30px 22px" }}>
          <div style={{ display: "flex", gap: 26, alignItems: "center", borderRadius: 28, overflow: "hidden", background: artBg(f.hue), padding: 26, boxShadow: "0 10px 30px #0002", position: "relative" }}>
            <div style={{ width: 180, height: 180, borderRadius: 22, background: "#ffffff22", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "inset 0 0 0 2px #ffffff33" }}>
              <Icon name="music" size={72} color="#ffffffcc" />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#ffffffcc", letterSpacing: 1, textTransform: "uppercase" }}>{t("songs.featured", lang)} · {tLevel("el", lang)}</span>
              <h2 style={{ fontSize: 40, fontWeight: 900, color: "#fff", margin: "4px 0 2px", textShadow: "0 2px 0 #00000022" }}>{f.title}</h2>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#ffffffdd", margin: "0 0 18px" }}>{f.artist}</p>
              <div style={{ display: "flex", gap: 12 }}>
                <ChunkyButton variant="white" size="lg" onClick={() => { PP_Audio.arp([60, 64, 67, 72]); ctx.go("songPreview", { song: f }); }} icon={<Icon name="play" size={20} color="#2E84AD" />}>{t("song.play", lang)}</ChunkyButton>
                <ChunkyButton variant="dark" size="lg" onClick={() => ctx.go("import")} icon={<Icon name="plus" size={20} color="#fff" />}>{t("song.import", lang)}</ChunkyButton>
              </div>
            </div>
          </div>
        </div>
        <SongShelf title={t("songs.trending", lang) + " · " + (PP_LANGS.find(l=>l.code===lang)||{}).flag} songs={chart} ctx={ctx} dot="#FF7A52" />
        <SongShelf title={t("songs.learn", lang)} songs={PP_SONGS.learn} ctx={ctx} dot="#5BB8E3" />
      </div>
    </AppShell>
  );
}

/* --------------------------- SONG PREVIEW ------------------------- */
function ScreenSongPreview({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const s = ctx.params.song || PP_SONGS.featured;
  const premium = s.premium && !ctx.premium;
  const chords = ["C", "G", "Am", "F", "C", "G", "F", "C"];
  const [bar, setBar] = useSS(-1);
  const play = () => {
    if (premium) { ctx.go("paywall"); return; }
    const seq = { C: [60, 64, 67], G: [67, 71, 74], Am: [57, 60, 64], F: [65, 69, 72] };
    chords.forEach((ch, i) => { setTimeout(() => { setBar(i); PP_Audio.chord(seq[ch], 0.7); }, i * 700); });
    setTimeout(() => setBar(-1), chords.length * 700);
  };
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <div style={{ minHeight: 150, background: artBg(s.hue), display: "flex", alignItems: "flex-end", gap: 16, padding: 24, position: "relative" }}>
        <button onClick={() => ctx.back()} style={{ ...ghostIcon, flexShrink: 0 }}><Icon name="chevronLeft" size={24} color="var(--ink)" /></button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: "#fff", margin: 0, textShadow: "0 2px 0 #00000022", lineHeight: 1.08 }}>{s.title}</h1>
          <p style={{ fontSize: 18, fontWeight: 800, color: "#ffffffdd", margin: "4px 0 0" }}>{s.artist} · {tLevel("el", lang)}</p>
        </div>
      </div>
      <div style={{ flex: 1, padding: "26px 40px", overflow: "auto" }} className="pp-scroll">
        <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px" }}>{t("preview.chart", lang)}</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 26 }}>
          {chords.map((c, i) => (
            <div key={i} style={{ width: 90, height: 90, borderRadius: 18, display: "grid", placeItems: "center",
              background: bar === i ? "linear-gradient(180deg,#6FE018,#46A302)" : "var(--surface)", color: bar === i ? "#fff" : "var(--ink)",
              border: "2px solid var(--line)", boxShadow: bar === i ? "0 6px 0 #3D8E00" : "0 4px 0 var(--line)", fontWeight: 900, fontSize: 30, transition: "all .15s", transform: bar === i ? "translateY(-3px)" : "none" }}>{c}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <ChunkyButton variant="sky" size="lg" glow onClick={play} icon={<Icon name="play" size={20} color="#fff" />}>{premium ? t("preview.unlock", lang) : t("song.hearIt", lang)}</ChunkyButton>
          <ChunkyButton variant="sky" size="lg" onClick={() => ctx.go("lesson", { item: { title: s.title } })} icon={<Icon name="grad" size={20} color="#fff" />}>{t("song.learnThis", lang)}</ChunkyButton>
        </div>
        {premium && (
          <div style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 10, background: "var(--sel-gold)", border: "2px solid #F5D98A", borderRadius: 16, padding: "12px 18px" }}>
            <Icon name="crown" size={20} color="#C28A00" />
            <span style={{ fontWeight: 800, color: "#9A6E00", fontSize: 15 }}>{t("preview.premiumNote", lang)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------- IMPORT SHEET ------------------------- */
function ScreenImport({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const [phase, setPhase] = useSS("pick"); // pick -> loading -> preview
  useES(() => {
    if (phase === "loading") { const t = setTimeout(() => { setPhase("preview"); PP_Audio.success(); }, 2200); return () => clearTimeout(t); }
  }, [phase]);
  const chords = ["G", "D", "Em", "C", "G", "D", "C", "G"];
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", padding: "26px 50px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
        <button onClick={() => ctx.back()} style={ghostIcon}><Icon name="chevronLeft" size={26} color="var(--ink)" /></button>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{t("import.title", lang)}</h1>
      </div>

      {phase === "pick" && (
        <div style={{ flex: 1, display: "flex", gap: 24, alignItems: "center", justifyContent: "center" }}>
          {[{ i: "camera", t: t("import.photo", lang), s: t("import.photoSub", lang) }, { i: "image", t: t("import.upload", lang), s: t("import.uploadSub", lang) }].map((o) => (
            <div key={o.t} onClick={() => { PP_Audio.tap(); setPhase("loading"); }} style={{ width: 280, height: 260, borderRadius: 26, background: "var(--surface)", border: "3px dashed #D8CDA9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#58CC02"; e.currentTarget.style.background = "#F7FCEF"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D8CDA9"; e.currentTarget.style.background = "#fff"; }}>
              <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#EAF8DC", display: "grid", placeItems: "center" }}><Icon name={o.i} size={44} color="#58CC02" /></div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{o.t}</h3>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-faint)", margin: 0 }}>{o.s}</p>
            </div>
          ))}
        </div>
      )}

      {phase === "loading" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", border: "8px solid var(--line)", borderTopColor: "#58CC02", animation: "pp-spin 0.9s linear infinite" }} />
          <Maestro mood="idea" size={90} bg="#FFF0CE" />
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{t("import.reading", lang)}</h2>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-faint)" }}>{t("import.detecting", lang)}</p>
        </div>
      )}

      {phase === "preview" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "pp-slide-up .4s" }}>
          <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 8, background: "#EAF8DC", color: "#3D8E00", fontWeight: 900, padding: "7px 16px", borderRadius: 999, marginBottom: 18 }}><Icon name="check" size={18} color="#3D8E00" /> {t("import.detected", lang)}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 26 }}>
            {chords.map((c, i) => <div key={i} style={{ width: 76, height: 76, borderRadius: 16, background: "var(--surface)", border: "2px solid var(--line)", boxShadow: "0 4px 0 var(--line)", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 26, color: "var(--ink)" }}>{c}</div>)}
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <ChunkyButton variant="sky" size="lg" glow onClick={() => ctx.go("lesson", { item: { title: "Your Imported Song" } })} icon={<Icon name="play" size={20} color="#fff" />}>Play with lights</ChunkyButton>
            <ChunkyButton variant="ghost" size="lg" onClick={() => setPhase("pick")}>{t("import.another", lang)}</ChunkyButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- PRACTICE --------------------------- */
const CHORD_LIB = [
  { name: "C", notes: [60, 64, 67], type: "Major" }, { name: "G", notes: [67, 71, 74], type: "Major" },
  { name: "Am", notes: [57, 60, 64], type: "Minor" }, { name: "F", notes: [65, 69, 72], type: "Major" },
  { name: "Dm", notes: [62, 65, 69], type: "Minor" }, { name: "Em", notes: [64, 67, 71], type: "Minor" },
  { name: "D", notes: [62, 66, 69], type: "Major" }, { name: "E", notes: [64, 68, 71], type: "Major" },
];
function ScreenPractice({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const [mode, setMode] = useSS("lib");
  const [libChord, setLibChord] = useSS(null);
  const lit = {};
  if (mode === "lib" && libChord) libChord.notes.forEach((n) => (lit[n] = libChord.t.color));
  const labels = (mode === "lib" && libChord) ? libChord.notes.reduce((a, n, i) => (a[n] = libChord.t.degrees[i], a), {}) : {};
  const hint = mode === "lib" ? t("pr.hint", lang) : mode === "cof" ? t("cof.hint", lang) : "";
  return (
    <AppShell ctx={ctx} active="practice">
      <AppHeader ctx={ctx} title={t("nav.practice", lang)} sub="" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 30px 0", overflow: "hidden", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Segmented options={[{ label: t("pr.chords", lang), value: "lib" }, { label: t("cof.tab", lang), value: "cof" }, { label: t("pr.free", lang), value: "free" }]} value={mode} onChange={(v) => { setMode(v); PP_Audio.tap(); }} />
          {hint && <span style={{ fontWeight: 800, color: "var(--ink-faint)", fontSize: 14 }}>{hint}</span>}
        </div>
        {mode === "lib" && <><ChordLibrary onChange={setLibChord} lang={lang} /><div style={{ flex: "0 0 auto" }} /><div style={{ paddingTop: 12, paddingBottom: 18 }}><Piano low={48} high={84} lit={lit} led height={190} /></div></>}
        {mode === "cof" && <div style={{ flex: 1, minHeight: 0, paddingBottom: 18 }}><CircleTrainer ctx={ctx} lang={lang} /></div>}
        {mode === "free" && <><div style={{ flex: 1 }} /><div style={{ paddingTop: 12, paddingBottom: 18 }}><Piano low={48} high={84} lit={lit} led height={230} /></div></>}
      </div>
    </AppShell>
  );
}

Object.assign(window, { ScreenSongs, ScreenSongPreview, ScreenImport, ScreenPractice, SongCover, CHORD_LIB });
