/* ===================================================================
   Piano Professor — Design System Core
   Tokens live in CSS (Piano Professor.html). This module exposes:
   audio engine, note utilities, and shared brand components.
   =================================================================== */
const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ----------------------------- AUDIO ------------------------------ */
const PP_Audio = (() => {
  let ctx = null;
  let master = null;
  let muted = false;
  const ensure = () => {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const note = (midi, when = 0, dur = 2.6, vel = 0.9) => {
    if (muted) return;
    const c = ensure();
    const t0 = c.currentTime + when;
    const f = midiToFreq(midi);
    const g = c.createGain();
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(4600, t0);
    lp.frequency.exponentialRampToValueAtTime(1400, t0 + dur);
    const o1 = c.createOscillator(); o1.type = "triangle"; o1.frequency.value = f;
    const o2 = c.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2.001;
    const g2 = c.createGain(); g2.gain.value = 0.22;
    // pedaled envelope: quick attack, gentle decay to a long sustain, slow release tail
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vel, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.42 * vel, t0 + 0.5);
    g.gain.exponentialRampToValueAtTime(0.16 * vel, t0 + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.6);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(master);
    o1.start(t0); o2.start(t0); o1.stop(t0 + dur + 0.7); o2.stop(t0 + dur + 0.7);
  };
  const chord = (midis, dur = 3.0) => midis.forEach((m, i) => note(m, i * 0.014, dur, 0.7));
  const arp = (midis, gap = 0.13) => midis.forEach((m, i) => note(m, i * gap, 2.2, 0.8));
  // simple UI blips
  const blip = (freq, dur = 0.12, type = "sine", vel = 0.4) => {
    if (muted) return;
    const c = ensure(); const t0 = c.currentTime;
    const o = c.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vel, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  };
  const success = () => { [72, 76, 79, 84].forEach((m, i) => note(m, i * 0.09, 0.9, 0.7)); };
  const correct = () => { note(76, 0, 0.5, 0.7); note(81, 0.08, 0.7, 0.6); };
  const wrong = () => { blip(180, 0.18, "sawtooth", 0.3); blip(140, 0.22, "sawtooth", 0.25); };
  let lastTap = 0;
  const haptic = (ms = 10) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
  const tap = () => { const now = Date.now(); if (now - lastTap < 60) return; lastTap = now; haptic(9); blip(880, 0.05, "sine", 0.14); };
  const star = (i) => note(72 + i * 4, 0, 1.0, 0.7);

  /* -------- ambient relaxed piano (everywhere except lessons) -------- */
  let ambEnabled = true, ambSuppressed = false, ambTimer = null, started = false;
  const AMB = [60, 62, 64, 67, 69, 72, 64, 67]; // gentle C-pentatonic wander
  let ambIdx = 0;
  const softNote = (midi, dur = 3.4, vel = 0.07) => {
    if (muted) return;
    const c = ensure(); const t0 = c.currentTime;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const g = c.createGain(); const lp = c.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1100;
    const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = f;
    const o2 = c.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2; const g2 = c.createGain(); g2.gain.value = 0.18;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vel, t0 + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(master);
    o.start(t0); o2.start(t0); o.stop(t0 + dur + 0.1); o2.stop(t0 + dur + 0.1);
  };
  const ambStep = () => {
    if (muted || !ambEnabled || ambSuppressed) return;
    const n = AMB[ambIdx % AMB.length]; ambIdx++;
    softNote(n);
    if (Math.random() > 0.5) softNote(n + (Math.random() > 0.5 ? 4 : 7), 3.0, 0.05);
  };
  const ambEval = () => {
    if (ambEnabled && !ambSuppressed && !muted && started) {
      if (!ambTimer) { ambStep(); ambTimer = setInterval(ambStep, 2600); }
    } else if (ambTimer) { clearInterval(ambTimer); ambTimer = null; }
  };
  const setAmbientEnabled = (on) => { ambEnabled = on; ambEval(); };
  const setAmbientSuppressed = (s) => { ambSuppressed = s; ambEval(); };
  const isAmbientEnabled = () => ambEnabled;
  const kickAmbient = () => { started = true; ambEval(); };

  return {
    note, chord, arp, success, correct, wrong, tap, star, blip, haptic,
    setMuted: (m) => { muted = m; if (m) ambEval(); }, isMuted: () => muted, ensure,
    setAmbientEnabled, setAmbientSuppressed, isAmbientEnabled, kickAmbient,
  };
})();

