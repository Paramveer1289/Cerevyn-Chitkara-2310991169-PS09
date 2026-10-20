// Local storage persistence for game results.

export const STORAGE_KEY = 'memory_game_results';

/**
 * Retrieves all stored game results.
 * @returns {Array<Object>}
 */
export function getResults() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read results from localStorage:', err);
    return [];
  }
}

/**
 * Retrieves recent game results.
 * @param {number} [limit=5]
 * @returns {Array<Object>}
 */
export function getRecentResults(limit = 5) {
  const all = getResults();
  return all.slice(0, limit);
}

/**
 * Saves a game result to localStorage.
 * @param {Object} result
 * @returns {boolean}
 */
export function saveResult(result) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    const record = {
      timestamp: result.timestamp || new Date().toISOString(),
      seed: result.seed,
      difficulty: result.difficulty,
      moves: result.moves,
      timeMs: result.timeMs ?? result.timeInMs ?? 0,
      pairs: result.pairs,
      nextDifficulty: result.nextDifficulty,
      reason: result.reason,
    };

    const existing = getResults();
    const updated = [record, ...existing];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.warn('Failed to save game result to localStorage:', err);
    return false;
  }
}

/**
 * Clears saved results from localStorage.
 * @returns {boolean}
 */
export function clearResults() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (err) {
    console.warn('Failed to clear results from localStorage:', err);
    return false;
  }
}

/**
 * Exports results as formatted JSON string.
 * @param {Array<Object>} [results]
 * @returns {string}
 */
export function exportResultsAsJSON(results) {
  try {
    const data = results ?? getResults();
    return JSON.stringify(data, null, 2);
  } catch (err) {
    console.warn('Failed to export results as JSON:', err);
    return '[]';
  }
}

/**
 * Triggers browser download of results JSON file.
 * @param {string} [filename='memory-game-results.json']
 * @returns {boolean}
 */
export function downloadResultsJSON(filename = 'memory-game-results.json') {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    const jsonStr = exportResultsAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.warn('Failed to trigger JSON download:', err);
    return false;
  }
}
