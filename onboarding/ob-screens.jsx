/* ===================================================================
   Piano Professor — Onboarding screens (part 1)
   Welcome · Create profile · AI ice-breaker · Why · Goal mix ·
   Sing · Piano type · LED Maestro hardware · Taste profiler
   =================================================================== */
const { useState: useS, useEffect: useSE, useRef: useSR } = React;

/* Every key glowing — a rainbow demo of the LED Maestro strip (C4→C5). */
const OB_LED_RAINBOW = (() => {
  const cols = ["#FF4B4B", "#FF7A52", "#F5B800", "#9ACD32", "#58CC02", "#2BBF8A", "#5BB8E3", "#4A90E2", "#7C6BFF", "#9b6bff", "#C264D6", "#FF5FA2", "#FF4B4B"];
  const m = {};
  for (let n = 60; n <= 72; n++) m[n] = cols[n - 60];
  return m;
})();

/* ------------------------------ WELCOME --------------------------- */
function OBWelcome({ ob }) {
  useS && useSE(() => { OBVoice.say("Hi! I'm Maestro. Let's set up your piano journey.", "en"); }, []);
  return (
    <OBShell scene>
      <div style={{ position: "absolute", top: 22, right: 24, zIndex: 3 }}><VoiceToggle /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ position: "relative", marginBottom: 18 }}>
          <Maestro mood="conduct" size={210} bg="#D7F5C2" ring={8} ringColor="var(--surface)" float />
          <div style={{ position: "absolute", top: 6, right: -14, animation: "pp-bob 2.4s infinite" }}>
            <span style={{ fontSize: 40 }}>👋</span>
          </div>
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 900, color: "var(--ink)", margin: 0, lineHeight: 1.12, maxWidth: 860 }}>
          Hi! I'm Maestro.<br />Let's set up your piano journey.
        </h1>
        <p style={{ fontSize: 21, fontWeight: 700, color: "var(--ink-soft)", margin: "20px 0 34px", maxWidth: 640 }}>
          A few quick questions, a tiny play-test, and I'll build lessons around the songs <i>you</i> actually want to play.
        </p>
        <ChunkyButton variant="sky" size="xl" glow onClick={ob.next} icon={<Icon name="sparkle" size={24} color="#fff" />}>Let's go</ChunkyButton>
        <p style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-faint)", marginTop: 18 }}>Takes about 3 minutes · You can change anything later</p>
      </div>
    </OBShell>
  );
}

