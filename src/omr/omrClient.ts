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
