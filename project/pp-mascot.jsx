// Piano Professor — Mascot
// "Maestro Penguini" — a Beethoven-style penguin teacher.
//
// All mascot renders are PNG stickers cropped from the user-provided
// sticker sheets (V1/V2/V3). Each sticker is an emotion/mood/skill
// state. The same image is reused in three render modes:
//   - <ProfessorCat>      flat sticker, sized via `size`
//   - <ProfessorCatHero>  bigger + optional CSS animation
//   - <CatAvatar>         circular head-crop for top bars / chat
//   - <CatChip>           tiny version for path nodes
//
// The "Cat" names are kept for back-compat with existing screen
// components; they now render the penguin.

const PENGUIN_MOODS = {
  // happy/positive
  happy:    'assets/mascots/cheer.png',
  cheer:    'assets/mascots/cheer.png',
  love:     'assets/mascots/love.png',
  trophy:   'assets/mascots/trophy.png',
  conduct:  'assets/mascots/conduct.png',
  star:     'assets/mascots/star.png',
  swoon:    'assets/mascots/swoon.png',
  wow:      'assets/mascots/wow.png',
  cool:     'assets/mascots/cool.png',
  zen:      'assets/mascots/zen.png',
  violin:   'assets/mascots/violin.png',

  // teaching / neutral
  teach:    'assets/mascots/teach.png',
  idea:     'assets/mascots/idea.png',
  think:    'assets/mascots/idea.png',
  epiphany: 'assets/mascots/epiphany.png',
  confused: 'assets/mascots/confused.png',

  // negative / struggle
  sad:      'assets/mascots/sad.png',
  sob:      'assets/mascots/sob.png',
  struggle: 'assets/mascots/struggle.png',
  nervous:  'assets/mascots/nervous.png',
  shocked:  'assets/mascots/shocked.png',
  scared:   'assets/mascots/scared.png',
  tired:    'assets/mascots/tired.png',
  exhausted:'assets/mascots/exhausted.png',
  angry:    'assets/mascots/angry.png',
  rage:     'assets/mascots/rage.png',

  // "skill class" stickers (V3) — for section unlocks, badges, etc.
  rebel:    'assets/mascots/rebel.png',
  futurist: 'assets/mascots/futurist.png',
  drummer:  'assets/mascots/drummer.png',
  bard:     'assets/mascots/bard.png',
  classical:'assets/mascots/classical.png',
  zen2:     'assets/mascots/zen2.png',
  nature:   'assets/mascots/nature.png',
  magician: 'assets/mascots/magician.png',
  painter:  'assets/mascots/painter.png',
  showman:  'assets/mascots/showman.png',
  chef:     'assets/mascots/chef.png',
  astronaut:'assets/mascots/astronaut.png',
};

// Hero scenes — full concert-hall background. For lesson-complete /
// onboarding moments where we want the rich setting.
const PENGUIN_SCENES = {
  default: 'assets/mascots/hero-default.png',
  happy:   'assets/mascots/hero-happy.png',
  sad:     'assets/mascots/hero-sad.png',
  sad2:    'assets/mascots/hero-sad2.png',
};

// Resource override hook: __resources.<key> wins over the bare path.
// Lets bundled/standalone builds inline images by overriding URLs.
function penguinSrc(mood) {
  const path = PENGUIN_MOODS[mood] || PENGUIN_MOODS.teach;
  const key = (path.split('/').pop() || '').replace('.png','');
  const override = (typeof window !== 'undefined' && window.__resources)
    ? window.__resources[key]
    : null;
  return override || path;
}
function sceneSrc(scene) {
  const path = PENGUIN_SCENES[scene] || PENGUIN_SCENES.default;
  const key = (path.split('/').pop() || '').replace('.png','');
  const override = (typeof window !== 'undefined' && window.__resources)
    ? window.__resources[key]
    : null;
  return override || path;
}

// ─── Flat sticker — sized via `size` (sets WIDTH). Aspect ratio
//     varies per sticker, so height auto-scales.
function ProfessorCat({ size = 160, mood = "teach", style = {} }) {
  return (
    <img
      src={penguinSrc(mood)}
      alt={`Maestro Penguini · ${mood}`}
      draggable="false"
      style={{
        width: size, height: 'auto', display:'block',
        userSelect:'none', pointerEvents:'none',
        filter:'drop-shadow(0 4px 6px rgba(42,29,17,0.18))',
        ...style,
      }}
    />
  );
}