/* -------------------------- CREATE PROFILE ------------------------ */
/* Age first, then name, then avatar. */
function OBProfile({ ob }) {
  const d = ob.data;
  const [name, setName] = useS(d.name || "");
  const [age, setAge] = useS(d.age || 8);
  const [avatar, setAvatar] = useS(d.avatar || null);
  const avatarMoods = ["conduct", "star", "magician", "painter", "rebel", "futurist", "drummer", "astronaut"];
  const avatars = avatarMoods.map((m) => PP_AVATARS.find((a) => a.mood === m) || { mood: m, bg: "#FFE38A" });
  const ready = name.trim().length > 0 && avatar;
  const quick = [5, 8, 12, 16, 25, 40];

  const save = () => { ob.set({ name: name.trim(), age, avatar: avatar.mood, avatarBg: avatar.bg }); ob.next(); };

  return (
    <OBShell step={1} total={ob.total} onBack={ob.back}>
      <div className="pp-scroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <OBTitle sub="First things first — who's learning?">Create your profile</OBTitle>

        {/* AGE (first) */}
        <div style={{ width: 560, maxWidth: "100%", marginBottom: 22 }}>
          <label style={obLabel}>How old is this pianist?</label>
          <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center", marginBottom: 12 }}>
            <button onClick={() => setAge((a) => Math.max(3, a - 1))} style={obStepBtn}>−</button>
            <div style={{ minWidth: 130, textAlign: "center" }}>
              <span style={{ fontSize: 56, fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>{age}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-faint)", marginLeft: 6 }}>yrs</span>
            </div>
            <button onClick={() => setAge((a) => Math.min(99, a + 1))} style={obStepBtn}>+</button>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {quick.map((q, idx) => (
              <button key={q} onClick={() => { setAge(q); obScaleNote(idx); }} style={{ ...obChip, ...(age === q ? obChipOn : {}) }}>{q}</button>
            ))}
          </div>
          {age < 13 && <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-faint)", textAlign: "center", marginTop: 12 }}>👨‍👩‍👧 Under 13 — a parent should help set this up. We keep kids' data private and ad-free.</p>}
        </div>

        {/* NAME */}
        <div style={{ width: 560, maxWidth: "100%", marginBottom: 24 }}>
          <label style={obLabel}>What should I call you?</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={18} placeholder="Type a name…" style={obInput} />
        </div>

        {/* AVATAR */}
        <div style={{ width: 620, maxWidth: "100%", marginBottom: 14 }}>
          <label style={obLabel}>Pick your Maestro look</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, justifyItems: "center" }}>
            {avatars.map((a) => {
              const on = avatar && avatar.mood === a.mood;
              return (
                <button key={a.mood} onClick={() => { setAvatar(a); PP_Audio.correct(); }} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, borderRadius: "50%", boxShadow: on ? "0 0 0 5px #58CC02" : "0 0 0 3px var(--line)", transition: "all .12s", transform: on ? "scale(1.05)" : "none" }}>
                  <Maestro mood={a.mood} size={92} bg={a.bg} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 12 }}>
        <ChunkyButton variant={ready ? "sky" : "dark"} size="lg" disabled={!ready} onClick={save} style={{ minWidth: 220 }}>Continue</ChunkyButton>
      </div>
    </OBShell>
  );
}
const obLabel = { display: "block", fontSize: 16, fontWeight: 900, color: "var(--ink-soft)", textAlign: "center", marginBottom: 12 };
const obStepBtn = { width: 56, height: 56, borderRadius: 16, border: "2px solid var(--line)", background: "var(--surface)", fontSize: 30, fontWeight: 900, color: "var(--ink)", cursor: "pointer", fontFamily: "Nunito", boxShadow: "0 3px 0 var(--line)" };
const obChip = { padding: "8px 16px", borderRadius: 999, border: "2px solid var(--line)", background: "var(--surface)", fontSize: 16, fontWeight: 800, color: "var(--ink-soft)", cursor: "pointer", fontFamily: "Nunito" };
const obChipOn = { borderColor: "#58CC02", background: "var(--sel-green)", color: "var(--ink)" };
const obInput = { width: "100%", padding: "16px 20px", borderRadius: 16, border: "2.5px solid var(--line)", background: "var(--surface)", fontSize: 22, fontWeight: 800, color: "var(--ink)", fontFamily: "Nunito", textAlign: "center", outline: "none" };

/* ------------------------------ WHY ------------------------------- */
/* Multi-select — pick all the reasons that apply. */
function OBWhy({ ob }) {
  const [sel, setSel] = useS(Array.isArray(ob.data.why) ? ob.data.why : (ob.data.why ? [ob.data.why] : []));
  const toggle = (id) => {
    const idx = OB_WHY.findIndex((o) => o.id === id);
    setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
    obScaleNote(idx);
  };
  return (
    <OBShell step={2} total={ob.total} onBack={ob.back}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <OBTitle sub="Pick all that apply — it shapes your whole path.">Why are you learning piano?</OBTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: 720, maxWidth: "100%" }}>
          {OB_WHY.map((o) => <ChoiceCard key={o.id} emoji={o.emoji} title={o.t} on={sel.includes(o.id)} onClick={() => toggle(o.id)} wide />)}
        </div>
        <p style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink-faint)", marginTop: 16, minHeight: 20 }}>{sel.length ? `${sel.length} selected` : "Tap one or more"}</p>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChunkyButton variant={sel.length ? "sky" : "dark"} size="lg" disabled={!sel.length} onClick={() => { ob.set({ why: sel }); ob.next(); }} style={{ minWidth: 220 }}>Continue</ChunkyButton>
      </div>
    </OBShell>
  );
}

