# Learning Notes: Adaptive Memory Matching Game (PS09)

> **Audience Note**: This guide is written for a developer who understands object-oriented languages like **Java** (classes, references, methods, control flow) but is new to **JavaScript (ES6+)** and **React**. It breaks down the entire application architecture in plain, approachable English.

---

## 1. Project Overview & Data Flow

In React, the User Interface (UI) is a **pure reflection of current state**. You never directly manipulate the DOM (like modifying HTML elements with `document.getElementById`). Instead, state flows in a clean, one-way cycle:

```text
[User clicks Card #3]
        │
        ▼
[App.jsx calls flipCard(cardId)]
        │
        ▼
[useGame Hook dispatches { type: 'FLIP_CARD', payload: { cardId } }]
        │
        ▼
[gameReducer receives (currentState, action) and returns newState]
        │
        ▼
[React detects newState reference change and re-renders App.jsx]
        │
        ▼
[Card #3 is rendered face-up on screen]
```

### Java Analogy
Think of the game state as a Java immutable model (`GameState`). When an event occurs, rather than mutating private variables with setters, you pass the event to a static method `gameReducer(GameState oldState, Action action)` which instantiates and returns a brand-new `GameState` object. React sees that the reference changed and automatically redraws the screen.

---

## 2. File-by-File Walkthrough

The codebase is organized into pure logic (`src/game/`), reusable lifecycle hooks (`src/hooks/`), and view presentation (`src/App.jsx`).

### 1. [`src/game/config.js`](file:///d:/Cerevyn_project/memory-game/src/game/config.js)
- **Purpose**: Central dictionary for all static configuration constants.
- **Key Exports**:
  - `TOTAL_PAIRS = 8`: Number of unique emoji pairs (16 cards total).
  - `DIFFICULTY_CONFIG`: Lookup table mapping each level (`easy`, `medium`, `hard`) to its human-readable `label` and `mismatchDelayMs` (1200ms, 900ms, 600ms).
  - `ADAPTIVE_THRESHOLDS`: Upgrade and downgrade criteria.
  - `DIFFICULTY_ORDER`: Array `['easy', 'medium', 'hard']` used for progression indexing.
- **One thing to remember**: No "magic numbers" exist anywhere else in the project. If you want to change game balance, you edit this file and nowhere else.

### 2. [`src/game/rng.js`](file:///d:/Cerevyn_project/memory-game/src/game/rng.js)
- **Purpose**: Deterministic pseudo-random number generation and array shuffling.
- **Key Functions**:
  - `mulberry32(seed)`: Creates a closure holding a 32-bit state variable that outputs a deterministic float in `[0, 1)` upon each invocation.
  - `fisherYatesShuffle(arr, randFn)`: In-place, unbiased array shuffling algorithm running in $O(n)$ time.
- **One thing to remember**: `Math.random()` in JavaScript cannot be seeded. `mulberry32` provides mathematical determinism—the exact same seed will generate the exact same card positions every single time.

### 3. [`src/game/cards.js`](file:///d:/Cerevyn_project/memory-game/src/game/cards.js)
- **Purpose**: Constructs and shuffles the 16-card deck.
- **Key Function**:
  - `buildDeck(seed)`: Duplicates `TOTAL_PAIRS` symbols into 16 cards, shuffles them via `mulberry32(seed)`, and then assigns positional IDs `0` through `15`.
- **One thing to remember**: IDs are assigned *after* the shuffle (`card.id = index`), ensuring that `card.id` always matches the card's index in the grid array.

### 4. [`src/game/reducer.js`](file:///d:/Cerevyn_project/memory-game/src/game/reducer.js)
- **Purpose**: Pure state machine managing all rules and transitions.
- **Key Exports**:
  - Actions: `FLIP_CARD`, `RESOLVE_MISMATCH`, `RESTART`.
  - `createInitialState(seed, difficulty)`: Factory function returning a clean state.
  - `gameReducer(state, action)`: Pure reducer evaluating guards and returning updated state.
- **One thing to remember**: The reducer is **100% pure**. It never executes side effects, never calls `setTimeout`, and never touches the DOM.

### 5. [`src/game/difficulty.js`](file:///d:/Cerevyn_project/memory-game/src/game/difficulty.js)
- **Purpose**: Performance-driven adaptation engine.
- **Key Function**:
  - `suggestDifficulty(moves, timeSeconds, currentLevel)`: Evaluates moves and time against `ADAPTIVE_THRESHOLDS` and outputs `{ nextLevel, reason }`.
