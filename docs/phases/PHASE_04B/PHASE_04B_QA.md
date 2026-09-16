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
| 1.2 | Open `http://localhost:3000/games/new`. | The **New Game Setup** page loads and role cards appear. | Pending | — |
| 1.3 | Open DevTools → Network, enable **Preserve log**, and filter requests to Fetch/XHR. | The panel is ready to inspect requests from setup through completion. | Pending | — |

## 2. Create a Game and Verify the Local Flow

Use this deterministic scenario for the full-flow checks: set **Players** to `3`, set **Center Cards** to `0`, and select **Werewolf**, **Minion**, and **Villager** once each. This includes waking roles and exposes the Minion dependency warning.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 2.1 | Select `Werewolf`, `Minion`, and `Villager` until the selected-role count equals three. | The **Start Game** action becomes available. | Pending | — |
| 2.2 | Observe the setup warning before starting. | An informational **Setup warnings** message says Minion works best with Werewolf in the game, or equivalent seed-role wording. | Pending | — |
| 2.3 | Click **Start Game** and wait for wake-order review. | The app requests one list response and one detail response for each distinct selected role, then opens **Review Wake Order**. No `/games` request occurs. | Pending | — |
| 2.4 | In the Network panel, inspect requests from the setup page through wake-order review. | Role list/detail requests are visible. No request uses `/games`, `/games/`, or another game API path. | Pending | — |
| 2.5 | Keep the wake-order sequence unchanged and click **Start Game** on the review page. | The app navigates to `/games/{id}` and shows the **SETUP Phase**. | Pending | — |
| 2.6 | Inspect the Network panel after navigation. | No game creation, game load, start, advance, or script request appears. | Pending | — |

## 3. Backend-Offlining and Phase Transitions

Complete 2.1–2.5 before stopping the backend. This ensures the role list and distinct role details have loaded and the local snapshot exists.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 3.1 | Stop only the backend service with `docker compose stop backend`. Leave the frontend open. | The frontend remains reachable. | Pending | — |
| 3.2 | On the facilitator's setup view, click **Begin Night Phase**. | The app reaches the **NIGHT Phase** without a backend request. | Pending | — |
| 3.3 | Inspect the Network panel after the transition. | No `/games` request appears. | Pending | — |
| 3.4 | Advance through the night reader until **Start Discussion** appears, then click it. | The app reaches the **DISCUSSION Phase** without a backend request. | Pending | — |
| 3.5 | Click **Skip to Voting**. | The app reaches the **VOTING Phase** without a backend request. | Pending | — |
| 3.6 | Click **Reveal Results**. | The app reaches the **RESOLUTION Phase** without a backend request. | Pending | — |
| 3.7 | Click **Complete Game**. | The app reaches the **COMPLETE Phase**, shows **Game Over**, and does not require the backend. | Pending | — |
| 3.8 | Inspect the complete network log. | No request to any `/games` path occurred after the snapshot was stored. | Pending | — |

## 4. Refresh Recovery in Every Persisted Phase

Use a fresh game or restore the backend before creating another game. At each phase, refresh the browser and record the route and visible phase heading.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 4.1 | Refresh while the facilitator shows **SETUP Phase**. | Setup returns with the same warning state and **Begin Night Phase** action. | Pending | — |
| 4.2 | Start the night phase, then refresh before advancing the reader. | **NIGHT Phase** returns and the first action is **Everyone, close your eyes.** | Pending | — |
| 4.3 | Advance the reader once, then refresh the page. | **NIGHT Phase** returns and the reader starts again at its first action. | Pending | — |
| 4.4 | Advance to discussion, then refresh. | **DISCUSSION Phase** returns with the configured timer. | Pending | — |
| 4.5 | Advance to voting, then refresh. | **VOTING Phase** returns with **Reveal Results**. | Pending | — |
| 4.6 | Advance to resolution, then refresh. | **RESOLUTION Phase** returns with **Complete Game**. | Pending | — |
| 4.7 | Complete the game, then refresh. | **COMPLETE Phase** remains visible with **Game Over** and **New Game**. **Leave Game** is absent. | Pending | — |

## 5. Night Script Fixture Parity

Use the existing authority at `yourwolf-frontend/src/test/engine/night-script.fixture.json`. Do not invent replacement narrator text.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 5.1 | Compare the selected seed-role sequence shown in the wake-order review with the fixture's `custom_sequence` ordering for the same role ids. | The displayed role order follows the selected custom sequence, including a single waking role. | Pending | — |
| 5.2 | In the night reader, compare each displayed instruction, role label, duration, and opening/closing action with the matching fixture entries. | The local output matches the Phase 04a fixture for the selected sequence. | Pending | — |
| 5.3 | Refresh during night and repeat the comparison from the first action. | The same action list and first-action text return after refresh. | Pending | — |

## 6. Error and Recovery States

Restore the backend before checks that need role-list or validation requests. Use a new game when a prior scenario has reached complete.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 6.1 | Navigate directly to `/games/unknown-game-id`. | The page shows **Game not found** and a **New Game Setup** link to `/games/new`. | Pending | — |
| 6.2 | Navigate to `/games/new/wake-order` in a new tab without setup router state. | The app redirects to `/games/new` without throwing. | Pending | — |
| 6.3 | Create an invalid role selection or wrong total, then click **Start Game**. | The engine validation message appears, no game is created, and the user remains on setup or wake-order review. | Pending | — |
| 6.4 | Cause one role detail request to fail before creation completes. | An error banner appears, no game is stored, and the start action becomes available again. | Pending | — |
| 6.5 | With a game stored, make session storage unavailable or full before a transition where practical. | An error banner appears and the previous phase remains visible. | Pending | — |
| 6.6 | Return to setup and remove the Werewolf role while retaining Minion. | The setup warning is visible. Add Werewolf again. | Pending | — |

## 7. Local Narrator Preview and Server Validation

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 7.1 | Restore the backend and open `/roles/new`. Open the Network panel with Preserve log enabled. | **Create New Role** and the wizard render. | Pending | — |
| 7.2 | Enter `Seer` as the role name and set wake order to `4`. Wait one second for the debounce. | Narrator instructions render from the local preview. No `/roles/preview-script` request occurs. | Pending | — |
| 7.3 | Inspect the Network panel after the preview updates. | A `/roles/validate` request is present. The preview did not use a network request. | Pending | — |
| 7.4 | Edit the draft several times within one second, ending with `Newest`. Wait for the debounce. | Only the newest draft's preview remains visible. | Pending | — |
| 7.5 | Set wake order to empty or zero. | The UI says the role does not wake up and shows no preview error. | Pending | — |
| 7.6 | Stop the backend and edit the draft again. | Local preview still updates. Server validation reports its unavailable state visibly. | Pending | — |

## 8. Completion Record

| Field | Value |
|---|---|
| Tester | Pending |
| Browser and version | Pending |
| Date | Pending |
| Manual result | Pending |
| Failed checks and evidence | None recorded |