// ─── Hero — bigger + optional CSS animation
function ProfessorCatHero({ size = 240, mood = "teach", animate = null, style = {} }) {
  return (
    <div style={{
      width: size,
      display:'flex', alignItems:'flex-end', justifyContent:'center',
      animation:
        animate === 'wander' ? 'ppCatWander 5.4s ease-in-out infinite' :
        animate === 'play'   ? 'ppCatPlay 0.9s ease-in-out infinite'    :
        animate === 'bob'    ? 'ppCatBob 3.2s ease-in-out infinite'     : 'none',
      transformOrigin:'50% 90%',
      ...style,
    }}>
      <img
        src={penguinSrc(mood)}
        alt={`Maestro Penguini · ${mood}`}
        draggable="false"
        style={{
          width:'100%', height:'auto', display:'block',
          userSelect:'none', pointerEvents:'none',
          filter:'drop-shadow(0 8px 14px rgba(42,29,17,0.22))',
        }}
      />
    </div>
  );
}

// ─── Compact head-only avatar — circular crop, shows top portion
//     of the sticker so head + shoulders fill the circle.
function CatAvatar({ size = 56, mood = "happy", ring = true }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(180deg,#FFE6BA,#E5B987)',
      overflow:'hidden', position:'relative',
      boxShadow: ring ? '0 0 0 3px #58CC02, 0 0 0 6px #FFFAEC' : 'none',
      flexShrink: 0,
    }}>
      <img
        src={penguinSrc(mood)}
        alt={`Maestro Penguini · ${mood}`}
        draggable="false"
        style={{
          // The sticker's head is in the top ~55%. Scale up + anchor top
          // so the head fills the circle. width 130% over-fills to crop sides.
          position:'absolute',
          width:'135%', height:'auto',
          left:'50%', top:'4%',
          transform:'translateX(-50%)',
          userSelect:'none', pointerEvents:'none',
        }}
      />
    </div>
  );
}

// ─── Tiny full-body penguin chip (for path nodes etc)
function CatChip({ size = 40, mood = "cheer" }) {
  return (
    <img
      src={penguinSrc(mood)}
      alt=""
      draggable="false"
      style={{
        width: size, height: 'auto', display:'block',
        userSelect:'none', pointerEvents:'none',
        filter:'drop-shadow(0 3px 4px rgba(42,29,17,0.2))',
      }}
    />
  );
}

// ─── Full concert-hall hero scene (for lesson-complete, onboarding etc.)
function PenguinScene({ scene = "default", width = 600, rounded = 16, style = {} }) {
  return (
    <div style={{
      width, aspectRatio:'4 / 3',
      borderRadius: rounded, overflow:'hidden',
      boxShadow:'0 8px 22px rgba(42,29,17,0.18)',
      border:'2px solid var(--ink-line)',
      ...style,
    }}>
      <img
        src={sceneSrc(scene)}
        alt={`Concert hall · ${scene}`}
        draggable="false"
        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
      />
    </div>
  );
}

// ─── Music & UI icons ───────────────────────────────────────────────
function TrebleClef({ size = 24, color = "#2A1D11" }) {
  const w = size * 0.85;
  return (
    <svg
      viewBox="0 0 28 32"
      width={w}
      height={size}
      style={{ display:'block' }}
    >
      <text
        x="14"
        y="26"
        textAnchor="middle"
        fontSize="32"
        fill={color}
        fontFamily='"Bravura Text", "Noto Music", "Apple Symbols", "Segoe UI Symbol", "Cambria Math", serif'
      >𝄞</text>
    </svg>
  );
}

function NoteIcon({ size = 18, color = "#2A1D11" }) {
  return (
    <svg viewBox="0 0 20 24" width={size} height={size * 1.2}>
      <ellipse cx="6" cy="19" rx="5" ry="3.5" fill={color}/>
      <rect x="10" y="3" width="1.8" height="17" fill={color}/>
      <path d="M11.8 3 q8 2 7 9 q-3 -5 -7 -4 z" fill={color}/>
    </svg>
  );
}

function FlameIcon({ size = 18, on = true }) {
  const a = on ? "#FF7A1C" : "#B6A382";
  const b = on ? "#F5B800" : "#DFCB97";
  return (
    <svg viewBox="0 0 24 28" width={size} height={size * 28/24}>
      <path d="M12 2 C 8 8 4 10 4 16 C 4 22 8 26 12 26 C 16 26 20 22 20 16 C 20 12 16 12 14 8 C 14 14 10 10 12 2 Z"
            fill={a}/>
      <path d="M12 9 C 10 13 8 14 8 18 C 8 22 10 24 12 24 C 14 24 16 22 16 18 C 16 16 14 16 13 13 C 13 17 11 14 12 9 Z" fill={b}/>
    </svg>
  );
}

