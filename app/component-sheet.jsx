/* ===================================================================
   Piano Professor — Component Sheet (RN handoff reference)
   Renders REAL design-system components + props notes.
   =================================================================== */
const { useState: useCS } = React;

/* ---- layout helpers ---- */
function Section({ id, n, title, sub, children }) {
  return (
    <section id={id} style={{ marginBottom: 26, scrollMarginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
        <span style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 15, color: "#58CC02" }}>{n}</span>
        <h2 style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 27, color: "var(--ink)", margin: 0 }}>{title}</h2>
      </div>
      {sub && <p style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 15, color: "#8A806A", margin: "0 0 16px", maxWidth: 720 }}>{sub}</p>}
      <div style={{ background: "var(--surface)", borderRadius: 22, border: "2px solid #ECE3C9", padding: 26, boxShadow: "0 4px 0 var(--line)" }}>
        {children}
      </div>
    </section>
  );
}
function Row({ children, style }) { return <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", ...style }}>{children}</div>; }
function Label({ children }) { return <div style={{ fontFamily: "Nunito", fontWeight: 800, fontSize: 12, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>{children}</div>; }
function Tile({ label, children, w }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: w }}>
      <div style={{ minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#FBF8EE", borderRadius: 14, border: "1.5px dashed #E2D9BE" }}>{children}</div>
      {label && <span style={{ fontFamily: "Nunito", fontWeight: 800, fontSize: 13, color: "var(--ink-soft)", textAlign: "center" }}>{label}</span>}
    </div>
  );
}
function Note({ children }) {
  return <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, color: "#5b5640", background: "#F3EFE0", borderRadius: 10, padding: "10px 14px", marginTop: 16, lineHeight: 1.6, border: "1px solid #E6DCC0" }}>{children}</div>; }
function Code({ children }) { return <span style={{ fontFamily: "ui-monospace, Menlo, monospace", background: "#E9F8DC", color: "#3D8E00", padding: "1px 6px", borderRadius: 5, fontSize: 12 }}>{children}</span>; }

/* ---- static display versions of compound components ---- */
function DemoPoster({ title, sub, kind, state, stars, premium }) {
  const color = "#5BB8E3", deep = "#2E84AD";
  const locked = state === "locked", soon = state === "soon", done = state === "done", active = state === "active";
  const KIND_ICON = { lesson: "grad", song: "music", concept: "book", exercise: "bolt2" };
  return (
    <div style={{ width: 188, borderRadius: 20, background: "var(--surface)", border: `2px solid ${active ? color : "var(--line)"}`, boxShadow: active ? `0 6px 0 ${deep}` : "0 4px 0 var(--line)", overflow: "hidden" }}>
      <div style={{ height: 100, position: "relative", background: locked || soon ? "var(--surface-2)" : `linear-gradient(150deg,${color},${deep})`, display: "grid", placeItems: "center" }}>
        {!locked && !soon && <Icon name={KIND_ICON[kind]} size={40} color="#ffffffcc" />}
        {(locked || soon) && <div style={{ display: "grid", placeItems: "center", gap: 4 }}><Icon name={soon ? "refresh" : "lock"} size={32} color="#B4AA8C" />{premium && <span style={{ fontSize: 10, fontWeight: 900, color: "#C28A00", background: "#FFF1C9", padding: "2px 8px", borderRadius: 999 }}>PREMIUM</span>}</div>}
        {done && <div style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "var(--surface)", display: "grid", placeItems: "center", boxShadow: "0 2px 5px #0003" }}><Icon name="check" size={16} color="#58CC02" /></div>}
        <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 900, color: locked || soon ? "#9A8F6F" : "#ffffffdd", textTransform: "uppercase", letterSpacing: 0.6 }}>{kind}</span>
      </div>
      <div style={{ padding: "10px 12px 12px" }}>
        <h3 style={{ fontFamily: "Nunito", fontSize: 16, fontWeight: 900, color: locked || soon ? "#9A8F6F" : "var(--ink)", margin: 0 }}>{title}</h3>
        <p style={{ fontFamily: "Nunito", fontSize: 12, fontWeight: 700, color: "var(--ink-faint)", margin: "3px 0 0" }}>{sub}</p>
        {done && <div style={{ display: "flex", gap: 3, marginTop: 7 }}>{[0, 1, 2].map((i) => <Icon key={i} name="star" size={16} color={i < stars ? "#F5B800" : "#E4DCC0"} />)}</div>}
        {active && <div style={{ marginTop: 9 }}><ProgressBar value={60} color={color} height={9} /><span style={{ fontFamily: "Nunito", fontSize: 11, fontWeight: 800, color, marginTop: 4, display: "block" }}>60% · Continue</span></div>}
      </div>
    </div>
  );
}
function DemoToggle() {
  const [on, setOn] = useCS(true);
  return (
    <button onClick={() => setOn(!on)} style={{ width: 56, height: 32, borderRadius: 999, border: "none", cursor: "pointer", background: on ? "#58CC02" : "#D8CDA9", position: "relative", transition: "background .2s" }}>
      <span style={{ position: "absolute", top: 3, left: on ? 27 : 3, width: 26, height: 26, borderRadius: "50%", background: "var(--surface)", boxShadow: "0 2px 4px #0003", transition: "left .2s" }} />
    </button>
  );
}

