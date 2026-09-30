// Piano Professor — read a Standard MIDI File into the writer's ScoreInput.
//
// A small, dependency-free SMF reader: header chunk (format 0/1, ticks per
// quarter), track chunks with variable-length deltas and running status, the
// meta events we care about (tempo, time signature, key signature, track name),
// and note-on/off pairing. Everything else (sysex, controllers, pitch bend,
// percussion on channel 10) is skipped.
import { NoteIn, ScoreInput } from './musicxmlWriter';

const DEFAULT_TITLE = 'MIDI import';

interface TrackNotes {
  notes: NoteIn[];
}

interface Reader {
  bytes: Uint8Array;
  pos: number;
}

/**
 * Parse SMF bytes (format 0 or 1). Tempo, time signature and key signature come
 * from meta events (defaults 120 BPM, 4/4, C). Notes are split into hands by
 * track when two melodic tracks exist, otherwise by pitch (below C4 = left).
 * Throws an Error with a learner-readable message when the file is not MIDI.
 */
export function parseMidiFile(bytes: Uint8Array, fallbackTitle = DEFAULT_TITLE): ScoreInput {
  if (bytes.length < 14 || ascii(bytes, 0, 4) !== 'MThd') {
    throw new Error('Not a MIDI file');
  }
  const r: Reader = { bytes, pos: 4 };
  const headerLen = u32(r);
  const format = u16(r);
  const ntrks = u16(r);
  const division = u16(r);
  r.pos = 8 + headerLen; // tolerate headers longer than the standard 6 bytes
  if (division & 0x8000) {
    throw new Error('This MIDI file uses SMPTE timing, which is not supported');
  }
  if (division === 0) throw new Error('This MIDI file has an invalid time division');
  if (format > 2) throw new Error(`Unsupported MIDI file format ${format}`);

  let tempoBpm: number | null = null;
  let tempoTick = Infinity;
  let beatsPerMeasure = 4;
  let beatType = 4;
  let timeSeen = false;
  let fifths = 0;
  let keySeen = false;
  let trackName: string | null = null;
  const tracks: TrackNotes[] = [];

  let tracksRead = 0;
  while (r.pos + 8 <= bytes.length && tracksRead < ntrks) {
    const id = ascii(bytes, r.pos, 4);
    r.pos += 4;
    const len = u32(r);
    const end = Math.min(bytes.length, r.pos + len);
    if (id === 'MTrk') {
      tracksRead++;
      const t = readTrack(r, end, {
        onTempo: (tick, mpq) => {
          if (tick < tempoTick && mpq > 0) {
            tempoTick = tick;
            tempoBpm = Math.round((60_000_000 / mpq) * 100) / 100;
          }
        },
        onTimeSig: (nn, dd) => {
          if (timeSeen || nn <= 0) return;
          timeSeen = true;
          beatsPerMeasure = nn;
          beatType = 2 ** dd;
        },
        onKeySig: (sf) => {
          if (keySeen) return;
          keySeen = true;
          fifths = Math.max(-7, Math.min(7, sf));
        },
        onTrackName: (name) => {
          if (trackName === null && name.trim()) trackName = name.trim();
        },
      });
      tracks.push(t);
    }
    r.pos = end;
  }

  for (const t of tracks) {
    for (const n of t.notes) {
      n.startBeats /= division;
      n.durBeats /= division;
    }
  }

  const melodic = tracks.filter((t) => t.notes.length > 0);
  let rh: NoteIn[];
  let lh: NoteIn[];
  if (melodic.length === 2) {
    const [a, b] = melodic;
    const avg = (t: TrackNotes) => t.notes.reduce((s, n) => s + n.midi, 0) / t.notes.length;
    const aHigher = avg(a) >= avg(b);
    rh = (aHigher ? a : b).notes;
    lh = (aHigher ? b : a).notes;
  } else {
    const all = melodic.flatMap((t) => t.notes);
    rh = all.filter((n) => n.midi >= 60);
    lh = all.filter((n) => n.midi < 60);
  }
  const byTime = (x: NoteIn, y: NoteIn) => x.startBeats - y.startBeats || x.midi - y.midi;
  rh.sort(byTime);
  lh.sort(byTime);

  const title = fallbackTitle === DEFAULT_TITLE && trackName ? trackName : fallbackTitle;
  return {
    title,
    tempoBpm: tempoBpm ?? 120,
    beatsPerMeasure,
    beatType,
    fifths,
    rh,
    lh,
  };
}

interface TrackHooks {
  onTempo(tick: number, microsecondsPerQuarter: number): void;
  onTimeSig(numerator: number, denominatorPow2: number): void;
  onKeySig(sharpsFlats: number): void;
  onTrackName(name: string): void;
}

