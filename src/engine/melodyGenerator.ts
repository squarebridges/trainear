import { getScaleNotesInRange, getChordTonePitchClasses } from '../theory/scales';
import type { DifficultyConfig, Melody, Duration } from '../types';

/** Weighted rhythm pool: [duration, weight] */
const RHYTHM_POOL: [Duration, number][] = [
  [0.5, 20],  // eighth note
  [1, 50],    // quarter note (most common)
  [1.5, 15],  // dotted quarter
  [2, 15],    // half note
];

/**
 * Pick a random duration from the weighted pool.
 */
function randomDuration(): Duration {
  const totalWeight = RHYTHM_POOL.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * totalWeight;
  for (const [dur, weight] of RHYTHM_POOL) {
    r -= weight;
    if (r <= 0) return dur;
  }
  return 1; // fallback: quarter note
}

/**
 * Pick a candidate index using weighted random selection.
 *
 * Weights are the product of:
 *  - Harmonic weight: chord tone (root/3rd/5th) = 4, other scale tone = 1
 *  - Motion weight (by scale-step distance): step (±1) = 5, skip (±2) = 3, leap (±3+) = 1
 *  - Leap recovery: after a leap, candidates in the opposite direction get 3× bonus
 *  - Resolution bonus: when `resolving` is true, root gets 6×, 5th gets 3× (for final note)
 */
function weightedPick(
  candidateIndices: number[],
  scaleNotes: number[],
  currentIndex: number,
  chordTonePCs: Set<number>,
  rootPC: number,
  fifthPC: number,
  lastLeapDir: 'up' | 'down' | null,
  resolving: boolean,
): number {
  const weights = candidateIndices.map((j) => {
    const pc = scaleNotes[j] % 12;

    // Harmonic weight: prefer chord tones
    let harmonicW = chordTonePCs.has(pc) ? 4 : 1;

    // Resolution bonus: strongly prefer root, then 5th, for the final note
    if (resolving) {
      if (pc === rootPC) harmonicW *= 6;
      else if (pc === fifthPC) harmonicW *= 3;
      else harmonicW = 1; // non-chord tones unlikely as resolution
    }

    // Motion weight: prefer stepwise motion
    const scaleDist = Math.abs(j - currentIndex);
    const motionW = scaleDist <= 1 ? 5 : scaleDist <= 2 ? 3 : 1;

    // Leap recovery: after a leap, bias toward the opposite direction
    let recoveryW = 1;
    if (lastLeapDir !== null) {
      const direction = j - currentIndex;
      if (lastLeapDir === 'up' && direction < 0) recoveryW = 3;
      else if (lastLeapDir === 'down' && direction > 0) recoveryW = 3;
    }

    return harmonicW * motionW * recoveryW;
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidateIndices[i];
  }
  return candidateIndices[candidateIndices.length - 1];
}

/**
 * Generate a musically-intelligent melody respecting the given difficulty configuration.
 *
 * Algorithm:
 * 1. Get all scale notes in the allowed range (centered around middle C)
 * 2. Start on a chord tone (root, 3rd, or 5th), biased toward the center of the range
 * 3. Walk by choosing weighted-random notes within the maxInterval constraint,
 *    preferring chord tones and stepwise motion, with leap recovery
 * 4. End on the root or 5th for melodic resolution
 * 5. If rhythmMode is on, assign random durations from a weighted pool
 */
export function generateMelody(config: DifficultyConfig): Melody {
  // Center range around middle C (MIDI 60), spanning about 1.5 octaves
  const centerMidi = 60;
  const lowMidi = centerMidi - 8;  // E3 area
  const highMidi = centerMidi + 12; // C5 area

  const scaleNotes = getScaleNotesInRange(config.key, config.scale, lowMidi, highMidi);

  if (scaleNotes.length === 0) {
    // Fallback: simple C major scale fragment
    return [60, 62, 64, 65].slice(0, config.noteCount).map((midi) => ({
      midi,
      duration: config.rhythmMode ? randomDuration() : undefined,
    }));
  }

  // Get chord-tone pitch classes for this key/scale
  const chordTonePCs = getChordTonePitchClasses(config.key, config.scale);

  // Identify root and 5th pitch classes for resolution weighting
  const rootPC = scaleNotes[0] !== undefined
    ? scaleNotes.find((m) => chordTonePCs.has(m % 12))! % 12
    : 0;
  // The 5th is 7 semitones above root
  const fifthPC = (rootPC + 7) % 12;

  const melody: Melody = [];

  // --- Start on a chord tone (root/3rd/5th), biased toward center of range ---
  const chordToneIndices = scaleNotes
    .map((midi, i) => ({ midi, i }))
    .filter(({ midi }) => chordTonePCs.has(midi % 12))
    .map(({ i }) => i);

  let currentIndex: number;
  if (chordToneIndices.length > 0) {
    currentIndex = chordToneIndices[randomIndexNearCenter(chordToneIndices.length)];
  } else {
    // Fallback if no chord tones found (e.g. chromatic edge case)
    currentIndex = randomIndexNearCenter(scaleNotes.length);
  }

  melody.push({
    midi: scaleNotes[currentIndex],
    duration: config.rhythmMode ? randomDuration() : undefined,
  });

  // --- Walk through the melody with weighted selection ---
  let lastLeapDir: 'up' | 'down' | null = null;

  for (let i = 1; i < config.noteCount; i++) {
    const isLastNote = i === config.noteCount - 1;

    // Find candidate notes within maxInterval semitones
    const currentMidi = scaleNotes[currentIndex];
    const candidateIndices: number[] = [];

    for (let j = 0; j < scaleNotes.length; j++) {
      const dist = Math.abs(scaleNotes[j] - currentMidi);
      if (dist > 0 && dist <= config.maxInterval) {
        candidateIndices.push(j);
      }
    }

    let nextIndex: number;

    if (candidateIndices.length === 0) {
      // If no candidates (shouldn't happen normally), pick any scale note
      nextIndex = Math.floor(Math.random() * scaleNotes.length);
    } else {
      nextIndex = weightedPick(
        candidateIndices,
        scaleNotes,
        currentIndex,
        chordTonePCs,
        rootPC,
        fifthPC,
        lastLeapDir,
        isLastNote,
      );
    }

    // Track leap direction for recovery on the next note
    const scaleStepDist = nextIndex - currentIndex;
    if (Math.abs(scaleStepDist) >= 3) {
      lastLeapDir = scaleStepDist > 0 ? 'up' : 'down';
    } else {
      lastLeapDir = null;
    }

    currentIndex = nextIndex;

    melody.push({
      midi: scaleNotes[currentIndex],
      duration: config.rhythmMode ? randomDuration() : undefined,
    });
  }

  return melody;
}

/** Pick a random index biased toward the center of the array */
function randomIndexNearCenter(length: number): number {
  if (length <= 1) return 0;
  // Use a simple triangular distribution centered on the middle
  const center = (length - 1) / 2;
  const spread = length / 3;
  let index = Math.round(center + (Math.random() - 0.5) * 2 * spread);
  index = Math.max(0, Math.min(length - 1, index));
  return index;
}