/* ============================ SHEET ============================== */
const TOKENS = [
  ["Brand green", "#58CC02", "primary CTAs, success"],
  ["Green dark", "#46A302", "button plates, pressed"],
  ["Cream", "#FFFAEC", "app background"],
  ["Butter / gold", "#F5B800", "XP, premium accent"],
  ["Sky blue", "#5BB8E3", "info, Bluetooth/LED"],
  ["Streak orange", "#FF7A52", "streak (→ #C2410C)"],
  ["Error red", "#FF4B4B", "errors, hearts"],
  ["Ink", "#2D2A26", "primary text"],
  ["Line", "var(--line)", "borders, dividers"],
];
const PURPLE = "#9b6bff";

function MoodGrid() {
  const moods = ["cool", "teach", "conduct", "cheer", "trophy", "wow", "idea", "sad", "nervous", "confused", "love", "magician", "painter", "rebel", "astronaut", "welcome-piano"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 14 }}>
      {moods.map((m) => (
        <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Maestro mood={m} size={66} bg="#FFF0CE" ring={3} ringColor="var(--line)" />
          <span style={{ fontFamily: "Nunito", fontSize: 11.5, fontWeight: 800, color: "var(--ink-soft)" }}>{m}</span>
        </div>
      ))}
    </div>
  );
}

