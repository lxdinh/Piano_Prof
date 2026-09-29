"""
Photo cleanup before OMR — the cheap half of "klang.io-level" accuracy.

OMR models are trained on flat, evenly lit scans; phone photos are warped,
shadowed and rotated. This module flattens a photo into something scan-like:

  1. page detection + perspective correction (find the paper quadrilateral,
     warp it to a flat rectangle),
  2. deskew (staff lines should be horizontal — measure their angle with a
     Hough transform and rotate the image back),
  3. illumination flattening (divide by a heavily blurred copy to remove
     shadows/glare, then re-normalize contrast).

Every step is conservative: if a step can't find what it expects (no page
quad, no confident skew angle) it returns the image unchanged, so a clean
scan passes through untouched. Disable entirely with OMR_PREPROCESS=0.
"""
from __future__ import annotations

import cv2
import numpy as np

MAX_DIM = 3500          # cap huge phone photos (keeps OMR memory/time sane)
MIN_PAGE_AREA_FRAC = 0.35  # a "page" quad must cover at least this much image
MAX_DESKEW_DEG = 15.0   # ignore wilder angles — probably not staff lines


def preprocess_page(in_path: str, out_path: str) -> str:
    """Clean one photographed page; returns the path the engine should read.

    Falls back to the original file if the image can't be decoded (e.g. an
    exotic format the engine itself may still handle).
    """
    img = cv2.imread(in_path, cv2.IMREAD_COLOR)
    if img is None:
        return in_path
    img = _limit_size(img)
    img = _flatten_page(img)
    img = _deskew(img)
    gray = _normalize_lighting(img)
    cv2.imwrite(out_path, gray)
    return out_path


def _limit_size(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    scale = MAX_DIM / max(h, w)
    if scale >= 1.0:
        return img
    return cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def _flatten_page(img: np.ndarray) -> np.ndarray:
    """Find the sheet's quadrilateral outline and warp it flat (perspective fix)."""
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    # Paper is the bright region — Otsu separates it from desk/background.
    _, mask = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return img
    page = max(contours, key=cv2.contourArea)
    if cv2.contourArea(page) < MIN_PAGE_AREA_FRAC * h * w:
        return img  # nothing page-sized found — likely already a tight crop

    peri = cv2.arcLength(page, True)
    quad = cv2.approxPolyDP(page, 0.02 * peri, True)
    if len(quad) != 4:
        return img
    quad = _order_corners(quad.reshape(4, 2).astype(np.float32))

    # Output size from the quad's own edge lengths (preserves aspect ratio).
    (tl, tr, br, bl) = quad
    out_w = int(max(np.linalg.norm(br - bl), np.linalg.norm(tr - tl)))
    out_h = int(max(np.linalg.norm(tr - br), np.linalg.norm(tl - bl)))
    if out_w < 200 or out_h < 200:
        return img
    dst = np.array([[0, 0], [out_w - 1, 0], [out_w - 1, out_h - 1], [0, out_h - 1]],
                   dtype=np.float32)
    matrix = cv2.getPerspectiveTransform(quad, dst)
    return cv2.warpPerspective(img, matrix, (out_w, out_h))


def _order_corners(pts: np.ndarray) -> np.ndarray:
    """Order 4 points as top-left, top-right, bottom-right, bottom-left."""
    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).reshape(-1)
    return np.array([pts[np.argmin(s)], pts[np.argmin(d)],
                     pts[np.argmax(s)], pts[np.argmax(d)]], dtype=np.float32)


def _deskew(img: np.ndarray) -> np.ndarray:
    """Rotate so staff lines are horizontal (median angle of long near-horizontal lines)."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    h, w = gray.shape[:2]
    lines = cv2.HoughLinesP(edges, 1, np.pi / 360, threshold=120,
                            minLineLength=w // 3, maxLineGap=8)
    if lines is None:
        return img
    angles = []
    for x1, y1, x2, y2 in lines.reshape(-1, 4):
        ang = np.degrees(np.arctan2(y2 - y1, x2 - x1))
        if abs(ang) <= MAX_DESKEW_DEG:  # near-horizontal → probably a staff line
            angles.append(ang)
    if len(angles) < 5:
        return img
    angle = float(np.median(angles))
    if abs(angle) < 0.3:
        return img  # already straight
    matrix = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    return cv2.warpAffine(img, matrix, (w, h), flags=cv2.INTER_CUBIC,
                          borderMode=cv2.BORDER_CONSTANT, borderValue=(255, 255, 255))


def _normalize_lighting(img: np.ndarray) -> np.ndarray:
    """Remove shadows/uneven lighting; output an evenly lit grayscale page.

    Dividing by a heavily blurred copy estimates the illumination field and
    cancels it — gentler than hard binarization, which would fight the OMR
    engine's own thresholding.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    sigma = max(gray.shape) // 30 | 1  # blur scale ~ page size, forced odd
    background = cv2.GaussianBlur(gray, (0, 0), sigmaX=sigma)
    flat = cv2.divide(gray, background, scale=255)
    return cv2.normalize(flat, None, 0, 255, cv2.NORM_MINMAX)
