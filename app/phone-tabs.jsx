/* ===================================================================
   Piano Professor — PHONE LANDSCAPE: tabs, money, hardware + router
   =================================================================== */
const { useState: usePh3, useEffect: usePh3E } = React;

/* ----------------------------- SONGS ------------------------------ */
function PhSongCover({ song, ctx, size = 110 }) {
  const premium = song.premium && !ctx.premium;
  return (
    <div onClick={() => { PP_Audio.arp([60, 64, 67, 71]); ctx.go("songPreview", { song }); }} style={{ width: size, flexShrink: 0, cursor: "pointer" }}>
      <div style={{ width: size, height: size, borderRadius: 16, background: artBg(song.hue), position: "relative", display: "grid", placeItems: "center", boxShadow: "0 4px 12px #0002" }}>
        <Icon name="music" size={size * 0.32} color="#ffffff55" />
        {premium && <div style={{ position: "absolute", top: 6, right: 6, background: "var(--surface)", borderRadius: 999, padding: "2px 7px", display: "flex", alignItems: "center", gap: 2 }}><Icon name="crown" size={11} color="#C28A00" /><span style={{ fontSize: 9, fontWeight: 900, color: "#C28A00" }}>PRO</span></div>}
        <button style={{ position: "absolute", bottom: 6, right: 6, width: 30, height: 30, borderRadius: "50%", border: "none", background: "var(--surface)", display: "grid", placeItems: "center", boxShadow: "0 2px 6px #0003", cursor: "pointer" }}><Icon name="play" size={15} color="#46A302" /></button>
      </div>
      <h4 style={{ fontSize: 13, fontWeight: 900, color: "var(--ink)", margin: "6px 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: size }}>{song.title}</h4>
      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-faint)", margin: "0 2px" }}>{song.artist}</p>
    </div>
  );
}
function PhSongShelf({ title, songs, ctx, dot }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 18px 6px" }}><span style={{ width: 10, height: 10, borderRadius: 3, background: dot }} /><h2 style={{ fontSize: 15, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{title}</h2></div>
      <div className="pp-scroll" style={{ display: "flex", gap: 14, overflowX: "auto", padding: "2px 18px 6px" }}>{songs.map((s) => <PhSongCover key={s.id} song={s} ctx={ctx} />)}</div>
    </div>
  );
}
function PhSongs({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const chart = (window.PP_CHARTS && PP_CHARTS[lang]) || PP_SONGS.trending;
  const f = chart[0] || PP_SONGS.featured;
  return (
    <PhShell ctx={ctx} active="songs">
      <PhHeader ctx={ctx} title={t("songs.title", lang)} sub="" />
      <div className="pp-scroll" style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
        <div style={{ padding: "4px 18px 12px" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", borderRadius: 20, background: artBg(f.hue), padding: 16, boxShadow: "0 6px 18px #0002" }}>
            <div style={{ width: 92, height: 92, borderRadius: 16, background: "#ffffff22", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "inset 0 0 0 2px #ffffff33" }}><Icon name="music" size={40} color="#ffffffcc" /></div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 10.5, fontWeight: 900, color: "#ffffffcc", letterSpacing: .8, textTransform: "uppercase" }}>{t("songs.featured", lang)} · {tLevel("el", lang)}</span>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "2px 0 1px", textShadow: "0 2px 0 #00000022" }}>{f.title}</h2>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#ffffffdd", margin: "0 0 10px" }}>{f.artist}</p>
              <div style={{ display: "flex", gap: 10 }}>
                <ChunkyButton variant="white" size="sm" onClick={() => { PP_Audio.arp([60, 64, 67, 72]); ctx.go("songPreview", { song: f }); }} icon={<Icon name="play" size={16} color="#2E84AD" />}>{t("song.play", lang)}</ChunkyButton>
                <ChunkyButton variant="dark" size="sm" onClick={() => ctx.go("import")} icon={<Icon name="plus" size={16} color="#fff" />}>{t("song.import", lang)}</ChunkyButton>
              </div>
            </div>
          </div>
        </div>
        <PhSongShelf title={t("songs.trending", lang) + " · " + (PP_LANGS.find(l=>l.code===lang)||{}).flag} songs={chart} ctx={ctx} dot="#FF7A52" />
        <PhSongShelf title={t("songs.learn", lang)} songs={PP_SONGS.learn} ctx={ctx} dot="#5BB8E3" />
      </div>
    </PhShell>
  );
}

/* -------------------------- SONG PREVIEW -------------------------- */
function PhSongPreview({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const s = ctx.params.song || PP_SONGS.featured; const premium = s.premium && !ctx.premium;
  const chords = ["C", "G", "Am", "F", "C", "G", "F", "C"]; const [bar, setBar] = usePh3(-1);
  const play = () => { if (premium) { ctx.go("paywall"); return; } const seq = { C: [60, 64, 67], G: [67, 71, 74], Am: [57, 60, 64], F: [65, 69, 72] }; chords.forEach((ch, i) => setTimeout(() => { setBar(i); PP_Audio.chord(seq[ch], .6); }, i * 600)); setTimeout(() => setBar(-1), chords.length * 600); };
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <div style={{ minHeight: 96, background: artBg(s.hue), display: "flex", alignItems: "flex-end", gap: 12, padding: 14, position: "relative" }}>
        <button onClick={() => ctx.back()} style={{ ...phGhost, flexShrink: 0 }}><Icon name="chevronLeft" size={20} color="var(--ink)" /></button>
        <div style={{ minWidth: 0, flex: 1 }}><h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: 0, textShadow: "0 2px 0 #00000022", lineHeight: 1.12 }}>{s.title}</h1><p style={{ fontSize: 13, fontWeight: 800, color: "#ffffffdd", margin: "2px 0 0" }}>{s.artist} · {tLevel("el", lang)}</p></div>
      </div>
      <div style={{ flex: 1, padding: "16px 26px", overflow: "auto" }} className="pp-scroll">
        <h3 style={{ fontSize: 13, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>{t("preview.chart", lang)}</h3>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 16 }}>
          {chords.map((c, i) => <div key={i} style={{ width: 62, height: 62, borderRadius: 14, display: "grid", placeItems: "center", background: bar === i ? "linear-gradient(180deg,#6FE018,#46A302)" : "var(--surface)", color: bar === i ? "#fff" : "var(--ink)", border: "2px solid var(--line)", boxShadow: bar === i ? "0 4px 0 #3D8E00" : "0 3px 0 var(--line)", fontWeight: 900, fontSize: 22, transition: "all .15s", transform: bar === i ? "translateY(-2px)" : "none" }}>{c}</div>)}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <ChunkyButton variant="sky" size="md" glow onClick={play} icon={<Icon name="play" size={18} color="#fff" />}>{premium ? t("preview.unlock", lang) : t("song.hearIt", lang)}</ChunkyButton>
          <ChunkyButton variant="sky" size="md" onClick={() => ctx.go("lesson", { item: { title: s.title } })} icon={<Icon name="grad" size={18} color="#fff" />}>{t("song.learnThis", lang)}</ChunkyButton>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- PRACTICE --------------------------- */
