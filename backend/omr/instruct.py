"""Turn an AnalyzedScore into a "professor" Lesson (the enriched instruction).

Pedagogy, like a teacher reading the page — NOT learn-by-heart:
  1. Read the score: announce the key and time signature.
  2. Feel the pulse: a rhythm `count` for the meter.
  3. Name the chord loop if the progression repeats.
  4. Work phrase by phrase (a few bars at a time):
       left hand first (rolling/"rải nốt" the chords), then the right-hand
       melody, then hands together — slowly.

Output is the Lesson dict the mobile engine renders (see src/lessons/schema.ts).
Pure and deterministic so it can be unit-tested without the OMR engine.
"""
import time

from music21 import note

from analyze import AnalyzedScore, Hand, NoteEvent, detect_chord_loops

MAX_MEASURES = 8     # keep the preview lesson short
CHUNK = 2            # bars taught per phrase


def _midi(name: str) -> int:
    try:
        return note.Note(name).pitch.midi
    except Exception:
        return 60


def _sorted_low_high(notes: list[str]) -> list[str]:
    return sorted(notes, key=_midi)


def _hand_color(hand: str) -> str:
    return {"left": "violet", "right": "cyan", "both": "green"}.get(hand, "cyan")


def _events_in_range(hand: Hand, lo: int, hi: int) -> list[NoteEvent]:
    """All note events whose measure number is in [lo, hi]."""
    out: list[NoteEvent] = []
    for m in hand.measures:
        if lo <= m.number <= hi:
            out.extend(m.events)
    return out


def _hand_segments(events: list[NoteEvent], hand: str, *, roll_chords: bool) -> list[dict]:
    """Segments for one hand: roll chords as arpeggios (left), else chord/seq."""
    segs: list[dict] = []
    color = _hand_color(hand)
    for ev in events:
        ordered = _sorted_low_high(ev.notes)
        if len(ordered) > 1:
            if roll_chords:
                segs.append({"type": "arpeggio", "notes": ordered, "color": color, "hand": hand})
            else:
                segs.append({"type": "chord", "notes": ordered, "color": color, "hand": hand})
        else:
            segs.append({"type": "seq", "notes": ordered, "color": color, "hand": hand, "delay": 350})
    return segs


def _together_segments(left: Hand, right: Hand, lo: int, hi: int) -> list[dict]:
    """Position-aligned merge of the two hands into 'both' chords, slowly."""
    segs: list[dict] = []
    le = _events_in_range(left, lo, hi)
    re = _events_in_range(right, lo, hi)
    for k in range(max(len(le), len(re))):
        notes: list[str] = []
        if k < len(le):
            notes += le[k].notes
        if k < len(re):
            notes += re[k].notes
        if not notes:
            continue
        ordered = _sorted_low_high(list(dict.fromkeys(notes)))
        segs.append({"type": "chord", "notes": ordered, "color": "green", "hand": "both", "wait": 1400})
    return segs


def analyzed_to_lesson(a: AnalyzedScore, title: str | None = None) -> dict:
    title = title or a.title
    segments: list[dict] = []

    # 1. Read the score.
    key_part = f" in the key of {a.key_signature}" if a.key_signature else ""
    ts_part = f", in {a.time_signature} time" if a.time_signature else ""
    segments.append({"type": "say",
                     "text": f"Let's learn {title}{key_part}{ts_part}. We'll read it like a musician — one phrase at a time."})

    # 2. Feel the pulse.
    if a.time_signature:
        count = {"type": "count", "beats": a.beats, "meter": a.time_signature, "bars": 2}
        if a.tempo_bpm:
            count["tempoBpm"] = a.tempo_bpm
        segments.append({"type": "say", "text": "First, feel the beat."})
        segments.append(count)

    # 3. Name the chord loop, if any.
    pattern, repeat = detect_chord_loops(a.chords_by_measure)
    sections = []
    if pattern and repeat > 1:
        sections.append({"label": "Main loop", "chords": pattern, "repeat": repeat})
        segments.append({"type": "say",
                         "text": f"This song rides a {len(pattern)}-chord loop: {', '.join(pattern)}, "
                                 f"repeating about {repeat} times. Hear that loop and it all falls into place."})

    # 4. Phrase by phrase: left hand, right hand, together.
    last = min(a.measure_count, MAX_MEASURES)
    bar = 1
    while bar <= last:
        hi = min(bar + CHUNK - 1, last)
        bars_label = f"bar {bar}" if bar == hi else f"bars {bar} to {hi}"

        left_ev = _events_in_range(a.left, bar, hi)
        right_ev = _events_in_range(a.right, bar, hi)

        if left_ev:
            segments.append({"type": "say",
                             "text": f"Left hand, {bars_label}. Roll each chord from the bottom note up — rải nốt từ hợp âm — then let it ring."})
            segments.extend(_hand_segments(left_ev, "left", roll_chords=True))

        if right_ev:
            segments.append({"type": "say",
                             "text": f"Now the right hand, {bars_label}. Keep it light and even."})
            segments.extend(_hand_segments(right_ev, "right", roll_chords=False))

        if left_ev and right_ev:
            segments.append({"type": "say", "text": "Now both hands together, slowly."})
            segments.extend(_together_segments(a.left, a.right, bar, hi))

        bar = hi + 1

    segments.append({"type": "say", "text": f"Beautiful. That's {title}. Play it through slowly, then build up speed."})

    meta = {
        "timeSignature": a.time_signature,
        "keySignature": a.key_signature,
        "tempoBpm": a.tempo_bpm,
        "measures": a.measure_count,
        "sections": sections,
    }
    # Drop empty values for a clean payload.
    meta = {k: v for k, v in meta.items() if v not in (None, [])}

    return {
        "id": f"omr-{int(time.time() * 1000):x}",
        "grade": 0,
        "title": title,
        "subtitle": "Imported from sheet music",
        "xpReward": 15,
        "complete": f"Nice work on {title}!",
        "steps": [{"segments": segments}],
        "meta": meta,
    }
