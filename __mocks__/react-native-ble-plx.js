// Manual mock — BLE is hardware; smoke tests only need the API shape.
class BleManager {
  onStateChange(listener, emitCurrentState) {
    if (emitCurrentState) listener('PoweredOn');
    return { remove() {} };
  }
  startDeviceScan() {}
  stopDeviceScan() {}
  async connectToDevice() { throw new Error('no devices in tests'); }
  async state() { return 'PoweredOn'; }
  destroy() {}
}

class Device {}
class Characteristic {}
class BleError extends Error {}

const State = {
  Unknown: 'Unknown',
  Resetting: 'Resetting',
  Unsupported: 'Unsupported',
  Unauthorized: 'Unauthorized',
  PoweredOff: 'PoweredOff',
  PoweredOn: 'PoweredOn',
};

module.exports = { BleManager, Device, Characteristic, BleError, State };
