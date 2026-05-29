// Piano Professor — the Kindergarten → Master pathway.
//
// Single source of truth for the Learn tab. Six levels, twelve numbered
// Grades, plus songs and exercises interleaved — mirroring the design the
// app ships with. Items that link to an authored, playable lesson carry a
// `lessonRef`; the rest render as locked or "soon" until authored.

export type PathItemKind = 'grade' | 'song' | 'exercise' | 'concept';

export interface Level {
  id: string;
  index: number;        // 1..6
  name: string;         // "Level 1 · Kindergarten"
  short: string;        // "Kindergarten"
  objective: string;
  duration: string;     // "2–4 weeks"
}

export interface PathItem {
  id: string;
  levelId: string;
  title: string;        // "Grade 1: Layout & 1-3-5 Chords" | "Mary Had a Little Lamb"
  kind: PathItemKind;
  gradeNumber?: number; // 1..12 for grades
  /** Links to a playable authored lesson, when one exists. */
  lessonRef?: { gradeId: number; lessonId: string };
  /** Authored but not yet released — shows a "SOON" chip, not a lock. */
  soon?: boolean;
}

export const LEVELS: Level[] = [
  {
    id: 'kindergarten', index: 1, name: 'Level 1 · Kindergarten', short: 'Kindergarten',
    objective: 'Meet the keyboard, your hands, and your first chord shape. Overcome the fear and play.',
    duration: '2–4 weeks',
  },
  {
    id: 'elementary', index: 2, name: 'Level 2 · Elementary', short: 'Elementary',
    objective: 'Scales and rhythm: the major/minor formulas and steady two-hand playing.',
    duration: '1–2 months',
  },
  {
    id: 'middle', index: 3, name: 'Level 3 · Middle School', short: 'Middle School',
    objective: 'Chords and the universal progression; accompany real pop songs.',
    duration: '2–3 months',
  },
  {
    id: 'high', index: 4, name: 'Level 4 · High School', short: 'High School',
    objective: 'Minor chords, the Axis progression, and Roman-numeral thinking.',
    duration: '3–6 months',
  },
  {
    id: 'university', index: 5, name: 'Level 5 · University', short: 'University',
    objective: 'Circle of fifths, seventh chords, and your first real solo pieces.',
    duration: '6 months–1 year',
  },
  {
    id: 'master', index: 6, name: 'Level 6 · Master', short: 'Master',
    objective: 'Inversions, voice leading, and bringing every tool together.',
    duration: 'Lifetime mastery',
  },
];

