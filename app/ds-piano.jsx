/* ===================================================================
   Piano Professor — Piano Keyboard + LED strip
   =================================================================== */
const { useState: useStateP, useRef: useRefP, useEffect: useEffectP } = React;

function buildKeys(low, high) {
  const all = [];
  for (let m = low; m <= high; m++) all.push(m);
  const whites = all.filter((m) => !isBlack(m));
  const wWidth = 100 / whites.length;
  const whiteIndex = (m) => whites.indexOf(m);
  const blacks = all.filter((m) => isBlack(m)).map((m) => {
    const leftWhite = whiteIndex(m - 1);
    const center = (leftWhite + 1) * wWidth;
    return { midi: m, leftPct: center };
  });
  return { whites, blacks, wWidth };
}

/* LED light-strip that clips above the keys — uniform roundish dots per key */
function LedStrip({ low, high, lit = {} }) {
  const { whites, blacks, wWidth } = buildKeys(low, high);
  const Dot = ({ centerPct, c }) => (
    <div style={{
      position: "absolute", top: "50%", left: `${centerPct}%`, transform: "translate(-50%,-50%)",
      width: 13, height: 13, borderRadius: "50%",
      background: c || "#2a241c",
      boxShadow: c ? `0 0 12px 3px ${c}, 0 0 4px 1px ${c}` : "inset 0 1px 2px #00000070",
      transition: "background .15s, box-shadow .15s",
    }} />
  );
  return (
    <div style={{
      position: "relative", height: 26, margin: "0 6px 4px",
      borderRadius: 8, background: "linear-gradient(180deg,#1a1814,#262019)",
      boxShadow: "inset 0 2px 4px #00000080, 0 1px 0 #ffffff10",
      border: "1px solid #00000060", overflow: "hidden",
    }}>
      {whites.map((m, i) => <Dot key={"lw" + m} centerPct={(i + 0.5) * wWidth} c={lit[m]} />)}
      {blacks.map((b) => <Dot key={"lb" + b.midi} centerPct={b.leftPct} c={lit[b.midi]} />)}
    </div>
  );
}

function Piano({
  low = 48, high = 84, lit = {}, labels = {}, fingerings = {},
  onPlay, height = 200, led = true, rounded = true, interactive = true,
  glassLabel, hideNoteNames = false,
}) {
  const { whites, blacks, wWidth } = buildKeys(low, high);
  const [pressed, setPressed] = useStateP({});
  const bw = wWidth * 0.62;

  const hit = (m) => {
    if (!interactive) return;
    PP_Audio.haptic(14);
    PP_Audio.note(m);
    setPressed((p) => ({ ...p, [m]: true }));
    setTimeout(() => setPressed((p) => { const n = { ...p }; delete n[m]; return n; }), 220);
    onPlay && onPlay(m);
  };

  return (
    <div style={{ width: "100%" }} data-noclk="1">
      {led && <LedStrip low={low} high={high} lit={lit} />}
      <div style={{
        position: "relative", height, width: "100%",
        borderRadius: rounded ? 16 : 8, overflow: "hidden",
        background: "linear-gradient(180deg,#3a3128,#2a221a)",
        padding: "0 5px 6px", boxShadow: "0 6px 16px #00000040, inset 0 2px 0 #00000060",
      }}>
        {/* felt strip */}
        <div style={{ height: 6, background: "linear-gradient(180deg,#8e1d1d,#b52a2a)", borderRadius: "0 0 3px 3px", marginBottom: 2 }} />
        <div style={{ position: "relative", height: height - 14 }}>
          {/* WHITE KEYS */}
          <div style={{ display: "flex", height: "100%", gap: 2 }}>
            {whites.map((m) => {
              const c = lit[m]; const isP = pressed[m];
              return (
                <div key={m} onPointerDown={() => hit(m)}
                  style={{
                    flex: 1, position: "relative", borderRadius: "3px 3px 8px 8px",
                    background: c
                      ? `linear-gradient(180deg, #fff, ${c})`
                      : isP ? "linear-gradient(180deg,#f3edda,#e4dcc0)" : "linear-gradient(180deg,#fffef9,#ece3cb)",
                    boxShadow: c
                      ? `0 0 18px 2px ${c}aa, inset 0 -6px 8px ${c}55`
                      : isP ? "inset 0 -3px 6px #00000022" : "inset 0 -7px 10px #0000000f, inset 0 1px 0 #fff",
                    transform: isP ? "translateY(2px)" : "none",
                    transition: "transform .05s, box-shadow .15s, background .15s",
                    cursor: interactive ? "pointer" : "default", display: "flex",
                    flexDirection: "column", justifyContent: "flex-end", alignItems: "center", paddingBottom: 8,
                  }}>
                  {fingerings[m] && (
                    <span style={{
                      position: "absolute", top: 10, width: 22, height: 22, borderRadius: "50%",
                      background: c ? "#00000022" : "#58CC02", color: "#fff",
                      display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900,
                    }}>{fingerings[m]}</span>
                  )}
                  {labels[m] ? (
                    <span style={{ fontSize: 13, fontWeight: 900, color: c ? "#2a6b00" : "#B6AC8C" }}>{labels[m]}</span>
                  ) : (c && !hideNoteNames && (
                    <span style={{ fontSize: 13, fontWeight: 900, color: "#2a6b00" }}>{midiName(m)}</span>
                  ))}
                </div>
              );
            })}
          </div>
          {/* BLACK KEYS */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {blacks.map((b) => {
              const c = lit[b.midi]; const isP = pressed[b.midi];
              return (
                <div key={b.midi} onPointerDown={() => hit(b.midi)}
                  style={{
                    position: "absolute", top: 0, height: "62%", pointerEvents: interactive ? "auto" : "none",
                    left: `calc(${b.leftPct}% - ${bw / 2}%)`, width: `${bw}%`,
                    borderRadius: "2px 2px 6px 6px", cursor: interactive ? "pointer" : "default",
                    background: c
                      ? `linear-gradient(180deg, ${c}, #1a1a1a)`
                      : isP ? "linear-gradient(180deg,#333,#111)" : "linear-gradient(180deg,#2a2a2a,#0c0c0c)",
                    boxShadow: c
                      ? `0 0 16px 2px ${c}cc, inset 0 -4px 6px ${c}55`
                      : "0 3px 4px #00000080, inset 0 -4px 6px #00000080, inset 0 1px 0 #ffffff30",
                    transform: isP ? "translateY(2px)" : "none", transition: "transform .05s, box-shadow .15s, background .15s",
                    display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", paddingBottom: 6,
                  }}>
                  {fingerings[b.midi] ? (
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--surface)", color: "#111", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 900 }}>{fingerings[b.midi]}</span>
                  ) : (c && !hideNoteNames && (
                    <span style={{ fontSize: 9, fontWeight: 900, color: "#fff", lineHeight: 1, textShadow: "0 1px 2px #000" }}>{midiName(b.midi)}</span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Piano, LedStrip, buildKeys });
