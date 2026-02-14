import * as Tone from 'tone';
import { midiToNoteName } from '../theory/noteUtils';
import type { Melody } from '../types';

export interface AudioEngine {
  /** Ensure audio context is started (must be called from user gesture) */
  ensureStarted(): Promise<void>;
  /** Start playing a note (sustains until stopNote is called) */
  playNote(midi: number, velocity?: number): void;
  /** Stop a currently sounding note (call on key release) */
  stopNote(midi: number): void;
  /** Play a full melody at the given tempo. Returns a promise that resolves when done. */
  playMelody(melody: Melody, tempo: number): Promise<void>;
  /** Play a metronome count-in (default 4 beats). Resolves when count-in finishes. */
  playCountIn(tempo: number, beats?: number): Promise<void>;
  /** Stop any currently playing melody */
  stopMelody(): void;
  /** Whether a melody is currently playing */
  isPlaying(): boolean;
  /** Clean up resources */
  dispose(): void;
}

/**
 * Convert a duration in beats to a Tone.js duration string.
 */
function beatsToDuration(beats: number): string {
  switch (beats) {
    case 0.5: return '8n';
    case 1: return '4n';
    case 1.5: return '4n.';
    case 2: return '2n';
    default: return '4n';
  }
}

export function createAudioEngine(): AudioEngine {
  // Synth for real-time note playback (MIDI key feedback)
  const liveSynth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 8,
    voice: Tone.Synth,
    options: {
      oscillator: { type: 'triangle8' },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.3,
        release: 0.8,
      },
    },
  }).toDestination();
  liveSynth.volume.value = -6;

  // Separate synth for melody playback so it's distinguishable
  const melodySynth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 4,
    voice: Tone.Synth,
    options: {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.02,
        decay: 0.2,
        sustain: 0.5,
        release: 1.0,
      },
    },
  }).toDestination();
  melodySynth.volume.value = -3;

  // Click synth for metronome count-in
  const clickSynth = new Tone.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 6,
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.001,
      decay: 0.05,
      sustain: 0,
      release: 0.05,
    },
  }).toDestination();
  clickSynth.volume.value = -8;

  let melodyPlaying = false;
  let scheduledEvents: number[] = [];

  async function ensureStarted() {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
  }

  function playNote(midi: number, velocity = 100) {
    const noteName = midiToNoteName(midi);
    const vol = (velocity / 127) * 0.8 + 0.2; // normalize velocity to 0.2-1.0
    liveSynth.triggerAttack(noteName, undefined, vol);
  }

  function stopNote(midi: number) {
    const noteName = midiToNoteName(midi);
    liveSynth.triggerRelease(noteName);
  }

  function playMelody(melody: Melody, tempo: number): Promise<void> {
    return new Promise((resolve) => {
      stopMelody();
      melodyPlaying = true;

      const transport = Tone.getTransport();
      transport.bpm.value = tempo;
      transport.cancel();
      transport.stop();
      transport.position = 0;

      scheduledEvents = [];

      // Schedule notes at cumulative beat offsets
      let beatOffset = 0;
      melody.forEach((note) => {
        const dur = note.duration ?? 1; // default: quarter note
        const noteDuration = beatsToDuration(dur);
        // Convert beat offset to seconds for scheduling
        const timeInSeconds = (beatOffset / tempo) * 60;
        const eventId = transport.schedule((t) => {
          const noteName = midiToNoteName(note.midi);
          melodySynth.triggerAttackRelease(noteName, noteDuration, t, 0.9);
        }, timeInSeconds);
        scheduledEvents.push(eventId);
        beatOffset += dur;
      });

      // Schedule end after all notes have finished
      const endTimeInSeconds = (beatOffset / tempo) * 60;
      const endId = transport.schedule(() => {
        melodyPlaying = false;
        transport.stop();
        resolve();
      }, endTimeInSeconds);
      scheduledEvents.push(endId);

      transport.start();
    });
  }

  function playCountIn(tempo: number, beats = 4): Promise<void> {
    return new Promise((resolve) => {
      const transport = Tone.getTransport();
      transport.bpm.value = tempo;
      transport.cancel();
      transport.stop();
      transport.position = 0;

      const events: number[] = [];

      for (let i = 0; i < beats; i++) {
        const timeInSeconds = (i / tempo) * 60;
        // Higher pitch on beat 1 for emphasis
        const pitch = i === 0 ? 'C5' : 'C4';
        const eventId = transport.schedule((t) => {
          clickSynth.triggerAttackRelease(pitch, '32n', t, 0.8);
        }, timeInSeconds);
        events.push(eventId);
      }

      // Resolve after the last beat's position (on what would be beat 5 / the downbeat)
      const endTimeInSeconds = (beats / tempo) * 60;
      const endId = transport.schedule(() => {
        transport.stop();
        resolve();
      }, endTimeInSeconds);
      events.push(endId);

      transport.start();
    });
  }

  function stopMelody() {
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    scheduledEvents = [];
    melodyPlaying = false;
    melodySynth.releaseAll();
  }

  function isPlaying() {
    return melodyPlaying;
  }

  function dispose() {
    stopMelody();
    liveSynth.dispose();
    melodySynth.dispose();
    clickSynth.dispose();
  }

  return {
    ensureStarted,
    playNote,
    stopNote,
    playMelody,
    playCountIn,
    stopMelody,
    isPlaying,
    dispose,
  };
}
