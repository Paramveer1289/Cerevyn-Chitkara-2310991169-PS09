# Adaptive Memory Matching Game (PS09), Cerevyn x Chitkara University Round 1 Technical Assessment

**Candidate:** Paramveer Singh | **Roll number:** 2310991169 | **Branch:** CSE | **Problem ID:** PS09  
**Demo video:** https://youtu.be/jJq8zN9PetM

---

## 1. Problem Summary & Overview

The **Adaptive Memory Matching Game** is a client-side web application built with React, Vite, and pure JavaScript. The objective is to discover and match all 8 pairs of hidden emoji cards on a 4×4 grid in the fewest moves and least time possible.

Beyond classical memory matching, the application features:
- **Deterministic Shuffling**: Every game board is generated using a seeded pseudo-random number generator (Mulberry32) combined with Fisher-Yates shuffling, ensuring 100% reproducible card layouts via seed values or shareable URL parameters (`?seed=...`).
- **Active Time Tracking with Tab Pause**: Elapsed time measures active gameplay only, pausing automatically via the HTML5 Page Visibility API when the player switches browser tabs.
- **Rule-Based Adaptive Difficulty**: Rather than static difficulty, the system analyzes player performance (moves made and active seconds elapsed) against calibrated thresholds upon victory, recommending a level upgrade, downgrade, or maintenance with clear, plain-language explanations.
- **Robustness & Crash-Resilience**: State transitions are managed by a pure reducer with strict input locks and `gameId` guards that prevent race conditions, rapid-click board corruptions, and stale timer callbacks. Anonymous results are persisted safely to `localStorage` with JSON export and reset capabilities.

---

## 2. Features Mapped to Assessment Requirements

| Requirement | Implementation Details |
| :--- | :--- |
| **4×4 Grid & TOTAL_PAIRS Pairs** | 16 cards total displaying 8 distinct animal emoji pairs (`TOTAL_PAIRS = 8` in `config.js`). |
| **Seeded Deterministic Shuffle** | `mulberry32` PRNG + in-place `fisherYatesShuffle` in `src/game/rng.js`. Same seed guarantees identical card order. |
| **Input Lock on Pending Mismatch** | `isPending` state flag blocks third card clicks while two mismatched cards are face-up. |
| **Click Safeguards** | Clicks on already-matched cards or on the currently face-up card are ignored without penalty. |
| **Moves, Pairs, & Active Timer** | Dashboard displays pair attempts, matched pairs (`x / 8`), elapsed time (`m:ss`), difficulty badge, and seed. |
| **Tab-Hidden Pause** | `useTimer` hook listens to `visibilitychange`; accumulated active time halts when the tab is blurred or hidden. |
| **3 Difficulty Levels** | **Easy** (1200ms delay), **Medium** (900ms delay), and **Hard** (600ms delay). |
| **Adaptive Next Level with Reason** | `suggestDifficulty` evaluates moves and time against dual-threshold rules and returns next difficulty + rationale. |
| **Safe Storage & JSON Export** | Anonymous session history stored in `localStorage` inside `try/catch`. Includes last-5 list, "Export JSON", and "Clear". |
| **Restart Safety** | Active timeout is cleared on restart, effect cleanups run on unmount, and a `gameId` guard ignores stale timer dispatches. |
| **Collapsible Demo Panel** | Interactive testing panel with custom seed input, difficulty switcher, and a debug card-peek toggle. |

---

## 3. Architecture & File Structure

The project separates pure business logic (`src/game/`), reusable React hooks (`src/hooks/`), and presentation components (`src/App.jsx`).

