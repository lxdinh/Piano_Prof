/* ===================================================================
   Piano Professor — Chord Library data + sheet-music renderer + tree UI
   Used in Practice (tablet & phone). Educational: punchline, formula,
   whole/half steps, lit keys, and staff notation.
   =================================================================== */
const { useState: useCL, useEffect: useCLE } = React;

/* Chord TYPES — each is a recipe relative to a root.
   semis  : semitones above root (the notes)
   degrees: scale-degree labels (the "1-3-5")
   steps  : whole/half step recipe between stacked notes
   letterSteps : diatonic letter offsets from root letter (for staff spelling)
   accs   : accidental for each note when rooted on C (clean teaching key) */
const CHORD_TYPES = {
  major:  { suffix: "",    label: "Major",        semis: [0,4,7],    degrees: ["1","3","5"],        steps: "Whole+Half · Half+Whole (4-3)", letterSteps: [0,2,4],   accsC: ["","",""],          punch: "Happy ☀️",   line: "Bright like a sunny birthday.",     color: "#58CC02", deep: "#3D8E00" },
  minor:  { suffix: "m",   label: "Minor",        semis: [0,3,7],    degrees: ["1","♭3","5"],       steps: "Half+Whole · Whole+Half (3-4)", letterSteps: [0,2,4],   accsC: ["","♭",""],         punch: "Sad 🌧️",     line: "Slide the middle note DOWN a half-step.", color: "#5BB8E3", deep: "#2E84AD" },
  dim:    { suffix: "dim", label: "Diminished",   semis: [0,3,6],    degrees: ["1","♭3","♭5"],      steps: "Half+Whole · Half+Whole (3-3)", letterSteps: [0,2,4],   accsC: ["","♭","♭"],        punch: "Spooky 👻",  line: "Both top notes squished down — scary movie!", color: "#9b6bff", deep: "#6b3fd4" },
  aug:    { suffix: "aug", label: "Augmented",    semis: [0,4,8],    degrees: ["1","3","♯5"],       steps: "Whole+Half · Whole+Half (4-4)", letterSteps: [0,2,4],   accsC: ["","","♯"],         punch: "Dreamy ✨",  line: "Stretch the top note UP — floaty and mysterious.", color: "#FF7A52", deep: "#C2410C" },
  maj7:   { suffix: "maj7",label: "Major 7th",    semis: [0,4,7,11], degrees: ["1","3","5","7"],    steps: "Add the note a half-step under the root", letterSteps: [0,2,4,6], accsC: ["","","",""],   punch: "Jazzy 😎",   line: "Smooth, classy, coffee-shop vibes.", color: "#F5B800", deep: "#C28A00" },
  dom7:   { suffix: "7",   label: "Dominant 7th", semis: [0,4,7,10], degrees: ["1","3","5","♭7"],   steps: "Add a whole-step under the root", letterSteps: [0,2,4,6], accsC: ["","","","♭"],  punch: "Bluesy 🎷",  line: "Itchy — it really wants to go home.", color: "#F5B800", deep: "#C28A00" },
  min7:   { suffix: "m7",  label: "Minor 7th",    semis: [0,3,7,10], degrees: ["1","♭3","5","♭7"],  steps: "Minor chord + a flat 7th", letterSteps: [0,2,4,6], accsC: ["","♭","","♭"], punch: "Chill 🛋️",   line: "Mellow and cozy, like a lazy Sunday.", color: "#F5B800", deep: "#C28A00" },
  sus2:   { suffix: "sus2",label: "Suspended 2",  semis: [0,2,7],    degrees: ["1","2","5"],        steps: "Swap the 3rd for the 2nd", letterSteps: [0,1,4],   accsC: ["","",""],          punch: "Open 🌅",    line: "No happy/sad — wide and waiting.", color: "#58CC02", deep: "#3D8E00" },
  sus4:   { suffix: "sus4",label: "Suspended 4",  semis: [0,5,7],    degrees: ["1","4","5"],        steps: "Swap the 3rd for the 4th", letterSteps: [0,3,4],   accsC: ["","",""],          punch: "Suspense 🎬",line: "Hangs in the air — needs to resolve!", color: "#58CC02", deep: "#3D8E00" },
};

/* Families = the tree. Each holds chord-type ids, with a teaching hook. */
const CHORD_FAMILIES = [
  { id: "triads", name: "Triads", icon: "🔺", hook: "3 notes stacked. The 'middle' note decides the mood.", types: ["major","minor","dim","aug"] },
  { id: "sevenths", name: "Sevenths", icon: "7️⃣", hook: "Triad + one extra note on top. Richer, jazzier.", types: ["maj7","dom7","min7"] },
  { id: "suspended", name: "Suspended", icon: "⏸️", hook: "Swap the middle note — no major or minor, just tension.", types: ["sus2","sus4"] },
];

/* Roots available to transpose any chord (C is the clean teaching key). */
const CHORD_ROOTS = [
  { name: "C", midi: 60, letter: 0 }, { name: "D", midi: 62, letter: 1 },
  { name: "E", midi: 64, letter: 2 }, { name: "F", midi: 65, letter: 3 },
  { name: "G", midi: 67, letter: 4 }, { name: "A", midi: 69, letter: 5 },
];

/* Build a concrete chord on a root */
function buildChord(typeId, root) {
  const t = CHORD_TYPES[typeId];
  const notes = t.semis.map((s) => root.midi + s);
  const name = root.name + t.suffix;
  return { typeId, t, root, notes, name };
}