- **One thing to remember**: It handles boundary clamping (e.g., when a player on Hard qualifies for an upgrade, or on Easy qualifies for a downgrade) with specialized, encouraging feedback messages instead of generic text.

### 6. [`src/game/storage.js`](file:///d:/Cerevyn_project/memory-game/src/game/storage.js)
- **Purpose**: Client-side persistence for game history.
- **Key Functions**:
  - `getResults()`, `getRecentResults(limit=5)`, `saveResult(record)`, `clearResults()`, `exportResultsAsJSON()`, `downloadResultsJSON()`.
- **One thing to remember**: All browser `localStorage` calls are wrapped in `try/catch` blocks. If storage fails (e.g., private browsing mode, disabled cookies, or quota limits), the game logs a console warning and continues without crashing.

### 7. [`src/hooks/useTimer.js`](file:///d:/Cerevyn_project/memory-game/src/hooks/useTimer.js)
- **Purpose**: Tracks active gameplay duration with tab-visibility awareness.
- **Key Hook**:
  - `useTimer(running, gameId)`: Returns `{ seconds, ms }`.
- **One thing to remember**: It listens to the browser's `visibilitychange` event. If the user minimizes the window or switches tabs, the timer pauses and does not penalize the player.

### 8. [`src/hooks/useGame.js`](file:///d:/Cerevyn_project/memory-game/src/hooks/useGame.js)
- **Purpose**: Orchestrator hook connecting the pure reducer to asynchronous side effects.
- **Key Hook**:
  - `useGame(initialSeed, initialDifficulty)`: Owns `useReducer`, manages the `setTimeout` for mismatched card flip-back, stores the timer ID in a `useRef`, and triggers unmount cleanup.
- **One thing to remember**: It keeps the pure reducer completely separated from browser timer APIs.

### 9. [`src/App.jsx`](file:///d:/Cerevyn_project/memory-game/src/App.jsx)
- **Purpose**: Top-level UI component.
- **Key Responsibilities**:
  - Renders the dashboard (Moves, Pairs, Timer, Difficulty, Seed).
  - Renders the 4×4 card grid with accessible ARIA attributes.
  - Renders the collapsible Demo Panel for testing.
  - Displays the victory banner with adaptive recommendation.
  - Manages recent results display, JSON export, and URL query parameter synchronization (`?seed=...`).
- **One thing to remember**: Synchronizes the URL seed using `window.history.replaceState` so bookmarking or sharing a link preserves the exact board without triggering a page reload.

---

## 3. The "WHY" Behind Key Design Choices

### 1. Why a Pure Reducer Without Timers?
- **Java Analogy**: In Java, you would never put a `Thread.sleep()` inside an immutable Domain Model or Entity class. Doing so makes unit testing painful because your tests must wait for real-world time or require complex mock schedulers.
- **In this project**: By keeping `gameReducer` pure, we tested 62 complex board permutations in `game.test.js` in under **30 milliseconds**. The asynchronous timer is treated as a separate UI side effect inside `useGame.js`.

### 2. Why a Seeded Shuffle (`mulberry32` + Fisher-Yates)?
- Standard `Math.random()` cannot be seeded in JavaScript. If a user encounters a bug, you cannot reproduce it.
- With Mulberry32, seed `42` **always** puts 🐻 at Index 0 and 9, and 🐶 at Index 2 and 5. This makes automated testing, bug reproduction, and puzzle sharing trivial.

### 3. Why the `TOTAL_PAIRS = 8` Constant?
- Eliminates magic numbers. In memory games, 8 pairs means 16 cards (a 4×4 grid). If `TOTAL_PAIRS` were hardcoded as the number `8` in `reducer.js`, `cards.js`, and `App.jsx`, changing the game to a 3×4 or 6×6 grid in the future would require hunting down every occurrence of `8`. Now it is defined in one place in `config.js`.

### 4. Why the Incremental `gameId` Counter?
- In `reducer.js`: `gameId: `${seed}-${++gameCounter}``.
- If a player restarts the game with the **same seed**, `seed` alone is not unique. If we used `Date.now()`, two restarts triggered in the same millisecond (e.g. during rapid automated unit tests) could share an ID. A module-level counter guarantees that every single game round in the application's lifecycle has a globally unique ID.

