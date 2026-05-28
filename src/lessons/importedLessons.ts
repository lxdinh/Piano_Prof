import { Lesson } from './schema';

// In-memory registry for lessons created at runtime (e.g. OMR imports) that
// don't live in the bundled grade JSON. Grade 0 is reserved for these. State
// is transient (cleared on app restart), which is fine for v1 previews.
const registry = new Map<string, Lesson>();

export function registerImportedLesson(lesson: Lesson): void {
  registry.set(lesson.id, lesson);
}

export function getImportedLesson(id: string): Lesson | null {
  return registry.get(id) ?? null;
}
