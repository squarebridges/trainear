const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Convert a MIDI note number to a note name with octave (e.g. 60 -> "C4")
 */
export function midiToNoteName(midi: number, preferFlats = false): string {
  const names = preferFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${names[noteIndex]}${octave}`;
}

/**
 * Convert a MIDI note number to just the pitch class (e.g. 60 -> "C")
 */
export function midiToPitchClass(midi: number, preferFlats = false): string {
  const names = preferFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  return names[midi % 12];
}

/**
 * Convert a note name with octave to a MIDI number (e.g. "C4" -> 60)
 */
export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G][#b]?)(-?\d)$/);
  if (!match) return -1;
  const [, note, octStr] = match;
  const octave = parseInt(octStr, 10);
  const index = NOTE_NAMES_SHARP.indexOf(note) !== -1
    ? NOTE_NAMES_SHARP.indexOf(note)
    : NOTE_NAMES_FLAT.indexOf(note);
  if (index === -1) return -1;
  return (octave + 1) * 12 + index;
}

/**
 * Check if a MIDI note is a black key on the piano
 */
export function isBlackKey(midi: number): boolean {
  const pc = midi % 12;
  return [1, 3, 6, 8, 10].includes(pc);
}

/**
 * Get the interval in semitones between two MIDI notes
 */
export function intervalBetween(a: number, b: number): number {
  return Math.abs(b - a);
}
