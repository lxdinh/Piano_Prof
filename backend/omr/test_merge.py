"""Tests for merge_musicxml. Run: `python3 test_merge.py` or `pytest`.

Builds two one-measure single-part "pages" with music21, exports each to a
standalone MusicXML string (each numbered measure 1, as oemer emits), merges
them, and asserts the result is one part with two measures numbered 1,2.
"""
from music21 import stream, note, converter
from music21.musicxml.m21ToXml import GeneralObjectExporter

from merge import merge_musicxml


def _one_measure_page(pitch: str) -> str:
    """A standalone score-partwise with a single measure holding one whole note."""
    s = stream.Score()
    p = stream.Part()
    m = stream.Measure(number=1)
    n = note.Note(pitch)
    n.quarterLength = 4
    m.append(n)
    p.append(m)
    s.append(p)
    return GeneralObjectExporter(s).parse().decode("utf-8")


def test_merges_two_pages_in_order():
    page1 = _one_measure_page("C4")
    page2 = _one_measure_page("G4")

    merged = merge_musicxml([page1, page2])

    score = converter.parse(merged, format="musicxml")
    parts = list(score.parts)
    assert len(parts) == 1, f"expected 1 merged part, got {len(parts)}"

    measures = list(parts[0].getElementsByClass(stream.Measure))
    assert len(measures) == 2, f"expected 2 measures, got {len(measures)}"
    assert [m.number for m in measures] == [1, 2], "measures must renumber continuously"

    pitches = [n.nameWithOctave for n in score.recurse().notes]
    assert pitches == ["C4", "G4"], f"page order not preserved: {pitches}"


def test_single_page_roundtrips():
    merged = merge_musicxml([_one_measure_page("E4")])
    score = converter.parse(merged, format="musicxml")
    pitches = [n.nameWithOctave for n in score.recurse().notes]
    assert pitches == ["E4"], pitches


def test_skips_empty_pages():
    merged = merge_musicxml(["", _one_measure_page("D4"), "   "])
    score = converter.parse(merged, format="musicxml")
    pitches = [n.nameWithOctave for n in score.recurse().notes]
    assert pitches == ["D4"], pitches


if __name__ == "__main__":
    test_merges_two_pages_in_order()
    test_single_page_roundtrips()
    test_skips_empty_pages()
    print("OK: all merge tests passed")
