# Octave Board — Layout Coordinates (AS-BUILT, solder lap, ONE Gerber)

ONE board design, built ×5, soldered into a 60-LED strip by lap joints.
**These numbers are verified against `octave-module/octave-module.kicad_pcb` (2026-06-03, "balanced 12 mm" left end).**
Coordinates are KiCad absolute mm (origin top-left, **Y increases downward**), so they can be
checked directly against the file. "From J3" = distance from the input lap pad, which is the
octave/seam reference point.

> ⚠️ Supersedes the old 13.75 mm / 165 mm-octave / 167×25 mm version of this doc.
> The strip is now **13.708 mm pitch** (164.5 mm Yamaha-hedge octave, see KEY_SPACING_FIT.md §4).

## Pitch & board
- **LED pitch = 13.708 mm** (uniform, within-board *and* across every seam).
- **Octave pitch = 12 × 13.708 = 164.496 mm** = the input→output lap-pad span (J3→J2) on one board.
- **Board outline: X 53.297918 → 221.643918 = 168.346 mm wide; Y 43 → 55 = 12 mm tall.**
- Lap overlap = **3.85 mm** (left g_left = 2.0 mm, right tab g5 = 1.85 mm).

## Components — absolute X (mm), and X measured from J3
| Ref | Net / role | Abs X | From J3 | Y | Layer |
|---|---|---:|---:|---:|---|
| Left edge | board cut | 53.297918 | −2.0 | 43–55 | Edge.Cuts |
| **J3** | input lap pads `+5V/GND/DIN` | 55.297918 | 0 | 49.5 | **B.Cu (bottom)** |
| **J1** | JST-SH 4-pin controller in | 56.4 | +1.102 | 50.2 (−90°) | F.Cu (top) |
| **LED1** | WS2812B (D1) | 62.151918 | 6.854 | 51.5 | F.Cu |
| LED2 | D2 | 75.859918 | 20.562 | 51.5 | F.Cu |
| LED3 | D3 | 89.567918 | 34.27 | 51.5 | F.Cu |
| LED4 | D4 | 103.275918 | 47.978 | 51.5 | F.Cu |
| LED5 | D5 | 116.983918 | 61.686 | 51.5 | F.Cu |
| LED6 | D6 | 130.691918 | 75.394 | 51.5 | F.Cu |
| LED7 | D7 | 144.399918 | 89.102 | 51.5 | F.Cu |
| LED8 | D8 | 158.107918 | 102.81 | 51.5 | F.Cu |
| LED9 | D9 | 171.815918 | 116.518 | 51.5 | F.Cu |
| LED10 | D10 | 185.523918 | 130.226 | 51.5 | F.Cu |
| LED11 | D11 | 199.231918 | 143.934 | 51.5 | F.Cu |
| **LED12** | D12 | 212.939918 | 157.642 | 51.5 | F.Cu |
| **J2** | output lap pads `+5V/GND/DOUT` | 219.793918 | 164.496 | 49.5 | **F.Cu (top)** |
| Right edge | board cut | 221.643918 | 166.346 | 43–55 | Edge.Cuts |

- **Caps C1–C12** (0.1 µF, 0603): each sits at **its LED's X**, Y = 48 (3.5 mm above the LED row) → also uniform 13.708 mm.
- **Lap pads** (J2 & J3): three 1.8 (X) × 1.5 (Y) mm pads at Y = 46.5 / 49.5 / 52.5 = `+5V / GND / DATA`; same Y on both so they align when stacked. **J2 (output) has a 0.8 mm PLATED through-hole in each pad** (2026-06-04): to solder a seam, stack the boards, **flip the assembly**, and solder each joint from the back through J2's holes — there's a copper ring on the back to solder to, and the fill bonds down onto board N+1's solid J3 pad (which caps the hole). J2 is at the right end, far from J1, so 0.8 mm has no clearance issue. **J3 stays solid** so it caps J2's hole for a clean fill.
- **J1** is all-SMD (no holes); cable exits **left, off the left edge**. Leftmost J1 copper (signal pads, X≈54.1) is **0.8 mm inside** the cut and **0.78 mm from LED1's body**; silk is inside; only the courtyard sits ~0.2 mm over the edge (cable side — correct).

## Key gaps (the spacing that makes 13.708 work)
- J3 → LED1 = **6.854 mm** (½ pitch) · LED12 → J2 = **6.854 mm** (½ pitch) · their sum = one pitch.
- J3 → J2 = **164.496 mm** = octave pitch (this is what the lap joint registers).
- Left edge → J3 = 2.0 mm · J2 → right edge = 1.85 mm.

## Seam / lap mating
- Board N+1's **J3 (bottom)** solders directly onto board N's **J2 (top)** → `+5V→+5V`, `GND→GND`, `DOUT→DIN`. ~0.2 mm step (negligible once glued flat).
- Because J3→J2 = 164.496 = 12 × pitch, that shift = exactly one octave ⇒
  **LED12(N) → LED1(N+1) = 6.854 + 6.854 = 13.708 mm.**
- **LED12-coverage check:** the part of board N+1 that lies over board N is only its left margin (g_left = 2.0 mm). The next board's left edge lands at strip X = J2 − g_left = **217.794**, i.e. **5.35 mm right of the previous LED12 center** → **2.35 mm clear of the 5 mm LED12 body**. No LED is covered. (Pulling the left edge any further left raises g_left and eats this margin — at g_left ≈ 4.1 mm it covers LED12.)

## Full strip (60 LEDs)
`x(k) = (k−1) × 13.708 mm`, k = 1..60. Boards: 1→LED1-12, 2→13-24, 3→25-36, 4→37-48, 5→49-60.
LED60 at 808.772 mm from LED1. All four seam gaps = 13.708 mm.

## Population (single JLCPCB order, ONE Gerber)
- **Board 1:** populate **J1** + **J2**. **J3 = bare unused pads** (bottom face, opposite J1) — nothing to remove, no conflict with J1.
- **Boards 2–5:** **DNP J1**; **J2 + J3 used** for the lap joints. J1's empty top-face pads sit over the previous tab — harmless.
- Population is all-or-none per part in one PCBA order ⇒ **DNP J1 for the whole order, hand-solder J1 onto board 1.** Board 5's J2 is unused (chain end).

## Left-end note (12 mm height is tight here)
J1 (~4.8 mm of copper) shares the left margin with the J3 lap pad and the LED12 overlap. On the 12 mm board this is balanced, not generous: J1 ≈ 0.8 mm from both the edge and LED1; LED12 ≈ 2.35 mm clear. A taller board (~16 mm) would let J1 move to its own row above the LEDs and free all three clearances — revisit if the diffuser channel allows.

## Still TODO before Gerber export
- **Route the board** — there are currently **zero copper traces/vias** (+5V, GND, and the J3/J1→D1…D12→J2 data chain are unrouted).
- **Refill the GND zone** (KiCad `B`) and run **DRC** (expect a benign J1 courtyard-over-edge note — the cable side).
