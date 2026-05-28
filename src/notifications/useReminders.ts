import { useCallback, useEffect, useState } from 'react';
import { getBool, getNumber, setBool } from '../storage/settings';
import { scheduleDailyReminder, cancelDailyReminder } from './streakReminder';

// Small hook backing the Settings toggle. Persists the on/off choice and the
// reminder hour, (re)scheduling the local notification accordingly.
export function useReminders() {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(18);

  useEffect(() => {
    (async () => {
      setEnabled(await getBool('reminderEnabled', false));
      setHour(await getNumber('reminderHour', 18));
    })();
  }, []);

  const toggle = useCallback(async (next: boolean) => {
    setEnabled(next);
    await setBool('reminderEnabled', next);
    if (next) {
      const ok = await scheduleDailyReminder(hour, 0);
      if (!ok) {
        setEnabled(false);
        await setBool('reminderEnabled', false);
      }
    } else {
      await cancelDailyReminder();
    }
  }, [hour]);

  return { enabled, hour, toggle };
}