function ComponentSheet() {
  const [bright, setBright] = useCS(70);
  const lit = { 60: "#58CC02", 64: "#F5B800", 67: "#5BB8E3" };
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 28px 80px" }}>
      {/* header */}
      <header style={{ padding: "40px 0 24px", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(150deg,#6FE018,#46A302)", display: "grid", placeItems: "center", boxShadow: "0 5px 0 #3D8E00" }}><Icon name="music" size={34} color="#fff" /></div>
        <div>
          <h1 style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 40, color: "var(--ink)", margin: 0, letterSpacing: -1 }}>Component Sheet</h1>
          <p style={{ fontFamily: "Nunito", fontWeight: 800, fontSize: 17, color: "#8A806A", margin: "2px 0 0" }}>Piano Professor design system · buildable in React Native</p>
        </div>
      </header>

      <Section id="color" n="01" title="Color" sub="The full brand palette. Use green for the one primary action per screen; gold for premium/XP; sky for hardware/info.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {TOKENS.map(([name, hex, use]) => (
            <div key={hex} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, border: "1.5px solid #ECE3C9" }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: hex, border: "1px solid #00000012", flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 15, color: "var(--ink)" }}>{name}</div>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "var(--ink-faint)" }}>{hex}</div>
                <div style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 12, color: "#8A806A" }}>{use}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="type" n="02" title="Typography" sub="Nunito throughout. Black (900) for headings & numbers, ExtraBold (800) for body & labels. Rounded and friendly.">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[["Display / 900", 46], ["Heading / 900", 30], ["Title / 900", 22], ["Body / 800", 18], ["Label / 800", 14], ["Caption / 800", 12]].map(([n, sz]) => (
            <div key={n} style={{ display: "flex", alignItems: "baseline", gap: 20, borderBottom: "1.5px solid #F3EFE0", paddingBottom: 12 }}>
              <span style={{ fontFamily: "Nunito", fontWeight: 800, fontSize: 12, color: "var(--ink-faint)", width: 130, flexShrink: 0 }}>{n} · {sz}px</span>
              <span style={{ fontFamily: "Nunito", fontWeight: n.includes("800") ? 800 : 900, fontSize: sz, color: "var(--ink)" }}>Learn piano, fast</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="buttons" n="03" title="Chunky buttons" sub="The signature control: a gradient face sitting on a darker bottom 'plate' that compresses on press. Uppercase label, big tap target.">
        <Label>Variants (size md)</Label>
        <Row style={{ marginBottom: 22 }}>
          <ChunkyButton variant="green">Green</ChunkyButton>
          <ChunkyButton variant="gold">Gold</ChunkyButton>
          <ChunkyButton variant="sky">Sky</ChunkyButton>
          <ChunkyButton variant="streak">Streak</ChunkyButton>
          <ChunkyButton variant="danger">Danger</ChunkyButton>
          <ChunkyButton variant="white">White</ChunkyButton>
          <ChunkyButton variant="dark">Dark</ChunkyButton>
          <ChunkyButton variant="ghost">Ghost</ChunkyButton>
        </Row>
        <Label>Sizes</Label>
        <Row style={{ marginBottom: 22 }}>
          <ChunkyButton variant="green" size="sm">Small</ChunkyButton>
          <ChunkyButton variant="green" size="md">Medium</ChunkyButton>
          <ChunkyButton variant="green" size="lg">Large</ChunkyButton>
          <ChunkyButton variant="green" size="xl">X-Large</ChunkyButton>
        </Row>
        <Label>States & options</Label>
        <Row>
          <ChunkyButton variant="green" glow>Glow</ChunkyButton>
          <ChunkyButton variant="green" icon={<Icon name="play" size={20} color="#fff" />}>With icon</ChunkyButton>
          <ChunkyButton variant="green" disabled>Disabled</ChunkyButton>
          <span style={{ fontFamily: "Nunito", fontWeight: 800, fontSize: 13, color: "var(--ink-faint)" }}>← press any button to see the plate compress</span>
        </Row>
        <Note>
          <Code>{"<ChunkyButton variant size full glow disabled icon onClick />"}</Code><br />
          RN: render as a <Code>Pressable</Code> with two stacked <Code>View</Code>s — the colored face and a 4–6px taller dark plate behind it. On <Code>pressIn</Code>, translateY the face down by the plate height and shrink the shadow. Variants map to <Code>[faceTop, faceBottom, plate, text]</Code> color tuples.
        </Note>
      </Section>

      <Section id="chips" n="04" title="Stat chips" sub="Pill counters for the gamification HUD. Emoji + value, white pill with a soft bottom shadow.">
        <Row>
          <StatChip kind="streak" value="12" />
          <StatChip kind="xp" value="3.5k" />
          <StatChip kind="gems" value="240" />
          <StatChip kind="hearts" value="5" />
          <span style={{ width: 18 }} />
          <StatChip kind="streak" value="12" big />
          <StatChip kind="xp" value="3480" big />
          <StatChip kind="gems" value="240" big />
          <StatChip kind="hearts" value="5" big />
        </Row>
        <Note><Code>{"<StatChip kind='streak|xp|gems|hearts' value big onClick />"}</Code> — tappable when <Code>onClick</Code> is set (e.g. hearts → upsell).</Note>
      </Section>

      <Section id="cards" n="05" title="Cards & progress" sub="Rounded white surfaces with a layered bottom shadow. Progress bars use a rounded track with an inner shine.">
        <Row style={{ alignItems: "stretch" }}>
          <Card style={{ width: 240 }}>
            <h3 style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 18, color: "var(--ink)", margin: "0 0 6px" }}>Base card</h3>
            <p style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 14, color: "#8A806A", margin: 0 }}>24px radius · 2px cream border · layered shadow.</p>
          </Card>
          <Card hover style={{ width: 240 }}>
            <h3 style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 18, color: "var(--ink)", margin: "0 0 6px" }}>Hover card</h3>
            <p style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 14, color: "#8A806A", margin: 0 }}>Lifts on hover — pass <Code>hover</Code>.</p>
          </Card>
          <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
            <ProgressBar value={35} color="#58CC02" />
            <ProgressBar value={60} color="#F5B800" />
            <ProgressBar value={85} color="#5BB8E3" />
          </div>
        </Row>
        <Note><Code>{"<Card pad hover onClick />"}</Code> · <Code>{"<ProgressBar value color track height />"}</Code></Note>
      </Section>

      <Section id="posters" n="06" title="Poster cards & shelves" sub="The Netflix-shelf building block. One card type covers lessons, songs, concepts and exercises across every state.">
        <Row style={{ alignItems: "flex-start" }}>
          <Tile label="done · 3 stars" w={188}><DemoPoster title="Pop Chords I" sub="C · G · Am · F" kind="lesson" state="done" stars={3} /></Tile>
          <Tile label="active · in progress" w={188}><DemoPoster title="Both Hands" sub="Left + right" kind="lesson" state="active" /></Tile>
          <Tile label="locked" w={188}><DemoPoster title="Let It Be" sub="The Beatles" kind="song" state="locked" /></Tile>
          <Tile label="premium-gated" w={188}><DemoPoster title="Circle of 5ths" sub="Why keys work" kind="concept" state="locked" premium /></Tile>
          <Tile label="coming soon" w={188}><DemoPoster title="Chord Sprint" sub="Speed drill" kind="exercise" state="soon" /></Tile>
        </Row>
        <Note>Kinds: <Code>lesson</Code> <Code>song</Code> <Code>concept</Code> <Code>exercise</Code>. States: <Code>done</Code> (✓ + stars) · <Code>active</Code> (progress bar) · <Code>locked</Code> · <Code>locked+premium</Code> · <Code>soon</Code>. A shelf is a horizontal <Code>FlatList</Code> of these with a colored level dot + title.</Note>
      </Section>

      <Section id="mascot" n="07" title="Maestro — the mascot" sub="A friendly penguin in a Beethoven wig + bowtie. Used subtly: avatars, narration, empty/celebration/error states. Many moods.">
        <MoodGrid />
        <Note><Code>{"<Maestro mood size bg ring ringColor float onClick />"}</Code> — circular avatar crop. Moods are individual PNG assets in <Code>assets/maestro/</Code>.</Note>
      </Section>

      <Section id="piano" n="08" title="Piano keyboard + LED strip" sub="The hero of the lesson player. Keys glow with per-note colors; the LED strip above mirrors the real hardware.">
        <div style={{ maxWidth: 560 }}>
          <Piano low={60} high={72} lit={lit} labels={{ 60: "C", 64: "E", 67: "G" }} led interactive={false} height={150} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, maxWidth: 420 }}>
          <Icon name="sound" size={18} color="#A99F82" />
          <input type="range" min="10" max="100" value={bright} onChange={(e) => setBright(+e.target.value)} style={{ flex: 1, accentColor: "#58CC02" }} />
          <span style={{ fontFamily: "Nunito", fontWeight: 900, color: "var(--ink)", width: 46 }}>{bright}%</span>
        </div>
        <Note><Code>{"<Piano low high lit={{midi:color}} labels fingerings led onPlay interactive height />"}</Code> — <Code>lit</Code> maps MIDI note → glow color, mirrored on the LED strip. RN: render keys as absolutely-positioned Views; drive glow + audio from the same note map.</Note>
      </Section>

      <Section id="controls" n="09" title="Form controls" sub="Segmented control for 2–3 choices, toggle for on/off, plus the icon set.">
        <Row style={{ marginBottom: 20 }}>
          <div><Label>Segmented</Label><SegmentedDemo /></div>
          <div style={{ marginLeft: 30 }}><Label>Toggle</Label><DemoToggle /></div>
        </Row>
        <Label>Icon set (2.4px stroke)</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 14, marginTop: 6 }}>
          {["home", "library", "piano", "user", "gear", "bluetooth", "play", "pause", "lock", "check", "plus", "close", "star", "flame", "bolt", "gem", "heart", "crown", "sparkle", "music", "book", "grad", "mic", "bell", "sound", "camera", "image", "sliders", "swap", "pencil", "trash", "wifi", "target", "refresh", "arrowRight", "chevronRight", "chevronLeft", "headphones"].map((n) => (
            <div key={n} style={{ display: "grid", placeItems: "center", padding: 8, borderRadius: 10, background: "#FBF8EE" }} title={n}><Icon name={n} size={22} color="var(--ink)" /></div>
          ))}
        </div>
      </Section>

      <footer style={{ textAlign: "center", padding: "30px 0 0", fontFamily: "Nunito", fontWeight: 800, fontSize: 14, color: "var(--ink-faint)" }}>
        Piano Professor · component reference for React Native handoff
      </footer>
    </div>
  );
}

function SegmentedDemo() {
  const [v, setV] = useCS("a");
  return <Segmented options={[{ label: "Chords", value: "a" }, { label: "Soloist", value: "b" }]} value={v} onChange={setV} />;
}

ReactDOM.createRoot(document.getElementById("cs-root")).render(<ComponentSheet />);
