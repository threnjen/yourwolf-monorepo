# 01 Engine Types and Templates

## A. Requirements & Traceability

### Acceptance Criteria

1. **AC1:** The engine defines a readonly role input with `name`, `wake_target`, `ability_steps`, `id`, `wake_order`, `team`, `is_primary_team_role`, `min_count`, and `max_count`. It reuses the verified `Team` and `StepModifier` domain types without importing transport DTOs.
2. **AC2:** The engine defines readonly narration outputs equivalent to the verified Python `NarratorAction` and `NarratorPreviewAction` schemas. Script actions carry `order`, `role_name`, `instruction`, `duration_seconds`, and `requires_player_action`. Preview actions carry `order`, `instruction`, and `is_section_header`.
3. **AC3:** Pure TypeScript instruction rendering reproduces all 15 ability templates and every literal expectation in the 67-case `WAKE_CASES`, `INSTRUCTION_CASES`, and `DURATION_CASES` oracle.
4. **AC4:** Wake instructions support `player.self`, `team.werewolf`, `team.alien`, `team.vampire`, `role.` targets with underscores rewritten to spaces, and the null or unknown-string fallthrough to `player.self` behavior.
5. **AC5:** Step duration lookup reproduces `STEP_DURATIONS` and its five-second default. Unknown ability types return no instruction, so later assembly can skip them without adding duration.
6. **AC6:** The frozen `thumbs_up` output remains `Werewolfs, put your thumbs out.` while the werewolf wake instruction remains `Werewolves, wake up and look for other werewolves.`
7. **AC7:** The engine remains dependency-free pure TypeScript. It imports no React, DOM, Node, network, persistence, API, hook, component, page, style, or transport-type module.
8. **AC8:** If this feature introduces any direct engine call to `setStepModifier`, `moveStepUp`, or `moveStepDown`, the engine boundary rejects invalid indices and prevents a non-`none` first-step modifier without changing `src/domain/` semantics. If it introduces no such call, no speculative wrapper is added.
9. **AC9:** The transcribed template suite passes, the repository lint and build checks add no failures, and the `src/engine/` coverage rows meet at least 90 percent for lines, branches, functions, and statements.

### Non-goals

- Do not assemble full night scripts or previews. Feature 02 owns that work.
- Do not create, start, or advance game sessions. Feature 03 owns that work.
- Do not add API adapters, UI callers, persistence, logging, or configuration.
- Do not change `src/domain/`, narrator copy, Python files, or the global 80 percent coverage threshold.
- Do not add a barrel or path alias solely for this feature.

### Traceability

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1-AC2 | `yourwolf-frontend/src/engine/`; `yourwolf-frontend/src/domain/roleDraft.ts`; `yourwolf-frontend/src/domain/teams.ts` | Must-have automated test; code-review evidence only |
| AC3-AC6 | `yourwolf-frontend/src/engine/`; `yourwolf-backend/app/services/narration/templates.py` | Must-have automated test |
| AC7-AC8 | `yourwolf-frontend/src/engine/`; `yourwolf-frontend/eslint.config.js`; `yourwolf-frontend/src/domain/abilitySteps.ts` | Must-have automated test; code-review evidence only |
| AC9 | `yourwolf-frontend/src/test/engine/`; `yourwolf-frontend/vite.config.ts` | Must-have automated test |

## B. Correctness & Edge Cases

- Preserve literal copy for every parameter branch, including empty parameter objects and unknown targets.
- Treat null, empty, and unrecognized wake targets exactly as the Python reference does.
- Apply the `OR ` prefix only after a recognized instruction renders. Unknown ability types remain absent.
- Keep a zero-second duration for `stop`; use five seconds only for a recognized caller requesting a missing duration entry or an unknown type queried directly.
- Keep input and output values immutable from the caller's perspective.
- No retries, timeouts, concurrency, or idempotency machinery applies because these functions perform no I/O and hold no state.

## C. Consistency & Architecture Fit

