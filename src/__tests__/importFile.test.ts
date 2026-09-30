// File import — the pure half: telling a MusicXML, a compressed .mxl and a
// MIDI file apart (by name, then by their bytes), unpacking the .mxl container
// the way the spec says (container.xml first, first .xml otherwise), and
// routing MIDI through the writer without depending on its implementation.
import { strToU8, zipSync } from 'fflate';

jest.mock('../omr/midiFile', () => ({ parseMidiFile: jest.fn() }));
jest.mock('../omr/musicxmlWriter', () => ({ buildMusicXml: jest.fn() }));
jest.mock('expo-file-system', () => ({ readAsStringAsync: jest.fn() }));

// eslint-disable-next-line import/first
import * as FileSystem from 'expo-file-system';
// eslint-disable-next-line import/first
import { parseMidiFile } from '../omr/midiFile';
// eslint-disable-next-line import/first
import { buildMusicXml } from '../omr/musicxmlWriter';
// eslint-disable-next-line import/first
import { bytesToBase64 } from '../ble/base64';
// eslint-disable-next-line import/first
import {
  ImportFileError, detectKind, mxlToMusicXml, readScoreFile, scoreFileToMusicXml, titleFromFileName,
} from '../omr/importFile';

const mockParseMidi = parseMidiFile as jest.MockedFunction<typeof parseMidiFile>;
const mockBuild = buildMusicXml as jest.MockedFunction<typeof buildMusicXml>;
const mockRead = FileSystem.readAsStringAsync as jest.MockedFunction<typeof FileSystem.readAsStringAsync>;

const XML = '<?xml version="1.0"?><score-partwise><part id="P1"/></score-partwise>';
const bytes = (s: string) => strToU8(s);
const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};
const MTHD = concat(bytes('MThd'), new Uint8Array([0, 0, 0, 6, 0, 0, 0, 1, 0, 96]));
const NOISE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // a PNG header

beforeEach(() => jest.clearAllMocks());

describe('detectKind', () => {
  it('trusts the extension over anything else', () => {
    expect(detectKind('song.musicxml', 'application/octet-stream', NOISE)).toBe('musicxml');
    expect(detectKind('Song.XML', '', NOISE)).toBe('musicxml');
    expect(detectKind('song.mxl', '', NOISE)).toBe('mxl');
    expect(detectKind('song.mid', '', NOISE)).toBe('midi');
    expect(detectKind('song.MIDI', '', NOISE)).toBe('midi');
  });

  it('falls back to a recognisable MIME type', () => {
    expect(detectKind('download', 'audio/midi', NOISE)).toBe('midi');
    expect(detectKind('download', 'application/vnd.recordare.musicxml', NOISE)).toBe('mxl');
    expect(detectKind('download', 'text/xml; charset=utf-8', NOISE)).toBe('musicxml');
  });

  it('sniffs the bytes when name and type say nothing', () => {
    expect(detectKind('download', 'application/octet-stream', concat(BOM, bytes('  \n' + XML)))).toBe('musicxml');
    expect(detectKind('download', '', zipSync({ 'a.xml': bytes(XML) }))).toBe('mxl');
    expect(detectKind('download', '', MTHD)).toBe('midi');
    expect(detectKind('download', '', NOISE)).toBe('unknown');
    expect(detectKind('song.txt', 'text/plain', bytes('hello'))).toBe('unknown');
  });
});

describe('mxlToMusicXml', () => {
  it('follows META-INF/container.xml to a nested root file', () => {
    const zip = zipSync({
      'META-INF/container.xml':
        bytes('<?xml version="1.0"?><container><rootfiles>' +
          '<rootfile full-path="scores/nested/song.xml" media-type="application/vnd.recordare.musicxml+xml"/>' +
          '</rootfiles></container>'),
      'decoy.xml': bytes('<decoy/>'),
      'scores/nested/song.xml': bytes(XML),
    });
    expect(mxlToMusicXml(zip)).toBe(XML);
  });

  it('takes the first .xml entry when there is no container', () => {
    const zip = zipSync({
      'README.txt': bytes('not this'),
      'song.musicxml': bytes(XML),
      'other.xml': bytes('<other/>'),
    });
    expect(mxlToMusicXml(zip)).toBe(XML);
  });

  it('reports a zip with no score as unsupported', () => {
    expect(() => mxlToMusicXml(zipSync({ 'README.txt': bytes('nope') }))).toThrow(ImportFileError);
    expect(() => mxlToMusicXml(NOISE)).toThrow(expect.objectContaining({ reason: 'unsupported' }));
  });
});

