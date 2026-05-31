import { getString } from '../storage/settings';
import { PickedImage } from './pickImage';
import { Lesson } from '../lessons/schema';

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
  lesson?: Lesson;
  error?: string;
}

/** Optional progress callback so the UI can show "page 2/5 read". */
export type SongProgress = (s: SongJobStatus) => void;

type SongFormat = 'musicxml' | 'lesson';

// Upload the ordered pages as one song job; returns the server jobId.
async function startSongJob(
  server: string,
  files: PickedImage[],
  order: number[] | undefined,
  format: SongFormat,
): Promise<string> {
  const form = new FormData();
  for (const f of files) {
    form.append('files', {
      uri: f.uri,
      name: f.fileName,
      type: f.mimeType,
    } as unknown as Blob);
  }
  form.append('order', JSON.stringify(order ?? files.map((_, i) => i)));
  form.append('format', format);

  const start = await fetch(`${server}/omr/song`, { method: 'POST', body: form });
  if (!start.ok) {
    const detail = await start.text().catch(() => '');
    throw new Error(`Upload failed (${start.status}). ${detail.slice(0, 200)}`);
  }
  const { jobId } = (await start.json()) as { jobId: string };
  return jobId;
}

// Poll a song job until it's ready (returns the final status) or fails/times out.
async function pollSongJob(
  server: string,
  jobId: string,
  onProgress?: SongProgress,
  intervalMs = 2000,
  timeoutMs = 15 * 60 * 1000,
): Promise<SongJobStatus> {
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
    if (status.status === 'ready') return status;
    if (status.status === 'failed') {
      throw new Error(status.error || 'OMR failed while reading the score.');
    }
  }
  throw new Error('Timed out reading the score. Try fewer pages.');
}

/**
 * Upload several images/PDFs as ONE song in the given page order and return the
 * merged MusicXML text once the server has read every page. `order` is a
 * permutation of the indices of `files` (defaults to as-given).
 */
export async function runOmrSong(
  files: PickedImage[],
  order?: number[],
  onProgress?: SongProgress,
): Promise<string> {
  const server = await getOmrServer();
  if (!server) throw new OmrNotConfiguredError();
  if (!files.length) throw new Error('Add at least one page.');

  const jobId = await startSongJob(server, files, order, 'musicxml');
  const status = await pollSongJob(server, jobId, onProgress);
  if (!status.musicxml) throw new Error('Server returned no MusicXML.');
  return status.musicxml;
}

/**
 * Like {@link runOmrSong} but asks the server to analyze the merged score into a
 * full "professor" Lesson (time signature, hand separation, chord rolls) and
 * returns the ready-to-play Lesson JSON.
 */
export async function runSongLesson(
  files: PickedImage[],
  order?: number[],
  onProgress?: SongProgress,
): Promise<Lesson> {
  const server = await getOmrServer();
  if (!server) throw new OmrNotConfiguredError();
  if (!files.length) throw new Error('Add at least one page.');

  const jobId = await startSongJob(server, files, order, 'lesson');
  const status = await pollSongJob(server, jobId, onProgress);
  if (!status.lesson) throw new Error('Server returned no lesson.');
  return status.lesson;
}
