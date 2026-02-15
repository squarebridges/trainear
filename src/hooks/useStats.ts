import { useState, useCallback } from 'react';
import type { SessionStats, RoundRecord, XPBreakdown, DifficultyConfig } from '../types';

const STORAGE_KEY = 'playback-trainer-stats';
const MAX_HISTORY = 100;

function getDefaultStats(): SessionStats {
  return {
    currentStreak: 0,
    bestStreak: 0,
    totalRounds: 0,
    totalPerfects: 0,
    totalXP: 0,
    roundHistory: [],
  };
}

function loadStats(): SessionStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultStats();
    const parsed = JSON.parse(raw);
    return { ...getDefaultStats(), ...parsed };
  } catch {
    return getDefaultStats();
  }
}

function saveStats(stats: SessionStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // localStorage may be full or unavailable -- silently ignore
  }
}

/**
 * Compute the XP breakdown for a round.
 */
export function computeXP(
  score: number,
  replaysUsed: number,
  noteCount: number,
  currentStreak: number,
): XPBreakdown {
  const baseXP = score;

  // +25 if the user nailed it on the first listen
  const noReplayBonus = replaysUsed === 1 ? 25 : 0;

  // +50 for a perfect score
  const perfectBonus = score === 100 ? 50 : 0;

  // Streak multiplier (applied to base XP only, before adding flat bonuses)
  let streakMultiplier = 1;
  if (currentStreak >= 10) streakMultiplier = 3;
  else if (currentStreak >= 5) streakMultiplier = 2;
  else if (currentStreak >= 3) streakMultiplier = 1.5;

  // Difficulty scaling: more notes = proportionally more XP
  const difficultyMultiplier = noteCount / 4;

  const totalXP = Math.round(
    baseXP * streakMultiplier * difficultyMultiplier + noReplayBonus + perfectBonus,
  );

  return {
    baseXP,
    noReplayBonus,
    perfectBonus,
    streakMultiplier,
    difficultyMultiplier,
    totalXP,
  };
}

export interface UseStatsReturn {
  stats: SessionStats;
  /** Record a completed round and return the XP breakdown */
  recordRound: (score: number, difficulty: DifficultyConfig, replaysUsed: number) => XPBreakdown;
  /** Clear all stats */
  resetStats: () => void;
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<SessionStats>(loadStats);

  const recordRound = useCallback(
    (score: number, difficulty: DifficultyConfig, replaysUsed: number): XPBreakdown => {
      let updated: SessionStats = { ...stats };

      const perfect = score === 100;

      // Update streak before computing XP (so current round's streak counts)
      const newStreak = perfect ? updated.currentStreak + 1 : 0;

      // Compute XP using the new streak value
      const xp = computeXP(score, replaysUsed, difficulty.noteCount, newStreak);

      const record: RoundRecord = {
        timestamp: Date.now(),
        score,
        noteCount: difficulty.noteCount,
        scale: difficulty.scale,
        key: difficulty.key,
        replaysUsed,
        perfect,
        bonusPoints: xp.totalXP,
      };

      updated = {
        currentStreak: newStreak,
        bestStreak: Math.max(updated.bestStreak, newStreak),
        totalRounds: updated.totalRounds + 1,
        totalPerfects: updated.totalPerfects + (perfect ? 1 : 0),
        totalXP: updated.totalXP + xp.totalXP,
        roundHistory: [...updated.roundHistory, record].slice(-MAX_HISTORY),
      };

      setStats(updated);
      saveStats(updated);

      return xp;
    },
    [stats],
  );

  const resetStats = useCallback(() => {
    const defaults = getDefaultStats();
    setStats(defaults);
    saveStats(defaults);
  }, []);

  return { stats, recordRound, resetStats };
}