/* --------------------------- NOTE UTILS --------------------------- */
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const isBlack = (midi) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
const midiName = (midi) => NOTE_NAMES[((midi % 12) + 12) % 12];
const midiOct = (midi) => Math.floor(midi / 12) - 1;

/* ------------------------------ ICONS ----------------------------- */
function Icon({ name, size = 24, color = "currentColor", style }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", style };
  const paths = {
    chevronRight: <polyline points="9 6 15 12 9 18" />,
    chevronLeft: <polyline points="15 6 9 12 15 18" />,
    chevronDown: <polyline points="6 9 12 15 18 9" />,
    close: <g><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></g>,
    check: <polyline points="4 12 10 18 20 6" />,
    plus: <g><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></g>,
    lock: <g><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></g>,
    play: <path d="M7 5l12 7-12 7z" fill={color} stroke="none" />,
    pause: <g><rect x="6" y="5" width="4" height="14" rx="1.2" fill={color} stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1.2" fill={color} stroke="none" /></g>,
    gear: <g><circle cx="12" cy="12" r="3.2" /><path d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18 6l-1.8 1.8M7.8 16.2 6 18M18 18l-1.8-1.8M7.8 7.8 6 6" /></g>,
    bluetooth: <path d="M7 7l10 10-5 4V3l5 4L7 17" />,
    gridShelf: <g><rect x="3" y="4" width="7" height="7" rx="1.6" /><rect x="14" y="4" width="7" height="7" rx="1.6" /><rect x="3" y="14" width="7" height="7" rx="1.6" /><rect x="14" y="14" width="7" height="7" rx="1.6" /></g>,
    home: <path d="M4 11l8-7 8 7M6 10v9h12v-9" />,
    library: <g><path d="M5 4v16M9 4v16" /><rect x="13" y="4" width="6" height="16" rx="1.4" /></g>,
    piano: <g><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M8 5v9M13 5v9M18 5v9M3 14h18" /></g>,
    user: <g><circle cx="12" cy="8" r="4" /><path d="M5 20c0-3.9 3.1-6 7-6s7 2.1 7 6" /></g>,
    star: <path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17.8 6.1 20.3l1.3-6.2L2.7 9.5l6.3-.7z" fill={color} stroke="none" />,
    starline: <path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17.8 6.1 20.3l1.3-6.2L2.7 9.5l6.3-.7z" />,
    flame: <path d="M12 3c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1.5-1-3-2-4 .4 2-1 3-1 3 .5-3-1-5-1-6zM12 21a5 5 0 0 1-5-5c0-2 1-3 2-4" />,
    bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" fill={color} stroke="none" />,
    gem: <path d="M6 3h12l3 6-9 12L3 9z M3 9h18 M9 3l-1 6 4 12 4-12-1-6" />,
    heart: <path d="M12 21c-7-4.5-9-8-9-11.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 3.5C21 13 19 16.5 12 21z" fill={color} stroke="none" />,
    mic: <g><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4" /></g>,
    bell: <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 21a2 2 0 0 0 4 0" />,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" fill={color} stroke="none" />,
    shield: <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />,
    sound: <g><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a3 3 0 0 1 0 6M18.5 7a6 6 0 0 1 0 10" /></g>,
    mute: <g><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M22 9l-5 6M17 9l5 6" /></g>,
    image: <g><rect x="3" y="4" width="18" height="16" rx="2.4" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5-5L5 20" /></g>,
    camera: <g><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.4" /></g>,
    sliders: <g><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" /><circle cx="9" cy="8" r="2.3" fill="var(--cream)" /><circle cx="15" cy="16" r="2.3" fill="var(--cream)" /></g>,
    swap: <path d="M7 7h11l-3-3M17 17H6l3 3" />,
    pencil: <path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" />,
    trash: <g><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></g>,
    bolt2: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
    crown: <path d="M3 17l2-9 4 5 3-7 3 7 4-5 2 9z M3 17h18v3H3z" />,
    sparkle: <path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z" fill={color} stroke="none" />,
    wifi: <path d="M5 12a10 10 0 0 1 14 0M8 15.5a5 5 0 0 1 8 0M12 19h.01" />,
    arrowRight: <g><line x1="4" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></g>,
    refresh: <path d="M20 11a8 8 0 1 0-1 5M20 5v6h-6" />,
    target: <g><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill={color} /></g>,
    music: <g><ellipse cx="8.5" cy="17.5" rx="3.6" ry="2.7" fill={color} stroke="none" transform="rotate(-18 8.5 17.5)" /><path d="M11.7 16.4V4.5c3.2.5 5.3 2.2 5.3 5.2" /></g>,
    book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM6 17h13" />,
    headphones: <path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 1 4 0v3a2 2 0 0 1-4 0zM20 14a2 2 0 0 0-4 0v3a2 2 0 0 0 4 0z" />,
    grad: <path d="M3 9l9-4 9 4-9 4zM7 11v5c0 1 2.5 2.5 5 2.5s5-1.5 5-2.5v-5" />,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

/* --------------------------- CHUNKY BUTTON ------------------------ */
function ChunkyButton({ children, variant = "green", size = "md", full, disabled, onClick, style, icon, type, glow }) {
  const palette = {
    green: ["#6FE018", "#58CC02", "#3D8E00", "#fff"],
    gold:  ["#FFCB2E", "#F5B800", "#C28A00", "#5a3d00"],
    sky:   ["#56B4E8", "#2F9BD6", "#1E6E99", "#fff"],
    streak:["#FF8F66", "#FF7A52", "#C2410C", "#fff"],
    danger:["#FF6B6B", "#FF4B4B", "#C81E1E", "#fff"],
    white: ["#FFFFFF", "#FFFFFF", "#E2D9BE", "#2E84AD"],
    dark:  ["#4B4742", "#393632", "#1c1a17", "#fff"],
    ghost: ["transparent", "transparent", "transparent", "var(--ink)"],
  }[variant] || ["#6FE018", "#58CC02", "#3D8E00", "#fff"];
  const sizes = {
    sm: { pad: "9px 16px", fs: 15, plate: 4, radius: 14 },
    md: { pad: "14px 24px", fs: 18, plate: 5, radius: 18 },
    lg: { pad: "18px 30px", fs: 21, plate: 6, radius: 22 },
    xl: { pad: "22px 38px", fs: 25, plate: 6, radius: 26 },
  }[size];
  const [press, setPress] = useState(false);
  const isGhost = variant === "ghost";
  return (
    <button
      type={type || "button"}
      disabled={disabled}
      onPointerDown={() => !disabled && (setPress(true), PP_Audio.tap())}
      onPointerUp={() => setPress(false)}
      onPointerLeave={() => setPress(false)}
      onClick={(e) => !disabled && onClick && onClick(e)}
      style={{
        position: "relative", border: "none", background: "transparent",
        padding: 0, width: full ? "100%" : "auto", cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1, fontFamily: "Nunito, sans-serif",
        WebkitTapHighlightColor: "transparent", touchAction: "manipulation", ...style,
      }}
    >
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        padding: sizes.pad, fontSize: sizes.fs, fontWeight: 800, letterSpacing: 0.3,
        color: palette[3], borderRadius: sizes.radius,
        background: isGhost ? "transparent" : `linear-gradient(180deg, ${palette[0]}, ${palette[1]})`,
        border: variant === "white" ? "2px solid var(--line)" : isGhost ? "2px solid var(--line)" : "none",
        boxShadow: isGhost ? "none" : `0 ${press ? 1 : sizes.plate}px 0 ${palette[2]}${glow ? `, 0 8px 26px ${palette[1]}66` : ""}`,
        transform: `translateY(${press ? sizes.plate - 1 : 0}px)`,
        transition: "transform .04s, box-shadow .04s", whiteSpace: "nowrap",
        textTransform: variant === "ghost" ? "none" : "uppercase",
      }}>
        {icon}{children}
      </span>
    </button>
  );
}

