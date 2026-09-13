# Implementation Record: 03 Game Session State Machine

## Summary

Implemented the pure TypeScript game-session state machine and ordered setup validation in four allowed frontend files. The engine exposes `GameSessionCreateInput`, `RoleDependencyInput`, `GameSession`, `IdGenerator`, `createGameSession`, `startGame`, and `advancePhase`. Setup validation returns readonly warnings and keeps an omitted `wake_order_sequence` absent. Scalar bounds remain owned by the transport boundary and are not cloned into the engine.

## Sibling Features

Feature 01 supplies the readonly `EngineRoleInput` contract consumed by this feature. Feature 02 shares `src/engine/` and `src/test/engine/` but remains narration-only and has no runtime dependency on this state machine. The implementation touched neither sibling source nor tests.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | Session create input and readonly role/dependency contracts | `gameSession.test.ts` creation and input immutability cases | Literal engine role/dependency shapes and readonly session output | Complete | `src/engine/gameSession.ts`, `src/engine/gameSetupValidation.ts` | `yourwolf-frontend/src/test/engine/gameSession.test.ts` | PENDING | PENDING |
| AC2 | Ordered setup rejection | `gameSetupValidation.test.ts` precedence cases | Count, unknown id, card count, primary team, dependency, wake sequence order | Complete | `src/engine/gameSetupValidation.ts` | `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts` | PENDING | PENDING |
| AC3 | Required dependencies and recommended warnings | `gameSetupValidation.test.ts` dependency cases | Exact hard-error and soft-warning assertions | Complete | `src/engine/gameSetupValidation.ts`, `src/engine/gameSession.ts` | `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts`, `yourwolf-frontend/src/test/engine/gameSession.test.ts` | PENDING | PENDING |
| AC4 | Wake sequence validation and omission | `gameSetupValidation.test.ts` wake-sequence cases | Duplicate, extra, non-waking, missing, empty, valid, and omitted sequences | Complete | `src/engine/gameSetupValidation.ts` | `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts` | PENDING | PENDING |
| AC5 | Setup output and injected deterministic id | `gameSession.test.ts` create and id cases | Caller-value preservation, injected id, absent sequence, no ambient crypto | Complete | `src/engine/gameSession.ts` | `yourwolf-frontend/src/test/engine/gameSession.test.ts` | PENDING | PENDING |
| AC6 | Setup-only start and wake index initialization | `gameSession.test.ts` start cases | Setup to night, zero index, rejection and immutability | Complete | `src/engine/gameSession.ts` | `yourwolf-frontend/src/test/engine/gameSession.test.ts` | PENDING | PENDING |
| AC7 | Immutable one-step phase advancement | `gameSession.test.ts` transition table | Setup rejection, night through complete, terminal rejection, no mutation | Complete | `src/engine/gameSession.ts` | `yourwolf-frontend/src/test/engine/gameSession.test.ts` | PENDING | PENDING |
| AC8 | All 32 Python setup cases transcribed | `gameSetupValidation.test.ts` 32 oracle cases | Literal exact-message and warning parity cases, including both duplicate Python test seams | Complete | `src/engine/gameSetupValidation.ts` | `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts` | PENDING | PENDING |
| AC9 | Excluded capabilities remain absent | Code inspection and source search | No shuffle, dealing, counters, persistence, routing, timestamps, or wake-index advancement | Complete | `src/engine/gameSession.ts`, `src/engine/gameSetupValidation.ts` | `yourwolf-frontend/src/engine/gameSession.ts`, `yourwolf-frontend/src/engine/gameSetupValidation.ts` | PENDING | PENDING |
| AC10 | Tests, lint, build, and engine coverage | Full frontend and backend gates | Full frontend suite, backend oracle/service suites, lint, build, coverage | Complete | Four feature files | `/tmp/phase04a-feature03-frontend-final.xml`, `/tmp/phase04a-feature03-coverage-final.xml`, `/tmp/phase04a-feature03-backend.xml` | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Readonly create input with engine roles, dependencies, sequence, and id generator | Complete | `gameSetupValidation.ts`, `gameSession.ts` | Concrete names selected and recorded above. |
| AC2 | Python precedence order and atomic rejection | Complete | `gameSetupValidation.ts`, `gameSession.ts` | Validation completes before the injected id generator is called. |
| AC3 | Hard required dependencies and non-blocking recommended warnings | Complete | `gameSetupValidation.ts`, `gameSession.ts` | Warnings are readonly session data. |
| AC4 | Wake sequence edge cases and omitted sequence preservation | Complete | `gameSetupValidation.ts`, `gameSession.ts` | Returned and stored sequences are copied. |
| AC5 | Deterministic setup session creation | Complete | `gameSession.ts` | No ambient `crypto` reference. |
| AC6 | Setup-only start and zero wake index | Complete | `gameSession.ts` | Start error matches Python. |
| AC7 | Immutable phase transitions and terminal rejection | Complete | `gameSession.ts` | Setup advance uses the explicit engine-only tightening error. |
| AC8 | Thirty-two setup oracle cases | Complete | `gameSetupValidation.test.ts` | 34 tests total, including two extra vampire/alien primary-team paths. |
| AC9 | Excluded server and runtime capabilities absent | Complete | `gameSession.ts`, `gameSetupValidation.ts` | No callers are wired by design. |
| AC10 | Verification and coverage | Complete | Four feature files | Final frontend suite 679/679. Engine rows are at least 96.22% statements/lines, 95.23% branches, and 100% functions. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/engine/gameSetupValidation.ts` | Added | Added readonly setup/dependency contracts and ordered pure validation with exact Python messages and warning separation. | Ports setup rules without transport, database, or side effects. |
| `yourwolf-frontend/src/engine/gameSession.ts` | Added | Added readonly session value, injected id creation, setup start, and one-step phase transitions. | Provides the planned in-memory state machine with no runtime integration. |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts` | Added | Added 34 literal setup validation tests, including all 32 Python oracle cases and vampire/alien primary-team coverage. | AC1–AC4, AC8, and validation edge cases. |
| `yourwolf-frontend/src/test/engine/gameSession.test.ts` | Added | Added 12 creation, immutability, warning, injected-id, and transition tests. | AC1, AC5–AC7, AC9. |

