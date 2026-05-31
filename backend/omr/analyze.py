"""Analyze a merged MusicXML score into a structured, hand-separated form.

This is the musical brain behind the "professor" lesson: from raw MusicXML it
pulls the things a teacher reads off the page first — time signature, key,
tempo — then splits the music into the right hand (treble) and left hand
(bass) and walks each one measure-by-measure as note events. It also chordifies
the score to name the chord under each measure and detect repeated chord loops.

Returns plain dataclasses (no app types) so `instruct.py` can turn it into the
Lesson JSON the mobile engine renders.
"""
from dataclasses import dataclass, field
from typing import Optional

from music21 import converter, meter, key, tempo, chord, note, stream


# Note event: the pitches that sound together at one onset in one hand, plus how
# long they last (in quarter lengths). `notes` are scientific pitch ("C4").
@dataclass
class NoteEvent:
    notes: list[str]
    quarter_length: float


@dataclass
class Measure:
    number: int
    events: list[NoteEvent] = field(default_factory=list)


@dataclass
class Hand:
    name: str                       # "left" | "right"
    measures: list[Measure] = field(default_factory=list)


@dataclass
class AnalyzedScore:
    title: str
    time_signature: Optional[str]   # "3/4"
    beats: int                      # numerator, e.g. 3
    key_signature: Optional[str]    # "G major"
    tempo_bpm: Optional[int]
    measure_count: int
    right: Hand
    left: Hand
    # Chord symbol per measure (best-effort), e.g. ["C", "Am", "F", "G"].
    chords_by_measure: list[str] = field(default_factory=list)


def _ts_string(score: stream.Score) -> tuple[Optional[str], int]:
    ts = score.recurse().getElementsByClass(meter.TimeSignature).first()
    if ts is None:
        return None, 4
    return ts.ratioString, ts.numerator


def _key_string(score: stream.Score) -> Optional[str]:
    ks = score.recurse().getElementsByClass(key.KeySignature).first()
    if ks is None:
        return None
    if isinstance(ks, key.Key):
        return ks.name  # e.g. "G major"
    try:
        return ks.asKey().name
    except Exception:
        return None


def _tempo_bpm(score: stream.Score) -> Optional[int]:
    mm = score.recurse().getElementsByClass(tempo.MetronomeMark).first()
    if mm is None or mm.number is None:
        return None
    return int(round(mm.number))


def _event_from_general_note(n) -> Optional[NoteEvent]:
    """Map a music21 Note/Chord to a NoteEvent; rests/other → None."""
    if isinstance(n, note.Note):
        return NoteEvent([n.nameWithOctave], float(n.quarterLength))
    if isinstance(n, chord.Chord):
        names = [p.nameWithOctave for p in n.pitches]
        return NoteEvent(names, float(n.quarterLength))
    return None


def _hand_from_part(part: stream.Part, name: str) -> Hand:
    hand = Hand(name=name)
    measures = list(part.getElementsByClass(stream.Measure))
    if measures:
        for i, m in enumerate(measures, start=1):
            mm = Measure(number=i)
            for n in m.notesAndRests:
                ev = _event_from_general_note(n)
                if ev:
                    mm.events.append(ev)
            hand.measures.append(mm)
    else:
        # No measure structure (rare from OMR): one synthetic measure.
        mm = Measure(number=1)
        for n in part.recurse().notes:
            ev = _event_from_general_note(n)
            if ev:
                mm.events.append(ev)
        hand.measures.append(mm)
    return hand


def _midi(name: str) -> int:
    try:
        return note.Note(name).pitch.midi
    except Exception:
        return 60


def _split_single_part_by_register(part: stream.Part, split_midi: int = 60) -> tuple[Hand, Hand]:
    """Fallback when OMR gives one staff: split notes by pitch (≥ C4 → right).

    Keeps measure alignment; within each measure, high notes go right, low left.
    """
    right, left = Hand("right"), Hand("left")
    measures = list(part.getElementsByClass(stream.Measure)) or [part]
    for i, m in enumerate(measures, start=1):
        rmm, lmm = Measure(number=i), Measure(number=i)
        source = m.notesAndRests if hasattr(m, "notesAndRests") else m.recurse().notes
        for n in source:
            ev = _event_from_general_note(n)
            if not ev:
                continue
            hi = [p for p in ev.notes if _midi(p) >= split_midi]
            lo = [p for p in ev.notes if _midi(p) < split_midi]
            if hi:
                rmm.events.append(NoteEvent(hi, ev.quarter_length))
            if lo:
                lmm.events.append(NoteEvent(lo, ev.quarter_length))
        right.measures.append(rmm)
        left.measures.append(lmm)
    return right, left


_QUALITY_SUFFIX = {
    "major": "", "minor": "m", "diminished": "dim", "augmented": "aug",
    "other": "", "": "",
}


def _chord_symbol(c: chord.Chord) -> Optional[str]:
    """Best-effort chord symbol like 'C', 'Am', 'Gdim' from a chord."""
    if c is None or not c.pitches:
        return None
    try:
        root = c.root()
        if root is None:
            return None
        suffix = _QUALITY_SUFFIX.get(c.quality, "")
        seventh = "7" if c.isSeventh() else ""
        return f"{root.name}{suffix}{seventh}"
    except Exception:
        return None


def _chords_by_measure(score: stream.Score) -> list[str]:
    """One representative chord symbol per measure via chordify()."""
    out: list[str] = []
    try:
        chords = score.chordify()
    except Exception:
        return out
    for m in chords.getElementsByClass(stream.Measure):
        sym = None
        for c in m.getElementsByClass(chord.Chord):
            sym = _chord_symbol(c)
            if sym:
                break  # first named chord in the bar is good enough
        if sym:
            out.append(sym)
    return out


def analyze_score(xml: str, title: str = "Imported song") -> AnalyzedScore:
    score = converter.parse(xml, format="musicxml")
    ts_str, beats = _ts_string(score)
    parts = list(score.parts)

    if len(parts) >= 2:
        right = _hand_from_part(parts[0], "right")
        left = _hand_from_part(parts[1], "left")
    elif len(parts) == 1:
        right, left = _split_single_part_by_register(parts[0])
    else:
        right, left = Hand("right"), Hand("left")

    measure_count = max(len(right.measures), len(left.measures))

    return AnalyzedScore(
        title=title,
        time_signature=ts_str,
        beats=beats,
        key_signature=_key_string(score),
        tempo_bpm=_tempo_bpm(score),
        measure_count=measure_count,
        right=right,
        left=left,
        chords_by_measure=_chords_by_measure(score),
    )


def detect_chord_loops(chords: list[str], min_len: int = 2, max_len: int = 8):
    """Find the shortest chord pattern that tiles the progression (a 'loop').

    Returns (pattern, repeat) for the best repeating block, or (chords, 1) if
    nothing tiles cleanly. Deterministic and unit-testable.
    """
    n = len(chords)
    if n == 0:
        return [], 0
    for length in range(min_len, min(max_len, n) + 1):
        if n % length != 0:
            continue
        pattern = chords[:length]
        if pattern * (n // length) == chords:
            return pattern, n // length
    return chords, 1