/* ----------------------- NOTE SPELLING ---------------------------- */
const LETTER_NAMES = ["C","D","E","F","G","A","B"];
const LETTER_PC = [0,2,4,5,7,9,11];
/* Spell each chord tone with the correct letter + accidental, root-aware. */
function spellChord(chord) {
  const t = chord.t, root = chord.root;
  return t.semis.map((s, i) => {
    const letterIdx = ((root.letter + t.letterSteps[i]) % 7 + 7) % 7;
    const noteMidi = chord.notes[i];
    const octave = Math.floor(noteMidi / 12) - 1;
    let diff = (noteMidi % 12) - LETTER_PC[letterIdx];
    if (diff > 6) diff -= 12; if (diff < -6) diff += 12;
    const acc = diff === 0 ? "" : diff === 1 ? "♯" : diff === -1 ? "♭" : diff === 2 ? "𝄪" : diff === -2 ? "𝄫" : "";
    // diatonic staff value: E4 line = 4*7+2 = 30
    const diat = octave * 7 + letterIdx;
    return { name: LETTER_NAMES[letterIdx] + acc, letter: LETTER_NAMES[letterIdx], acc, diat };
  });
}

/* ----------------------- SHEET-MUSIC RENDERER --------------------- */
/* Treble clef. Maps a chord to stacked noteheads with accidentals + ledger lines. */
function StaffChord({ chord, width = 150, height = 150 }) {
  const t = chord.t;
  const tones = spellChord(chord);
  const lineGap = 11;                 // px between staff lines
  const half = lineGap / 2;
  const E4 = 30;                      // bottom line diatonic value
  const minDiat = Math.min(...tones.map((x) => x.diat), E4);
  const maxDiat = Math.max(...tones.map((x) => x.diat), 38);
  const noteR = 6.2;                  // notehead radius
  // place the bottom line so ALL content (highest note ↑, lowest note + ledgers ↓) fits centered with padding
  const topPad = 9, botPad = 9;
  const aboveTop = (maxDiat - E4) * half + noteR;          // px above bottom line to highest content
  const belowBottom = (E4 - minDiat) * half + noteR;        // px below bottom line to lowest content
  const contentH = aboveTop + belowBottom;
  const bottomLineY = Math.round(topPad + aboveTop + (height - topPad - botPad - contentH) / 2);
  const yFor = (diat) => bottomLineY - (diat - E4) * half;
  const cx = width - 40;              // notehead x (after clef)

  // ledger lines for notes below E4 (e.g. middle C = 28) or above F5 (38)
  const ledgers = [];
  for (let d = 28; d < E4; d += 2) if (minDiat <= d) ledgers.push(d);
  for (let d = 40; d <= maxDiat; d += 2) ledgers.push(d);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <rect x="0" y="0" width={width} height={height} rx="14" fill="#fff" stroke="var(--line)" strokeWidth="2" />
      {/* 5 staff lines */}
      {[30,32,34,36,38].map((d) => (
        <line key={d} x1="12" y1={yFor(d)} x2={width-12} y2={yFor(d)} stroke="#C9BE9A" strokeWidth="1.6" />
      ))}
      {/* treble clef glyph */}
      <text x="16" y={yFor(31)+10} fontSize="44" fill="#2D2A26" fontFamily="Georgia, serif">𝄞</text>
      {/* ledger lines */}
      {ledgers.map((d, i) => (
        <line key={"l"+i} x1={cx-12} y1={yFor(d)} x2={cx+14} y2={yFor(d)} stroke="#C9BE9A" strokeWidth="1.6" />
      ))}
      {/* noteheads */}
      {tones.map((tone, i) => {
        const y = yFor(tone.diat);
        return (
          <g key={i}>
            {tone.acc && <text x={cx-21} y={y+5} fontSize="16" fontWeight="700" fill={t.deep} fontFamily="Georgia, serif">{tone.acc}</text>}
            <ellipse cx={cx} cy={y} rx={noteR + 1.3} ry={noteR - 0.6} fill={t.color} stroke={t.deep} strokeWidth="1.6" transform={`rotate(-20 ${cx} ${y})`} />
          </g>
        );
      })}
    </svg>
  );
}

/* --------------------- WHOLE/HALF STEP DIAGRAM -------------------- */
function StepDiagram({ chord }) {
  const notes = chord.notes;
  const gaps = [];
  for (let i = 0; i < notes.length - 1; i++) {
    const semi = notes[i+1] - notes[i];
    gaps.push(semi);
  }
  const labelFor = (s) => s === 1 ? "½" : s === 2 ? "W" : s === 3 ? "W½" : s === 4 ? "WW" : s + "♭";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {chord.t.degrees.map((d, i) => (
        <React.Fragment key={i}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: chord.t.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 14, boxShadow: `0 2px 0 ${chord.t.deep}` }}>{d}</span>
          {i < gaps.length && (
            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", color: "var(--ink-faint)" }}>
              <span style={{ fontSize: 16 }}>→</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: chord.t.deep }}>{gaps[i] === 1 ? "half" : gaps[i] === 2 ? "whole" : gaps[i] === 3 ? "1½" : "2"}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

Object.assign(window, { CHORD_TYPES, CHORD_FAMILIES, CHORD_ROOTS, buildChord, StaffChord, StepDiagram, spellChord });
