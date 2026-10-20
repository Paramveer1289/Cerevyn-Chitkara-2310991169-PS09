// Adaptive difficulty evaluation logic.

import { ADAPTIVE_THRESHOLDS, DIFFICULTY_ORDER } from './config.js';

/**
 * Evaluates performance and suggests next difficulty level.
 * @param {number} moves
 * @param {number} timeSeconds
 * @param {string} currentLevel
 * @returns {{ nextLevel: string, reason: string }}
 */
export function suggestDifficulty(moves, timeSeconds, currentLevel) {
  const { upgrade, downgrade } = ADAPTIVE_THRESHOLDS;
  const currentIndex = DIFFICULTY_ORDER.indexOf(currentLevel);

  const qualifiesForUpgrade =
    moves <= upgrade.maxMoves &&
    timeSeconds <= upgrade.maxTimeSeconds;

  const qualifiesForDowngrade =
    moves >= downgrade.minMoves ||
    timeSeconds >= downgrade.minTimeSeconds;

  const isHighest = currentIndex === DIFFICULTY_ORDER.length - 1;
  const isLowest = currentIndex === 0;

  // Check upgrade
  if (qualifiesForUpgrade) {
    if (isHighest) {
      return {
        nextLevel: currentLevel,
        reason: `Outstanding! You finished in ${moves} moves and ${timeSeconds}s — ` +
                `you are already on the highest level (${capitalize(currentLevel)})!`,
      };
    }

    const nextLevel = DIFFICULTY_ORDER[currentIndex + 1];
    return {
      nextLevel,
      reason: `Impressive! You finished in ${moves} moves and ${timeSeconds}s — ` +
              `well within the target of ${upgrade.maxMoves} moves / ` +
              `${upgrade.maxTimeSeconds}s. Moving up to ${capitalize(nextLevel)}.`,
    };
  }

  // Check downgrade
  if (qualifiesForDowngrade) {
    if (isLowest) {
      const reasons = [];
      if (moves >= downgrade.minMoves) {
        reasons.push(`${moves} moves (threshold: ${downgrade.minMoves})`);
      }
      if (timeSeconds >= downgrade.minTimeSeconds) {
        reasons.push(`${timeSeconds}s (threshold: ${downgrade.minTimeSeconds}s)`);
      }

      return {
        nextLevel: currentLevel,
        reason: `Tough round (${reasons.join(' and ')}), ` +
                `but you are already on the easiest level (${capitalize(currentLevel)}). Keep practicing!`,
      };
    }

    const nextLevel = DIFFICULTY_ORDER[currentIndex - 1];
    const reasons = [];
    if (moves >= downgrade.minMoves) {
      reasons.push(`${moves} moves (threshold: ${downgrade.minMoves})`);
    }
    if (timeSeconds >= downgrade.minTimeSeconds) {
      reasons.push(`${timeSeconds}s (threshold: ${downgrade.minTimeSeconds}s)`);
    }

    return {
      nextLevel,
      reason: `Tough round — you needed ${reasons.join(' and ')}. ` +
              `Dropping to ${capitalize(nextLevel)} to give you more time to look.`,
    };
  }

  // Maintain current level
  return {
    nextLevel: currentLevel,
    reason: `Good game! Your score (${moves} moves, ${timeSeconds}s) ` +
            `is in the normal range for ${capitalize(currentLevel)}. ` +
            `Difficulty stays the same.`,
  };
}

// Capitalize helper
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
