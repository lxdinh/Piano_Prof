import { Audio } from 'expo-av';
import { rateForNote } from './pitchShift';

// Piano playback engine.
//
// Strategy: bundle a small set of "anchor" piano samples (one per octave is
// plenty) and pitch-shift the nearest anchor to reach any requested MIDI note.
// This keeps the asset payload tiny while covering the full keyboard.
//
// Until real sample files are dropped into assets/audio/piano/ and registered
// in ANCHOR_SAMPLES below, playNote() is a safe no-op so the app still builds
// and runs. Add anchors like:
//   const ANCHOR_SAMPLES: AnchorMap = {
//     48: require('../../assets/audio/piano/C3.mp3'),
//     60: require('../../assets/audio/piano/C4.mp3'),
//     72: require('../../assets/audio/piano/C5.mp3'),
//   };

type AnchorMap = Record<number, number>; // midi -> require() module id

const ANCHOR_SAMPLES: AnchorMap = {
  // intentionally empty until sample assets are added (see note above)
};

let audioModeConfigured = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    audioModeConfigured = true;
  } catch {
    /* ignore — audio still works in most cases */
  }
}

function nearestAnchor(midi: number): number | null {
  const anchors = Object.keys(ANCHOR_SAMPLES).map(Number);
  if (anchors.length === 0) return null;
  return anchors.reduce((best, a) =>
    Math.abs(a - midi) < Math.abs(best - midi) ? a : best,
  );
}

// Track active sounds so we can unload them after they finish.
const active = new Set<Audio.Sound>();

/** Play a single MIDI note. No-op if no samples are registered. */
export async function playNote(midi: number, durationMs = 1200): Promise<void> {
  const anchorMidi = nearestAnchor(midi);
  if (anchorMidi == null) return;

  await ensureAudioMode();

  try {
    const { sound } = await Audio.Sound.createAsync(
      ANCHOR_SAMPLES[anchorMidi] as any,
      {
        shouldPlay: true,
        rate: rateForNote(midi, anchorMidi),
        shouldCorrectPitch: false, // we WANT the pitch to shift
      },
    );
    active.add(sound);
    setTimeout(async () => {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch {
        /* ignore */
      } finally {
        active.delete(sound);
      }
    }, durationMs);
  } catch {
    /* ignore playback errors */
  }
}

/** Play several notes simultaneously (a chord). */
export async function playChord(midiNotes: number[], durationMs = 1600): Promise<void> {
  await Promise.all(midiNotes.map((m) => playNote(m, durationMs)));
}

/** Play notes one after another. Resolves when the last note has started. */
export async function playSequence(midiNotes: number[], gapMs = 400): Promise<void> {
  for (const m of midiNotes) {
    await playNote(m);
    await new Promise((r) => setTimeout(r, gapMs));
  }
}

/** True when at least one anchor sample is registered. */
export function hasSamples(): boolean {
  return Object.keys(ANCHOR_SAMPLES).length > 0;
}

export async function stopAll(): Promise<void> {
  await Promise.all(
    [...active].map(async (s) => {
      try {
        await s.stopAsync();
        await s.unloadAsync();
      } catch {
        /* ignore */
      }
    }),
  );
  active.clear();
}
