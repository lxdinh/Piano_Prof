# Instructor voice (pre-baked Gemini TTS) + sung solfège

The app speaks each lesson line with a natural Google **Gemini 2.5 TTS** voice and
"sings" Do-Re-Mi **in tune** with each key. The audio is generated **once**, off the
phone, and bundled here — so the app is fully offline, ships no API key, and costs
nothing per play. If these files are absent the app still runs (it shows the
instructor text and waits), so the build never breaks.

## How to generate (one time, and whenever lesson text changes)

```bash
# 1. Dump every unique instructor line → assets/voice/lines.manifest.json
cd mobile
dart run tool/dump_lines.dart

# 2. Generate the audio with your Google AI Studio key
cd ../backend/tts
pip install -r requirements.txt
export GEMINI_API_KEY=...      # from https://aistudio.google.com/apikey
python generate_voice.py        # writes mobile/assets/voice/lines/*.ogg + solfege/*.ogg
```

Re-run `flutter build` afterward to bundle the new audio.

## Layout
- `lines.manifest.json` — `{ "lines": [ {"id": "...", "text": "..."} ] }` (from step 1).
- `lines/<id>.ogg` — one clip per instructor line (id = first 16 hex of sha1 of the
  normalized text; see `lib/audio/voice_line_id.dart`).
- `solfege/{do,re,mi,fa,sol,la,ti}.ogg` — one clip per syllable; the app pitch-shifts
  each to the played note. For best tuning, generate them near C4 (~262 Hz).

`.wav` is also accepted if you can't run ffmpeg (the app tries `.ogg` then `.wav`).
