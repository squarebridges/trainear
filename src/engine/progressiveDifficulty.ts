import type { DifficultyConfig, Duration } from '../types';

/** A named difficulty level with its required streak and config overrides */
export interface DifficultyLevel {
  level: number;
  name: string;
  streakRequired: number;
  config: Partial<DifficultyConfig>;
}

/**
 * The difficulty ladder. Each level specifies the streak needed to reach it
 * and the difficulty overrides applied (noteCount, maxInterval, rhythmMode, tempo).
 * User-chosen settings like scale, key, and octave are always preserved.
 */
export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { level: 1, name: 'Beginner',      streakRequired: 0,  config: { noteCount: 3, maxInterval: 3, rhythmMode: false, tempo: 100 } },
  { level: 2, name: 'Easy',          streakRequired: 3,  config: { noteCount: 4, maxInterval: 5, rhythmMode: false, tempo: 100 } },
  { level: 3, name: 'Moderate',      streakRequired: 6,  config: { noteCount: 4, maxInterval: 7, rhythmMode: false, tempo: 100 } },
  { level: 4, name: 'Intermediate',  streakRequired: 10, config: { noteCount: 5, maxInterval: 7, rhythmMode: true,  tempo: 100, allowedDurations: [0.5, 1] } },
  { level: 5, name: 'Challenging',   streakRequired: 15, config: { noteCount: 5, maxInterval: 9, rhythmMode: true,  tempo: 110, allowedDurations: [0.5, 1, 2] } },
  { level: 6, name: 'Advanced',      streakRequired: 20, config: { noteCount: 6, maxInterval: 9, rhythmMode: true,  tempo: 120, allowedDurations: [0.5, 1, 1.5, 2] } },
  { level: 7, name: 'Expert',        streakRequired: 26, config: { noteCount: 7, maxInterval: 12, rhythmMode: true, tempo: 140, allowedDurations: [0.5, 1, 1.5, 2] } },
  { level: 8, name: 'Master',        streakRequired: 33, config: { noteCount: 8, maxInterval: 12, rhythmMode: true, tempo: 160, allowedDurations: [0.5, 1, 1.5, 2] } },
];

/**
 * Get the difficulty level for a given streak.
 * Returns the highest level whose streakRequired <= streak.
 */
export function getLevelForStreak(streak: number): DifficultyLevel {
  let best = DIFFICULTY_LEVELS[0];
  for (const level of DIFFICULTY_LEVELS) {
    if (streak >= level.streakRequired) {
      best = level;
    }
  }
  return best;
}

/**
 * Get the next level after the current one (or null if at max).
 */
export function getNextLevel(streak: number): DifficultyLevel | null {
  const current = getLevelForStreak(streak);
  const nextIdx = DIFFICULTY_LEVELS.indexOf(current) + 1;
  if (nextIdx >= DIFFICULTY_LEVELS.length) return null;
  return DIFFICULTY_LEVELS[nextIdx];
}

/**
 * Get the difficulty config overrides for a given streak.
 * Only overrides auto-scaled fields (noteCount, maxInterval, rhythmMode, tempo).
 */
export function getDifficultyForStreak(streak: number): Partial<DifficultyConfig> {
  return getLevelForStreak(streak).config;
}

/**
 * Get the base (level 1) difficulty config -- used on streak reset.
 */
export function getBaseDifficulty(): Partial<DifficultyConfig> {
  return DIFFICULTY_LEVELS[0].config;
}

/** Human-readable description of a level's difficulty settings */
export interface LevelDescription {
  notes: string;
  maxLeap: string;
  rhythm: string;
  tempo: string;
}

const INTERVAL_LABELS: Record<number, string> = {
  3: 'Minor 3rd',
  5: 'Perfect 4th',
  7: 'Perfect 5th',
  9: 'Major 6th',
  12: 'Octave',
};

export function describeLevelConfig(level: DifficultyLevel): LevelDescription {
  const c = level.config;
  return {
    notes: `${c.noteCount ?? '?'} notes`,
    maxLeap: INTERVAL_LABELS[c.maxInterval ?? 0] ?? `${c.maxInterval} semitones`,
    rhythm: c.rhythmMode
      ? (c.allowedDurations ?? ([0.5, 1, 1.5, 2] as Duration[]))
          .map((d) => ({ 0.5: '8th', 1: 'Qtr', 1.5: 'Dot Qtr', 2: 'Half' })[d])
          .join(', ')
      : 'Off',
    tempo: `${c.tempo ?? '?'} BPM`,
  };
}

/**
 * Compute which fields changed between two levels (for highlight animation).
 */
export function getChangedFields(
  fromStreak: number,
  toStreak: number,
): (keyof DifficultyConfig)[] {
  const fromConfig = getDifficultyForStreak(fromStreak);
  const toConfig = getDifficultyForStreak(toStreak);
  const fields: (keyof DifficultyConfig)[] = [];

  for (const key of Object.keys(toConfig) as (keyof DifficultyConfig)[]) {
    if (fromConfig[key] !== toConfig[key]) {
      fields.push(key);
    }
  }

  return fields;
}
