# 03 Game Session State Machine

## Plan Metadata

- `plan_revision`: `3`
- `last_validation_commit`: `ae43d4f11a0207c590f78bae07a8520ca1b04b2b`
- `stale_reason`: `none` — revalidated after `02-narration-scripts-preview`; its narration-only source and fixtures neither changed the reviewed `EngineRoleInput` contract nor claimed this feature's proposed modules.

## A. Requirements & Traceability

### Acceptance Criteria

1. **AC1:** The engine defines an in-memory session create input containing `player_count`, `center_card_count`, `discussion_timer_seconds`, `role_ids`, optional `wake_order_sequence`, readonly `EngineRoleInput` values, selected-role dependency data, and an injected id generator.
2. **AC2:** Create evaluates setup rules in Python precedence order and rejects the first violation without producing a session: total role count, known role ids, per-role minimum and maximum counts, primary-team requirements, role dependencies, then wake-order sequence validity.
3. **AC3:** Required dependencies reject with the Python message. Missing recommended dependencies return the same warning text while allowing session creation.
4. **AC4:** Wake sequences reject duplicates, ids outside selected roles, selected roles that do not wake, and omission of any selected waking role. Omitted sequences remain absent.
5. **AC5:** Successful create returns a new setup-phase session with caller-supplied setup values and a deterministic id from the injected generator. Engine code never reads ambient `crypto`.
6. **AC6:** Start succeeds only from setup, returns a night-phase session, and sets `current_wake_order` to zero. A rejected start does not mutate the input session.
7. **AC7:** Advance rejects setup, moves exactly one phase through night → discussion → voting → resolution → complete, rejects complete as terminal, and never mutates the input session on success or failure.
8. **AC8:** All 32 cases in `tests/test_game_setup_validation.py` are transcribed as the validation oracle, including rule precedence and satisfied-with-warning dependency behavior.
9. **AC9:** The engine does not port role shuffling, player/center position assignment, role usage counters, persistence, refresh identity, routing, or wake-index advancement.
10. **AC10:** State-machine and setup tests pass, lint and build add no failures, and all `src/engine/` coverage rows meet at least 90 percent for lines, branches, functions, and statements.

### Non-goals

- Do not implement narration assembly or preview behavior from Feature 02.
- Do not wire the session into hooks, pages, routing, API clients, or browser storage.
- Do not add shuffle or timestamp providers. The phase explicitly excludes dealing and does not require session timestamps.
- Do not change Python validation, `src/domain/` behavior, transport DTOs, or the frontend coverage threshold.

### Traceability

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1, AC5 | `yourwolf-frontend/src/engine/`; Feature 01 engine types | Must-have automated test; code-review evidence only |
| AC2-AC4, AC8 | `yourwolf-backend/app/services/game_setup_validation.py`; `yourwolf-backend/tests/test_game_setup_validation.py`; `yourwolf-frontend/src/engine/` | Must-have automated test |
| AC6-AC7 | `yourwolf-backend/app/services/game_service.py`; `yourwolf-backend/app/models/game_session.py`; `yourwolf-frontend/src/engine/` | Must-have automated test |
| AC9 | `yourwolf-frontend/src/engine/` | Code-review evidence only |
| AC10 | `yourwolf-frontend/src/test/engine/`; `yourwolf-frontend/vite.config.ts` | Must-have automated test |

## B. Correctness & Edge Cases

- Preserve the first-error rule order and exact error text. Multi-violation cases must prove the later rule would also fail.
- Count duplicate role ids as multiple cards while resolving role metadata uniquely.
- Evaluate primary-team rules for werewolf, vampire, and alien teams; village and neutral need no primary role.
- Separate hard `requires` dependency failures from soft `recommends` warnings.
- Reject invalid create atomically. No partial session value or mutated input survives.
- Reject start outside setup, advance during setup, and advance after complete without state change.
- Start is the only exit from setup. `current_wake_order` never increments in this phase.
- Synchronous local functions need no retry, timeout, or concurrency mechanism. Repeated calls with equal inputs and an equal id generator result produce equal sessions.

## C. Consistency & Architecture Fit

