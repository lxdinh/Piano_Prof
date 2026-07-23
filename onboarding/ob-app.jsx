/* ===================================================================
   Piano Professor — Onboarding spine
   Sequences every step, holds the collected profile, renders the
   7-day trial + finish, and wires the review step-launcher.
   (Production gates this per profile via Firebase; here it's in-memory.)
   =================================================================== */
const { useState: useA, useEffect: useAE } = React;

const OB_SEQUENCE = [
  "welcome", "profile", "why", "goalmix", "sing", "piano",
  "hardware", "taste", "placement", "placementResult", "trial", "done",
];
const OB_TOTAL = 7; // steps shown in the progress bar (profile … taste)

/* ----------------------------- TRIAL ------------------------------ */
/* Asked right after setup, before they explore. Clear, trustworthy
   payment copy (no jokes here) — store billing handles it in production. */
function OBTrial({ ob }) {
  const [plan, setPlan] = useA("family");
  const [annual, setAnnual] = useA(true);
  const [pay, setPay] = useA("idle"); // idle | processing
  const cur = PP_PLANS.find((p) => p.id === plan);
  const price = annual ? cur.monthly : cur.monthly * 1.6;
  const benefits = [
    ["library", "Every song & lesson you picked, unlocked"],
    ["heart", "Unlimited hearts — practice as much as you want"],
    ["user", "Up to 5 family profiles, each with its own level"],
    ["bolt2", "LED Maestro key-lighting & live feedback"],
  ];
  const start = () => { setPay("processing"); setTimeout(() => { ob.set({ premium: true, plan }); ob.next(); }, 1700); };

  if (pay === "processing") {
    return (
      <OBShell>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", border: "5px solid var(--line)", borderTopColor: "#58CC02", animation: "pp-spin 0.9s linear infinite" }} />
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Starting your free trial…</h2>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-faint)", margin: 0 }}>Securely confirming with the App Store.</p>
        </div>
      </OBShell>
    );
  }
  return (
    <OBShell onBack={ob.back}>
      <div className="pp-scroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", paddingRight: 6 }}>
        <Maestro mood="cool" size={104} bg="#FFE38A" float style={{ marginBottom: 8 }} />
        <OBTitle sub="Unlock everything for 7 days, free. We'll remind you 2 days before it ends — cancel anytime.">Try Piano Professor free</OBTitle>

        {/* benefits */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: 700, maxWidth: "100%", marginBottom: 22 }}>
          {benefits.map((b) => (
            <div key={b[0]} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "2px solid var(--line)", borderRadius: 14, padding: "13px 16px" }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--sel-green)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={b[0]} size={19} color="#46A302" /></span>
              <span style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>{b[1]}</span>
            </div>
          ))}
        </div>

        {/* annual / monthly */}
        <div style={{ marginBottom: 14 }}>
          <Segmented options={[{ label: "Annual · save 37%", value: "y" }, { label: "Monthly", value: "m" }]} value={annual ? "y" : "m"} onChange={(v) => setAnnual(v === "y")} />
        </div>

        {/* plans */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 700, maxWidth: "100%" }}>
          {PP_PLANS.map((pl) => {
            const on = plan === pl.id; const m = annual ? pl.monthly : pl.monthly * 1.6;
            return (
              <button key={pl.id} onClick={() => { setPlan(pl.id); PP_Audio.tap(); }} style={{
                position: "relative", display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderRadius: 18, cursor: "pointer", fontFamily: "Nunito", textAlign: "left",
                border: `3px solid ${on ? "#58CC02" : "var(--line)"}`, background: on ? "var(--sel-green)" : "var(--surface)", boxShadow: on ? "0 5px 0 #3D8E00" : "0 4px 0 var(--line)", transition: "all .12s",
              }}>
                {pl.best && <span style={{ position: "absolute", top: -13, right: 22, background: "#FF7A52", color: "#fff", fontWeight: 900, fontSize: 12, padding: "4px 12px", borderRadius: 999, boxShadow: "0 3px 0 #C2410C", textTransform: "uppercase", letterSpacing: .5 }}>Best value</span>}
                <span style={{ fontSize: 40 }}>{pl.icon}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 22, fontWeight: 900, color: "var(--ink)" }}>{pl.name}</span>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "var(--ink-faint)" }}>{pl.blurb}{annual ? " · billed yearly" : ""}</span>
                </span>
                <span style={{ textAlign: "right" }}>
                  <span style={{ display: "block", fontSize: 26, fontWeight: 900, color: on ? "#46A302" : "var(--ink)" }}>${m.toFixed(2)}</span>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: "var(--ink-faint)" }}>per month</span>
                </span>
                <span style={{ width: 26, height: 26, borderRadius: "50%", border: `3px solid ${on ? "#58CC02" : "#D8CDA9"}`, background: on ? "#58CC02" : "transparent", display: "grid", placeItems: "center", flexShrink: 0 }}>{on && <Icon name="check" size={15} color="#fff" />}</span>
              </button>
            );
          })}
        </div>

        {/* mock payment row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, background: "var(--surface-2)", borderRadius: 14, padding: "12px 18px", width: 700, maxWidth: "100%" }}>
          <Icon name="shield" size={18} color="#58CC02" />
          <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink-soft)" }}>You won't be charged today · Card on file via App Store · Cancel in 2 taps</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 14 }}>
        <ChunkyButton variant="sky" size="xl" glow full onClick={start} style={{ maxWidth: 560 }}>Start my 7-day free trial</ChunkyButton>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-faint)" }}>Then ${price.toFixed(2)}/mo · {cur.name}.</span>
          <button onClick={ob.next} style={{ background: "none", border: "none", fontFamily: "Nunito", fontWeight: 800, fontSize: 13.5, color: "var(--ink-faint)", cursor: "pointer", textDecoration: "underline" }}>Maybe later</button>
        </div>
      </div>
    </OBShell>
  );
}

/* ------------------------------ DONE ------------------------------ */
function OBDone({ ob }) {
  const d = ob.data;
  const lvl = PP_LEVELS.find((l) => l.id === d.levelId) || PP_LEVELS[1];
  const ledLabel = d.led === true ? "LED ready" : d.led === "ordered" ? "LED on the way" : "No LED yet";
  const recap = [
    ["grad", lvl.name + " · Grade " + lvl.grade],
    ["music", (d.songs || []).length + " dream songs"],
    ["target", (d.goalMix >= 70 ? "Pop-focused" : d.goalMix <= 30 ? "Classical-focused" : "Pop + classical")],
    ["bolt2", ledLabel],
  ];
  useAE(() => { try { if (d.name) localStorage.setItem("pp-onboarded-" + d.name, "1"); } catch (e) {} }, []);
  return (
    <OBShell scene>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", textAlign: "center" }}>
        <Confetti run count={150} />
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Maestro mood={d.avatar || "cheer"} size={170} bg={d.avatarBg || "#FFE38A"} ring={7} ringColor="var(--surface)" float />
          <div style={{ position: "absolute", top: -6, right: -10, animation: "pp-bob 2.2s infinite" }}><span style={{ fontSize: 44 }}>🎉</span></div>
        </div>
        <h1 style={{ fontSize: 50, fontWeight: 900, color: "var(--ink)", margin: 0, lineHeight: 1.05 }}>You're all set{d.name ? ", " + d.name : ""}!</h1>
        <p style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-soft)", margin: "12px 0 26px", maxWidth: 600 }}>{d.premium ? "Your free trial is live." : "Your free plan is ready."} Let's play your first song.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 30, maxWidth: 720 }}>
          {recap.map((r) => (
            <div key={r[0]} style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "var(--surface)", border: "2px solid var(--line)", borderRadius: 999, padding: "9px 16px" }}>
              <Icon name={r[0]} size={18} color="#46A302" /><span style={{ fontSize: 15.5, fontWeight: 900, color: "var(--ink)" }}>{r[1]}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <a href="Piano Professor.html" style={{ textDecoration: "none" }}><ChunkyButton variant="sky" size="xl" glow icon={<Icon name="play" size={22} color="#fff" />}>Start playing</ChunkyButton></a>
        </div>
        <button onClick={() => ob.go("welcome")} style={{ marginTop: 18, background: "none", border: "none", fontFamily: "Nunito", fontWeight: 800, fontSize: 15, color: "var(--ink-faint)", cursor: "pointer", textDecoration: "underline" }}>
          + Set up another family member
        </button>
      </div>
    </OBShell>
  );
}

/* ----------------------------- ROUTER ----------------------------- */
const OB_SCREENS = {
  welcome: OBWelcome, profile: OBProfile, why: OBWhy,
  goalmix: OBGoalMix, sing: OBSing, piano: OBPiano, hardware: OBHardware,
  taste: OBTaste, placement: OBPlacement, placementResult: OBPlacementResult,
  trial: OBTrial, done: OBDone,
};

function OBApp() {
  const [key, setKey] = useA("welcome");
  const [data, setData] = useA({});
  const [dir, setDir] = useA("fwd");

  const idxOf = (k) => OB_SEQUENCE.indexOf(k);
  const goKey = (k, d = "fwd") => { setDir(d); setKey(k); PP_Audio.kickAmbient && PP_Audio.kickAmbient(); const el = document.getElementById("pp-root"); if (el) el.scrollTop = 0; };
  const ob = {
    data, total: OB_TOTAL,
    set: (obj) => setData((d) => ({ ...d, ...obj })),
    next: () => { const i = idxOf(key); if (i < OB_SEQUENCE.length - 1) goKey(OB_SEQUENCE[i + 1], "fwd"); },
    back: () => { const i = idxOf(key); if (i > 0) goKey(OB_SEQUENCE[i - 1], "back"); },
    go: (k) => goKey(k, "fwd"),
  };
  useAE(() => { window.OBGo = (k) => goKey(k); window.OBData = data; }, [data, key]);

  const Screen = OB_SCREENS[key] || OBWelcome;
  return (
    <div key={key} className={dir === "back" ? "pp-enter-back" : "pp-enter-fwd"} style={{ width: "100%", height: "100%" }}>
      <Screen ob={ob} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("pp-root")).render(<OBApp />);

/* ------------------------- step launcher (review) ----------------- */
(function () {
  var STEPS = [
    ["Flow", [
      ["1 · Welcome", "welcome"], ["2 · Create profile", "profile"],
      ["3 · Why piano", "why"], ["4 · Goal mix", "goalmix"], ["5 · Sing?", "sing"], ["6 · Piano type", "piano"],
      ["7 · LED Maestro", "hardware"], ["8 · Taste profiler", "taste"],
    ]],
    ["Placement", [["10 · Placement test", "placement"], ["11 · Result", "placementResult"]]],
    ["Finish", [["12 · 7-day trial", "trial"], ["13 · All set!", "done"]]],
  ];
  var btn = document.getElementById("pp-launch-btn");
  var panel = document.getElementById("pp-launch-panel");
  STEPS.forEach(function (grp) {
    var h = document.createElement("div"); h.className = "pp-lg"; h.textContent = grp[0]; panel.appendChild(h);
    grp[1].forEach(function (it) {
      var b = document.createElement("button"); b.className = "pp-li"; b.textContent = it[0];
      b.onclick = function () { if (window.OBGo) window.OBGo(it[1]); panel.classList.remove("open"); };
      panel.appendChild(b);
    });
  });
  btn.onclick = function () { panel.classList.toggle("open"); };
  document.addEventListener("click", function (e) { if (!document.getElementById("pp-launch").contains(e.target)) panel.classList.remove("open"); });
})();
