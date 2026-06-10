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
import re
import shutil
import subprocess
import tempfile
import glob
from typing import List

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response

app = FastAPI(title="Piano Professor OMR")

# Engine: homr (transformer-based, much more robust on phone photos) by
# default; set OMR_ENGINE=oemer to fall back to the previous engine.
ENGINE = os.environ.get("OMR_ENGINE", "homr")
# Photo cleanup (perspective/deskew/lighting — see preprocess.py); OMR_PREPROCESS=0 disables.
PREPROCESS = os.environ.get("OMR_PREPROCESS", "1") != "0"
# Musical sanity pass (range/quantize/notation — see postprocess.py); OMR_POSTPROCESS=0 disables.
POSTPROCESS = os.environ.get("OMR_POSTPROCESS", "1") != "0"

XML_MEDIA_TYPE = "application/vnd.recordare.musicxml+xml"
PART_RE = re.compile(r"<part\s[^>]*>[\s\S]*?</part>")
MEASURE_RE = re.compile(r"<measure[\s\S]*?</measure>")


@app.get("/health")
def health():
    return {"ok": True, "engine": ENGINE, "preprocess": PREPROCESS, "postprocess": POSTPROCESS}


def _save_upload(workdir: str, file: UploadFile, data: bytes, index: int = 0) -> str:
    name = file.filename or f"page{index}.png"
    path = os.path.join(workdir, f"{index:03d}_{os.path.basename(name)}")
    with open(path, "wb") as f:
        f.write(data)
    return path


def _expand_pdf(workdir: str, path: str) -> List[str]:
    """Render each PDF page to PNG (poppler's pdftoppm ships in the image)."""
    prefix = os.path.join(workdir, os.path.basename(path) + "_pg")
    subprocess.run(
        ["pdftoppm", "-r", "200", "-png", path, prefix],
        capture_output=True, text=True, timeout=300, check=False,
    )
    pages = sorted(glob.glob(prefix + "*.png"))
    if not pages:
        raise HTTPException(status_code=422, detail="Could not render the PDF.")
    return pages


def _run_oemer(workdir: str, image_path: str) -> str:
    """Run the configured OMR engine on one page image; return its MusicXML."""
    pagedir = tempfile.mkdtemp(prefix="page_", dir=workdir)
    if ENGINE == "oemer":
        cmd = ["oemer", image_path, "-o", pagedir]
    else:
        # homr writes <input>.musicxml next to its input — give it a private
        # dir so concurrent pages can't clobber each other.
        local = os.path.join(pagedir, os.path.basename(image_path))
        shutil.copy(image_path, local)
        cmd = ["homr", local]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
    xmls = glob.glob(os.path.join(pagedir, "*.musicxml")) + \
        glob.glob(os.path.join(pagedir, "*.xml"))
    if not xmls:
        raise HTTPException(
            status_code=422,
            detail=f"OMR ({ENGINE}) produced no MusicXML for {os.path.basename(image_path)}. "
                   f"stderr: {proc.stderr[-500:]}",
        )
    with open(xmls[0], "r", encoding="utf-8") as f:
        return f.read()


def merge_musicxml(pages: List[str]) -> str:
    """Merge per-page MusicXML docs into one continuous score.

    Mirrors src/omr/mergeMusicXml.ts: page 1 is the base document; later pages'
    measures are appended to the matching part (by position) and measure
    numbers are renumbered sequentially. Each page keeps its own opening
    <attributes>, which is valid MusicXML and preserves per-page divisions.
    """
    usable = [p for p in pages if PART_RE.search(p)]
    if not usable:
        raise HTTPException(status_code=422, detail="No readable MusicXML pages to merge.")
    if len(usable) == 1:
        return usable[0]

    base = usable[0]
    base_parts = PART_RE.findall(base)
    extra: List[List[str]] = [[] for _ in base_parts]
    for page in usable[1:]:
        for i, part in enumerate(PART_RE.findall(page)):
            if i < len(extra):
                extra[i].extend(MEASURE_RE.findall(part))

    state = {"i": 0}

    def splice(m: "re.Match[str]") -> str:
        part_xml = m.group(0)
        extras = extra[state["i"]] if state["i"] < len(extra) else []
        state["i"] += 1
        if extras:
            part_xml = re.sub(r"</part>\s*$", "\n".join(extras) + "\n</part>", part_xml)
        counter = {"n": 0}

        def renumber(mm: "re.Match[str]") -> str:
            counter["n"] += 1
            return f'{mm.group(1)}{counter["n"]}{mm.group(2)}'

        return re.sub(r'(<measure\b[^>]*?\bnumber=")[^"]*(")', renumber, part_xml)

    return PART_RE.sub(splice, base)


def _maybe_postprocess(xml: str) -> str:
    """Musical sanity pass (see postprocess.py). Best-effort: falls back to raw XML."""
    if not POSTPROCESS:
        return xml
    try:
        from postprocess import clean_musicxml
        return clean_musicxml(xml)
    except Exception:
        return xml


def _maybe_preprocess(path: str) -> str:
    """Flatten/deskew/de-shadow a photographed page (see preprocess.py).
    Best-effort: any failure falls back to the raw image."""
    if not PREPROCESS:
        return path
    try:
        from preprocess import preprocess_page
        return preprocess_page(path, os.path.splitext(path)[0] + "_clean.png")
    except Exception:
        return path


async def _pages_from_upload(workdir: str, file: UploadFile, index: int) -> List[str]:
    data = await file.read()
    path = _save_upload(workdir, file, data, index)
    is_pdf = (file.content_type or "").endswith("pdf") or path.lower().endswith(".pdf")
    if is_pdf:
        # PDF renders are already flat and evenly lit — skip the photo cleanup.
        return _expand_pdf(workdir, path)
    return [_maybe_preprocess(path)]


@app.post("/omr")
async def omr(file: UploadFile = File(...)):
    """One image (or PDF) in → MusicXML out. Multi-page PDFs are merged."""
    workdir = tempfile.mkdtemp(prefix="omr_")
    try:
        images = await _pages_from_upload(workdir, file, 0)
        xml = _maybe_postprocess(merge_musicxml([_run_oemer(workdir, img) for img in images]))
        return Response(content=xml, media_type=XML_MEDIA_TYPE)
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


@app.post("/omr/score")
async def omr_score(files: List[UploadFile] = File(...)):
    """Whole-song endpoint: every page of the score (images and/or PDFs, in
    order) in one request → ONE merged MusicXML for the full song."""
    workdir = tempfile.mkdtemp(prefix="omr_")
    try:
        images: List[str] = []
        for i, f in enumerate(files):
            images.extend(await _pages_from_upload(workdir, f, i))
        if not images:
            raise HTTPException(status_code=400, detail="No pages received.")
        xml = _maybe_postprocess(merge_musicxml([_run_oemer(workdir, img) for img in images]))
        return Response(content=xml, media_type=XML_MEDIA_TYPE)
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
