import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { getVoiceSettings } from '../storage/settings';

// Instructor voice.
//
// Default path: on-device TTS via expo-speech (works with no setup, offline).
// Upgraded path: if the user has saved an ElevenLabs API key in settings, we
// synthesize a realistic voice through their API and cache the audio on disk
// keyed by (voiceId + text) so repeated lines don't re-bill the API.

const CACHE_DIR = `${FileSystem.cacheDirectory ?? ''}voice/`;

let cacheReady = false;
async function ensureCacheDir(): Promise<void> {
  if (cacheReady || !FileSystem.cacheDirectory) return;
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
    cacheReady = true;
  } catch {
    /* ignore */
  }
}

// Tiny stable hash for cache filenames (djb2).
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
}

/** Speak a line and resolve when playback finishes. */
export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  const { apiKey, voiceId } = await getVoiceSettings();
  if (apiKey) {
    const ok = await speakElevenLabs(text, apiKey, voiceId, opts);
    if (ok) return;
    // fall through to device TTS on any failure
  }
  await speakDevice(text, opts);
}

function speakDevice(text: string, opts: SpeakOptions): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(text, {
      rate: opts.rate ?? 1.0,
      pitch: opts.pitch ?? 1.0,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

async function speakElevenLabs(
  text: string,
  apiKey: string,
  voiceId: string,
  opts: SpeakOptions,
): Promise<boolean> {
  try {
    await ensureCacheDir();
    const fileUri = `${CACHE_DIR}${voiceId}_${hash(text)}.mp3`;

    let exists = false;
    if (FileSystem.cacheDirectory) {
      const info = await FileSystem.getInfoAsync(fileUri);
      exists = info.exists;
    }

    if (!exists) {
      const resp = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.8 },
          }),
        },
      );
      if (!resp.ok) return false;

      const blob = await resp.blob();
      const base64 = await blobToBase64(blob);
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { shouldPlay: true, rate: opts.rate ?? 1.0, shouldCorrectPitch: true },
    );
    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) resolve();
      });
    });
    await sound.unloadAsync();
    return true;
  } catch {
    return false;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const result = reader.result as string;
      // strip the data:audio/mpeg;base64, prefix
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

/** Verify an ElevenLabs key by synthesizing a short line. Used by settings. */
export async function testElevenLabs(apiKey: string, voiceId: string): Promise<boolean> {
  try {
    const resp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: 'Hello! Your voice is connected.',
          model_id: 'eleven_turbo_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.8 },
        }),
      },
    );
    return resp.ok;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  Speech.stop();
}
