// Deck construction and shuffling.

import { fisherYatesShuffle, mulberry32 } from './rng.js';
import { TOTAL_PAIRS } from './config.js';

const SYMBOLS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

/**
 * @typedef {Object} Card
 * @property {number} id - Card ID and grid index
 * @property {string} symbol - Card emoji face
 * @property {number} pairId - Pair identifier
 * @property {boolean} isFlipped - Whether face-up
 * @property {boolean} isMatched - Whether permanently matched
 */

/**
 * Builds a shuffled deck of cards.
 * @param {number} seed
 * @returns {Card[]}
 */
export function buildDeck(seed) {
  // Create card pairs
  const deck = SYMBOLS.slice(0, TOTAL_PAIRS).flatMap((symbol, pairId) => [
    { id: -1, symbol, pairId, isFlipped: false, isMatched: false },
    { id: -1, symbol, pairId, isFlipped: false, isMatched: false },
  ]);

  // Shuffle deck
  const rand = mulberry32(seed);
  fisherYatesShuffle(deck, rand);

  // Assign positional IDs
  deck.forEach((card, index) => {
    card.id = index;
  });

  return deck;
}
