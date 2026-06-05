# Key Spacing & Cross-Piano Fit

Goal: one fixed LED strip that fits **most modern pianos**. Based on measured octave
spans across popular brands (real pianos only — synths/portable controllers excluded).

## 1. Measured octave spans (popular brands)

| Brand / reference | Octave span | Note |
|---|---|---|
| DS6.5 industry standard | **165.1 mm (6.5″) ± 1.0 mm** | "All conventional pianos stay within 0.04″ of 6.5″" |
| Historical average 1876–2000 | **165 mm** (range 164–166) | Measured population |
| Steinway / Kawai / Casio (e.g. PX560) | ~165 mm | Follow the 6.5″ standard |
| **Yamaha** (published, full-size keys) | **164 mm** | Low outlier — and the #1 brand |
| EXCLUDED: Yamaha Montage (161), mini-key portables | — | Synths/controllers, not pianos |

**Real range = 164–166 mm, centered/averaged at 165 mm (6.5″).** This is wider and
higher than a naive "164–165"; the population clusters on the 6.5″ standard.

## 2. Optimal octave width = 165 mm

A single strip can't match every piano; pick the value that minimizes the
**worst-case** piano over the real range.

    minimax over 164–166 mm  →  midpoint = 165 mm
    chromatic pitch = 165 / 12 = 13.75 mm
    white-key pitch = 165 / 7  = 23.571 mm

165 mm is simultaneously the **midpoint** of the range, the **mode** (most brands sit
there → zero drift), and the **historical mean**.

> Why not 164.5? An earlier pass used 164.5 assuming a *uniform* spread over a
> too-narrow 164–165 range. Over the true 164–166 range a 164.5 strip is *worse* —
> it sits 1.5 mm from the 166 end vs 1.0 mm for a 165 strip. 165 mm is correct.

## 3. Deviation — and anchoring halves it

Per-key error `δ = 13.75 − piano_octave/12`. Drift accumulates with distance from the
anchor, so **anchor at the keyboard center**, not an end.

| Piano octave | How common | Pitch (mm) | δ /key | Center-anchored drift (5 oct ends) | End-anchored |
|---|---|---|---|---|---|
| 164.0 (Yamaha) | common | 13.667 | +0.083 | ±2.46 mm | 4.92 mm |
| 164.5 | some | 13.708 | +0.042 | ±1.23 mm | 2.46 mm |
| **165.0 (standard)** | **most** | 13.750 | 0 | **0** | 0 |
| 165.5 | some | 13.792 | −0.042 | ±1.23 mm | 2.46 mm |
| 166.0 | rare | 13.833 | −0.083 | ±2.46 mm | 4.92 mm |

Most pianos (165 mm) → **zero** drift. Worst popular case — **Yamaha at 164 mm** —
≤ 2.46 mm at the strip ends center-anchored, still diffuser-invisible. (88-key
scale-up: ≤ 3.6 mm center-anchored at the extremes.)

## 4. Optional Yamaha hedge

Yamaha (164 mm) is the biggest single brand *and* the worst fit at 165 mm. If your
target market skews heavily Yamaha, set the strip to **164.5 mm / 13.708 mm**: that
halves Yamaha's drift to 1.2 mm, at the cost of the 165-standard pianos drifting
1.2 mm instead of 0. (A market-share-weighted optimum sits ~164.5–164.7 mm if Yamaha
dominates.) **Default 165 mm** unless you know Yamaha is the majority of your units.

## 5. Mounting for center-anchor

- Fiducial/registration mark at the strip **center** (between LED 30 and 31); align
  it to the middle of your 5-octave window (~middle C).
- Optionally silkscreen each octave's **C** so an installer can spot-check left/right.

## 6. Per-LED distances (165 mm octave, 13.75 mm pitch)

offset 6.875 mm (half-pitch), cell length 165 mm:

| LED | note | x (mm) | LED | note | x (mm) |
|----:|:----:|-------:|----:|:----:|-------:|
| 1 | C  | 6.875   | 7  | F# | 89.375  |
| 2 | C# | 20.625  | 8  | G  | 103.125 |
| 3 | D  | 34.375  | 9  | G# | 116.875 |
| 4 | D# | 48.125  | 10 | A  | 130.625 |
| 5 | E  | 61.875  | 11 | A# | 144.375 |
| 6 | F  | 75.625  | 12 | B  | 158.125 |

Global 60-LED reference (from strip left end): `x(j) = 6.875 + j × 13.75`, j = 0..59.
Octave C's at 6.875, 171.875, 336.875, 501.875, 666.875; last LED (B) at 818.125;
strip = 825 mm.

## 7. Honest note on magnitudes

The cross-piano drift here (≤ ±2.46 mm worst, mostly 0) is comparable to or smaller
than the **within-octave** offset your uniform-spacing choice already carries (~5–7 mm
at C/F/B — uniform can't represent the E–F and B–C no-black-key gaps). Both are
diffuser-invisible. If you ever want true per-key centering, geometric per-octave
positions scaled to 165 mm fix the larger one. Uniform is retained per your
mounting-simplicity decision.

## Sources

- DS Standard Foundation — the conventional 6.5″ octave + tolerance:
  https://dsstandardfoundation.org/the-standards/
- PASK (Pianists for Alternatively Sized Keyboards) — keyboard history / standard:
  https://paskpiano.org/keyboard-history/
- Yamaha FAQ — key width & octave distance, full-size keys:
  https://faq.yamaha.com/usa/s/article/U0008717
- PianoWorld forum — measured cross-brand key/keyboard dimensions:
  https://forum.pianoworld.com/ubbthreads.php/topics/316362.html
