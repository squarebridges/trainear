import { useEffect, useRef, useState, useCallback } from 'react';
import { createMidiEngine, type MidiDeviceInfo, type MidiEngine } from '../engine/midi';

export interface UseMidiReturn {
  /** Whether a MIDI device is connected */
  connected: boolean;
  /** Name of the connected device */
  deviceName: string | null;
  /** Available MIDI input devices */
  devices: MidiDeviceInfo[];
  /** Currently pressed notes (for keyboard visualization) */
  activeNotes: Set<number>;
  /** Select a different MIDI device */
  selectDevice: (deviceId: string) => void;
  /** Initialize MIDI connection */
  connect: () => Promise<void>;
  /** Register a callback for note-on events */
  onNoteOn: (cb: (note: number, velocity: number) => void) => () => void;
  /** Register a callback for note-off events */
  onNoteOff: (cb: (note: number) => void) => () => void;
  /** Error message if MIDI connection failed */
  error: string | null;
}

export function useMidi(): UseMidiReturn {
  const engineRef = useRef<MidiEngine | null>(null);
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [devices, setDevices] = useState<MidiDeviceInfo[]>([]);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Create engine once
  if (!engineRef.current) {
    engineRef.current = createMidiEngine();
  }

  useEffect(() => {
    const engine = engineRef.current!;

    const unsubConnection = engine.onConnectionChange((isConnected, name) => {
      setConnected(isConnected);
      setDeviceName(name);
      setDevices(engine.getDevices());
    });

    // Track active notes for visualization
    const unsubNoteOn = engine.onNoteOn((note) => {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.add(note);
        return next;
      });
    });

    const unsubNoteOff = engine.onNoteOff((note) => {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    });

    return () => {
      unsubConnection();
      unsubNoteOn();
      unsubNoteOff();
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      await engineRef.current!.connect();
      setDevices(engineRef.current!.getDevices());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect to MIDI');
    }
  }, []);

  const selectDevice = useCallback((deviceId: string) => {
    engineRef.current!.selectDevice(deviceId);
  }, []);

  const onNoteOn = useCallback((cb: (note: number, velocity: number) => void) => {
    return engineRef.current!.onNoteOn(cb);
  }, []);

  const onNoteOff = useCallback((cb: (note: number) => void) => {
    return engineRef.current!.onNoteOff(cb);
  }, []);

  return {
    connected,
    deviceName,
    devices,
    activeNotes,
    selectDevice,
    connect,
    onNoteOn,
    onNoteOff,
    error,
  };
}
