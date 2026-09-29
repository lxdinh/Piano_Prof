// The on-device song library sits on expo-file-system, so the file system is
// an in-memory map here: one MusicXML per song plus an index. What matters is
// the roundtrip (save → list newest-first → load re-parses), the edits (rename,
// delete), and that persistence stays best-effort — a disk failure must never
// reject the import flow that called it.
import * as FileSystem from 'expo-file-system';
import { ImportedSong } from '../omr/importedSongs';
import { parseMusicXmlScore } from '../omr/musicxmlScore';
import {
  deleteLocalSong, listLocalSongs, loadLocalSong, renameLocalSong, saveLocalSong,
} from '../omr/songLibrary';

jest.mock('expo-file-system', () => {
  const files = new Map<string, string>();
  const dirs = new Set<string>();
  return {
    documentDirectory: 'file:///docs/',
    getInfoAsync: jest.fn(async (uri: string) => ({ exists: files.has(uri) || dirs.has(uri), uri, isDirectory: dirs.has(uri) })),
    makeDirectoryAsync: jest.fn(async (uri: string) => { dirs.add(uri); }),
    readAsStringAsync: jest.fn(async (uri: string) => {
      if (!files.has(uri)) throw new Error(`ENOENT: ${uri}`);
      return files.get(uri)!;
    }),
    writeAsStringAsync: jest.fn(async (uri: string, contents: string) => { files.set(uri, contents); }),
    deleteAsync: jest.fn(async (uri: string, opts?: { idempotent?: boolean }) => {
      if (!files.delete(uri) && !opts?.idempotent) throw new Error(`ENOENT: ${uri}`);
    }),
    __files: files,
    __dirs: dirs,
  };
});

type Fs = typeof FileSystem & { __files: Map<string, string>; __dirs: Set<string> };
const fs = FileSystem as unknown as Fs;

const xmlFor = (bars: number, step = 'C') => {
  let out = '<score-partwise><part-list><score-part id="P1"/></part-list><part id="P1">';
  for (let m = 1; m <= bars; m++) {
    out += `<measure number="${m}"><note><pitch><step>${step}</step><octave>4</octave></pitch>`
      + '<duration>4</duration><staff>1</staff></note></measure>';
  }
  return `${out}</part></score-partwise>`;
};

const song = (id: string, title: string, bars: number): ImportedSong => {
  const xml = xmlFor(bars);
  return { id, title, xml, score: parseMusicXmlScore(xml), pageCount: bars > 4 ? 2 : 1 };
};

beforeEach(() => {
  fs.__files.clear();
  fs.__dirs.clear();
  (fs.writeAsStringAsync as jest.Mock).mockClear();
  jest.useRealTimers();
});

