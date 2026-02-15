import type { ComparisonResult, XPBreakdown } from '../types';

interface ScoreDisplayProps {
  comparison: ComparisonResult;
  replaysUsed: number;
  rhythmMode?: boolean;
  xpBreakdown?: XPBreakdown | null;
}

function scoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 70) return 'text-green-400';
  if (score >= 50) return 'text-amber-400';
  if (score >= 30) return 'text-orange-400';
  return 'text-red-400';
}

function scoreMessage(score: number): string {
  if (score === 100) return 'Perfect!';
  if (score >= 90) return 'Excellent!';
  if (score >= 70) return 'Great job!';
  if (score >= 50) return 'Getting there!';
  if (score >= 30) return 'Keep practicing!';
  return 'Try again!';
}

export function ScoreDisplay({ comparison, replaysUsed, rhythmMode = false, xpBreakdown }: ScoreDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`text-6xl font-bold tabular-nums ${scoreColor(comparison.score)}`}>
        {comparison.score}%
      </div>
      <p className="text-lg text-(--color-text-muted)">
        {scoreMessage(comparison.score)}
      </p>
      <div className="flex gap-6 text-sm text-(--color-text-muted)">
        <span>
          {comparison.targetMarks.filter((m) => m === 'correct').length} / {comparison.targetMarks.length} correct
        </span>
        {rhythmMode && comparison.rhythmScore !== undefined && (
          <>
            <span>
              Pitch: {comparison.pitchScore}%
            </span>
            <span>
              Rhythm: {comparison.rhythmScore}%
            </span>
          </>
        )}
        {replaysUsed > 1 && (
          <span>
            {replaysUsed} replays
          </span>
        )}
      </div>

      {/* XP breakdown */}
      {xpBreakdown && xpBreakdown.totalXP > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <span className="xp-tag text-sm font-semibold text-indigo-400" style={{ animationDelay: '0.1s' }}>
            +{xpBreakdown.totalXP} XP
          </span>
          {xpBreakdown.noReplayBonus > 0 && (
            <span className="xp-tag text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300" style={{ animationDelay: '0.25s' }}>
              +{xpBreakdown.noReplayBonus} first listen
            </span>
          )}
          {xpBreakdown.perfectBonus > 0 && (
            <span className="xp-tag text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300" style={{ animationDelay: '0.4s' }}>
              +{xpBreakdown.perfectBonus} perfect
            </span>
          )}
          {xpBreakdown.streakMultiplier > 1 && (
            <span className="xp-tag text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300" style={{ animationDelay: '0.55s' }}>
              x{xpBreakdown.streakMultiplier} streak
            </span>
          )}
          {xpBreakdown.difficultyMultiplier > 1 && (
            <span className="xp-tag text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300" style={{ animationDelay: '0.7s' }}>
              x{xpBreakdown.difficultyMultiplier.toFixed(1)} difficulty
            </span>
          )}
        </div>
      )}
    </div>
  );
}
