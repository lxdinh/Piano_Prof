// Piano Professor — base64 <-> bytes for react-native-ble-plx.
//
// ble-plx hands characteristic values to JS as base64 strings and expects the
// same on write. The obvious tool for that is Buffer, but React Native has no
// Buffer global and `buffer` is not a dependency here — reaching for it throws
// "ReferenceError: Buffer is not defined" the moment the first notification
// lands. Hermes' atob/btoa are binary-string based and awkward for byte arrays,
// so these 30 lines keep the BLE layer dependency-free and platform-agnostic.

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Reverse lookup table, built once.
const LOOKUP = new Uint8Array(128);
for (let i = 0; i < CHARS.length; i++) LOOKUP[CHARS.charCodeAt(i)] = i;

/** Encode bytes as a base64 string suitable for `characteristic.write*()`. */
export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63] + CHARS[(n >> 6) & 63] + CHARS[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63] + '==';
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63] + CHARS[(n >> 6) & 63] + '=';
  }
  return out;
}

/** Decode a base64 string from `characteristic.value` into bytes. */
export function base64ToBytes(b64: string): Uint8Array {
  let clean = b64;
  // Tolerate missing padding — some stacks strip it.
  while (clean.length % 4 !== 0) clean += '=';

  let padding = 0;
  if (clean.endsWith('==')) padding = 2;
  else if (clean.endsWith('=')) padding = 1;

  const out = new Uint8Array((clean.length / 4) * 3 - padding);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n =
      (LOOKUP[clean.charCodeAt(i)] << 18) |
      (LOOKUP[clean.charCodeAt(i + 1)] << 12) |
      (LOOKUP[clean.charCodeAt(i + 2)] << 6) |
      LOOKUP[clean.charCodeAt(i + 3)];
    if (p < out.length) out[p++] = (n >> 16) & 0xff;
    if (p < out.length) out[p++] = (n >> 8) & 0xff;
    if (p < out.length) out[p++] = n & 0xff;
  }
  return out;
}
