import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Local daily practice reminder. No server / push tokens involved — purely
// on-device scheduled notifications, so it works without any backend.

const REMINDER_ID_KEY = 'pp-daily-reminder';

export async function requestPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Practice reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Schedule a daily reminder at the given local time. Cancels any prior one. */
export async function scheduleDailyReminder(hour = 18, minute = 0): Promise<boolean> {
  const ok = await requestPermission();
  if (!ok) return false;
  await ensureAndroidChannel();
  await cancelDailyReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID_KEY,
    content: {
      title: '🎹 Time to practice!',
      body: "Keep your streak alive — a few minutes is all it takes.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID_KEY);
  } catch {
    /* not scheduled */
  }
}
