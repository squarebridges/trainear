import type { DifficultyConfig } from '../types';
import { AVAILABLE_SCALES, AVAILABLE_KEYS } from '../theory/scales';

interface DifficultyPanelProps {
  config: DifficultyConfig;
  onChange: (config: Partial<DifficultyConfig>) => void;
  disabled?: boolean;
}

export function DifficultyPanel({ config, onChange, disabled = false }: DifficultyPanelProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 px-4 py-3 rounded-xl bg-(--color-surface) border border-(--color-border)">
      {/* Note Count */}
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">
          Notes
        </label>
        <select
          value={config.noteCount}
          onChange={(e) => onChange({ noteCount: Number(e.target.value) })}
          disabled={disabled}
          className="bg-(--color-surface-light) text-(--color-text) border border-(--color-border) rounded px-2 py-1 text-sm disabled:opacity-50"
        >
          {[3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Octave */}
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">
          Octave
        </label>
        <select
          value={config.octave}
          onChange={(e) => onChange({ octave: Number(e.target.value) })}
          disabled={disabled}
          className="bg-(--color-surface-light) text-(--color-text) border border-(--color-border) rounded px-2 py-1 text-sm disabled:opacity-50"
        >
          {[2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Scale */}
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">
          Scale
        </label>
        <select
          value={config.scale}
          onChange={(e) => onChange({ scale: e.target.value })}
          disabled={disabled}
          className="bg-(--color-surface-light) text-(--color-text) border border-(--color-border) rounded px-2 py-1 text-sm disabled:opacity-50"
        >
          {Object.keys(AVAILABLE_SCALES).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Key */}
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">
          Key
        </label>
        <select
          value={config.key}
          onChange={(e) => onChange({ key: e.target.value })}
          disabled={disabled}
          className="bg-(--color-surface-light) text-(--color-text) border border-(--color-border) rounded px-2 py-1 text-sm disabled:opacity-50"
        >
          {AVAILABLE_KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {/* Tempo */}
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">
          Tempo
        </label>
        <input
          type="range"
          min={60}
          max={180}
          step={10}
          value={config.tempo}
          onChange={(e) => onChange({ tempo: Number(e.target.value) })}
          disabled={disabled}
          className="w-20 accent-(--color-accent)"
        />
        <span className="text-sm text-(--color-text-muted) w-12 tabular-nums">
          {config.tempo}
        </span>
      </div>

      {/* Max Interval */}
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">
          Max Leap
        </label>
        <select
          value={config.maxInterval}
          onChange={(e) => onChange({ maxInterval: Number(e.target.value) })}
          disabled={disabled}
          className="bg-(--color-surface-light) text-(--color-text) border border-(--color-border) rounded px-2 py-1 text-sm disabled:opacity-50"
        >
          <option value={3}>3 (minor 3rd)</option>
          <option value={5}>5 (perfect 4th)</option>
          <option value={7}>7 (perfect 5th)</option>
          <option value={9}>9 (major 6th)</option>
          <option value={12}>12 (octave)</option>
        </select>
      </div>

      {/* Rhythm Mode Toggle */}
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase tracking-wider text-(--color-text-muted)">
          Rhythm
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={config.rhythmMode}
          onClick={() => onChange({ rhythmMode: !config.rhythmMode })}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            config.rhythmMode
              ? 'bg-(--color-accent)'
              : 'bg-(--color-surface-light) border border-(--color-border)'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              config.rhythmMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
