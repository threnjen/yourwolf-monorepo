# QA Plan: PHASE_04B

**Status:** Pending manual execution  
**Scope:** Local game creation, session refresh, offline phase transitions, deterministic night narration, setup warnings, missing-game recovery, and local narrator preview.  
**Environment:** Frontend at `http://localhost:3000` and backend at `http://localhost:8000` unless a check explicitly stops the backend.  
**Prerequisites:** Seed roles loaded. Use the browser's DevTools Network panel with **Preserve log** enabled. Do not copy credentials or private data into evidence.

## Automated Evidence

Automated evidence is separate from the manual checks below.

| Check | Result | Evidence |
|---|---|---|
| Focused integration suites | 229 passed, 0 failed | `dev/test-results/04-offline-flow-integration/affected.json` |
| Full frontend coverage suite | 685 passed, 0 failed | `dev/test-results/04-offline-flow-integration/full.json` |
| Global coverage | Lines/statements 92.32%, functions 93.01%, branches 94.46% | `dev/test-results/04-offline-flow-integration/coverage/coverage-summary.json` |
| Frontend lint | 0 errors, 0 warnings | `dev/test-results/04-offline-flow-integration/lint-final.json` |
| Frontend build | Passed | `dev/test-results/04-offline-flow-integration/build.log` |
| Deleted-path and protected-path searches | No forbidden frontend references. No backend, engine, or domain paths changed. | Feature 04 implementation record |

## Manual Execution Rules

- Every row starts as `Pending`.
- Mark a row `Passed` only after a human or browser-capable runner completes its steps and records the observed result.
- Mark a row `Failed` when the observed result differs from the expected result. Include the exact route, visible error, and relevant request path.
- A passing automated test does not mark a manual row passed.
- Clear site data before starting a new scenario when the steps require a new session.

## 1. Start the Local Stack

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 1.1 | From `yourwolf-backend/`, run `docker compose up --build`. | The backend, frontend, and database services start without an error. | Pending | — |
| 1.2 | Open DevTools → Network, enable **Preserve log**, and filter requests to Fetch/XHR. | The panel is ready to inspect requests from setup through completion. | Pending | — |
| 1.3 | Open `http://localhost:3000/games/new` and wait for loading to finish. | The **New Game Setup** page loads, role cards appear, and `GET /api/v1/roles?limit=100` returns successfully. | Pending | — |

## 2. Create a Game and Verify the Local Flow

Use this deterministic scenario for the full-flow checks: set **Players** to `6`, set **Center Cards** to `0`, and select **Werewolf**, **Minion**, and **Villager** once each. The seeded defaults represent six cards: two Werewolves, one Minion, and three Villagers. This includes waking roles and exercises a single-role detail fetch for each distinct selected role.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 2.1 | Replace **Players** with `6` and press `Tab`, then replace **Center Cards** with `0` and press `Tab`. | The heading reads **Select Roles (0 / 6)**. | Pending | — |
| 2.2 | Select `Werewolf`, `Minion`, and `Villager` once each. | The heading reads **Select Roles (6 / 6)** and the **Next** action becomes enabled. | Pending | — |
| 2.3 | Click **Next**. | The URL becomes `/games/new/wake-order` and **Review Wake Order** appears. No request to `/api/v1/games` occurs. | Pending | — |
| 2.4 | Inspect the preserved Network log from opening `/games/new` through the wake-order page. | One successful `GET /api/v1/roles?limit=100` is visible. No request path contains `/api/v1/games`. | Pending | — |
| 2.5 | Keep the wake-order sequence unchanged and click **Start Game** on the review page. | One successful `GET /api/v1/roles/{id}` appears for each of the three distinct selected role ids. The app navigates to `/games/{id}` and shows **SETUP Phase**. No `POST /api/v1/games` occurs. | Pending | — |
| 2.6 | Inspect the Network panel after the facilitator setup view appears. | No game creation, game load, start, advance, or script request appears under `/api/v1/games`. | Pending | — |

## 3. Backend-Offlining and Phase Transitions

Complete 2.1–2.5 before stopping the backend. This ensures the role list and distinct role details have loaded and the local snapshot exists. Keep the shell in `yourwolf-backend/` for the service commands below.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 3.1 | Stop only the backend service with `docker compose stop backend`. Leave the frontend open. | The frontend remains reachable at `http://localhost:3000/games/{id}`. | Pending | — |
| 3.2 | On the facilitator's **SETUP Phase** view, click **Begin Night Phase**. | The app reaches the **NIGHT Phase** without a backend request. | Pending | — |
| 3.3 | Inspect the Network panel after the transition. | No request path contains `/api/v1/games`. | Pending | — |
| 3.4 | Click **Next →** until it changes to **Start Discussion**, then click **Start Discussion**. | The app reaches the **DISCUSSION Phase** without a backend request. | Pending | — |
| 3.5 | Click **Skip to Voting** in the discussion timer. | The app reaches the **VOTING Phase** without a backend request. | Pending | — |
| 3.6 | Click **Reveal Results**. | The app reaches the **RESOLUTION Phase** without a backend request. | Pending | — |
| 3.7 | Click **Complete Game**. | The app reaches the **COMPLETE Phase**, shows **Game Over**, and does not require the backend. | Pending | — |
| 3.8 | Inspect the complete preserved Network log. | No request path containing `/api/v1/games` occurred after the snapshot was stored. | Pending | — |

## 4. Refresh Recovery in Every Persisted Phase

