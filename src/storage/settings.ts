import AsyncStorage from '@react-native-async-storage/async-storage';

// Centralized key/value settings store. Keeps the ElevenLabs voice config
// and other lightweight client preferences. All reads are tolerant of a
// missing/full storage and never throw.

const KEYS = {
  elevenLabsKey: 'pp.el.key',
  elevenLabsVoiceId: 'pp.el.voiceId',
  dailyGoalXp: 'pp.dailyGoalXp',
  reminderHour: 'pp.reminderHour',
  reminderEnabled: 'pp.reminderEnabled',
  onboarded: 'pp.onboarded',
  omrServerUrl: 'pp.omrServerUrl',
  // Firebase (REST) — project config + cached anonymous-auth session
  firebaseApiKey: 'pp.fb.apiKey',
  firebaseProjectId: 'pp.fb.projectId',
  firebaseBucket: 'pp.fb.bucket',
  firebaseUid: 'pp.fb.uid',
  firebaseIdToken: 'pp.fb.idToken',
  firebaseRefreshToken: 'pp.fb.refreshToken',
  firebaseTokenExpiry: 'pp.fb.tokenExpiry',
} as const;

export async function getString(key: keyof typeof KEYS): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS[key]);
  } catch {
    return null;
  }
}

export async function setString(key: keyof typeof KEYS, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS[key], value);
  } catch {
    /* ignore */
  }
}

export async function getNumber(key: keyof typeof KEYS, fallback: number): Promise<number> {
  const v = await getString(key);
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function getBool(key: keyof typeof KEYS, fallback: boolean): Promise<boolean> {
  const v = await getString(key);
  if (v == null) return fallback;
  return v === '1' || v === 'true';
}

export async function setBool(key: keyof typeof KEYS, value: boolean): Promise<void> {
  await setString(key, value ? '1' : '0');
}

export interface VoiceSettings {
  apiKey: string | null;
  voiceId: string;
}

export const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // ElevenLabs "Rachel"

export async function getVoiceSettings(): Promise<VoiceSettings> {
  const [apiKey, voiceId] = await Promise.all([
    getString('elevenLabsKey'),
    getString('elevenLabsVoiceId'),
  ]);
  return { apiKey, voiceId: voiceId || DEFAULT_VOICE_ID };
}

export async function saveVoiceSettings(apiKey: string, voiceId: string): Promise<void> {
  await Promise.all([
    setString('elevenLabsKey', apiKey),
    setString('elevenLabsVoiceId', voiceId),
  ]);
}