/* ----------------------------- STAT CHIP -------------------------- */
const STAT_META = {
  streak: { emoji: "🔥", color: "#FF7A52", ink: "#C2410C" },
  xp:     { emoji: "⚡", color: "#F5B800", ink: "#9A6E00" },
  gems:   { emoji: "💎", color: "#5BB8E3", ink: "#2E84AD" },
  hearts: { emoji: "❤️", color: "#FF4B4B", ink: "#C81E1E" },
};
function StatChip({ kind, value, onClick, big }) {
  const m = STAT_META[kind];
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: big ? 8 : 6,
      padding: big ? "8px 16px 8px 12px" : "5px 13px 5px 9px",
      borderRadius: 999, border: "2px solid #00000010",
      background: "var(--surface)", boxShadow: "0 2px 0 #00000010",
      fontFamily: "Nunito", fontWeight: 900, fontSize: big ? 22 : 17,
      color: m.ink, cursor: onClick ? "pointer" : "default", lineHeight: 1,
    }}>
      <span style={{ fontSize: big ? 22 : 18, filter: "saturate(1.1)" }}>{m.emoji}</span>
      <span>{value}</span>
    </button>
  );
}

/* ------------------------------ MAESTRO --------------------------- */
const MAESTRO = {
  base: "assets/maestro/", 
};
function Maestro({ mood = "cool", size = 96, ring, ringColor = "#F5B800", bg, float, style, onClick, fit = "body" }) {
  const imgStyle = fit === "head"
    ? { width: "118%", height: "118%", objectFit: "cover", objectPosition: "center 18%" }
    : { width: "100%", height: "100%", objectFit: "contain", objectPosition: "center 58%" };
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: "50%",
      background: bg || "var(--cream)",
      display: "grid", placeItems: "center", flexShrink: 0,
      boxShadow: ring ? `0 0 0 ${ring}px ${ringColor}` : "none",
      overflow: "hidden", position: "relative",
      animation: float ? "pp-float 3.2s ease-in-out infinite" : "none",
      cursor: onClick ? "pointer" : "default", ...style,
    }}>
      <img src={(window.__resources && window.__resources[mood]) || (MAESTRO.base + mood + ".png")} alt="Maestro" style={imgStyle} />
    </div>
  );
}

