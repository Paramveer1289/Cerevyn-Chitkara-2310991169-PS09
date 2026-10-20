// Game state and timer management hook.

import { useReducer, useRef, useEffect } from 'react';

import {
  gameReducer,
  createInitialState,
  FLIP_CARD,
  RESOLVE_MISMATCH,
  RESTART,
} from '../game/reducer.js';
import { DIFFICULTY_CONFIG } from '../game/config.js';
import { useTimer } from './useTimer.js';

/**
 * Main game hook.
 * @param {number} [initialSeed]
 * @param {string} [initialDifficulty='easy']
 */
export function useGame(initialSeed, initialDifficulty = 'easy') {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => createInitialState(initialSeed, initialDifficulty),
  );

  const mismatchTimerRef = useRef(null);

  // Mismatch resolution timer
  useEffect(() => {
    if (!state.isPending) return;

    const delay = DIFFICULTY_CONFIG[state.difficulty].mismatchDelayMs;
    const gameId = state.gameId;

    mismatchTimerRef.current = setTimeout(() => {
      dispatch({ type: RESOLVE_MISMATCH, payload: { gameId } });
    }, delay);

    return () => {
      clearTimeout(mismatchTimerRef.current);
      mismatchTimerRef.current = null;
    };
  }, [state.isPending, state.gameId, state.difficulty]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(mismatchTimerRef.current);
    };
  }, []);

  // Active elapsed time tracking
  const hasStarted = state.moves > 0 || state.flippedIds.length > 0 || state.pairs > 0;
  const isTimerRunning = hasStarted && !state.isWon;
  const { seconds: elapsedTime, ms: elapsedMs } = useTimer(isTimerRunning, state.gameId);

  // Actions
  function flipCard(cardId) {
    dispatch({ type: FLIP_CARD, payload: { cardId } });
  }

  function restart(seed = Date.now(), difficulty) {
    clearTimeout(mismatchTimerRef.current);
    mismatchTimerRef.current = null;
    dispatch({ type: RESTART, payload: { seed, difficulty } });
  }

  return {
    state,
    flipCard,
    restart,
    elapsedTime,
    timer: elapsedTime,
    elapsedMs,
  };
}
