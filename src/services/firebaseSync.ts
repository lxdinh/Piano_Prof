import { getString, setString } from '../storage/settings';

// Firebase persistence for imported songs, over the plain REST APIs (Identity
// Toolkit + Cloud Storage + Firestore) so we add zero native dependencies and
// keep working in Expo Go. The user pastes their web API key + project id once
// (Import screen → "Save to Firebase"); we sign in anonymously, upload the
// merged MusicXML to Storage at users/{uid}/musicxml/{itemId}.xml, and index it
// in Firestore at users/{uid}/library/{itemId} (see backend/firebase/SCHEMA.md
// §1f). The anonymous session is cached and refreshed so the same device keeps
// the same uid (and therefore the same library) across restarts.

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super('Firebase not configured');
    this.name = 'FirebaseNotConfiguredError';
  }
}

export interface FirebaseConfig {
  apiKey: string;
  projectId: string;
  bucket: string;
}

export interface SavedSong {
  id: string;
  title: string;
  musicXmlPath: string;
  pageCount: number;
  createdAt: string; // ISO
}

export async function getFirebaseConfig(): Promise<FirebaseConfig | null> {
  const [apiKey, projectId, bucket] = await Promise.all([
    getString('firebaseApiKey'),
    getString('firebaseProjectId'),
    getString('firebaseBucket'),
  ]);
  if (!apiKey?.trim() || !projectId?.trim()) return null;
  return {
    apiKey: apiKey.trim(),
    projectId: projectId.trim(),
    // Newer projects default to *.firebasestorage.app; older ones *.appspot.com.
    bucket: bucket?.trim() || `${projectId.trim()}.firebasestorage.app`,
  };
}

// ── Anonymous auth (Identity Toolkit REST) ──────────────────────────────────

interface Session {
  uid: string;
  idToken: string;
}

async function ensureSignedIn(cfg: FirebaseConfig): Promise<Session> {
  const [uid, idToken, refreshToken, expiry] = await Promise.all([
    getString('firebaseUid'),
    getString('firebaseIdToken'),
    getString('firebaseRefreshToken'),
    getString('firebaseTokenExpiry'),
  ]);

  // Cached token still valid (1-minute safety margin)?
  if (uid && idToken && expiry && Date.now() < Number(expiry) - 60_000) {
    return { uid, idToken };
  }

  // Refresh the session if we have one — keeps the uid (and library) stable.
  if (refreshToken) {
    const r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${cfg.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
    });
    if (r.ok) {
      const d = await r.json();
      await storeSession(d.user_id, d.id_token, d.refresh_token, Number(d.expires_in));
      return { uid: d.user_id, idToken: d.id_token };
    }
  }

  // First run (or refresh revoked): create a fresh anonymous user.
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${cfg.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }),
    },
  );
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    throw new Error(`Firebase sign-in failed (${r.status}). Enable Anonymous auth in the Firebase console. ${detail.slice(0, 200)}`);
  }
  const d = await r.json();
  await storeSession(d.localId, d.idToken, d.refreshToken, Number(d.expiresIn));
  return { uid: d.localId, idToken: d.idToken };
}

async function storeSession(uid: string, idToken: string, refreshToken: string, expiresInSec: number) {
  await Promise.all([
    setString('firebaseUid', uid),
    setString('firebaseIdToken', idToken),
    setString('firebaseRefreshToken', refreshToken),
    setString('firebaseTokenExpiry', String(Date.now() + expiresInSec * 1000)),
  ]);
}

// ── Save / load songs ────────────────────────────────────────────────────────

const STORAGE_API = 'https://firebasestorage.googleapis.com/v0/b';
const FIRESTORE_API = 'https://firestore.googleapis.com/v1/projects';

function libraryDocsUrl(cfg: FirebaseConfig, uid: string, itemId = ''): string {
  return `${FIRESTORE_API}/${cfg.projectId}/databases/(default)/documents/users/${uid}/library${itemId ? `/${itemId}` : ''}`;
}

/** Upload the merged MusicXML + index it in the user's library. Returns itemId. */
export async function saveSongToFirebase(
  title: string,
  xml: string,
  pageCount: number,
): Promise<string> {
  const cfg = await getFirebaseConfig();
  if (!cfg) throw new FirebaseNotConfiguredError();
  const { uid, idToken } = await ensureSignedIn(cfg);
  const auth = { Authorization: `Firebase ${idToken}` };

  const itemId = `omr-${Date.now().toString(36)}`;
  const objectName = `users/${uid}/musicxml/${itemId}.xml`;

  const up = await fetch(
    `${STORAGE_API}/${cfg.bucket}/o?uploadType=media&name=${encodeURIComponent(objectName)}`,
    { method: 'POST', headers: { ...auth, 'Content-Type': 'application/vnd.recordare.musicxml+xml' }, body: xml },
  );
  if (!up.ok) {
    const detail = await up.text().catch(() => '');
    throw new Error(`Storage upload failed (${up.status}). ${detail.slice(0, 200)}`);
  }

  const now = new Date().toISOString();
  const doc = await fetch(`${libraryDocsUrl(cfg, uid)}?documentId=${itemId}`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        title: { stringValue: title },
        source: { stringValue: 'photoOmr' },
        status: { stringValue: 'ready' },
        originalAssetPath: { stringValue: '' },
        musicXmlPath: { stringValue: objectName },
        pageCount: { integerValue: String(pageCount) },
        createdAt: { timestampValue: now },
        updatedAt: { timestampValue: now },
      },
    }),
  });
  if (!doc.ok) {
    const detail = await doc.text().catch(() => '');
    throw new Error(`Saving library entry failed (${doc.status}). ${detail.slice(0, 200)}`);
  }
  return itemId;
}

/** List the songs previously saved by this device's anonymous user. */
export async function listSavedSongs(): Promise<SavedSong[]> {
  const cfg = await getFirebaseConfig();
  if (!cfg) throw new FirebaseNotConfiguredError();
  const { uid, idToken } = await ensureSignedIn(cfg);

  const r = await fetch(`${libraryDocsUrl(cfg, uid)}?pageSize=100`, {
    headers: { Authorization: `Firebase ${idToken}` },
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    throw new Error(`Loading library failed (${r.status}). ${detail.slice(0, 200)}`);
  }
  const data = await r.json();
  const docs: any[] = data.documents ?? [];
  return docs
    .map((d) => {
      const f = d.fields ?? {};
      return {
        id: String(d.name).split('/').pop() ?? '',
        title: f.title?.stringValue ?? 'Untitled',
        musicXmlPath: f.musicXmlPath?.stringValue ?? '',
        pageCount: Number(f.pageCount?.integerValue ?? '1'),
        createdAt: f.createdAt?.timestampValue ?? '',
      };
    })
    .filter((s) => s.musicXmlPath)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Download a saved song's MusicXML back from Cloud Storage. */
export async function downloadSongXml(musicXmlPath: string): Promise<string> {
  const cfg = await getFirebaseConfig();
  if (!cfg) throw new FirebaseNotConfiguredError();
  const { idToken } = await ensureSignedIn(cfg);

  const r = await fetch(
    `${STORAGE_API}/${cfg.bucket}/o/${encodeURIComponent(musicXmlPath)}?alt=media`,
    { headers: { Authorization: `Firebase ${idToken}` } },
  );
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    throw new Error(`Download failed (${r.status}). ${detail.slice(0, 200)}`);
  }
  return r.text();
}