/* ---------------------------- GOAL MIX ---------------------------- */
function OBGoalMix({ ob }) {
  const [mix, setMix] = useS(ob.data.goalMix != null ? ob.data.goalMix : 60);
  return (
    <OBShell step={3} total={ob.total} onBack={ob.back}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
        <OBTitle sub="Slide to your dream mix. We'll weight your song picks to match.">What do you want to play most?</OBTitle>
        <GoalSlider value={mix} onChange={setMix} />
        <Coach mood="conduct" size={92}>
          {mix >= 70 ? "A pop star in the making! 🎤 We'll lead with chords and chart hits." : mix <= 30 ? "Ooh, a classicist. 🎻 We'll build beautiful technique and timeless pieces." : "Best of both worlds — pop energy with classical foundations. 🎹"}
        </Coach>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChunkyButton variant="sky" size="lg" onClick={() => { ob.set({ goalMix: mix }); ob.next(); }} style={{ minWidth: 220 }}>Continue</ChunkyButton>
      </div>
    </OBShell>
  );
}

/* ------------------------------ SING ------------------------------ */
function OBSing({ ob }) {
  const [sel, setSel] = useS(ob.data.sing || null);
  return (
    <OBShell step={4} total={ob.total} onBack={ob.back}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <OBTitle sub="No judgment — it just helps me suggest sing-along songs.">Do you like to sing while you play?</OBTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, width: 760, maxWidth: "100%" }}>
          {OB_SING.map((o, idx) => (
            <button key={o.id} onClick={() => { setSel(o.id); obScaleNote(idx); }} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "28px 16px", borderRadius: 20, cursor: "pointer", fontFamily: "Nunito",
              border: `3px solid ${sel === o.id ? "#58CC02" : "var(--line)"}`, background: sel === o.id ? "var(--sel-green)" : "var(--surface)", boxShadow: sel === o.id ? "0 5px 0 #58CC02" : "0 5px 0 var(--line)", transition: "all .12s",
            }}>
              <span style={{ fontSize: 52 }}>{o.emoji}</span>
              <span style={{ fontSize: 19, fontWeight: 900, color: "var(--ink)" }}>{o.t}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChunkyButton variant={sel ? "sky" : "dark"} size="lg" disabled={!sel} onClick={() => { ob.set({ sing: sel }); ob.next(); }} style={{ minWidth: 220 }}>Continue</ChunkyButton>
      </div>
    </OBShell>
  );
}

/* --------------------------- PIANO TYPE --------------------------- */
function OBPiano({ ob }) {
  const [sel, setSel] = useS(ob.data.piano || null);
  return (
    <OBShell step={5} total={ob.total} onBack={ob.back}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <OBTitle sub="So I can tailor lessons to your keys.">What will you play on?</OBTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: 720, maxWidth: "100%" }}>
          {OB_PIANOS.map((o, idx) => <ChoiceCard key={o.id} emoji={o.emoji} title={o.t} sub={o.sub} on={sel === o.id} onClick={() => { setSel(o.id); obScaleNote(idx); }} wide />)}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChunkyButton variant={sel ? "sky" : "dark"} size="lg" disabled={!sel} onClick={() => { ob.set({ piano: sel }); ob.next(); }} style={{ minWidth: 220 }}>Continue</ChunkyButton>
      </div>
    </OBShell>
  );
}

