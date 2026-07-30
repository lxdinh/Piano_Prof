// Talking to the OMR service.
//
// The interesting behaviour is not the happy path — it is which failures are
// worth retrying differently, and which are worth explaining. A 404 means the
// server predates /omr/score and the per-page path should be tried; a 422 means
// it read the pages fine and found no music, so retrying page by page would
// only fail again more slowly.

import { OmrError, OmrNotConfiguredError, runOmrScore } from '../omr/omrClient';
import { setOmrServer } from '../omr/omrConfig';
import type { PickedImage } from '../omr/pickImage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const SERVER = 'https://omr.example.test';
const page = (n: number): PickedImage => ({
  uri: `file:///page${n}.jpg`, mimeType: 'image/jpeg', fileName: `page${n}.jpg`,
});

const xmlFor = (bars: number) => {
  let out = '<score-partwise><part-list><score-part id="P1"/></part-list><part id="P1">';
  for (let m = 1; m <= bars; m++) {
    out += `<measure number="${m}"><note><pitch><step>C</step><octave>4</octave></pitch>`
      + '<duration>4</duration><staff>1</staff></note></measure>';
  }
  return `${out}</part></score-partwise>`;
};

const ok = (body: string) => ({ ok: true, status: 200, text: async () => body });
const fail = (status: number, detail = '') =>
  ({ ok: false, status, text: async () => detail });

let calls: string[] = [];
const mockFetch = jest.fn();

beforeEach(async () => {
  calls = [];
  mockFetch.mockReset();
  (global as unknown as { fetch: unknown }).fetch = (url: string, init: RequestInit) => {
    calls.push(url);
    return mockFetch(url, init);
  };
  await setOmrServer(SERVER);
});

describe('runOmrScore — configuration', () => {
  it('refuses to guess a server', async () => {
    await setOmrServer('');
    await expect(runOmrScore([page(1)])).rejects.toBeInstanceOf(OmrNotConfiguredError);
    expect(calls).toEqual([]);
  });

  it('rejects an empty page list rather than posting nothing', async () => {
    await expect(runOmrScore([])).rejects.toThrow(/No pages/);
  });

  it('does not double the slash when the URL has a trailing one', async () => {
    await setOmrServer(`${SERVER}/`);
    mockFetch.mockResolvedValueOnce(ok(xmlFor(2)));
    await runOmrScore([page(1)]);
    expect(calls[0]).toBe(`${SERVER}/omr/score`);
  });
});

describe('runOmrScore — whole-song path', () => {
  it('sends every page in one request', async () => {
    mockFetch.mockResolvedValueOnce(ok(xmlFor(8)));
    const xml = await runOmrScore([page(1), page(2), page(3)]);
    expect(calls).toEqual([`${SERVER}/omr/score`]);
    expect(xml).toContain('<measure number="8"');
  });

  it('reports that it is working before it can count pages', async () => {
    mockFetch.mockResolvedValueOnce(ok(xmlFor(2)));
    const seen: boolean[] = [];
    await runOmrScore([page(1), page(2)], (p) => seen.push(p.indeterminate));
    expect(seen[0]).toBe(true);
  });
});

describe('runOmrScore — falling back to page-by-page', () => {
  it('retries per page when the server has no /omr/score', async () => {
    mockFetch
      .mockResolvedValueOnce(fail(404))
      .mockResolvedValueOnce(ok(xmlFor(4)))
      .mockResolvedValueOnce(ok(xmlFor(3)));

    const xml = await runOmrScore([page(1), page(2)]);
    expect(calls).toEqual([`${SERVER}/omr/score`, `${SERVER}/omr`, `${SERVER}/omr`]);
    // Merged client-side and renumbered: 4 + 3 bars.
    expect(xml).toContain('<measure number="7"');
    expect(xml).not.toContain('<measure number="8"');
  });

  it('counts pages through the fallback so the UI can show progress', async () => {
    mockFetch
      .mockResolvedValueOnce(fail(404))
      .mockResolvedValueOnce(ok(xmlFor(1)))
      .mockResolvedValueOnce(ok(xmlFor(1)));
    const seen: number[] = [];
    await runOmrScore([page(1), page(2)], (p) => { if (!p.indeterminate) seen.push(p.page); });
    expect(seen).toEqual([1, 2]);
  });

  it('does NOT fall back when the server read the pages and found no music', async () => {
    // 422 page-by-page would fail again, one slow request at a time.
    mockFetch.mockResolvedValueOnce(fail(422));
    await expect(runOmrScore([page(1), page(2)])).rejects.toThrow(/No music was found/);
    expect(calls).toEqual([`${SERVER}/omr/score`]);
  });

  it('does not fall back on a server error either', async () => {
    mockFetch.mockResolvedValueOnce(fail(503));
    await expect(runOmrScore([page(1)])).rejects.toThrow(/had a problem/);
    expect(calls).toHaveLength(1);
  });
});

describe('runOmrScore — failures a learner has to understand', () => {
  it.each([
    [404, /scan endpoint/],
    [413, /too large/],
    [422, /No music was found/],
    [500, /had a problem/],
  ])('%s reads as plain language', async (status, matcher) => {
    // 404 falls back, so give the fallback a failure too and assert on that.
    mockFetch.mockResolvedValue(fail(status as number));
    await expect(runOmrScore([page(1)])).rejects.toThrow(matcher as RegExp);
  });

  it('keeps the status code for diagnosis', async () => {
    mockFetch.mockResolvedValue(fail(418, 'teapot'));
    await expect(runOmrScore([page(1)])).rejects.toMatchObject({ status: 418 });
  });

  it('surfaces a network failure rather than swallowing it', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));
    await expect(runOmrScore([page(1)])).rejects.toThrow(/Network request failed/);
  });
});

describe('OmrError', () => {
  it('is distinguishable from a generic failure', () => {
    const e = new OmrError(422, 'no staves');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('OmrError');
    expect(e.status).toBe(422);
  });
});
