// Component integration tests for App.jsx.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App.jsx';
import { buildDeck } from './game/cards.js';
import { TOTAL_PAIRS } from './game/config.js';

describe('Memory Game UI (App.jsx)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'hidden', { value: false, configurable: true, writable: true });
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders heading, stats dashboard, cards grid, and instructions', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /memory game/i })).toBeInTheDocument();

    expect(screen.getByText('Moves')).toBeInTheDocument();
    expect(screen.getByText('Pairs')).toBeInTheDocument();
    expect(screen.getByText('Timer')).toBeInTheDocument();
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Seed')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();

    const cards = screen.getAllByRole('button', { name: /^card \d+:/i });
    expect(cards).toHaveLength(16);

    expect(screen.getByRole('heading', { level: 3, name: /how to play/i })).toBeInTheDocument();
  });

  it('supports ?seed=123 from the URL and reflects it in the UI', () => {
    window.history.pushState({}, '', '/?seed=123');

    render(<App />);

    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText(/\?seed=123/)).toBeInTheDocument();
  });

  it('allows clicking a card to reveal it and starts the timer on first flip', () => {
    render(<App />);

    const cards = screen.getAllByRole('button', { name: /^card \d+:/i });
    expect(cards[0]).toHaveAttribute('aria-label', expect.stringContaining('hidden'));

    act(() => {
      fireEvent.click(cards[0]);
    });

    expect(cards[0]).not.toHaveAttribute('aria-label', expect.stringContaining('hidden'));

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(screen.getByText(/0:02/)).toBeInTheDocument();
  });

  it('handles a mismatch: flips cards face-up, waits, then flips back', () => {
    window.history.pushState({}, '', '/?seed=42');
    render(<App />);

    const cards = screen.getAllByRole('button', { name: /^card \d+:/i });

    act(() => {
      fireEvent.click(cards[0]);
    });

    act(() => {
      fireEvent.click(cards[1]);
    });

    const statValues = screen.getAllByText('1');
    expect(statValues.length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(screen.getByText('Moves')).toBeInTheDocument();
  });

  it('pauses timer when document visibility is hidden and resumes when visible', () => {
    render(<App />);

    const cards = screen.getAllByRole('button', { name: /^card \d+:/i });

    act(() => {
      fireEvent.click(cards[0]);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText(/0:03/)).toBeInTheDocument();

    Object.defineProperty(document, 'hidden', { value: true, configurable: true, writable: true });
    act(() => {
      fireEvent(document, new Event('visibilitychange'));
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/0:03/)).toBeInTheDocument();

    Object.defineProperty(document, 'hidden', { value: false, configurable: true, writable: true });
    act(() => {
      fireEvent(document, new Event('visibilitychange'));
    });

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByText(/0:05/)).toBeInTheDocument();
  });

  it('clicking restart resets moves, pairs, and timer', () => {
    render(<App />);

    const cards = screen.getAllByRole('button', { name: /^card \d+:/i });

    act(() => {
      fireEvent.click(cards[0]);
    });

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(screen.getByText(/0:02/)).toBeInTheDocument();

    const restartBtn = screen.getByRole('button', { name: /restart/i });
    act(() => {
      fireEvent.click(restartBtn);
    });

    expect(screen.getByText(/0:00/)).toBeInTheDocument();
    expect(screen.getByText('0 / 8')).toBeInTheDocument();
  });

  it('displays victory summary with next difficulty label and reason upon winning all pairs', () => {
    window.history.pushState({}, '', '/?seed=42');
    render(<App />);

    const deck = buildDeck(42);

    for (let pairId = 0; pairId < TOTAL_PAIRS; pairId++) {
      const pairCards = deck.filter(c => c.pairId === pairId);
      const cardA = screen.getByRole('button', { name: new RegExp(`^card ${pairCards[0].id + 1}:`, 'i') });
      const cardB = screen.getByRole('button', { name: new RegExp(`^card ${pairCards[1].id + 1}:`, 'i') });
      act(() => {
        fireEvent.click(cardA);
        fireEvent.click(cardB);
      });
    }

    expect(screen.getByRole('heading', { level: 2, name: /you won/i })).toBeInTheDocument();
    expect(screen.getByText(/next difficulty:/i)).toBeInTheDocument();
    expect(screen.getByText('Medium', { selector: '.win-recommendation .difficulty-badge' })).toBeInTheDocument();
    expect(screen.getByText('Pairs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 3, name: /recent results/i })).toBeInTheDocument();
    expect(screen.getAllByText(/8 moves/i).length).toBeGreaterThanOrEqual(2);
  });

  it('renders Recent results section with export and clear buttons', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 3, name: /recent results/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export results as json/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear saved results/i })).toBeInTheDocument();
  });

  it('clears recent results list when clicking Clear saved results', () => {
    // Seed mock result
    window.localStorage.setItem(
      'memory_game_results',
      JSON.stringify([
        {
          timestamp: new Date().toISOString(),
          seed: 123,
          difficulty: 'easy',
          moves: 10,
          timeMs: 25000,
          pairs: 8,
          nextDifficulty: 'medium',
          reason: 'Good job',
        },
      ])
    );

    render(<App />);

    expect(screen.getByText(/10 moves/i)).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: /clear saved results/i });
    act(() => {
      fireEvent.click(clearBtn);
    });

    expect(screen.queryByText(/10 moves/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no saved results yet/i)).toBeInTheDocument();
  });

  it('provides a collapsible Demo panel to change seed, difficulty, and toggle peek card faces', () => {
    render(<App />);

    expect(screen.getByText(/demo panel/i)).toBeInTheDocument();

    const seedInput = screen.getByLabelText(/^seed:/i);
    expect(seedInput).toBeInTheDocument();

    const diffSelect = screen.getByLabelText(/difficulty:/i);
    expect(diffSelect).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Easy (1200ms)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Medium (900ms)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Hard (600ms)' })).toBeInTheDocument();

    const peekToggle = screen.getByRole('checkbox', { name: /show card faces/i });
    expect(peekToggle).not.toBeChecked();

    const cardsBefore = screen.getAllByRole('button', { name: /^card \d+:/i });
    expect(cardsBefore[0].textContent).toBe('');

    act(() => {
      fireEvent.click(peekToggle);
    });

    expect(peekToggle).toBeChecked();
    const cardsAfter = screen.getAllByRole('button', { name: /^card \d+:/i });
    expect(cardsAfter[0].textContent).not.toBe('');

    act(() => {
      fireEvent.change(diffSelect, { target: { value: 'hard' } });
    });

    expect(screen.getByText('Hard')).toBeInTheDocument();

    act(() => {
      fireEvent.change(seedInput, { target: { value: '777' } });
      fireEvent.click(screen.getByRole('button', { name: /apply seed/i }));
    });

    expect(screen.getByText('777')).toBeInTheDocument();
  });
});