## Test Results

- **Execution**: executed-green
- **Command**: `cd yourwolf-frontend && npm test -- --run --reporter=junit --outputFile=/tmp/phase04a-feature03-frontend-final.xml`
- **Results artifact**: `/tmp/phase04a-feature03-frontend-final.xml`
- **Baseline**: 629 passed, 0 failed, artifact `/tmp/phase04a-feature03-baseline.xml`
- **Final**: 679 total, 679 passed, 0 failed, artifact `/tmp/phase04a-feature03-frontend-final.xml`
- **New tests added**: 46
- **Affected suites run**: all frontend suites and engine tests; `uv run pytest --no-cov tests/test_game_setup_validation.py tests/test_game_service.py --junitxml=/tmp/phase04a-feature03-backend.xml` (55 total, 55 passed, 0 failed)
- **Coverage**: `cd yourwolf-frontend && npm run test:coverage -- --reporter=junit --outputFile=/tmp/phase04a-feature03-coverage-final.xml`; 679 total, 679 passed, 0 failed. `src/engine/` rows: gameSession 96.22% statements, 92.30% branches, 100% functions, 96.22% lines; gameSetupValidation 98.85%, 95.23%, 100%, 98.85%.
- **Lint**: `cd yourwolf-frontend && npm run lint` exited 0 with zero warnings.
- **Build**: `cd yourwolf-frontend && npm run build` exited 0.
- **Regressions**: None

## Review and Fix Loop

- **Resolved review agents**: `z-reviewer-plan-conformance` pending
- **Review findings**: None. No review pass has run yet.
- **Fix rounds**: 0
- **Carry-forward findings**: None
- **Fallback**: None

## Deviations from Plan

- Scalar bounds for `player_count`, `center_card_count`, and `discussion_timer_seconds` remain transport-boundary validation. The engine does not clone the Pydantic schema bounds because the plan leaves ownership unresolved and forbids importing transport DTOs.
- `advancePhase` rejects setup with `Game cannot be advanced: start the game first`. This pins the deliberate engine-only tightening because the Python service allows setup-to-night advancement. Python code remains unchanged.
- The test file has 34 setup tests rather than exactly 32 because it adds direct vampire and alien primary-team paths required by the plan's edge-case requirements.

## Gaps

None.

## Reviewer Focus Areas

- `gameSetupValidation.ts` rule ordering and exact error strings, especially multi-violation precedence.
- Duplicate role-id counting versus unique role metadata during card-count and primary-team checks.
- Hard dependency rejection versus recommended warning propagation into `GameSession`.
- `gameSession.ts` immutable transition behavior and the explicit setup-advance error.
- Engine import boundary and absence of ambient randomness, time, persistence, or transport dependencies.