/* ------------------------- LED MAESTRO HW ------------------------- */
function OBHardware({ ob }) {
  const [phase, setPhase] = useS("ask"); // ask | buy | ordered | has
  const setHw = (v) => ob.set({ led: v });

  if (phase === "has") {
    return (
      <OBShell step={6} total={ob.total} onBack={() => setPhase("ask")} scene>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Maestro mood="futurist" size={170} bg="#C2F0FF" ring={7} ringColor="var(--surface)" float />
          </div>
          <div style={{ marginBottom: 22, width: 520, maxWidth: "100%" }}>
            <LedStrip low={60} high={72} lit={OB_LED_RAINBOW} />
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Your keys are about to glow ✨</h1>
          <p style={{ fontSize: 19, fontWeight: 700, color: "var(--ink-soft)", margin: "12px 0 30px", maxWidth: 560 }}>Maestro will light the exact keys to press — the fastest way to learn. We'll calibrate it after setup.</p>
          <ChunkyButton variant="sky" size="xl" glow onClick={() => { setHw(true); ob.next(); }}>Continue</ChunkyButton>
        </div>
      </OBShell>
    );
  }
  if (phase === "ordered") {
    return (
      <OBShell step={6} total={ob.total} scene>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative" }}>
          <Confetti run count={120} />
          <Maestro mood="cheer" size={180} bg="#FFE38A" ring={7} ringColor="var(--surface)" float style={{ marginBottom: 18 }} />
          <h1 style={{ fontSize: 42, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Woohoo — it's on the way! 📦</h1>
          <p style={{ fontSize: 19, fontWeight: 700, color: "var(--ink-soft)", margin: "12px 0 30px", maxWidth: 580 }}>We'll finish your setup in the meantime, and you can start learning today. When your LED Maestro arrives, we'll light it up in seconds.</p>
          <ChunkyButton variant="sky" size="xl" glow onClick={() => { setHw("ordered"); ob.next(); }}>Continue without it for now</ChunkyButton>
        </div>
      </OBShell>
    );
  }
  if (phase === "buy") {
    return (
      <OBShell step={6} total={ob.total} onBack={() => setPhase("ask")}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Maestro mood="painter" size={120} bg="#FFD7C2" float style={{ marginBottom: 8 }} />
          <OBTitle sub="A peel-and-stick LED strip that sits above your keys and lights the notes to play.">Get the LED Maestro</OBTitle>
          <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
            <BuyCard brand="Amazon" sub="Prime · ships tomorrow" price="$49" color="#FF9900" onClick={() => setPhase("ordered")} />
            <BuyCard brand="Piano Professor Store" sub="Free strip with annual plan" price="$39" color="#58CC02" best onClick={() => setPhase("ordered")} />
          </div>
          <button onClick={() => { setHw(false); ob.next(); }} style={{ background: "none", border: "none", fontFamily: "Nunito", fontWeight: 800, fontSize: 16, color: "var(--ink-faint)", cursor: "pointer", textDecoration: "underline" }}>I'll decide later — keep going</button>
        </div>
      </OBShell>
    );
  }
  // ask
  return (
    <OBShell step={6} total={ob.total} onBack={ob.back}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Maestro mood="futurist" size={120} bg="#C2F0FF" float style={{ marginBottom: 6 }} />
        <OBTitle sub="The LED strip that lights up exactly which keys to press.">Do you have the LED Maestro?</OBTitle>
        <div style={{ width: 520, maxWidth: "100%", marginBottom: 22 }}>
          <LedStrip low={60} high={72} lit={OB_LED_RAINBOW} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 520, maxWidth: "100%" }}>
          <ChoiceCard emoji="✅" title="Yes, it's on my piano" sub="Let's make those keys glow" on={false} onClick={() => { PP_Audio.success(); setPhase("has"); }} wide />
          <ChoiceCard emoji="🛒" title="Not yet — where do I get one?" sub="Totally optional, but it speeds up learning" on={false} onClick={() => { PP_Audio.tap(); setPhase("buy"); }} wide />
        </div>
      </div>
    </OBShell>
  );
}
function BuyCard({ brand, sub, price, color, best, onClick }) {
  return (
    <button onClick={onClick} style={{ position: "relative", width: 280, padding: 24, borderRadius: 22, cursor: "pointer", fontFamily: "Nunito", textAlign: "left", background: "var(--surface)", border: `3px solid ${best ? "#58CC02" : "var(--line)"}`, boxShadow: best ? "0 6px 0 #3D8E00" : "0 6px 0 var(--line)" }}>
      {best && <span style={{ position: "absolute", top: -13, left: 20, background: "#58CC02", color: "#fff", fontWeight: 900, fontSize: 12, padding: "4px 12px", borderRadius: 999, boxShadow: "0 3px 0 #3D8E00", textTransform: "uppercase", letterSpacing: .5 }}>Best deal</span>}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: color + "22", display: "grid", placeItems: "center" }}><Icon name="bolt2" size={20} color={color} /></span>
        <span style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)" }}>{brand}</span>
      </div>
      <div style={{ fontSize: 34, fontWeight: 900, color: "var(--ink)" }}>{price}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-faint)", marginBottom: 16 }}>{sub}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: best ? "#46A302" : "#2E84AD", fontWeight: 900, fontSize: 16 }}>Order now <Icon name="arrowRight" size={18} color={best ? "#46A302" : "#2E84AD"} /></div>
    </button>
  );
}

