// Piano Professor — on-device library of imported songs.
//
// SCAFFOLD: in-memory placeholder with the contract of the June branch's
// songLibrary.ts (expo-file-system backed). The real implementation replaces
// this file; callers must only rely on the exported signatures.
import { ImportedSong } from './importedSongs';
import { parseMusicXmlScore } from './musicxmlScore';

export interface LocalSongMeta {
  id: string;
  title: string;
  pageCount: number;
  /** ISO timestamp */
  createdAt: string;
}

const songs = new Map<string, { meta: LocalSongMeta; xml: string }>();

/** Newest first. Never throws. */
export async function listLocalSongs(): Promise<LocalSongMeta[]> {
  return [...songs.values()].map((s) => s.meta).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Best-effort persist; never throws. */
export async function saveLocalSong(song: ImportedSong): Promise<void> {
  const existing = songs.get(song.id);
  songs.set(song.id, {
    meta: {
      id: song.id,
      title: song.title,
      pageCount: song.pageCount,
      createdAt: existing?.meta.createdAt ?? new Date().toISOString(),
    },
    xml: song.xml,
  });
}

export async function loadLocalSong(id: string): Promise<ImportedSong | null> {
  const s = songs.get(id);
  if (!s) return null;
  return { id, title: s.meta.title, xml: s.xml, score: parseMusicXmlScore(s.xml), pageCount: s.meta.pageCount };
}

export async function renameLocalSong(id: string, title: string): Promise<void> {
  const s = songs.get(id);
  if (s) s.meta.title = title;
}

export async function deleteLocalSong(id: string): Promise<void> {
  songs.delete(id);
}
