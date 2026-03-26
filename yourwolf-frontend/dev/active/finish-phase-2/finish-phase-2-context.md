# Context: Finish Phase 2 — Game Facilitation (Frontend)

## Key Files

| File | Role |
|------|------|
| `src/pages/GameFacilitator.tsx` | Main facilitator page; contains all phase sub-components (`SetupPhaseView`, `DiscussionPhaseView`, etc.) |
| `src/pages/GameSetup.tsx` | Game creation page; contains the three config inputs with validation |
| `src/components/Timer.tsx` | Circular countdown timer; receives `seconds` and `onComplete` props; auto-starts by default |
| `src/components/ScriptReader.tsx` | Step-through night script display; receives `script: NightScript` and `onComplete` |
| `src/test/GameFacilitator.test.tsx` | Existing tests — covers loading, error, setup phase, and advance-phase-error only |
| `src/test/mocks.ts` | `createMockGameSession()` factory used by all facilitator tests |
| `src/api/games.ts` | `gamesApi` — mocked in facilitator tests via `vi.mock('../api/games')` |
| `docs/phases/PHASE_2/PHASE_2_QA.md` (yourwolf-docs) | Authoritative QA spec; sections 2.3, 1.2, 1.5 define acceptance for the gaps |

## Patterns to Follow

- Phase sub-components live at the bottom of `GameFacilitator.tsx` above the main `GameFacilitatorPage` export — add the Skip button directly inside `DiscussionPhaseView`, passed the `secondaryButtonStyle` already defined in the file
- Input clamping pattern: `Math.max(min, Math.min(max, parseInt(e.target.value) || min))` — replace the current `parseInt(e.target.value) || fallback` in `GameSetup.tsx`'s three `onChange` handlers
- Test pattern: `createMockGameSession({phase: 'discussion'})` + `mockGamesApi.getById.mockResolvedValue(game)` + `waitFor(...)` — match the shape used in the existing `setup phase` describe block
- Timer tests use `vi.useFakeTimers()` / `vi.advanceTimersByTime()` if needed; the `Timer.test.tsx` file shows the established approach

## Decisions

- "Skip to Voting" button uses `secondaryButtonStyle` (not primary) — it's an escape hatch, not the primary action; the `Timer`'s auto-advance remains the primary path
- Input clamping fires on `onChange` (not `onBlur`) to match existing handler style in the file
- No new test file is needed — all three stages add tests to `GameFacilitator.test.tsx` (stages 1, 3) and add a `GameSetup.test.tsx` (stage 2) if one does not exist yet; check `src/test/` first

## Constraints

- Do NOT add vote collection, result persistence, or any feature beyond the QA spec items — those are out of scope for Phase 2
- Do NOT change the `Timer` component's auto-advance behavior
- All new tests must be able to fail for a real defect (per AGENTS.md TDD rules)
