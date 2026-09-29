// Setup for the `ui` (component) jest project only.
//
// Component tests import real screens, and those reach persistence through
// `src/services/dateKey` → `trustedTime` → AsyncStorage, whose native module is
// null under Jest. The library ships an in-memory mock for exactly this.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// The BLE radio has no business being constructed in a unit test.
jest.mock('react-native-ble-plx', () => ({
  BleManager: class {
    onStateChange() { return { remove() {} }; }
    startDeviceScan() {}
    stopDeviceScan() {}
  },
  State: { PoweredOn: 'PoweredOn', PoweredOff: 'PoweredOff', Unauthorized: 'Unauthorized' },
}));
