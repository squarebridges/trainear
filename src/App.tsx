import { useEffect, useCallback, useRef } from 'react';
import { useMidi } from './hooks/useMidi';
import { useAudio } from './hooks/useAudio';
import { useGameState } from './hooks/useGameState';
import { MidiSetup } from './components/MidiSetup';
import { MelodyControls } from './components/MelodyControls';
import { Keyboard } from './components/Keyboard';
import { NoteDisplay } from './components/NoteDisplay';
import { ScoreDisplay } from './components/ScoreDisplay';
import { DifficultyPanel } from './components/DifficultyPanel';

function App() {
  const midi = useMidi();
  const audio = useAudio();
  const game = useGameState();
  const hasStartedRef = useRef(false);

  // Track recording start time for timestamped note capture
  const recordingStartRef = useRef<number>(0);

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
    game.nextRound();
  }, [audio, game]);

  // Compute keyboard highlight sets for review phase
  const highlightNotes = new Set<number>();
  const errorNotes = new Set<number>();

  if (game.phase === 'review' && game.round.comparison) {
    game.round.targetMelody.forEach((note, i) => {
      if (game.round.comparison!.targetMarks[i] === 'correct') {
        highlightNotes.add(note.midi);
      } else {
        errorNotes.add(note.midi);
      }
    });
  }

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
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8 max-w-4xl mx-auto w-full">
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

        {/* Difficulty settings (shown when not in setup) */}
        {game.phase !== 'setup' && (
          <DifficultyPanel
            config={game.difficulty}
            onChange={game.updateDifficulty}
            disabled={game.phase === 'playing' || game.phase === 'counting-in'}
          />
        )}

        {/* Phase indicator */}
        {game.phase === 'listening' && (
          <div className="text-center">
            <p className="text-lg text-(--color-text-muted)">
              Listen to the melody, then play it back
            </p>
          </div>
        )}

        {/* Count-in indicator */}
        {game.phase === 'counting-in' && (
          <div className="text-center">
            <p className="text-2xl font-bold animate-pulse">
              Count-in...
            </p>
          </div>
        )}

        {/* Score display (review phase) */}
        {game.phase === 'review' && game.round.comparison && (
          <ScoreDisplay
            comparison={game.round.comparison}
            replaysUsed={game.round.replaysUsed}
            rhythmMode={game.difficulty.rhythmMode}
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

        {/* Controls */}
        {game.phase !== 'setup' && (
          <MelodyControls
            phase={game.phase}
            isAudioPlaying={audio.isPlaying}
            replaysUsed={game.round.replaysUsed}
            playedNoteCount={game.round.playedNotes.length}
            targetNoteCount={game.round.targetMelody.length}
            onPlay={handlePlayMelody}
            onReady={handleReady}
            onDone={game.finishPlaying}
            onNextRound={handleNextRound}
          />
        )}

        {/* Piano keyboard */}
        {game.phase !== 'setup' && (
          <Keyboard
            activeNotes={midi.activeNotes}
            highlightNotes={highlightNotes}
            errorNotes={errorNotes}
          />
        )}
      </main>
    </div>
  );
}

export default App;
