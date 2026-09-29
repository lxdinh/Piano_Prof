# Turning on real sheet-music scanning

The app ships with an **offline demo score**, so importing works end to end —
pick pages, review the detected key and chords, play along — before any server
exists. Give it a scan server and the same flow reads your own sheet music.
The client switches automatically once an address is set; with none, the
Import screen shows the demo score.

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

Deploy to Cloud Run when you want it off your laptop — one command, needs the
`gcloud` CLI:

```bash
backend/omr/deploy.sh <gcp-project-id>      # optional second arg: region (default us-central1)
```

It builds the image on Cloud Build, deploys `pp-omr` (4 vCPU, 4 GiB, 900 s
timeout, public), then prints the service URL, the exact `serverUrl:` line to
paste into the app, and runs a health check. The first deploy is slow (10-15
minutes: model weights go into the image); later ones are quicker.

Scaled to zero it costs nothing idle, at the price of a container cold start on
the first scan of a session. A page takes roughly a minute on CPU, so the
timeout is sized for the longest song you expect, not the shortest.

## 2. Point the app at it

The shipped app has the address **baked in**. Paste the line `deploy.sh`
printed into `OMR_CONFIG.serverUrl` in `src/omr/omrConfig.ts`, rebuild, and
every install scans against your service with nothing for learners to set up.

For pointing a build somewhere else without a rebuild — your laptop on the
LAN, a staging deploy — there is a developer override. It is hidden so no
learner trips over it: **Settings → tap the version row at the bottom seven
times** (a toast confirms "Developer options enabled") **→ Developer options →
Scan server** → enter the address → **Test**. The test hits `/health` and
reports what answered, which is worth doing before wondering why a scan hangs.
Debug builds (`__DEV__`) always show the row.

- On a phone testing against your laptop, use the LAN address
  (`http://192.168.1.x:8000`) — `localhost` is the phone.
- Android blocks plaintext HTTP to arbitrary hosts in release builds. Use HTTPS
  for anything but local debugging.
- The override beats the baked-in address. Leave it empty to fall back to
  `OMR_CONFIG.serverUrl` — and with no address anywhere, to the demo score.
- Seven more taps on the version row hide the developer section again; the
  saved override still applies until it is cleared.

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
