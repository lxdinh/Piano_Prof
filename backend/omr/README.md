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
- `Dockerfile` — builds the service with model weights baked in (`homr --init`).

Env vars: `OMR_ENGINE` (`homr` default; `oemer` if you build it into the image),
`OMR_PREPROCESS` (`1` default; `0` disables photo cleanup).

## Run locally
```bash
cd backend/omr
docker build -t pp-omr .
docker run -p 8000:8000 pp-omr
# test:
curl -F "file=@some_sheet.png" http://localhost:8000/omr -o out.musicxml
```
Then in the app: **Profile → OMR scan server** → enter your URL (e.g. `http://<your-LAN-ip>:8000`
for local testing, or your deployed HTTPS URL). Leave it blank to use the offline demo score.

## Deploy (pick one)
- **Google Cloud Run** (simplest, scales to zero):
  ```bash
  gcloud run deploy pp-omr --source backend/omr --region us-central1 \
      --allow-unauthenticated --memory 4Gi --cpu 4 --timeout 900
  ```
  (homr runs on onnxruntime — CPU works; more vCPUs = faster pages. Model weights are baked
  into the image, so even the first request is fast.)
- **A small VM / Fly.io / Render**: build the image and run it; put it behind HTTPS.

## Notes / limits
- Best input: a **clear photo or PNG/JPG** of *typeset* sheet music. Handwriting is still weak
  (true of all free OMR); skewed/shadowed photos are handled by `preprocess.py` + homr's own
  staff dewarping.
- **PDF** input is handled in `app.py` (rendered to PNG via poppler's `pdftoppm` at 200 dpi).
- A page takes on the order of a minute on CPU; budget `--timeout` accordingly for many pages.
- The app's pipeline (pages → MusicXML → merge → falling-notes player) is engine-agnostic, so
  you can swap in a paid engine (e.g. klang.io's API) later without touching the app.
