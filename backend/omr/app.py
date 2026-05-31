"""
Piano Professor — self-hosted OMR service (FREE, no per-scan cost).

A FastAPI wrapper around `oemer` (https://github.com/BreezeWhite/oemer), an
open-source deep-learning Optical Music Recognition engine.

Endpoints
- GET  /health              — liveness probe.
- POST /omr                 — single image/PDF page → MusicXML (legacy contract).
- POST /omr/song            — MULTIPLE images/PDFs in a chosen page order →
                              one merged MusicXML. Returns 202 + {jobId}; the
                              client polls /omr/song/{jobId}. PDFs are rasterized
                              page-by-page (poppler) and each page is OMR'd, then
                              all pages are merged into one continuous score.
- GET  /omr/song/{jobId}    — poll job status; returns merged MusicXML when ready.
- GET  /                    — browser upload portal (static/index.html).

Run locally:   uvicorn app:app --host 0.0.0.0 --port 8000
Or build the Docker image (see Dockerfile) and deploy to Cloud Run / a VM.
Then set the URL in the app: Profile → OMR scan server.
"""
import os
import json
import shutil
import subprocess
import tempfile
import glob

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import Response, JSONResponse
from fastapi.staticfiles import StaticFiles

from pdf import is_pdf, pdf_to_pngs
from merge import merge_musicxml
from analyze import analyze_score
from instruct import analyzed_to_lesson
from jobs import STORE

app = FastAPI(title="Piano Professor OMR (oemer)")

MUSICXML_MEDIA = "application/vnd.recordare.musicxml+xml"


@app.get("/health")
def health():
    return {"ok": True, "engine": "oemer"}


def _run_oemer(image_path: str, workdir: str) -> str:
    """Run oemer on one image and return its MusicXML text. Raises on failure."""
    proc = subprocess.run(
        ["oemer", image_path, "-o", workdir],
        capture_output=True, text=True, timeout=600,
    )
    xmls = glob.glob(os.path.join(workdir, "*.musicxml")) + \
        glob.glob(os.path.join(workdir, "*.xml"))
    if not xmls:
        raise RuntimeError(
            f"OMR produced no MusicXML for {os.path.basename(image_path)}. "
            f"stderr: {proc.stderr[-500:]}"
        )
    # oemer names output after the input; pick the newest to be safe.
    xmls.sort(key=os.path.getmtime)
    with open(xmls[-1], "r", encoding="utf-8") as f:
        return f.read()


@app.post("/omr")
async def omr(file: UploadFile = File(...)):
    """Accept one image/PDF page, run oemer, return MusicXML (legacy contract)."""
    workdir = tempfile.mkdtemp(prefix="omr_")
    try:
        in_path = os.path.join(workdir, file.filename or "page.png")
        with open(in_path, "wb") as f:
            f.write(await file.read())
        if is_pdf(in_path):
            # Use only the first page for the single-page endpoint.
            in_path = pdf_to_pngs(in_path, workdir)[0]
        xml = _run_oemer(in_path, workdir)
        return Response(content=xml, media_type=MUSICXML_MEDIA)
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def _process_song(job_id: str, page_paths: list[str], workdir: str,
                  fmt: str, title: str) -> None:
    """Background worker: expand PDFs, OMR each page in order, merge, store.

    When `fmt == "lesson"` the merged score is analyzed (time/key signature,
    hand separation, chord loops) and turned into a "professor" Lesson.
    """
    try:
        # Expand the ordered uploads into an ordered list of image pages.
        image_pages: list[str] = []
        for p in page_paths:
            if is_pdf(p):
                image_pages.extend(pdf_to_pngs(p, os.path.join(workdir, "pdf")))
            else:
                image_pages.append(p)

        STORE.update(job_id, total_pages=len(image_pages))

        xmls: list[str] = []
        for i, img in enumerate(image_pages):
            page_dir = os.path.join(workdir, f"page_{i}")
            os.makedirs(page_dir, exist_ok=True)
            xmls.append(_run_oemer(img, page_dir))
            STORE.update(job_id, done_pages=i + 1)

        merged = merge_musicxml(xmls)
        lesson = None
        if fmt == "lesson":
            lesson = analyzed_to_lesson(analyze_score(merged, title), title)
        STORE.update(job_id, status="ready", result_xml=merged, result_lesson=lesson)
    except Exception as e:  # noqa: BLE001 — surface any failure to the client
        STORE.update(job_id, status="failed", error=str(e))
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


@app.post("/omr/song", status_code=202)
async def omr_song(
    background: BackgroundTasks,
    files: list[UploadFile] = File(...),
    order: str = Form("[]"),
    title: str = Form("Imported song"),
    format: str = Form("musicxml"),
):
    """Accept N images/PDFs + an `order` (JSON array of indices into `files`).

    Saves the uploads, kicks off background OMR+merge, and returns 202 + jobId.
    `format` is "musicxml" (default) or "lesson" (analyzed "professor" Lesson).
    The client polls GET /omr/song/{jobId} for the result.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    fmt = "lesson" if format == "lesson" else "musicxml"

    try:
        idx = json.loads(order) if order else []
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="`order` must be a JSON array.")
    if not idx:
        idx = list(range(len(files)))
    if sorted(idx) != list(range(len(files))):
        raise HTTPException(
            status_code=400,
            detail=f"`order` must be a permutation of 0..{len(files) - 1}.",
        )

    workdir = tempfile.mkdtemp(prefix="song_")
    saved: list[str] = []
    for n, f in enumerate(files):
        dest = os.path.join(workdir, f"{n:03d}_{f.filename or 'page'}")
        with open(dest, "wb") as out:
            out.write(await f.read())
        saved.append(dest)

    ordered_paths = [saved[i] for i in idx]
    job = STORE.create(title=title, total_pages=len(ordered_paths), fmt=fmt)
    background.add_task(_process_song, job.id, ordered_paths, workdir, fmt, title)
    return {"jobId": job.id, "status": job.status}


@app.get("/omr/song/{job_id}")
def omr_song_status(job_id: str):
    """Poll a song job. Returns merged MusicXML in `musicxml` once ready."""
    job = STORE.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Unknown jobId.")
    body = {
        "jobId": job.id,
        "status": job.status,
        "title": job.title,
        "totalPages": job.total_pages,
        "donePages": job.done_pages,
    }
    if job.status == "ready":
        body["musicxml"] = job.result_xml
        if job.result_lesson is not None:
            body["lesson"] = job.result_lesson
    elif job.status == "failed":
        body["error"] = job.error
    return JSONResponse(body)


@app.post("/lesson/from-musicxml")
async def lesson_from_musicxml(
    file: UploadFile = File(...),
    title: str = Form("Imported song"),
):
    """Analyze an already-merged MusicXML into a 'professor' Lesson (synchronous).

    Handy for re-processing a cached score or testing the analysis without oemer.
    """
    xml = (await file.read()).decode("utf-8", errors="replace")
    try:
        lesson = analyzed_to_lesson(analyze_score(xml, title), title)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=f"Analysis failed: {e}")
    return JSONResponse(lesson)


# Browser upload portal. Mounted last so it doesn't shadow the API routes above.
_STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(_STATIC_DIR):
    app.mount("/", StaticFiles(directory=_STATIC_DIR, html=True), name="portal")
