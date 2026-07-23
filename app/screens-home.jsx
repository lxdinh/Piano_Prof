/* ===================================================================
   Piano Professor — Home / Learn hub + shared App shell
   =================================================================== */
const { useState: useS3, useRef: useR3, useEffect: useE3 } = React;

/* -------- Left navigation rail (shared) -------- */
function NavRail({ ctx, active }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const items = [
    { id: "home", icon: "home", label: t("nav.learn", lang) },
    { id: "songs", icon: "library", label: t("nav.songs", lang) },
    { id: "practice", icon: "piano", label: t("nav.practice", lang) },
    { id: "profile", icon: "user", label: t("nav.profile", lang) },
  ];
  return (
    <div style={{ width: 92, flexShrink: 0, background: "var(--surface)", borderRight: "2px solid var(--line)", display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 0", gap: 8 }}>
      <div onClick={() => ctx.go("home")} style={{ marginBottom: 12, cursor: "pointer" }}>
        <div style={{ width: 50, height: 50, borderRadius: 15, background: "linear-gradient(150deg,#56B4E8,#1E6E99)", display: "grid", placeItems: "center", boxShadow: "0 4px 0 #1E6E99" }}>
          <Icon name="music" size={26} color="#fff" />
        </div>
      </div>
      {items.map((it) => {
        const on = active === it.id;
        return (
          <button key={it.id} onClick={() => { ctx.go(it.id); PP_Audio.tap(); }} style={{
            width: 72, padding: "10px 0", borderRadius: 16, border: "none", cursor: "pointer",
            background: on ? "var(--nav-active)" : "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            color: on ? "#2E84AD" : "#A99F82", transition: "all .12s",
          }}>
            <Icon name={it.icon} size={26} color={on ? "#2E84AD" : "#B4AA8C"} />
            <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "Nunito, sans-serif", lineHeight: 1.55, paddingTop: 2 }}>{it.label}</span>
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button onClick={() => { ctx.go("pair"); PP_Audio.tap(); }} title="Pair LED" style={{ width: 72, padding: "10px 0", borderRadius: 16, border: "none", cursor: "pointer", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: ctx.led.connected ? "#5BB8E3" : "#B4AA8C" }}>
        <div style={{ position: "relative" }}>
          <Icon name="bluetooth" size={24} color={ctx.led.connected ? "#5BB8E3" : "#B4AA8C"} />
          {ctx.led.connected && <span style={{ position: "absolute", top: -3, right: -5, width: 9, height: 9, borderRadius: "50%", background: "#58CC02", border: "1.5px solid #fff" }} />}
        </div>
        <span style={{ fontSize: 11, fontWeight: 800 }}>LED</span>
      </button>
      <button onClick={() => { ctx.go("settings"); PP_Audio.tap(); }} style={{ width: 72, padding: "10px 0", borderRadius: 16, border: "none", cursor: "pointer", background: active === "settings" ? "var(--nav-active)" : "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: "var(--ink-faint)" }}>
        <Icon name="gear" size={24} color="#B4AA8C" />
        <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "Nunito, sans-serif", lineHeight: 1.55, paddingTop: 2 }}>{t("nav.settings", lang)}</span>
      </button>
    </div>
  );
}

/* -------- Top HUD header (shared) -------- */
function AppHeader({ ctx, title, sub }) {
  const p = ctx.activeProfile;
  if (!p) return null;
  const lang = p.lang || "en";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 30px 6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Maestro mood={p.avatar} size={52} bg="var(--cream)" ring={3} ringColor="#5BB8E3" onClick={() => ctx.go("who")} style={{ cursor: "pointer" }} />
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", margin: 0, lineHeight: 1 }}>{title || `${t("home.hi", lang)} ${p.name}!`}</h1>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-faint)", margin: "3px 0 0" }}>{sub || t("home.ready", lang)}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <StatChip kind="streak" value={p.streak} />
        <StatChip kind="xp" value={p.xp >= 1000 ? (p.xp / 1000).toFixed(1) + "k" : p.xp} />
        <StatChip kind="gems" value={p.gems} />
        <StatChip kind="hearts" value={p.hearts} onClick={() => p.hearts < 5 && ctx.go("upsell", { reason: "hearts" })} />
        {!ctx.premium && (
          <button onClick={() => ctx.go("paywall")} style={{ marginLeft: 6, display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer", background: "linear-gradient(180deg,#FFCB2E,#F5B800)", boxShadow: "0 3px 0 #C28A00", fontFamily: "Nunito", fontWeight: 900, fontSize: 15, color: "#5a3d00" }}>
            <Icon name="crown" size={18} color="#5a3d00" /> PREMIUM
          </button>
        )}
      </div>
    </div>
  );
}

function AppShell({ ctx, active, children }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "var(--cream)", overflow: "hidden" }}>
      <NavRail ctx={ctx} active={active} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>{children}</div>
    </div>
  );
}

/* -------- Poster card -------- */
const KIND_ICON = { lesson: "grad", song: "music", concept: "book", exercise: "bolt2" };
function PosterCard({ item, color, deep, ctx }) {
  const [shake, setShake] = useS3(false);
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const loc = tItem(item, lang);
  const locked = item.state === "locked";
  const soon = item.state === "soon";
  const done = item.state === "done";
  const activeUnit = item.state === "active";
  const click = () => {
    if (soon) { ctx.toast(t("card.soon", lang)); return; }
    if (locked) {
      if (item.premium && !ctx.premium) { ctx.go("paywall"); return; }
      setShake(true); setTimeout(() => setShake(false), 400); PP_Audio.wrong();
      ctx.toast(t("card.locked", lang));
      return;
    }
    PP_Audio.correct();
    ctx.go("lesson", { item });
  };
  return (
    <div onClick={click} style={{
      width: 212, flexShrink: 0, cursor: "pointer", animation: shake ? "pp-jiggle .4s" : "none",
      borderRadius: 22, background: "var(--surface)", border: `2px solid ${activeUnit ? color : "var(--line)"}`,
      boxShadow: activeUnit ? `0 6px 0 ${deep}, 0 12px 26px ${color}33` : "0 4px 0 var(--line)",
      overflow: "hidden", transition: "transform .12s", position: "relative",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}>
      {/* art */}
      <div style={{ height: 116, position: "relative", background: locked || soon ? "var(--surface-2)" : `linear-gradient(150deg, ${color}, ${deep})`, display: "grid", placeItems: "center" }}>
        {!locked && !soon && <Icon name={KIND_ICON[item.kind]} size={44} color="#ffffffcc" />}
        {(locked || soon) && (
          <div style={{ display: "grid", placeItems: "center", gap: 4 }}>
            <Icon name={soon ? "refresh" : "lock"} size={36} color="#B4AA8C" />
            {item.premium && !ctx.premium && <span style={{ fontSize: 11, fontWeight: 900, color: "#C28A00", background: "#FFF1C9", padding: "2px 9px", borderRadius: 999 }}>PREMIUM</span>}
          </div>
        )}
        {done && <div style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: "50%", background: "var(--surface)", display: "grid", placeItems: "center", boxShadow: "0 2px 5px #0003" }}><Icon name="check" size={18} color="#58CC02" /></div>}
        <span style={{ position: "absolute", top: 10, left: 10, fontSize: 11, fontWeight: 900, color: locked || soon ? "#9A8F6F" : "#ffffffdd", textTransform: "uppercase", letterSpacing: 0.6 }}>{t("kind." + item.kind, lang)}</span>
      </div>
      {/* body */}
      <div style={{ padding: "12px 14px 14px" }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, color: locked || soon ? "#9A8F6F" : "var(--ink)", margin: 0, lineHeight: 1.1 }}>{loc.title}</h3>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-faint)", margin: "4px 0 0" }}>{loc.sub}</p>
        {done && (
          <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
            {[0, 1, 2].map((i) => <Icon key={i} name="star" size={18} color={i < item.stars ? "#F5B800" : "#E4DCC0"} />)}
          </div>
        )}
        {activeUnit && (
          <div style={{ marginTop: 10 }}>
            <ProgressBar value={item.progress} color={color} height={10} />
            <span style={{ fontSize: 12, fontWeight: 800, color, marginTop: 4, display: "block" }}>{item.progress}% · {t("card.continue", lang)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Shelf({ shelf, ctx }) {
  const ref = useR3(null);
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const shelfTitle = tLevel(shelf.levelId, lang) + " · " + t("grade", lang) + " " + (shelf.title.match(/\d+/) || [""])[0];
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, background: shelf.color }} />
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{shelfTitle}</h2>
        </div>
        <button onClick={() => ref.current && ref.current.scrollBy({ left: 480, behavior: "smooth" })} style={{ ...ghostIcon, width: 40, height: 40 }}><Icon name="chevronRight" size={22} color="var(--ink)" /></button>
      </div>
      <div ref={ref} className="pp-scroll" style={{ display: "flex", gap: 16, overflowX: "auto", padding: "4px 30px 12px", scrollbarWidth: "none" }}>
        {shelf.items.map((it) => <PosterCard key={it.id} item={it} color={shelf.color} deep={shelf.deep} ctx={ctx} />)}
      </div>
    </div>
  );
}

