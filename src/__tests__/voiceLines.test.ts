import { extractSayLines, normalizeLine, voiceKey } from '../audio/voiceLines';
import type { Grade, Lesson } from '../lessons/schema';

// Same require idiom as lessons/loader.ts.
const grade1 = require('../lessons/data/grade1.json') as Grade;
const grade2 = require('../lessons/data/grade2.json') as Grade;

describe('normalizeLine', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeLine('  Hello   there \n friend  ')).toBe('Hello there friend');
  });
});

describe('voiceKey', () => {
  // Shared vector with scripts/gen-voice-lines.mjs — if the hash ever
  // diverges between the script and the app, bundled clips silently stop
  // matching. This pins both implementations.
  it("matches the script's djb2 vector", () => {
    expect(voiceKey('Hello!')).toBe('1etxlfe');
    expect(voiceKey('  Hello!  ')).toBe('1etxlfe'); // whitespace-insensitive
  });

  it('differs for different lines', () => {
    expect(voiceKey('Play C.')).not.toBe(voiceKey('Play D.'));
  });
});

describe('extractSayLines', () => {
  const lesson: Lesson = {
    id: 't1', grade: 1, title: 't', subtitle: '', complete: 'done', xpReward: 1,
    steps: [
      { segments: [
        { type: 'say', text: ' Hello  there ' },
        { type: 'pause', ms: 100 },
        { type: 'say', text: 'Hello there' }, // dupe after normalize
        { type: 'say', text: 'Second line' },
      ] },
    ],
  };

  it('dedupes normalized lines, preserving order', () => {
    expect(extractSayLines(lesson)).toEqual(['Hello there', 'Second line']);
  });

  it('finds every say line in the real lesson data with no key collisions', () => {
    const all = [...grade1.lessons, ...grade2.lessons].flatMap(extractSayLines);
    expect(all.length).toBeGreaterThan(0);
    const unique = new Set(all);
    const keys = new Set([...unique].map(voiceKey));
    expect(keys.size).toBe(unique.size); // djb2 collision would break lookup
  });
});