- Follow named ES module exports and the existing narrow-domain-shape pattern in `src/domain/`.
- Reuse `Team` and `StepModifier`; do not reuse `RoleDraft`, `AbilityStepDraft`, or transport DTOs as engine inputs.
- Preserve the verified Python contracts `AbilityStepInput`, `RoleScriptInput`, `STEP_DURATIONS`, `build_wake_instruction`, `build_step_instruction`, and `get_step_duration` semantically.
- New TypeScript public names remain `[PROPOSED - name TBD]` until implementation selects idiomatic names. Candidate names are `[PROPOSED - name TBD] EngineRoleInput`, `[PROPOSED - name TBD] EngineAbilityStepInput`, `[PROPOSED - name TBD] NarratorAction`, `[PROPOSED - name TBD] NarratorPreviewAction`, `[PROPOSED - name TBD] buildWakeInstruction`, `[PROPOSED - name TBD] buildStepInstruction`, and `[PROPOSED - name TBD] getStepDuration`.
- Expected new module paths are `[PROPOSED - name TBD] yourwolf-frontend/src/engine/types.ts` and `[PROPOSED - name TBD] yourwolf-frontend/src/engine/templates.ts`.

## D. Clean Design & Maintainability

- Use module-level pure functions and readonly interfaces. Do not introduce service classes or mutable registries.
- Keep the literal template table independent from test expectations. Tests must transcribe the Python oracle rather than derive expected strings from production constants.
- Keep it clean:
  - Export only contracts used by sibling engine modules.
  - Keep the 15-template dispatch exhaustive and local.
  - Preserve copied field names exactly.
  - Avoid compatibility aliases, adapters, and future-facing options.

## E. Completeness: Observability, Security, Operability

- **Observability:** Add no normal-path logs. This is deterministic local logic with no boundary operations, and logging would pollute tests and future narration loops.
- **Security:** Accept no ambient globals or external data directly. Phase 04b will validate transport inputs before adapting them.
- **Runbook:** Verify with the phase-scoped Vitest suite, full frontend lint, build, and coverage report. Roll back by removing this feature's engine modules and tests because no caller exists. Monitor only CI parity and coverage results.

## F. Test Plan

- Transcribe all literal `WAKE_CASES`, `INSTRUCTION_CASES`, and `DURATION_CASES` into Vitest. **Must-have automated test.** Covers AC3-AC6.
- Add compile-time or runtime shape evidence for required role and narration fields. **Must-have automated test; code-review evidence only.** Covers AC1-AC2.
- Probe the ESLint boundary with a temporary forbidden import and confirm the configured rule rejects it. Do not commit the probe. **Code-review evidence only.** Covers AC7.
- If a domain editing helper becomes a direct dependency, test negative, oversized, and first-step indices at the engine boundary. **Must-have automated test.** Covers AC8.
- Read `src/engine/` rows from `npm run test:coverage` and enforce the four 90 percent measures in QA evidence. **Must-have automated test.** Covers AC9.

Top five high-value checks:

1. Given every transcribed instruction case, when rendered, then the exact Python literal matches.
2. Given every supported and fallback wake target, when rendered, then the exact wake copy matches.
3. Given every duration case plus an unknown type, when queried, then the exact duration matches.
4. Given `thumbs_up` for `team.werewolf`, when rendered, then the frozen `Werewolfs` spelling remains.
5. Given an unknown ability with `or`, when rendered, then no instruction exists and no prefix is produced.

Test data comes from the literal Python tables. No mocks, server, DOM, database, or generated fixture is required.

## Stage 1: Shared Engine Contracts
**Goal**: Define the minimal readonly input and narration output contracts shared by the phase.
**Success Criteria**: AC1, AC2, AC7, and the conditional boundary rule in AC8 are satisfied.
**Status**: Not Started

## Stage 2: Frozen Templates and Durations
**Goal**: Port the complete instruction, wake, modifier, and duration behavior.
**Success Criteria**: AC3 through AC6 pass against literal transcribed expectations.
**Status**: Not Started

## Stage 3: Verification
**Goal**: Prove parity, boundary enforcement, build health, and coverage.
**Success Criteria**: AC9 passes with no changes outside the phase's allowed source and test directories.
**Status**: Not Started
