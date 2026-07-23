/* ===================================================================
   Piano Professor — Onboarding: interactive placement ladder + result
   Rungs: find Middle C · find next C · read a note · play Twinkle ·
   play Ode to Joy · self-assess (copyrighted, title only) · sonata.
   Every rung has an "I'm not sure" escape that stops & places.
   =================================================================== */
const { useState: usePL, useEffect: usePLE } = React;

function obLevelFromScore(score) {
  if (score <= 1) return PP_LEVELS[0];   // Kindergarten
  if (score <= 3) return PP_LEVELS[1];   // Elementary
  if (score <= 6) return PP_LEVELS[2];   // Middle School
  if (score <= 8) return PP_LEVELS[3];   // High School
  if (score <= 10) return PP_LEVELS[4];  // University
  return PP_LEVELS[5];                   // Master
}
const OB_RUNG_PTS = { findC: 1, findF: 1, read: 1, twinkle: 2, ode: 2 };

function OBPlacement({ ob }) {
  const [idx, setIdx] = usePL(0);
  const [score, setScore] = usePL(0);
  const [pos, setPos] = usePL(0);        // progress within a playPhrase
  const [flash, setFlash] = usePL(null); // 'ok' | 'wrong'
  const [banner, setBanner] = usePL(null); // between-rung celebration
  const rung = OB_LADDER[idx];

  usePLE(() => { setPos(0); setFlash(null); if (rung && rung.say) {/* coach line shown */} }, [idx]);

  const finish = (finalScore) => {
    const lvl = obLevelFromScore(finalScore);
    ob.set({ placementScore: finalScore, levelId: lvl.id });
    ob.go("placementResult");
  };
  const advance = (pts, msg) => {
    const ns = score + pts;
    setScore(ns);
    setBanner(msg || "Nice!");
    setTimeout(() => {
      setBanner(null);
      if (idx < OB_LADDER.length - 1) { setIdx(idx + 1); }
      else finish(ns);
    }, 1100);
  };
  const stopHere = () => finish(score);

  const onKey = (m) => {
    if (banner) return;
    if (rung.type === "findKey" || rung.type === "readNote") {
      const hitOk = rung.targets ? rung.targets.includes(m) : m === rung.target;
      if (hitOk) { PP_Audio.correct(); setFlash("ok"); advance(OB_RUNG_PTS[rung.id] || 1, "That's it! 🎯"); }
      else { PP_Audio.wrong(); setFlash("wrong"); setTimeout(() => setFlash(null), 400); }
    } else if (rung.type === "playPhrase") {
      const expected = rung.melody[pos][0];
      if (m === expected) {
        PP_Audio.note(m, 0, 1.0);
        const np = pos + 1;
        if (np >= rung.melody.length) { PP_Audio.success(); advance(OB_RUNG_PTS[rung.id] || 2, "You played it! 🎉"); }
        else setPos(np);
      } else { PP_Audio.wrong(); setFlash("wrong"); setTimeout(() => setFlash(null), 300); }
    }
  };

  const selfAnswer = (opt) => {
    if (opt.stop) { stopHere(); return; }
    const pts = rung.id === "sonata" ? 3 * opt.v : 2 * opt.v;
    advance(pts, opt.v >= 1 ? "Impressive! 👏" : "Good to know!");
  };

  return (
    <OBShell onBack={idx === 0 ? ob.back : () => { setIdx(idx - 1); }}>
      {/* rung dots */}
      <div style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 6 }}>
        {OB_LADDER.map((r, i) => (
          <span key={r.id} style={{ width: i === idx ? 26 : 10, height: 10, borderRadius: 999, background: i < idx ? "#58CC02" : i === idx ? "#58CC02" : "var(--line)", transition: "all .2s" }} />
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Coach mood={flash === "wrong" ? "thinking" : "teach"} size={92} style={{ marginBottom: 18 }}>{rung.say}</Coach>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--ink)", margin: "0 0 18px", textAlign: "center" }}>{rung.prompt}</h1>

        {/* per-rung body */}
        {(rung.type === "readNote") && (
          <div style={{ background: "var(--surface)", border: "2px solid var(--line)", borderRadius: 18, padding: "10px 20px", marginBottom: 18 }}>
            <Staff notes={[[rung.note]]} width={360} showLyrics={false} />
          </div>
        )}
        {rung.type === "playPhrase" && (
          <div style={{ background: "var(--surface)", border: "2px solid var(--line)", borderRadius: 18, padding: "10px 18px 6px", marginBottom: 16, width: 640, maxWidth: "100%" }}>
            <Staff notes={rung.melody} width={600} active={pos} />
            <div style={{ textAlign: "center", fontSize: 14, fontWeight: 800, color: "var(--ink-faint)", paddingBottom: 6 }}>{rung.songName} · {pos}/{rung.melody.length} notes</div>
          </div>
        )}
        {rung.type === "selfAssess" && (
          <SelfAssessBody rung={rung} onAnswer={selfAnswer} />
        )}

        {/* interactive piano for play/find rungs */}
        {(rung.type === "findKey" || rung.type === "readNote" || rung.type === "playPhrase") && (
          <div style={{ width: rung.type === "playPhrase" ? 720 : 600, maxWidth: "100%", animation: flash === "wrong" ? "pp-jiggle .3s" : "none" }}>
            <Piano
              low={rung.low} high={rung.high}
              lit={{}}
              labels={{}}
              onPlay={onKey} height={188} led={false}
              hideNoteNames={rung.type === "playPhrase"}
            />
            {rung.type === "findKey" && rung.hint && <p style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: "var(--ink-faint)", marginTop: 10 }}>{rung.hint}</p>}
          </div>
        )}
      </div>

      {/* footer: escape hatch */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
        <button onClick={stopHere} style={{ background: "none", border: "none", fontFamily: "Nunito", fontWeight: 800, fontSize: 16, color: "var(--ink-faint)", cursor: "pointer", textDecoration: "underline" }}>
          I'm not sure I can play this →
        </button>
      </div>

      {/* between-rung banner */}
      {banner && (
        <div style={{ position: "absolute", inset: 0, zIndex: 30, display: "grid", placeItems: "center", background: "rgba(8,16,28,.28)", backdropFilter: "blur(2px)" }}>
          <div style={{ background: "var(--surface)", borderRadius: 24, padding: "26px 40px", boxShadow: "0 20px 50px #0006", display: "flex", alignItems: "center", gap: 16, animation: "pp-pop .3s" }}>
            <Maestro mood="star" size={72} bg="#FFE38A" />
            <span style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)" }}>{banner}</span>
          </div>
        </div>
      )}
    </OBShell>
  );
}