- Consume the verified readonly `EngineRoleInput` contract from `yourwolf-frontend/src/engine/types.ts`, including `id`, `wake_order`, `team`, `is_primary_team_role`, `min_count`, and `max_count`. Do not depend on Feature 02.
- Preserve the verified Python `GamePhase` values: `setup`, `night`, `discussion`, `voting`, `resolution`, and `complete`.
- Preserve `GameSessionCreate` field names and the dependency fields `role_id`, `required_role_id`, and `dependency_type` where they cross the port contract.
- New public names remain `[PROPOSED - name TBD]`: `[PROPOSED - name TBD] GameSession`, `[PROPOSED - name TBD] GameSessionCreateInput`, `[PROPOSED - name TBD] RoleDependencyInput`, `[PROPOSED - name TBD] IdGenerator`, `[PROPOSED - name TBD] createGameSession`, `[PROPOSED - name TBD] startGame`, and `[PROPOSED - name TBD] advancePhase`.
- Expected new module paths are `[PROPOSED - name TBD] yourwolf-frontend/src/engine/gameSession.ts` and `[PROPOSED - name TBD] yourwolf-frontend/src/engine/gameSetupValidation.ts`.
- Cross-feature contract resolved: Feature 01 exposes all role metadata AC1 needs through `EngineRoleInput`.

## D. Clean Design & Maintainability

- Use pure functions that return new readonly session values. Avoid a stateful service class, repository abstraction, or event system.
- Keep validation separate from transition logic because they change for different reasons and mirror separate Python sources.
- Represent expected invalid operations with one consistent error mechanism and exact messages. Do not add an error hierarchy without a second need.
- Keep it clean:
  - Inject only id generation.
  - Keep phase order declared once.
  - Preserve validation order visibly.
  - Avoid persistence seams and future routing hooks.

## E. Completeness: Observability, Security, Operability

- **Observability:** Add no normal-path logs. Pure return values and exact rejection messages make state transitions diagnosable without side effects.
- **Security:** Validate caller-supplied ids, counts, dependencies, and sequences before constructing state. Do not trust ambient globals.
- **Runbook:** Run the state-machine suite, full frontend tests, lint, build, and coverage. Roll back by removing the session and validation modules because Phase 04a has no callers. Monitor CI transition, oracle, and coverage failures.

## F. Test Plan

- Transcribe all 32 setup cases, including exact messages and warnings. **Must-have automated test.** Covers AC2-AC4 and AC8.
- Add transition-table tests for every valid and invalid phase operation. **Must-have automated test.** Covers AC6-AC7.
- Assert rejected operations preserve reference values or deep state, and successful operations do not mutate inputs. **Must-have automated test.** Covers AC2, AC6, and AC7.
- Inject a fixed id generator and verify deterministic output plus absence of ambient `crypto` references. **Must-have automated test; code-review evidence only.** Covers AC5.
- Inspect all `src/engine/` coverage rows for the four 90 percent measures. **Must-have automated test.** Covers AC10.

Top five high-value checks:

1. Given a payload violating adjacent validation rules, when create runs, then the earlier Python rule's exact message wins and the later rule is independently proven live.
2. Given a missing `requires` dependency and a missing `recommends` dependency, when create runs, then the hard case rejects and the soft case returns the exact warning.
3. Given duplicate, extra, non-waking, or incomplete wake sequences, when create runs, then each exact validation result matches the oracle.
4. Given setup, when start then repeated advance runs, then the complete phase path and zero wake index match the contract.
5. Given invalid start or advance calls, when rejected, then the original session remains unchanged.

Test data should transcribe the Python role/dependency fixtures into small literal engine shapes. No database, mocks, DOM, server, time provider, or random generator is required.

## Stage 1: Setup Validation Port
**Goal**: Port the complete ordered setup rule set and warnings over caller-supplied role data.
**Success Criteria**: AC1 through AC5 and AC8 pass against the transcribed oracle.
**Status**: Not Started

## Stage 2: Immutable Phase Transitions
**Goal**: Implement create, start, and advance as pure immutable state operations.
**Success Criteria**: AC6, AC7, and AC9 pass with the full phase path pinned.
**Status**: Not Started

## Stage 3: Verification
**Goal**: Prove oracle parity, transition safety, boundary purity, build health, and coverage.
**Success Criteria**: AC10 passes with no source or test changes outside the phase's allowed directories.
**Status**: Not Started