### 5. Why AND for Upgrade, but OR for Downgrade (Dead-Band)?
- **Upgrade gate**: `moves <= 10` **AND** `time <= 40s`. To level up, a player must show both efficiency and speed. Being lucky and fast with sloppy guesses does not earn promotion.
- **Downgrade gate**: `moves >= 20` **OR** `time >= 90s`. If a player is struggling on *either* dimension, the game compassionately drops difficulty to grant more inspection time.
- **Dead-Band**: Between 11–19 moves and 41–89 seconds, difficulty remains unchanged. Without this buffer zone, a player's level would oscillate chaotically back and forth every round.

### 6. Why `try/catch` Around `localStorage`?
- In Java, file I/O throws checked exceptions (`IOException`). In JavaScript, `localStorage.setItem()` throws unchecked DOM exceptions (`QuotaExceededError` if the disk is full, or `SecurityError` if running inside a restricted iframe or privacy-hardened browser).
- Wrapping every call in `try/catch` ensures that a storage error prints a harmless warning rather than crashing the game interface.

---

## 4. How Seeded Shuffle Works (Step-by-Step)

Suppose we have an array of 4 items: `['🐶', '🐶', '🐱', '🐱']` (length = 4).

1. **Seeding Mulberry32**:
   - `let s = seed >>> 0;` (forces the seed to an unsigned 32-bit integer).
   - Calling `rand()` performs bit shifts and integer multiplications (`Math.imul`), returning a pseudo-random floating-point number between `0.0` (inclusive) and `1.0` (exclusive).

2. **Fisher-Yates Loop**:
   The algorithm counts down from the last index (`i = 3`) to index `1`:
   - **Step 1 (`i = 3`)**:
     - `randFn()` returns `0.25`.
     - `j = Math.floor(0.25 * (3 + 1)) = Math.floor(1.0) = 1`.
     - Swap elements at index 3 and index 1.
   - **Step 2 (`i = 2`)**:
     - `randFn()` returns `0.80`.
     - `j = Math.floor(0.80 * (2 + 1)) = Math.floor(2.4) = 2`.
     - Swap elements at index 2 and index 2 (stays in place).
   - **Step 3 (`i = 1`)**:
     - `randFn()` returns `0.10`.
     - `j = Math.floor(0.10 * (1 + 1)) = Math.floor(0.2) = 0`.
     - Swap elements at index 1 and index 0.

Because the PRNG sequence is mathematically fixed by the seed, this exact permutation will repeat every time that seed is supplied.

---

## 5. Restart Safety in Three Defense Layers

When dealing with asynchronous timers (`setTimeout`) in React, a classic bug occurs when a user restarts while a timer is counting down: the timer fires in the new game and flips cards from the new board!

This project employs **three independent defense layers**:

```text
[User clicks Restart during a 1200ms mismatch delay]
  │
  ├─ Layer 1: Synchronous cancellation in useGame.js
  │           clearTimeout(mismatchTimerRef.current);
  │           Result: Prevents the timer from firing if it hasn't executed yet.
  │
  ├─ Layer 2: Effect Cleanup in useGame.js
  │           useEffect cleanup function runs when dependencies change or unmount.
  │           Result: Prevents memory leaks if the component unmounts mid-game.
  │
  └─ Layer 3: gameId Guard inside gameReducer (reducer.js)
              if (action.payload.gameId !== state.gameId) return state;
              Result: Even if the callback was already queued in the browser's
                      event loop queue, the reducer sees the old gameId and
                      completely ignores the action.
```

---

## 6. How the Active Timer Works

Many beginner projects use `setInterval(() => setSeconds(s => s + 1), 1000)`. This is flawed because browser intervals **drift** over time due to CPU load and thread scheduling.