/* ------------------------------ CARD ------------------------------ */
function Card({ children, style, pad = 20, onClick, hover }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: "var(--surface)", borderRadius: 24, padding: pad,
        border: "2px solid var(--line)",
        boxShadow: hover && h ? "0 14px 30px #00000018" : "0 4px 0 var(--line), 0 10px 22px #0000000c",
        transform: hover && h ? "translateY(-3px)" : "none",
        transition: "transform .15s, box-shadow .15s",
        cursor: onClick ? "pointer" : "default", ...style,
      }}>
      {children}
    </div>
  );
}

/* --------------------------- PROGRESS BAR ------------------------- */
function ProgressBar({ value, height = 14, color = "#58CC02", track = "var(--line)", style, shine = true }) {
  return (
    <div style={{ height, borderRadius: 999, background: track, overflow: "hidden", width: "100%", ...style }}>
      <div style={{
        width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", borderRadius: 999,
        background: color, transition: "width .5s cubic-bezier(.5,1.5,.5,1)", position: "relative",
      }}>
        {shine && <div style={{ position: "absolute", top: 2, left: 6, right: 6, height: Math.max(2, height / 3.5), borderRadius: 999, background: "#ffffff66" }} />}
      </div>
    </div>
  );
}

/* ---------------------------- CONFETTI ---------------------------- */
function Confetti({ run = true, count = 120 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!run) return;
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width = cv.offsetWidth, H = cv.height = cv.offsetHeight;
    const cols = ["#58CC02", "#F5B800", "#5BB8E3", "#FF7A52", "#FF4B4B", "#9b59ff"];
    const parts = Array.from({ length: count }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 120, y: H / 2 - 40,
      vx: (Math.random() - 0.5) * 16, vy: Math.random() * -16 - 6,
      g: 0.42 + Math.random() * 0.2, s: 6 + Math.random() * 8,
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
      c: cols[(Math.random() * cols.length) | 0], life: 0, shape: Math.random() > 0.5,
    }));
    let raf, t = 0;
    const tick = () => {
      t++; ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr; p.life++;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - p.life / 160);
        if (p.shape) ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 6.28); ctx.fill(); }
        ctx.restore();
      });
      if (t < 200) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [run, count]);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 50 }} />;
}

