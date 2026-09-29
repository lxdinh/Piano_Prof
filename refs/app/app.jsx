/* ===================================================================
   Piano Professor — App router, state & transitions
   =================================================================== */
const { useState: useSA, useEffect: useEA, useRef: useRA } = React;

const MODAL_SCREENS = new Set(["who", "createProfile", "editProfile", "paywall", "upsell", "manageSub", "complete", "pair"]);

function PPApp() {
  const [profiles, setProfiles] = useSA(() => JSON.parse(JSON.stringify(PP_PROFILES_SEED)));
  const [activeId, setActiveId] = useSA(null);
  const [screen, setScreen] = useSA("splash");
  const [params, setParams] = useSA({});
  const [history, setHistory] = useSA([]);
  const [premium, setPremium] = useSA(false);
  const [led, setLed] = useSA({ connected: false, brightness: 80, theme: "rainbow", calibrated: false });
  const [muted, setMutedState] = useSA(false);
  const [ambient, setAmbientState] = useSA(true);
  const [theme, setThemeState] = useSA(() => { try { return localStorage.getItem("pp-theme") || "light"; } catch (e) { return "light"; } });
  const [toastMsg, setToastMsg] = useSA(null);
  const [anim, setAnim] = useSA({ token: 0, kind: "fwd" });
  const toastTimer = useRA(null);

  const activeProfile = profiles.find((p) => p.id === activeId) || null;

  const go = (name, p = {}) => {
    setHistory((h) => [...h, { screen, params }]);
    setParams(p);
    setAnim({ token: Date.now(), kind: MODAL_SCREENS.has(name) ? "modal" : "fwd" });
    setScreen(name);
  };
  const back = () => {
    setHistory((h) => {
      if (!h.length) { return h; }
      const prev = h[h.length - 1];
      setParams(prev.params || {});
      setAnim({ token: Date.now(), kind: "back" });
      setScreen(prev.screen);
      return h.slice(0, -1);
    });
  };
  const updateProfile = (id, patch) => setProfiles((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const toast = (msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  };
  const setMuted = (m) => { setMutedState(m); PP_Audio.setMuted(m); };
  const setAmbient = (on) => { setAmbientState(on); PP_Audio.setAmbientEnabled(on); };
  const setTheme = (mode) => { setThemeState(mode); try { localStorage.setItem("pp-theme", mode); } catch (e) {} };
  useEA(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  const ctx = {
    screen, params, go, back,
    profiles, setProfiles, activeId, setActiveId, activeProfile, updateProfile,
    premium, setPremium, led, setLed, muted, setMuted, ambient, setAmbient, toast,
    theme, setTheme,
  };

  // ambient relaxed piano everywhere except the lesson player
  useEA(() => {
    PP_Audio.kickAmbient();
    PP_Audio.setAmbientSuppressed(screen === "lesson" || screen === "practice");
  }, [screen]);

  // expose jump-nav for the stage chrome
  useEA(() => {
    window.PPGo = (name, p) => {
      // make sure we have an active profile for app screens
      if (!activeId && !["splash", "who", "createProfile", "onboarding"].includes(name)) setActiveId(profiles[0].id);
      go(name, p || {});
    };
    window.PPState = () => ({ screen, premium, ledConnected: led.connected });
  });

  const registry = {
    splash: window.ScreenSplash, who: window.ScreenWho,
    createProfile: window.ScreenCreateProfile, editProfile: window.ScreenCreateProfile,
    onboarding: window.ScreenOnboarding, placement: window.ScreenPlacement,
    placementResult: window.ScreenPlacementResult, coursePath: window.ScreenCoursePath,
    home: window.ScreenHome,
    lesson: window.ScreenLesson, complete: window.ScreenComplete,
    songs: window.ScreenSongs, songPreview: window.ScreenSongPreview, import: window.ScreenImport, practice: window.ScreenPractice,
    paywall: window.ScreenPaywall, upsell: window.ScreenUpsell, manageSub: window.ScreenManageSub,
    pair: window.ScreenPair, calibration: window.ScreenCalibration, ledSettings: window.ScreenLedSettings,
    settings: window.ScreenSettings, profile: window.ScreenProfile,
    diploma: window.ScreenDiploma,
  };
  const Comp = registry[screen] || (() => <div style={{ padding: 40, fontFamily: "Nunito", fontWeight: 800 }}>Missing screen: {screen}</div>);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <div key={anim.token} className={`pp-enter-${anim.kind}`} style={{ width: "100%", height: "100%" }}>
        <Comp ctx={ctx} />
      </div>

      {/* toast */}
      {toastMsg && (
        <div style={{ position: "absolute", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 90, background: "#2B2722", color: "#fff", padding: "13px 24px", borderRadius: 16, fontWeight: 800, fontSize: 16, boxShadow: "0 8px 24px #0004", animation: "pp-toast .3s", maxWidth: 480, textAlign: "center" }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("pp-root")).render(<PPApp />);
