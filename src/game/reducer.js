// Game state reducer and action handlers.

import { buildDeck } from './cards.js';
import { TOTAL_PAIRS } from './config.js';

let gameCounter = 0;

export const FLIP_CARD        = 'FLIP_CARD';
export const RESOLVE_MISMATCH = 'RESOLVE_MISMATCH';
export const RESTART          = 'RESTART';

/**
 * @typedef {Object} GameState
 * @property {string} gameId - Unique round identifier
 * @property {Array} cards - Shuffled cards
 * @property {number[]} flippedIds - Active flipped card IDs
 * @property {number} moves - Total pair attempts
 * @property {number} pairs - Matched pairs count
 * @property {boolean} isWon - Whether game is won
 * @property {boolean} isPending - Whether awaiting mismatch flip-back
 * @property {string} difficulty - Current difficulty level
 * @property {number} seed - Game seed
 */

/**
 * Creates initial game state.
 * @param {number} [seed=Date.now()]
 * @param {string} [difficulty='easy']
 * @returns {GameState}
 */
export function createInitialState(seed = Date.now(), difficulty = 'easy') {
  return {
    gameId:    `${seed}-${++gameCounter}`,
    cards:     buildDeck(seed),
    flippedIds: [],
    moves:     0,
    pairs:     0,
    isWon:     false,
    isPending: false,
    difficulty,
    seed,
  };
}

/**
 * Pure game reducer.
 * @param {GameState} state
 * @param {{ type: string, payload?: any }} action
 * @returns {GameState}
 */
export function gameReducer(state, action) {
  switch (action.type) {
    case FLIP_CARD: {
      const { cardId } = action.payload;

      // Guards
      if (state.isPending) return state;

      const card = state.cards[cardId];
      if (card.isMatched) return state;
      if (state.flippedIds.includes(cardId)) return state;

      const updatedCards = state.cards.map(c =>
        c.id === cardId ? { ...c, isFlipped: true } : c
      );

      // First card flipped
      if (state.flippedIds.length === 0) {
        return {
          ...state,
          cards:      updatedCards,
          flippedIds: [cardId],
        };
      }

      // Second card: evaluate pair
      const [firstId] = state.flippedIds;
      const firstCard  = state.cards[firstId];
      const isMatch    = firstCard.pairId === card.pairId;
      const newMoves   = state.moves + 1;

      // Match found
      if (isMatch) {
        const matchedCards = updatedCards.map(c =>
          c.id === firstId || c.id === cardId
            ? { ...c, isMatched: true, isFlipped: true }
            : c
        );
        const newPairs = state.pairs + 1;

        return {
          ...state,
          cards:      matchedCards,
          flippedIds: [],
          moves:      newMoves,
          pairs:      newPairs,
          isWon:      newPairs === TOTAL_PAIRS,
          isPending:  false,
        };
      } else {
        // Mismatch: wait for timer
        return {
          ...state,
          cards:      updatedCards,
          flippedIds: [firstId, cardId],
          moves:      newMoves,
          isPending:  true,
        };
      }
    }

    // Resolve mismatch
    case RESOLVE_MISMATCH: {
      // Stale timer guard
      if (action.payload.gameId !== state.gameId) return state;

      const resolvedCards = state.cards.map(c =>
        state.flippedIds.includes(c.id) ? { ...c, isFlipped: false } : c
      );

      return {
        ...state,
        cards:      resolvedCards,
        flippedIds: [],
        isPending:  false,
      };
    }

    // Reset on restart
    case RESTART: {
      const seed       = action.payload?.seed       ?? Date.now();
      const difficulty = action.payload?.difficulty ?? state.difficulty;
      return createInitialState(seed, difficulty);
    }

    // Default fallback
    default:
      return state;
  }
}
