import type { MidiDeviceInfo } from '../engine/midi';

interface MidiSetupProps {
  connected: boolean;
  deviceName: string | null;
  devices: MidiDeviceInfo[];
  error: string | null;
  onConnect: () => void;
  onSelectDevice: (deviceId: string) => void;
}

export function MidiSetup({
  connected,
  deviceName,
  devices,
  error,
  onConnect,
  onSelectDevice,
}: MidiSetupProps) {
  if (connected) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-(--color-surface)">
        <div className="w-2.5 h-2.5 rounded-full bg-(--color-success) animate-pulse" />
        <span className="text-sm text-(--color-text-muted)">
          Connected: <span className="text-(--color-text) font-medium">{deviceName}</span>
        </span>
        {devices.length > 1 && (
          <select
            className="ml-auto text-xs bg-(--color-surface-light) text-(--color-text) border border-(--color-border) rounded px-2 py-1"
            onChange={(e) => onSelectDevice(e.target.value)}
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Connect Your MIDI Keyboard</h2>
        <p className="text-(--color-text-muted) max-w-md">
          Plug in your MIDI keyboard via USB, then click the button below.
          Make sure you&apos;re using Chrome or Edge.
        </p>
      </div>

      <button
        onClick={onConnect}
        className="px-8 py-3 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) text-white font-semibold text-lg transition-colors cursor-pointer"
      >
        Connect MIDI Device
      </button>

      {error && (
        <p className="text-(--color-error) text-sm mt-2">{error}</p>
      )}

      {!error && devices.length === 0 && (
        <p className="text-(--color-text-muted) text-xs">
          No MIDI devices detected yet.
        </p>
      )}
    </div>
  );
}
