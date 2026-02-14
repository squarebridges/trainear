import { midiToNoteName } from '../theory/noteUtils';
import type { NoteStatus, TimingStatus, MelodyNote } from '../types';

interface NoteDisplayProps {
  /** Label for this note sequence */
  label: string;
  /** Melody notes */
  notes: MelodyNote[];
  /** Per-note status marks (same length as notes) */
  marks?: NoteStatus[];
  /** Per-note timing marks for rhythm mode (same length as notes) */
  timingMarks?: TimingStatus[];
  /** Whether rhythm mode is on (shows duration info) */
  rhythmMode?: boolean;
  /** Whether to hide note names (during playing phase) */
  hidden?: boolean;
}

function statusColor(status: NoteStatus): string {
  switch (status) {
    case 'correct':
      return 'bg-emerald-600/30 border-emerald-500 text-emerald-300';
    case 'wrong':
      return 'bg-amber-600/30 border-amber-500 text-amber-300';
    case 'missing':
      return 'bg-red-600/20 border-red-500/50 text-red-400 opacity-60';
    case 'extra':
      return 'bg-red-600/30 border-red-500 text-red-300';
    default:
      return 'bg-(--color-surface-light) border-(--color-border) text-(--color-text)';
  }
}

function statusLabel(status: NoteStatus): string | null {
  switch (status) {
    case 'correct':
      return null;
    case 'wrong':
      return 'wrong pos';
    case 'missing':
      return 'missed';
    case 'extra':
      return 'extra';
    default:
      return null;
  }
}

function durationLabel(beats: number): string {
  switch (beats) {
    case 0.5: return '8th';
    case 1: return 'qtr';
    case 1.5: return 'dot qtr';
    case 2: return 'half';
    default: return 'qtr';
  }
}

/** Map duration in beats to a relative width class */
function durationWidthClass(beats: number | undefined): string {
  if (beats === undefined) return 'w-14'; // default quarter
  switch (beats) {
    case 0.5: return 'w-10';
    case 1: return 'w-14';
    case 1.5: return 'w-18';
    case 2: return 'w-22';
    default: return 'w-14';
  }
}

function timingLabel(timing: TimingStatus): string | null {
  switch (timing) {
    case 'on-time': return null;
    case 'early': return 'early';
    case 'late': return 'late';
    default: return null;
  }
}

function timingColor(timing: TimingStatus): string {
  switch (timing) {
    case 'on-time': return 'text-emerald-400';
    case 'early': return 'text-amber-400';
    case 'late': return 'text-orange-400';
    default: return 'text-(--color-text-muted)';
  }
}

export function NoteDisplay({ label, notes, marks, timingMarks, rhythmMode = false, hidden = false }: NoteDisplayProps) {
  if (notes.length === 0 && !hidden) {
    return (
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-2">{label}</p>
        <p className="text-(--color-text-muted) text-sm italic">No notes</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-3 text-center">
        {label}
      </p>
      <div className="flex items-end justify-center gap-2 flex-wrap">
        {hidden ? (
          <div className="flex gap-2">
            {notes.map((note, i) => (
              <div
                key={i}
                className={`${rhythmMode ? durationWidthClass(note.duration) : 'w-14'} h-14 rounded-lg bg-(--color-surface-light) border border-(--color-border) flex items-center justify-center`}
              >
                <span className="text-(--color-text-muted) text-lg">?</span>
              </div>
            ))}
          </div>
        ) : (
          notes.map((note, i) => {
            const mark = marks?.[i];
            const timing = timingMarks?.[i];
            const colorClass = mark
              ? statusColor(mark)
              : 'bg-(--color-surface-light) border-(--color-border) text-(--color-text)';
            const subLabel = mark ? statusLabel(mark) : null;
            const tLabel = timing ? timingLabel(timing) : null;
            const widthClass = rhythmMode ? durationWidthClass(note.duration) : 'w-14';

            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`${widthClass} h-14 rounded-lg border flex flex-col items-center justify-center font-mono font-semibold text-sm transition-all ${colorClass}`}
                >
                  <span>{midiToNoteName(note.midi)}</span>
                </div>
                {/* Duration label (rhythm mode) */}
                {rhythmMode && note.duration !== undefined && (
                  <span className="text-[10px] text-(--color-text-muted)">
                    {durationLabel(note.duration)}
                  </span>
                )}
                {/* Status label (wrong pos, missed, extra) */}
                {subLabel && (
                  <span className="text-[10px] text-(--color-text-muted)">{subLabel}</span>
                )}
                {/* Timing label (early, late) */}
                {tLabel && mark === 'correct' && (
                  <span className={`text-[10px] font-medium ${timingColor(timing!)}`}>
                    {tLabel}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