function HeartIcon({ size = 18, on = true }) {
  return (
    <svg viewBox="0 0 24 22" width={size} height={size * 22/24}>
      <path d="M12 21 C 6 16 1 13 1 8 C 1 4 4 1 8 1 C 10 1 11 2 12 4 C 13 2 14 1 16 1 C 20 1 23 4 23 8 C 23 13 18 16 12 21 Z"
            fill={on ? "#FF4B4B" : "rgba(42,29,17,0.18)"}/>
      {on && <path d="M5 5 q2 -1 4 0" stroke="#FFF" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7"/>}
    </svg>
  );
}

function GemIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M6 9 L12 4 L18 9 L12 21 Z" fill="#5BB8E3"/>
      <path d="M6 9 L12 9 L9 5 Z" fill="#7CCEE8"/>
      <path d="M18 9 L12 9 L15 5 Z" fill="#3F8FB6"/>
      <path d="M6 9 L18 9 L12 21 Z" fill="#5BB8E3" opacity="0.7"/>
    </svg>
  );
}

function StarIcon({ size = 16, color = "#F5B800" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M12 2 L14.6 8.6 L22 9.3 L16.5 14.2 L18.1 21.5 L12 17.5 L5.9 21.5 L7.5 14.2 L2 9.3 L9.4 8.6 Z" fill={color}/>
    </svg>
  );
}

function LockIcon({ size = 18, color = "var(--ink-300)" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect x="5" y="11" width="14" height="10" rx="2.5" fill={color}/>
      <path d="M8 11 V8 a4 4 0 0 1 8 0 V11" stroke={color} strokeWidth="2.4" fill="none"/>
    </svg>
  );
}

function CheckIcon({ size = 18, color = "#fff" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M4 12 L10 18 L20 6" stroke={color} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronRight({ size = 18, color = "var(--ink-700)" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M9 5 L17 12 L9 19" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function BluetoothIcon({ size = 22, color = "#fff" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M7 7 L17 17 L12 21 V3 L17 7 L7 17"
            stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PlayIcon({ size = 22, color = "#fff" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M7 4 L20 12 L7 20 Z" fill={color}/>
    </svg>
  );
}

function MiniPiano({ width = 80, height = 28, lit = -1, color = "#58CC02" }) {
  const whites = [0,1,2,3,4,5,6];
  const wKeyW = width / 7;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      {whites.map(i => (
        <g key={i}>
          <rect x={i*wKeyW} y={0} width={wKeyW-0.6} height={height} rx="1.5"
                fill={lit === i ? color : "#FFFAEC"} stroke="#2A1D11" strokeWidth="0.6"/>
        </g>
      ))}
      {[0,1,3,4,5].map(i => (
        <rect key={`b${i}`} x={(i+1)*wKeyW - wKeyW*0.28} y={0}
              width={wKeyW*0.56} height={height*0.6} rx="1.2" fill="#1A1410"/>
      ))}
    </svg>
  );
}

function StatPill({ icon, value, color = "var(--ink-900)" }) {
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'4px 10px 4px 6px',
      background:'#FFFAEC',
      border:'1.5px solid var(--ink-line)',
      borderRadius:999, fontWeight:900, fontSize:14, color,
    }}>
      {icon}<span>{value}</span>
    </div>
  );
}

// ─── Interactive mood cycler ────────────────────────────────────────
// Auto-rotates through a list of moods every `interval` ms. Tapping
// jumps to the next mood immediately. Used in the lesson so students
// see the Maestro "react" to their playing.
function MoodCycler({
  moods = ['teach','idea','cheer','conduct','wow'],
  interval = 2400,
  size = 96,
  variant = 'sticker',  // 'sticker' | 'hero'
  style = {},
}) {
  const [idx, setIdx] = React.useState(0);
  const [bumpKey, setBumpKey] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => {
      setIdx(i => (i + 1) % moods.length);
      setBumpKey(k => k + 1);
    }, interval);
    return () => clearInterval(id);
  }, [moods.length, interval]);

  const next = () => {
    setIdx(i => (i + 1) % moods.length);
    setBumpKey(k => k + 1);
  };

  const Comp = variant === 'hero' ? ProfessorCatHero : ProfessorCat;
  return (
    <div
      onClick={next}
      style={{
        cursor:'pointer', display:'inline-block',
        animation: `ppMoodPop 0.4s ease-out`,
        ...style,
      }}
      key={bumpKey}
      title="Tap to change Maestro's mood"
    >
      <Comp size={size} mood={moods[idx]}/>
    </div>
  );
}
Object.assign(window, { MoodCycler });

// Append the previously-exported names at the end too (idempotent).
Object.assign(window, {
  ProfessorCat, ProfessorCatHero, CatAvatar, CatChip, PenguinScene,
  PENGUIN_MOODS, MoodCycler,
  TrebleClef, NoteIcon, FlameIcon, HeartIcon, GemIcon, StarIcon,
  LockIcon, CheckIcon, ChevronRight, BluetoothIcon, PlayIcon,
  MiniPiano, StatPill,
});
