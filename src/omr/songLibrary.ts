import * as FileSystem from 'expo-file-system';
import { parseMusicXmlScore } from './musicxmlScore';
import { ImportedSong } from './importedSongs';

// Local persistence for imported songs: every conversion is written to the
// app's documents directory (one MusicXML file per song + a small JSON index),
// so songs survive restarts WITHOUT needing Firebase. Firebase remains the
// cross-device backup; this is the on-device library the Songbook lists.

export interface LocalSongMeta {
  id: string;
  title: string;
  pageCount: number;
  createdAt: string; // ISO
}

const DIR = `${FileSystem.documentDirectory ?? ''}songs/`;
const INDEX = `${DIR}index.json`;

async function ensureDir(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  } catch {
    /* best-effort */
  }
}

async function readIndex(): Promise<LocalSongMeta[]> {
  try {
    const raw = await FileSystem.readAsStringAsync(INDEX);
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeIndex(list: LocalSongMeta[]): Promise<void> {
  try {
    await ensureDir();
    await FileSystem.writeAsStringAsync(INDEX, JSON.stringify(list));
  } catch {
    /* best-effort */
  }
}

export async function listLocalSongs(): Promise<LocalSongMeta[]> {
  const list = await readIndex();
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Persist a converted song (insert or update by id). */
export async function saveLocalSong(song: ImportedSong): Promise<void> {
  try {
    await ensureDir();
    await FileSystem.writeAsStringAsync(`${DIR}${song.id}.xml`, song.xml);
    const list = await readIndex();
    const meta: LocalSongMeta = {
      id: song.id,
      title: song.title,
      pageCount: song.pageCount,
      createdAt: new Date().toISOString(),
    };
    const i = list.findIndex((m) => m.id === song.id);
    if (i >= 0) list[i] = { ...meta, createdAt: list[i].createdAt };
    else list.push(meta);
    await writeIndex(list);
  } catch {
    /* persistence is best-effort; the in-memory registry still works */
  }
}

export async function loadLocalSong(id: string): Promise<ImportedSong | null> {
  try {
    const list = await readIndex();
    const meta = list.find((m) => m.id === id);
    if (!meta) return null;
    const xml = await FileSystem.readAsStringAsync(`${DIR}${id}.xml`);
    return { id, title: meta.title, xml, score: parseMusicXmlScore(xml), pageCount: meta.pageCount };
  } catch {
    return null;
  }
}

export async function renameLocalSong(id: string, title: string): Promise<void> {
  const list = await readIndex();
  const meta = list.find((m) => m.id === id);
  if (!meta) return;
  meta.title = title;
  await writeIndex(list);
}

export async function deleteLocalSong(id: string): Promise<void> {
  await FileSystem.deleteAsync(`${DIR}${id}.xml`, { idempotent: true }).catch(() => undefined);
  const list = await readIndex();
  await writeIndex(list.filter((m) => m.id !== id));
}