/* ----------------------------- HOME ------------------------------- */
function HomeSkeleton() {
  return (
    <div style={{ flex: 1, overflow: "hidden", paddingBottom: 24 }}>
      <div style={{ padding: "10px 30px 22px" }}>
        <Shimmer w="100%" h={170} r={28} />
      </div>
      {[0, 1].map((s) => (
        <div key={s} style={{ marginBottom: 26 }}>
          <div style={{ padding: "0 30px 12px" }}><Shimmer w={220} h={22} r={8} /></div>
          <div style={{ display: "flex", gap: 16, padding: "4px 30px" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ width: 212, flexShrink: 0 }}>
                <Shimmer w="100%" h={116} r={22} />
                <Shimmer w="80%" h={16} r={6} style={{ marginTop: 12 }} />
                <Shimmer w="55%" h={13} r={6} style={{ marginTop: 8 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeEmpty({ ctx, lvl }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40 }}>
      <Maestro mood="welcome-piano" size={150} bg="#EAF8DC" ring={6} ringColor="#fff" float style={{ marginBottom: 18, boxShadow: "0 12px 30px #0002" }} />
      <h1 style={{ fontSize: 38, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Welcome — let's play your first note!</h1>
      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-soft)", maxWidth: 480, margin: "10px 0 26px", lineHeight: 1.4 }}>
        You're placed in {lvl.name}. Your learning path is ready — your very first lesson takes about 3 minutes.
      </p>
      <div style={{ display: "flex", gap: 14 }}>
        {!ctx.led.connected && <ChunkyButton variant="sky" size="lg" onClick={() => ctx.go("pair")} icon={<Icon name="bluetooth" size={20} color="#fff" />}>Pair LED strip</ChunkyButton>}
        <ChunkyButton variant="sky" size="lg" glow onClick={() => { PP_Audio.correct(); ctx.go("lesson", { item: { title: "Your First Notes", kind: "lesson" } }); }} icon={<Icon name="play" size={20} color="#fff" />}>Start Lesson 1</ChunkyButton>
      </div>
    </div>
  );
}

function ScreenHome({ ctx }) {
  const p = ctx.activeProfile;
  const lang = p.lang || "en";
  const lvl = PP_LEVELS.find((l) => l.id === p.levelId) || PP_LEVELS[1];
  const [state, setState] = useS3(ctx.params.state || "ready");

  // auto-resolve a loading state into ready
  useE3(() => {
    if (state === "loading") { const t = setTimeout(() => setState("ready"), 1600); return () => clearTimeout(t); }
  }, [state]);

  return (
    <AppShell ctx={ctx} active="home">
      <AppHeader ctx={ctx} />
      {state === "loading" && <HomeSkeleton />}
      {state === "empty" && <HomeEmpty ctx={ctx} lvl={lvl} />}
      {state === "error" && (
        <StateScaffold
          mood="confused" moodBg="#FBEEE6"
          title="We couldn't load your lessons"
          body="Check your connection and try again — your progress is safe in the cloud."
          primary={<ChunkyButton variant="sky" size="lg" onClick={() => setState("loading")} icon={<Icon name="refresh" size={20} color="#fff" />}>Try again</ChunkyButton>}
          secondary={<ChunkyButton variant="ghost" size="lg" onClick={() => ctx.go("practice")}>Practice offline</ChunkyButton>}
        />
      )}
      {state === "ready" && (
      <div className="pp-scroll" style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }}>
        {/* Continue hero */}
        <div style={{ padding: "10px 30px 22px" }}>
          <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", background: `linear-gradient(120deg, ${lvl.color}, ${lvl.deep})`, padding: "26px 30px", boxShadow: `0 10px 30px ${lvl.color}44` }}>
            <div style={{ position: "absolute", right: -10, top: -20, fontSize: 200, opacity: 0.12 }}>🎹</div>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#ffffffcc", letterSpacing: 1, textTransform: "uppercase" }}>{t("home.continueLearning", lang)} · {p.path === "soloist" ? "Soloist" : "Chords"}</span>
                <h2 style={{ fontSize: 38, fontWeight: 900, color: "#fff", margin: "6px 0 4px", textShadow: "0 2px 0 #00000022" }}>{tUnit(p.lastUnit, lang) || "Pop Chords I"}</h2>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#ffffffdd", margin: "0 0 16px" }}>{tLevel(lvl.id, lang)} · {t("grade", lang)} {p.grade} · {t("home.lessonOf", lang)}</p>
                <div style={{ maxWidth: 360, marginBottom: 18 }}><ProgressBar value={60} color="#fff" track="#ffffff33" height={14} /></div>
                <ChunkyButton variant="white" size="lg" onClick={() => { PP_Audio.correct(); ctx.go("lesson", { item: { title: p.lastUnit || "Pop Chords I", kind: "lesson" } }); }} icon={<Icon name="play" size={20} color="#2E84AD" />}>{t("home.continue", lang)}</ChunkyButton>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <Maestro mood="cool" size={120} bg="#ffffff22" ring={4} ringColor="#ffffff55" float />
                <div style={{ background: "#ffffff22", borderRadius: 14, padding: "6px 14px", display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ fontSize: 17 }}>🎯</span>
                  <span style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{t("home.dailyGoal", lang)} · 30/50 XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Shelves */}
        {PP_SHELVES.map((sh) => <Shelf key={sh.levelId} shelf={sh} ctx={ctx} />)}
        <div style={{ height: 10 }} />
      </div>
      )}
    </AppShell>
  );
}

Object.assign(window, { NavRail, AppHeader, AppShell, PosterCard, Shelf, ScreenHome });
