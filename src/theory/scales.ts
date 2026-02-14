import { Scale, Chord } from 'tonal';

/** Available scales for training */
export const AVAILABLE_SCALES: Record<string, string> = {
  major: 'major',
  'natural minor': 'minor',
  'harmonic minor': 'harmonic minor',
  pentatonic: 'major pentatonic',
  blues: 'major blues',
  chromatic: 'chromatic',
};

/** Available keys */
export const AVAILABLE_KEYS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F',
  'F#', 'G', 'Ab', 'A', 'Bb', 'B',
];

/**
 * Get all MIDI note numbers for a given scale and key within a range.
 * @param key Root note name (e.g. 'C')
 * @param scaleName Scale name as it appears in AVAILABLE_SCALES keys
 * @param lowMidi Lower bound MIDI note (inclusive)
 * @param highMidi Upper bound MIDI note (inclusive)
 * @returns Sorted array of MIDI note numbers in the scale within the range
 */
export function getScaleNotesInRange(
  key: string,
  scaleName: string,
  lowMidi: number,
  highMidi: number,
): number[] {
  const tonalName = AVAILABLE_SCALES[scaleName] ?? scaleName;
  const scaleData = Scale.get(`${key} ${tonalName}`);

  if (!scaleData.notes.length) {
    // Fallback: return chromatic range
    return Array.from({ length: highMidi - lowMidi + 1 }, (_, i) => lowMidi + i);
  }

  // Get the pitch classes in the scale (e.g. ['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  const pitchClasses = new Set(
    scaleData.notes.map((n) => toSimplePitchClass(n)),
  );

  const result: number[] = [];
  for (let midi = lowMidi; midi <= highMidi; midi++) {
    const pc = midiToPitchClass(midi);
    if (pitchClasses.has(pc)) {
      result.push(midi);
    }
  }

  return result;
}

/** Map our scale names to the appropriate triad quality for chord-tone detection */
const SCALE_TRIAD: Record<string, string> = {
  major: 'major',
  'natural minor': 'minor',
  'harmonic minor': 'minor',
  pentatonic: 'major',
  blues: 'major',
  chromatic: 'major',
};

/**
 * Get the pitch class numbers (0-11) of the I chord (root, 3rd, 5th) for a key/scale.
 * E.g. C major → {0, 4, 7} (C, E, G)
 */
export function getChordTonePitchClasses(key: string, scaleName: string): Set<number> {
  const quality = SCALE_TRIAD[scaleName] ?? 'major';
  const chord = Chord.get(`${key} ${quality}`);
  return new Set(chord.notes.map((n) => toSimplePitchClass(n)));
}

/** Convert a note name (possibly with sharps/flats) to a 0-11 pitch class number */
function noteToPitchClassNumber(noteName: string): number {
  const map: Record<string, number> = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
    E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
    Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  };
  return map[noteName] ?? 0;
}

/** Convert MIDI number to pitch class number (0-11) */
function midiToPitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** Convert a tonal note name to a simple pitch class number */
function toSimplePitchClass(noteName: string): number {
  return noteToPitchClassNumber(noteName);
}
