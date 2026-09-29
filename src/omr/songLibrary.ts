// Piano Professor — on-device library of imported songs.
//
// Every conversion is written to the app's documents directory (one MusicXML
// file per song + a small JSON index), so scanned songs survive restarts
// without needing a server. Everything here is best-effort: a failed write
// must never take the import flow down with it — the in-memory registry
// (importedSongs.ts) still holds the song for this session.
//
// Where there is no documents directory (expo-file-system reports null on
// web), the same API degrades to a per-session in-memory map so nothing throws.
import * as FileSystem from 'expo-file-system';
import { parseMusicXmlScore } from './musicxmlScore';
import { ImportedSong } from './importedSongs';

export interface LocalSongMeta {
  id: string;
  title: string;
  pageCount: number;
  /** ISO timestamp */
  createdAt: string;
}

const DOC_DIR = FileSystem.documentDirectory;
const DIR = DOC_DIR ? `${DOC_DIR}songs/` : null;
const INDEX = DIR ? `${DIR}index.json` : null;

// In-memory fallback (no documents directory) — same shape as the disk copy.
const memory = { index: [] as LocalSongMeta[], xml: new Map<string, string>() };

const xmlPath = (id: string): string | null => (DIR ? `${DIR}${id}.xml` : null);

const isMeta = (m: unknown): m is LocalSongMeta =>
  typeof m === 'object' && m !== null
  && typeof (m as LocalSongMeta).id === 'string'
  && typeof (m as LocalSongMeta).title === 'string';

async function ensureDir(): Promise<void> {
  if (!DIR) return;
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  } catch {
    /* best-effort */
  }
}

async function readIndex(): Promise<LocalSongMeta[]> {
  if (!INDEX) return memory.index.map((m) => ({ ...m }));
  try {
    const raw = await FileSystem.readAsStringAsync(INDEX);
    const list: unknown = JSON.parse(raw);
    return Array.isArray(list) ? list.filter(isMeta) : [];
  } catch {
    return [];
  }
}

async function writeIndex(list: LocalSongMeta[]): Promise<void> {
  if (!INDEX) { memory.index = list.map((m) => ({ ...m })); return; }
  try {
    await ensureDir();
    await FileSystem.writeAsStringAsync(INDEX, JSON.stringify(list));
  } catch {
    /* best-effort */
  }
}

async function writeXml(id: string, xml: string): Promise<void> {
  const path = xmlPath(id);
  if (!path) { memory.xml.set(id, xml); return; }
  await ensureDir();
  await FileSystem.writeAsStringAsync(path, xml);
}

async function readXml(id: string): Promise<string | null> {
  const path = xmlPath(id);
  if (!path) return memory.xml.get(id) ?? null;
  return FileSystem.readAsStringAsync(path);
}

async function deleteXml(id: string): Promise<void> {
  const path = xmlPath(id);
  if (!path) { memory.xml.delete(id); return; }
  await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => undefined);
}

/** Newest first. Never throws. */
export async function listLocalSongs(): Promise<LocalSongMeta[]> {
  const list = await readIndex();
  // Ties (two saves in the same millisecond) keep insertion order, newest first.
  return list
    .map((meta, i) => ({ meta, i }))
    .sort((a, b) => (a.meta.createdAt < b.meta.createdAt ? 1 : a.meta.createdAt > b.meta.createdAt ? -1 : b.i - a.i))
    .map((e) => e.meta);
}

/** Persist a converted song (insert or update by id). Best-effort; never throws. */
export async function saveLocalSong(song: ImportedSong): Promise<void> {
  try {
    await writeXml(song.id, song.xml);
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

/** Re-reads and re-parses the stored MusicXML. Null when unknown or unreadable. */
export async function loadLocalSong(id: string): Promise<ImportedSong | null> {
  try {
    const list = await readIndex();
    const meta = list.find((m) => m.id === id);
    if (!meta) return null;
    const xml = await readXml(id);
    if (xml == null) return null;
    return { id, title: meta.title, xml, score: parseMusicXmlScore(xml), pageCount: meta.pageCount ?? 1 };
  } catch {
    return null;
  }
}

export async function renameLocalSong(id: string, title: string): Promise<void> {
  try {
    const list = await readIndex();
    const meta = list.find((m) => m.id === id);
    if (!meta) return;
    meta.title = title;
    await writeIndex(list);
  } catch {
    /* best-effort */
  }
}

export async function deleteLocalSong(id: string): Promise<void> {
  try {
    await deleteXml(id);
    const list = await readIndex();
    await writeIndex(list.filter((m) => m.id !== id));
  } catch {
    /* best-effort */
  }
}
