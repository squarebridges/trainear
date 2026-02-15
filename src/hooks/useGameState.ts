import { useCallback, useReducer } from 'react';
import type {
  GamePhase,
  RoundState,
  DifficultyConfig,
  ComparisonResult,
  Melody,
  PlayedNote,
} from '../types';
import { DEFAULT_DIFFICULTY } from '../types';
import { generateMelody } from '../engine/melodyGenerator';
import { compareMelodies } from '../engine/comparator';

interface GameState {
  round: RoundState;
  difficulty: DifficultyConfig;
}

type GameAction =
  | { type: 'MIDI_CONNECTED' }
  | { type: 'START_LISTENING'; melody: Melody }
  | { type: 'REPLAY' }
  | { type: 'START_COUNTING_IN' }
  | { type: 'START_PLAYING' }
  | { type: 'ADD_NOTE'; note: PlayedNote }
  | { type: 'FINISH_PLAYING' }
  | { type: 'NEXT_ROUND'; melody: Melody }
  | { type: 'UPDATE_DIFFICULTY'; difficulty: Partial<DifficultyConfig> }
  | { type: 'RESET' };

function createInitialRound(): RoundState {
  return {
    phase: 'setup',
    targetMelody: [],
    playedNotes: [],
    comparison: null,
    roundNumber: 0,
    replaysUsed: 0,
  };
}

function createInitialState(): GameState {
  return {
    round: createInitialRound(),
    difficulty: { ...DEFAULT_DIFFICULTY },
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MIDI_CONNECTED': {
      if (state.round.phase !== 'setup') return state;
      const melody = generateMelody(state.difficulty);
      return {
        ...state,
        round: {
          ...state.round,
          phase: 'listening',
          targetMelody: melody,
          roundNumber: 1,
        },
      };
    }

    case 'START_LISTENING': {
      return {
        ...state,
        round: {
          ...state.round,
          phase: 'listening',
          targetMelody: action.melody,
        },
      };
    }

    case 'REPLAY': {
      if (state.round.phase !== 'listening') return state;
      return {
        ...state,
        round: {
          ...state.round,
          replaysUsed: state.round.replaysUsed + 1,
        },
      };
    }

    case 'START_COUNTING_IN': {
      if (state.round.phase !== 'listening') return state;
      return {
        ...state,
        round: {
          ...state.round,
          phase: 'counting-in',
        },
      };
    }

    case 'START_PLAYING': {
      if (state.round.phase !== 'listening' && state.round.phase !== 'counting-in') return state;
      return {
        ...state,
        round: {
          ...state.round,
          phase: 'playing',
          playedNotes: [],
        },
      };
    }

    case 'ADD_NOTE': {
      if (state.round.phase !== 'playing') return state;
      return {
        ...state,
        round: {
          ...state.round,
          playedNotes: [...state.round.playedNotes, action.note],
        },
      };
    }

    case 'FINISH_PLAYING': {
      if (state.round.phase !== 'playing') return state;
      const comparison: ComparisonResult = compareMelodies(
        state.round.targetMelody,
        state.round.playedNotes,
        {
          rhythmMode: state.difficulty.rhythmMode,
          tempo: state.difficulty.tempo,
        },
      );
      return {
        ...state,
        round: {
          ...state.round,
          phase: 'review',
          comparison,
        },
      };
    }

    case 'NEXT_ROUND': {
      return {
        ...state,
        round: {
          phase: 'listening',
          targetMelody: action.melody,
          playedNotes: [],
          comparison: null,
          roundNumber: state.round.roundNumber + 1,
          replaysUsed: 0,
        },
      };
    }

    case 'UPDATE_DIFFICULTY': {
      const newDifficulty = { ...state.difficulty, ...action.difficulty };
      // If we're in the listening phase and haven't started playing yet, regenerate the melody
      if (state.round.phase === 'listening' && state.round.playedNotes.length === 0) {
        const newMelody = generateMelody(newDifficulty);
        return {
          ...state,
          difficulty: newDifficulty,
          round: {
            ...state.round,
            targetMelody: newMelody,
            replaysUsed: 0, // Reset replays since it's a new melody
          },
        };
      }
      return {
        ...state,
        difficulty: newDifficulty,
      };
    }

    case 'RESET': {
      return createInitialState();
    }

    default:
      return state;
  }
}

export interface UseGameStateReturn {
  /** Current round state */
  round: RoundState;
  /** Current difficulty config */
  difficulty: DifficultyConfig;
  /** Current game phase (shortcut) */
  phase: GamePhase;
  /** Called when MIDI connects for the first time */
  onMidiConnected: () => void;
  /** Increment replay counter */
  onReplay: () => void;
  /** Transition to counting-in phase */
  startCountingIn: () => void;
  /** Transition to playing phase */
  startPlaying: () => void;
  /** Record a played note with timestamp */
  addNote: (note: PlayedNote) => void;
  /** Finish playing, compute score */
  finishPlaying: () => void;
  /** Start next round with a new melody */
  nextRound: () => void;
  /** Update difficulty settings */
  updateDifficulty: (config: Partial<DifficultyConfig>) => void;
}

export function useGameState(): UseGameStateReturn {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  const onMidiConnected = useCallback(() => {
    dispatch({ type: 'MIDI_CONNECTED' });
  }, []);

  const onReplay = useCallback(() => {
    dispatch({ type: 'REPLAY' });
  }, []);

  const startCountingIn = useCallback(() => {
    dispatch({ type: 'START_COUNTING_IN' });
  }, []);

  const startPlaying = useCallback(() => {
    dispatch({ type: 'START_PLAYING' });
  }, []);

  const addNote = useCallback((note: PlayedNote) => {
    dispatch({ type: 'ADD_NOTE', note });
  }, []);

  const finishPlaying = useCallback(() => {
    dispatch({ type: 'FINISH_PLAYING' });
  }, []);

  const nextRound = useCallback(() => {
    const melody = generateMelody(state.difficulty);
    dispatch({ type: 'NEXT_ROUND', melody });
  }, [state.difficulty]);

  const updateDifficulty = useCallback((config: Partial<DifficultyConfig>) => {
    dispatch({ type: 'UPDATE_DIFFICULTY', difficulty: config });
  }, []);

  return {
    round: state.round,
    difficulty: state.difficulty,
    phase: state.round.phase,
    onMidiConnected,
    onReplay,
    startCountingIn,
    startPlaying,
    addNote,
    finishPlaying,
    nextRound,
    updateDifficulty,
  };
}
