// Piano Professor — turn an imported song into a course the Lesson 1 engine can run.
//
// SCAFFOLD: this is a placeholder that satisfies the contract while the real
// generator (ported from the June branch's songLessonGenerator.ts and retargeted
// to src/lesson1/data.ts segments) is written. Callers must only rely on the
// exported types and the generateSongLesson() signature.
import { Lesson1 } from '../lesson1/data';
import { ImportedSong } from './importedSongs';

/** A generated course: a Lesson1 the engine runs plus the metadata the Lesson screen shows. */
export interface GeneratedCourse {
  /** Stable id used as the progress key, e.g. `course-<songId>`. */
  id: string;
  title: string;
  subtitle: string;
  xpReward: number;
  lesson: Lesson1;
}

export function generateSongLesson(song: ImportedSong): GeneratedCourse {
  return {
    id: `course-${song.id}`,
    title: song.title,
    subtitle: `${song.score.measureCount} bars`,
    xpReward: 50,
    lesson: {
      steps: [
        {
          title: 'Overview',
          segments: [
            { type: 'say', text: `Let's learn ${song.title}.` },
            { type: 'awardXP', amount: 50 },
            { type: 'lessonCompleteScreen' },
          ],
        },
      ],
    },
  };
}
