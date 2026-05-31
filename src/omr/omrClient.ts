import { getString } from '../storage/settings';
import { PickedImage } from './pickImage';

// Calls the self-hosted oemer service (backend/omr/app.py): multipart POST of
// the image to `<server>/omr`, returns MusicXML text. The server URL is set in
// Settings; when unset we surface a clear error so the UI can fall back to the
// bundled demo score.

export class OmrNotConfiguredError extends Error {
  constructor() {
    super('OMR server not configured');
    this.name = 'OmrNotConfiguredError';
  }
}

export async function getOmrServer(): Promise<string | null> {
  const url = await getString('omrServerUrl');
  return url && url.trim() ? url.trim().replace(/\/$/, '') : null;
}

export async function runOmr(image: PickedImage): Promise<string> {
  const server = await getOmrServer();
  if (!server) throw new OmrNotConfiguredError();

  const form = new FormData();
  // React Native's FormData accepts a {uri, name, type} file descriptor.
  form.append('file', {
    uri: image.uri,
    name: image.fileName,
    type: image.mimeType,
  } as unknown as Blob);

  const resp = await fetch(`${server}/omr`, { method: 'POST', body: form });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`OMR failed (${resp.status}). ${detail.slice(0, 200)}`);
  }
  return resp.text();
}

export interface SongJobStatus {
  jobId: string;
  status: 'processing' | 'ready' | 'failed';
  title?: string;
  totalPages?: number;
  donePages?: number;
  musicxml?: string;
  error?: string;
}

/** Optional progress callback so the UI can show "page 2/5 read". */
export type SongProgress = (s: SongJobStatus) => void;

/**
 * Upload several images/PDFs as ONE song in the given page order, then poll the
 * server until the merged MusicXML is ready. `order` is a permutation of the
 * indices of `files` (defaults to as-given). Returns the merged MusicXML text.
 */
export async function runOmrSong(
  files: PickedImage[],
  order?: number[],
  onProgress?: SongProgress,
): Promise<string> {
  const server = await getOmrServer();
  if (!server) throw new OmrNotConfiguredError();
  if (!files.length) throw new Error('Add at least one page.');

  const form = new FormData();
  for (const f of files) {
    form.append('files', {
      uri: f.uri,
      name: f.fileName,
      type: f.mimeType,
    } as unknown as Blob);
  }
  form.append('order', JSON.stringify(order ?? files.map((_, i) => i)));

  const start = await fetch(`${server}/omr/song`, { method: 'POST', body: form });
  if (!start.ok) {
    const detail = await start.text().catch(() => '');
    throw new Error(`Upload failed (${start.status}). ${detail.slice(0, 200)}`);
  }
  const { jobId } = (await start.json()) as { jobId: string };
  return pollSongJob(server, jobId, onProgress);
}

async function pollSongJob(
  server: string,
  jobId: string,
  onProgress?: SongProgress,
  intervalMs = 2000,
  timeoutMs = 15 * 60 * 1000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const resp = await fetch(`${server}/omr/song/${jobId}`);
    if (!resp.ok) {
      if (resp.status === 404) throw new Error('Song job not found on server.');
      continue; // transient server/network hiccup — keep polling
    }
    const status = (await resp.json()) as SongJobStatus;
    onProgress?.(status);
    if (status.status === 'ready' && status.musicxml) return status.musicxml;
    if (status.status === 'failed') {
      throw new Error(status.error || 'OMR failed while reading the score.');
    }
  }
  throw new Error('Timed out reading the score. Try fewer pages.');
}
