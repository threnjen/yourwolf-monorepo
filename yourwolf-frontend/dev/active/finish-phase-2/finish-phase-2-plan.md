# Plan: Finish Phase 2 — Game Facilitation (Frontend)

> **Goal**: Close the three remaining gaps between the implementation and the Phase 2 QA spec so Phase 2 can be formally signed off.
>
> **Prerequisites**: Phase 1 complete. Phase 2 backend fully implemented and all backend tests passing.
>
> **Cross-reference**: `yourwolf-backend/dev/active/finish-phase-2/` (2 edge-case router tests)

---

## Stage 1: Add "Skip to Voting" Button to Discussion Phase

**Goal**: `DiscussionPhaseView` renders a "Skip to Voting" button that immediately calls `onComplete`, matching QA spec section 2.3 step 5.

**Success Criteria**:
- A "Skip to Voting" button is rendered below the `Timer` component in `DiscussionPhaseView`
- Clicking it calls `onComplete`, which triggers `handleAdvancePhase` in the parent
- Existing `Timer` auto-advance on completion still works
- A new test in `GameFacilitator.test.tsx` asserts that "Skip to Voting" renders during the discussion phase and that clicking it calls `advancePhase`

**Status**: Complete
> Note: `Timer` component already implemented the "Skip to Voting" button internally via its `onComplete` prop, so `DiscussionPhaseView` required no changes. Tests added to assert the rendered button and `advancePhase` call.

---

## Stage 2: Clamp GameSetup Inputs to Valid Ranges

**Goal**: `GameSetupPage` programmatically clamps the three config inputs (`playerCount`, `centerCount`, `timerSeconds`) to their valid ranges on change, matching QA spec sections 1.2 and 1.5.

**Success Criteria**:
- `playerCount` is clamped to `[3, 20]` — any typed value outside this range is corrected on blur/change
- `centerCount` is clamped to `[0, 5]`
- `timerSeconds` is clamped to `[60, 1800]`
- The current NaN/zero guard (`parseInt(e.target.value) || fallback`) is replaced with `Math.max(min, Math.min(max, parsed))` logic
- New tests in the `GameSetup` test file (or a new `GameSetup.test.tsx` if none exists) verify that out-of-range inputs are clamped

**Status**: Complete
> `src/test/GameSetup.test.tsx` created with 4 clamping tests. `htmlFor`/`id` attributes added to labels/inputs in `GameSetup.tsx` as required for `getByLabelText` and accessibility.

---

## Stage 3: Expand GameFacilitator Test Coverage

**Goal**: Add tests for the five currently-untested phase renders (night, discussion, voting, resolution, complete) so the facilitator page has meaningful coverage across the full game lifecycle.

**Success Criteria**:
- `GameFacilitator.test.tsx` gains describe blocks for: `night phase`, `discussion phase`, `voting phase`, `resolution phase`, `complete phase`
- Night phase test: when phase is `'night'` and `getNightScript` resolves, `ScriptReader` is rendered (check some visible script text or navigation button)
- Discussion phase test: when phase is `'discussion'`, timer seconds are displayed in some form (e.g., "5:00")
- Voting phase test: "Reveal Results" button is rendered and clicking it calls `advancePhase`
- Resolution phase test: "Complete Game" button is rendered and clicking it calls `advancePhase`
- Complete phase test: "Game Over" text and "New Game" button are rendered; "Leave Game" button is NOT rendered
- All new tests follow the established `createMockGameSession({phase: '...'})` pattern from `mocks.ts`

**Status**: Complete
> All 5 phase describe blocks added to `GameFacilitator.test.tsx`. Total tests in that file: 6 → 15.
