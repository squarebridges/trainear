import type { GamePhase } from '../types';

interface MelodyControlsProps {
  phase: GamePhase;
  isAudioPlaying: boolean;
  replaysUsed: number;
  maxReplays?: number;
  playedNoteCount: number;
  targetNoteCount: number;
  onPlay: () => void;
  onReady: () => void;
  onDone: () => void;
  onNextRound: () => void;
}

function Spinner() {
  return (
    <svg
      className="spinner"
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

export function MelodyControls({
  phase,
  isAudioPlaying,
  replaysUsed,
  maxReplays = 2,
  playedNoteCount,
  targetNoteCount,
  onPlay,
  onReady,
  onDone,
  onNextRound,
}: MelodyControlsProps) {
  if (phase === 'listening') {
    const listensRemaining = maxReplays - replaysUsed;
    const replayDisabled = isAudioPlaying || replaysUsed >= maxReplays;
    const readyEnabled = !isAudioPlaying && replaysUsed > 0;

    return (
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-4">
          {/* Play / Replay — secondary action once heard */}
          <button
            onClick={onPlay}
            disabled={replayDisabled}
            className="px-6 py-3 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            {isAudioPlaying ? (
              <Spinner />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            {replaysUsed === 0 ? 'Play Melody' : 'Replay'}
            <kbd className="ml-1.5 text-xs opacity-60 bg-white/15 px-1.5 py-0.5 rounded font-mono">P</kbd>
          </button>

          {/* I'm Ready — primary CTA, larger when enabled */}
          <button
            onClick={onReady}
            disabled={!readyEnabled}
            className={`rounded-xl bg-(--color-success) hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all cursor-pointer flex items-center gap-2 ${
              readyEnabled
                ? 'px-8 py-4 text-xl shadow-lg shadow-emerald-500/20'
                : 'px-6 py-3 text-lg'
            } ${readyEnabled && listensRemaining <= 0 ? 'animate-pulse' : ''}`}
          >
            I&apos;m Ready
            <kbd className="ml-1.5 text-xs opacity-60 bg-white/15 px-1.5 py-0.5 rounded font-mono">R</kbd>
          </button>
        </div>

        {replaysUsed > 0 && (
          <p className="text-(--color-text-muted) text-base">
            {listensRemaining > 0
              ? `${listensRemaining} ${listensRemaining === 1 ? 'listen' : 'listens'} remaining`
              : 'No listens remaining'}
          </p>
        )}
      </div>
    );
  }

  if (phase === 'counting-in') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="status-card flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-lg font-medium">Get ready...</span>
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <div className="flex flex-col items-center gap-5">
        {/* Recording status card */}
        <div className="status-card flex items-center gap-4">
          <div className="recording-dot" />
          <div className="flex flex-col">
            <span className="text-lg font-semibold">Play it back!</span>
            <span className="text-(--color-text-muted) text-base tabular-nums">
              {playedNoteCount} / {targetNoteCount} notes
            </span>
          </div>
        </div>

        <button
          onClick={onDone}
          disabled={playedNoteCount === 0}
          className="px-8 py-4 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xl transition-colors cursor-pointer"
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
          className="px-8 py-4 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) text-white font-bold text-xl transition-colors cursor-pointer"
        >
          Next Round
          <kbd className="ml-1.5 text-xs opacity-60 bg-white/15 px-1.5 py-0.5 rounded font-mono">N</kbd>
        </button>
      </div>
    );
  }

  return null;
}
