"""Tests for analyze.py + instruct.py. Run: `python3 test_analyze.py` or pytest.

Builds a synthetic two-staff score (3/4, G major): a right-hand melody and a
left-hand triad per bar. Asserts the analysis reads meter/key/hands and that the
generated "professor" lesson teaches left hand first, rolls chords, and counts.
"""
from music21 import stream, note, chord, meter, key, tempo
from music21.musicxml.m21ToXml import GeneralObjectExporter

from analyze import analyze_score, detect_chord_loops
from instruct import analyzed_to_lesson


def _fixture_xml() -> str:
    score = stream.Score()

    right = stream.Part()
    for bar, pitches in enumerate((["G4", "A4", "B4"], ["C5", "B4", "A4"])):
        m = stream.Measure()
        if bar == 0:
            m.append(meter.TimeSignature("3/4"))
            m.append(key.Key("G"))
            m.insert(0, tempo.MetronomeMark(number=90))
        for p in pitches:
            m.append(note.Note(p, quarterLength=1))
        right.append(m)

    left = stream.Part()
    for bar, triad in enumerate((["G2", "B2", "D3"], ["C3", "E3", "G3"])):
        m = stream.Measure()
        if bar == 0:
            m.append(meter.TimeSignature("3/4"))
            m.append(key.Key("G"))
        m.append(chord.Chord(triad, quarterLength=3))
        left.append(m)

    score.insert(0, right)
    score.insert(0, left)
    return GeneralObjectExporter(score).parse().decode("utf-8")


def test_analyze_reads_meter_key_hands():
    a = analyze_score(_fixture_xml(), "Test Tune")
    assert a.time_signature == "3/4", a.time_signature
    assert a.beats == 3, a.beats
    assert a.key_signature and "G" in a.key_signature, a.key_signature
    assert a.tempo_bpm == 90, a.tempo_bpm
    assert len(a.right.measures) == 2, a.right.measures
    assert len(a.left.measures) == 2, a.left.measures
    # Left hand bar 1 should be a 3-note chord event.
    left_first = a.left.measures[0].events[0]
    assert len(left_first.notes) == 3, left_first.notes


def test_lesson_teaches_left_first_and_rolls_chords():
    a = analyze_score(_fixture_xml(), "Test Tune")
    lesson = analyzed_to_lesson(a, "Test Tune")
    segs = lesson["steps"][0]["segments"]
    types = [s["type"] for s in segs]

    assert lesson["meta"]["timeSignature"] == "3/4"
    assert "count" in types, types
    assert "arpeggio" in types, types  # left-hand chord is rolled

    # Left-hand instruction must come before right-hand instruction.
    says = [s["text"] for s in segs if s["type"] == "say"]
    left_idx = next(i for i, t in enumerate(says) if "Left hand" in t)
    right_idx = next(i for i, t in enumerate(says) if "right hand" in t.lower())
    assert left_idx < right_idx, (left_idx, right_idx)

    # Arpeggio notes are ordered low → high.
    arp = next(s for s in segs if s["type"] == "arpeggio")
    midis = [note.Note(n).pitch.midi for n in arp["notes"]]
    assert midis == sorted(midis), midis


def test_detect_chord_loops():
    assert detect_chord_loops(["C", "Am", "F", "G", "C", "Am", "F", "G"]) == (["C", "Am", "F", "G"], 2)
    assert detect_chord_loops(["C", "D", "E"]) == (["C", "D", "E"], 1)
    assert detect_chord_loops([]) == ([], 0)


if __name__ == "__main__":
    test_analyze_reads_meter_key_hands()
    test_lesson_teaches_left_first_and_rolls_chords()
    test_detect_chord_loops()
    print("OK: all analyze/instruct tests passed")
