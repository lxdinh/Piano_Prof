module.exports = {
  getPermissionsAsync: jest.fn(async () => ({ granted: false, ios: { status: 0 } })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
  setNotificationChannelAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => 'mock-id'),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  setNotificationHandler: jest.fn(),
  IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
  AndroidImportance: { DEFAULT: 3, HIGH: 4, LOW: 2, MAX: 5, MIN: 1 },
  SchedulableTriggerInputTypes: { DAILY: 'daily', TIME_INTERVAL: 'timeInterval', DATE: 'date' },
};
