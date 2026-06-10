/**
 * UI CONTRACT — the ONLY door between UI shells and core logic.
 *
 * Shells (src/ui/shells/<version>/) may import core code exclusively from
 * this module. Core modules must NEVER import anything from src/ui/.
 * Enforced by scripts/check-shell-imports.mjs (runs in `npm run verify`).
 *
 * Why: the UI is redesigned monthly from claude.ai/design drops. Keeping
 * this surface stable is what lets an entirely new design ship without
 * touching — or breaking — lessons, audio, gamification, BLE, or storage.
 *
 * Adding an export here is allowed (additive = safe). Renaming or removing
 * one is a breaking change for every shell: do it deliberately, in its own
 * commit, with all shells updated.
 */

// ── Lesson engine & content ─────────────────────────────────────
export { useLessonEngine } from '../lessons/engine';
export type { UseLessonEngine, EngineState, EngineStatus } from '../lessons/engine';
export { getLesson, getGrade, listGrades, GRADE_COUNT } from '../lessons/loader';
export { getImportedLesson, registerImportedLesson } from '../lessons/importedLessons';
export { noteToMidi, notesToMidi } from '../lessons/noteToMidi';
export { resolvePathway, PATH_ITEMS, LEVELS, KIND_ICON } from '../lessons/pathway';
export type {
  Level, PathItem, PathItemKind, ItemState, ResolvedItem, ResolvedLevel,
} from '../lessons/pathway';
export type {
  Lesson, Grade, LessonStep, LessonSegment, QuizSegment, LedColorName,
} from '../lessons/schema';

// ── Audio ───────────────────────────────────────────────────────
export {
  playMidi, playChord, playSequence, stopAll, preloadCore, setPianoEnabled,
} from '../audio/pianoEngine';
export { speak, stopSpeaking, testElevenLabs } from '../audio/instructorVoice';
export type { SpeakOptions } from '../audio/instructorVoice';

// ── Gamification / user state ───────────────────────────────────
export { useUser, useEngagement, useAchievements } from '../gamification/UserProvider';
export type { UserContextValue, CompleteLessonInput } from '../gamification/UserProvider';
export type { AchievementDef } from '../gamification/achievements';
export type {
  UserProfile, LessonProgress, DailyActivity, AchievementProgress, Hearts, UserSettings,
} from '../services/types';
export { HEARTS_MAX, DEFAULT_DAILY_GOAL_XP } from '../services/types';

// ── BLE hardware ────────────────────────────────────────────────
export { useBLEContext } from '../ble/BLEContext';
export type { UseBLEReturn, BLEPhase, FoundDevice, CalibrationState } from '../ble/useBLE';
export { CAL_STEPS, CAL_TARGET_NOTES } from '../ble/constants';
export { cmdRainbow, cmdCommit } from '../ble/protocol';

// ── Services ────────────────────────────────────────────────────
export { logEvent, Events } from '../services/analytics';

// ── Settings / storage ──────────────────────────────────────────
export {
  getBool, setBool, getString, setString, getNumber,
  getVoiceSettings, saveVoiceSettings, DEFAULT_VOICE_ID,
} from '../storage/settings';
export type { VoiceSettings } from '../storage/settings';

// ── Music theory ────────────────────────────────────────────────
export { ROOT_LETTERS, CHORD_TREE, makeRoot, buildChord } from '../music/chords';
export type {
  Accidental, Root, ChordQuality, ChordCategory, BuiltChord,
} from '../music/chords';

// ── OMR (sheet-music import) ────────────────────────────────────
export { pickFromLibrary, capturePhoto } from '../omr/pickImage';
export type { PickedImage } from '../omr/pickImage';
export { runOmr, getOmrServer, OmrNotConfiguredError } from '../omr/omrClient';
export { musicXmlToLesson } from '../omr/musicxmlToLesson';

// ── Billing ─────────────────────────────────────────────────────
export { useEntitlement, getTier, setTier } from '../billing/entitlement';
export type { Tier } from '../billing/entitlement';

// ── Notifications ───────────────────────────────────────────────
export { useReminders } from '../notifications/useReminders';

// ── Device feedback (design-agnostic) ───────────────────────────
export * as haptics from '../feedback/haptics';
export { useLandscapeWhileFocused, useLockPortraitOnMount } from '../feedback/useOrientation';
