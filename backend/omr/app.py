"""
Piano Professor — self-hosted OMR service (FREE, no per-scan cost).

A tiny FastAPI wrapper around `oemer` (https://github.com/BreezeWhite/oemer),
an open-source deep-learning Optical Music Recognition engine. The Flutter app
POSTs a sheet-music image (or PDF page) to /omr and gets MusicXML back — the
exact contract `mobile/lib/omr/omr_service.dart` expects.

Run locally:   uvicorn app:app --host 0.0.0.0 --port 8000
Or build the Docker image (see Dockerfile) and deploy to Cloud Run / a VM.
Then set the URL in the app: Profile → OMR scan server.
"""
import os
import shutil
import subprocess
import tempfile
import glob

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response

app = FastAPI(title="Piano Professor OMR (oemer)")


@app.get("/health")
def health():
    return {"ok": True, "engine": "oemer"}


@app.post("/omr")
async def omr(file: UploadFile = File(...)):
    """Accept an image/PDF page, run oemer, return MusicXML."""
    workdir = tempfile.mkdtemp(prefix="omr_")
    try:
        in_path = os.path.join(workdir, file.filename or "page.png")
        with open(in_path, "wb") as f:
            f.write(await file.read())

        # oemer writes <name>.musicxml next to the input (or in -o output dir).
        # `oemer <image> -o <dir>` → produces a .musicxml in <dir>.
        proc = subprocess.run(
            ["oemer", in_path, "-o", workdir],
            capture_output=True, text=True, timeout=600,
        )
        xmls = glob.glob(os.path.join(workdir, "*.musicxml")) + \
            glob.glob(os.path.join(workdir, "*.xml"))
        if not xmls:
            raise HTTPException(
                status_code=422,
                detail=f"OMR produced no MusicXML. stderr: {proc.stderr[-500:]}",
            )
        with open(xmls[0], "r", encoding="utf-8") as f:
            xml = f.read()
        return Response(content=xml, media_type="application/vnd.recordare.musicxml+xml")
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
