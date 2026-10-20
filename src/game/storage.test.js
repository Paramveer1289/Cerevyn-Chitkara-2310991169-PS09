// Unit tests for storage persistence.

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  saveResult,
  getResults,
  getRecentResults,
  clearResults,
  exportResultsAsJSON,
  STORAGE_KEY,
} from './storage.js';

describe('storage.js — Local Persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves an anonymous game result and retrieves it', () => {
    const sampleResult = {
      seed: 42,
      difficulty: 'easy',
      moves: 9,
      timeMs: 25400,
      pairs: 8,
      nextDifficulty: 'medium',
      reason: 'Fast finish! Moving up.',
    };

    const success = saveResult(sampleResult);
    expect(success).toBe(true);

    const stored = getResults();
    expect(stored).toHaveLength(1);

    const first = stored[0];
    expect(first.seed).toBe(42);
    expect(first.difficulty).toBe('easy');
    expect(first.moves).toBe(9);
    expect(first.timeMs).toBe(25400);
    expect(first.pairs).toBe(8);
    expect(first.nextDifficulty).toBe('medium');
    expect(first.reason).toBe('Fast finish! Moving up.');
    expect(typeof first.timestamp).toBe('string');
    expect(new Date(first.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('maintains recent results order (newest first) and limits to 5', () => {
    for (let i = 1; i <= 7; i++) {
      saveResult({
        seed: i * 10,
        difficulty: 'medium',
        moves: 10 + i,
        timeMs: 30000 + i * 1000,
        pairs: 8,
        nextDifficulty: 'hard',
        reason: `Game ${i}`,
      });
    }

    const all = getResults();
    expect(all).toHaveLength(7);
    expect(all[0].seed).toBe(70);

    const recent = getRecentResults(5);
    expect(recent).toHaveLength(5);
    expect(recent[0].seed).toBe(70);
    expect(recent[4].seed).toBe(30);
  });

  it('clears all results when clearResults is called', () => {
    saveResult({ seed: 1, difficulty: 'easy', moves: 10, timeMs: 20000, pairs: 8, nextDifficulty: 'medium', reason: 'Good' });
    expect(getResults()).toHaveLength(1);

    const cleared = clearResults();
    expect(cleared).toBe(true);
    expect(getResults()).toHaveLength(0);
  });

  it('exports results as valid, parseable JSON', () => {
    const sample = {
      seed: 99,
      difficulty: 'hard',
      moves: 8,
      timeMs: 18500,
      pairs: 8,
      nextDifficulty: 'hard',
      reason: 'Great performance.',
    };
    saveResult(sample);

    const jsonString = exportResultsAsJSON();
    expect(typeof jsonString).toBe('string');

    const parsed = JSON.parse(jsonString);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].seed).toBe(99);
    expect(parsed[0].timeMs).toBe(18500);
  });

  describe('localStorage error resilience (no crash)', () => {
    it('handles setItem throwing (e.g. QuotaExceededError or SecurityError) without crashing', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError: Dom storage limit reached');
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = saveResult({
        seed: 123,
        difficulty: 'easy',
        moves: 12,
        timeMs: 40000,
        pairs: 8,
        nextDifficulty: 'easy',
        reason: 'Normal',
      });

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('handles getItem throwing (e.g. SecurityError in sandboxed iframe) without crashing', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError: The operation is insecure');
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const results = getResults();
      expect(results).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('handles removeItem throwing without crashing', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const cleared = clearResults();
      expect(cleared).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('handles corrupted JSON in localStorage gracefully without crashing', () => {
      window.localStorage.setItem(STORAGE_KEY, '{ invalid-json-syntax }}}');
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const results = getResults();
      expect(results).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });
});
