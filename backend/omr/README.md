# Piano Professor — self-hosted OMR (oemer)

Free Optical Music Recognition (photo of sheet music → MusicXML), so you don't pay per scan.
Wraps **[oemer](https://github.com/BreezeWhite/oemer)** (open-source, MIT, deep-learning OMR) in a
tiny FastAPI service that the app calls.

- `app.py` — `POST /omr` (multipart `file`) → returns MusicXML. Matches `mobile/lib/omr/omr_service.dart`.
- `Dockerfile` — builds the service.

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
