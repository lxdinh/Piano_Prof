# Maestro Penguini — mascot assets

The app renders a polished SVG penguin fallback when a PNG is missing, so the
app keeps shipping without these. Drop any of the files below to upgrade the
mood instantly — no code changes needed beyond uncommenting one line per file
in `src/components/MascotImage.tsx`.

## Spec

- **Format:** PNG with transparent background
- **Size:** **1024 × 1024** (square; the mascot rendered area fits inside ~80%
  of the canvas, leaving headroom for accessories like a graduation cap)
- **Color profile:** sRGB
- **Style guide:** thick outlines, flat fills with a hint of gradient, cream-paper-friendly. Bowtie can stay in any mood for brand consistency.

## Files (drop into this folder, lowercase)

| Filename | Use case |
|---|---|
| `happy.png` | default state — Learn tab, idle |
| `wave.png` | onboarding intro |
| `thinking.png` | during quiz step (LessonScreen) |
| `wow.png` | first time learning a chord |
| `sad.png` | out-of-hearts modal |
| `sleepy.png` | "come back tomorrow" / streak at risk |
| `laugh.png` | playful moments |
| `wink.png` | "you got this" / encouragement |
| `cheer.png` | quiz correct |
| `love.png` | favorite a song |
| `shocked.png` | wrong-answer feedback |
| `cool.png` | premium / settings |
| `trophy.png` | LessonComplete + Achievement unlock |

## After dropping a file

In `src/components/MascotImage.tsx` find the `PNG_SOURCES` map and uncomment
the matching line, e.g.

```ts
happy: require('../../assets/mascots/happy.png'),
```

That's it. The component crossfades between moods automatically.
