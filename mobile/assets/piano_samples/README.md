# Real piano sample pack (optional, recommended)

Drop a free sampled-piano pack here for an authentic acoustic sound. Until you do,
the app uses its built-in synth (still musical, with pedal + reverb) — so the build
never breaks.

## How
1. Get a free pack, e.g. **Salamander Grand** or **UprightPianoKW** (CC-licensed).
2. Convert the notes you want to small **.ogg** files (mono or stereo). You don't need
   all 88 keys — one sample every ~3 semitones is plenty; the app pitch-shifts to the
   exact note and picks the nearest sample.
3. Put the `.ogg` files in this folder and add a `manifest.json` (see
   `manifest.example.json`):

```json
{
  "samples": [
    { "midi": 36, "file": "C2.ogg" },
    { "midi": 48, "file": "C3.ogg" },
    { "midi": 60, "file": "C4.ogg" },
    { "midi": 72, "file": "C5.ogg" },
    { "midi": 84, "file": "C6.ogg" }
  ]
}
```

`midi` is the pitch the file was recorded at (C4 = 60). Rebuild the app to bundle them.
More sample points = more natural (less pitch-stretching); ~every 3 semitones is great.
