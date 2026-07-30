// Piano Professor — talking to the OMR service.
//
// Two endpoints, and the difference matters. `POST /omr/score` takes every page
// of a song in ONE request and returns a single merged MusicXML, which is what
// we want: the server merges with full knowledge of each page's divisions and
// clefs. `POST /omr` takes one page and is the fallback for a server that
// predates /omr/score — then we merge client-side with mergeMusicXml, which is
// why that module exists on both sides.
//
// See backend/omr/README.md.

import { mergeMusicXml } from './mergeMusicXml';
import { getOmrServer } from './omrConfig';
import { PickedImage } from './pickImage';

export class OmrNotConfiguredError extends Error {
  constructor() {
    super('No OMR server configured');
    this.name = 'OmrNotConfiguredError';
  }
}

export interface OmrProgress {
  /** 1-based page being worked on; 0 while the whole song is sent at once. */
  page: number;
  pageCount: number;
  /** True while the request is in flight and we cannot report finer detail. */
  indeterminate: boolean;
}

/** A page takes ~a minute on CPU, so give a whole song generous room. */
const PER_PAGE_TIMEOUT_MS = 180_000;

function filePart(image: PickedImage) {
  // React Native's FormData takes a {uri, name, type} descriptor, not a Blob.
  return {
    uri: image.uri,
    name: image.fileName,
    type: image.mimeType,
  } as unknown as Blob;
}

async function post(url: string, body: FormData, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { method: 'POST', body, signal: controller.signal });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      throw new OmrError(resp.status, detail);
    }
    return await resp.text();
  } finally {
    clearTimeout(timer);
  }
}

export class OmrError extends Error {
  constructor(readonly status: number, readonly detail: string) {
    super(humanMessage(status, detail));
    this.name = 'OmrError';
  }
}

/** Plain language, because these land in front of a learner, not a developer. */
function humanMessage(status: number, detail: string): string {
  if (status === 404) {
    return 'That server does not have the scan endpoint. Check the address in Settings.';
  }
  if (status === 413) {
    return 'Those photos are too large for the server. Try fewer pages at a time.';
  }
  if (status === 422) {
    return 'No music was found on that page. Get the whole staff in frame, in even light, and try again.';
  }
  if (status >= 500) {
    return 'The scan server had a problem. Give it a moment and try again.';
  }
  return `The scan failed (${status}). ${detail.slice(0, 120)}`.trim();
}

/**
 * Whole song → one MusicXML.
 *
 * Prefers the server-side merge; falls back to page-by-page + client-side merge
 * when the server has no /omr/score. A PDF counts as a single "page" here — the
 * server renders and merges its pages itself.
 */
export async function runOmrScore(
  pages: PickedImage[],
  onProgress?: (p: OmrProgress) => void,
): Promise<string> {
  const server = await getOmrServer();
  if (!server) throw new OmrNotConfiguredError();
  if (pages.length === 0) throw new Error('No pages to scan.');

  const timeout = PER_PAGE_TIMEOUT_MS * Math.max(1, pages.length);

  try {
    onProgress?.({ page: 0, pageCount: pages.length, indeterminate: true });
    const form = new FormData();
    for (const page of pages) form.append('files', filePart(page));
    return await post(`${server}/omr/score`, form, timeout);
  } catch (e) {
    // Only a missing endpoint justifies the slower path; a 422 means the server
    // read the pages fine and found no music, and retrying page by page would
    // just fail again more slowly.
    if (!(e instanceof OmrError) || e.status !== 404) throw e;
  }

  const xmls: string[] = [];
  for (let i = 0; i < pages.length; i++) {
    onProgress?.({ page: i + 1, pageCount: pages.length, indeterminate: false });
    const form = new FormData();
    form.append('file', filePart(pages[i]));
    // eslint-disable-next-line no-await-in-loop
    xmls.push(await post(`${server}/omr`, form, PER_PAGE_TIMEOUT_MS));
  }
  return mergeMusicXml(xmls);
}
