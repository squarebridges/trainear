export type NoteOnCallback = (note: number, velocity: number) => void;
export type NoteOffCallback = (note: number) => void;
export type ConnectionCallback = (connected: boolean, deviceName: string | null) => void;

export interface MidiEngine {
  /** Request MIDI access and connect to the first available input */
  connect(): Promise<void>;
  /** Disconnect from current device */
  disconnect(): void;
  /** Select a specific input device by ID */
  selectDevice(deviceId: string): void;
  /** Get list of available MIDI input devices */
  getDevices(): MidiDeviceInfo[];
  /** Register note-on callback */
  onNoteOn(cb: NoteOnCallback): () => void;
  /** Register note-off callback */
  onNoteOff(cb: NoteOffCallback): () => void;
  /** Register connection change callback */
  onConnectionChange(cb: ConnectionCallback): () => void;
}

export interface MidiDeviceInfo {
  id: string;
  name: string;
}

export function createMidiEngine(): MidiEngine {
  let midiAccess: MIDIAccess | null = null;
  let activeInput: MIDIInput | null = null;

  const noteOnCallbacks = new Set<NoteOnCallback>();
  const noteOffCallbacks = new Set<NoteOffCallback>();
  const connectionCallbacks = new Set<ConnectionCallback>();

  function notifyConnection(connected: boolean, name: string | null) {
    connectionCallbacks.forEach((cb) => cb(connected, name));
  }

  function handleMidiMessage(event: MIDIMessageEvent) {
    const data = event.data;
    if (!data || data.length < 3) return;

    const status = data[0] & 0xf0;
    const note = data[1];
    const velocity = data[2];

    if (status === 0x90 && velocity > 0) {
      // Note On
      noteOnCallbacks.forEach((cb) => cb(note, velocity));
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      // Note Off
      noteOffCallbacks.forEach((cb) => cb(note));
    }
  }

  function attachToInput(input: MIDIInput) {
    if (activeInput) {
      activeInput.onmidimessage = null;
    }
    activeInput = input;
    input.onmidimessage = handleMidiMessage;
    notifyConnection(true, input.name ?? 'Unknown MIDI Device');
  }

  function getDevices(): MidiDeviceInfo[] {
    if (!midiAccess) return [];
    const devices: MidiDeviceInfo[] = [];
    midiAccess.inputs.forEach((input) => {
      devices.push({ id: input.id, name: input.name ?? `MIDI Input ${input.id}` });
    });
    return devices;
  }

  async function connect() {
    if (!navigator.requestMIDIAccess) {
      throw new Error('Web MIDI API is not supported in this browser. Please use Chrome or Edge.');
    }

    midiAccess = await navigator.requestMIDIAccess({ sysex: false });

    // Listen for device connection/disconnection
    midiAccess.onstatechange = () => {
      if (!activeInput || activeInput.state === 'disconnected') {
        // Try to auto-connect to first available
        const devices = getDevices();
        if (devices.length > 0 && midiAccess) {
          const input = midiAccess.inputs.get(devices[0].id);
          if (input) {
            attachToInput(input);
            return;
          }
        }
        activeInput = null;
        notifyConnection(false, null);
      }
    };

    // Auto-connect to first available input
    const devices = getDevices();
    if (devices.length > 0) {
      const input = midiAccess.inputs.get(devices[0].id);
      if (input) {
        attachToInput(input);
      }
    }
  }

  function disconnect() {
    if (activeInput) {
      activeInput.onmidimessage = null;
      activeInput = null;
    }
    notifyConnection(false, null);
  }

  function selectDevice(deviceId: string) {
    if (!midiAccess) return;
    const input = midiAccess.inputs.get(deviceId);
    if (input) {
      attachToInput(input);
    }
  }

  function onNoteOn(cb: NoteOnCallback): () => void {
    noteOnCallbacks.add(cb);
    return () => { noteOnCallbacks.delete(cb); };
  }

  function onNoteOff(cb: NoteOffCallback): () => void {
    noteOffCallbacks.add(cb);
    return () => { noteOffCallbacks.delete(cb); };
  }

  function onConnectionChange(cb: ConnectionCallback): () => void {
    connectionCallbacks.add(cb);
    return () => { connectionCallbacks.delete(cb); };
  }

  return {
    connect,
    disconnect,
    selectDevice,
    getDevices,
    onNoteOn,
    onNoteOff,
    onConnectionChange,
  };
}
