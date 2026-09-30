// Piano Professor — import a score FILE (MusicXML, compressed MusicXML, MIDI)
// straight into the import pipeline, skipping the scanner.
//
// Everything here is pure apart from readScoreFile(), which is the one place
// that touches expo-file-system. Detection goes by extension first (what the
// learner sees in their file browser) and by content second, because pickers
// on both platforms are happy to report `application/octet-stream` — or
// nothing at all — for anything they do not recognise.
import * as FileSystem from 'expo-file-system';
import { strFromU8, unzipSync } from 'fflate';

import { base64ToBytes } from '../ble/base64';
import { PickedImage } from './pickImage';
import { buildMusicXml } from './musicxmlWriter';
import { parseMidiFile } from './midiFile';

export type ScoreFileKind = 'musicxml' | 'mxl' | 'midi' | 'unknown';

export class ImportFileError extends Error {
  constructor(readonly reason: 'unsupported' | 'unreadable') {
    super(reason === 'unsupported' ? 'That file is not MusicXML or MIDI.' : 'Could not read that file.');
    this.name = 'ImportFileError';
  }
}

const EXT_KIND: Record<string, ScoreFileKind> = {
  musicxml: 'musicxml', xml: 'musicxml', mxl: 'mxl', mid: 'midi', midi: 'midi',
};

const MIME_KIND: Record<string, ScoreFileKind> = {
  'application/vnd.recordare.musicxml+xml': 'musicxml',
  'application/vnd.recordare.musicxml': 'mxl',
  'application/xml': 'musicxml',
  'text/xml': 'musicxml',
  'audio/midi': 'midi',
  'audio/x-midi': 'midi',
  'audio/mid': 'midi',
  'application/x-midi': 'midi',
};

function startsWith(head: Uint8Array, magic: string, offset = 0): boolean {
  if (head.length < offset + magic.length) return false;
  for (let i = 0; i < magic.length; i++) if (head[offset + i] !== magic.charCodeAt(i)) return false;
  return true;
}

/** Sniff the leading bytes: zip, MIDI header chunk, or XML (after an optional BOM/whitespace). */
function sniff(head: Uint8Array): ScoreFileKind {
  if (startsWith(head, 'PK\x03\x04')) return 'mxl';
  if (startsWith(head, 'MThd')) return 'midi';
  let i = 0;
  if (head.length >= 3 && head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf) i = 3;
  while (i < head.length && (head[i] === 0x20 || head[i] === 0x09 || head[i] === 0x0a || head[i] === 0x0d)) i++;
  if (i < head.length && head[i] === 0x3c) return 'musicxml';
  return 'unknown';
}

/**
 * What kind of score file this is. The extension wins, then a recognisable
 * MIME type, then the bytes themselves — a `.txt` full of MusicXML still imports.
 */
export function detectKind(fileName: string, mimeType: string, head: Uint8Array): ScoreFileKind {
  const ext = /\.([a-z0-9]+)$/i.exec(fileName.trim())?.[1]?.toLowerCase();
  if (ext && EXT_KIND[ext]) return EXT_KIND[ext];
  const mime = mimeType.split(';')[0].trim().toLowerCase();
  if (MIME_KIND[mime]) return MIME_KIND[mime];
  return sniff(head);
}

/**
 * Unpack a compressed MusicXML container: META-INF/container.xml names the
 * root file; without it (or when it points nowhere) the first .xml/.musicxml
 * entry outside META-INF is taken.
 */
export function mxlToMusicXml(zip: Uint8Array): string {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zip);
  } catch {
    throw new ImportFileError('unsupported');
  }
  const container = entries['META-INF/container.xml'];
  if (container) {
    const m = /<rootfile[^>]*full-path\s*=\s*"([^"]+)"/i.exec(strFromU8(container));
    const path = m?.[1]?.trim();
    if (path && entries[path]) return strFromU8(entries[path]);
  }
  const first = Object.keys(entries).find((n) =>
    !/^META-INF\//i.test(n) && /\.(musicxml|xml)$/i.test(n) && entries[n].length > 0);
  if (!first) throw new ImportFileError('unsupported');
  return strFromU8(entries[first]);
}

/** Convert the raw bytes of a known kind into MusicXML text. */
export function scoreFileToMusicXml(kind: ScoreFileKind, bytes: Uint8Array, fallbackTitle: string): string {
  switch (kind) {
    case 'musicxml': {
      // strFromU8 decodes UTF-8; drop a leading BOM so the parser sees '<' first.
      const text = strFromU8(bytes);
      return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    }
    case 'mxl':
      return mxlToMusicXml(bytes);
    case 'midi':
      return buildMusicXml(parseMidiFile(bytes, fallbackTitle));
    default:
      throw new ImportFileError('unsupported');
  }
}

/** A title from the file name: "my_song.mxl" → "my song". */
export function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim() || 'Imported file';
}

/**
 * Read a picked file from disk and turn it into MusicXML. Disk failures become
 * ImportFileError('unreadable'); an unrecognised file is 'unsupported'. Anything
 * a converter throws (a corrupt MIDI file, say) propagates as-is.
 */
export async function readScoreFile(file: PickedImage): Promise<string> {
  let bytes: Uint8Array;
  try {
    const b64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
    bytes = base64ToBytes(b64);
  } catch {
    throw new ImportFileError('unreadable');
  }
  const kind = detectKind(file.fileName, file.mimeType, bytes.subarray(0, 64));
  return scoreFileToMusicXml(kind, bytes, titleFromFileName(file.fileName));
}