/* ----------------------------- SPARKLE ---------------------------- */
function Sparkles({ children }) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {children}
      {[..."1234"].map((_, i) => (
        <span key={i} style={{
          position: "absolute", fontSize: 14 + (i % 2) * 6,
          top: ["-8%", "70%", "10%", "85%"][i], left: ["-6%", "-9%", "98%", "92%"][i],
          animation: `pp-twinkle 1.6s ${i * 0.3}s ease-in-out infinite`,
        }}>✨</span>
      ))}
    </span>
  );
}

/* ----------------------------- SEGMENT ---------------------------- */
function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--seg-track)", borderRadius: 14, padding: 4, gap: 4 }}>
      {options.map((o) => (
        <button key={o.value} onClick={() => { onChange(o.value); PP_Audio.tap(); }}
          style={{
            border: "none", borderRadius: 11, padding: "8px 18px", cursor: "pointer",
            fontFamily: "Nunito", fontWeight: 800, fontSize: 15,
            background: value === o.value ? "var(--seg-active)" : "transparent",
            color: value === o.value ? "var(--ink)" : "var(--ink-faint)",
            boxShadow: value === o.value ? "0 2px 0 var(--line)" : "none", transition: "all .12s",
          }}>{o.label}</button>
      ))}
    </div>
  );
}

Object.assign(window, {
  PP_Audio, NOTE_NAMES, isBlack, midiName, midiOct,
  Icon, ChunkyButton, StatChip, STAT_META, Maestro, MAESTRO, Card, ProgressBar, Confetti, Sparkles, Segmented,
});

/* ----------------------------- SHIMMER ---------------------------- */
function Shimmer({ w = "100%", h = 16, r = 8, style }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg, #ECE3C9 0px, #F6EFD8 120px, #ECE3C9 240px)",
      backgroundSize: "600px 100%", animation: "pp-shimmer 1.3s linear infinite", ...style,
    }} />
  );
}

/* ------------------------- STATE SCAFFOLD ------------------------- */
/* Centered empty/error state: Maestro mood + headline + body + actions */
function StateScaffold({ mood, moodBg = "#FFF0CE", title, body, primary, secondary, tone = "ink", icon }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 40, textAlign: "center" }}>
      {mood && <Maestro mood={mood} size={132} bg={moodBg} ring={6} ringColor="#fff" float style={{ marginBottom: 10, boxShadow: "0 12px 30px #0002" }} />}
      {icon && <div style={{ marginBottom: 8 }}>{icon}</div>}
      <h1 style={{ fontSize: 34, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{title}</h1>
      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.4, maxWidth: 460, margin: "8px 0 22px" }}>{body}</p>
      <div style={{ display: "flex", gap: 14 }}>
        {secondary}
        {primary}
      </div>
    </div>
  );
}

Object.assign(window, { Shimmer, StateScaffold });

