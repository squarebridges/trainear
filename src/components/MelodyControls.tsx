import type { GamePhase } from '../types';

interface MelodyControlsProps {
  phase: GamePhase;
  isAudioPlaying: boolean;
  replaysUsed: number;
  playedNoteCount: number;
  targetNoteCount: number;
  onPlay: () => void;
  onReady: () => void;
  onDone: () => void;
  onNextRound: () => void;
}

export function MelodyControls({
  phase,
  isAudioPlaying,
  replaysUsed,
  playedNoteCount,
  targetNoteCount,
  onPlay,
  onReady,
  onDone,
  onNextRound,
}: MelodyControlsProps) {
  if (phase === 'listening') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onPlay}
            disabled={isAudioPlaying}
            className="px-6 py-3 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            {replaysUsed === 0 ? 'Play Melody' : 'Replay'}
          </button>

          <button
            onClick={onReady}
            disabled={isAudioPlaying || replaysUsed === 0}
            className="px-6 py-3 rounded-xl bg-(--color-success) hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition-all cursor-pointer"
          >
            I&apos;m Ready
          </button>
        </div>

        {replaysUsed > 0 && (
          <p className="text-(--color-text-muted) text-sm">
            Listened {replaysUsed} {replaysUsed === 1 ? 'time' : 'times'}
          </p>
        )}
      </div>
    );
  }

  if (phase === 'counting-in') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-lg font-medium">Get ready...</span>
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-(--color-error) animate-pulse" />
          <span className="text-lg font-medium">Play it back!</span>
        </div>
        <p className="text-(--color-text-muted) text-sm">
          {playedNoteCount} / {targetNoteCount} notes
        </p>
        <button
          onClick={onDone}
          disabled={playedNoteCount === 0}
          className="px-6 py-3 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    );
  }

  if (phase === 'review') {
    return (
      <div className="flex justify-center">
        <button
          onClick={onNextRound}
          className="px-8 py-3 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) text-white font-semibold text-lg transition-colors cursor-pointer"
        >
          Next Round
        </button>
      </div>
    );
  }

  return null;
}
