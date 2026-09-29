"""
Musical sanity pass over OMR output — fixes errors that are *musically*
impossible rather than visually wrong. Runs after recognition (and after
multi-page merging), via music21:

  1. drop "notes" outside the piano's range (A0..C8) — stray blobs the
     engine promoted to notes,
  2. quantize onsets/durations to a 16th-note (and triplet) grid — OMR
     duration errors otherwise drift every following beat,
  3. rebuild notation (beams/measures/accidental spelling) so the cleaned
     score re-exports as well-formed MusicXML.

Everything is best-effort: if music21 can't digest the engine's output, the
original XML is returned untouched. Disable with OMR_POSTPROCESS=0.
"""
from __future__ import annotations

PIANO_LOW = 21   # A0
PIANO_HIGH = 108  # C8


def clean_musicxml(xml: str) -> str:
    """Return a musically-sanitized version of `xml` (or `xml` unchanged on failure)."""
    try:
        from music21 import converter
        from music21.musicxml.m21ToXml import GeneralObjectExporter

        score = converter.parseData(xml, format="musicxml")
        _drop_out_of_range(score)
        # 16ths (divisor 4) + triplets (divisor 3); fixes the small duration
        # errors OMR makes, which otherwise shift every later onset.
        score.quantize((4, 3), processOffsets=True, processDurations=True,
                       inPlace=True, recurse=True)
        _drop_zero_length(score)
        out = GeneralObjectExporter().parse(score)
        text = out.decode("utf-8") if isinstance(out, bytes) else str(out)
        # Re-exported score must still be a partwise document our clients parse.
        return text if "<score-partwise" in text and "<note" in text else xml
    except Exception:
        return xml


def _drop_out_of_range(score) -> None:
    from music21 import chord, note

    for n in list(score.recurse().notes):
        if isinstance(n, chord.Chord):
            bad = [p for p in n.pitches if not PIANO_LOW <= p.midi <= PIANO_HIGH]
            if len(bad) == len(n.pitches):
                _replace_with_rest(n)
            else:
                for p in bad:
                    n.remove(p)
        elif isinstance(n, note.Note):
            if not PIANO_LOW <= n.pitch.midi <= PIANO_HIGH:
                _replace_with_rest(n)


def _drop_zero_length(score) -> None:
    """Quantizing can collapse tiny OMR artifacts to zero length — remove them."""
    for n in list(score.recurse().notesAndRests):
        if n.duration.quarterLength == 0:
            ctx = n.getContextByClass("Stream")
            if ctx is not None:
                ctx.remove(n)


def _replace_with_rest(n) -> None:
    """Swap a bogus note for an equal-length rest so measure math stays intact."""
    from music21 import note as m21note

    ctx = n.getContextByClass("Stream")
    if ctx is None:
        return
    r = m21note.Rest()
    r.duration = n.duration
    ctx.replace(n, r)
