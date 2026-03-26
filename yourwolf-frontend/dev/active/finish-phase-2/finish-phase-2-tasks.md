# Tasks: Finish Phase 2 — Game Facilitation (Frontend)

## Stage 1: Add "Skip to Voting" Button

- [x] Write a failing test in `GameFacilitator.test.tsx` asserting "Skip to Voting" is rendered when phase is `'discussion'`
- [x] Write a failing test asserting that clicking "Skip to Voting" calls `gamesApi.advancePhase`
- [x] Add "Skip to Voting" button to `DiscussionPhaseView` in `GameFacilitator.tsx`, calling `onComplete` on click
      > Note: `Timer` component already implemented this button internally; no changes to `DiscussionPhaseView` were needed
- [x] Confirm both new tests pass; confirm no regressions in existing tests
- [ ] Commit: `feat(frontend): add Skip to Voting button to discussion phase`

## Stage 2: Clamp GameSetup Inputs

- [x] Check `src/test/` for an existing `GameSetup.test.tsx`; create it if absent → created `src/test/GameSetup.test.tsx`
- [x] Write a failing test: setting players to 2 results in clamped value of 3
- [x] Write a failing test: setting players to 21 results in clamped value of 20
- [x] Write a failing test: setting center cards to 6 results in clamped value of 5
- [x] Write a failing test: setting timer to 30 results in clamped value of 60
- [x] Update the three `onChange` handlers in `GameSetup.tsx` to use `Math.max`/`Math.min` clamping
      > Also added `htmlFor`/`id` attributes to labels/inputs for accessibility and `getByLabelText` testability
- [x] Confirm all new tests pass; confirm no regressions
- [ ] Commit: `fix(frontend): clamp game setup inputs to valid ranges`

## Stage 3: Expand GameFacilitator Phase Coverage

- [x] Add `describe('night phase')` block: mock `phase: 'night'` + mock `getNightScript` resolving; assert `ScriptReader` content renders (e.g., navigation buttons visible)
- [x] Add `describe('discussion phase')` block: mock `phase: 'discussion'`; assert timer display renders
- [x] Add `describe('voting phase')` block: mock `phase: 'voting'`; assert "Reveal Results" renders; assert clicking it calls `advancePhase`
- [x] Add `describe('resolution phase')` block: mock `phase: 'resolution'`; assert "Complete Game" renders; assert clicking it calls `advancePhase`
- [x] Add `describe('complete phase')` block: mock `phase: 'complete'`; assert "Game Over" and "New Game" render; assert "Leave Game" is NOT rendered
- [x] Confirm all new tests pass; confirm no regressions
- [ ] Commit: `test(frontend): add game facilitator phase coverage`

## Sign-off

- [ ] All tests pass (`npm run test` or `vitest run`)
- [ ] Run through `PHASE_2_QA.md` sections 2.3 (steps 5–6), 1.2, 1.5 manually in dev environment
- [x] Confirm backend `finish-phase-2` tasks are also complete
- [ ] Remove `dev/active/finish-phase-2/` from both repos once all tasks done
