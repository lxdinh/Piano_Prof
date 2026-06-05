#!/usr/bin/env python3
"""
Pre-bake the Piano Professor instructor voice with Google **Gemini 2.5 TTS**.

Reads the line manifest produced by `mobile/tool/dump_lines.dart` and renders:
  - one clip per instructor line  -> mobile/assets/voice/lines/<id>.ogg
  - the 7 solfege syllables        -> mobile/assets/voice/solfege/{do..ti}.ogg

The app bundles these and plays them offline (no API key shipped, no per-play
cost). Re-run whenever lesson text changes, then rebuild the app.

Usage:
    pip install -r requirements.txt
    export GEMINI_API_KEY=...        # https://aistudio.google.com/apikey
    python generate_voice.py         # add --voice Sulafat / --wav / --force

Output is 24 kHz mono. We wrap Gemini's PCM into WAV, then convert to OGG with
ffmpeg if it's on PATH (much smaller APK); otherwise we keep WAV (the app loads
either). The id in the filename comes straight from the manifest — this script
never recomputes the hash, so it always matches the app.
"""
import argparse
import json
import os
import shutil
import struct
import subprocess
import sys
import wave
from pathlib import Path

# google-genai SDK
try:
    from google import genai
    from google.genai import types
except ImportError:
    sys.exit("Missing dependency. Run:  pip install -r requirements.txt")

HERE = Path(__file__).resolve().parent
MOBILE = HERE.parent.parent / "mobile"
LINES_MANIFEST = MOBILE / "assets" / "voice" / "lines.manifest.json"
LINES_DIR = MOBILE / "assets" / "voice" / "lines"
SOLFEGE_DIR = MOBILE / "assets" / "voice" / "solfege"

SAMPLE_RATE = 24000  # Gemini TTS returns L16 PCM @ 24 kHz, mono

# Warm, friendly teacher. Telling the model to pause naturally is exactly the
# "let AI Studio handle the pausing" the lessons want.
LINE_STYLE = (
    "You are Maestro Penguini, a warm, encouraging piano teacher speaking to a "
    "beginner. Read this clearly and kindly, at a relaxed pace, pausing "
    "naturally at commas and periods. Do not add any words:\n"
)
SOLFEGE_STYLE = (
    "Sing the single solfege syllable '{syl}' clearly and steadily on one "
    "sustained vowel, like a vocal warm-up. Only the syllable, nothing else."
)
SOLFEGE = ["do", "re", "mi", "fa", "sol", "la", "ti"]

_HAS_FFMPEG = shutil.which("ffmpeg") is not None


def synth_pcm(client: "genai.Client", model: str, voice: str, prompt: str) -> bytes:
    resp = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice
                    )
                )
            ),
        ),
    )
    return resp.candidates[0].content.parts[0].inline_data.data


def write_wav(path: Path, pcm: bytes) -> None:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)  # 16-bit
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm)


def to_ogg(wav: Path) -> Path:
    ogg = wav.with_suffix(".ogg")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
         "-c:a", "libvorbis", "-q:a", "4", str(ogg)],
        check=True,
    )
    wav.unlink(missing_ok=True)
    return ogg


def emit(client, model, voice, prompt, out_base: Path, force: bool, wav_only: bool) -> str:
    ogg, wav = out_base.with_suffix(".ogg"), out_base.with_suffix(".wav")
    if not force and (ogg.exists() or wav.exists()):
        return "skip"
    pcm = synth_pcm(client, model, voice, prompt)
    write_wav(wav, pcm)
    if not wav_only and _HAS_FFMPEG:
        to_ogg(wav)
    return "ok"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="Sulafat", help="Gemini prebuilt voice name")
    ap.add_argument("--model", default="gemini-2.5-flash-preview-tts")
    ap.add_argument("--force", action="store_true", help="regenerate existing clips")
    ap.add_argument("--wav", action="store_true", help="keep WAV (skip ffmpeg→ogg)")
    args = ap.parse_args()

    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        sys.exit("Set GEMINI_API_KEY (https://aistudio.google.com/apikey)")
    if not LINES_MANIFEST.exists():
        sys.exit(f"Missing {LINES_MANIFEST}\nRun first:  cd mobile && dart run tool/dump_lines.dart")
    if not _HAS_FFMPEG and not args.wav:
        print("! ffmpeg not found — writing WAV (bigger). Install ffmpeg for small OGG.")

    client = genai.Client(api_key=key)
    LINES_DIR.mkdir(parents=True, exist_ok=True)
    SOLFEGE_DIR.mkdir(parents=True, exist_ok=True)

    lines = json.loads(LINES_MANIFEST.read_text(encoding="utf-8"))["lines"]
    print(f"Generating {len(lines)} lines + {len(SOLFEGE)} syllables "
          f"(voice={args.voice}, model={args.model})")

    ok = skip = fail = 0
    for i, ln in enumerate(lines, 1):
        out = LINES_DIR / ln["id"]
        try:
            r = emit(client, args.model, args.voice, LINE_STYLE + ln["text"],
                     out, args.force, args.wav)
            ok += r == "ok"
            skip += r == "skip"
            print(f"[{i}/{len(lines)}] {r}  {ln['id']}  {ln['text'][:48]}")
        except Exception as e:  # noqa: BLE001 — keep going on a single failure
            fail += 1
            print(f"[{i}/{len(lines)}] FAIL {ln['id']}: {e}", file=sys.stderr)

    for syl in SOLFEGE:
        try:
            r = emit(client, args.model, args.voice, SOLFEGE_STYLE.format(syl=syl),
                     SOLFEGE_DIR / syl, args.force, args.wav)
            ok += r == "ok"
            skip += r == "skip"
            print(f"[solfege] {r}  {syl}")
        except Exception as e:  # noqa: BLE001
            fail += 1
            print(f"[solfege] FAIL {syl}: {e}", file=sys.stderr)

    print(f"\nDone. new={ok} skipped={skip} failed={fail}")
    print("Now rebuild the app to bundle the audio.")


if __name__ == "__main__":
    main()