export const PATH_ITEMS: PathItem[] = [
  // ── Level 1 · Kindergarten ───────────────────────────────────
  { id: 'g1', levelId: 'kindergarten', kind: 'grade', gradeNumber: 1,
    title: 'Grade 1: Layout & 1-3-5 Chords', lessonRef: { gradeId: 1, lessonId: 'g1-l1' } },
  { id: 'k-posture', levelId: 'kindergarten', kind: 'concept', title: 'Posture & Hand Position',
    lessonRef: { gradeId: 1, lessonId: 'g1-l2' } },
  { id: 'g2', levelId: 'kindergarten', kind: 'grade', gradeNumber: 2,
    title: 'Grade 2: Landmarks & Navigation', lessonRef: { gradeId: 2, lessonId: 'g2-l1' } },
  { id: 'k-mary', levelId: 'kindergarten', kind: 'song', title: 'Mary Had a Little Lamb' },
  { id: 'k-frere', levelId: 'kindergarten', kind: 'song', title: 'Frère Jacques' },

  // ── Level 2 · Elementary ─────────────────────────────────────
  { id: 'g3', levelId: 'elementary', kind: 'grade', gradeNumber: 3, title: 'Grade 3: Half & Whole Steps' },
  { id: 'g4', levelId: 'elementary', kind: 'grade', gradeNumber: 4, title: 'Grade 4: Major Scale Formula' },
  { id: 'e-twinkle', levelId: 'elementary', kind: 'song', title: 'Twinkle Twinkle' },
  { id: 'e-birthday', levelId: 'elementary', kind: 'song', title: 'Happy Birthday' },

  // ── Level 3 · Middle School ──────────────────────────────────
  { id: 'g5', levelId: 'middle', kind: 'grade', gradeNumber: 5, title: 'Grade 5: Minor Scale Formula' },
  { id: 'g6', levelId: 'middle', kind: 'grade', gradeNumber: 6, title: 'Grade 6: Major Chords & Triads' },
  { id: 'm-letitbe', levelId: 'middle', kind: 'song', title: 'Let It Be' },
  { id: 'm-perfect', levelId: 'middle', kind: 'song', title: 'Perfect' },

  // ── Level 4 · High School ────────────────────────────────────
  { id: 'g7', levelId: 'high', kind: 'grade', gradeNumber: 7, title: 'Grade 7: Minor Chords & Axis' },
  { id: 'g8', levelId: 'high', kind: 'grade', gradeNumber: 8, title: 'Grade 8: Progressions & Roman Numerals' },
  { id: 'h-canon', levelId: 'high', kind: 'song', title: 'Canon in D' },

  // ── Level 5 · University ─────────────────────────────────────
  { id: 'g9', levelId: 'university', kind: 'grade', gradeNumber: 9, title: 'Grade 9: Circle of Fifths' },
  { id: 'g10', levelId: 'university', kind: 'grade', gradeNumber: 10, title: 'Grade 10: Seventh Chords & Jazz' },
  { id: 'u-river', levelId: 'university', kind: 'song', title: 'River Flows in You' },
  { id: 'u-kiss', levelId: 'university', kind: 'song', title: 'Kiss the Rain', soon: true },

  // ── Level 6 · Master ─────────────────────────────────────────
  { id: 'g11', levelId: 'master', kind: 'grade', gradeNumber: 11, title: 'Grade 11: Inversions & Voice Leading' },
  { id: 'g12', levelId: 'master', kind: 'grade', gradeNumber: 12, title: 'Grade 12: Bringing It All Together' },
  { id: 'mas-improv', levelId: 'master', kind: 'exercise', title: 'Improvising over LH Loops', soon: true },
  { id: 'mas-jazz', levelId: 'master', kind: 'exercise', title: 'Jazz & Blues Voicings', soon: true },
];

export type ItemState = 'active' | 'done' | 'locked' | 'soon';

export interface ResolvedItem extends PathItem {
  state: ItemState;
  /** True when this is the single next item the learner should tackle. */
  isCurrent: boolean;
}

export interface ResolvedLevel extends Level {
  items: ResolvedItem[];
}

/**
 * Resolve every item's state from a set of completed item ids.
 *
 * Rule: items are gated in list order. The first non-completed item that has a
 * playable `lessonRef` (and isn't `soon`) becomes the single "current" item
 * (the START card). Everything after it is locked; `soon` items always show as
 * "soon". This produces the exact lock cascade seen in the design.
 */
export function resolvePathway(completed: Set<string>): {
  levels: ResolvedLevel[];
  current: ResolvedItem | null;
} {
  let currentFound = false;
  let current: ResolvedItem | null = null;

  const resolveItem = (item: PathItem): ResolvedItem => {
    if (completed.has(item.id)) {
      return { ...item, state: 'done', isCurrent: false };
    }
    if (item.soon) {
      return { ...item, state: 'soon', isCurrent: false };
    }
    if (!currentFound && item.lessonRef) {
      currentFound = true;
      const resolved: ResolvedItem = { ...item, state: 'active', isCurrent: true };
      current = resolved;
      return resolved;
    }
    return { ...item, state: 'locked', isCurrent: false };
  };

  const levels: ResolvedLevel[] = LEVELS.map((level) => ({
    ...level,
    items: PATH_ITEMS.filter((it) => it.levelId === level.id).map(resolveItem),
  }));

  return { levels, current };
}

export const KIND_ICON: Record<PathItemKind, string> = {
  grade: '🎓',
  song: '🎵',
  exercise: '🏃',
  concept: '📖',
};
