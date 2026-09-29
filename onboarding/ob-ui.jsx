/* ===================================================================
   Piano Professor — Onboarding UI kit
   Staff (SVG sheet music), step chrome, Maestro coach bubble,
   choice cards, song cards, goal slider.
   =================================================================== */
const { useState: useOB, useEffect: useOBE, useRef: useOBR } = React;

/* --------------------------- MUSIC STAFF -------------------------- */
/* White-key (C-major) treble-clef renderer. Maps MIDI to diatonic
   staff position; draws ledger lines for Middle C / low notes. */
const obStepFromC4 = (midi) => {
  const map = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 }; // C D E F G A B
  const pc = ((midi % 12) + 12) % 12;
  const oct = Math.floor(midi / 12) - 1; // C4 = midi 60 -> oct 4
  const base = map[pc] != null ? map[pc] : 0;
  return base + (oct - 4) * 7;
};
function Staff({ notes, width = 560, active = -1, gap = 14, showLyrics = true, dense = false }) {
  const top = 30;                          // y of top line (F5, step 10)
  const lineGap = gap;                     // vertical px between staff lines
  const baseE = top + lineGap * 4;         // bottom line E4 (step 2)
  const yFor = (midi) => baseE - (obStepFromC4(midi) - 2) * (lineGap / 2);
  const height = baseE + 64;
  const padL = 78, padR = 24;
  const span = width - padL - padR;
  const n = notes.length;
  const xFor = (i) => padL + (n <= 1 ? span / 2 : (span * i) / (n - 1));
  const r = dense ? 5.2 : 6.4;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: "100%" }}>
      {/* staff lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={16} y1={top + i * lineGap} x2={width - 16} y2={top + i * lineGap} stroke="var(--ink-faint)" strokeWidth="1.4" />
      ))}
      {/* treble clef glyph */}
      <text x={22} y={baseE + 6} fontSize={lineGap * 5.4} fill="var(--ink)" style={{ fontFamily: "Georgia, serif", fontWeight: 700 }}>𝄞</text>
      {/* notes */}
      {notes.map((nt, i) => {
        const midi = Array.isArray(nt) ? nt[0] : nt.midi;
        const lyric = Array.isArray(nt) ? nt[1] : nt.lyric;
        const x = xFor(i), y = yFor(midi);
        const on = i === active;
        const col = on ? "#58CC02" : "var(--ink)";
        const step = obStepFromC4(midi);
        return (
          <g key={i}>
            {/* ledger line for Middle C and below (step <= 0) */}
            {step <= 0 && <line x1={x - 13} y1={baseE + lineGap} x2={x + 13} y2={baseE + lineGap} stroke="var(--ink-faint)" strokeWidth="1.4" />}
            {/* note head */}
            <ellipse cx={x} cy={y} rx={r + 1.4} ry={r} fill={col} transform={`rotate(-18 ${x} ${y})`} />
            {/* stem */}
            <line x1={x + r + 0.6} y1={y} x2={x + r + 0.6} y2={y - lineGap * 2.6} stroke={col} strokeWidth="1.8" />
            {on && <circle cx={x} cy={y} r={r + 7} fill="none" stroke="#58CC02" strokeWidth="2" opacity="0.6" />}
            {showLyrics && lyric && (
              <text x={x} y={height - 14} textAnchor="middle" fontSize="15" fontWeight="800" fill={on ? "#46A302" : "var(--ink-soft)"} style={{ fontFamily: "Nunito" }}>{lyric}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* --------------------------- STEP CHROME -------------------------- */
function OBShell({ children, onBack, step, total, scene, pad = "26px 60px 30px" }) {
  const cls = scene ? "pp-dark-scene" : "";
  const sceneStyle = scene
    ? { background: "radial-gradient(120% 120% at 50% 0%, #FFFDF6 0%, #FFF4D6 58%, #FFE9B8 100%)" }
    : { background: "var(--cream)" };
  return (
    <div className={cls} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", padding: pad, ...sceneStyle }}>
      {(onBack || total) && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 2, marginBottom: 8 }}>
          {onBack ? (
            <button onClick={onBack} style={{ width: 46, height: 46, borderRadius: 14, border: "2px solid var(--line)", background: "var(--surface)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="chevronLeft" size={24} color="var(--ink)" /></button>
          ) : <div style={{ width: 46 }} />}
          {total ? <ProgressBar value={(step / total) * 100} color="#5BB8E3" height={16} style={{ flex: 1 }} /> : <div style={{ flex: 1 }} />}
          {total ? <span style={{ fontWeight: 900, color: "var(--ink-faint)", fontSize: 16, width: 52, textAlign: "right" }}>{step}/{total}</span> : <div style={{ flex: 1 }} />}
          <VoiceToggle />
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, position: "relative", zIndex: 2, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

/* Maestro + speech bubble coach */
function Coach({ mood = "teach", size = 116, bg = "#EAF8DC", children, align = "left", style, lang = "en", speak = true }) {
  useOBE(() => { if (speak) OBVoice.say(children, lang); }, [children, speak, lang]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexDirection: align === "left" ? "row" : "row-reverse", ...style }}>
      <Maestro mood={mood} size={size} bg={bg} ring={5} ringColor="var(--surface)" float />
      <div style={{ position: "relative", background: "var(--surface)", border: "2px solid var(--line)", borderRadius: 20, padding: "16px 20px", maxWidth: 560, boxShadow: "0 4px 0 var(--line)" }}>
        <div style={{ position: "absolute", top: "50%", [align === "left" ? "left" : "right"]: -11, transform: "translateY(-50%)", width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", [align === "left" ? "borderRight" : "borderLeft"]: "12px solid var(--surface)" }} />
        <div style={{ fontSize: 19, fontWeight: 800, color: "var(--ink)", lineHeight: 1.4 }}>{children}</div>
      </div>
    </div>
  );
}

/* Big selectable choice card */
/* C-major scale notes by index, so a list of options sounds C D E F G A B… */
const OB_C_MAJOR = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76];
const obScaleNote = (i, dur = 0.45) => PP_Audio.note(OB_C_MAJOR[((i % OB_C_MAJOR.length) + OB_C_MAJOR.length) % OB_C_MAJOR.length], 0, dur, 0.6);

function ChoiceCard({ emoji, title, sub, on, onClick, wide }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 16, padding: wide ? "18px 22px" : "20px 20px",
      borderRadius: 18, cursor: "pointer", fontFamily: "Nunito", textAlign: "left", width: "100%",
      border: `3px solid ${on ? "#58CC02" : "var(--line)"}`, background: on ? "var(--sel-green)" : "var(--surface)",
      boxShadow: on ? "0 4px 0 #58CC02" : "0 4px 0 var(--line)", transition: "all .12s",
    }}>
      {emoji && <span style={{ fontSize: 34, flexShrink: 0 }}>{emoji}</span>}
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 20, fontWeight: 900, color: "var(--ink)" }}>{title}</span>
        {sub && <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "var(--ink-faint)", marginTop: 2 }}>{sub}</span>}
      </span>
      <span style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${on ? "#58CC02" : "#D8CDA9"}`, background: on ? "#58CC02" : "transparent", display: "grid", placeItems: "center", flexShrink: 0 }}>
        {on && <Icon name="check" size={16} color="#fff" />}
      </span>
    </button>
  );
}

/* Song card (gradient album art + title/artist + genre tag) */
const OB_GENRE_TAG = { pop: { t: "Pop", c: "#FF7A52" }, classical: { t: "Classical", c: "#9b6bff" }, film: { t: "Film", c: "#2E84AD" } };
function SongCard({ song, on, onClick, compact }) {
  const tag = OB_GENRE_TAG[song.genre] || OB_GENRE_TAG.pop;
  return (
    <button onClick={onClick} style={{
      position: "relative", display: "flex", alignItems: "center", gap: 13, padding: 10, paddingRight: 16,
      borderRadius: 16, cursor: "pointer", fontFamily: "Nunito", textAlign: "left", width: "100%",
      border: `3px solid ${on ? "#58CC02" : "var(--line)"}`, background: on ? "var(--sel-green)" : "var(--surface)",
      boxShadow: on ? "0 4px 0 #58CC02" : "0 3px 0 var(--line)", transition: "all .12s",
    }}>
      <span style={{ width: compact ? 46 : 54, height: compact ? 46 : 54, borderRadius: 12, flexShrink: 0, background: artBg(song.hue), display: "grid", placeItems: "center", boxShadow: "inset 0 0 0 2px #ffffff30" }}>
        <Icon name="music" size={compact ? 20 : 24} color="#fff" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: compact ? 16 : 17.5, fontWeight: 900, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</span>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--ink-faint)" }}>{song.artist}</span>
      </span>
      <span style={{ fontSize: 11, fontWeight: 900, color: tag.c, background: tag.c + "1f", padding: "3px 9px", borderRadius: 999, flexShrink: 0 }}>{tag.t}</span>
      {on && <span style={{ position: "absolute", top: -10, right: -8, width: 26, height: 26, borderRadius: "50%", background: "#58CC02", display: "grid", placeItems: "center", boxShadow: "0 2px 0 #3D8E00", border: "2px solid var(--surface)" }}><Icon name="check" size={14} color="#fff" /></span>}
    </button>
  );
}

/* Goal mix slider: pop <-> classical */
function GoalSlider({ value, onChange }) {
  const pop = value, classical = 100 - value;
  return (
    <div style={{ width: 620, maxWidth: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 34 }}>🎤</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#FF7A52" }}>Modern pop</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)" }}>{pop}%</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 34 }}>🎻</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#9b6bff" }}>Classical</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)" }}>{classical}%</div>
        </div>
      </div>
      <div style={{ position: "relative", height: 26 }}>
        <div style={{ position: "absolute", top: 7, left: 0, right: 0, height: 12, borderRadius: 999, background: "linear-gradient(90deg,#FF7A52,#9b6bff)" }} />
        <input type="range" min="0" max="100" step="5" value={value} onChange={(e) => { onChange(+e.target.value); PP_Audio.blip(620 + (+e.target.value) * 4, 0.04, "sine", 0.08); }}
          style={{ position: "absolute", inset: 0, width: "100%", margin: 0, WebkitAppearance: "none", appearance: "none", background: "transparent", cursor: "pointer" }} className="ob-range" />
      </div>
      <style>{`
        .ob-range::-webkit-slider-thumb { -webkit-appearance: none; width: 30px; height: 30px; border-radius: 50%; background: #fff; border: 4px solid #5BB8E3; box-shadow: 0 3px 8px #0003; cursor: pointer; }
        .ob-range::-moz-range-thumb { width: 30px; height: 30px; border-radius: 50%; background: #fff; border: 4px solid #5BB8E3; box-shadow: 0 3px 8px #0003; cursor: pointer; }
      `}</style>
    </div>
  );
}

/* Title block used atop most steps */
function OBTitle({ children, sub, lang = "en", speak = true }) {
  useOBE(() => { if (speak) OBVoice.say(sub ? [children, sub] : children, lang); }, [children, sub, speak, lang]);
  return (
    <div style={{ textAlign: "center", marginBottom: 22 }}>
      <h1 style={{ fontSize: 38, fontWeight: 900, color: "var(--ink)", margin: 0, lineHeight: 1.1 }}>{children}</h1>
      {sub && <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-soft)", margin: "8px 0 0" }}>{sub}</p>}
    </div>
  );
}

Object.assign(window, { Staff, OBShell, Coach, ChoiceCard, SongCard, GoalSlider, OBTitle, obStepFromC4, OB_GENRE_TAG, obScaleNote });
