# Phase 2: Manual QA Test Plan

> **Scope**: Game setup, night script facilitation, timer, and phase transitions
> **Prerequisites**: Backend and frontend running via Docker Compose; seed data loaded

---

## 1. Game Setup Page (`/games/new`)

### 1.1 Page Load
| # | Step | Expected |
|---|------|----------|
| 1 | Navigate to `/games/new` | Page loads with "New Game Setup" heading |
| 2 | Observe role grid | All official roles render as selectable cards |
| 3 | Observe config fields | Players defaults to 5, Center Cards to 3, Timer to 300 |

### 1.2 Player/Center Configuration
| # | Step | Expected |
|---|------|----------|
| 1 | Set Players to 3 | Input accepts value; role count label updates to "0 / 6" |
| 2 | Set Players to 0, then click away | Input clamps to 3 on blur |
| 3 | Set Players to 21, then click away | Input clamps to 20 on blur |
| 4 | Clear Players field and type "4" | Displayed value is "4" while typing (no mid-edit clamp) |
| 5 | Set Center Cards to 0 | Accepted; role count label shows "0 / {players}" |
| 6 | Set Center Cards to 6, then click away | Input clamps to 5 on blur |
| 7 | Clear Timer, type "100", then click away | Displayed value is "100" while typing; clamps to 100 on blur (within 60–1800) |
| 8 | Clear Timer, type "1", then click away | Input clamps to 60 on blur |

### 1.3 Role Selection
| # | Step | Expected |
|---|------|----------|
| 1 | Click a role card | Card highlights with primary-color border; opacity becomes 1; counter increments |
| 2 | Click same card again | Card deselects; border removed; counter decrements |
| 3 | Select exactly players + center roles | "Start Game" button becomes enabled (full opacity, pointer cursor) |
| 4 | Select fewer than required | "Start Game" button remains disabled (0.5 opacity, not-allowed cursor) |
| 5 | Select more than required | "Start Game" button remains disabled (exact count required) |

### 1.4 Game Creation
| # | Step | Expected |
|---|------|----------|
| 1 | Select correct role count, click "Start Game" | Button text changes to "Creating Game..."; API call fires |
| 2 | On success | Navigates to `/games/{new-game-id}` |
| 3 | On API error | Error message displays above config section; button re-enables |

### 1.5 Timer Configuration
| # | Step | Expected |
|---|------|----------|
| 1 | Set timer to 60 | Accepted (minimum) |
| 2 | Set timer to 1800 | Accepted (maximum) |
| 3 | Set timer to 30 | Input should clamp or reject — below 60 minimum |

### 1.6 Multi-Copy Role Selection
| # | Step | Expected |
|---|------|----------|
| 1 | Click Werewolf (default_count=2) | Card highlights; counter increments by 2 |
| 2 | Click Werewolf again | Card deselects; counter decrements by 2 |
| 3 | Click Villager (default_count=3, max=3) | Counter increments by 3; + button disabled |
| 4 | Click – on Villager (count=3) | Count decreases to 2 |
| 5 | Click + on Villager (count=2) | Count increases to 3 |
| 6 | Click – on Villager until count=1, then – again | Role removed entirely (below min_count) |
| 7 | Click Mason (min=max=2) | Card highlights; counter increments by 2; no +/– buttons visible |
| 8 | Click Mason again | Card deselects; counter decrements by 2 |
| 9 | Observe multi-copy role cards | Copy count badge visible (e.g., "×1–3" for Villager, "×2" for Mason) |
| 10 | Observe single-copy role cards | No copy count badge |

### 1.7 Role Dependency Auto-Selection
| # | Step | Expected |
|---|------|----------|
| 1 | Select Apprentice Tanner | Apprentice Tanner and Tanner both appear selected; counter increments by 2 |
| 2 | Remove Apprentice Tanner | Only Apprentice Tanner deselected; Tanner remains; counter decrements by 1 |
| 3 | Select Apprentice Tanner again | Both selected again |
| 4 | Remove Tanner | Both Tanner and Apprentice Tanner removed (cascade); counter decrements by 2 |
| 5 | Select Tanner manually, then Apprentice Tanner | Tanner count unchanged (already selected); Apprentice Tanner added |
| 6 | Observe RECOMMENDS dependencies (e.g., Minion → Werewolf) | No auto-selection occurs; only REQUIRES dependencies trigger auto-select |

### 1.8 Primary Team Role Validation
| # | Step | Expected |
|---|------|----------|
| 1 | Select only Minion (werewolf team, non-primary) + village roles = exact count | Click "Start Game" → error: "Missing primary role for werewolf team" |
| 2 | Add Werewolf to selection | Error clears; Start Game becomes valid (if count matches) |
| 3 | Select only Squire (werewolf team, non-primary) + village roles | Click "Start Game" → error: "Missing primary role for werewolf team" |
| 4 | Backend: POST `/api/games` with Minion only on wolf team | 400; error mentions "werewolf" team requires primary role |
| 5 | Backend: POST `/api/games` with Werewolf + Minion | Succeeds (primary role present) |

### 1.9 Start Game Error Messages
| # | Step | Expected |
|---|------|----------|
| 1 | Select fewer roles than players + center, click "Start Game" | Error: "Not enough roles selected — need X more" |
| 2 | Select more roles than players + center, click "Start Game" | Error: "Too many roles selected — remove X" |
| 3 | Select correct count but no primary wolf role, click "Start Game" | Error: "Missing primary role for werewolf team" |
| 4 | Adjust selection to valid state | Error clears automatically |
| 5 | Button is always clickable | Button is not disabled; validation occurs on click |

