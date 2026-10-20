// Unit tests for pure game logic.

import { describe, it, expect } from 'vitest';

import { mulberry32, fisherYatesShuffle }         from './rng.js';
import { buildDeck }                              from './cards.js';
import {
  gameReducer,
  createInitialState,
  FLIP_CARD,
  RESOLVE_MISMATCH,
  RESTART,
}                                                 from './reducer.js';
import { suggestDifficulty }                      from './difficulty.js';
import { TOTAL_PAIRS }                         from './config.js';

const SEED = 42;

function freshState(difficulty = 'easy') {
  return createInitialState(SEED, difficulty);
}

function getPair(cards, pairId) {
  return cards.filter(c => c.pairId === pairId);
}

function flip(state, cardId) {
  return gameReducer(state, { type: FLIP_CARD, payload: { cardId } });
}

function flipMatchingPair(state, pairId) {
  const [a, b] = getPair(state.cards, pairId);
  let s = flip(state, a.id);
  s     = flip(s,     b.id);
  return s;
}

function flipMismatchedPair(state) {
  const [a] = getPair(state.cards, 0);
  const [b] = getPair(state.cards, 1);
  let s = flip(state, a.id);
  s     = flip(s,     b.id);
  return s;
}

describe('rng — mulberry32', () => {
  it('same seed always produces the same first value', () => {
    const r1 = mulberry32(SEED);
    const r2 = mulberry32(SEED);
    expect(r1()).toBe(r2());
  });

  it('same seed produces the same full sequence', () => {
    const r1 = mulberry32(SEED);
    const r2 = mulberry32(SEED);
    const seq1 = Array.from({ length: 20 }, () => r1());
    const seq2 = Array.from({ length: 20 }, () => r2());
    expect(seq1).toEqual(seq2);
  });

  it('different seeds produce different sequences', () => {
    const v1 = mulberry32(1)();
    const v2 = mulberry32(2)();
    expect(v1).not.toBe(v2);
  });

  it('returns values in [0, 1)', () => {
    const rand = mulberry32(SEED);
    for (let i = 0; i < 100; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('rng — fisherYatesShuffle', () => {
  it('same seed gives the same shuffle order', () => {
    const arr1 = [0, 1, 2, 3, 4, 5, 6, 7];
    const arr2 = [...arr1];
    fisherYatesShuffle(arr1, mulberry32(SEED));
    fisherYatesShuffle(arr2, mulberry32(SEED));
    expect(arr1).toEqual(arr2);
  });

  it('different seeds give different shuffle orders', () => {
    const arr1 = [0, 1, 2, 3, 4, 5, 6, 7];
    const arr2 = [...arr1];
    fisherYatesShuffle(arr1, mulberry32(1));
    fisherYatesShuffle(arr2, mulberry32(999));
    expect(arr1).not.toEqual(arr2);
  });

  it('preserves all elements (no duplicates, no deletions)', () => {
    const original = [0, 1, 2, 3, 4, 5, 6, 7];
    const arr = [...original];
    fisherYatesShuffle(arr, mulberry32(SEED));
    expect([...arr].sort((a, b) => a - b)).toEqual(original);
  });

  it('mutates the original array and returns it', () => {
    const arr = [1, 2, 3];
    const result = fisherYatesShuffle(arr, mulberry32(SEED));
    expect(result).toBe(arr);
  });
});

describe('buildDeck', () => {
  it('produces exactly 16 cards', () => {
    expect(buildDeck(SEED)).toHaveLength(16);
  });

  it('contains exactly 8 pairs (2 cards per pairId)', () => {
    const deck = buildDeck(SEED);
    const counts = {};
    deck.forEach(c => { counts[c.pairId] = (counts[c.pairId] ?? 0) + 1; });
    expect(Object.keys(counts)).toHaveLength(TOTAL_PAIRS);
    Object.values(counts).forEach(n => expect(n).toBe(2));
  });

  it('assigns ids 0–15 equal to each card\'s array index', () => {
    const deck = buildDeck(SEED);
    deck.forEach((c, i) => expect(c.id).toBe(i));
  });

  it('all cards start face-down and unmatched', () => {
    const deck = buildDeck(SEED);
    deck.forEach(c => {
      expect(c.isFlipped).toBe(false);
      expect(c.isMatched).toBe(false);
    });
  });

  it('same seed gives identical deck order', () => {
    const d1 = buildDeck(SEED);
    const d2 = buildDeck(SEED);
    expect(d1.map(c => c.pairId)).toEqual(d2.map(c => c.pairId));
  });

  it('different seeds give different deck orders', () => {
    const d1 = buildDeck(1);
    const d2 = buildDeck(999);
    const same = d1.every((c, i) => c.pairId === d2[i].pairId);
    expect(same).toBe(false);
  });
});

describe('reducer — initial state', () => {
  it('starts with zero moves, zero pairs, not won, not pending', () => {
    const s = freshState();
    expect(s.moves).toBe(0);
    expect(s.pairs).toBe(0);
    expect(s.isWon).toBe(false);
    expect(s.isPending).toBe(false);
    expect(s.flippedIds).toHaveLength(0);
  });

  it('carries the correct difficulty', () => {
    expect(freshState('hard').difficulty).toBe('hard');
  });
});

describe('reducer — FLIP_CARD: first flip', () => {
  it('flips the card face-up', () => {
    const s0 = freshState();
    const s1 = flip(s0, 0);
    expect(s1.cards[0].isFlipped).toBe(true);
  });

  it('adds the card id to flippedIds', () => {
    const s1 = flip(freshState(), 0);
    expect(s1.flippedIds).toEqual([0]);
  });

  it('does not increment moves on the first flip', () => {
    const s1 = flip(freshState(), 0);
    expect(s1.moves).toBe(0);
  });

  it('does not change any other card', () => {
    const s0 = freshState();
    const s1 = flip(s0, 0);
    s1.cards.slice(1).forEach(c => expect(c.isFlipped).toBe(false));
  });
});

describe('reducer — FLIP_CARD: match', () => {
  it('increments pairs by 1', () => {
    const s = flipMatchingPair(freshState(), 0);
    expect(s.pairs).toBe(1);
  });

  it('increments moves by 1', () => {
    const s = flipMatchingPair(freshState(), 0);
    expect(s.moves).toBe(1);
  });

  it('marks both cards as matched and flipped', () => {
    const s0 = freshState();
    const [a, b] = getPair(s0.cards, 0);
    const s1 = flipMatchingPair(s0, 0);
    expect(s1.cards[a.id].isMatched).toBe(true);
    expect(s1.cards[b.id].isMatched).toBe(true);
    expect(s1.cards[a.id].isFlipped).toBe(true);
    expect(s1.cards[b.id].isFlipped).toBe(true);
  });

  it('clears flippedIds after a match', () => {
    const s = flipMatchingPair(freshState(), 0);
    expect(s.flippedIds).toHaveLength(0);
  });

  it('does not set isPending after a match', () => {
    const s = flipMatchingPair(freshState(), 0);
    expect(s.isPending).toBe(false);
  });
});

describe('reducer — FLIP_CARD: mismatch', () => {
  it('increments moves by 1', () => {
    const s = flipMismatchedPair(freshState());
    expect(s.moves).toBe(1);
  });

  it('does not increment pairs', () => {
    const s = flipMismatchedPair(freshState());
    expect(s.pairs).toBe(0);
  });

  it('sets isPending to true', () => {
    const s = flipMismatchedPair(freshState());
    expect(s.isPending).toBe(true);
  });

  it('keeps both mismatched cards face-up while pending', () => {
    const s0 = freshState();
    const [a] = getPair(s0.cards, 0);
    const [b] = getPair(s0.cards, 1);
    const s1 = flipMismatchedPair(s0);
    expect(s1.cards[a.id].isFlipped).toBe(true);
    expect(s1.cards[b.id].isFlipped).toBe(true);
  });

  it('records both ids in flippedIds', () => {
    const s0 = freshState();
    const [a] = getPair(s0.cards, 0);
    const [b] = getPair(s0.cards, 1);
    const s1 = flipMismatchedPair(s0);
    expect(s1.flippedIds).toContain(a.id);
    expect(s1.flippedIds).toContain(b.id);
  });
});

describe('reducer — FLIP_CARD: third-click blocked while pending', () => {
  it('returns the exact same state reference when isPending is true', () => {
    const pending = flipMismatchedPair(freshState());
    const otherId = pending.cards.find(
      c => !pending.flippedIds.includes(c.id)
    ).id;
    const next = flip(pending, otherId);
    expect(next).toBe(pending);
  });
});

describe('reducer — FLIP_CARD: same card clicked twice ignored', () => {
  it('returns the same state reference when the card is already face-up', () => {
    const s0 = freshState();
    const s1 = flip(s0, 0);
    const s2 = flip(s1, 0);
    expect(s2).toBe(s1);
  });
});

describe('reducer — FLIP_CARD: matched card ignored', () => {
  it('returns the same state reference when clicking a matched card', () => {
    const afterMatch = flipMatchingPair(freshState(), 0);
    const [a] = getPair(afterMatch.cards, 0);
    const next = flip(afterMatch, a.id);
    expect(next).toBe(afterMatch);
  });
});

describe('reducer — RESOLVE_MISMATCH', () => {
  it('flips both pending cards back face-down', () => {
    const s0 = freshState();
    const pending = flipMismatchedPair(s0);
    const resolved = gameReducer(pending, {
      type: RESOLVE_MISMATCH,
      payload: { gameId: pending.gameId },
    });
    pending.flippedIds.forEach(id => {
      expect(resolved.cards[id].isFlipped).toBe(false);
    });
  });

  it('clears flippedIds and isPending', () => {
    const pending = flipMismatchedPair(freshState());
    const resolved = gameReducer(pending, {
      type: RESOLVE_MISMATCH,
      payload: { gameId: pending.gameId },
    });
    expect(resolved.flippedIds).toHaveLength(0);
    expect(resolved.isPending).toBe(false);
  });

  it('ignores a stale gameId (wrong game)', () => {
    const pending = flipMismatchedPair(freshState());
    const next = gameReducer(pending, {
      type: RESOLVE_MISMATCH,
      payload: { gameId: 'stale-id-from-previous-game' },
    });
    expect(next).toBe(pending);
  });
});

describe('reducer — RESTART with stale RESOLVE_MISMATCH', () => {
  it('does not affect the new game when the old timer fires after restart', () => {
    const oldGame    = flipMismatchedPair(freshState());
    const oldGameId  = oldGame.gameId;

    const newGame = gameReducer(oldGame, {
      type: RESTART,
      payload: { seed: 999, difficulty: 'easy' },
    });

    expect(newGame.gameId).not.toBe(oldGameId);

    const afterStale = gameReducer(newGame, {
      type: RESOLVE_MISMATCH,
      payload: { gameId: oldGameId },
    });

    expect(afterStale).toBe(newGame);
    expect(afterStale.moves).toBe(0);
    expect(afterStale.pairs).toBe(0);
    expect(afterStale.isPending).toBe(false);
  });
});

describe('reducer — RESTART', () => {
  it('resets all counters and board state', () => {
    let s = freshState();
    s = flipMatchingPair(s, 0);
    const restarted = gameReducer(s, { type: RESTART, payload: { seed: SEED } });
    expect(restarted.moves).toBe(0);
    expect(restarted.pairs).toBe(0);
    expect(restarted.isWon).toBe(false);
    expect(restarted.isPending).toBe(false);
    expect(restarted.flippedIds).toHaveLength(0);
  });

  it('accepts a new difficulty from the payload', () => {
    const s = freshState('easy');
    const restarted = gameReducer(s, {
      type: RESTART,
      payload: { seed: SEED, difficulty: 'hard' },
    });
    expect(restarted.difficulty).toBe('hard');
  });

  it('falls back to the current difficulty when none is provided in payload', () => {
    const s = freshState('medium');
    const restarted = gameReducer(s, { type: RESTART, payload: { seed: SEED } });
    expect(restarted.difficulty).toBe('medium');
  });

  it('generates a new gameId so stale timeouts are invalid', () => {
    const s = freshState();
    const restarted = gameReducer(s, { type: RESTART, payload: { seed: SEED + 1 } });
    expect(restarted.gameId).not.toBe(s.gameId);
  });

  it('produces different gameIds on two restarts with the same seed', () => {
    const s = freshState();
    const r1 = gameReducer(s, { type: RESTART, payload: { seed: 12345 } });
    const r2 = gameReducer(r1, { type: RESTART, payload: { seed: 12345 } });
    expect(r1.gameId).not.toBe(r2.gameId);
  });
});

describe('reducer — win detection', () => {
  function winGame(initialState) {
    let s = initialState;
    for (let pairId = 0; pairId < TOTAL_PAIRS; pairId++) {
      s = flipMatchingPair(s, pairId);
    }
    return s;
  }

  it('isWon is false before all pairs are found', () => {
    let s = freshState();
    s = flipMatchingPair(s, 0);
    expect(s.isWon).toBe(false);
  });

  it('isWon becomes true exactly when the 8th pair is matched', () => {
    const s = winGame(freshState());
    expect(s.isWon).toBe(true);
  });

  it('pairs equals 8 on win', () => {
    const s = winGame(freshState());
    expect(s.pairs).toBe(TOTAL_PAIRS);
  });

  it('all cards are marked as matched after a win', () => {
    const s = winGame(freshState());
    s.cards.forEach(c => expect(c.isMatched).toBe(true));
  });
});

describe('suggestDifficulty — upgrade', () => {
  it('upgrades easy → medium on an excellent round', () => {
    const { nextLevel } = suggestDifficulty(8, 30, 'easy');
    expect(nextLevel).toBe('medium');
  });

  it('upgrades medium → hard on an excellent round', () => {
    const { nextLevel } = suggestDifficulty(10, 40, 'medium');
    expect(nextLevel).toBe('hard');
  });

  it('reason string mentions the new level', () => {
    const { reason, nextLevel } = suggestDifficulty(8, 30, 'easy');
    expect(reason.toLowerCase()).toContain(nextLevel);
  });

  it('does NOT upgrade if moves are great but time is too slow', () => {
    const { nextLevel } = suggestDifficulty(5, 50, 'easy');
    expect(nextLevel).not.toBe('medium');
  });

  it('does NOT upgrade if time is great but moves are too many', () => {
    const { nextLevel } = suggestDifficulty(15, 20, 'easy');
    expect(nextLevel).not.toBe('medium');
  });
});

describe('suggestDifficulty — downgrade', () => {
  it('downgrades medium → easy when moves are too many', () => {
    const { nextLevel } = suggestDifficulty(25, 50, 'medium');
    expect(nextLevel).toBe('easy');
  });

  it('downgrades hard → medium when time is too long', () => {
    const { nextLevel } = suggestDifficulty(15, 95, 'hard');
    expect(nextLevel).toBe('medium');
  });

  it('downgrades when EITHER condition triggers (moves threshold)', () => {
    const { nextLevel } = suggestDifficulty(20, 45, 'medium');
    expect(nextLevel).toBe('easy');
  });

  it('downgrades when EITHER condition triggers (time threshold)', () => {
    const { nextLevel } = suggestDifficulty(15, 90, 'medium');
    expect(nextLevel).toBe('easy');
  });

  it('reason string mentions the new level', () => {
    const { reason, nextLevel } = suggestDifficulty(25, 50, 'medium');
    expect(reason.toLowerCase()).toContain(nextLevel);
  });
});

describe('suggestDifficulty — stay the same', () => {
  it('stays on easy when performance is in the middle range', () => {
    const { nextLevel } = suggestDifficulty(15, 60, 'easy');
    expect(nextLevel).toBe('easy');
  });

  it('stays on medium when performance is in the middle range', () => {
    const { nextLevel } = suggestDifficulty(15, 60, 'medium');
    expect(nextLevel).toBe('medium');
  });

  it('stays on hard when performance is in the middle range', () => {
    const { nextLevel } = suggestDifficulty(15, 60, 'hard');
    expect(nextLevel).toBe('hard');
  });

  it('reason string does not mention a different level', () => {
    const { reason } = suggestDifficulty(15, 60, 'medium');
    expect(reason.toLowerCase()).not.toMatch(/\b(easy|hard)\b/);
  });
});

describe('suggestDifficulty — clamped at boundaries', () => {
  it('cannot upgrade past hard (already at highest level) and returns clear message', () => {
    const { nextLevel, reason } = suggestDifficulty(5, 20, 'hard');
    expect(nextLevel).toBe('hard');
    expect(reason.toLowerCase()).toContain('already on the highest level');
  });

  it('cannot downgrade past easy (already at easiest level) and returns clear message', () => {
    const { nextLevel, reason } = suggestDifficulty(30, 120, 'easy');
    expect(nextLevel).toBe('easy');
    expect(reason.toLowerCase()).toContain('already on the easiest level');
  });
});
