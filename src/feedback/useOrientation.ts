import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * Tablet heuristic: shortest side >= 600dp. Good enough to decide the app-wide
 * orientation policy without pulling in a device-info dependency.
 */
export function isTablet(): boolean {
  const { width, height } = Dimensions.get('window');
  return Math.min(width, height) >= 600;
}

/** The orientation the app rests at when no screen is forcing landscape. */
async function lockBaseOrientation(): Promise<void> {
  try {
    await ScreenOrientation.lockAsync(
      isTablet()
        // Tablets are landscape-first (TV / Netflix feel).
        ? ScreenOrientation.OrientationLock.LANDSCAPE
        // Phones rotate freely — portrait to browse, landscape to play.
        : ScreenOrientation.OrientationLock.DEFAULT,
    );
  } catch {
    /* unsupported — ignore */
  }
}

/**
 * Lock the screen to landscape while focused, restore the base orientation on
 * blur. Used by the lesson + practice screens, which need the full keyboard
 * width. All calls are best-effort: on web / unsupported devices they no-op.
 */
export function useLandscapeWhileFocused() {
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE,
          );
        } catch {
          /* unsupported — ignore */
        }
      })();
      return () => {
        cancelled = true;
        // Restore the base orientation (free on phones, landscape on tablets)
        // rather than forcing portrait, so the landscape-first feel sticks.
        void lockBaseOrientation();
        void cancelled;
      };
    }, []),
  );
}

/**
 * Apply the app-wide base orientation at startup: landscape-locked on tablets,
 * free rotation on phones. Replaces the old portrait-only lock.
 */
export function useAppOrientation() {
  useEffect(() => { void lockBaseOrientation(); }, []);
}

/** @deprecated kept for back-compat; prefer useAppOrientation(). */
export function useLockPortraitOnMount() {
  useEffect(() => {
    (async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        );
      } catch {
        /* ignore */
      }
    })();
  }, []);
}
