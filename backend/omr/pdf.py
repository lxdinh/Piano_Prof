"""PDF → PNG rasterizing for the OMR pipeline.

oemer reads images, not PDFs. A customer-uploaded song page is often a PDF (one
or more pages), so we rasterize each PDF page to a PNG with poppler's `pdftoppm`
(already installed in the Docker image). Each PNG becomes one ordered OMR unit.
"""
import os
import glob
import subprocess


def is_pdf(path: str) -> bool:
    """Cheap content sniff: a PDF starts with the `%PDF-` magic bytes."""
    try:
        with open(path, "rb") as f:
            return f.read(5) == b"%PDF-"
    except OSError:
        return path.lower().endswith(".pdf")


def pdf_to_pngs(path: str, out_dir: str, dpi: int = 200) -> list[str]:
    """Rasterize every page of `path` to PNGs in `out_dir`, returned in page order.

    Uses `pdftoppm -png -r <dpi> <pdf> <prefix>`, which writes
    `<prefix>-1.png`, `<prefix>-2.png`, … (zero-padded for many pages). We sort
    the results numerically so page order is preserved.
    """
    os.makedirs(out_dir, exist_ok=True)
    prefix = os.path.join(out_dir, "page")
    proc = subprocess.run(
        ["pdftoppm", "-png", "-r", str(dpi), path, prefix],
        capture_output=True, text=True, timeout=300,
    )
    pngs = glob.glob(prefix + "-*.png")
    if not pngs:
        raise RuntimeError(
            f"pdftoppm produced no pages for {os.path.basename(path)}. "
            f"stderr: {proc.stderr[-300:]}"
        )

    def page_num(p: str) -> int:
        # filename like ".../page-12.png" → 12
        stem = os.path.splitext(os.path.basename(p))[0]
        try:
            return int(stem.rsplit("-", 1)[1])
        except (IndexError, ValueError):
            return 0

    return sorted(pngs, key=page_num)
