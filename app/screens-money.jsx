/* ===================================================================
   Piano Professor — Monetization: Paywall · Upsell · Manage Sub
   =================================================================== */
const { useState: useSM, useEffect: useEM } = React;

function ScreenPaywall({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const [plan, setPlan] = useSM("family");
  const [annual, setAnnual] = useSM(true);
  const [pay, setPay] = useSM(ctx.params.state === "error" ? "error" : ctx.params.state === "loading" ? "processing" : "idle");
  const benefits = [
    { i: "library", t: t("pw.bSongs", lang) },
    { i: "heart", t: t("pw.bHearts", lang) },
    { i: "user", t: t("pw.bProfiles", lang) },
    { i: "bluetooth", t: t("pw.bLed", lang) },
    { i: "grad", t: t("pw.bPaths", lang) },
  ];
  const planName = (id) => t("plan." + id, lang);
  const planSub = (id) => t("plan." + id + "Sub", lang);
  const cur = PP_PLANS.find((p) => p.id === plan);
  const price = annual ? cur.monthly : (cur.monthly * 1.6);
  const subscribe = () => {
    setPay("processing");
    setTimeout(() => {
      ctx.setPremium(true); PP_Audio.success(); ctx.toast(t("pw.welcome", lang)); ctx.back();
    }, 1800);
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "var(--cream)", overflow: "hidden", position: "relative" }}>
      {/* processing / error overlays */}
      {pay === "processing" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 70, background: "rgba(20,16,10,.5)", backdropFilter: "blur(5px)", display: "grid", placeItems: "center" }}>
          <div style={{ width: 420, background: "var(--surface)", borderRadius: 26, padding: "36px", boxShadow: "0 24px 60px #0006", textAlign: "center" }}>
            <div style={{ width: 76, height: 76, borderRadius: "50%", border: "8px solid #FBEFC8", borderTopColor: "#F5B800", animation: "pp-spin .9s linear infinite", margin: "0 auto 18px" }} />
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", margin: "0 0 6px" }}>{t("pw.procTitle", lang)}</h2>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-faint)", margin: 0 }}>{t("pw.procSub", lang)}</p>
          </div>
        </div>
      )}
      {pay === "error" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 70, background: "rgba(20,16,10,.5)", backdropFilter: "blur(5px)", display: "grid", placeItems: "center" }}>
          <div style={{ width: 460, background: "var(--surface)", borderRadius: 26, padding: "34px 36px", boxShadow: "0 24px 60px #0006", textAlign: "center", animation: "pp-pop .3s" }}>
            <Maestro mood="sad" size={104} bg="#FBEEE6" ring={5} ringColor="#fff" style={{ margin: "0 auto 8px" }} />
            <h2 style={{ fontSize: 27, fontWeight: 900, color: "var(--ink)", margin: "0 0 8px" }}>{t("pw.errTitle", lang)}</h2>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.4, margin: "0 auto 22px", maxWidth: 360 }}>{t("pw.errSub", lang)}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ChunkyButton variant="sky" size="lg" full onClick={() => setPay("idle")} icon={<Icon name="refresh" size={20} color="#fff" />}>{t("common.tryAgain", lang)}</ChunkyButton>
              <ChunkyButton variant="ghost" size="md" full onClick={() => ctx.back()}>{t("mic.notNow", lang)}</ChunkyButton>
            </div>
          </div>
        </div>
      )}
      {/* LEFT: pitch */}
      <div style={{ width: 420, flexShrink: 0, background: "linear-gradient(170deg,#FFCB2E,#F5B800)", padding: "40px 38px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, bottom: -20, fontSize: 220, opacity: 0.12 }}>👑</div>
        <button onClick={() => ctx.back()} style={{ ...ghostIcon, background: "#ffffff44", border: "none", alignSelf: "flex-start", marginBottom: 24 }}><Icon name="close" size={24} color="#5a3d00" /></button>
        <Maestro mood="trophy" size={120} bg="#ffffff66" ring={5} ringColor="#ffffff88" float style={{ marginBottom: 20 }} />
        <h1 style={{ fontSize: 42, fontWeight: 900, color: "#5a3d00", margin: 0, lineHeight: 1.05 }}>{t("pw.headline", lang).split("\n").map((ln, i) => <React.Fragment key={i}>{i > 0 && <br />}{ln}</React.Fragment>)}</h1>
        <p style={{ fontSize: 18, fontWeight: 800, color: "#7a5600", margin: "12px 0 26px" }}>{t("pw.sub", lang)}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {benefits.map((b) => (
            <div key={b.t} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: "#ffffff66", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={b.i} size={20} color="#5a3d00" /></div>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#5a3d00" }}>{b.t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: plans */}
      <div style={{ flex: 1, padding: "40px 50px", display: "flex", flexDirection: "column", overflow: "auto" }} className="pp-scroll">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{t("pw.choose", lang)}</h2>
          <Segmented options={[{ label: t("pw.annual", lang), value: "y" }, { label: t("pw.monthly", lang), value: "m" }]} value={annual ? "y" : "m"} onChange={(v) => setAnnual(v === "y")} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-faint)", margin: "0 0 22px" }}>{t("pw.trialNote", lang)}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {PP_PLANS.map((pl) => {
            const on = plan === pl.id;
            const m = annual ? pl.monthly : pl.monthly * 1.6;
            return (
              <div key={pl.id} onClick={() => { setPlan(pl.id); PP_Audio.tap(); }} style={{ position: "relative", display: "flex", alignItems: "center", gap: 18, padding: "20px 24px", borderRadius: 22, cursor: "pointer",
                background: on ? "var(--sel-green)" : "var(--surface)", border: `3px solid ${on ? "#58CC02" : "var(--line)"}`, boxShadow: on ? "0 6px 0 #46A302" : "0 4px 0 var(--line)", transition: "all .12s" }}>
                {pl.best && <span style={{ position: "absolute", top: -13, right: 22, background: "#FF7A52", color: "#fff", fontWeight: 900, fontSize: 12, padding: "4px 12px", borderRadius: 999, boxShadow: "0 3px 0 #C2410C", textTransform: "uppercase", letterSpacing: 0.5 }}>{t("pw.best", lang)}</span>}
                <div style={{ fontSize: 44 }}>{pl.icon}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{planName(pl.id)}</h3>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-faint)", margin: "2px 0 0" }}>{planSub(pl.id)}{annual ? " · " + t("pw.billedYearly", lang) : ""}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: on ? "#46A302" : "var(--ink)" }}>${m.toFixed(2)}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-faint)" }}>{t("pw.perMonth", lang)}</div>
                </div>
                <span style={{ width: 30, height: 30, borderRadius: "50%", border: `3px solid ${on ? "#58CC02" : "#D8CDA9"}`, background: on ? "#58CC02" : "transparent", display: "grid", placeItems: "center", flexShrink: 0 }}>{on && <Icon name="check" size={18} color="#fff" />}</span>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <ChunkyButton variant="sky" size="xl" glow full onClick={subscribe}>{t("pw.startTrial", lang)}</ChunkyButton>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-faint)", margin: 0 }}>{t("pw.thenPrice", lang).replace("{price}", "$" + price.toFixed(2)).replace("{plan}", planName(cur.id))}</p>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- UPSELL ----------------------------- */
function ScreenUpsell({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const reason = ctx.params.reason || "hearts";
  const cfg = {
    hearts: { emoji: "💔", mood: "sad", title: t("up.heartsTitle", lang), body: t("up.heartsBody", lang), refill: true },
    locked: { emoji: "🔒", mood: "thinking", title: t("up.lockedTitle", lang), body: t("up.lockedBody", lang), refill: false },
    trial:  { emoji: "⏰", mood: "nervous", title: t("up.trialTitle", lang), body: t("up.trialBody", lang), refill: false },
  }[reason];
  const [secs, setSecs] = useSM(4 * 3600);
  useEM(() => { if (!cfg.refill) return; const iv = setInterval(() => setSecs((x) => Math.max(0, x - 60)), 1000); return () => clearInterval(iv); }, []);
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0"), mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");

  return (
    <div style={{ width: "100%", height: "100%", background: "rgba(20,16,10,.55)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center" }}>
      <div style={{ width: 560, background: "var(--cream)", borderRadius: 30, padding: "40px 44px", boxShadow: "0 30px 80px #0006", textAlign: "center", position: "relative", animation: "pp-pop .35s" }}>
        <button onClick={() => ctx.back()} style={{ ...ghostIcon, position: "absolute", top: 18, right: 18 }}><Icon name="close" size={22} color="var(--ink)" /></button>
        <div style={{ marginBottom: 6 }}><Maestro mood={cfg.mood} size={120} bg="#FFE0E0" ring={5} ringColor="#fff" float style={{ margin: "0 auto" }} /></div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "var(--ink)", margin: "8px 0 10px" }}>{cfg.title}</h1>
        <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.4, margin: "0 auto 22px", maxWidth: 420 }}>{cfg.body}</p>

        {cfg.refill && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 22 }}>
            <span style={{ fontSize: 22 }}>❤️</span>
            <span style={{ fontWeight: 900, fontSize: 22, color: "#C2410C", fontVariantNumeric: "tabular-nums" }}>{t("up.nextHeart", lang)} {hh}:{mm}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ChunkyButton variant="gold" size="lg" glow full onClick={() => ctx.go("paywall")} icon={<Icon name="crown" size={20} color="#5a3d00" />}>{t("up.goPremium", lang)}</ChunkyButton>
          {reason === "hearts" && <ChunkyButton variant="ghost" size="md" full onClick={() => { ctx.updateProfile(ctx.activeId, { hearts: 5 }); ctx.toast(t("up.heartsRefilled", lang)); ctx.go("practice"); }}>{t("up.practiceFree", lang)}</ChunkyButton>}
          {reason !== "hearts" && <ChunkyButton variant="ghost" size="md" full onClick={() => ctx.back()}>{t("up.maybeLater", lang)}</ChunkyButton>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------- MANAGE SUBSCRIPTION -------------------- */
function ScreenManageSub({ ctx }) {
  const lang = (ctx.activeProfile && ctx.activeProfile.lang) || "en";
  const active = ctx.premium;
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--cream)", display: "flex", flexDirection: "column", padding: "26px 60px", overflow: "auto" }} className="pp-scroll">
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <button onClick={() => ctx.back()} style={ghostIcon}><Icon name="chevronLeft" size={26} color="var(--ink)" /></button>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{t("ms.title", lang)}</h1>
      </div>

      <div style={{ maxWidth: 720 }}>
        <div style={{ background: active ? "linear-gradient(150deg,#6FE018,#46A302)" : "var(--surface)", borderRadius: 24, padding: 28, color: active ? "#fff" : "var(--ink)", border: active ? "none" : "2px solid var(--line)", boxShadow: active ? "0 8px 24px #46a30244" : "0 4px 0 var(--line)", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 900, opacity: 0.85, textTransform: "uppercase", letterSpacing: 1 }}>{active ? t("ms.currentPlan", lang) : t("ms.noPlan", lang)}</span>
              <h2 style={{ fontSize: 32, fontWeight: 900, margin: "4px 0" }}>{active ? t("plan.family", lang) + " · " + t("pw.annual", lang).split(" ·")[0] : t("ms.free", lang)}</h2>
              <p style={{ fontSize: 15, fontWeight: 800, opacity: 0.9, margin: 0 }}>{active ? t("ms.renews", lang).replace("{date}", "01.06.2027").replace("{price}", "$26.24") : t("ms.limited", lang)}</p>
            </div>
            <div style={{ fontSize: 56 }}>{active ? "👨‍👩‍👧‍👦" : "🎹"}</div>
          </div>
        </div>

        {active && (
          <div style={{ background: "var(--surface)", borderRadius: 20, padding: 8, border: "2px solid var(--line)", marginBottom: 20 }}>
            {[[t("ms.profilesUsing", lang), "3 / 5"], [t("ms.billing", lang), t("ms.annualNext", lang).replace("{date}", "01.06.2027")], [t("ms.payMethod", lang), "•••• 4242"]].map((r, i) => (
              <div key={r[0]} style={{ display: "flex", justifyContent: "space-between", padding: "16px 18px", borderBottom: i < 2 ? "2px solid var(--line)" : "none" }}>
                <span style={{ fontWeight: 800, color: "var(--ink-soft)", fontSize: 16 }}>{r[0]}</span>
                <span style={{ fontWeight: 900, color: "var(--ink)", fontSize: 16 }}>{r[1]}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 14 }}>
          {active ? (
            <>
              <ChunkyButton variant="sky" size="lg" onClick={() => ctx.go("paywall")}>{t("ms.changePlan", lang)}</ChunkyButton>
              <ChunkyButton variant="ghost" size="lg" onClick={() => { ctx.setPremium(false); ctx.toast(t("ms.cancelled", lang)); }} style={{ color: "#C81E1E" }}>{t("ms.cancel", lang)}</ChunkyButton>
            </>
          ) : (
            <ChunkyButton variant="gold" size="lg" glow onClick={() => ctx.go("paywall")} icon={<Icon name="crown" size={20} color="#5a3d00" />}>{t("ms.seePlans", lang)}</ChunkyButton>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenPaywall, ScreenUpsell, ScreenManageSub });
