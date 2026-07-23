/* ===================================================================
   Piano Professor — Maestro Voice layer
   -------------------------------------------------------------------
   PRODUCTION (React Native + Firebase):
     • One Google Cloud TTS "Chirp 3 HD" voice per language = Maestro.
     • Fixed instructional lines are PRE-GENERATED once, stored as audio
       in Firebase Storage, and played instantly (no per-play cost/latency).
     • Only truly dynamic lines (Gemini-generated) hit TTS live.
     • Swap `playClip()` below to fetch the cached Storage URL by (lang,key).

   THIS PROTOTYPE:
     • Uses the browser SpeechSynthesis engine as a stand-in so you can
       feel the experience. It picks ONE consistent browser voice per
       language (matching the manifest's locale) — same idea as one Chirp
       voice per language. The actual timbre will differ from Chirp in prod.
   =================================================================== */

/* The production voice manifest — one Maestro voice per language.
   `chirp` = the Google Cloud TTS voice you'd render with; `locale` = BCP-47. */
const OB_VOICE_MANIFEST = {
  en: { locale: "en-US", chirp: "en-US-Chirp3-HD-Charon" },
  zh: { locale: "zh-CN", chirp: "cmn-CN-Chirp3-HD-Charon" },
  es: { locale: "es-ES", chirp: "es-ES-Chirp3-HD-Charon" },
  fr: { locale: "fr-FR", chirp: "fr-FR-Chirp3-HD-Charon" },
  de: { locale: "de-DE", chirp: "de-DE-Chirp3-HD-Charon" },
  ja: { locale: "ja-JP", chirp: "ja-JP-Chirp3-HD-Charon" },
  ko: { locale: "ko-KR", chirp: "ko-KR-Chirp3-HD-Charon" },
  vi: { locale: "vi-VN", chirp: "vi-VN-Chirp3-HD-Charon" },
  pt: { locale: "pt-BR", chirp: "pt-BR-Chirp3-HD-Charon" },
  it: { locale: "it-IT", chirp: "it-IT-Chirp3-HD-Charon" },
};

const OBVoice = (() => {
  let enabled = true;
  try { const v = localStorage.getItem("ob-voice"); if (v != null) enabled = v === "1"; } catch (e) {}
  let voices = [];
  const listeners = new Set();
  const pickCache = {};

  const synth = (typeof window !== "undefined") ? window.speechSynthesis : null;

  const loadVoices = () => { if (synth) voices = synth.getVoices() || []; };
  if (synth) {
    loadVoices();
    synth.onvoiceschanged = () => { loadVoices(); Object.keys(pickCache).forEach((k) => delete pickCache[k]); };
  }

  /* Choose ONE consistent browser voice per language (best match for the locale). */
  const pickVoice = (lang) => {
    if (pickCache[lang]) return pickCache[lang];
    const loc = (OB_VOICE_MANIFEST[lang] || OB_VOICE_MANIFEST.en).locale;
    const base = loc.split("-")[0].toLowerCase();
    if (!voices.length) loadVoices();
    const norm = (s) => (s || "").toLowerCase().replace("_", "-");
    // 1) exact locale, 2) prefer Google voices, 3) any voice in the language
    let v = voices.find((x) => norm(x.lang) === loc.toLowerCase() && /google/i.test(x.name))
         || voices.find((x) => norm(x.lang) === loc.toLowerCase())
         || voices.find((x) => norm(x.lang).startsWith(base) && /google/i.test(x.name))
         || voices.find((x) => norm(x.lang).startsWith(base))
         || null;
    if (v) pickCache[lang] = v;
    return v;
  };

  /* PROD: replace this with a cached Firebase Storage audio fetch+play. */
  const playClip = (text, lang) => {
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(lang);
    const m = OB_VOICE_MANIFEST[lang] || OB_VOICE_MANIFEST.en;
    if (v) u.voice = v;
    u.lang = m.locale;
    u.rate = 0.98; u.pitch = 1.08; // warm, friendly Maestro
    synth.speak(u);
  };

  const flatten = (node) => {
    if (node == null || node === false) return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(flatten).join(" ");
    if (node.props && node.props.children) return flatten(node.props.children);
    return "";
  };
  // strip emoji / pictographs so the engine doesn't read "party popper"
  const clean = (s) => s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();

  const api = {
    manifest: OB_VOICE_MANIFEST,
    get enabled() { return enabled; },
    isSupported: () => !!synth,
    toggle() { enabled = !enabled; try { localStorage.setItem("ob-voice", enabled ? "1" : "0"); } catch (e) {} if (!enabled && synth) synth.cancel(); listeners.forEach((f) => f(enabled)); return enabled; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    stop() { if (synth) synth.cancel(); },
    /* Speak a line as Maestro. `text` may be a string or React node. */
    say(text, lang = "en") {
      if (!enabled || !synth) return;
      const t = clean(flatten(text));
      if (t) playClip(t, lang);
    },
  };
  return api;
})();

/* Small React hook for the speaker toggle button. */
function useObVoice() {
  const [on, setOn] = React.useState(OBVoice.enabled);
  React.useEffect(() => OBVoice.subscribe(setOn), []);
  return { on, toggle: () => OBVoice.toggle(), supported: OBVoice.isSupported() };
}

/* Speaker toggle pill — drop into screen chrome. */
function VoiceToggle({ style }) {
  const { on, toggle, supported } = useObVoice();
  if (!supported) return null;
  return (
    <button onClick={toggle} title={on ? "Maestro's voice: on" : "Maestro's voice: off"} style={{
      width: 46, height: 46, borderRadius: 14, border: "2px solid var(--line)", background: "var(--surface)",
      display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, ...style,
    }}>
      <Icon name={on ? "sound" : "mute"} size={22} color={on ? "#5BB8E3" : "var(--ink-faint)"} />
    </button>
  );
}

Object.assign(window, { OBVoice, useObVoice, VoiceToggle, OB_VOICE_MANIFEST });
