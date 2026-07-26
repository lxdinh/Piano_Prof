// Base64 <-> bytes for BLE payloads.
//
// react-native-ble-plx exchanges characteristic values as base64 strings.
// Node's `Buffer` is NOT available in React Native/Hermes (it is not
// polyfilled and `buffer` is not a dependency), so these small pure-JS
// helpers stand in for it.

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    const has1 = i + 1 < bytes.length;
    const has2 = i + 2 < bytes.length;

    out += CHARS[b0 >> 2];
    out += CHARS[((b0 & 0x03) << 4) | (has1 ? b1 >> 4 : 0)];
    out += has1 ? CHARS[((b1 & 0x0f) << 2) | (has2 ? b2 >> 6 : 0)] : '=';
    out += has2 ? CHARS[b2 & 0x3f] : '=';
  }
  return out;
}

export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(len);

  let outPos = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = CHARS.indexOf(clean[i]);
    const c1 = CHARS.indexOf(clean[i + 1]);
    const c2 = CHARS.indexOf(clean[i + 2]);
    const c3 = CHARS.indexOf(clean[i + 3]);

    if (outPos < len) out[outPos++] = (c0 << 2) | (c1 >> 4);
    if (c2 >= 0 && outPos < len) out[outPos++] = ((c1 & 0x0f) << 4) | (c2 >> 2);
    if (c3 >= 0 && outPos < len) out[outPos++] = ((c2 & 0x03) << 6) | c3;
  }
  return out;
}