| File | Type | Purpose & Responsibilities |
| :--- | :--- | :--- |
| [`src/game/config.js`](file:///d:/Cerevyn_project/memory-game/src/game/config.js) | Pure Config | Defines `TOTAL_PAIRS` (8), `DIFFICULTY_CONFIG` (mismatch delays & labels), `ADAPTIVE_THRESHOLDS` (moves/time gates), and `DIFFICULTY_ORDER`. |
| [`src/game/rng.js`](file:///d:/Cerevyn_project/memory-game/src/game/rng.js) | Pure Math | Implements `mulberry32(seed)` 32-bit PRNG and `fisherYatesShuffle(arr, randFn)` for uniform, deterministic permutations. |
| [`src/game/cards.js`](file:///d:/Cerevyn_project/memory-game/src/game/cards.js) | Pure Domain | Exports `buildDeck(seed)` which creates 16 cards (8 pairs of emoji), shuffles with PRNG, and assigns stable positional IDs (`0`–`15`). |
| [`src/game/reducer.js`](file:///d:/Cerevyn_project/memory-game/src/game/reducer.js) | Pure Reducer | Handles `FLIP_CARD`, `RESOLVE_MISMATCH`, and `RESTART` actions. Enforces guards, updates moves/pairs, flags win, and attaches `gameId`. |
| [`src/game/difficulty.js`](file:///d:/Cerevyn_project/memory-game/src/game/difficulty.js) | Pure Logic | Implements `suggestDifficulty(moves, timeSeconds, currentLevel)` to recommend difficulty transitions with human-readable reasons. |
| [`src/game/storage.js`](file:///d:/Cerevyn_project/memory-game/src/game/storage.js) | Pure Storage | Crash-resilient wrapper around browser `localStorage` (`getResults`, `saveResult`, `clearResults`, `exportResultsAsJSON`, `downloadResultsJSON`). |
| [`src/hooks/useGame.js`](file:///d:/Cerevyn_project/memory-game/src/hooks/useGame.js) | React Hook | Connects `gameReducer` to React; manages `setTimeout` for mismatch resolution via `useRef`; handles cleanup on restart and unmount. |
| [`src/hooks/useTimer.js`](file:///d:/Cerevyn_project/memory-game/src/hooks/useTimer.js) | React Hook | Tracks elapsed active milliseconds/seconds; pauses on document visibility change; ticks at 250ms intervals; resets on new `gameId`. |
| [`src/App.jsx`](file:///d:/Cerevyn_project/memory-game/src/App.jsx) | UI Component | Orchestrates header, dashboard metrics, 4×4 card grid, collapsible demo panel, victory banner, recent results table, and URL seed sync. |

---

## 4. Setup, Run, Test, and Build Commands

### Prerequisites
- **Node.js**: v20+ recommended (verified on Node v20.17.0)
- **npm**: v10+

### Commands

```bash
# 1. Install dependencies
npm install

# 2. Start local development server with Hot Module Replacement (HMR)
npm run dev

# 3. Run all unit and integration tests (Vitest)
npm test -- --run

# 4. Create an optimized production build in /dist
npm run build
```

---

## 5. Dependency Versions

Exact versions pinned in [`package.json`](file:///d:/Cerevyn_project/memory-game/package.json):

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "vite": "^5.4.11",
    "vitest": "^2.1.9"
  }
}
```

### Automated Test Suite Status
Running `npm test -- --run` executes **84 automated tests across 4 test suites with 100% passing**:
- `src/game/game.test.js`: **62 tests** (deterministic shuffle, reducer rules, guards, win detection, adaptive difficulty transitions and boundaries)
- `src/game/storage.test.js`: **8 tests** (storage saving, recent results slicing, JSON export formatting, safe error handling on quota/security failure)
- `src/hooks/useGame.test.js`: **4 tests** (hook initialization, card flip dispatch, mismatch auto-resolution timing, restart reset)
- `src/App.test.jsx`: **10 tests** (full UI rendering, card flipping, victory banner presentation, demo panel toggles, recent results interaction)

---

## 6. Demo Panel: How to Demonstrate Core Scenarios

The collapsible **Demo panel** (`<details className="demo-panel">`) provides controls to demonstrate key behaviors quickly during review or video recording:

1. **Demonstrating a Match**:
   - Set **Seed** to `42` and click **Apply Seed**.
   - Check **Show card faces (debug peek)** to reveal all card positions.
   - For seed `42`, **Card 3** (index 2) and **Card 6** (index 5) both contain 🐶.
   - Click Card 3, then click Card 6. Both cards permanently lock in the revealed state (`card-matched`). Moves increments to 1, and Pairs increments to 1 / 8.
2. **Demonstrating a Mismatch**:
   - With seed `42`, click **Card 1** (🐻) and **Card 2** (🐹).
   - Both cards remain face-up for the duration defined by the difficulty level (Easy: 1200ms, Medium: 900ms, Hard: 600ms), and then cleanly flip back face-down.
3. **Demonstrating Rapid Clicks (Input Lock)**:
   - Click two mismatched cards (e.g. Card 1 and Card 2).
   - While they are face-up awaiting the mismatch timer (`isPending === true`), rapidly spam clicks on any third card (e.g. Card 4).
   - Observe that the third card never flips, proving the reducer's input lock guard prevents race conditions.
4. **Demonstrating Restart Safety During a Pending Timer**:
   - Flip two mismatched cards.
   - Immediately press **🔄 Restart** before the mismatch delay expires.
   - Observe that the board resets cleanly without ghost cards flipping back or throwing errors. The `clearTimeout` cancels the scheduled callback, and the new `gameId` renders any stale callback in the event loop completely harmless.
5. **Demonstrating Performance-Driven Difficulty Adaptation**:
   - Toggle **Show card faces**.
   - **Fast Win (Promotion)**: On Easy or Medium, match all 8 pairs in $\le 10$ moves and $\le 40$ seconds (e.g., in 8 moves and 15 seconds). The victory banner will show an upgrade to the next level with a celebratory rationale.
   - **Slow Win (Demotion)**: On Medium or Hard, deliberately make $\ge 20$ moves or take $\ge 90$ seconds before completing the puzzle. The banner will suggest dropping to an easier tier to afford more memorization time.
   - **Clamping**: Perform an upgrade on Hard or a downgrade on Easy to observe the boundary protection messages.

---

## 7. Adaptive Difficulty Rules

The adaptive engine in [`src/game/difficulty.js`](file:///d:/Cerevyn_project/memory-game/src/game/difficulty.js) uses calibrated thresholds from [`src/game/config.js`](file:///d:/Cerevyn_project/memory-game/src/game/config.js).

### Thresholds & Logic Table

| Transition | Rule Logic | Thresholds from `config.js` | Action |
| :--- | :--- | :--- | :--- |
| **Upgrade** | Strict conjunction (**AND**): Player must demonstrate both precision and speed. | `moves <= 10` **AND** `timeSeconds <= 40` | Advances up one level (`easy` → `medium` → `hard`). |
| **Downgrade** | Compassionate disjunction (**OR**): Struggling in either dimension warrants assistance. | `moves >= 20` **OR** `timeSeconds >= 90` | Drops down one level (`hard` → `medium` → `easy`). |
| **Dead-Band (Normal)** | Neither upgrade nor downgrade triggered. | `11 <= moves <= 19` and `41 <= time <= 89` | Stays on current level without oscillating. |

### Clamping & Boundary Feedback
- **Clamped at Highest (Hard)**: If a player qualifies for an upgrade on Hard, the system returns `hard` with:  
  `"Outstanding! You finished in X moves and Ys — you are already on the highest level (Hard)!"`
- **Clamped at Easiest (Easy)**: If a player qualifies for a downgrade on Easy, the system returns `easy` with:  
  `"Tough round (...), but you are already on the easiest level (Easy). Keep practicing!"`
- **Normal Range**:  
  `"Good game! Your score (X moves, Ys) is in the normal range for [Level]. Difficulty stays the same."`

---

## 8. How Restart Safety Works

In async React applications, restarting a game while timers are scheduled can introduce severe UI bugs (e.g., cards from Game B flipping face-down because of an unresolved timer from Game A). This application guarantees safety across three distinct layers:

1. **Immediate Timer Cancellation (`useGame.js`)**:
   Inside `restart()`, `clearTimeout(mismatchTimerRef.current)` is called synchronously before dispatching the `RESTART` action, halting pending callbacks.
2. **React Effect Cleanup**:
   The `useEffect` managing the mismatch timer returns a cleanup function that cancels the active timeout whenever `isPending`, `gameId`, or `difficulty` changes, as well as on component unmount.
3. **Reducer `gameId` Guard (`reducer.js`)**:
   Every game round receives a unique `gameId` generated as `${seed}-${++gameCounter}` using a module-level counter. When `RESOLVE_MISMATCH` is dispatched, its payload carries the `gameId` captured at the moment of the mismatch. If `action.payload.gameId !== state.gameId`, the reducer immediately returns `state` unmodified, safely ignoring any stale callback that slipped through the event loop.

---

## 9. Deterministic Shuffling: Seed `42` Example

Calling `buildDeck(42)` produces this exact 16-card array:

| Index / ID | Symbol | Pair ID | Matching Partner Index | Initial State |
| :---: | :---: | :---: | :---: | :---: |
| **0** | 🐻 | 6 | Index 9 | Face down |
| **1** | 🐹 | 3 | Index 14 | Face down |
| **2** | 🐶 | 0 | Index 5 | Face down |
| **3** | 🐼 | 7 | Index 7 | Face down |
| **4** | 🐭 | 2 | Index 10 | Face down |
| **5** | 🐶 | 0 | Index 2 | Face down |
| **6** | 🐱 | 1 | Index 11 | Face down |
| **7** | 🐼 | 7 | Index 3 | Face down |
| **8** | 🦊 | 5 | Index 13 | Face down |
| **9** | 🐻 | 6 | Index 0 | Face down |
| **10** | 🐭 | 2 | Index 4 | Face down |
| **11** | 🐱 | 1 | Index 6 | Face down |
| **12** | 🐰 | 4 | Index 15 | Face down |
| **13** | 🦊 | 5 | Index 8 | Face down |
| **14** | 🐹 | 3 | Index 1 | Face down |
| **15** | 🐰 | 4 | Index 12 | Face down |

---

## 10. Technology Choice

This project was built with **plain JavaScript (ES6+ Modules), React 18, and Vite** as a deliberate and justified alternative to TypeScript:
- **No Compilation Overhead**: Native ES modules run with instantaneous Vite HMR and zero build-step transpilation delays during local development.
- **Type Safety via JSDoc**: Rich JSDoc annotations throughout `src/game/` document all object shapes (`GameState`, `Card`, function parameters, return types), giving full IDE autocompletion and type hint coverage without adding TypeScript toolchain dependencies.
- **Pure Functional Design**: Game logic is composed of pure functions and reducers that do not depend on class hierarchies or compiler-specific constructs, maximizing portable unit testability.

---

## 11. Known Limitations

1. **Client-Side Only**: There is no remote backend server or centralized database; all session statistics persist exclusively in the current browser's `localStorage`.
2. **Timer Granularity**: Active gameplay time is sampled using `Date.now()` and updates the UI every 250 milliseconds. This provides smooth visual response without excessive React re-render cycles.
3. **Asset-Free Audio & Animations**: To keep the repository lightweight and dependency-free, no external audio files or third-party animation engines (such as Framer Motion) are used. Visual feedback relies entirely on emoji glyphs and native CSS transitions.

---

## 12. Contributions and AI Assistance

- **AI Collaboration**: This project was developed with the assistance of **Google Antigravity** as an AI pair programmer.
- **Candidate Ownership & Direct Contributions**:
  - Selected and scoped the problem statement (**PS09**).
  - Specified the game rules, state machine flow, and dual-gate adaptive difficulty thresholds (`upgrade` vs. `downgrade`).
  - Reviewed, audited, and debugged all generated code to ensure architectural purity in `src/game/` and clean separation of side-effects in `src/hooks/`.
  - Conducted end-to-end manual testing across all edge cases (rapid spam clicks, stale timer restarts, visibility switching).
  - Configured the automated test suites, CI workflow, and prepared the demonstration workflow.
