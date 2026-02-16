import { useEffect, useCallback, useRef, useState } from 'react';
import { useMidi } from './hooks/useMidi';
import { useAudio } from './hooks/useAudio';
import { useGameState } from './hooks/useGameState';
import { useStats } from './hooks/useStats';
import { MidiSetup } from './components/MidiSetup';
import { MelodyControls } from './components/MelodyControls';
import { NoteDisplay } from './components/NoteDisplay';
import { ScoreDisplay } from './components/ScoreDisplay';
import { AutoDifficultyPanel, UserSettingsPanel } from './components/DifficultyPanel';
import { StreakBadge } from './components/StreakBadge';
import { StatsPanel } from './components/StatsPanel';
import { getDifficultyForStreak, getBaseDifficulty, getChangedFields } from './engine/progressiveDifficulty';
import type { DifficultyConfig, XPBreakdown } from './types';

function App() {
  const midi = useMidi();
  const audio = useAudio();
  const game = useGameState();
  const { stats, recordRound, resetStats } = useStats();
  const hasStartedRef = useRef(false);

  // Track recording start time for timestamped note capture
  const recordingStartRef = useRef<number>(0);

  // XP breakdown from the most recent round (shown in review phase)
  const [lastXP, setLastXP] = useState<XPBreakdown | null>(null);

  // Fields highlighted on the difficulty panel after auto-scaling
  const [highlightedFields, setHighlightedFields] = useState<(keyof DifficultyConfig)[]>([]);

  // Stats panel visibility
  const [showStats, setShowStats] = useState(false);

  // Track the previous streak to detect streak breaks
  const prevStreakRef = useRef(stats.currentStreak);

  // Ref to track whether we've already recorded this review phase
  const hasRecordedRef = useRef(false);

  // Refs for values used inside the MIDI callback to avoid re-registering on every render
  const phaseRef = useRef(game.phase);
  phaseRef.current = game.phase;
  const addNoteRef = useRef(game.addNote);
  addNoteRef.current = game.addNote;
  const playNoteRef = useRef(audio.playNote);
  playNoteRef.current = audio.playNote;
  const stopNoteRef = useRef(audio.stopNote);
  stopNoteRef.current = audio.stopNote;

  // When MIDI connects, transition from setup to listening
  useEffect(() => {
    if (midi.connected && game.phase === 'setup' && !hasStartedRef.current) {
      hasStartedRef.current = true;
      game.onMidiConnected();
    }
  }, [midi.connected, game.phase, game.onMidiConnected]);

  // Register MIDI note-on handler for live audio feedback + note capture
  // Uses refs so this effect only runs once
  useEffect(() => {
    const unsub = midi.onNoteOn((note, velocity) => {
      // Always play the sound for real-time feedback
      playNoteRef.current(note, velocity);

      // Capture note if in playing phase, with timestamp
      if (phaseRef.current === 'playing') {
        const time = (performance.now() - recordingStartRef.current) / 1000;
        addNoteRef.current({ midi: note, time });
      }
    });
    return unsub;
  }, [midi.onNoteOn]);

  // Register MIDI note-off handler to release sustained notes
  useEffect(() => {
    const unsub = midi.onNoteOff((note) => {
      stopNoteRef.current(note);
    });
    return unsub;
  }, [midi.onNoteOff]);

  // Auto-finish when played note count matches target
  useEffect(() => {
    if (
      game.phase === 'playing' &&
      game.round.playedNotes.length > 0 &&
      game.round.playedNotes.length >= game.round.targetMelody.length
    ) {
      // Small delay so the user hears the last note
      const timer = setTimeout(() => {
        game.finishPlaying();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [game.phase, game.round.playedNotes.length, game.round.targetMelody.length, game.finishPlaying]);

  // Record stats when entering review phase
  useEffect(() => {
    if (game.phase === 'review' && game.round.comparison && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      const xp = recordRound(
        game.round.comparison,
        game.difficulty,
        game.round.replaysUsed,
      );
      setLastXP(xp);
    }
    if (game.phase !== 'review') {
      hasRecordedRef.current = false;
    }
  }, [game.phase, game.round.comparison, game.difficulty, game.round.replaysUsed, recordRound]);

  const handlePlayMelody = useCallback(async () => {
    await audio.ensureStarted();
    game.onReplay();
    await audio.playMelody(game.round.targetMelody, game.difficulty.tempo);
  }, [audio, game]);

  const handleReady = useCallback(async () => {
    await audio.ensureStarted();
    audio.stopMelody();

    if (game.difficulty.rhythmMode) {
      // Count-in flow: transition to counting-in, play count-in, then start playing
      game.startCountingIn();
      await audio.playCountIn(game.difficulty.tempo);
      recordingStartRef.current = performance.now();
      game.startPlaying();
    } else {
      // Pitch-only mode: go straight to playing
      recordingStartRef.current = performance.now();
      game.startPlaying();
    }
  }, [audio, game]);

  const handleNextRound = useCallback(async () => {
    await audio.ensureStarted();

    const currentStreak = stats.currentStreak;
    const previousStreak = prevStreakRef.current;

    if (currentStreak === 0 && previousStreak > 0) {
      // Streak broke -- full reset to level 1 (base difficulty)
      const baseConfig = getBaseDifficulty();
      const changedFields = getChangedFields(previousStreak, 0);
      game.updateDifficulty(baseConfig);
      if (changedFields.length > 0) {
        setHighlightedFields(changedFields);
        setTimeout(() => setHighlightedFields([]), 2000);
      }
    } else if (currentStreak > previousStreak && currentStreak > 0) {
      // Streak grew -- apply the level config for the new streak
      const levelConfig = getDifficultyForStreak(currentStreak);
      const changedFields = getChangedFields(previousStreak, currentStreak);
      game.updateDifficulty(levelConfig);
      if (changedFields.length > 0) {
        setHighlightedFields(changedFields);
        setTimeout(() => setHighlightedFields([]), 2000);
      }
    }

    prevStreakRef.current = currentStreak;
    setLastXP(null);
    game.nextRound();
  }, [audio, game, stats.currentStreak]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-(--color-border)">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">Playback Trainer</h1>
          {game.phase !== 'setup' && (
            <span className="text-sm text-(--color-text-muted) bg-(--color-surface) px-2 py-0.5 rounded">
              Round {game.round.roundNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Stats button */}
          {stats.totalRounds > 0 && (
            <button
              onClick={() => setShowStats(true)}
              className="text-(--color-text-muted) hover:text-(--color-text) transition-colors cursor-pointer p-1"
              title="View stats"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </button>
          )}
          {midi.connected && (
            <MidiSetup
              connected={midi.connected}
              deviceName={midi.deviceName}
              devices={midi.devices}
              error={midi.error}
              onConnect={midi.connect}
              onSelectDevice={midi.selectDevice}
            />
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6 max-w-5xl mx-auto w-full">
        {/* Setup phase */}
        {game.phase === 'setup' && (
          <MidiSetup
            connected={midi.connected}
            deviceName={midi.deviceName}
            devices={midi.devices}
            error={midi.error}
            onConnect={midi.connect}
            onSelectDevice={midi.selectDevice}
          />
        )}

        {/* Meta row: level + auto params + user settings (side by side) */}
        {game.phase !== 'setup' && (
          <div className="flex items-stretch gap-3 w-full">
            <div className="flex-1 min-w-0">
              <StreakBadge
                currentStreak={stats.currentStreak}
                bestStreak={stats.bestStreak}
              />
            </div>
            <div className="flex-1 min-w-0">
              <AutoDifficultyPanel
                config={game.difficulty}
                highlightedFields={highlightedFields}
              />
            </div>
            <div className="flex-1 min-w-0">
              <UserSettingsPanel
                config={game.difficulty}
                onChange={game.updateDifficulty}
                disabled={game.phase === 'playing' || game.phase === 'counting-in'}
              />
            </div>
          </div>
        )}

        {/* Phase indicator — listening */}
        {game.phase === 'listening' && (
          <div className="text-center px-6 py-3 rounded-xl bg-(--color-surface)/40 border border-(--color-border)/50">
            <p className="text-lg text-(--color-text-muted)">
              Listen to the melody, then play it back
            </p>
          </div>
        )}

        {/* Score display (review phase) */}
        {game.phase === 'review' && game.round.comparison && (
          <ScoreDisplay
            comparison={game.round.comparison}
            replaysUsed={game.round.replaysUsed}
            rhythmMode={game.difficulty.rhythmMode}
            xpBreakdown={lastXP}
          />
        )}

        {/* Controls — above note displays so Next Round appears before target/notes */}
        {game.phase !== 'setup' && (
          <MelodyControls
            phase={game.phase}
            isAudioPlaying={audio.isPlaying}
            replaysUsed={game.round.replaysUsed}
            maxReplays={2}
            playedNoteCount={game.round.playedNotes.length}
            targetNoteCount={game.round.targetMelody.length}
            onPlay={handlePlayMelody}
            onReady={handleReady}
            onDone={game.finishPlaying}
            onNextRound={handleNextRound}
          />
        )}

        {/* Note displays */}
        {game.phase !== 'setup' && (
          <div className="flex flex-col gap-6 w-full">
            {/* Target melody */}
            {game.phase === 'review' && (
              <NoteDisplay
                label="Target"
                notes={game.round.targetMelody}
                marks={game.round.comparison?.targetMarks}
                timingMarks={game.round.comparison?.timingMarks}
                rhythmMode={game.difficulty.rhythmMode}
              />
            )}

            {/* Hidden target during listening */}
            {game.phase === 'listening' && game.round.replaysUsed > 0 && (
              <NoteDisplay
                label="Target"
                notes={game.round.targetMelody}
                hidden
                rhythmMode={game.difficulty.rhythmMode}
              />
            )}

            {/* Played notes */}
            {(game.phase === 'playing' || game.phase === 'review') && (
              <NoteDisplay
                label="Your Notes"
                notes={game.round.playedNotes.map((pn) => ({ midi: pn.midi }))}
                marks={game.round.comparison?.playedMarks}
                rhythmMode={false}
              />
            )}
          </div>
        )}
      </main>

      {/* Stats panel overlay */}
      {showStats && (
        <StatsPanel
          stats={stats}
          onReset={resetStats}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}

export default App;
