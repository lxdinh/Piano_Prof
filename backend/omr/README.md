# Piano Professor — self-hosted OMR (oemer)

Free Optical Music Recognition (photo of sheet music → MusicXML), so you don't pay per scan.
Wraps **[oemer](https://github.com/BreezeWhite/oemer)** (open-source, MIT, deep-learning OMR) in a
tiny FastAPI service that the app calls.

- `app.py` — the FastAPI service. Endpoints:
  - `POST /omr` (multipart `file`) → MusicXML. Single image/PDF page (legacy contract).
  - `POST /omr/song` (multipart `files` ×N + `order` JSON + optional `title`) → `202 {jobId}`.
    Uploads a whole song as multiple images/PDFs in a chosen page order; PDFs are
    rasterized page-by-page, each page is OMR'd, and all pages are **merged into one**
    MusicXML.
  - `GET /omr/song/{jobId}` → poll status (`processing|ready|failed`); returns the merged
    `musicxml` when ready (and a `lesson` when `format=lesson` was requested).
  - `POST /lesson/from-musicxml` (multipart `file` + optional `title`) → a **"professor"
    Lesson** JSON, analyzed synchronously from an already-merged MusicXML (handy for
    testing/re-processing without oemer).
  - `GET /` → a browser **upload portal** (`static/index.html`): pick files, reorder, submit.
- `merge.py` / `pdf.py` / `jobs.py` — MusicXML merging (music21), PDF→PNG (poppler), job store.
- `analyze.py` / `instruct.py` — read meter/key/tempo, split the two hands, detect chord
  loops, and generate the step-by-step left-hand-first "professor" Lesson.
- `Dockerfile` — builds the service.

Pass `format=lesson` to `POST /omr/song` to get the analyzed Lesson back from the poll
endpoint instead of raw MusicXML; this is what the mobile app requests.

## Run locally
```bash
cd backend/omr
docker build -t pp-omr .
docker run -p 8000:8000 pp-omr
# test single page:
curl -F "file=@some_sheet.png" http://localhost:8000/omr -o out.musicxml
# test a multi-page song (ordered) — returns a jobId, then poll:
curl -F "files=@p1.png" -F "files=@p2.png" -F 'order=[0,1]' \
     -F 'title=My Song' http://localhost:8000/omr/song
curl http://localhost:8000/omr/song/<jobId>
# or just open http://localhost:8000/ in a browser and upload there.
```
Then in the app: **Profile → OMR scan server** → enter your URL (e.g. `http://<your-LAN-ip>:8000`
for local testing, or your deployed HTTPS URL). Leave it blank to use the offline demo score.

## Deploy (pick one)
- **Google Cloud Run** (simplest, scales to zero):
  ```bash
  gcloud run deploy pp-omr --source backend/omr --region us-central1 \
      --allow-unauthenticated --memory 4Gi --cpu 2 --timeout 600
  ```
  (oemer + TensorFlow needs RAM; 4Gi is a safe start. First request downloads model weights.)
- **A small VM / Fly.io / Render**: build the image and run it; put it behind HTTPS.

## Notes / limits
- Best input: a **clear photo or PNG/JPG** of *typeset* sheet music. Handwriting/very skewed photos
  are weaker (true of all free OMR).
- **PDF**: oemer expects images. To accept PDFs, convert to PNG first (poppler is installed —
  `pdftoppm`); add that step in `app.py` if you need PDF input.
- First scan is slow (model download + TF warm-up); later scans are faster.
- Accuracy is good but not Klang.io-grade. The app's pipeline (group → MusicXML → notation +
  highlight → chord lesson) is identical regardless of engine, so you can swap engines later.
