import { Grade, Lesson } from './schema';

// Static requires so Metro can bundle each JSON at build time.
const GRADE_FILES: Record<number, () => Grade> = {
  1: () => require('./data/grade1.json') as Grade,
  2: () => require('./data/grade2.json') as Grade,
};

export const GRADE_COUNT = 6;

export function listGrades(): Grade[] {
  const out: Grade[] = [];
  for (let i = 1; i <= GRADE_COUNT; i++) {
    const loader = GRADE_FILES[i];
    if (loader) {
      out.push(loader());
    } else {
      out.push({ id: i, title: `Grade ${i}`, description: 'Coming soon', lessons: [] });
    }
  }
  return out;
}

export function getGrade(id: number): Grade | null {
  const loader = GRADE_FILES[id];
  return loader ? loader() : null;
}

export function getLesson(gradeId: number, lessonId: string): Lesson | null {
  const grade = getGrade(gradeId);
  if (!grade) return null;
  return grade.lessons.find((l) => l.id === lessonId) ?? null;
}
