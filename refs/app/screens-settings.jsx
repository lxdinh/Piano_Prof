/* ===================================================================
   Piano Professor — Settings + Profile/Stats
   =================================================================== */
const { useState: useSP, useEffect: useEP } = React;

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => { onChange(!on); PP_Audio.tap(); }} style={{ width: 56, height: 32, borderRadius: 999, border: "none", cursor: "pointer", background: on ? "#58CC02" : "#D8CDA9", position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: on ? 27 : 3, width: 26, height: 26, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 2px 4px #0003", transition: "left .2s" }} />
    </button>
  );
}

function ScreenSettings({ ctx }) {
  const p = ctx.activeProfile;
  const [voice, setVoice] = useSP(true);
  const [reminders, setReminders] = useSP(true);
  const [goal, setGoal] = useSP(50);
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const goals = [{ v: 20, k: "casual", s: "5 min" }, { v: 50, k: "regular", s: "10 min" }, { v: 100, k: "serious", s: "20 min" }, { v: 150, k: "intense", s: "30 min" }];
  const [micOpen, setMicOpen] = useSP(false);
  const [micAllowed, setMicAllowed] = useSP(true);

  const Row = ({ icon, color, title, sub, children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", borderBottom: "2px solid var(--line)" }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: color + "22", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={icon} size={22} color={color} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 17, color: "var(--ink)" }}>{title}</div>
        {sub && <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-faint)" }}>{sub}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <AppShell ctx={ctx} active="settings">
      <AppHeader ctx={ctx} title={t("settings.title", lang)} sub={t("settings.tune", lang)} />
      <div className="pp-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 40px 30px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 1040 }}>
          {/* left column */}
          <div>
            <h3 style={sectionH}>{t("settings.language", lang)}</h3>
            <div style={{ marginBottom: 24, maxWidth: 300 }}><LangDropdown value={lang} onChange={(v) => ctx.updateProfile(ctx.activeId, { lang: v })} /></div>

            <h3 style={sectionH}>{t("settings.dailyGoal", lang)}</h3>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {goals.map((g) => {
                const on = goal === g.v;
                return (
                  <button key={g.v} onClick={() => { setGoal(g.v); PP_Audio.tap(); }} style={{ flex: 1, padding: "14px 0", borderRadius: 16, cursor: "pointer", border: `3px solid ${on ? "#F5B800" : "var(--line)"}`, background: on ? "var(--sel-gold)" : "var(--surface)", boxShadow: on ? "0 4px 0 #C28A00" : "0 4px 0 var(--line)", fontFamily: "Nunito" }}>
                    <div style={{ fontWeight: 900, fontSize: 17, color: "var(--ink)" }}>{t("goal." + g.k, lang)}</div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "var(--ink-faint)" }}>{g.s} · {g.v} XP</div>
                  </button>
                );
              })}
            </div>

            <h3 style={sectionH}>{t("settings.lessonSound", lang)}</h3>
            <Card pad={0} style={{ marginBottom: 24 }}>
              <Row icon="sound" color="#58CC02" title={t("settings.voice", lang)} sub={t("settings.langSub", lang)}><Toggle on={voice} onChange={setVoice} /></Row>
              <Row icon="bell" color="#FF7A52" title={t("settings.reminders", lang)} sub="6:00 PM"><Toggle on={reminders} onChange={setReminders} /></Row>
              <Row icon="music" color="#5BB8E3" title={t("settings.bgMusic", lang)} sub=""><Toggle on={ctx.ambient} onChange={(v) => ctx.setAmbient(v)} /></Row>
            </Card>

            <h3 style={sectionH}>{t("settings.appearance", lang)}</h3>
            <Card pad={0} style={{ marginBottom: 24 }}>
              <Row icon="moon" color="#7C6BFF" title={t("settings.darkMode", lang)} sub={t("settings.darkModeSub", lang)}><Toggle on={ctx.theme === "dark"} onChange={(v) => ctx.setTheme(v ? "dark" : "light")} /></Row>
            </Card>
          </div>

          {/* right column */}
          <div>
            <h3 style={sectionH}>{t("settings.hardware", lang)}</h3>
            <Card pad={0} style={{ marginBottom: 24 }}>
              <div onClick={() => ctx.go("pair")} style={{ cursor: "pointer" }}><Row icon="bluetooth" color="#5BB8E3" title={t("set.ledStrip", lang)} sub={ctx.led.connected ? t("set.connected", lang) + " · PP-Strip" : t("set.notConnected", lang)}><Icon name="chevronRight" size={22} color="#C0B79A" /></Row></div>
              <div onClick={() => ctx.go("ledSettings")} style={{ cursor: "pointer" }}><Row icon="sliders" color="#9b6bff" title={t("set.ledThemes", lang)} sub={(ctx.led.theme || "rainbow") + " · " + ctx.led.brightness + "%"}><Icon name="chevronRight" size={22} color="#C0B79A" /></Row></div>
              <div onClick={() => ctx.go("calibration")} style={{ cursor: "pointer" }}><Row icon="target" color="#58CC02" title={t("set.recalibrate", lang)} sub={t("set.recalibrateSub", lang)}><Icon name="chevronRight" size={22} color="#C0B79A" /></Row></div>
            </Card>

            <h3 style={sectionH}>{t("settings.account", lang)}</h3>
            <Card pad={0}>
              <div onClick={() => ctx.go("manageSub")} style={{ cursor: "pointer" }}><Row icon="crown" color="#F5B800" title={t("settings.subscription", lang)} sub={ctx.premium ? t("set.familyAnnual", lang) : t("set.free", lang)}><Icon name="chevronRight" size={22} color="#C0B79A" /></Row></div>
              <div onClick={() => ctx.go("who")} style={{ cursor: "pointer" }}><Row icon="swap" color="#5BB8E3" title={t("settings.switchProfile", lang)} sub={t("set.playingAs", lang) + " " + (p ? p.name : "")}><Icon name="chevronRight" size={22} color="#C0B79A" /></Row></div>
              <div onClick={() => ctx.toast("Cloud sync is on.")} style={{ cursor: "pointer" }}><Row icon="wifi" color="#58CC02" title={t("set.cloudSync", lang)} sub={t("set.cloudSub", lang)}><span style={{ fontWeight: 900, color: "#58CC02", fontSize: 14 }}>ON</span></Row></div>
            </Card>

            <h3 style={sectionH}>{t("settings.privacy", lang)}</h3>
            <Card pad={0}>
              <div onClick={() => { setMicOpen(true); PP_Audio.tap(); }} style={{ cursor: "pointer" }}><Row icon="mic" color="#58CC02" title={t("settings.microphone", lang)} sub={micAllowed ? t("settings.micAllowed", lang) : t("settings.micOff", lang)}><span style={{ fontWeight: 900, color: micAllowed ? "#58CC02" : "var(--ink-faint)", fontSize: 14 }}>{micAllowed ? "ON" : "OFF"}</span></Row></div>
            </Card>
          </div>
        </div>
      </div>
      {micOpen && <MicSheet
        lang={lang}
        primaryLabel={micAllowed ? t("mic.keep", lang) : t("mic.allow", lang)}
        secondaryLabel={micAllowed ? t("mic.turnOff", lang) : t("mic.notNow", lang)}
        onAllow={() => { setMicAllowed(true); setMicOpen(false); PP_Audio.success(); ctx.toast(t("settings.micAllowed", lang)); }}
        onClose={() => { if (micAllowed) { setMicAllowed(false); ctx.toast(t("settings.micOff", lang)); } setMicOpen(false); }}
      />}
    </AppShell>
  );
}
const sectionH = { fontSize: 15, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 1, margin: "26px 0 12px 2px" };

