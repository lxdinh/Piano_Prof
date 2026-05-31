"""Endpoint wiring tests for /omr/song using FastAPI's TestClient.

oemer is heavy and not installed here, so we monkeypatch `_run_oemer` to return a
fixture page per image. This exercises upload → ordering → background merge →
polling without the real OMR engine. Run: `python3 test_app.py` or `pytest`.
"""
import time
from fastapi.testclient import TestClient
from music21 import stream, note, converter
from music21.musicxml.m21ToXml import GeneralObjectExporter

import app as appmod


def _page(pitch: str) -> str:
    s = stream.Score(); p = stream.Part(); m = stream.Measure(number=1)
    m.append(note.Note(pitch)); p.append(m); s.append(p)
    return GeneralObjectExporter(s).parse().decode("utf-8")


# Map each saved upload (by the pitch encoded in its filename) to a fixture page.
def _fake_run_oemer(image_path: str, workdir: str) -> str:
    # filename like "000_C4.png" → "C4"
    name = image_path.rsplit("/", 1)[-1]
    pitch = name.split("_", 1)[-1].split(".")[0]
    return _page(pitch)


def _client():
    appmod._run_oemer = _fake_run_oemer  # type: ignore[attr-defined]
    return TestClient(appmod.app)


def _wait(client, job_id, timeout=10):
    deadline = time.time() + timeout
    while time.time() < deadline:
        j = client.get(f"/omr/song/{job_id}").json()
        if j["status"] in ("ready", "failed"):
            return j
        time.sleep(0.05)
    raise AssertionError("job did not finish")


def test_song_merges_in_requested_order():
    client = _client()
    files = [
        ("files", ("C4.png", b"x", "image/png")),
        ("files", ("G4.png", b"x", "image/png")),
    ]
    # order=[1,0] → G4 should come before C4 in the merged score.
    res = client.post("/omr/song", files=files, data={"order": "[1,0]", "title": "T"})
    assert res.status_code == 202, res.text
    job_id = res.json()["jobId"]

    j = _wait(client, job_id)
    assert j["status"] == "ready", j
    pitches = [n.nameWithOctave for n in converter.parse(j["musicxml"]).recurse().notes]
    assert pitches == ["G4", "C4"], pitches


def test_bad_order_is_rejected():
    client = _client()
    files = [("files", ("C4.png", b"x", "image/png"))]
    res = client.post("/omr/song", files=files, data={"order": "[5]"})
    assert res.status_code == 400, res.text


def test_unknown_job_is_404():
    client = _client()
    assert client.get("/omr/song/nope").status_code == 404


if __name__ == "__main__":
    test_song_merges_in_requested_order()
    test_bad_order_is_rejected()
    test_unknown_job_is_404()
    print("OK: all app endpoint tests passed")
