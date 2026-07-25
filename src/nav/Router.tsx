// Piano Professor — lightweight screen router (port of the prototype's PPApp
// go/back/history/toast model). Kept intentionally simple; the nav rail lives
// inside the tab screens via <Shell>.
import React, {
  createContext, useContext, useState, useRef, useCallback, useMemo, useEffect,
} from 'react';
import { View, Text, Animated } from 'react-native';
import { useAppTheme } from '../theme/AppTheme';
import { Fonts } from '../theme/tokens';
import * as ambient from '../audio/ambient';
import Stage from './Stage';

// Screens where the relaxed background piano should stay quiet.
const AMBIENT_QUIET = new Set(['lesson', 'practice']);

export type ScreenName = string;
export type ScreenParams = Record<string, any>;
export type ScreenRegistry = Record<ScreenName, React.ComponentType>;

interface RouterAPI {
  screen: ScreenName;
  params: ScreenParams;
  go: (name: ScreenName, params?: ScreenParams) => void;
  back: () => void;
  toast: (msg: string) => void;
}

const Ctx = createContext<RouterAPI | null>(null);

export function RouterProvider({ screens, initial = 'splash' }: {
  screens: ScreenRegistry; initial?: ScreenName;
}) {
  const { colors } = useAppTheme();
  const [screen, setScreen] = useState<ScreenName>(initial);
  const [params, setParams] = useState<ScreenParams>({});
  const historyRef = useRef<{ screen: ScreenName; params: ScreenParams }[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fade = useRef(new Animated.Value(1)).current;

  const swap = useCallback((name: ScreenName, p: ScreenParams) => {
    fade.setValue(0);
    setScreen(name);
    setParams(p);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [fade]);

  const go = useCallback((name: ScreenName, p: ScreenParams = {}) => {
    historyRef.current.push({ screen, params });
    swap(name, p);
  }, [screen, params, swap]);

  const back = useCallback(() => {
    const prev = historyRef.current.pop();
    if (prev) swap(prev.screen, prev.params);
  }, [swap]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Ambient relaxed piano everywhere except the lesson/practice players.
  useEffect(() => { ambient.kick(); }, []);
  useEffect(() => { ambient.setSuppressed(AMBIENT_QUIET.has(screen)); }, [screen]);

  const api = useMemo<RouterAPI>(() => ({ screen, params, go, back, toast }), [screen, params, go, back, toast]);
  const Comp = screens[screen] ?? Missing;

  return (
    <Ctx.Provider value={api}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* The whole UI renders at a fixed canvas and is scaled to fit here. */}
        <Stage>
          <Animated.View style={{ flex: 1, opacity: fade }}>
            <Comp />
          </Animated.View>
        </Stage>
        {toastMsg && (
          <View pointerEvents="none" style={{ position: 'absolute', bottom: 26, left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{
              backgroundColor: '#2B2722', color: '#fff', paddingVertical: 13, paddingHorizontal: 24,
              borderRadius: 16, fontFamily: Fonts.family.bold, fontSize: 16, overflow: 'hidden',
            }}>{toastMsg}</Text>
          </View>
        )}
      </View>
    </Ctx.Provider>
  );
}

function Missing() {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.ink, fontFamily: Fonts.family.bold }}>Missing screen</Text>
    </View>
  );
}

export function useRouter(): RouterAPI {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRouter must be used inside <RouterProvider>');
  return v;
}
