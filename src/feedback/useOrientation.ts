import { useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * Lock the screen to landscape while focused, restore portrait on blur.
 * Used by the lesson + practice screens, which need the full keyboard width.
 * All calls are best-effort: on web / unsupported devices they no-op.
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
        (async () => {
          try {
            await ScreenOrientation.lockAsync(
              ScreenOrientation.OrientationLock.PORTRAIT_UP,
            );
          } catch {
            /* ignore */
          }
        })();
        void cancelled;
      };
    }, []),
  );
}

/** Lock the whole app to portrait at startup (the default for most screens). */
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
