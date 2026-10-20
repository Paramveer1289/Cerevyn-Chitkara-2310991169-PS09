# Screen Recording Demo Script: Adaptive Memory Matching Game (PS09)

> **Target Duration**: 4 minutes (Range: 3:30 – 4:50)  
> **Candidate**: Paramveer Singh | **Roll No**: 2310991169 | **Problem ID**: PS09  
> **Demo URL**: `http://localhost:5173` (or production preview)

---

## Pre-Recording Checklist

Before pressing record, make sure the environment is configured as follows:
- [ ] Terminal open at project root (`d:\Cerevyn_project\memory-game`).
- [ ] Dev server started via `npm run dev` and accessible at `http://localhost:5173`.
- [ ] Saved results cleared by clicking **Clear saved results** so the list is fresh.
- [ ] Browser zoom set to **100%** (or **110%**) for high-definition clarity.
- [ ] Close all unrelated browser tabs, bookmarks bar, and mute operating system notifications.
- [ ] Keep a second browser tab or window ready to demonstrate seed sharing and tab pause.

---

## Timeline & Narration Script

### 1. Introduction & Overview (0:00 – 0:20 | 20s)
- **Visual**: Show browser running the game at `http://localhost:5173`. Point cursor to the header, dashboard stats (Moves, Pairs, Timer, Difficulty, Seed), and the 4×4 grid.
- **Audio / Narration**:  
  > *"Hello, my name is Paramveer Singh, Roll Number 2310991169. This is my submission for Problem Statement PS09: the Adaptive Memory Matching Game for the Cerevyn x Chitkara University Technical Assessment.*  
  > *This application is built with React 18, Vite, and pure JavaScript. It features deterministic seeded shuffling, Page Visibility tab-pause, race-condition safety, and a performance-driven adaptive difficulty engine."*

---

### 2. Automated Test Suite & Build Verification (0:20 – 0:50 | 30s)
- **Visual**: Switch to terminal. Run `npm test -- --run`. Wait 2 seconds for all 84 tests to pass. Then run `npm run build`.
- **Audio / Narration**:  
  > *"Before demonstrating gameplay, let's verify code health in the terminal. I'll execute `npm test -- --run`.*  
  > *[Show output]*  
  > *All 84 automated tests across 4 test suites pass cleanly, covering the seeded PRNG, reducer guards, timeout cancellation, storage persistence, and adaptive rules.*  
  > *Next, running `npm run build` produces an optimized production bundle in `/dist` with zero warnings or errors."*

---

### 3. Demonstrating a Match (0:50 – 1:15 | 25s)
- **Visual**: Switch back to the browser. Click to open **🛠️ Demo panel**. Set Seed to `42` and click **Apply Seed**. Check the checkbox **Show card faces (debug peek)**. Point to Card 3 (index 2) and Card 6 (index 5) showing 🐶. Click Card 3, then Card 6.
- **Audio / Narration**:  
  > *"To inspect board logic, I'll open the collapsible Demo panel. I'll apply seed `42` and enable 'Show card faces (debug peek)'.*  
  > *For seed `42`, Card 3 and Card 6 are both dog emoji. When I click Card 3 then Card 6, they evaluate as an exact match. They lock face-up permanently, Moves increments to 1, and Pairs updates to 1 / 8."*

---

### 4. Demonstrating a Mismatch & Delay (1:15 – 1:40 | 25s)
- **Visual**: Uncheck debug peek. Click Card 1 (🐻) and Card 2 (🐹). Keep hands off mouse while they remain face-up, then watch them flip back face-down automatically.
- **Audio / Narration**:  
  > *"Now let's demonstrate a mismatch. I'll flip Card 1, which is a bear, and Card 2, which is a hamster.*  
  > *Because they don't match, both cards remain visible for the configured mismatch delay—1200ms on Easy—giving the player time to memorize their positions before flipping back face-down automatically."*

---

### 5. Rapid Clicks & Guard Safeguards (1:40 – 2:05 | 25s)
- **Visual**:
  1. Click Card 1 and Card 2 to trigger a mismatch. While face-up, rapidly click Card 4 several times.
  2. Click the already-matched Card 3.
  3. Click Card 4 once, then click Card 4 again.
- **Audio / Narration**:  
  > *"Notice the robust input guards:*  
  > *First, during a mismatch, the `isPending` state locks the board. If I rapidly click a third card while cards are pending, the click is ignored.*  
  > *Second, clicking an already-matched card does nothing.*  
  > *Third, clicking the same face-up card twice is safely ignored, preventing a card from matching with itself."*

---

