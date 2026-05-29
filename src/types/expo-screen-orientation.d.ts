// Minimal ambient declaration so local `tsc` resolves the module before
// `npm install` runs (the real package is fetched during the EAS build).
// Mirrors only the slice of the API we use.
declare module 'expo-screen-orientation' {
  export enum OrientationLock {
    DEFAULT = 0,
    ALL = 1,
    PORTRAIT = 2,
    PORTRAIT_UP = 3,
    PORTRAIT_DOWN = 4,
    LANDSCAPE = 5,
    LANDSCAPE_LEFT = 6,
    LANDSCAPE_RIGHT = 7,
  }
  export function lockAsync(orientationLock: OrientationLock): Promise<void>;
  export function unlockAsync(): Promise<void>;
  export function getOrientationLockAsync(): Promise<OrientationLock>;
}