[`src/hooks/useTimer.js`](file:///d:/Cerevyn_project/memory-game/src/hooks/useTimer.js) uses **timestamp delta accumulation**:

1. **State Tracking**:
   `timerRef.current` stores two values:
   - `acc`: Total milliseconds accumulated during previous active sessions.
   - `start`: The `Date.now()` timestamp when the current active window began.
2. **Tab Visibility Pause**:
   The browser fires `document.addEventListener('visibilitychange', ...)`:
   - When the user switches tabs (`document.hidden === true`), `pause()` calculates `acc += Date.now() - start` and sets `start = null`.
   - When the user returns (`document.hidden === false`), `resume()` sets `start = Date.now()`.
3. **Smooth UI Updates**:
   A `setInterval` runs every 250ms simply to re-calculate:
   $$\text{totalMs} = \text{acc} + (\text{Date.now()} - \text{start})$$
   and updates the UI state with `Math.floor(totalMs / 1000)`.
4. **Game Reset**:
   Whenever `gameId` changes (restart), an effect resets `acc = 0` and `start = null`.
5. **Freeze on Win**:
   `isTimerRunning` is calculated as `hasStarted && !state.isWon`. Once `isWon` becomes true, the hook pauses and accumulates no further time.

---

## 7. Key React Concepts Used in This Project

| Hook / Concept | Purpose | Exact Code Location |
| :--- | :--- | :--- |
| **`useState`** | Manages local UI state that triggers re-renders on change. | - `App.jsx` line 56: `initialSeed`<br>- `App.jsx` line 60: `recentResults`<br>- `App.jsx` lines 64-66: `seedInput`, `selectedDifficulty`, `showCardFaces`<br>- `useTimer.js` lines 19-20: `elapsed`, `elapsedMs` |
| **`useReducer`** | Manages complex state transitions via pure actions (preferred over multiple `useState` calls). | `useGame.js` line 37: `const [state, dispatch] = useReducer(gameReducer, undefined, () => createInitialState(...))` |
| **`useRef`** | Holds a mutable reference that **does not trigger re-render** when updated (like a private instance variable in Java). | - `useGame.js` line 44: `mismatchTimerRef = useRef(null)` (stores timer ID)<br>- `useTimer.js` line 24: `timerRef = useRef({ acc: 0, start: null })`<br>- `App.jsx` line 61: `lastSavedGameIdRef = useRef(null)` (prevents double-saving) |
| **`useEffect` (Timer)** | Schedules side effects synchronized with state changes. | `useGame.js` lines 48–62: Schedules `RESOLVE_MISMATCH` when `state.isPending` is true. |
| **`useEffect` (Cleanup)** | Returns a teardown function to clean up timers and event listeners. | - `useGame.js` lines 58–61: `clearTimeout` on pending timer cancel<br>- `useGame.js` lines 65–69: `clearTimeout` on component unmount<br>- `useTimer.js` lines 76–82: `clearInterval` and `removeEventListener` |
| **`useMemo`** | Memoizes expensive or derived computations so they only re-run when inputs change. | `App.jsx` lines 83–86: `winSuggestion = useMemo(() => suggestDifficulty(...), [state.isWon, state.moves, elapsedTime, state.difficulty])` |

---

## 8. How to Make Common Changes

### 1. Change the Mismatch Flip-Back Delay
- **File**: [`src/game/config.js`](file:///d:/Cerevyn_project/memory-game/src/game/config.js)
- **Edit**: Modify `mismatchDelayMs` inside `DIFFICULTY_CONFIG` (e.g. change `easy: 1200` to `easy: 1500`).
- **Tests to update**: Tests in `src/game/game.test.js` or `src/App.test.jsx` that assert option label text (e.g. `"Easy (1200ms)"`).

### 2. Change Upgrade and Downgrade Thresholds
- **File**: [`src/game/config.js`](file:///d:/Cerevyn_project/memory-game/src/game/config.js)
- **Edit**: Update `ADAPTIVE_THRESHOLDS.upgrade` (`maxMoves`, `maxTimeSeconds`) or `downgrade` (`minMoves`, `minTimeSeconds`).
- **Tests to update**: `src/game/game.test.js` tests that check boundary recommendations with specific move/time numbers.

### 3. Add a New Difficulty Level (e.g., "Expert")
- **File**: [`src/game/config.js`](file:///d:/Cerevyn_project/memory-game/src/game/config.js)
- **Edit**:
  1. Add `expert: { label: 'Expert', mismatchDelayMs: 400 }` to `DIFFICULTY_CONFIG`.
  2. Add `'expert'` to `DIFFICULTY_ORDER` array: `['easy', 'medium', 'hard', 'expert']`.
- **Tests to update**: `src/game/game.test.js` (clamping tests for highest level) and `src/App.test.jsx`.

### 4. Change the Number of Pairs (e.g., to 6 pairs for a 12-card game)
- **File**: [`src/game/config.js`](file:///d:/Cerevyn_project/memory-game/src/game/config.js)
- **Edit**: Change `TOTAL_PAIRS = 6`.
- **Tests to update**: `src/game/game.test.js` (win condition tests expecting 8 pairs will now expect 6) and `src/App.test.jsx`.

### 5. Make a Mismatch Count as 2 Moves
- **File**: [`src/game/reducer.js`](file:///d:/Cerevyn_project/memory-game/src/game/reducer.js)
- **Edit**: In `FLIP_CARD` under the `else` branch (mismatch), set `moves: state.moves + 2`.
- **Tests to update**: `src/game/game.test.js` tests verifying move incrementing on mismatch.

### 6. Show the Player's Best Score (Personal Best)
- **File**: [`src/App.jsx`](file:///d:/Cerevyn_project/memory-game/src/App.jsx)
- **Edit**: Use `getResults()` from `src/game/storage.js`, compute `Math.min(...results.map(r => r.moves))`, and render it in the dashboard stats grid.

### 7. Limit Saved Results to Latest 10
- **File**: [`src/App.jsx`](file:///d:/Cerevyn_project/memory-game/src/App.jsx)
- **Edit**: Change `getRecentResults(5)` calls to `getRecentResults(10)`.
- **Tests to update**: `src/App.test.jsx` test asserting recent results list length.

### 8. Change the Grid Layout Columns
- **File**: [`src/App.css`](file:///d:/Cerevyn_project/memory-game/src/App.css)
- **Edit**: In `.cards-grid`, update `grid-template-columns: repeat(4, 1fr);` to your desired column count.

---

## 9. 20 Likely Interview Questions & Model Answers

### Q1: Why did you use a reducer instead of multiple `useState` calls?
> **Answer**: A memory game has tightly coupled state transitions. Flipping a card simultaneously affects `cards`, `flippedIds`, `moves`, `pairs`, `isPending`, and `isWon`. Managing these in separate `useState` hooks risks desynchronized state and race conditions. A reducer centralizes all state transitions into atomic, predictable actions.

### Q2: What is the purpose of `isPending` in the game state?
> **Answer**: `isPending` acts as an input mutex lock. When two mismatched cards are flipped, they remain visible briefly. `isPending` is set to `true`, blocking any 3rd card click until the mismatch timer fires, preventing board state corruption.

### Q3: Why does `RESOLVE_MISMATCH` require a `gameId` in its payload?
> **Answer**: It prevents stale timer callbacks. If a player triggers a mismatch and immediately hits Restart, the pending timeout callback might still fire. By comparing `action.payload.gameId !== state.gameId`, the reducer safely ignores callbacks originating from abandoned games.

### Q4: What is the difference between `useRef` and `useState` in this project?
> **Answer**: `useState` triggers a component re-render whenever its value changes (used for `recentResults` or `seedInput`). `useRef` persists mutable data across renders **without** causing a re-render. We use `useRef` for `mismatchTimerRef` and `lastSavedGameIdRef` because updating a timer ID should not trigger visual re-renders.

### Q5: Why are cleanup functions important in `useEffect`?
> **Answer**: Without cleanup functions, active intervals and timeouts continue running even after a component unmounts or state changes, leading to memory leaks and attempts to update unmounted component state.

### Q6: How does the game pause when switching browser tabs?
> **Answer**: `useTimer.js` binds an event listener to the HTML5 Page Visibility API (`visibilitychange`). When `document.hidden` becomes `true`, the timer calculates the elapsed duration up to that millisecond, pauses accumulation, and sets the active start timestamp to `null`.

### Q7: Why did you choose Mulberry32 over JavaScript's built-in `Math.random()`?
> **Answer**: `Math.random()` is non-deterministic and cannot accept a seed. Mulberry32 is a fast 32-bit PRNG that produces the exact same card layout for a given seed, enabling reproducible automated tests, debug workflows, and shareable puzzle links.

### Q8: What makes the Fisher-Yates shuffle superior to `arr.sort(() => Math.random() - 0.5)`?
> **Answer**: `arr.sort()` with random comparator does not produce a uniform distribution—certain permutations have higher statistical probability. Fisher-Yates guarantees an unbiased, uniformly random permutation in $O(n)$ time and $O(1)$ extra space.

### Q9: Why did you wrap `localStorage` access in `try/catch`?
> **Answer**: `localStorage` throws runtime exceptions in private browsing mode, restricted iframes, or when storage quotas are exceeded. Wrapping it in `try/catch` guarantees that a storage failure never crashes the application.

### Q10: How does the adaptive difficulty algorithm prevent rapid oscillation between levels?
> **Answer**: It implements an intentional "dead-band" between the upgrade criteria (`moves <= 10` AND `time <= 40s`) and downgrade criteria (`moves >= 20` OR `time >= 90s`). Moderate scores between these thresholds maintain the current difficulty.

### Q11: Why are card IDs assigned after the shuffle rather than before?
> **Answer**: In `cards.js`, assigning IDs post-shuffle ensures `card.id === gridIndex`. This allows $O(1)$ direct array index access when handling card clicks without needing to search the deck.

### Q12: How would you add a backend leaderboard to this application?
> **Answer**: I would create an Azure Function (or Node/Express API) backed by Cosmos DB or Azure SQL. When `state.isWon` triggers, the app would issue an authenticated `POST /api/scores` with `seed`, `moves`, and `timeMs`. A public `GET /api/leaderboard?seed=42` would fetch top rankings.

### Q13: How would you prevent score tampering if a backend leaderboard existed?
> **Answer**: The client would send the initial seed and an array of move timestamps: `[{ cardId, timestamp }, ...]`. The server would re-run the pure reducer with the seed to verify that the moves genuinely result in a win matching the reported score.

### Q14: How does `useMemo` optimize the victory screen?
> **Answer**: In `App.jsx`, `winSuggestion` is wrapped in `useMemo`. It only recalculates `suggestDifficulty` when `isWon`, `moves`, `elapsedTime`, or `difficulty` change, avoiding redundant evaluations during intermediate renders.

### Q15: Why is `useGame` separated from `App.jsx`?
> **Answer**: Separation of concerns. `useGame` encapsulates the state machine and timer side-effects, presenting a clean interface (`state`, `flipCard`, `restart`). `App.jsx` focuses solely on presentation and DOM rendering.

### Q16: How does the application support deep linking for specific game puzzles?
> **Answer**: In `App.jsx`, `getInitialSeed()` checks `window.location.search` for `?seed=...`. When present, that integer initializes the board. `syncUrlSeed()` updates the URL via `window.history.replaceState` without reloading.

### Q17: What role does ARIA play in the card grid?
> **Answer**: Every card button includes an `aria-label` announcing its index and state (e.g. `"Card 3: 🐶, matched"` or `"Card 1: hidden"`) and `aria-pressed` for flipped status, ensuring screen readers can navigate the board.

### Q18: What is the CI/CD strategy for this project?
> **Answer**: A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request. It checks out code on Node 20, runs `npm ci`, executes all 84 Vitest tests with `npm test -- --run`, and builds the bundle via `npm run build`.

### Q19: How would you deploy this to Azure?
> **Answer**: Via Azure Static Web Apps. The GitHub Action builds the production bundle into `/dist` and uses `Azure/static-web-apps-deploy@v1` to publish assets to Azure's edge CDN with automated SSL and staging PR environments.

### Q20: Why plain JavaScript instead of TypeScript?
> **Answer**: Plain JavaScript with Vite eliminates build-step friction and compilation overhead while remaining natively runnable. Type contracts and data structures (`GameState`, `Card`) are fully documented with JSDoc, providing IDE type hints and safety without extra tooling complexity.

---

## 10. Things I Would Improve With More Time

1. **Sub-Second Timer Precision**:
   The active timer UI updates every 250ms, meaning displayed seconds can lag millisecond precision slightly. I would expose a millisecond stopwatch mode for speedrunners.
2. **3D Card Flip Animations**:
   Add CSS 3D perspective transforms (`transform: rotateY(180deg)`) with smooth easing for realistic card-flipping visuals.
3. **Sound Effects & Audio Feedback**:
   Add subtle, synthesized Web Audio API sounds for card flips, successful matches, mismatches, and victory fanfare.
4. **Keyboard Navigation**:
   Implement arrow-key grid navigation (Up/Down/Left/Right) with Enter/Space to flip, improving accessibility for motor-impaired players.
5. **Global Online Leaderboard**:
   Connect an Azure Serverless Function to store daily high scores per seed.