/* Self-assessment rung: show the (copyrighted) song by TITLE only, or a
   public-domain sonata staff, then ask how comfortable they'd be. */
function SelfAssessBody({ rung, onAnswer }) {
  const s = OB_SONGS[rung.refSong];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: 640, maxWidth: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "var(--surface)", border: "2px solid var(--line)", borderRadius: 20, padding: "16px 22px", width: "100%" }}>
        <span style={{ width: 64, height: 64, borderRadius: 14, background: artBg(s.hue), display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="music" size={28} color="#fff" /></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)" }}>{s.title}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-faint)" }}>{s.artist}</div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 900, color: (OB_GENRE_TAG[s.genre] || {}).c, background: ((OB_GENRE_TAG[s.genre] || {}).c || "#888") + "1f", padding: "4px 11px", borderRadius: 999 }}>{(OB_GENRE_TAG[s.genre] || {}).t}</span>
      </div>
      {rung.showStaff && rung.melody && (
        <div style={{ background: "var(--surface)", border: "2px solid var(--line)", borderRadius: 16, padding: "8px 16px", width: "100%" }}>
          <Staff notes={rung.melody} width={580} showLyrics={false} dense />
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, width: "100%" }}>
        {OB_SELF_OPTS.map((o) => (
          <button key={o.id} onClick={() => onAnswer(o)} style={{
            padding: "16px 12px", borderRadius: 16, cursor: "pointer", fontFamily: "Nunito", fontSize: 17, fontWeight: 900,
            border: "3px solid var(--line)", background: "var(--surface)", color: "var(--ink)", boxShadow: "0 4px 0 var(--line)",
          }}>{o.t}</button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- RESULT ----------------------------- */
function OBPlacementResult({ ob }) {
  const lvl = PP_LEVELS.find((l) => l.id === ob.data.levelId) || PP_LEVELS[1];
  const [reveal, setReveal] = usePL(false);
  usePLE(() => { const t = setTimeout(() => { setReveal(true); PP_Audio.success(); }, 600); return () => clearTimeout(t); }, []);
  return (
    <OBShell scene>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {reveal && <Confetti run count={140} />}
        <p style={{ fontSize: 21, fontWeight: 800, color: "var(--ink-faint)", marginBottom: 8, opacity: reveal ? 1 : 0, transition: ".4s" }}>I found your level…</p>
        <div style={{ position: "relative", marginBottom: 16, transform: reveal ? "scale(1)" : "scale(.4)", opacity: reveal ? 1 : 0, transition: "all .6s cubic-bezier(.3,1.7,.5,1)" }}>
          <div style={{ width: 200, height: 200, borderRadius: 44, background: `linear-gradient(150deg, ${lvl.color}, ${lvl.deep})`, display: "grid", placeItems: "center", boxShadow: `0 18px 40px ${lvl.color}66`, transform: "rotate(-6deg)" }}>
            <span style={{ fontSize: 86, fontWeight: 900, color: "#fff", textShadow: "0 4px 0 #00000022" }}>{lvl.short}</span>
          </div>
          <div style={{ position: "absolute", bottom: -14, right: -22, animation: "pp-float 2.6s infinite" }}>
            <Maestro mood="trophy" size={92} bg="#FFE38A" ring={5} ringColor="var(--surface)" />
          </div>
        </div>
        <h1 style={{ fontSize: 46, fontWeight: 900, color: "var(--ink)", margin: "16px 0 6px", textAlign: "center", opacity: reveal ? 1 : 0, transition: ".5s .2s" }}>
          You're a <span style={{ color: lvl.color }}>{lvl.name}</span> pianist
        </h1>
        <p style={{ fontSize: 21, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 4, opacity: reveal ? 1 : 0, transition: ".5s .3s", textAlign: "center", maxWidth: 620 }}>Grade {lvl.grade} · {lvl.blurb}</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-faint)", marginBottom: 28, opacity: reveal ? 1 : 0, transition: ".5s .35s" }}>Built around the {(ob.data.songs || []).length} songs you picked. We can adjust anytime.</p>
        <div style={{ opacity: reveal ? 1 : 0, transform: reveal ? "translateY(0)" : "translateY(16px)", transition: ".5s .4s" }}>
          <ChunkyButton variant="sky" size="xl" glow onClick={ob.next}>Unlock my lessons</ChunkyButton>
        </div>
      </div>
    </OBShell>
  );
}

Object.assign(window, { OBPlacement, OBPlacementResult, SelfAssessBody, obLevelFromScore });
