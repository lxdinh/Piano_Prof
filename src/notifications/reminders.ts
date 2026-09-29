// Piano Professor — daily practice reminder (local notification).
//
// The learner CHOOSES their practice time rather than being assigned one.
// Implementation intentions ("I will practise at 5pm") are among the most
// robust findings in behaviour-change research (Gollwitzer): committing to a
// specific time markedly raises follow-through versus a general intention. The
// chosen hour is also when the reminder fires, so the plan and the nudge line up.
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pp.reminders.v1';
const HOUR_KEY = 'pp.reminders.hour.v1';
/** Default practice time when the learner hasn't picked one yet. */
export const REMINDER_HOUR = 18; // 6 PM, matching the design

/** Practice times offered in Settings. */
export const REMINDER_HOURS = [7, 9, 12, 15, 16, 17, 18, 19, 20];

export function formatHour(h: number): string {
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${suffix}`;
}

export async function isReminderOn(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(KEY)) === '1'; } catch { return false; }
}

/** The learner's chosen practice hour (24h), defaulting to 6 PM. */
export async function getReminderHour(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(HOUR_KEY);
    const h = raw == null ? NaN : parseInt(raw, 10);
    return Number.isInteger(h) && h >= 0 && h <= 23 ? h : REMINDER_HOUR;
  } catch {
    return REMINDER_HOUR;
  }
}

/**
 * Enable/disable the daily reminder at the learner's chosen hour. Returns the
 * resulting on/off state — if the OS denies notification permission, enabling
 * fails and returns false.
 */
export async function setReminder(on: boolean, hour?: number): Promise<boolean> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const at = hour ?? (await getReminderHour());
    await AsyncStorage.setItem(HOUR_KEY, String(at));
    if (!on) {
      await AsyncStorage.setItem(KEY, '0');
      return false;
    }
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted && perm.status !== 'granted') {
      await AsyncStorage.setItem(KEY, '0');
      return false;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Piano Professor',
        // Loss-framed: protecting a streak you already own motivates more
        // strongly than the prospect of starting a new one.
        body: 'Time to play! Keep your streak alive 🔥',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: at,
        minute: 0,
      },
    });
    await AsyncStorage.setItem(KEY, '1');
    return true;
  } catch {
    return false;
  }
}
