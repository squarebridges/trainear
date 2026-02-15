import type { SessionStats } from '../types';

interface StatsPanelProps {
  stats: SessionStats;
  onReset: () => void;
  onClose: () => void;
}

function getLevel(totalXP: number): number {
  return Math.floor(totalXP / 500) + 1;
}

function getXPInCurrentLevel(totalXP: number): number {
  return totalXP % 500;
}

function getAverageScore(stats: SessionStats): number {
  if (stats.roundHistory.length === 0) return 0;
  const sum = stats.roundHistory.reduce((acc, r) => acc + r.score, 0);
  return Math.round(sum / stats.roundHistory.length);
}

/** Render an inline SVG sparkline for the last 20 scores */
function Sparkline({ history }: { history: { score: number }[] }) {
  const recent = history.slice(-20);
  if (recent.length < 2) return null;

  const w = 200;
  const h = 40;
  const padding = 2;
  const usableW = w - padding * 2;
  const usableH = h - padding * 2;

  const points = recent.map((r, i) => {
    const x = padding + (i / (recent.length - 1)) * usableW;
    const y = padding + usableH - (r.score / 100) * usableH;
    return `${x},${y}`;
  });

  const lastPoint = points[points.length - 1];
  const lastScore = recent[recent.length - 1].score;
  const [lx, ly] = lastPoint.split(',').map(Number);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-(--color-text-muted)">Recent scores</span>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dot on the last point */}
        <circle cx={lx} cy={ly} r="3" fill="var(--color-accent)" />
        {/* Score label on last point */}
        <text
          x={lx + 6}
          y={ly + 3}
          fontSize="10"
          fill="var(--color-text-muted)"
        >
          {lastScore}
        </text>
      </svg>
    </div>
  );
}

export function StatsPanel({ stats, onReset, onClose }: StatsPanelProps) {
  const level = getLevel(stats.totalXP);
  const xpInLevel = getXPInCurrentLevel(stats.totalXP);
  const avgScore = getAverageScore(stats);
  const xpProgressPct = (xpInLevel / 500) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-(--color-surface) border border-(--color-border) rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-(--color-text-muted) hover:text-(--color-text) transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="text-lg font-bold mb-4">Your Progress</h2>

        {/* Level + XP bar */}
        <div className="mb-5">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-bold text-indigo-400">Level {level}</span>
            <span className="text-sm text-(--color-text-muted)">
              {stats.totalXP.toLocaleString()} XP total
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-(--color-surface-light) overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${xpProgressPct}%` }}
            />
          </div>
          <p className="text-xs text-(--color-text-muted) mt-1">
            {xpInLevel} / 500 XP to next level
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard label="Rounds Played" value={stats.totalRounds} />
          <StatCard label="Perfect Rounds" value={stats.totalPerfects} />
          <StatCard label="Best Streak" value={stats.bestStreak} />
          <StatCard label="Avg Score" value={`${avgScore}%`} />
        </div>

        {/* Sparkline */}
        <div className="flex justify-center mb-5">
          <Sparkline history={stats.roundHistory} />
        </div>

        {/* Reset */}
        <div className="flex justify-center">
          <ResetButton onReset={onReset} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center py-2 px-3 rounded-lg bg-(--color-surface-light)">
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <span className="text-xs text-(--color-text-muted)">{label}</span>
    </div>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  const handleClick = () => {
    if (window.confirm('Reset all stats? This cannot be undone.')) {
      onReset();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-xs text-(--color-text-muted) hover:text-(--color-error) transition-colors cursor-pointer underline underline-offset-2"
    >
      Reset all stats
    </button>
  );
}
