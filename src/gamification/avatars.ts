import type { MascotMood } from '../components/MascotImage';

// Avatar choices for family profiles. Each id maps to a mascot mood/expression
// so the existing MascotImage renders the tile — no new art needed. The legacy
// default avatar ('avatar_1') falls back to the happy mascot.

export interface AvatarOption {
  id: string;
  mood: MascotMood;
  label: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'happy', mood: 'happy', label: 'Maestro' },
  { id: 'cool', mood: 'cool', label: 'Cool' },
  { id: 'cheer', mood: 'cheer', label: 'Cheer' },
  { id: 'love', mood: 'love', label: 'Love' },
  { id: 'wow', mood: 'wow', label: 'Wow' },
  { id: 'trophy', mood: 'trophy', label: 'Champ' },
];

/** Resolve an avatarId to a mascot mood, tolerant of the legacy 'avatar_1'. */
export function moodForAvatar(avatarId: string): MascotMood {
  const found = AVATAR_OPTIONS.find((a) => a.id === avatarId);
  return found?.mood ?? 'happy';
}
