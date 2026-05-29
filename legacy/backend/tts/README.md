# Piano Professor — instructor voice generator (Gemini 2.5 TTS)

Pre-bakes the AI instructor voice and the sung solfège syllables once, so the app
plays them **offline** with no API key inside it and no per-play cost.

## Steps
```bash
# 1) Dump the lines the app speaks (writes mobile/assets/voice/lines.manifest.json)
cd mobile
dart run tool/dump_lines.dart

# 2) Generate the audio
cd ../backend/tts
pip install -r requirements.txt
export GEMINI_API_KEY=...        # https://aistudio.google.com/apikey  (Windows: set GEMINI_API_KEY=...)
python generate_voice.py          # --voice Sulafat  --force  --wav

# 3) Rebuild the app so the new audio is bundled
cd ../../mobile
flutter build apk --release
```

Outputs:
- `mobile/assets/voice/lines/<id>.ogg` — one per instructor line
- `mobile/assets/voice/solfege/{do,re,mi,fa,sol,la,ti}.ogg` — sung syllables

## Notes
- **Pausing** is handled by the model: the prompt asks it to read warmly and pause
  naturally at punctuation — no hand-tuned timing needed.
- **Solfège tuning:** Gemini speaks rather than sings, so the app pitch-shifts each
  syllable to the exact key. For the best in-tune feel, the recordings should sit
  near C4; they're generated as a steady single vowel to shift cleanly.
- **OGG vs WAV:** with `ffmpeg` on PATH the script writes small `.ogg`; otherwise it
  writes `.wav` (the app loads either). OGG keeps the APK small.
- Pick any Gemini voice with `--voice` (e.g. Sulafat, Kore, Puck). The clip id comes
  from the manifest and matches `mobile/lib/audio/voice_line_id.dart` exactly.
- The script is **idempotent** — re-runs skip existing clips; use `--force` to redo.
