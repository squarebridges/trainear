import { useEffect, useRef, useState } from 'react';
import {
  getLevelForStreak,
  getNextLevel,
  describeLevelConfig,
  type DifficultyLevel,
  type LevelDescription,
} from '../engine/progressiveDifficulty';

interface StreakBadgeProps {
  currentStreak: number;
  bestStreak: number;
}

function levelColor(level: number): string {
  if (level >= 7) return 'text-red-400';
  if (level >= 5) return 'text-orange-400';
  if (level >= 3) return 'text-amber-400';
  return 'text-indigo-400';
}

function progressBarColor(level: number): string {
  if (level >= 7) return 'bg-red-500';
  if (level >= 5) return 'bg-orange-500';
  if (level >= 3) return 'bg-amber-500';
  return 'bg-indigo-500';
}

function LevelDetail({ label, level, desc, colorClass, changed }: {
  label: string;
  level: DifficultyLevel;
  desc: LevelDescription;
  colorClass: string;
  /** Fields that differ from the current level (highlighted) */
  changed?: Set<keyof LevelDescription>;
}) {
  const highlight = (field: keyof LevelDescription) =>
    changed?.has(field) ? 'text-(--color-text) font-semibold' : 'text-(--color-text-muted)';

  return (
    <div className="flex flex-col gap-1.5">
      <span className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>
        {label} — Lv.{level.level} {level.name}
      </span>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
        <span className="text-(--color-text-muted)">Notes</span>
        <span className={highlight('notes')}>{desc.notes}</span>
        <span className="text-(--color-text-muted)">Max Leap</span>
        <span className={highlight('maxLeap')}>{desc.maxLeap}</span>
        <span className="text-(--color-text-muted)">Rhythm</span>
        <span className={highlight('rhythm')}>{desc.rhythm}</span>
        <span className="text-(--color-text-muted)">Tempo</span>
        <span className={highlight('tempo')}>{desc.tempo}</span>
      </div>
    </div>
  );
}

export function StreakBadge({ currentStreak, bestStreak }: StreakBadgeProps) {
  const prevStreakRef = useRef(currentStreak);
  const [shaking, setShaking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const currentLevel: DifficultyLevel = getLevelForStreak(currentStreak);
  const nextLevel: DifficultyLevel | null = getNextLevel(currentStreak);

  const currentDesc = describeLevelConfig(currentLevel);
  const nextDesc = nextLevel ? describeLevelConfig(nextLevel) : null;

  // Compute which fields change between current and next level
  const changedFields = new Set<keyof LevelDescription>();
  if (nextDesc) {
    for (const key of ['notes', 'maxLeap', 'rhythm', 'tempo'] as (keyof LevelDescription)[]) {
      if (currentDesc[key] !== nextDesc[key]) {
        changedFields.add(key);
      }
    }
  }

  // Progress within current level toward the next
  const progressInLevel = nextLevel
    ? currentStreak - currentLevel.streakRequired
    : 0;
  const totalNeededForNext = nextLevel
    ? nextLevel.streakRequired - currentLevel.streakRequired
    : 1;
  const progressPct = nextLevel
    ? Math.min((progressInLevel / totalNeededForNext) * 100, 100)
    : 100;
  const remaining = nextLevel
    ? nextLevel.streakRequired - currentStreak
    : 0;

  // Detect streak break: previous was > 0, now is 0
  useEffect(() => {
    if (prevStreakRef.current > 0 && currentStreak === 0) {
      setShaking(true);
      const timer = setTimeout(() => setShaking(false), 600);
      return () => clearTimeout(timer);
    }
    prevStreakRef.current = currentStreak;
  }, [currentStreak]);

  const shakeClass = shaking ? 'streak-shake' : '';
  const flameGlow =
    currentStreak >= 15
      ? 'text-orange-400 animate-pulse'
      : currentStreak >= 5
        ? 'text-orange-400'
        : currentStreak >= 1
          ? 'text-amber-500/80'
          : 'text-(--color-text-muted)';

  return (
    <div className={`flex flex-col gap-2 w-full h-full px-4 py-3 rounded-xl bg-(--color-surface) border border-(--color-border) ${shakeClass}`}>
      {/* Top row: level name + streak + best */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
          title={expanded ? 'Hide level details' : 'Show level details'}
        >
          <span className={`text-sm font-bold ${levelColor(currentLevel.level)}`}>
            Lv.{currentLevel.level} {currentLevel.name}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-(--color-text-muted) transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          {/* Streak flame */}
          <div className={`flex items-center gap-1 ${flameGlow}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 23c-3.866 0-7-3.134-7-7 0-3.037 2.346-6.424 4.685-8.889a.75.75 0 0 1 1.13.027C12.39 9.044 13.5 10.5 13.5 10.5s.924-1.596 1.77-3.235a.75.75 0 0 1 1.345.065C17.948 10.214 19 13.163 19 16c0 3.866-3.134 7-7 7z" />
            </svg>
            <span className="font-bold tabular-nums">{currentStreak}</span>
          </div>
          {bestStreak > 0 && (
            <span className="text-xs text-(--color-text-muted)">
              Best: {bestStreak}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar to next level */}
      {nextLevel ? (
        <div className="flex flex-col gap-1">
          <div className="w-full h-1.5 rounded-full bg-(--color-surface-light) overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressBarColor(currentLevel.level)}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-(--color-text-muted)">
              {remaining} perfect {remaining === 1 ? 'round' : 'rounds'} to <span className={`font-semibold ${levelColor(nextLevel.level)}`}>{nextLevel.name}</span>
            </span>
            <span className="text-xs text-(--color-text-muted) tabular-nums">
              {progressInLevel}/{totalNeededForNext}
            </span>
          </div>
        </div>
      ) : (
        <span className="text-xs text-emerald-400 font-medium">
          Max level reached!
        </span>
      )}

      {/* Expandable level details */}
      {expanded && (
        <div className="flex flex-col gap-3 pt-2 mt-1 border-t border-(--color-border)">
          <LevelDetail
            label="Current"
            level={currentLevel}
            desc={currentDesc}
            colorClass={levelColor(currentLevel.level)}
          />
          {nextLevel && nextDesc && (
            <LevelDetail
              label="Next"
              level={nextLevel}
              desc={nextDesc}
              colorClass={levelColor(nextLevel.level)}
              changed={changedFields}
            />
          )}
        </div>
      )}
    </div>
  );
}
