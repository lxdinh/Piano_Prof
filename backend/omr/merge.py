"""Merge per-page MusicXML into one continuous score.

oemer emits a standalone `<score-partwise>` per page, each with its own part
list and measures numbered from 1. Naively concatenating the XML strings is
invalid. We use music21 to parse each page and append the measures of page N>0
onto the matching part of page 0, renumbering measures so they run continuously.

Part matching is positional: page-2 part #1 is appended to page-1 part #1, etc.
This keeps the two staves (right hand / left hand) aligned across page breaks,
which is exactly what a multi-page piano score needs.

`merge_musicxml(xml_list)` returns the merged MusicXML as a string.
"""
from music21 import converter, stream
from music21.musicxml.m21ToXml import GeneralObjectExporter


def _measures(part: stream.Part) -> list:
    return list(part.getElementsByClass(stream.Measure))


def _to_xml_string(score: stream.Score) -> str:
    return GeneralObjectExporter(score).parse().decode("utf-8")


def merge_musicxml(xml_list: list[str]) -> str:
    """Merge MusicXML strings (already in page order) into one MusicXML string.

    - Empty/whitespace pages are skipped.
    - A single page is returned re-serialized (normalizes the document).
    - Parts are matched by position; extra parts on later pages are ignored
      (oemer occasionally emits an inconsistent part count on a noisy page).
    """
    pages = [x for x in xml_list if x and x.strip()]
    if not pages:
        raise ValueError("merge_musicxml: no non-empty MusicXML pages given")

    base = converter.parse(pages[0], format="musicxml")
    base_parts = list(base.parts)
    if not base_parts:
        # No parts parsed on the first page; fall back to a later usable page.
        for xml in pages[1:]:
            base = converter.parse(xml, format="musicxml")
            base_parts = list(base.parts)
            if base_parts:
                break
        if not base_parts:
            raise ValueError("merge_musicxml: no parts found in any page")

    for xml in pages[1:]:
        score = converter.parse(xml, format="musicxml")
        for i, part in enumerate(score.parts):
            if i >= len(base_parts):
                break  # later page has more parts than the base; ignore extras
            for m in _measures(part):
                base_parts[i].append(m)

    # Renumber measures continuously per part so the merged score is consistent.
    for part in base_parts:
        for n, m in enumerate(_measures(part), start=1):
            m.number = n

    return _to_xml_string(base)
