# Piano Professor — self-hosted OMR (homr)

Free Optical Music Recognition (photo of sheet music → MusicXML), so you don't pay per scan.
Wraps **[homr](https://github.com/liebharc/homr)** — a transformer-based OMR engine (the improved
successor to oemer, far more robust on phone photos) — in a tiny FastAPI service the app calls.
A photo-cleanup stage (`preprocess.py`) flattens, deskews, and de-shadows camera shots before
recognition.

- `app.py` —
  - `POST /omr` (multipart `file`): one image **or PDF** → MusicXML (multi-page PDFs are
    rendered with `pdftoppm`, OMR'd page-by-page, and merged into one score).
  - `POST /omr/score` (multipart `files`, repeated): **every page of a song** in one request →
    ONE merged MusicXML for the whole piece (klang.io-style whole-song conversion).
- `preprocess.py` — OpenCV photo cleanup: page detection + perspective correction, staff-line
  deskew (Hough), illumination flattening (shadow/glare removal). Every step is conservative —
  clean scans pass through untouched.
- `postprocess.py` — musical sanity pass (music21): drops "notes" outside the piano's A0..C8
  range, quantizes onsets/durations to a 16th + triplet grid (stops OMR duration drift), and
  rebuilds notation. Best-effort: unparseable engine output passes through unchanged.
- `Dockerfile` — builds the service with model weights baked in (`homr --init`).
- `deploy.sh` — one-command Cloud Run deploy; prints the address to paste into the app.

Env vars: `OMR_ENGINE` (`homr` default; `oemer` if you build it into the image),
`OMR_PREPROCESS` (`1` default; `0` disables photo cleanup),
`OMR_POSTPROCESS` (`1` default; `0` disables the musical sanity pass).

## Run locally
```bash
cd backend/omr
docker build -t pp-omr .
docker run -p 8000:8000 pp-omr
# test:
curl -F "file=@some_sheet.png" http://localhost:8000/omr -o out.musicxml
```
Then point a debug build at it from the app's hidden developer menu: **Settings → tap the
version row at the bottom seven times → Developer options → Scan server** → enter
`http://<your-LAN-ip>:8000` → **Test**. (`localhost` would be the phone.) Leave it blank to use
the offline demo score.

## Deploy

**Google Cloud Run** (simplest, scales to zero) — one command:

```bash
backend/omr/deploy.sh <gcp-project-id>            # optional second arg: region (default us-central1)
```

It requires the `gcloud` CLI (logged in once with `gcloud auth login`), builds the image on
Cloud Build from this directory, deploys it as `pp-omr` with 4 vCPU / 4 GiB / 900 s timeout,
then prints the service URL, the exact `serverUrl:` line to paste into
`src/omr/omrConfig.ts`, and runs a `curl …/health` check. The first deploy builds the model
weights into the image and takes 10-15 minutes; later ones are quicker.

(homr runs on onnxruntime — CPU works; more vCPUs = faster pages. Model weights are baked into
the image, so even the first request after a cold start is a container start, not a download.)

Other hosts (**a small VM / Fly.io / Render**): build the image and run it; put it behind HTTPS.

## Wiring the app

The app ships with the address **baked in**: `OMR_CONFIG.serverUrl` in `src/omr/omrConfig.ts`.
Paste the line `deploy.sh` prints there, rebuild, and every install scans against your service
with nothing for learners to configure.

The **Scan server** field in Settings is a developer override (it beats the baked-in address)
and is hidden behind Developer options — tap the version row seven times to show it. With no
address set anywhere, the Import screen shows the bundled demo score instead of scanning.

## Notes / limits
- Best input: a **clear photo or PNG/JPG** of *typeset* sheet music. Handwriting is still weak
  (true of all free OMR); skewed/shadowed photos are handled by `preprocess.py` + homr's own
  staff dewarping.
- **PDF** input is handled in `app.py` (rendered to PNG via poppler's `pdftoppm` at 200 dpi).
- A page takes on the order of a minute on CPU; budget `--timeout` accordingly for many pages.
- The app's pipeline (pages → MusicXML → merge → falling-notes player) is engine-agnostic, so
  you can swap in a paid engine (e.g. klang.io's API) later without touching the app.
