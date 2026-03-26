# Review Record: Phase 2 QA Readiness

## Summary
The implementation is largely complete and well-structured. Most QA scenarios will pass. One blocker exists around exact narration wording in section 3.3.2, and two high-severity issues around the night-phase loading UX will likely trip up a manual tester. Confidence in passing the full QA plan as written is **Medium** pending three targeted fixes.

## Verdict
Changes Requested

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| 1.1 Page Load | Verified | `yourwolf-frontend/src/pages/GameSetup.tsx:128-135` | Heading, defaults all correct |
| 1.2 Player/Center Config | Verified | `GameSetup.tsx:152-175` | `Math.max/min` clamping enforces all bounds |
| 1.3 Role Selection | Partial | `GameSetup.tsx:100`, `GameSetup.tsx:205-222` | Selection/counter/button work; 1.3.5 description in QA doc is inaccurate (button also disabled on over-selection) |
| 1.4 Game Creation | Verified | `GameSetup.tsx:103-119`, `yourwolf-backend/app/routers/games.py:22-50` | Loading state, error display, navigation all correct |
| 1.5 Timer Config | Verified | `GameSetup.tsx:168-175` | 60/1800 clamping applied |
| 2.1 Setup Phase | Verified | `GameFacilitator.tsx:77-93` | Player count, instructions, Begin Night button all present |
| 2.2 Night Phase | Partial | `GameFacilitator.tsx:262-264`, `ScriptReader.tsx:1-165` | ScriptReader fully correct; no loading/error state while script fetches |
| 2.3 Discussion Phase (Timer) | Verified | `Timer.tsx:1-130` | Pause/Resume/Skip/auto-complete/red-at-30s all implemented |
| 2.4 Voting Phase | Verified | `GameFacilitator.tsx:120-132` | Correct text and button |
| 2.5 Resolution Phase | Verified | `GameFacilitator.tsx:134-148` | Correct text and button |
| 2.6 Complete Phase | Verified | `GameFacilitator.tsx:150-161`, `GameFacilitator.tsx:291-296` | "Game Over", "Thanks for playing!", "New Game" button, "Leave Game" hidden |
| 2.7 Navigation | Verified | `GameFacilitator.tsx:288-296` | Leave Game navigates to `/` and hidden in complete phase |
| 3.1 Create Game API | Partial | `games.py:22-50` | Validation correct; QA doc expects 200 but backend returns 201 (doc bug) |
| 3.2 Start Game API | Verified | `games.py:92-112`, `game_service.py:158-175` | Phase guard raises 400 |
| 3.3 Night Script API | Divergent | `script_service.py:113-120` | Opening correct; closing is "Everyone, wake up!" not "open your eyes" |
| 3.4 Advance Phase API | Verified | `game_service.py:209-220` | Full cycle works; 400 on advance past complete |
| 3.5 Delete Game API | Verified | `games.py:155-165` | 204 on success, 404 on miss |
| 4 Sidebar | Verified | `Sidebar.tsx:62-71` | "New Game" with 🎮, NavLink active styling |

## Issues Found

| # | Issue | Severity | File:Line | QA Ref | Status |
|---|-------|----------|-----------|--------|--------|
| 1 | Closing narration is `"Everyone, wake up!"` not `"open your eyes"` | Blocker | `yourwolf-backend/app/services/script_service.py:113-120` | 3.3.2 | Fixed |
| 2 | Night phase content area is blank while script is loading | High | `yourwolf-frontend/src/pages/GameFacilitator.tsx:262-264` | 2.2.1 | Fixed |
| 3 | `useNightScript` error and loading states not consumed in facilitator page | High | `GameFacilitator.tsx:183` | 2.2.1 | Fixed |
| 4 | QA doc says POST /api/games returns 200; backend correctly returns 201 | Medium | `yourwolf-docs/docs/phases/PHASE_2/PHASE_2_QA.md:98` | 3.1.1 | Fixed (doc) |
| 5 | Phase title CSS `textTransform: 'uppercase'` renders "SETUP PHASE" not "SETUP Phase" | Medium | `GameFacilitator.tsx:29` (`phaseTitleStyles`) | 2.1.1 | Fixed |
| 6 | QA 1.3.5 says over-selection has no UI enforcement; button IS disabled for over-selection | Low | `GameSetup.tsx:100` | 1.3.5 | Fixed (doc) |
| 7 | `rolesApi.listOfficial()` fetches only first 50 roles; no pagination | Low | `yourwolf-frontend/src/api/roles.ts:25-28` | 1.1.2 | Open |

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-backend/app/services/script_service.py` | Changed closing narration from `"Everyone, wake up!"` to `"Everyone, open your eyes."` | 1 |
| `yourwolf-backend/tests/test_script_service.py` | Updated test assertion to match new closing narration | 1 |
| `yourwolf-frontend/src/pages/GameFacilitator.tsx` | Destructured `loading`/`error` from `useNightScript`; added loading spinner and error banner for night phase | 2, 3 |
| `yourwolf-frontend/src/pages/GameFacilitator.tsx` | Removed `textTransform: 'uppercase'` from `phaseTitleStyles`; render phase with `.toUpperCase()` + "Phase" suffix | 5 |
| `yourwolf-docs/docs/phases/PHASE_2/PHASE_2_QA.md` | Changed expected status code for create-game from 200 to 201 | 4 |
| `yourwolf-docs/docs/phases/PHASE_2/PHASE_2_QA.md` | Updated 1.3.5 to reflect that button is disabled for over-selection | 6 |
| `yourwolf-docs/docs/phases/PHASE_2/PHASE_2_QA.md` | Updated 3.3.2 closing narration expected text to `"Everyone, open your eyes."` | 1 |

## Remaining Concerns
- Issue #7 (Low): `rolesApi.listOfficial()` fetches only first 50 roles — acceptable for current seed data but will silently truncate if expanded

## Test Coverage Assessment
- Backend unit tests: Comprehensive coverage of game service lifecycle, script generation, router endpoints, and edge cases
- Covered: AC 3.1–3.5 via `test_games_router.py` and `test_game_service.py`
- Test assertion for closing narration now matches both code and QA spec
- Missing: Frontend component tests for `GameFacilitator.tsx` night-phase loading/error states; no E2E coverage of the full setup→complete flow

## Risk Summary
- `script_service.py:113` — single-string closing narration is wrong per QA spec; easy fix but also requires updating the unit test assertion
- `GameFacilitator.tsx:183` — `useNightScript` returns `{script, loading, error}` but only `script` is used; a network failure on script fetch leaves users silently stuck
- Night → Discussion transition is the only non-polling path; if `advancePhase` fires but `refetch` fails, the UI could be out of sync with backend state
- Timer `useEffect` re-registers the interval on every tick (because `remaining` is in the dep array); functionally correct but fragile in React StrictMode double-invoke scenarios in development
