# Trainear

A web-based ear training app that helps musicians improve their melodic memory and playback skills. Listen to a melody, play it back on your MIDI keyboard, and get scored on accuracy — all in the browser.

## Features

- **Listen & Play Back** — Hear a generated melody through realistic Salamander Grand Piano samples, then reproduce it on your MIDI keyboard
- **Progressive Difficulty** — 8 difficulty levels that auto-scale based on your performance streak, increasing note count, interval range, tempo, and enabling rhythm scoring
- **Intelligent Melody Generation** — Musically coherent melodies that favor stepwise motion, chord tones, leap recovery, and resolution patterns
- **Detailed Scoring** — Pitch accuracy comparison with optional rhythm scoring (timing tolerance-based), combined into a single percentage
- **XP & Leveling** — Earn XP with bonuses for first-listen accuracy, perfect rounds, and streak multipliers up to 3x
- **Stats Tracking** — Persistent stats including best streak, perfect rounds, average score, and a sparkline of recent performance
- **Customizable Settings** — Choose your key, scale (major, minor, pentatonic, blues, chromatic, and more), and octave range

## Requirements

- **Browser**: Chrome or Edge (requires the [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API))
- **MIDI Keyboard**: Any USB or Bluetooth MIDI controller
- **Node.js**: 18+

## Getting Started

```bash
# Clone the repo
git clone https://github.com/squarebridges/trainear.git
cd trainear

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`), connect your MIDI keyboard, and start training.

## How It Works

1. **Connect** your MIDI keyboard — the app auto-detects available devices
2. **Listen** to the generated melody (you get up to 2 replays)
3. **Play it back** on your keyboard from memory
4. **Review** your score with a note-by-note breakdown and XP earned
5. **Progress** — maintain a streak to unlock harder levels with more notes, wider intervals, and rhythm challenges

## Difficulty Levels

| Level | Notes | Max Interval | Rhythm | Tempo |
|-------|-------|-------------|--------|-------|
| 1 - Beginner | 3 | 3 semitones | Off | 100 BPM |
| 2 - Easy | 3 | 4 semitones | Off | 100 BPM |
| 3 - Moderate | 4 | 5 semitones | Off | 110 BPM |
| 4 - Intermediate | 5 | 7 semitones | On | 120 BPM |
| 5 - Challenging | 5 | 8 semitones | On | 120 BPM |
| 6 - Advanced | 6 | 10 semitones | On | 140 BPM |
| 7 - Expert | 7 | 12 semitones | On | 140 BPM |
| 8 - Master | 8 | 12 semitones | On | 160 BPM |

Levels advance automatically as you build a streak. Breaking the streak resets back to Level 1.

## Tech Stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Tone.js](https://tonejs.github.io) + [@tonejs/piano](https://github.com/tambien/Piano) for audio
- [Tonal.js](https://github.com/tonaljs/tonal) for music theory
- [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) for keyboard input

## Project Structure

```
src/
├── components/        # React UI components
├── engine/            # Core game logic
│   ├── audio.ts           # Tone.js audio engine
│   ├── comparator.ts      # Melody comparison & scoring
│   ├── melodyGenerator.ts # Melody generation algorithm
│   ├── midi.ts            # Web MIDI API wrapper
│   └── progressiveDifficulty.ts
├── hooks/             # Custom React hooks
│   ├── useAudio.ts
│   ├── useGameState.ts
│   ├── useMidi.ts
│   └── useStats.ts
├── theory/            # Music theory utilities
│   ├── noteUtils.ts
│   └── scales.ts
└── types/             # TypeScript type definitions
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## License

MIT