/** Read one MTrk chunk body (r.pos .. end) into ticks-based notes. */
function readTrack(r: Reader, end: number, hooks: TrackHooks): TrackNotes {
  const notes: NoteIn[] = [];
  const open = new Map<number, { startTick: number }>(); // (channel << 8 | key) → onset
  let tick = 0;
  let running = 0;

  const closeNote = (channel: number, key: number, atTick: number) => {
    const k = (channel << 8) | key;
    const o = open.get(k);
    if (!o) return;
    open.delete(k);
    if (channel === 9) return; // percussion never becomes a piano note
    notes.push({ midi: key, startBeats: o.startTick, durBeats: Math.max(0, atTick - o.startTick) });
  };

  while (r.pos < end) {
    tick += vlq(r, end);
    if (r.pos >= end) break;
    let status = r.bytes[r.pos];
    if (status >= 0x80) {
      r.pos++;
      if (status < 0xf0) running = status;
    } else {
      if (running === 0) throw new Error('This MIDI file is corrupted (data byte without a status)');
      status = running;
    }

    if (status === 0xff) {
      // Meta event
      const type = r.bytes[r.pos++];
      const len = vlq(r, end);
      const dataStart = r.pos;
      const dataEnd = Math.min(end, dataStart + len);
      const d = r.bytes.subarray(dataStart, dataEnd);
      r.pos = dataEnd;
      switch (type) {
        case 0x03:
          hooks.onTrackName(decodeText(d));
          break;
        case 0x51:
          if (d.length >= 3) hooks.onTempo(tick, (d[0] << 16) | (d[1] << 8) | d[2]);
          break;
        case 0x58:
          if (d.length >= 2) hooks.onTimeSig(d[0], d[1]);
          break;
        case 0x59:
          if (d.length >= 1) hooks.onKeySig(d[0] > 127 ? d[0] - 256 : d[0]);
          break;
        case 0x2f:
          r.pos = end; // end of track
          break;
        default:
          break;
      }
      continue;
    }
    if (status === 0xf0 || status === 0xf7) {
      const len = vlq(r, end);
      r.pos = Math.min(end, r.pos + len);
      continue;
    }
    if (status >= 0xf1) {
      // System common messages are not expected in files; skip their data bytes.
      r.pos += status === 0xf2 ? 2 : status === 0xf1 || status === 0xf3 ? 1 : 0;
      continue;
    }

    const kind = status & 0xf0;
    const channel = status & 0x0f;
    const dataLen = kind === 0xc0 || kind === 0xd0 ? 1 : 2;
    if (r.pos + dataLen > end) break;
    const d1 = r.bytes[r.pos] & 0x7f;
    const d2 = dataLen === 2 ? r.bytes[r.pos + 1] & 0x7f : 0;
    r.pos += dataLen;

    if (kind === 0x90 && d2 > 0) {
      const k = (channel << 8) | d1;
      if (open.has(k)) closeNote(channel, d1, tick); // retriggered while sounding
      open.set(k, { startTick: tick });
    } else if (kind === 0x80 || (kind === 0x90 && d2 === 0)) {
      closeNote(channel, d1, tick);
    }
  }
  // Notes still sounding at the end of the track end there.
  for (const k of [...open.keys()]) closeNote(k >> 8, k & 0xff, tick);
  return { notes };
}

function u16(r: Reader): number {
  const v = (r.bytes[r.pos] << 8) | r.bytes[r.pos + 1];
  r.pos += 2;
  return v;
}

function u32(r: Reader): number {
  const b = r.bytes;
  const v = ((b[r.pos] << 24) >>> 0) + (b[r.pos + 1] << 16) + (b[r.pos + 2] << 8) + b[r.pos + 3];
  r.pos += 4;
  return v;
}

/** Variable-length quantity (up to 4 bytes). */
function vlq(r: Reader, end: number): number {
  let v = 0;
  for (let i = 0; i < 4 && r.pos < end; i++) {
    const b = r.bytes[r.pos++];
    v = (v << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) break;
  }
  return v;
}

function ascii(bytes: Uint8Array, start: number, len: number): string {
  let s = '';
  for (let i = start; i < start + len && i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

/** Decode meta text as UTF-8 when valid, otherwise as Latin-1. */
function decodeText(d: Uint8Array): string {
  let s = '';
  let i = 0;
  while (i < d.length) {
    const b = d[i];
    let cp = b;
    let extra = 0;
    if (b >= 0xf0 && b < 0xf8) { cp = b & 0x07; extra = 3; }
    else if (b >= 0xe0) { cp = b & 0x0f; extra = 2; }
    else if (b >= 0xc0) { cp = b & 0x1f; extra = 1; }
    else if (b >= 0x80) return latin1(d);
    if (extra && i + extra >= d.length) return latin1(d);
    for (let j = 1; j <= extra; j++) {
      const c = d[i + j];
      if ((c & 0xc0) !== 0x80) return latin1(d);
      cp = (cp << 6) | (c & 0x3f);
    }
    s += String.fromCodePoint(cp);
    i += extra + 1;
  }
  return s;
}

function latin1(d: Uint8Array): string {
  let s = '';
  for (let i = 0; i < d.length; i++) s += String.fromCharCode(d[i]);
  return s;
}
