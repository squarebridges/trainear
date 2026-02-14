import { useRef, useCallback, useState } from 'react';
import { createAudioEngine, type AudioEngine } from '../engine/audio';
import type { Melody } from '../types';

export interface UseAudioReturn {
  /** Ensure audio context is running (call on first user gesture) */
  ensureStarted: () => Promise<void>;
  /** Start playing a note (sustains until stopNote is called) */
  playNote: (midi: number, velocity?: number) => void;
  /** Stop a currently sounding note (call on key release) */
  stopNote: (midi: number) => void;
  /** Play a melody at a given tempo. Resolves when done. */
  playMelody: (melody: Melody, tempo: number) => Promise<void>;
  /** Play a metronome count-in at a given tempo. Resolves when done. */
  playCountIn: (tempo: number, beats?: number) => Promise<void>;
  /** Stop the current melody playback */
  stopMelody: () => void;
  /** Whether a melody is currently playing */
  isPlaying: boolean;
}

export function useAudio(): UseAudioReturn {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Create engine once
  if (!engineRef.current) {
    engineRef.current = createAudioEngine();
  }

  const ensureStarted = useCallback(async () => {
    await engineRef.current!.ensureStarted();
  }, []);

  const playNote = useCallback((midi: number, velocity = 100) => {
    engineRef.current!.playNote(midi, velocity);
  }, []);

  const stopNote = useCallback((midi: number) => {
    engineRef.current!.stopNote(midi);
  }, []);

  const playMelody = useCallback(async (melody: Melody, tempo: number) => {
    setIsPlaying(true);
    try {
      await engineRef.current!.playMelody(melody, tempo);
    } finally {
      setIsPlaying(false);
    }
  }, []);

  const playCountIn = useCallback(async (tempo: number, beats = 4) => {
    await engineRef.current!.playCountIn(tempo, beats);
  }, []);

  const stopMelody = useCallback(() => {
    engineRef.current!.stopMelody();
    setIsPlaying(false);
  }, []);

  return {
    ensureStarted,
    playNote,
    stopNote,
    playMelody,
    playCountIn,
    stopMelody,
    isPlaying,
  };
}
