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

export function createAudioEngine(): AudioEngine {
  // Use Tone.js Salamander Grand Piano samples (high-quality, dry samples)
  // Sampled every 3rd note across 88 keys - Tone.js will pitch-shift in between
  const baseUrl = 'https://tonejs.github.io/audio/salamander/';
  
  let pianoLoaded = false;
  let pianoLoadResolve: (() => void) | null = null;
  const pianoLoadPromise = new Promise<void>((resolve) => {
    pianoLoadResolve = resolve;
  });
  
  // Generate sample URLs for every 3rd note (A0 to C8, MIDI 21-108)
  // This is how Salamander samples are organized: minimal pitch-shifting needed
  const sampleUrls: Record<string, string> = {};
  const notes = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
  
  for (let midi = 21; midi <= 108; midi += 3) {
    const octave = Math.floor((midi - 12) / 12);
    const note = notes[midi % 12];
    const noteName = `${note}${octave}`;
    // Convert to Tone.js format (use # instead of s for sharps)
    const toneNoteName = noteName.replace('s', '#');
    sampleUrls[toneNoteName] = `${noteName}.mp3`;
  }
  
  const piano = new Tone.Sampler({
    urls: sampleUrls,
    baseUrl,
    onload: () => {
      pianoLoaded = true;
      if (pianoLoadResolve) {
        pianoLoadResolve();
      }
    }
  }).toDestination();

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
    if (!pianoLoaded) {
      await pianoLoadPromise;
      pianoLoaded = true;
    }
  }

  function playNote(midi: number, velocity = 100) {
    if (!pianoLoaded) return;
    const noteName = midiToNoteName(midi);
    const vol = (velocity / 127); // normalize to 0-1
    piano.triggerAttack(noteName, undefined, vol);
  }

  function stopNote(midi: number) {
    if (!pianoLoaded) return;
    const noteName = midiToNoteName(midi);
    piano.triggerRelease(noteName);
  }

  async function playMelody(melody: Melody, tempo: number): Promise<void> {
    await ensureStarted();
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
        const durationSeconds = (dur / tempo) * 60; // beats to seconds
        // Convert beat offset to seconds for scheduling
        const timeInSeconds = (beatOffset / tempo) * 60;
        const eventId = transport.schedule((t) => {
          if (!pianoLoaded) return;
          const noteName = midiToNoteName(note.midi);
          piano.triggerAttackRelease(noteName, durationSeconds, t, 0.9);
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
    piano.releaseAll();
  }

  function isPlaying() {
    return melodyPlaying;
  }

  function dispose() {
    stopMelody();
    piano.dispose();
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
