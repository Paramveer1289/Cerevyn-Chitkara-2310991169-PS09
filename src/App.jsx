// Main application component.

import { useMemo, useState, useEffect, useRef } from 'react';
import './App.css';
import { useGame } from './hooks/useGame.js';
import { suggestDifficulty } from './game/difficulty.js';
import { DIFFICULTY_CONFIG, DIFFICULTY_ORDER, TOTAL_PAIRS } from './game/config.js';
import {
  saveResult,
  getRecentResults,
  clearResults,
  downloadResultsJSON,
} from './game/storage.js';

// Extract URL seed or random
function getInitialSeed() {
  if (typeof window !== 'undefined' && window.location?.search) {
    const params = new URLSearchParams(window.location.search);
    const paramSeed = params.get('seed');
    if (paramSeed !== null && paramSeed.trim() !== '') {
      const parsed = parseInt(paramSeed, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return Math.floor(Math.random() * 1000000);
}

// Update URL seed parameter
function syncUrlSeed(seed) {
  if (typeof window !== 'undefined' && window.history?.replaceState && window.location) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('seed', seed.toString());
      window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
    } catch {
      // Ignore in restricted environments
    }
  }
}

// Format seconds into m:ss
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function App() {
  // Game and demo state
  const [initialSeed] = useState(getInitialSeed);
  const { state, flipCard, restart, elapsedTime, elapsedMs } = useGame(initialSeed);

  const [recentResults, setRecentResults] = useState(() => getRecentResults(5));
  const lastSavedGameIdRef = useRef(null);

  const [seedInput, setSeedInput] = useState(() => state.seed.toString());
  const [selectedDifficulty, setSelectedDifficulty] = useState(() => state.difficulty);
  const [showCardFaces, setShowCardFaces] = useState(false);

  // Sync demo inputs with state
  useEffect(() => {
    setSeedInput(state.seed.toString());
  }, [state.seed]);

  useEffect(() => {
    setSelectedDifficulty(state.difficulty);
  }, [state.difficulty]);

  // Sync URL with active seed
  useEffect(() => {
    syncUrlSeed(state.seed);
  }, [state.seed]);

  // Suggest next difficulty on win
  const winSuggestion = useMemo(() => {
    if (!state.isWon) return null;
    return suggestDifficulty(state.moves, elapsedTime, state.difficulty);
  }, [state.isWon, state.moves, elapsedTime, state.difficulty]);

  // Save result on win
  useEffect(() => {
    if (state.isWon && winSuggestion && lastSavedGameIdRef.current !== state.gameId) {
      lastSavedGameIdRef.current = state.gameId;
      const record = {
        timestamp: new Date().toISOString(),
        seed: state.seed,
        difficulty: state.difficulty,
        moves: state.moves,
        timeMs: elapsedMs || elapsedTime * 1000,
        pairs: state.pairs,
        nextDifficulty: winSuggestion.nextLevel,
        reason: winSuggestion.reason,
      };
      saveResult(record);
      setRecentResults(getRecentResults(5));
    }
  }, [
    state.isWon,
    state.gameId,
    winSuggestion,
    elapsedTime,
    elapsedMs,
    state.seed,
    state.difficulty,
    state.moves,
    state.pairs,
  ]);

  // Restart and clear handlers
  function handleRestart(newSeed, targetDifficulty) {
    const seed = newSeed ?? Math.floor(Math.random() * 1000000);
    const diff = targetDifficulty ?? state.difficulty;
    syncUrlSeed(seed);
    restart(seed, diff);
  }

  function handleClearResults() {
    clearResults();
    setRecentResults([]);
  }

  return (
    <main className="game-container">
      {/* Header */}
      <header className="game-header">
        <h1 className="game-title">Memory Game</h1>
        <p className="game-subtitle">Find all {TOTAL_PAIRS} matching pairs of emoji!</p>
      </header>

      {/* Dashboard stats and controls */}
      <section className="dashboard" aria-label="Game stats and controls">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Moves</span>
            <span className="stat-value">{state.moves}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Pairs</span>
            <span className="stat-value">{state.pairs} / {TOTAL_PAIRS}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Timer</span>
            <span className="stat-value">{formatTime(elapsedTime)}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Difficulty</span>
            <span className="stat-value">
              <span className="difficulty-badge">
                {DIFFICULTY_CONFIG[state.difficulty]?.label ?? state.difficulty}
              </span>
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Seed</span>
            <span className="stat-value">
              <code className="seed-tag">{state.seed}</code>
            </span>
          </div>
        </div>

        <div className="dashboard-controls">
          <span className="seed-info">
            URL seed: <code>?seed={state.seed}</code>
          </span>
          <button
            type="button"
            className="btn-restart"
            onClick={() => handleRestart()}
            aria-label="Restart game with new seed"
          >
            🔄 Restart
          </button>
        </div>
      </section>

      {/* Collapsible demo panel */}
      <details className="demo-panel" aria-label="Demo controls">
        <summary className="demo-summary">🛠️ Demo panel</summary>
        <div className="demo-content">
          <div className="demo-field">
            <label htmlFor="demo-seed">Seed:</label>
            <input
              id="demo-seed"
              type="number"
              className="demo-input"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="e.g. 42"
            />
            <button
              type="button"
              className="demo-btn"
              onClick={() => {
                const parsed = parseInt(seedInput, 10);
                if (!Number.isNaN(parsed)) {
                  handleRestart(parsed, selectedDifficulty);
                }
              }}
            >
              Apply Seed
            </button>
          </div>

          <div className="demo-field">
            <label htmlFor="demo-difficulty">Difficulty:</label>
            <select
              id="demo-difficulty"
              className="demo-select"
              value={selectedDifficulty}
              onChange={(e) => {
                const nextDiff = e.target.value;
                setSelectedDifficulty(nextDiff);
                handleRestart(state.seed, nextDiff);
              }}
            >
              {DIFFICULTY_ORDER.map((diffKey) => {
                const conf = DIFFICULTY_CONFIG[diffKey];
                return (
                  <option key={diffKey} value={diffKey}>
                    {conf.label} ({conf.mismatchDelayMs}ms)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="demo-field demo-checkbox-field">
            <label className="demo-checkbox-label" htmlFor="demo-show-faces">
              <input
                id="demo-show-faces"
                type="checkbox"
                checked={showCardFaces}
                onChange={(e) => setShowCardFaces(e.target.checked)}
              />
              Show card faces (debug peek)
            </label>
          </div>
        </div>
      </details>

      {/* Victory summary banner */}
      {state.isWon && winSuggestion && (
        <section className="win-banner" aria-live="polite" aria-label="Victory summary">
          <h2 className="win-title">🎉 You Won!</h2>
          <p className="win-stats">
            Completed in <strong>{state.moves} moves</strong> and <strong>{formatTime(elapsedTime)}</strong> ({elapsedTime}s).
          </p>

          <div className="win-recommendation">
            <div className="recommendation-header">
              <span className="recommendation-label">Next Difficulty:</span>
              <span className="difficulty-badge">
                {DIFFICULTY_CONFIG[winSuggestion.nextLevel]?.label ?? winSuggestion.nextLevel}
              </span>
            </div>
            <p className="recommendation-reason">{winSuggestion.reason}</p>
          </div>

          <div className="win-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleRestart(undefined, winSuggestion.nextLevel)}
            >
              Continue ({DIFFICULTY_CONFIG[winSuggestion.nextLevel]?.label ?? winSuggestion.nextLevel})
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleRestart()}
            >
              Play Again
            </button>
          </div>
        </section>
      )}

      {/* 4x4 cards grid */}
      <section className="cards-grid" aria-label="Memory cards grid">
        {state.cards.map((card, index) => {
          const isRevealed = card.isFlipped || card.isMatched;
          const isVisible = isRevealed || showCardFaces;
          const statusText = card.isMatched
            ? `${card.symbol}, matched`
            : card.isFlipped
            ? card.symbol
            : showCardFaces
            ? `${card.symbol}, peeked`
            : 'hidden';

          return (
            <button
              key={card.id}
              type="button"
              className={`card-btn ${
                card.isMatched
                  ? 'card-matched'
                  : card.isFlipped
                  ? 'card-flipped'
                  : showCardFaces
                  ? 'card-peek'
                  : 'card-hidden'
              }`}
              onClick={() => flipCard(card.id)}
              disabled={card.isMatched}
              aria-label={`Card ${index + 1}: ${statusText}`}
              aria-pressed={isRevealed}
            >
              {isVisible ? card.symbol : ''}
            </button>
          );
        })}
      </section>

      {/* Recent results section */}
      <section className="recent-results" aria-label="Recent results section">
        <div className="recent-results-header">
          <h3 className="recent-results-title">Recent results</h3>
          <div className="recent-results-actions">
            <button
              type="button"
              className="btn-export"
              onClick={() => downloadResultsJSON()}
              aria-label="Export results as JSON"
            >
              Export results as JSON
            </button>
            <button
              type="button"
              className="btn-clear"
              onClick={handleClearResults}
              aria-label="Clear saved results"
            >
              Clear saved results
            </button>
          </div>
        </div>

        {recentResults.length === 0 ? (
          <p className="no-results">No saved results yet. Win a game to see your results here!</p>
        ) : (
          <ul className="results-list" aria-label="List of recent games">
            {recentResults.map((r, i) => (
              <li key={`${r.timestamp}-${i}`} className="result-item">
                <div className="result-summary">
                  <span className="result-difficulty-badge">{r.difficulty}</span>
                  <span className="result-stats-text">
                    <strong>{r.moves} moves</strong> • {(r.timeMs / 1000).toFixed(1)}s • Seed: <code>{r.seed}</code>
                  </span>
                  <span className="result-next">
                    Next: <strong>{r.nextDifficulty}</strong>
                  </span>
                </div>
                {r.reason && <p className="result-reason">{r.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Instructions */}
      <section className="instructions" aria-label="Game instructions">
        <h3 className="instructions-title">How to Play</h3>
        <ol className="instructions-list">
          <li>Click any card to flip it face up, then click a second card to find its match.</li>
          <li>Matching pairs remain face-up. Mismatched cards flip back after a brief delay.</li>
          <li>Match all {TOTAL_PAIRS} pairs to win the game!</li>
          <li>The active timer starts on your first flip and automatically pauses if you switch tabs.</li>
          <li>Difficulty adapts dynamically when you finish: faster runs level up, while challenging rounds provide more time.</li>
          <li>You can share or bookmark any game layout using the <code>?seed=...</code> URL parameter.</li>
        </ol>
      </section>
    </main>
  );
}
