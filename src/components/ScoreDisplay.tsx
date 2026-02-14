import type { ComparisonResult } from '../types';

interface ScoreDisplayProps {
  comparison: ComparisonResult;
  replaysUsed: number;
  rhythmMode?: boolean;
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

export function ScoreDisplay({ comparison, replaysUsed, rhythmMode = false }: ScoreDisplayProps) {
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
    </div>
  );
}