describe('songLibrary on expo-file-system', () => {
  it('saves one xml per song plus an index under documentDirectory/songs/', async () => {
    await saveLocalSong(song('s1', 'First', 4));
    expect(fs.__dirs.has('file:///docs/songs/')).toBe(true);
    expect(fs.__files.get('file:///docs/songs/s1.xml')).toBe(xmlFor(4));
    const index = JSON.parse(fs.__files.get('file:///docs/songs/index.json')!);
    expect(index).toHaveLength(1);
    expect(index[0]).toMatchObject({ id: 's1', title: 'First', pageCount: 1 });
    expect(typeof index[0].createdAt).toBe('string');
  });

  it('lists newest first and loads a song back re-parsed from its xml', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-01T10:00:00Z') });
    await saveLocalSong(song('older', 'Older', 4));
    jest.setSystemTime(new Date('2026-09-02T10:00:00Z'));
    await saveLocalSong(song('newer', 'Newer', 8));

    const list = await listLocalSongs();
    expect(list.map((m) => m.id)).toEqual(['newer', 'older']);
    expect(list[0]).toMatchObject({ title: 'Newer', pageCount: 2, createdAt: '2026-09-02T10:00:00.000Z' });

    const loaded = await loadLocalSong('newer');
    expect(loaded).not.toBeNull();
    expect(loaded!.title).toBe('Newer');
    expect(loaded!.xml).toBe(xmlFor(8));
    expect(loaded!.score.measureCount).toBe(8);
    expect(loaded!.pageCount).toBe(2);
  });

  it('keeps the original createdAt when a song is saved again', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-01T10:00:00Z') });
    await saveLocalSong(song('s1', 'First', 4));
    jest.setSystemTime(new Date('2026-09-05T10:00:00Z'));
    await saveLocalSong({ ...song('s1', 'First (edited)', 4) });
    const list = await listLocalSongs();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ title: 'First (edited)', createdAt: '2026-09-01T10:00:00.000Z' });
  });

  it('renames in place', async () => {
    await saveLocalSong(song('s1', 'Untitled scan', 4));
    await renameLocalSong('s1', 'Moonlight');
    expect((await listLocalSongs())[0].title).toBe('Moonlight');
    expect((await loadLocalSong('s1'))!.title).toBe('Moonlight');
    await expect(renameLocalSong('nope', 'x')).resolves.toBeUndefined();
  });

  it('deletes the xml and the index entry', async () => {
    await saveLocalSong(song('s1', 'One', 4));
    await saveLocalSong(song('s2', 'Two', 4));
    await deleteLocalSong('s1');
    expect(fs.__files.has('file:///docs/songs/s1.xml')).toBe(false);
    expect((await listLocalSongs()).map((m) => m.id)).toEqual(['s2']);
    expect(await loadLocalSong('s1')).toBeNull();
    await expect(deleteLocalSong('s1')).resolves.toBeUndefined(); // already gone: fine
  });

  it('returns null for unknown ids and for a song whose file went missing', async () => {
    expect(await loadLocalSong('ghost')).toBeNull();
    await saveLocalSong(song('s1', 'One', 4));
    fs.__files.delete('file:///docs/songs/s1.xml');
    expect(await loadLocalSong('s1')).toBeNull();
  });

  it('never rejects when the disk write throws', async () => {
    (fs.writeAsStringAsync as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
    await expect(saveLocalSong(song('s1', 'One', 4))).resolves.toBeUndefined();
    expect(await listLocalSongs()).toEqual([]);
  });

  it('treats a corrupt index as empty', async () => {
    fs.__files.set('file:///docs/songs/index.json', '{not json');
    expect(await listLocalSongs()).toEqual([]);
    fs.__files.set('file:///docs/songs/index.json', JSON.stringify([{ bogus: true }, { id: 'ok', title: 'Ok', pageCount: 1, createdAt: 'z' }]));
    expect((await listLocalSongs()).map((m) => m.id)).toEqual(['ok']);
  });
});

describe('songLibrary without a documents directory (web)', () => {
  it('degrades to an in-memory library so nothing throws', async () => {
    jest.resetModules();
    jest.doMock('expo-file-system', () => ({
      documentDirectory: null,
      getInfoAsync: jest.fn(async () => { throw new Error('unsupported'); }),
      makeDirectoryAsync: jest.fn(async () => { throw new Error('unsupported'); }),
      readAsStringAsync: jest.fn(async () => { throw new Error('unsupported'); }),
      writeAsStringAsync: jest.fn(async () => { throw new Error('unsupported'); }),
      deleteAsync: jest.fn(async () => { throw new Error('unsupported'); }),
    }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const lib: typeof import('../omr/songLibrary') = require('../omr/songLibrary');
    await lib.saveLocalSong(song('m1', 'Memory', 4));
    expect((await lib.listLocalSongs()).map((m) => m.id)).toEqual(['m1']);
    expect((await lib.loadLocalSong('m1'))!.score.measureCount).toBe(4);
    await lib.renameLocalSong('m1', 'Renamed');
    expect((await lib.listLocalSongs())[0].title).toBe('Renamed');
    await lib.deleteLocalSong('m1');
    expect(await lib.listLocalSongs()).toEqual([]);
  });
});
