import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { PIANO_SAMPLES, SAMPLE_MIN_MIDI, SAMPLE_MAX_MIDI } from './pianoSampleMap';

/**
 * Polyphonic piano playback built on expo-av — no Web Audio, no risky native
 * modules, so the EAS APK build stays green. Each MIDI note owns one cached
 * Audio.Sound; retriggering a note replays it from the start. Chords play by
 * firing several notes at once.
 *
 * Samples are offline-synthesized WAVs (C2..C6) that match the LuminaKeys
 * additive-synth timbre. Notes outside the sampled range clamp to the nearest
 * octave so the keyboard never goes silent.
 */

let configured = false;
let enabled = true;
const cache = new Map<number, Audio.Sound>();
const loading = new Map<number, Promise<Audio.Sound | null>>();

async function ensureMode() {
  if (configured) return;
  configured = true;
  try {
    // Full config — an incomplete mode (missing interruptionMode*) can leave
    // Android media output unconfigured, which is a common "no sound in the
    // release build" cause. This routes to the media stream and ducks others.
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    // best-effort; playback still works without explicit mode on most devices
  }
}

/** Initialize the audio session early (call at app startup). */
export async function initAudio(): Promise<void> {
  await ensureMode();
}

/** Clamp a requested MIDI note into the sampled range, preserving pitch class. */
function nearestSampled(midi: number): number {
  let m = midi;
  while (m < SAMPLE_MIN_MIDI) m += 12;
  while (m > SAMPLE_MAX_MIDI) m -= 12;
  return m;
}

async function getSound(midi: number): Promise<Audio.Sound | null> {
  const key = nearestSampled(midi);
  const cached = cache.get(key);
  if (cached) return cached;

  const inFlight = loading.get(key);
  if (inFlight) return inFlight;

  const src = PIANO_SAMPLES[key];
  if (!src) return null;

  const p = (async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(src, { volume: 0.9 });
      cache.set(key, sound);
      loading.delete(key);
      return sound;
    } catch {
      loading.delete(key);
      return null;
    }
  })();
  loading.set(key, p);
  return p;
}

/** Toggle all piano output (mirrors the lesson "sound off" setting). */
export function setPianoEnabled(on: boolean) {
  enabled = on;
}

/** Play a single MIDI note now. Fire-and-forget. */
export async function playMidi(midi: number, volume = 0.9): Promise<void> {
  if (!enabled) return;
  await ensureMode();
  const sound = await getSound(midi);
  if (!sound) return;
  try {
    await sound.setVolumeAsync(volume);
    await sound.replayAsync();
  } catch {
    // a sound mid-unload can throw; ignore
  }
}

/** Play several notes together (a chord). Optional small roll for realism. */
export async function playChord(midis: number[], rollMs = 0, volume = 0.85): Promise<void> {
  if (!enabled) return;
  await ensureMode();
  midis.forEach((m, i) => {
    if (rollMs > 0) {
      setTimeout(() => void playMidi(m, volume), i * rollMs);
    } else {
      void playMidi(m, volume);
    }
  });
}

/**
 * Warm the cache in the background so the first taps are instant. Loads the
 * core two octaves (C3..C5) first, then the rest. Safe to call repeatedly.
 */
export async function preloadCore(): Promise<void> {
  await ensureMode();
  // Warm just the core two octaves (C3..C5) so first taps are instant; the rest
  // load lazily on demand, keeping startup light.
  for (let m = 48; m <= 72; m++) {
    // serialize a touch so we don't spike memory/IO all at once
    // eslint-disable-next-line no-await-in-loop
    await getSound(m);
  }
}

/** Play notes one after another, spaced by `gapMs`. */
export async function playSequence(midis: number[], gapMs = 0): Promise<void> {
  if (!enabled) return;
  await ensureMode();
  for (let i = 0; i < midis.length; i++) {
    void playMidi(midis[i]);
    if (gapMs > 0 && i < midis.length - 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, gapMs));
    }
  }
}

/** Stop any currently-ringing notes (e.g. when a lesson is interrupted). */
export async function stopAll(): Promise<void> {
  await Promise.all(
    Array.from(cache.values()).map((s) => s.stopAsync().catch(() => undefined)),
  );
}

/** Release every loaded sound (call on app teardown if needed). */
export async function unloadAll(): Promise<void> {
  const sounds = Array.from(cache.values());
  cache.clear();
  loading.clear();
  await Promise.all(
    sounds.map((s) => s.unloadAsync().catch(() => undefined)),
  );
}