Use a fresh game or restore the backend with `docker compose start backend` before creating another game. At each phase, refresh the browser at the same `/games/{id}` URL and record the visible phase heading.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 4.1 | Refresh while the facilitator shows **SETUP Phase**. | Setup returns with the same stored state and **Begin Night Phase** action. | Pending | — |
| 4.2 | Click **Begin Night Phase**, then refresh before clicking **Next →**. | **NIGHT Phase** returns and the first action is **Everyone, close your eyes.** | Pending | — |
| 4.3 | Click **Next →** once, then refresh the page. | **NIGHT Phase** returns and the reader starts again at **Everyone, close your eyes.** | Pending | — |
| 4.4 | Click **Next →** until it changes to **Start Discussion**, click it, then refresh. | **DISCUSSION Phase** returns with the configured timer. | Pending | — |
| 4.5 | Click **Skip to Voting**, then refresh. | **VOTING Phase** returns with **Reveal Results**. | Pending | — |
| 4.6 | Click **Reveal Results**, then refresh. | **RESOLUTION Phase** returns with **Complete Game**. | Pending | — |
| 4.7 | Click **Complete Game**, then refresh. | **COMPLETE Phase** remains visible with **Game Over** and **New Game**. **Leave Game** is absent. | Pending | — |

## 5. Night Script Fixture Parity

Use the existing authority at `yourwolf-frontend/src/test/engine/night-script.fixture.json`. Do not invent replacement narrator text.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 5.1 | Open `yourwolf-frontend/src/test/engine/night-script.fixture.json` and match fixture roles by `name`, not by fixture-only id. Compare the wake-order review with the selected `Werewolf`, `Minion`, and `Villager` roles. | The review places the waking roles in their wake-order groups, with `Werewolf` before `Minion`; `Villager` has no wake tile. | Pending | — |
| 5.2 | In the night reader, compare the `Narrator`, `Werewolf`, and `Minion` actions with the matching entries in the fixture's `default` output. | Each displayed instruction, role label, duration, and player-action flag matches the Phase 04a fixture for those roles. | Pending | — |
| 5.3 | Click **Next →** once during night, refresh, and repeat the comparison from the first action. | The same action list returns and the first action is **Everyone, close your eyes.** | Pending | — |

## 6. Error and Recovery States

Restore the backend with `docker compose start backend` before checks that need role-list or validation requests. Use a new game when a prior scenario has reached complete.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 6.1 | Navigate directly to `/games/unknown-game-id`. | The page shows **Game not found** and a **New Game Setup** link to `/games/new`. | Pending | — |
| 6.2 | Navigate to `/games/new/wake-order` in a new tab without setup router state. | The app redirects to `/games/new` without throwing. | Pending | — |
| 6.3 | On a fresh `/games/new`, set **Players** to `3` and **Center Cards** to `0` with `Tab` after each input. Select `Minion`, `Squire`, and `Tanner` once each. Click **Next**, then click **Start Game** on `/games/new/wake-order`. | The engine validation message `'werewolf' team requires at least one primary role (e.g., Werewolf)` appears. No new game snapshot is stored, and the **Start Game** action remains enabled. | Pending | — |
| 6.4 | On `/games/new/wake-order`, copy one selected role UUID from the role-list response, add the exact `http://localhost:8000/api/v1/roles/{role-id}` URL to DevTools Network request blocking, then click **Start Game**. Remove the block after the check. | An error banner appears, no new game snapshot is stored, and **Start Game** becomes enabled again. | Pending | — |
| 6.5 | On a stored game's **SETUP Phase**, run `window.__originalSessionSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new Error('Storage unavailable'); };` in the DevTools Console, then click **Begin Night Phase**. Restore the method with `Storage.prototype.setItem = window.__originalSessionSetItem; delete window.__originalSessionSetItem;`. | A **Storage unavailable** error banner appears, **SETUP Phase** remains visible, and the session is not advanced. | Pending | — |
| 6.6 | Start a fresh game with **Players** `3` and **Center Cards** `0`. Select `Dream Wolf`, `Mystic Wolf`, and `Alpha Wolf` once each, click **Next**, then click **Start Game** on the wake-order page. | The facilitator **SETUP Phase** shows **Setup warnings** with `Dream Wolf`, `Mystic Wolf`, and `Alpha Wolf` warnings that each say the role works best with `Werewolf` in the game. | Pending | — |

## 7. Local Narrator Preview and Server Validation

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 7.1 | Restore the backend with `docker compose start backend`, wait for it to accept requests, and open `/roles/new`. Keep DevTools Network open with Preserve log enabled. | **Create New Role** and the wizard render. | Pending | — |
| 7.2 | In the Basic step, enter `Seer` in **Name**, set **Wake Order (0–40)** to `4`, and wait one second after the last edit. | Narrator instructions render from the local preview. No `/api/v1/roles/preview-script` request occurs. | Pending | — |
| 7.3 | Inspect the Network panel after the preview updates. | A `POST /api/v1/roles/validate` request is present. No request to `/api/v1/roles/preview-script` is present. | Pending | — |
| 7.4 | Edit **Name** several times within one second, ending with `Newest`, and wait one second after the last edit. | Only the newest draft's preview remains visible. | Pending | — |
| 7.5 | Set **Wake Order (0–40)** to `0` and wait one second. | The UI says **This role does not wake up — no narrator instructions.** and shows no preview error. | Pending | — |
| 7.6 | Click **Next** three times to reach Review, then click **Back** three times to return to Basic. Stop the backend with `docker compose stop backend`, change **Name** to `Newest Offline`, and wait one second. Click **Next** through Abilities, Win Conditions, and Review. | Local preview still updates on the Basic step. The Review step visibly reports **Validation service unavailable**. | Pending | — |

## 8. Completion Record

| Field | Value |
|---|---|
| Tester | Pending |
| Browser and version | Pending |
| Date | Pending |
| Manual result | Pending |
| Failed checks and evidence | None recorded |