/* ----------------------------- PROFILE ---------------------------- */
const ACHIEVEMENTS = [
  { e: "🔥", t: "7-Day Streak", k: "ach.streak7", lv: 3, on: true }, { e: "🎵", t: "First Song", k: "ach.firstSong", lv: 1, on: true },
  { e: "🎯", t: "Perfect Lesson", k: "ach.perfect", lv: 2, on: true }, { e: "⚡", t: "1000 XP", k: "ach.xp1000", lv: 2, on: true },
  { e: "🎹", t: "Chord Master", k: "ach.chordMaster", lv: 1, on: false }, { e: "🏆", t: "Grade Graduate", k: "ach.graduate", lv: 0, on: false },
];
function ScreenProfile({ ctx }) {
  const p = ctx.activeProfile;
  if (!p) return null;
  const lang = p.lang || "en";
  const lvl = PP_LEVELS.find((l) => l.id === p.levelId) || PP_LEVELS[1];
  const weekly = [25, 60, 40, 80, 50, 100, 30];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <AppShell ctx={ctx} active="profile">
      <AppHeader ctx={ctx} title={t("profile.title", lang)} sub="" />
      <div className="pp-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 40px 30px" }}>
        {/* identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 24 }}>
          <Maestro mood={p.avatar} size={110} bg="var(--cream)" ring={5} ringColor="#5BB8E3" />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 34, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{p.name}</h1>
            <p style={{ fontSize: 17, fontWeight: 800, color: lvl.color, margin: "2px 0 0" }}>{tLevel(lvl.id, lang)} · {t("grade", lang)} {p.grade} · {p.path === "soloist" ? t("pf.path.soloist", lang) : t("pf.path.chords", lang)}</p>
          </div>
          <ChunkyButton variant="ghost" size="md" onClick={() => ctx.go("editProfile", { editId: p.id })} icon={<Icon name="pencil" size={18} color="var(--ink)" />}>{t("profile.edit", lang)}</ChunkyButton>
          <ChunkyButton variant="sky" size="md" onClick={() => ctx.go("who")} icon={<Icon name="swap" size={18} color="#fff" />}>{t("profile.switch", lang)}</ChunkyButton>
        </div>

        {/* stat tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {[{ e: "🔥", v: p.streak, l: t("pf.dayStreak", lang), c: "#FF7A52" }, { e: "⚡", v: p.xp.toLocaleString(), l: t("pf.totalXp", lang), c: "#F5B800" }, { e: "💎", v: p.gems, l: t("pf.gems", lang), c: "#5BB8E3" }, { e: "🎵", v: 14, l: t("pf.songsLearned", lang), c: "#58CC02" }].map((s) => (
            <Card key={s.l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32 }}>{s.e}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: s.c, margin: "2px 0" }}>{s.v}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
            </Card>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          {/* weekly chart */}
          <Card>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", margin: "0 0 4px" }}>{t("profile.thisWeek", lang)}</h3>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-faint)", margin: "0 0 18px" }}>{t("pf.weekXp", lang)}</p>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 130, gap: 10 }}>
              {weekly.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: "100%", height: v + "%", background: v >= 50 ? "linear-gradient(180deg,#6FE018,#46A302)" : "#E4DCC0", borderRadius: 8, minHeight: 8, transition: "height .5s" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-faint)" }}>{days[i]}</span>
                </div>
              ))}
            </div>
          </Card>
          {/* achievements */}
          <Card>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", margin: "0 0 14px" }}>{t("profile.achievements", lang)}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {ACHIEVEMENTS.map((a) => (
                <div key={a.t} style={{ textAlign: "center", opacity: a.on ? 1 : 0.4 }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", margin: "0 auto 6px", display: "grid", placeItems: "center", fontSize: 28, background: a.on ? "linear-gradient(150deg,#FFE38A,#F5B800)" : "var(--line)", boxShadow: a.on ? "0 4px 0 #C28A00" : "none", position: "relative" }}>
                    {a.on ? a.e : <Icon name="lock" size={22} color="#A99F82" />}
                    {a.on && a.lv > 0 && <span style={{ position: "absolute", bottom: -4, right: -2, background: "var(--surface)", borderRadius: 999, padding: "1px 7px", fontSize: 12, fontWeight: 900, color: "#C28A00", boxShadow: "0 1px 3px #0003" }}>{a.lv}</span>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", lineHeight: 1.1, display: "block" }}>{t(a.k, lang)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

Object.assign(window, { ScreenSettings, ScreenProfile, Toggle });
