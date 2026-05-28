import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Semantic haptic feedback. Every call is fire-and-forget — silently no-ops
// on web. Names are intentional verbs so call sites read like the feeling.

const safe = (fn: () => Promise<unknown>) => {
  if (Platform.OS === 'web') return;
  fn().catch(() => { /* ignore device errors */ });
};

/** Tiny tick — used on selection (picking a node, toggling). */
export function tap(): void {
  safe(() => Haptics.selectionAsync());
}

/** Soft pop — for normal button presses. */
export function press(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Solid thump — chunky CTA presses, drop animations. */
export function bump(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Heavy whoa — landing on a milestone, big celebration. */
export function thud(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

/** Cheery success pattern. */
export function success(): void {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Soft warning. */
export function warning(): void {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

/** Wrong answer / lost heart. */
export function error(): void {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
