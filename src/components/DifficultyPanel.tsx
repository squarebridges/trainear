import type { DifficultyConfig } from '../types';
import { AVAILABLE_SCALES, AVAILABLE_KEYS } from '../theory/scales';

interface AutoDifficultyPanelProps {
  config: DifficultyConfig;
  /** Fields that were just auto-changed (for highlight animation) */
  highlightedFields?: (keyof DifficultyConfig)[];
}

interface UserSettingsPanelProps {
  config: DifficultyConfig;
  onChange: (config: Partial<DifficultyConfig>) => void;
  disabled?: boolean;
  /** Fields managed by the progressive difficulty system (always disabled) */
  lockedFields?: (keyof DifficultyConfig)[];
}

function fieldClass(field: keyof DifficultyConfig, highlighted?: (keyof DifficultyConfig)[]): string {
  const base = 'flex items-center gap-2 px-1.5 py-1 rounded-md';
  if (highlighted?.includes(field)) {
    return `${base} difficulty-highlight`;
  }
  return base;
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-(--color-text-muted) opacity-50 shrink-0"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/** Read-only display of auto-adjusted difficulty parameters */
export function AutoDifficultyPanel({ config, highlightedFields }: AutoDifficultyPanelProps) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-(--color-surface)/60 border border-(--color-border) h-full">
      <div className="flex items-center gap-1.5 mb-0.5" title="These settings are adjusted automatically as you level up">
        <LockIcon />
        <span className="text-[10px] uppercase tracking-widest text-(--color-text-muted) font-medium">Auto-Adjusted</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className={fieldClass('noteCount', highlightedFields)}>
          <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">Notes</label>
          <span className="text-sm tabular-nums text-(--color-text)">{config.noteCount}</span>
        </div>
        <div className={fieldClass('maxInterval', highlightedFields)}>
          <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">Leap</label>
          <span className="text-sm tabular-nums text-(--color-text)">{config.maxInterval}</span>
        </div>
        <div className={fieldClass('tempo', highlightedFields)}>
          <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">BPM</label>
          <span className="text-sm tabular-nums text-(--color-text)">{config.tempo}</span>
        </div>
        <div className={fieldClass('rhythmMode', highlightedFields)}>
          <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">Rhythm</label>
          <span className={`text-sm ${config.rhythmMode ? 'text-(--color-accent)' : 'text-(--color-text-muted)'}`}>
            {config.rhythmMode ? 'On' : 'Off'}
          </span>
        </div>
      </div>
    </div>
  );
}

/** User-configurable settings (key, scale, octave) */
export function UserSettingsPanel({ config, onChange, disabled = false, lockedFields = [] }: UserSettingsPanelProps) {
  const isLocked = (field: keyof DifficultyConfig) => lockedFields.includes(field);
  return (
    <div className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-(--color-surface) border border-(--color-border) h-full">
      <span className="text-[10px] uppercase tracking-widest text-(--color-text-muted) font-medium mb-0.5">Your Settings</span>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">Key</label>
          <select
            value={config.key}
            onChange={(e) => onChange({ key: e.target.value })}
            disabled={disabled || isLocked('key')}
            className="bg-(--color-surface-light) text-(--color-text) border border-(--color-border) rounded px-2 py-1.5 text-sm disabled:opacity-50 w-full"
          >
            {AVAILABLE_KEYS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">Scale</label>
          <select
            value={config.scale}
            onChange={(e) => onChange({ scale: e.target.value })}
            disabled={disabled || isLocked('scale')}
            className="bg-(--color-surface-light) text-(--color-text) border border-(--color-border) rounded px-2 py-1.5 text-sm disabled:opacity-50 w-full"
          >
            {Object.keys(AVAILABLE_SCALES).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">Octave</label>
          <select
            value={config.octave}
            onChange={(e) => onChange({ octave: Number(e.target.value) })}
            disabled={disabled || isLocked('octave')}
            className="bg-(--color-surface-light) text-(--color-text) border border-(--color-border) rounded px-2 py-1.5 text-sm disabled:opacity-50 w-full"
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
