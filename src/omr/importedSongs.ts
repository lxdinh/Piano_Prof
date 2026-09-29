import { SongScore } from './musicxmlScore';

// In-memory registry for full songs created at runtime (multi-page OMR imports
// or songs re-opened from the Firebase library). Mirrors importedLessons.ts:
// transient, cleared on app restart — the durable copy lives in Firebase.

export interface ImportedSong {
  id: string;
  title: string;
  /** merged whole-song MusicXML */
  xml: string;
  score: SongScore;
  pageCount: number;
}

const registry = new Map<string, ImportedSong>();

export function registerImportedSong(song: ImportedSong): void {
  registry.set(song.id, song);
}

export function getImportedSong(id: string): ImportedSong | null {
  return registry.get(id) ?? null;
}

export function newSongId(): string {
  return `song-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
