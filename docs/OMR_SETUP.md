# Turning on real sheet-music scanning

The app ships with an **offline demo score**, so importing works end to end —
pick pages, review the detected key and chords, play along — before any server
exists. Point it at a scan server and the same flow reads your own sheet music.
No app code changes; the client switches automatically once an address is set.

## Why self-hosted

Recognition is [homr](https://github.com/liebharc/homr), a transformer OMR
engine, wrapped in a small FastAPI service (`backend/omr/`). It costs nothing
per scan, unlike the commercial APIs. The trade is that you run it — and it
wants CPU, so it is not something the phone can do alone.

The client only knows `POST /omr/score`, so a paid engine can be swapped in
behind the same endpoint later without touching the app.

## 1. Run the server

```bash
cd backend/omr
docker build -t pp-omr .
docker run -p 8000:8000 pp-omr
curl localhost:8000/health          # {"ok":true,"engine":"homr"}
```

Model weights are baked into the image at build time (`homr --init`), so the
first scan is not slowed by a download.

Deploy to Cloud Run when you want it off your laptop:

```bash
gcloud run deploy pp-omr --source backend/omr --region us-central1 \
    --allow-unauthenticated --memory 4Gi --cpu 4 --timeout 900
```

Scaled to zero it costs nothing idle, at the price of a container cold start on
the first scan of a session. A page takes roughly a minute on CPU, so set
`--timeout` for the longest song you expect, not the shortest.

## 2. Point the app at it

**Settings → Scan server** → enter the address → **Test**. The test hits
`/health` and reports what answered, which is worth doing before wondering why a
scan hangs.

- On a phone testing against your laptop, use the LAN address
  (`http://192.168.1.x:8000`) — `localhost` is the phone.
- Android blocks plaintext HTTP to arbitrary hosts in release builds. Use HTTPS
  for anything but local debugging.
- Leave it empty to go back to the demo score.

For a shipped build you can instead set `OMR_CONFIG.serverUrl` in
`src/omr/omrConfig.ts`; the Settings value overrides it, so a debug build can
point elsewhere without a rebuild.

## 3. What good input looks like

Accuracy is the whole product risk, and it is dominated by the photo:

- **Typeset music, not handwriting.** Handwritten scores are weak on every free
  engine.
- **The whole staff in frame**, square to the page. `preprocess.py` corrects
  perspective and deskews, but it cannot invent a cropped bar.
- **Even light.** Shadow and glare are flattened, but a hard shadow across a
  system still costs notes.
- **One page per photo**, in reading order. PDFs are rendered and merged
  server-side.

The review step after scanning exists because none of this is ever perfect —
check the key, tempo and chord strip before saving.

## Endpoints

| Endpoint | Body | Returns |
|---|---|---|
| `GET /health` | — | `{ok, engine}` |
| `POST /omr` | `file` — one image or PDF | MusicXML for that file |
| `POST /omr/score` | `files` repeated — every page | ONE merged MusicXML |

The app prefers `/omr/score` so the server merges with full knowledge of each
page's divisions and clefs. If it 404s, the client falls back to per-page `/omr`
and merges locally (`src/omr/mergeMusicXml.ts`). Any other error is not retried
page by page — a 422 means the pages were read and no music was found, so
retrying would fail again more slowly.

## Privacy

Scans are yours. When Firebase sync is configured they go to
`users/{uid}/uploads/` and `users/{uid}/musicxml/`, which `storage.rules` scopes
to the owner alone — private backup, not a shared library. Nothing imported is
ever written to the world-readable `catalog/` tree.