describe('scoreFileToMusicXml', () => {
  it('decodes UTF-8 MusicXML and drops a BOM', () => {
    const utf = XML.replace('<part id="P1"/>', '<work><work-title>Für Elise</work-title></work>');
    expect(scoreFileToMusicXml('musicxml', concat(BOM, bytes(utf)), 'x')).toBe(utf);
  });

  it('unpacks an .mxl', () => {
    expect(scoreFileToMusicXml('mxl', zipSync({ 'song.xml': bytes(XML) }), 'x')).toBe(XML);
  });

  it('hands MIDI to parseMidiFile and buildMusicXml', () => {
    const input = { title: 'T', tempoBpm: 120, beatsPerMeasure: 4, beatType: 4, fifths: 0, rh: [], lh: [] };
    mockParseMidi.mockReturnValue(input);
    mockBuild.mockReturnValue('<built/>');
    expect(scoreFileToMusicXml('midi', MTHD, 'My Tune')).toBe('<built/>');
    expect(mockParseMidi).toHaveBeenCalledWith(MTHD, 'My Tune');
    expect(mockBuild).toHaveBeenCalledWith(input);
  });

  it('refuses anything else', () => {
    let err: unknown;
    try { scoreFileToMusicXml('unknown', NOISE, 'x'); } catch (e) { err = e; }
    expect(err).toBeInstanceOf(ImportFileError);
    expect((err as ImportFileError).reason).toBe('unsupported');
    expect(mockParseMidi).not.toHaveBeenCalled();
  });
});

describe('titleFromFileName', () => {
  it('strips the extension and separators', () => {
    expect(titleFromFileName('my_little-song.mxl')).toBe('my little song');
    expect(titleFromFileName('.mid')).toBe('Imported file');
  });
});

describe('readScoreFile', () => {
  const file = (fileName: string, mimeType = 'application/octet-stream') =>
    ({ uri: `file:///cache/${fileName}`, mimeType, fileName });

  it('reads base64 from disk, detects and converts', async () => {
    mockRead.mockResolvedValue(bytesToBase64(bytes(XML)));
    await expect(readScoreFile(file('download.bin'))).resolves.toBe(XML);
    expect(mockRead).toHaveBeenCalledWith('file:///cache/download.bin', { encoding: 'base64' });
  });

  it('passes a title made from the file name to the MIDI parser', async () => {
    mockRead.mockResolvedValue(bytesToBase64(MTHD));
    mockParseMidi.mockReturnValue({ title: 'x', tempoBpm: 120, beatsPerMeasure: 4, beatType: 4, fifths: 0, rh: [], lh: [] });
    mockBuild.mockReturnValue('<built/>');
    await expect(readScoreFile(file('twinkle_twinkle.mid', 'audio/midi'))).resolves.toBe('<built/>');
    expect(mockParseMidi).toHaveBeenCalledWith(expect.any(Uint8Array), 'twinkle twinkle');
  });

  it('wraps disk failures as unreadable and unknown bytes as unsupported', async () => {
    mockRead.mockRejectedValue(new Error('ENOENT'));
    await expect(readScoreFile(file('song.xml'))).rejects.toMatchObject({ reason: 'unreadable' });
    mockRead.mockResolvedValue(bytesToBase64(NOISE));
    await expect(readScoreFile(file('photo.png', 'image/png'))).rejects.toMatchObject({ reason: 'unsupported' });
  });
});