### 1.10 Dependency Recommendations Panel
| # | Step | Expected |
|---|------|----------|
| 1 | Select Minion without Werewolf | Warning panel appears: "Minion works best with Werewolf in the game" |
| 2 | Add Werewolf to selection | Warning for Minion clears |
| 3 | Select role with no recommendations | No warnings panel visible |
| 4 | Warning panel uses amber/yellow styling | Distinct from red error styling |

---

## 2. Game Facilitator Page (`/games/:gameId`)

### 2.1 Setup Phase
| # | Step | Expected |
|---|------|----------|
| 1 | Navigate to facilitator page for new game | "SETUP Phase" heading visible |
| 2 | Observe instructions | Shows "Distribute the role cards..." with center card count |
| 3 | Observe player count | Displays "{N} Players" in header |
| 4 | Click "Begin Night Phase" | API calls start → advance; page transitions to Night phase |

### 2.2 Night Phase (Script Reader)
| # | Step | Expected |
|---|------|----------|
| 1 | Phase transitions to Night | Script reader loads; first action visible ("Everyone, close your eyes.") |
| 2 | Observe progress bar | Shows thin bar at partial width |
| 3 | Observe role label | Shows "Narrator" above instruction text |
| 4 | Click "Next →" | Advances to next script step; progress bar grows; counter updates |
| 5 | Click "← Previous" | Goes back one step |
| 6 | "← Previous" on first step | Button disabled (faded) |
| 7 | Advance to last step | "Next →" changes to "Start Discussion" |
| 8 | Click "Start Discussion" | API fires advance; transitions to Discussion phase |
| 9 | Observe "Coming Up" preview | Shows next few role names as labeled chips |

### 2.3 Discussion Phase (Timer)
| # | Step | Expected |
|---|------|----------|
| 1 | Phase transitions to Discussion | Timer displays with configured duration (e.g., "5:00") |
| 2 | Observe countdown | Timer decrements every second |
| 3 | Click "Pause" | Timer stops; button label changes to "Resume" |
| 4 | Click "Resume" | Timer resumes from paused value |
| 5 | Click "Skip to Voting" | API fires advance; transitions to Voting phase immediately |
| 6 | Let timer reach 0:00 | Automatically fires advance to Voting phase |
| 7 | Timer below 30 seconds | Display color changes to error red |

### 2.4 Voting Phase
| # | Step | Expected |
|---|------|----------|
| 1 | Phase transitions to Voting | Shows voting instructions ("point at the player...") |
| 2 | Click "Reveal Results" | API fires advance; transitions to Resolution phase |

### 2.5 Resolution Phase
| # | Step | Expected |
|---|------|----------|
| 1 | Phase transitions to Resolution | Shows "Flip your cards to reveal your roles!" |
| 2 | Click "Complete Game" | API fires advance; transitions to Complete phase |

### 2.6 Complete Phase
| # | Step | Expected |
|---|------|----------|
| 1 | Phase transitions to Complete | Shows "Game Over" and "Thanks for playing!" |
| 2 | Click "New Game" | Navigates to `/games/new` |
| 3 | "Leave Game" button | Not visible in Complete phase |

### 2.7 Navigation
| # | Step | Expected |
|---|------|----------|
| 1 | Click "Leave Game" during any non-complete phase | Navigates to home (`/`) |

---

## 3. API Contract Spot-Checks

### 3.1 Create Game
| # | Action | Expected |
|---|--------|----------|
| 1 | POST `/api/games` with valid role_ids | 201; returns GameSessionResponse with phase="setup" |
| 2 | POST `/api/games` with wrong role count | 400; descriptive error about role count mismatch |
| 3 | POST `/api/games` with invalid role UUIDs | 404 or 400; no crash |

### 3.2 Start Game
| # | Action | Expected |
|---|--------|----------|
| 1 | POST `/api/games/{id}/start` on setup game | 200; phase="night"; game_roles have positions assigned |
| 2 | POST `/api/games/{id}/start` on already-started game | 400; error about invalid phase transition |

### 3.3 Get Night Script
| # | Action | Expected |
|---|--------|----------|
| 1 | GET `/api/games/{id}/script` on night-phase game | 200; NightScript with actions sorted by wake order |
| 2 | Actions include opening/closing | First action is "Everyone, close your eyes."; last is "Everyone, open your eyes." |
| 3 | Waking roles only | Non-waking roles (e.g., Villager) do not appear in actions |

### 3.4 Advance Phase
| # | Action | Expected |
|---|--------|----------|
| 1 | POST `/api/games/{id}/advance` through all phases | setup → night → discussion → voting → resolution → complete |
| 2 | POST advance on complete game | 400; cannot advance past complete |

### 3.5 Delete Game
| # | Action | Expected |
|---|--------|----------|
| 1 | DELETE `/api/games/{id}` | 204; game no longer retrievable |
| 2 | DELETE `/api/games/{nonexistent-id}` | 404 |

---

## 4. Sidebar Navigation

| # | Step | Expected |
|---|------|----------|
| 1 | Observe sidebar | "New Game" link visible with 🎮 icon |
| 2 | Click "New Game" | Navigates to `/games/new` |
| 3 | On `/games/new` | "New Game" link appears active (highlighted) |

---

## 5. Cross-Browser (if applicable)

| # | Browser | Check |
|---|---------|-------|
| 1 | Chrome latest | Full flow: setup → complete |
| 2 | Firefox latest | Timer renders correctly; SVG circle visible |
| 3 | Safari latest | Timer and ScriptReader functional |

---

*Last updated: March 26, 2026*
