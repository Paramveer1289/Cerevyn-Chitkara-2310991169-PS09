// Static difficulty and threshold configuration.

export const TOTAL_PAIRS = 8; // Total unique pairs in game

export const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Easy',
    mismatchDelayMs: 1200, // Flip-back delay for easy
  },
  medium: {
    label: 'Medium',
    mismatchDelayMs: 900, // Flip-back delay for medium
  },
  hard: {
    label: 'Hard',
    mismatchDelayMs: 600, // Flip-back delay for hard
  },
};

export const ADAPTIVE_THRESHOLDS = {
  upgrade: {
    maxMoves: 10, // Max moves to qualify for upgrade
    maxTimeSeconds: 40, // Max seconds to qualify for upgrade
  },
  downgrade: {
    minMoves: 20, // Min moves to trigger downgrade
    minTimeSeconds: 90, // Min seconds to trigger downgrade
  },
};

export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];
