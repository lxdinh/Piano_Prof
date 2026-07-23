/* ===================================================================
   Piano Professor — ChordLibrary UI (tree + detail)
   Reusable across tablet (full) and phone (compact). Calls onChange(chord)
   so the host can light the on-screen piano.
   =================================================================== */
const { useState: useCU, useEffect: useCUE } = React;

function ChordLibrary({ compact = false, onChange, lang = "en" }) {
  const [open, setOpen] = useCU({ triads: true, sevenths: false, suspended: false });
  const [rootIdx, setRootIdx] = useCU(0);
  const [sel, setSel] = useCU({ fam: "triads", type: "major" });
  const root = CHORD_ROOTS[rootIdx];
  const chord = buildChord(sel.type, root);

  useCUE(() => { onChange && onChange(chord); }, [sel.type, rootIdx]);
  const play = () => PP_Audio.chord(chord.notes, 1.4);

  // sizes
  const treeW = compact ? 216 : 280;
  const nameFs = compact ? 26 : 46;
  const staffSz = compact ? 116 : 150;

  return (
    <div style={{ display: "flex", gap: compact ? 12 : 22, flex: 1, minHeight: 0 }}>
      {/* ---------------- TREE ---------------- */}
      <div className="pp-scroll" style={{ width: treeW, flexShrink: 0, overflowY: "auto", paddingRight: 4 }}>
        {CHORD_FAMILIES.map((fam) => {
          const isOpen = open[fam.id];
          return (
            <div key={fam.id} style={{ marginBottom: compact ? 8 : 10 }}>
              <button onClick={() => setOpen((o) => ({ ...o, [fam.id]: !o[fam.id] }))}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: compact ? "9px 10px" : "12px 14px", borderRadius: 14, border: "2px solid var(--line)", background: "var(--surface)", boxShadow: "0 3px 0 var(--line)", cursor: "pointer", fontFamily: "Nunito" }}>
                <span style={{ fontSize: compact ? 16 : 20 }}>{fam.icon}</span>
                <span style={{ flex: 1, textAlign: "left", fontSize: compact ? 15 : 18, fontWeight: 900, color: "var(--ink)" }}>{tChordFam(fam.id, "name", lang)}</span>
                <span style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }}><Icon name="chevronRight" size={compact ? 16 : 18} color="#B4AA8C" /></span>
              </button>
              {isOpen && (
                <div style={{ paddingLeft: compact ? 8 : 14, paddingTop: 6, display: "flex", flexDirection: "column", gap: 5 }}>
                  {/* family hook */}
                  {!compact && <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-faint)", margin: "0 0 4px 8px", lineHeight: 1.3 }}>{tChordFam(fam.id, "hook", lang)}</p>}
                  {fam.types.map((typeId) => {
                    const t = CHORD_TYPES[typeId];
                    const on = sel.type === typeId;
                    return (
                      <button key={typeId} onClick={() => { setSel({ fam: fam.id, type: typeId }); PP_Audio.chord(buildChord(typeId, root).notes, 1.2); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: compact ? "7px 9px" : "9px 12px", borderRadius: 11, border: `2px solid ${on ? t.color : "var(--line)"}`, background: on ? t.color + "1a" : "var(--surface)", cursor: "pointer", fontFamily: "Nunito", textAlign: "left" }}>
                        <span style={{ width: compact ? 8 : 10, height: compact ? 8 : 10, borderRadius: 3, background: t.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 6, overflow: "hidden" }}>
                          <span style={{ fontSize: compact ? 14 : 16, fontWeight: 900, color: "var(--ink)", flexShrink: 0 }}>{root.name}{t.suffix}</span>
                          <span style={{ fontSize: compact ? 11 : 12.5, fontWeight: 800, color: "var(--ink-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{tChordType(typeId, "label", lang)}</span>
                        </span>
                        <span style={{ fontSize: compact ? 11 : 12.5, fontWeight: 800, color: t.deep, flexShrink: 0, whiteSpace: "nowrap", textAlign: "right" }}>{tChordType(typeId, "punch", lang)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------------- DETAIL ---------------- */}
      <div className="pp-scroll" style={{ flex: 1, minWidth: 0, overflowY: "hidden" }}>
        <div style={{ maxWidth: compact ? "100%" : 770, paddingRight: compact ? 10 : 0, display: "flex", flexDirection: "column", gap: compact ? 7 : 16 }}>

          {/* root selector */}
          <div style={{ display: "flex", alignItems: "center", gap: compact ? 5 : 7, flexWrap: "wrap" }}>
            <span style={{ fontSize: compact ? 11 : 12, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: .6, marginRight: 2 }}>{t("pr.root", lang)}</span>
            {CHORD_ROOTS.map((r, i) => {
              const on = rootIdx === i;
              return (
                <button key={r.name} onClick={() => { setRootIdx(i); PP_Audio.chord(buildChord(sel.type, r).notes, 1.0); }}
                  style={{ width: compact ? 30 : 36, height: compact ? 30 : 36, borderRadius: 9, border: `2px solid ${on ? "#2D2A26" : "var(--line)"}`, background: on ? "#2D2A26" : "var(--surface)", color: on ? "#fff" : "var(--ink)", fontWeight: 900, fontSize: compact ? 14 : 16, fontFamily: "Nunito", cursor: "pointer" }}>{r.name}</button>
              );
            })}
          </div>

          {/* headline */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: nameFs, fontWeight: 900, color: "var(--ink)", margin: 0, lineHeight: 1 }}>{chord.name}</h2>
                <span style={{ background: chord.t.color, color: "#fff", fontWeight: 900, fontSize: compact ? 13 : 16, padding: compact ? "3px 11px" : "4px 14px", borderRadius: 999, boxShadow: `0 3px 0 ${chord.t.deep}` }}>{tChordType(chord.typeId, "punch", lang)}</span>
              </div>
              <p style={{ fontSize: compact ? 13 : 16, fontWeight: 800, color: "var(--ink-soft)", margin: compact ? "5px 0 0" : "7px 0 0", lineHeight: 1.35 }}>{tChordType(chord.typeId, "line", lang)}</p>
            </div>
            {compact && (
              <button onClick={play} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(180deg,#6FE018,#58CC02)", boxShadow: "0 3px 0 #3D8E00", color: "#fff", fontFamily: "Nunito", fontWeight: 900, fontSize: 13 }}>
                <Icon name="play" size={15} color="#fff" /> {t("pr.hearIt", lang)}
              </button>
            )}
          </div>

          {/* ---- COMPACT (phone): recipe, then keyboard + staff side-by-side ---- */}
          {compact ? (
            <>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: .6, marginBottom: 7 }}>{t("pr.recipe", lang)} · {chord.t.degrees.join(" – ")}</div>
                  <StepDiagram chord={chord} />
                </div>
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, marginTop: -8 }}>
                  <StaffChord chord={chord} width={128} height={72} />
                  <span style={{ fontSize: 10, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: .6 }}>{t("pr.staff", lang)}</span>
                </div>
              </div>
              <div style={{ width: "100%" }}>
                <Piano low={60} high={81} lit={chord.notes.reduce((a, n) => (a[n] = chord.t.color, a), {})} led height={76} onPlay={() => {}} />
              </div>
            </>
          ) : (
          /* ---- FULL (tablet): clean grid — text column + staff card ---- */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 212px", gap: 28, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: .6, marginBottom: 9 }}>{t("pr.recipe", lang)} · {chord.t.degrees.join(" – ")}</div>
                <StepDiagram chord={chord} />
              </div>
              <div style={{ background: "var(--surface)", border: "2px solid var(--line)", borderRadius: 14, padding: "12px 18px", boxShadow: "0 3px 0 var(--line)" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: .6, marginBottom: 8 }}>{t("pr.notes", lang)}</div>
                <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
                  {spellChord(chord).map((tone, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)" }}>{tone.name}</span>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: chord.t.color, color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 900, boxShadow: `0 2px 0 ${chord.t.deep}` }}>{chord.t.degrees[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "var(--ink-faint)" }}>
                <Icon name="bolt2" size={15} color="#C9BE9A" /> {t("pr.stacking", lang)}: {chord.t.steps}
              </div>
            </div>

            {/* staff card */}
            <div style={{ background: "var(--surface)", border: "2px solid var(--line)", borderRadius: 18, padding: 14, boxShadow: "0 4px 0 var(--line)", display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: .6, textAlign: "center" }}>{t("pr.staff", lang)}</span>
              <StaffChord chord={chord} width={184} height={120} />
              <button onClick={play} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", borderRadius: 13, border: "none", cursor: "pointer", background: "linear-gradient(180deg,#6FE018,#58CC02)", boxShadow: "0 4px 0 #3D8E00", color: "#fff", fontFamily: "Nunito", fontWeight: 900, fontSize: 16 }}>
                <Icon name="play" size={18} color="#fff" /> {t("pr.hearIt", lang)}
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ChordLibrary });