function PhPractice({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const [mode, setMode] = usePh3("lib");
  const [libChord, setLibChord] = usePh3(null);
  const lit = {};
  if (mode === "lib" && libChord) libChord.notes.forEach((n) => (lit[n] = libChord.t.color));
  const labels = (mode === "lib" && libChord) ? libChord.notes.reduce((a, n, i) => (a[n] = libChord.t.degrees[i], a), {}) : {};
  return (
    <PhShell ctx={ctx} active="practice">
      <PhHeader ctx={ctx} title={t("nav.practice", lang)} sub="" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "4px 18px 0", overflow: "hidden", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <Segmented options={[{ label: t("pr.chords", lang), value: "lib" }, { label: t("cof.tab", lang), value: "cof" }, { label: t("pr.free", lang), value: "free" }]} value={mode} onChange={(v) => { setMode(v); PP_Audio.tap(); }} />
        </div>
        {mode === "lib" && <ChordLibrary compact onChange={setLibChord} lang={lang} />}
        {mode === "cof" && <div style={{ flex: 1, minHeight: 0, paddingBottom: 8 }}><CircleTrainer ctx={ctx} lang={lang} compact /></div>}
        {mode === "free" && (
          <>
            <div style={{ flex: 1 }} />
            <div style={{ paddingTop: 8, paddingBottom: 10 }}>
              <Piano low={48} high={84} lit={lit} labels={labels} led height={150} />
            </div>
          </>
        )}
      </div>
    </PhShell>
  );
}

/* ----------------------------- PROFILE ---------------------------- */
function PhProfile({ ctx }) {
  const p = ctx.activeProfile; if (!p) return null;
  const lang = p.lang || "en";
  const lvl = PP_LEVELS.find((l) => l.id === p.levelId) || PP_LEVELS[1];
  const weekly = [25, 60, 40, 80, 50, 100, 30]; const days = ["M", "T", "W", "T", "F", "S", "S"];
  const ach = [{ e: "🔥", k: "ach.streak7", on: 1 }, { e: "🎵", k: "ach.firstSong", on: 1 }, { e: "🎯", k: "ach.perfect", on: 1 }, { e: "⚡", k: "ach.xp1000", on: 1 }, { e: "🎹", k: "ach.chordMaster", on: 0 }, { e: "🏆", k: "ach.graduate", on: 0 }];
  return (
    <PhShell ctx={ctx} active="profile">
      <PhHeader ctx={ctx} title={t("profile.title", lang)} sub="" />
      <div className="pp-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
          <Maestro mood={p.avatar} size={72} bg="var(--cream)" ring={4} ringColor="#5BB8E3" />
          <div style={{ flex: 1 }}><h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{p.name}</h1><p style={{ fontSize: 13, fontWeight: 800, color: lvl.color, margin: "1px 0 0" }}>{tLevel(lvl.id, lang)} · {t("grade", lang)} {p.grade} · {p.path === "soloist" ? t("pf.path.soloist", lang) : t("pf.path.chords", lang)}</p></div>
          <ChunkyButton variant="ghost" size="sm" onClick={() => ctx.go("editProfile", { editId: p.id })} icon={<Icon name="pencil" size={16} color="var(--ink)" />}>{t("profile.edit", lang)}</ChunkyButton>
          <ChunkyButton variant="sky" size="sm" onClick={() => ctx.go("who")} icon={<Icon name="swap" size={16} color="#fff" />}>{t("profile.switch", lang)}</ChunkyButton>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
          {[{ e: "🔥", v: p.streak, l: t("complete.streak", lang), c: "#FF7A52" }, { e: "⚡", v: p.xp.toLocaleString(), l: t("pf.totalXp", lang), c: "#F5B800" }, { e: "💎", v: p.gems, l: t("pf.gems", lang), c: "#5BB8E3" }, { e: "🎵", v: 14, l: t("nav.songs", lang), c: "#58CC02" }].map((s) => (
            <div key={s.l} style={{ background: "var(--surface)", borderRadius: 15, border: "2px solid var(--line)", boxShadow: "0 3px 0 var(--line)", textAlign: "center", padding: "10px 6px" }}><div style={{ fontSize: 22 }}>{s.e}</div><div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</div><div style={{ fontSize: 10, fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase" }}>{s.l}</div></div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
          <Card pad={14}><h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--ink)", margin: "0 0 2px" }}>{t("profile.thisWeek", lang)}</h3><p style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-faint)", margin: "0 0 10px" }}>{t("pf.weekXpShort", lang)}</p><div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 70, gap: 7 }}>{weekly.map((v, i) => <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><div style={{ width: "100%", height: v + "%", background: v >= 50 ? "linear-gradient(180deg,#6FE018,#46A302)" : "#E4DCC0", borderRadius: 6, minHeight: 6 }} /><span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-faint)" }}>{days[i]}</span></div>)}</div></Card>
          <Card pad={14}><h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--ink)", margin: "0 0 10px" }}>{t("profile.achievements", lang)}</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>{ach.map((a) => <div key={a.k} style={{ textAlign: "center", opacity: a.on ? 1 : .4 }}><div style={{ width: 44, height: 44, borderRadius: "50%", margin: "0 auto 4px", display: "grid", placeItems: "center", fontSize: 20, background: a.on ? "linear-gradient(150deg,#FFE38A,#F5B800)" : "var(--line)", boxShadow: a.on ? "0 3px 0 #C28A00" : "none" }}>{a.on ? a.e : <Icon name="lock" size={16} color="#A99F82" />}</div><span style={{ fontSize: 10, fontWeight: 800, color: "var(--ink-soft)" }}>{t(a.k, lang)}</span></div>)}</div></Card>
        </div>
      </div>
    </PhShell>
  );
}

/* ----------------------------- SETTINGS --------------------------- */
function PhToggle({ on, onChange }) {
  return <button onClick={() => { onChange(!on); PP_Audio.tap(); }} style={{ width: 50, height: 28, borderRadius: 999, border: "none", cursor: "pointer", background: on ? "#58CC02" : "#D8CDA9", position: "relative", flexShrink: 0 }}><span style={{ position: "absolute", top: 3, left: on ? 25 : 3, width: 22, height: 22, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 2px 4px #0003", transition: "left .2s" }} /></button>;
}
function PhSettings({ ctx }) {
  const p = ctx.activeProfile; const lang = (p && p.lang) || "en"; const [voice, setVoice] = usePh3(true); const [rem, setRem] = usePh3(true); const [goal, setGoal] = usePh3(50);
  const goals = [{ v: 20, k: "casual" }, { v: 50, k: "regular" }, { v: 100, k: "serious" }, { v: 150, k: "intense" }];
  const [micOpen, setMicOpen] = usePh3(false);
  const [micAllowed, setMicAllowed] = usePh3(true);
  const Row = ({ icon, color, title, sub, children, onClick }) => (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: "2px solid var(--line)", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: color + "22", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={icon} size={18} color={color} /></div>
      <div style={{ flex: 1 }}><div style={{ fontWeight: 900, fontSize: 14.5, color: "var(--ink)" }}>{title}</div>{sub && <div style={{ fontWeight: 700, fontSize: 12, color: "var(--ink-faint)" }}>{sub}</div>}</div>
      {children}
    </div>
  );
  return (
    <PhShell ctx={ctx} active="settings">
      <PhHeader ctx={ctx} title={t("settings.title", lang)} sub={t("settings.tune", lang)} />
      <div className="pp-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 20px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <h3 style={phSecH}>{t("settings.language", lang)}</h3>
            <div style={{ marginBottom: 14 }}><LangDropdown compact value={lang} onChange={(v) => ctx.updateProfile(ctx.activeId, { lang: v })} /></div>
            <h3 style={phSecH}>{t("settings.dailyGoal", lang)}</h3>
            <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>{goals.map((g) => { const on = goal === g.v; return <button key={g.v} onClick={() => { setGoal(g.v); PP_Audio.tap(); }} style={{ flex: 1, padding: "9px 0", borderRadius: 12, cursor: "pointer", border: `2.5px solid ${on ? "#F5B800" : "var(--line)"}`, background: on ? "var(--sel-gold)" : "var(--surface)", boxShadow: on ? "0 3px 0 #C28A00" : "0 3px 0 var(--line)", fontFamily: "Nunito" }}><div style={{ fontWeight: 900, fontSize: 13, color: "var(--ink)" }}>{t("goal." + g.k, lang)}</div><div style={{ fontWeight: 800, fontSize: 10.5, color: "var(--ink-faint)" }}>{g.v} XP</div></button>; })}</div>
            <h3 style={phSecH}>{t("settings.lessonSound", lang)}</h3>
            <Card pad={0}><Row icon="sound" color="#58CC02" title={t("settings.voice", lang)}><PhToggle on={voice} onChange={setVoice} /></Row><Row icon="bell" color="#FF7A52" title={t("settings.reminders", lang)} sub="6 PM"><PhToggle on={rem} onChange={setRem} /></Row><Row icon="music" color="#5BB8E3" title={t("settings.bgMusic", lang)}><PhToggle on={ctx.ambient} onChange={(v) => ctx.setAmbient(v)} /></Row></Card>
            <h3 style={phSecH}>{t("settings.appearance", lang)}</h3>
            <Card pad={0}><Row icon="moon" color="#7C6BFF" title={t("settings.darkMode", lang)}><PhToggle on={ctx.theme === "dark"} onChange={(v) => ctx.setTheme(v ? "dark" : "light")} /></Row></Card>
          </div>
          <div>
            <h3 style={phSecH}>{t("settings.hardware", lang)}</h3>
            <Card pad={0} style={{ marginBottom: 14 }}><Row icon="bluetooth" color="#5BB8E3" title={t("set.ledStrip", lang)} sub={ctx.led.connected ? t("set.connected", lang) : t("set.notConnected", lang)} onClick={() => ctx.go("pair")}><Icon name="chevronRight" size={20} color="#C0B79A" /></Row><Row icon="sliders" color="#9b6bff" title={t("set.ledThemesShort", lang)} sub={(ctx.led.theme || "rainbow") + " · " + ctx.led.brightness + "%"} onClick={() => ctx.go("ledSettings")}><Icon name="chevronRight" size={20} color="#C0B79A" /></Row></Card>
            <h3 style={phSecH}>{t("settings.account", lang)}</h3>
            <Card pad={0}><Row icon="crown" color="#F5B800" title={t("settings.subscription", lang)} sub={ctx.premium ? t("set.familyAnnual", lang) : t("set.free", lang)} onClick={() => ctx.go("manageSub")}><Icon name="chevronRight" size={20} color="#C0B79A" /></Row><Row icon="swap" color="#5BB8E3" title={t("settings.switchProfile", lang)} sub={t("set.playingAs", lang) + " " + (p ? p.name : "")} onClick={() => ctx.go("who")}><Icon name="chevronRight" size={20} color="#C0B79A" /></Row></Card>
            <h3 style={phSecH}>{t("settings.privacy", lang)}</h3>
            <Card pad={0}><Row icon="mic" color="#58CC02" title={t("settings.microphone", lang)} sub={micAllowed ? t("settings.micAllowed", lang) : t("settings.micOff", lang)} onClick={() => { setMicOpen(true); PP_Audio.tap(); }}><span style={{ fontWeight: 900, fontSize: 13, color: micAllowed ? "#58CC02" : "var(--ink-faint)" }}>{micAllowed ? "ON" : "OFF"}</span></Row></Card>
          </div>
        </div>
      </div>
      {micOpen && <MicSheet compact
        lang={lang}
        primaryLabel={micAllowed ? t("mic.keep", lang) : t("mic.allow", lang)}
        secondaryLabel={micAllowed ? t("mic.turnOff", lang) : t("mic.notNow", lang)}
        onAllow={() => { setMicAllowed(true); setMicOpen(false); PP_Audio.success(); ctx.toast(t("settings.micAllowed", lang)); }}
        onClose={() => { if (micAllowed) { setMicAllowed(false); ctx.toast(t("settings.micOff", lang)); } setMicOpen(false); }}
      />}
    </PhShell>
  );
}
const phSecH = { fontSize: 12.5, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 1, margin: "18px 0 8px 2px" };

/* ----------------------------- PAYWALL ---------------------------- */
function PhPaywall({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const [plan, setPlan] = usePh3("family"); const [annual, setAnnual] = usePh3(true);
  const [pay, setPay] = usePh3(ctx.params.state === "error" ? "error" : ctx.params.state === "loading" ? "processing" : "idle");
  const cur = PP_PLANS.find((p) => p.id === plan); const price = annual ? cur.monthly : cur.monthly * 1.6;
  const planName = (id) => t("plan." + id, lang); const planSub = (id) => t("plan." + id + "Sub", lang);
  const subscribe = () => { setPay("processing"); setTimeout(() => { ctx.setPremium(true); PP_Audio.success(); ctx.toast(t("pw.welcome", lang)); ctx.back(); }, 1700); };
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "var(--cream)", overflow: "hidden", position: "relative" }}>
      {pay === "processing" && <div style={{ position: "absolute", inset: 0, zIndex: 70, background: "rgba(20,16,10,.5)", backdropFilter: "blur(5px)", display: "grid", placeItems: "center" }}><div style={{ width: 340, background: "var(--surface)", borderRadius: 22, padding: 28, boxShadow: "0 20px 50px #0006", textAlign: "center" }}><div style={{ width: 60, height: 60, borderRadius: "50%", border: "7px solid #FBEFC8", borderTopColor: "#F5B800", animation: "pp-spin .9s linear infinite", margin: "0 auto 14px" }} /><h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--ink)", margin: "0 0 4px" }}>{t("pw.procTitle", lang)}</h2><p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-faint)", margin: 0 }}>{t("pw.procSub", lang)}</p></div></div>}
      {pay === "error" && <div style={{ position: "absolute", inset: 0, zIndex: 70, background: "rgba(20,16,10,.5)", backdropFilter: "blur(5px)", display: "grid", placeItems: "center" }}><div style={{ width: 380, background: "var(--surface)", borderRadius: 22, padding: "24px 28px", boxShadow: "0 20px 50px #0006", textAlign: "center", animation: "pp-pop .3s" }}><Maestro mood="sad" size={80} bg="#FBEEE6" ring={4} ringColor="#fff" style={{ margin: "0 auto 6px" }} /><h2 style={{ fontSize: 21, fontWeight: 900, color: "var(--ink)", margin: "0 0 6px" }}>{t("pw.errTitle", lang)}</h2><p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-soft)", margin: "0 auto 16px", maxWidth: 300, lineHeight: 1.35 }}>{t("pw.errSub", lang)}</p><div style={{ display: "flex", gap: 10, justifyContent: "center" }}><ChunkyButton variant="ghost" size="sm" onClick={() => ctx.back()}>{t("mic.notNow", lang)}</ChunkyButton><ChunkyButton variant="sky" size="sm" onClick={() => setPay("idle")} icon={<Icon name="refresh" size={16} color="#fff" />}>{t("common.tryAgain", lang)}</ChunkyButton></div></div></div>}
      {/* left pitch */}
      <div style={{ width: 300, flexShrink: 0, background: "linear-gradient(170deg,#FFCB2E,#F5B800)", padding: "20px 24px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, bottom: -16, fontSize: 150, opacity: .12 }}>👑</div>
        <button onClick={() => ctx.back()} style={{ ...phGhost, background: "#ffffff44", border: "none", alignSelf: "flex-start", marginBottom: 12 }}><Icon name="close" size={20} color="#5a3d00" /></button>
        <Maestro mood="trophy" size={74} bg="#ffffff66" ring={4} ringColor="#ffffff88" float style={{ marginBottom: 12 }} />
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "#5a3d00", margin: 0, lineHeight: 1.05 }}>{t("pw.headline", lang).split("\n").map((ln, i) => <React.Fragment key={i}>{i > 0 && <br />}{ln}</React.Fragment>)}</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 16 }}>
          {[["library", t("pw.bSongs", lang)], ["heart", t("pw.bHearts", lang)], ["user", t("pw.bProfiles", lang)], ["bluetooth", t("pw.bLed", lang)]].map((b) => <div key={b[0]} style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 28, height: 28, borderRadius: 9, background: "#ffffff66", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={b[0]} size={16} color="#5a3d00" /></div><span style={{ fontSize: 13.5, fontWeight: 800, color: "#5a3d00" }}>{b[1]}</span></div>)}
        </div>
      </div>
      {/* right plans */}
      <div style={{ flex: 1, padding: "16px 24px", display: "flex", flexDirection: "column", overflow: "auto" }} className="pp-scroll">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--ink)", margin: 0, whiteSpace: "nowrap" }}>{t("pw.choose", lang)}</h2>
          <Segmented options={[{ label: t("pw.annual", lang), value: "y" }, { label: t("pw.monthly", lang), value: "m" }]} value={annual ? "y" : "m"} onChange={(v) => setAnnual(v === "y")} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {PP_PLANS.map((pl) => { const on = plan === pl.id; const m = annual ? pl.monthly : pl.monthly * 1.6; return (
            <div key={pl.id} onClick={() => { setPlan(pl.id); PP_Audio.tap(); }} style={{ position: "relative", display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 16, cursor: "pointer", background: on ? "var(--sel-green)" : "var(--surface)", border: `2.5px solid ${on ? "#58CC02" : "var(--line)"}`, boxShadow: on ? "0 4px 0 #46A302" : "0 3px 0 var(--line)" }}>
              {pl.best && <span style={{ position: "absolute", top: -10, right: 16, background: "#FF7A52", color: "#fff", fontWeight: 900, fontSize: 10, padding: "3px 10px", borderRadius: 999, boxShadow: "0 2px 0 #C2410C", textTransform: "uppercase", letterSpacing: .5 }}>{t("pw.best", lang)}</span>}
              <div style={{ fontSize: 32 }}>{pl.icon}</div>
              <div style={{ flex: 1 }}><h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{planName(pl.id)}</h3><p style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-faint)", margin: "1px 0 0" }}>{planSub(pl.id)}</p></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 22, fontWeight: 900, color: on ? "#46A302" : "var(--ink)" }}>${m.toFixed(2)}</div><div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-faint)" }}>{t("pw.perMonth", lang)}</div></div>
              <span style={{ width: 26, height: 26, borderRadius: "50%", border: `2.5px solid ${on ? "#58CC02" : "#D8CDA9"}`, background: on ? "#58CC02" : "transparent", display: "grid", placeItems: "center", flexShrink: 0 }}>{on && <Icon name="check" size={15} color="#fff" />}</span>
            </div>
          ); })}
        </div>
        <div style={{ flex: 1, minHeight: 10 }} />
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <ChunkyButton variant="sky" size="lg" glow full onClick={subscribe}>{t("pw.startTrial", lang)}</ChunkyButton>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-faint)", margin: 0 }}>{t("pw.thenPrice", lang).replace("{price}", "$" + price.toFixed(2)).replace("{plan}", planName(cur.id))}</p>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- UPSELL ----------------------------- */
function PhUpsell({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const reason = ctx.params.reason || "hearts";
  const cfg = { hearts: { mood: "sad", title: t("up.heartsTitle", lang), body: t("up.heartsBody", lang), refill: true }, locked: { mood: "thinking", title: t("up.lockedTitle", lang), body: t("up.lockedBody", lang), refill: false }, trial: { mood: "nervous", title: t("up.trialTitle", lang), body: t("up.trialBody", lang), refill: false } }[reason];
  const [secs, setSecs] = usePh3(4 * 3600);
  usePh3E(() => { if (!cfg.refill) return; const iv = setInterval(() => setSecs((x) => Math.max(0, x - 60)), 1000); return () => clearInterval(iv); }, []);
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0"), mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  return (
    <div style={{ width: "100%", height: "100%", background: "rgba(20,16,10,.55)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center" }}>
      <div style={{ width: 460, maxWidth: "92%", background: "var(--cream)", borderRadius: 24, padding: "24px 30px", boxShadow: "0 24px 60px #0006", textAlign: "center", position: "relative", animation: "pp-pop .3s", display: "flex", gap: 20, alignItems: "center" }}>
        <button onClick={() => ctx.back()} style={{ ...phGhost, position: "absolute", top: 12, right: 12 }}><Icon name="close" size={18} color="var(--ink)" /></button>
        <Maestro mood={cfg.mood} size={96} bg="#FFE0E0" ring={4} ringColor="#fff" float style={{ flexShrink: 0 }} />
        <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", margin: "0 6px 6px 0" }}>{cfg.title}</h1>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.35, margin: "0 0 12px", overflowWrap: "anywhere" }}>{cfg.body}</p>
          {cfg.refill && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><span style={{ fontSize: 18 }}>❤️</span><span style={{ fontWeight: 900, fontSize: 17, color: "#C2410C", fontVariantNumeric: "tabular-nums" }}>{t("up.nextHeart", lang)} {hh}:{mm}</span></div>}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ChunkyButton variant="gold" size="md" glow onClick={() => ctx.go("paywall")} icon={<Icon name="crown" size={18} color="#5a3d00" />}>{t("up.goPremium", lang)}</ChunkyButton>
            {reason === "hearts" ? <ChunkyButton variant="ghost" size="md" onClick={() => { ctx.updateProfile(ctx.activeId, { hearts: 5 }); ctx.toast(t("up.heartsRefilled", lang)); ctx.go("practice"); }}>{t("up.practiceFree", lang)}</ChunkyButton> : <ChunkyButton variant="ghost" size="md" onClick={() => ctx.back()}>{t("up.maybeLater", lang)}</ChunkyButton>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ PAIRING --------------------------- */
function PhPair({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const [phase, setPhase] = usePh3(ctx.led.connected ? "success" : (ctx.params.state === "error" ? "failed" : "scan"));
  const sweep = usePhSweep([60, 62, 64, 65, 67, 69, 71, 72], ["#58CC02", "#F5B800", "#5BB8E3"], 130);
  usePh3E(() => {
    if (phase === "scan") { const t = setTimeout(() => setPhase("found"), 2200); return () => clearTimeout(t); }
    if (phase === "connecting") { const t = setTimeout(() => { setPhase("success"); ctx.setLed({ ...ctx.led, connected: true }); PP_Audio.success(); }, 1800); return () => clearTimeout(t); }
  }, [phase]);
  return (
    <div className="pp-dark-scene" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "radial-gradient(120% 110% at 50% 0%, var(--sel-sky) 0%, #FFFAEC 60%)" }}>
      <button onClick={() => ctx.back()} style={{ ...phGhost, position: "absolute", top: 14, left: 14 }}><Icon name="close" size={20} color="var(--ink)" /></button>
      {phase === "success" && <Confetti run count={70} />}
      {(phase === "scan" || phase === "found") && (
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <div style={{ position: "relative", width: 150, height: 150, display: "grid", placeItems: "center", flexShrink: 0 }}>
            {phase === "scan" && [0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", border: "3px solid #5BB8E3", animation: `pp-ring 2s ${i * .6}s ease-out infinite` }} />)}
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(150deg,#7FCBED,#5BB8E3)", display: "grid", placeItems: "center", boxShadow: "0 8px 22px #5BB8E366", zIndex: 2 }}><Icon name="bluetooth" size={40} color="#fff" /></div>
          </div>
          <div style={{ maxWidth: 360 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{phase === "scan" ? "Looking for your LED strip…" : "Found it!"}</h1>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", margin: "6px 0 14px" }}>{phase === "scan" ? "Make sure the controller is plugged in and blinking blue." : "Tap to connect your strip."}</p>
            {phase === "found" && <div onClick={() => { setPhase("connecting"); PP_Audio.blip(660, .1); }} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "2.5px solid #5BB8E3", borderRadius: 16, padding: "10px 16px", cursor: "pointer", boxShadow: "0 4px 0 #2E84AD", animation: "pp-pop .3s" }}><div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--sel-sky)", display: "grid", placeItems: "center" }}><span style={{ fontSize: 22 }}>🎹</span></div><div style={{ flex: 1 }}><h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Piano Professor LED</h3><p style={{ fontSize: 12, fontWeight: 800, color: "#5BB8E3", margin: 0 }}>PP-Strip · 88 keys</p></div><Icon name="chevronRight" size={22} color="#5BB8E3" /></div>}
            {phase === "scan" && <button onClick={() => setPhase("failed")} style={{ background: "none", border: "none", fontFamily: "Nunito", fontWeight: 800, fontSize: 13, color: "var(--ink-faint)", textDecoration: "underline", cursor: "pointer", padding: 0 }}>Can't find your strip?</button>}
          </div>
        </div>
      )}
      {phase === "connecting" && <><div style={{ width: 70, height: 70, borderRadius: "50%", border: "7px solid #D7ECF7", borderTopColor: "#5BB8E3", animation: "pp-spin .9s linear infinite", marginBottom: 16 }} /><h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Connecting…</h1></>}
      {phase === "failed" && (
        <div style={{ display: "flex", alignItems: "center", gap: 30, animation: "pp-pop .35s" }}>
          <Maestro mood="confused" size={100} bg="#FBEEE6" ring={4} ringColor="#fff" float style={{ flexShrink: 0 }} />
          <div style={{ maxWidth: 360 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", margin: 0 }}>No strip found</h1>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)", margin: "6px 0 14px", lineHeight: 1.35 }}>Make sure it's powered on and blinking blue, then try again.</p>
            <ChunkyButton variant="sky" size="md" glow onClick={() => setPhase("scan")} icon={<Icon name="refresh" size={18} color="#fff" />}>Scan again</ChunkyButton>
          </div>
        </div>
      )}
      {phase === "success" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: "pp-pop .4s", padding: "8px 0" }}>
          <Maestro mood="wow" size={64} bg="#EAF8DC" ring={3} ringColor="#fff" float />
          <h1 style={{ fontSize: 23, fontWeight: 900, color: "var(--ink)", margin: "6px 0 1px" }}>{t("pair.keysLight", lang)}</h1>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 10 }}>{t("pair.magic", lang)}</p>
          <div style={{ width: 330, marginBottom: 12 }}><Piano low={60} high={72} lit={sweep} led interactive={false} hideNoteNames height={84} /></div>
          <div style={{ display: "flex", gap: 10 }}>
            <ChunkyButton variant="ghost" size="sm" onClick={() => ctx.go("ledSettings")}>{t("pair.ledSettings", lang)}</ChunkyButton>
            <ChunkyButton variant="sky" size="sm" glow onClick={() => ctx.go("home")} icon={<Icon name="arrowRight" size={16} color="#fff" />}>{t("common.startLearning", lang)}</ChunkyButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- LED SETTINGS ------------------------- */
function PhLedSettings({ ctx }) {
  const connected = ctx.led.connected;
  const [theme, setTheme] = usePh3(ctx.led.theme); const [bright, setBright] = usePh3(ctx.led.brightness);
  const cur = LED_THEMES.find((t) => t.id === theme) || LED_THEMES[0];
  const demoLit = (() => { const o = {}; [60, 62, 64, 65, 67, 69, 71, 72].forEach((m, i) => o[m] = cur.colors[i % cur.colors.length]); return o; })();
  usePh3E(() => { ctx.setLed({ ...ctx.led, theme, brightness: bright }); }, [theme, bright]);
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", padding: "14px 28px", overflow: "auto" }} className="pp-scroll">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <button onClick={() => ctx.back()} style={phGhost}><Icon name="chevronLeft" size={20} color="var(--ink)" /></button>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", margin: 0 }}>LED settings</h1>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, background: connected ? "#EAF8DC" : "#FBEEE6", border: `2px solid ${connected ? "#CFEAAE" : "#F3D3BE"}`, borderRadius: 999, padding: "5px 12px" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#58CC02" : "#C2410C" }} /><span style={{ fontWeight: 800, fontSize: 12.5, color: connected ? "#3D8E00" : "#C2410C" }}>{connected ? "Connected" : "Not connected"}</span></div>
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ borderRadius: 18, background: "#1a1814", padding: 12, marginBottom: 14, opacity: connected ? 1 : .5 }}><Piano low={60} high={72} lit={demoLit} led interactive={false} hideNoteNames height={110} /></div>
          <h3 style={phSecH}>Brightness</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Icon name="sound" size={18} color="#A99F82" /><input type="range" min="10" max="100" value={bright} onChange={(e) => setBright(+e.target.value)} style={{ flex: 1, accentColor: "#58CC02" }} /><span style={{ fontWeight: 900, fontSize: 16, color: "var(--ink)", width: 46, textAlign: "right" }}>{bright}%</span></div>
        </div>
        <div style={{ width: 300 }}>
          <h3 style={phSecH}>Color theme</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {LED_THEMES.map((t) => { const on = theme === t.id; return <button key={t.id} onClick={() => { setTheme(t.id); PP_Audio.arp([60, 64, 67]); }} style={{ padding: 9, borderRadius: 14, cursor: "pointer", border: `2.5px solid ${on ? "#58CC02" : "var(--line)"}`, background: "var(--surface)", boxShadow: on ? "0 3px 0 #46A302" : "0 3px 0 var(--line)", fontFamily: "Nunito" }}><div style={{ display: "flex", height: 24, borderRadius: 7, overflow: "hidden", marginBottom: 6 }}>{t.colors.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}</div><span style={{ fontWeight: 900, fontSize: 13.5, color: "var(--ink)" }}>{t.name}</span></button>; })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- IMPORT / MANAGE ---------------------- */
function PhImport({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const [phase, setPhase] = usePh3("pick");
  usePh3E(() => { if (phase === "loading") { const t = setTimeout(() => { setPhase("preview"); PP_Audio.success(); }, 2000); return () => clearTimeout(t); } }, [phase]);
  const chords = ["G", "D", "Em", "C", "G", "D", "C", "G"];
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", padding: "14px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}><button onClick={() => ctx.back()} style={phGhost}><Icon name="chevronLeft" size={20} color="var(--ink)" /></button><h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{t("import.title", lang)}</h1></div>
      {phase === "pick" && <div style={{ flex: 1, display: "flex", gap: 18, alignItems: "center", justifyContent: "center" }}>{[{ i: "camera", t: t("import.photo", lang) }, { i: "image", t: t("import.upload", lang) }].map((o) => <div key={o.t} onClick={() => { PP_Audio.tap(); setPhase("loading"); }} style={{ width: 240, height: 180, borderRadius: 20, background: "var(--surface)", border: "3px dashed #D8CDA9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, cursor: "pointer" }}><div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EAF8DC", display: "grid", placeItems: "center" }}><Icon name={o.i} size={32} color="#58CC02" /></div><h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{o.t}</h3></div>)}</div>}
      {phase === "loading" && <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}><div style={{ width: 70, height: 70, borderRadius: "50%", border: "7px solid var(--line)", borderTopColor: "#58CC02", animation: "pp-spin .9s linear infinite" }} /><Maestro mood="idea" size={72} bg="#FFF0CE" /><h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{t("import.reading", lang)}</h2></div>}
      {phase === "preview" && <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "pp-slide-up .4s" }}><div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 8, background: "#EAF8DC", color: "#3D8E00", fontWeight: 900, padding: "6px 14px", borderRadius: 999, marginBottom: 14, fontSize: 13 }}><Icon name="check" size={16} color="#3D8E00" />{t("import.detected", lang)}</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>{chords.map((c, i) => <div key={i} style={{ width: 56, height: 56, borderRadius: 13, background: "var(--surface)", border: "2px solid var(--line)", boxShadow: "0 3px 0 var(--line)", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 20, color: "var(--ink)" }}>{c}</div>)}</div><div style={{ display: "flex", gap: 10 }}><ChunkyButton variant="sky" size="md" glow onClick={() => ctx.go("lesson", { item: { title: "Your Imported Song" } })} icon={<Icon name="play" size={18} color="#fff" />}>Play with lights</ChunkyButton><ChunkyButton variant="ghost" size="md" onClick={() => setPhase("pick")}>{t("import.another", lang)}</ChunkyButton></div></div>}
    </div>
  );
}
function PhManageSub({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const active = ctx.premium;
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", padding: "14px 28px", overflow: "auto" }} className="pp-scroll">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}><button onClick={() => ctx.back()} style={phGhost}><Icon name="chevronLeft" size={20} color="var(--ink)" /></button><h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{t("ms.title", lang)}</h1></div>
      <div style={{ background: active ? "linear-gradient(150deg,#6FE018,#46A302)" : "var(--surface)", borderRadius: 20, padding: 22, color: active ? "#fff" : "var(--ink)", border: active ? "none" : "2px solid var(--line)", boxShadow: active ? "0 6px 18px #46a30244" : "0 3px 0 var(--line)", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><span style={{ fontSize: 12, fontWeight: 900, opacity: .85, textTransform: "uppercase", letterSpacing: 1 }}>{active ? t("ms.currentPlan", lang) : t("ms.noPlan", lang)}</span><h2 style={{ fontSize: 26, fontWeight: 900, margin: "3px 0" }}>{active ? t("plan.family", lang) + " · " + t("pw.annual", lang).split(" ·")[0] : t("ms.free", lang)}</h2><p style={{ fontSize: 13, fontWeight: 800, opacity: .9, margin: 0 }}>{active ? t("ms.renews", lang).replace("{date}", "01.06.2027").replace("{price}", "$26.24") : t("ms.limited", lang)}</p></div>
        <div style={{ fontSize: 44 }}>{active ? "👨‍👩‍👧‍👦" : "🎹"}</div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {active ? <><ChunkyButton variant="sky" size="md" onClick={() => ctx.go("paywall")}>{t("ms.changePlan", lang)}</ChunkyButton><ChunkyButton variant="ghost" size="md" onClick={() => { ctx.setPremium(false); ctx.toast(t("ms.cancelled", lang)); }} style={{ color: "#C81E1E" }}>{t("ms.cancel", lang)}</ChunkyButton></> : <ChunkyButton variant="gold" size="md" glow onClick={() => ctx.go("paywall")} icon={<Icon name="crown" size={18} color="#5a3d00" />}>{t("ms.seePlans", lang)}</ChunkyButton>}
      </div>
    </div>
  );
}

/* ============================= ROUTER ============================= */
const PH_MODAL = new Set(["who", "createProfile", "editProfile", "paywall", "upsell", "manageSub", "complete", "pair"]);
function PhApp() {
  const [profiles, setProfiles] = usePh3(() => JSON.parse(JSON.stringify(PP_PROFILES_SEED)));
  const [activeId, setActiveId] = usePh3(null);
  const [screen, setScreen] = usePh3("splash");
  const [params, setParams] = usePh3({});
  const [history, setHistory] = usePh3([]);
  const [premium, setPremium] = usePh3(false);
  const [led, setLed] = usePh3({ connected: false, brightness: 80, theme: "rainbow", calibrated: false });
  const [muted, setMutedState] = usePh3(false);
  const [ambient, setAmbientState] = usePh3(true);
  const [theme, setThemeState] = usePh3(() => { try { return localStorage.getItem("pp-theme") || "light"; } catch (e) { return "light"; } });
  const [toastMsg, setToastMsg] = usePh3(null);
  const [anim, setAnim] = usePh3({ token: 0, kind: "fwd" });
  const toastTimer = React.useRef(null);
  const activeProfile = profiles.find((p) => p.id === activeId) || null;

  const go = (name, p = {}) => { setHistory((h) => [...h, { screen, params }]); setParams(p); setAnim({ token: Date.now(), kind: PH_MODAL.has(name) ? "modal" : "fwd" }); setScreen(name); };
  const back = () => { setHistory((h) => { if (!h.length) return h; const prev = h[h.length - 1]; setParams(prev.params || {}); setAnim({ token: Date.now(), kind: "back" }); setScreen(prev.screen); return h.slice(0, -1); }); };
  const updateProfile = (id, patch) => setProfiles((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const toast = (msg) => { setToastMsg(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToastMsg(null), 2400); };
  const setMuted = (m) => { setMutedState(m); PP_Audio.setMuted(m); };
  const setAmbient = (on) => { setAmbientState(on); PP_Audio.setAmbientEnabled(on); };
  const setTheme = (mode) => { setThemeState(mode); try { localStorage.setItem("pp-theme", mode); } catch (e) {} };
  usePh3E(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  const ctx = { screen, params, go, back, profiles, setProfiles, activeId, setActiveId, activeProfile, updateProfile, premium, setPremium, led, setLed, muted, setMuted, ambient, setAmbient, toast, theme, setTheme };

  usePh3E(() => { window.PPGo = (name, p) => { if (!activeId && !["splash", "who", "createProfile", "onboarding"].includes(name)) setActiveId(profiles[0].id); go(name, p || {}); }; });

  usePh3E(() => {
    PP_Audio.kickAmbient();
    PP_Audio.setAmbientSuppressed(screen === "lesson" || screen === "practice");
  }, [screen]);

  const reg = {
    splash: PhSplash, who: PhWho, createProfile: PhCreateProfile, editProfile: PhCreateProfile,
    onboarding: PhOnboarding, placement: PhPlacement, placementResult: PhPlacementResult, coursePath: PhCoursePath,
    home: PhHome, lesson: PhLesson, complete: PhComplete,
    songs: PhSongs, songPreview: PhSongPreview, import: PhImport, practice: PhPractice,
    paywall: PhPaywall, upsell: PhUpsell, manageSub: PhManageSub,
    pair: PhPair, ledSettings: PhLedSettings, settings: PhSettings, profile: PhProfile,
    diploma: PhDiploma,
  };
  const Comp = reg[screen] || (() => <div style={{ padding: 30, fontFamily: "Nunito", fontWeight: 800 }}>Missing: {screen}</div>);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <div key={anim.token} className={`pp-enter-${anim.kind}`} style={{ width: "100%", height: "100%" }}><Comp ctx={ctx} /></div>
      {toastMsg && <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 90, background: "#2B2722", color: "#fff", padding: "10px 20px", borderRadius: 14, fontWeight: 800, fontSize: 14, boxShadow: "0 8px 24px #0004", animation: "pp-toast .3s", maxWidth: 420, textAlign: "center" }}>{toastMsg}</div>}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("ph-root")).render(<PhApp />);

Object.assign(window, { PhSongs, PhSongPreview, PhPractice, PhProfile, PhSettings, PhPaywall, PhUpsell, PhPair, PhLedSettings, PhImport, PhManageSub });
