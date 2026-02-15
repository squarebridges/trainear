/** A single note event captured from MIDI input or generated */
export interface NoteEvent {
  /** MIDI note number (0-127, middle C = 60) */
  midi: number;
  /** Velocity (0-127) */
  velocity: number;
  /** Timestamp in ms relative to round start */
  time: number;
}

/** Rhythmic duration in beats (1 = quarter note at current BPM) */
export type Duration = 0.5 | 1 | 1.5 | 2;

/** A single note in a melody */
export interface MelodyNote {
  /** MIDI note number (0-127) */
  midi: number;
  /** Duration in beats. Undefined = quarter note (pitch-only mode) */
  duration?: Duration;
}

/** A melody is an ordered array of melody notes */
export type Melody = MelodyNote[];

/** A played note with timestamp */
export interface PlayedNote {
  /** MIDI note number */
  midi: number;
  /** Time in seconds relative to recording start */
  time: number;
}

/** The phases of the game loop */
export type GamePhase = 'setup' | 'listening' | 'counting-in' | 'playing' | 'review';

/** Per-note comparison result */
export type NoteStatus = 'correct' | 'wrong' | 'missing' | 'extra';

/** Per-note timing feedback */
export type TimingStatus = 'on-time' | 'early' | 'late';

/** Result of comparing a played melody to the target */
export interface ComparisonResult {
  /** 0-100 combined percentage score */
  score: number;
  /** 0-100 pitch-only score */
  pitchScore: number;
  /** 0-100 rhythm score (only meaningful when rhythm mode is on) */
  rhythmScore?: number;
  /** Per-note status for the target melody */
  targetMarks: NoteStatus[];
  /** Per-note status for the played melody */
  playedMarks: NoteStatus[];
  /** Per-note timing feedback for target melody (rhythm mode only) */
  timingMarks?: TimingStatus[];
}

/** Difficulty configuration for melody generation */
export interface DifficultyConfig {
  /** Number of notes in the melody (3-8) */
  noteCount: number;
  /** Musical scale to use */
  scale: string;
  /** Root key (e.g. 'C', 'D', 'Eb') */
  key: string;
  /** Tempo in BPM for melody playback */
  tempo: number;
  /** Maximum semitone interval between consecutive notes */
  maxInterval: number;
  /** Whether rhythm mode is enabled */
  rhythmMode: boolean;
  /** Starting octave number (e.g., 4 for octave 4-5) */
  octave: number;
}

/** State for a single round */
export interface RoundState {
  phase: GamePhase;
  targetMelody: Melody;
  playedNotes: PlayedNote[];
  comparison: ComparisonResult | null;
  roundNumber: number;
  replaysUsed: number;
}

/** Default difficulty settings */
export const DEFAULT_DIFFICULTY: DifficultyConfig = {
  noteCount: 4,
  scale: 'major',
  key: 'C',
  tempo: 100,
  maxInterval: 7,
  rhythmMode: false,
  octave: 4,
};
