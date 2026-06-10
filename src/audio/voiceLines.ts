import type { Lesson } from '../lessons/schema';

// Pre-generated voice line helpers.
//
// The set of lines the instructor speaks in lessons is finite (every `say`
// segment in the lesson JSONs), so they can be synthesized ONCE with a studio
// voice (Google Cloud TTS — see scripts/gen-voice-lines.mjs and
// docs/SERVICES_SETUP.md), bundled as assets, and played back offline for
// free. speak() looks lines up by voiceKey(); anything not pre-generated
// falls back to live TTS, so partial coverage is always safe.

/** Whitespace-insensitive form used for both generation and lookup. */
export function normalizeLine(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

// djb2, base36 — small, stable, collision-safe at this corpus size.
// MUST stay in sync with the copy in scripts/gen-voice-lines.mjs
// (verified by a shared test vector in voiceLines.test.ts).
export function voiceKey(text: string): string {
  const s = normalizeLine(text);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** Unique normalized `say` lines of a lesson, in first-appearance order. */
export function extractSayLines(lesson: Lesson): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const step of lesson.steps) {
    for (const seg of step.segments) {
      if (seg.type === 'say') {
        const line = normalizeLine(seg.text);
        if (line && !seen.has(line)) {
          seen.add(line);
          out.push(line);
        }
      }
    }
  }
  return out;
}
