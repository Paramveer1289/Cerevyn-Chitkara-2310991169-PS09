// Unit tests for useGame hook.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGame } from './useGame.js';
import { DIFFICULTY_CONFIG } from '../game/config.js';

describe('useGame hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with default state and 0 elapsed time', () => {
    const { result } = renderHook(() => useGame(42, 'easy'));

    expect(result.current.state.cards).toHaveLength(16);
    expect(result.current.state.moves).toBe(0);
    expect(result.current.state.pairs).toBe(0);
    expect(result.current.state.isWon).toBe(false);
    expect(result.current.state.difficulty).toBe('easy');
    expect(result.current.elapsedTime).toBe(0);
  });

  it('schedules setTimeout on mismatch and flips cards back after mismatchDelayMs', () => {
    const { result } = renderHook(() => useGame(42, 'easy'));

    const deck = result.current.state.cards;
    const cardA = deck[0];
    const cardB = deck.find(c => c.pairId !== cardA.pairId);

    act(() => {
      result.current.flipCard(cardA.id);
    });

    expect(result.current.state.flippedIds).toEqual([cardA.id]);

    act(() => {
      result.current.flipCard(cardB.id);
    });

    expect(result.current.state.isPending).toBe(true);
    expect(result.current.state.flippedIds).toHaveLength(2);

    const delay = DIFFICULTY_CONFIG.easy.mismatchDelayMs;
    act(() => {
      vi.advanceTimersByTime(delay - 50);
    });
    expect(result.current.state.isPending).toBe(true);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.state.isPending).toBe(false);
    expect(result.current.state.flippedIds).toHaveLength(0);
  });

  it('clears mismatch timer on restart so it does not resolve into the new game', () => {
    const { result } = renderHook(() => useGame(42, 'easy'));

    const deck = result.current.state.cards;
    const cardA = deck[0];
    const cardB = deck.find(c => c.pairId !== cardA.pairId);

    act(() => {
      result.current.flipCard(cardA.id);
      result.current.flipCard(cardB.id);
    });

    expect(result.current.state.isPending).toBe(true);

    act(() => {
      result.current.restart(999, 'medium');
    });

    expect(result.current.state.seed).toBe(999);
    expect(result.current.state.difficulty).toBe('medium');
    expect(result.current.state.isPending).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.state.isPending).toBe(false);
  });

  it('clears timeout on unmount without throwing errors', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { result, unmount } = renderHook(() => useGame(42, 'easy'));

    const deck = result.current.state.cards;
    const cardA = deck[0];
    const cardB = deck.find(c => c.pairId !== cardA.pairId);

    act(() => {
      result.current.flipCard(cardA.id);
      result.current.flipCard(cardB.id);
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