### 6. Restart Safety During Pending Timer (2:05 – 2:30 | 25s)
- **Visual**: Flip two mismatched cards. Immediately hit **🔄 Restart** while they are still face-up.
- **Audio / Narration**:  
  > *"In asynchronous React apps, restarting during a timer can cause bugs where old callbacks flip cards on the new board.*  
  > *Here, when I flip two mismatched cards and immediately click 'Restart', the timer is synchronously cleared with `clearTimeout`, and the reducer validates the new `gameId` counter. The new board is completely unaffected by any stale callbacks."*

---

### 7. Active Timer & Tab-Hidden Pause (2:30 – 2:55 | 25s)
- **Visual**: Flip one card to start the timer (e.g. at 0:03). Switch to a new browser tab for 5 seconds. Switch back to the memory game tab. Show that the timer resumes from ~0:03, having paused while inactive.
- **Audio / Narration**:  
  > *"The timer measures active engagement, starting on the first flip. Notice it's at 3 seconds.*  
  > *Now I'll switch to another tab for five seconds... and switch back.*  
  > *The timer resumes right where we left off. Using the HTML5 Page Visibility API, background tab time is excluded so players are never unfairly penalized for interruptions."*

---

### 8. Seed Reproducibility (2:55 – 3:20 | 25s)
- **Visual**: Point to the URL bar showing `?seed=...`. Enter `?seed=42` in the URL or open it in a side-by-side tab. Enable debug peek in both to show identical card locations.
- **Audio / Narration**:  
  > *"Every game layout is 100% deterministic. The URL automatically reflects `?seed=42`.*  
  > *If I open this exact URL in another window, the Mulberry32 pseudo-random generator produces the exact same card distribution. This allows players to share specific puzzles with friends."*

---

### 9. Performance-Driven Adaptive Difficulty (3:20 – 3:55 | 35s)
- **Visual**:
  1. Enable debug peek on Easy. Quickly match all remaining pairs in $\le 10$ moves and $\le 40$ seconds.
  2. Point to the **🎉 You Won!** banner, the **Next Difficulty: Medium** badge, and read the celebratory rationale.
  3. Start a round on Hard, click through 20+ moves, complete it, and show the downgrade recommendation to Medium.
- **Audio / Narration**:  
  > *"Upon winning, our adaptive engine evaluates performance against dual-threshold criteria:*  
  > *Because I finished in under 10 moves and under 40 seconds, both upgrade criteria are satisfied. The victory banner congratulates me and recommends advancing to Medium.*  
  > *Conversely, if a player takes 20 or more moves or over 90 seconds, the algorithm compassionately recommends dropping to an easier level with more look-time."*

---

### 10. Saved Results, Export, & Reset (3:55 – 4:20 | 25s)
- **Visual**: Scroll to **Recent results**. Show the saved game items with moves, time, difficulty, and reasons. Click **Export results as JSON** (download triggers). Click **Clear saved results** (list empties with empty message).
- **Audio / Narration**:  
  > *"All completed rounds are anonymously saved to browser `localStorage` wrapped in try/catch.*  
  > *The Recent results table displays the last 5 games. Clicking 'Export results as JSON' downloads a formatted JSON file of the history. Clicking 'Clear saved results' safely empties the store."*

---

### 11. Closing & Submission Summary (4:20 – 4:50 | 30s)
- **Visual**: Show `README.md` and `docs/azure-plan.md` in VS Code.
- **Audio / Narration**:  
  > *"To conclude: the repository includes a complete GitHub Actions CI workflow running on Node 20, an Azure Static Web Apps deployment plan in `docs/azure-plan.md`, and complete documentation.*  
  > *As disclosed, this project was built with AI assistance from Google Antigravity, with all requirements, thresholds, and manual validation reviewed by me.*  
  > *Thank you for watching!"*

---

## 8 Essential Screenshots Checklist

Capture and include these 8 screenshots in your submission artifacts:

| # | Screenshot Name | What to Display on Screen |
| :-: | :--- | :--- |
| **1** | `01_initial_dashboard.png` | Clean home screen showing title, dashboard stats at zero, and 16 face-down cards. |
| **2** | `02_test_suite_passing.png` | Terminal showing `vitest --run` with all 84 tests passing across 4 files. |
| **3** | `03_production_build.png` | Terminal showing `vite build` completed successfully with generated bundle sizes. |
| **4** | `04_demo_panel_peek.png` | Collapsible Demo panel expanded with `Show card faces (debug peek)` enabled showing symbols. |
| **5** | `05_card_matched_state.png` | Game in progress with at least 1 matching pair revealed in the green matched state. |
| **6** | `06_mismatch_input_lock.png` | Two mismatched cards face-up during the delay window showing `card-flipped` styling. |
| **7** | `07_victory_adaptive_upgrade.png` | Victory banner displaying completed stats, "Next Difficulty: Medium", and the promotion reason. |
| **8** | `08_recent_results_export.png` | Populated Recent Results list showing history entries alongside Export and Clear buttons. |
