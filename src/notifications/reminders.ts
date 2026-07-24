// Piano Professor — daily practice reminder (local notification).
// Wired to the Settings "Reminders" toggle. Fires once a day at 6 PM.
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pp.reminders.v1';
export const REMINDER_HOUR = 18; // 6 PM, matching the design

export async function isReminderOn(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(KEY)) === '1'; } catch { return false; }
}

/**
 * Enable/disable the daily reminder. Returns the resulting on/off state — if
 * the OS denies notification permission, enabling fails and returns false.
 */
export async function setReminder(on: boolean): Promise<boolean> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
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
        body: 'Time to play! Keep your streak alive 🔥',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: REMINDER_HOUR,
        minute: 0,
      },
    });
    await AsyncStorage.setItem(KEY, '1');
    return true;
  } catch {
    return false;
  }
}