/* --------------------------- LANG DROPDOWN ------------------------ */
function LangDropdown({ value, onChange, compact }) {
  const [open, setOpen] = useState(false);
  const langs = window.PP_LANGS || [];
  const cur = langs.find((l) => l.code === value) || langs[0];
  if (!cur) return null;
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => { setOpen((o) => !o); PP_Audio.tap(); }} style={{
        display: "flex", alignItems: "center", gap: compact ? 7 : 9, cursor: "pointer",
        padding: compact ? "8px 12px" : "11px 16px", borderRadius: 13, fontFamily: "Nunito",
        border: "2.5px solid var(--line)", background: "var(--surface)", boxShadow: "0 3px 0 var(--line)",
        fontWeight: 800, fontSize: compact ? 15 : 17, color: "var(--ink)",
      }}>
        <span style={{ fontSize: compact ? 18 : 20 }}>{cur.flag}</span>
        <span>{cur.native}</span>
        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s", marginLeft: "auto", display: "flex" }}><Icon name="chevronDown" size={18} color="#B4AA8C" /></span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200 }} />
          <div className="pp-scroll" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 201, minWidth: "100%", maxHeight: 232, overflowY: "auto", background: "var(--surface)", border: "2px solid var(--line)", borderRadius: 14, boxShadow: "0 14px 36px #0003", padding: 6 }}>
            {langs.map((l) => {
              const on = l.code === value;
              return (
                <button key={l.code} onClick={() => { onChange(l.code); setOpen(false); PP_Audio.correct(); }} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: on ? "var(--sel-sky)" : "transparent", fontFamily: "Nunito", fontWeight: 800, fontSize: 15, color: "var(--ink)", whiteSpace: "nowrap",
                }}>
                  <span style={{ fontSize: 19 }}>{l.flag}</span>
                  <span style={{ flex: 1 }}>{l.native}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-faint)" }}>{l.label}</span>
                  {on && <Icon name="check" size={16} color="#2E84AD" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { LangDropdown });

/* ------------------------- MICROPHONE PERMISSION ------------------ */
/* Plain-English reason shown in onboarding + settings (App Store / Play requirement) */
const MIC_REASON = "Piano Professor listens through your device's microphone to hear the notes you play and give instant feedback. Audio stays on your device — it's never recorded, saved, or shared.";
function MicSheet({ title, primaryLabel, secondaryLabel, onAllow, onClose, compact, lang = "en" }) {
  const tt = (k, fb) => (window.t ? window.t(k, lang) : fb);
  title = title || tt("mic.title", "Microphone access");
  primaryLabel = primaryLabel || tt("mic.allow", "Allow microphone");
  secondaryLabel = secondaryLabel || tt("mic.notNow", "Not now");
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 120, background: "rgba(20,16,10,.55)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: compact ? 380 : 470, maxWidth: "94%", background: "var(--surface)", borderRadius: 24, padding: compact ? "20px 22px" : "26px 30px", boxShadow: "0 24px 60px #0007", textAlign: "center", animation: "pp-pop .3s", border: "2px solid var(--line)" }}>
        <div style={{ position: "relative", width: compact ? 92 : 116, height: compact ? 92 : 116, margin: "0 auto 10px" }}>
          <Maestro mood="teach" size={compact ? 92 : 116} bg="#EAF8DC" ring={5} ringColor="var(--surface)" float />
          <div style={{ position: "absolute", bottom: 0, right: 2, width: compact ? 34 : 42, height: compact ? 34 : 42, borderRadius: "50%", background: "linear-gradient(180deg,#6FE018,#46A302)", display: "grid", placeItems: "center", boxShadow: "0 4px 0 #3D8E00", border: "2px solid var(--surface)" }}><Icon name="mic" size={compact ? 17 : 21} color="#fff" /></div>
        </div>
        <h2 style={{ fontSize: compact ? 20 : 24, fontWeight: 900, color: "var(--ink)", margin: "0 0 8px" }}>{title}</h2>
        <p style={{ fontSize: compact ? 13.5 : 15.5, fontWeight: 700, color: "var(--ink-soft)", lineHeight: 1.45, margin: "0 auto 14px", maxWidth: 380 }}>{tt("mic.reason", MIC_REASON)}</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface-2)", borderRadius: 999, padding: "7px 14px", marginBottom: 18 }}>
          <Icon name="shield" size={16} color="#58CC02" /><span style={{ fontSize: compact ? 12 : 13, fontWeight: 800, color: "var(--ink-soft)" }}>{tt("mic.onDevice", "Processed on-device · never shared")}</span>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {onClose && <ChunkyButton variant="ghost" size={compact ? "sm" : "md"} onClick={onClose}>{secondaryLabel}</ChunkyButton>}
          {onAllow && <ChunkyButton variant="green" size={compact ? "sm" : "md"} glow onClick={onAllow} icon={<Icon name="mic" size={18} color="#fff" />}>{primaryLabel}</ChunkyButton>}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { MIC_REASON, MicSheet });