/* --------------------------- TASTE PROFILER ----------------------- */
function OBTaste({ ob }) {
  const TARGET = 10;
  const [chosen, setChosen] = useS(ob.data.songs || []);
  const [revealed, setRevealed] = useS(() => [...OB_SONG_START]);

  const pick = (id) => {
    if (chosen.includes(id)) return;
    const nc = [...chosen, id];
    setChosen(nc);
    obScaleNote(nc.length - 1, 0.55);
    const rel = (OB_RELATED[id] || []).filter((r) => !revealed.includes(r));
    if (rel.length) setRevealed((r) => [...r, ...rel]);
  };
  const remove = (id) => { setChosen((c) => c.filter((x) => x !== id)); PP_Audio.tap(); };

  const suggestions = revealed.filter((id) => !chosen.includes(id)).slice(0, 12);
  const enough = chosen.length >= 4;
  const done = chosen.length >= TARGET;

  return (
    <OBShell step={7} total={ob.total} onBack={ob.back}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--ink)", margin: 0 }}>Which songs do you dream of playing?</h1>
          <p style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-faint)", margin: "3px 0 0" }}>Tap one and I'll suggest more like it. Aim for {TARGET} — these become your goals.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 130 }}><ProgressBar value={(chosen.length / TARGET) * 100} color="#58CC02" height={14} /></div>
          <span style={{ fontSize: 20, fontWeight: 900, color: done ? "#46A302" : "var(--ink)" }}>{chosen.length}/{TARGET}</span>
        </div>
      </div>

      {/* chosen chips */}
      <div style={{ minHeight: 50, display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, padding: chosen.length ? 10 : 0, background: chosen.length ? "var(--surface-2)" : "transparent", borderRadius: 14 }}>
        {chosen.length === 0 && <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-faint)", padding: "8px 4px" }}>Your picks will appear here…</span>}
        {chosen.map((id) => {
          const s = OB_SONGS[id];
          return (
            <button key={id} onClick={() => remove(id)} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "2px solid #58CC02", borderRadius: 999, padding: "6px 10px 6px 12px", cursor: "pointer", fontFamily: "Nunito" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: artBg(s.hue) }} />
              <span style={{ fontSize: 14.5, fontWeight: 900, color: "var(--ink)" }}>{s.title}</span>
              <Icon name="close" size={14} color="var(--ink-faint)" />
            </button>
          );
        })}
      </div>

      {/* suggestions grid */}
      <div className="pp-scroll" style={{ flex: 1, overflowY: "auto", paddingRight: 6 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {suggestions.map((id) => <SongCard key={id} song={OB_SONGS[id]} on={false} onClick={() => pick(id)} />)}
        </div>
        {suggestions.length === 0 && <p style={{ textAlign: "center", fontSize: 16, fontWeight: 800, color: "var(--ink-faint)", padding: 30 }}>Wow, you picked them all! 🎉</p>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-faint)" }}>{done ? "Perfect — that's a great wishlist! 🎶" : enough ? "Nice start! Add a few more for better lessons." : `Pick at least ${4 - chosen.length} more`}</span>
        <ChunkyButton variant={enough ? "sky" : "dark"} size="lg" disabled={!enough} glow={done} onClick={() => { ob.set({ songs: chosen }); ob.next(); }} style={{ minWidth: 220 }}>{done ? "These are my goals!" : "Continue"}</ChunkyButton>
      </div>
    </OBShell>
  );
}

Object.assign(window, { OBWelcome, OBProfile, OBWhy, OBGoalMix, OBSing, OBPiano, OBHardware, OBTaste, BuyCard });
