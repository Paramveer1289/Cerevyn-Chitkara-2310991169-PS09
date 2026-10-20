# Expected Outputs & Deterministic Verification

This document records the exact deterministic outputs produced by the game's core modules, verified by direct script execution.

---

## 1. Deterministic Card Layout for Seed `42`

When `buildDeck(42)` is called, the Mulberry32 pseudo-random number generator and Fisher-Yates shuffle produce the exact 16-card layout below.

Each card object has:
- `id`: Stable index in the array (`0` through `15`), corresponding to grid cell index.
- `symbol`: The visual emoji face.
- `pairId`: Integer `0` to `7` identifying matching pairs.
- `isFlipped`: Initially `false`.
- `isMatched`: Initially `false`.

### Shuffled 4×4 Grid Layout (Index 0–15)

```text
+-------------------+-------------------+-------------------+-------------------+
|  Index 0: 🐻 (6)  |  Index 1: 🐹 (3)  |  Index 2: 🐶 (0)  |  Index 3: 🐼 (7)  |
+-------------------+-------------------+-------------------+-------------------+
|  Index 4: 🐭 (2)  |  Index 5: 🐶 (0)  |  Index 6: 🐱 (1)  |  Index 7: 🐼 (7)  |
+-------------------+-------------------+-------------------+-------------------+
|  Index 8: 🦊 (5)  |  Index 9: 🐻 (6)  | Index 10: 🐭 (2)  | Index 11: 🐱 (1)  |
+-------------------+-------------------+-------------------+-------------------+
| Index 12: 🐰 (4)  | Index 13: 🦊 (5)  | Index 14: 🐹 (3)  | Index 15: 🐰 (4)  |
+-------------------+-------------------+-------------------+-------------------+
```

### Full Card Specification Table

| Index / ID | Symbol | Pair ID | Matching Partner Index | Initial State |
| :---: | :---: | :---: | :---: | :---: |
| **0** | 🐻 Bear | 6 | Index 9 | Face down |
| **1** | 🐹 Hamster | 3 | Index 14 | Face down |
| **2** | 🐶 Dog | 0 | Index 5 | Face down |
| **3** | 🐼 Panda | 7 | Index 7 | Face down |
| **4** | 🐭 Mouse | 2 | Index 10 | Face down |
| **5** | 🐶 Dog | 0 | Index 2 | Face down |
| **6** | 🐱 Cat | 1 | Index 11 | Face down |
| **7** | 🐼 Panda | 7 | Index 3 | Face down |
| **8** | 🦊 Fox | 5 | Index 13 | Face down |
| **9** | 🐻 Bear | 6 | Index 0 | Face down |
| **10** | 🐭 Mouse | 2 | Index 4 | Face down |
| **11** | 🐱 Cat | 1 | Index 6 | Face down |
| **12** | 🐰 Rabbit | 4 | Index 15 | Face down |
| **13** | 🦊 Fox | 5 | Index 8 | Face down |
| **14** | 🐹 Hamster | 3 | Index 1 | Face down |
| **15** | 🐰 Rabbit | 4 | Index 12 | Face down |

---

## 2. Adaptive Difficulty Function (`suggestDifficulty`)

The `suggestDifficulty(moves, timeSeconds, currentLevel)` function is a pure decision rule based on the thresholds in `config.js`:
- **Upgrade gate (AND)**: `moves <= 10` AND `timeSeconds <= 40`
- **Downgrade gate (OR)**: `moves >= 20` OR `timeSeconds >= 90`
- **Dead-band (Normal)**: Any score not meeting the upgrade or downgrade conditions

### Verified Inputs and Real Implementation Outputs

The following table was verified by executing `suggestDifficulty()` in the Node runtime:

| Current Level | Moves | Time (s) | Evaluation / Gate Triggered | Recommended `nextLevel` | Exact Generated Reason |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **Easy** | 8 | 30 | Upgrade (`<= 10` moves AND `<= 40`s) | `medium` | `"Impressive! You finished in 8 moves and 30s — well within the target of 10 moves / 40s. Moving up to Medium."` |
| **Medium** | 10 | 40 | Upgrade boundary (`<= 10` moves AND `<= 40`s) | `hard` | `"Impressive! You finished in 10 moves and 40s — well within the target of 10 moves / 40s. Moving up to Hard."` |
| **Hard** | 9 | 35 | Upgrade, but clamped at top tier | `hard` | `"Outstanding! You finished in 9 moves and 35s — you are already on the highest level (Hard)!"` |
| **Hard** | 22 | 50 | Downgrade (`moves >= 20`) | `medium` | `"Tough round — you needed 22 moves (threshold: 20). Dropping to Medium to give you more time to look."` |
| **Medium** | 15 | 95 | Downgrade (`time >= 90s`) | `easy` | `"Tough round — you needed 95s (threshold: 90s). Dropping to Easy to give you more time to look."` |
| **Easy** | 25 | 100 | Downgrade (both gates), clamped at bottom tier | `easy` | `"Tough round (25 moves (threshold: 20) and 100s (threshold: 90s)), but you are already on the easiest level (Easy). Keep practicing!"` |
| **Medium** | 14 | 55 | Normal range (dead-band) | `medium` | `"Good game! Your score (14 moves, 55s) is in the normal range for Medium. Difficulty stays the same."` |
| **Hard** | 20 | 40 | Downgrade exact threshold (`moves = 20`) | `medium` | `"Tough round — you needed 20 moves (threshold: 20). Dropping to Medium to give you more time to look."` |
| **Medium** | 12 | 90 | Downgrade exact threshold (`time = 90s`) | `easy` | `"Tough round — you needed 90s (threshold: 90s). Dropping to Easy to give you more time to look."` |
