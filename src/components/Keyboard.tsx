import { isBlackKey } from '../theory/noteUtils';

interface KeyboardProps {
  /** Range of MIDI notes to display */
  lowNote?: number;
  highNote?: number;
  /** Currently pressed notes (from MIDI) */
  activeNotes: Set<number>;
  /** Notes to highlight (e.g. target melody in review) */
  highlightNotes?: Set<number>;
  /** Notes to mark as errors */
  errorNotes?: Set<number>;
}

const WHITE_KEY_WIDTH = 36;
const WHITE_KEY_HEIGHT = 140;
const BLACK_KEY_WIDTH = 22;
const BLACK_KEY_HEIGHT = 90;

export function Keyboard({
  lowNote = 48,   // C3
  highNote = 72,  // C5
  activeNotes,
  highlightNotes = new Set(),
  errorNotes = new Set(),
}: KeyboardProps) {
  // Build keys data
  const whiteKeys: number[] = [];
  const blackKeys: { midi: number; xOffset: number }[] = [];

  let whiteIndex = 0;
  for (let midi = lowNote; midi <= highNote; midi++) {
    if (!isBlackKey(midi)) {
      whiteKeys.push(midi);
      whiteIndex++;
    } else {
      // Position black key relative to the previous white key
      const xOffset = (whiteIndex - 1) * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;
      blackKeys.push({ midi, xOffset });
    }
  }

  const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH;

  function getKeyColor(midi: number, isBlack: boolean): string {
    if (activeNotes.has(midi)) {
      return 'var(--color-accent)';
    }
    if (errorNotes.has(midi)) {
      return 'var(--color-error)';
    }
    if (highlightNotes.has(midi)) {
      return 'var(--color-success)';
    }
    return isBlack ? '#1a1a2e' : '#e8e8f0';
  }

  return (
    <div className="flex justify-center overflow-x-auto py-4">
      <svg
        width={totalWidth}
        height={WHITE_KEY_HEIGHT + 4}
        viewBox={`0 0 ${totalWidth} ${WHITE_KEY_HEIGHT + 4}`}
        className="drop-shadow-lg"
      >
        {/* White keys */}
        {whiteKeys.map((midi, i) => (
          <rect
            key={`w-${midi}`}
            x={i * WHITE_KEY_WIDTH + 1}
            y={2}
            width={WHITE_KEY_WIDTH - 2}
            height={WHITE_KEY_HEIGHT}
            rx={4}
            fill={getKeyColor(midi, false)}
            stroke="var(--color-border)"
            strokeWidth={1}
            className="transition-colors duration-75"
          />
        ))}
        {/* Black keys */}
        {blackKeys.map(({ midi, xOffset }) => (
          <rect
            key={`b-${midi}`}
            x={xOffset}
            y={2}
            width={BLACK_KEY_WIDTH}
            height={BLACK_KEY_HEIGHT}
            rx={3}
            fill={getKeyColor(midi, true)}
            stroke="#000"
            strokeWidth={0.5}
            className="transition-colors duration-75"
          />
        ))}
      </svg>
    </div>
  );
}
