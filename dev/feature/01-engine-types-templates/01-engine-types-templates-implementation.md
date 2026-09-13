# Implementation Record: 01 Engine Types and Templates

## Summary

Implemented the pure TypeScript engine contracts and frozen narration template port. The engine defines readonly role, ability-step, and narrator output shapes, renders all 15 verified ability templates, handles wake-target fallthrough and modifiers, and applies duration defaults without I/O or runtime integration.

## Sibling Features

Feature `02-narration-scripts-preview` consumes these role, step, narration, template, and duration contracts for script assembly. Feature `03-game-session-state-machine` consumes the role metadata contract for session setup. No sibling files were modified.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | Engine role and step contracts | `templates.test.ts` shape test | Typed construction and required-key assertions | Complete | `src/engine/types.ts`, `src/test/engine/templates.test.ts` | `yourwolf-frontend/src/engine/types.ts`, `yourwolf-frontend/src/test/engine/templates.test.ts` | PENDING | PENDING |
| AC2 | Narrator output contracts | `templates.test.ts` shape test | Typed construction and required-key assertions | Complete | `src/engine/types.ts`, `src/test/engine/templates.test.ts` | `yourwolf-frontend/src/engine/types.ts`, `yourwolf-frontend/src/test/engine/templates.test.ts` | PENDING | PENDING |
| AC3 | All frozen instruction templates | `templates.test.ts` instruction matrix | Literal table transcriptions and exact string equality | Complete | `src/engine/templates.ts`, `src/test/engine/templates.test.ts` | `yourwolf-frontend/src/test/engine/templates.test.ts`, `yourwolf-backend/tests/test_narration_templates.py` | PENDING | PENDING |
| AC4 | Wake-target rendering and fallthrough | `templates.test.ts` wake matrix | Literal wake cases, null/empty fallback, underscore rewrite | Complete | `src/engine/templates.ts`, `src/test/engine/templates.test.ts` | `yourwolf-frontend/src/test/engine/templates.test.ts` | PENDING | PENDING |
| AC5 | Duration lookup and unknown instruction behavior | `templates.test.ts` duration matrix | Literal durations, unknown duration default, unknown instruction omission | Complete | `src/engine/templates.ts`, `src/test/engine/templates.test.ts` | `yourwolf-frontend/src/test/engine/templates.test.ts`, `yourwolf-frontend/coverage/lcov.info` | PENDING | PENDING |
| AC6 | Frozen `Werewolfs` and wake copy distinction | `templates.test.ts` thumbs-up and wake cases | Exact literal assertions for both outputs | Complete | `src/engine/templates.ts`, `src/test/engine/templates.test.ts` | `yourwolf-frontend/src/test/engine/templates.test.ts` | PENDING | PENDING |
| AC7 | Dependency-free engine boundary | Temporary ESLint boundary probe | Deliberate React and `src/types` imports rejected, probe removed | Complete | `src/engine/types.ts`, `src/engine/templates.ts` | `yourwolf-frontend/eslint.config.js`, `yourwolf-frontend/src/engine/` | PENDING | PENDING |
| AC8 | Conditional domain helper boundary | Static implementation review | No calls to `setStepModifier`, `moveStepUp`, or `moveStepDown` found | Not applicable | `src/engine/` | `yourwolf-frontend/src/engine/templates.ts` | PENDING | PENDING |
| AC9 | Phase verification and engine coverage | Full frontend suite and coverage | Vitest, lint, build, and v8 coverage | Complete | `src/engine/`, `src/test/engine/templates.test.ts` | `/tmp/phase04a-final.json`, `yourwolf-frontend/coverage/lcov.info` | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Readonly engine role and step inputs reuse `Team` and `StepModifier`. | Complete | `yourwolf-frontend/src/engine/types.ts` | Nested step arrays and parameter records are readonly. |
| AC2 | Readonly narrator script and preview outputs mirror the verified fields. | Complete | `yourwolf-frontend/src/engine/types.ts` | Engine-local declarations do not import transport DTOs. |
| AC3 | All 15 instruction templates match the Python oracle. | Complete | `yourwolf-frontend/src/engine/templates.ts`, `yourwolf-frontend/src/test/engine/templates.test.ts` | 75 focused tests pass, including every literal branch. |
| AC4 | Wake targets render recognized teams, roles, self, and fallbacks. | Complete | `yourwolf-frontend/src/engine/templates.ts`, `yourwolf-frontend/src/test/engine/templates.test.ts` | Null and empty targets use the self path. |
| AC5 | Durations and unknown instruction behavior match the reference. | Complete | `yourwolf-frontend/src/engine/templates.ts`, `yourwolf-frontend/src/test/engine/templates.test.ts` | `stop` is zero seconds and unknown durations default to five. |
| AC6 | Frozen `Werewolfs` thumbs-up copy remains distinct from wake copy. | Complete | `yourwolf-frontend/src/engine/templates.ts`, `yourwolf-frontend/src/test/engine/templates.test.ts` | The known spelling bug is intentionally preserved. |
| AC7 | Engine remains pure TypeScript with inward-only dependencies. | Complete | `yourwolf-frontend/src/engine/types.ts`, `yourwolf-frontend/src/engine/templates.ts` | Boundary probe rejected React and transport imports. |
| AC8 | Engine does not call domain step-editing helpers. | Not applicable | None | No speculative wrapper was added. |
| AC9 | Tests, lint, build, and engine coverage satisfy phase gates. | Complete | `yourwolf-frontend/src/test/engine/templates.test.ts` | Engine aggregate coverage is above 90% for all four measures. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/engine/types.ts` | Created | Added readonly engine role, step, narrator action, and preview action contracts. | Provides the shared pure engine API for sibling features. |
| `yourwolf-frontend/src/engine/templates.ts` | Created | Added frozen duration map, wake rendering, 15-template dispatch, modifier handling, and duration lookup. | Ports the verified Python narration behavior to TypeScript. |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/test/engine/templates.test.ts` | Created | Added independent literal wake, instruction, duration, modifier, unknown-type, frozen-copy, and shape tests. | AC1–AC7 and AC9. |

## Test Results

- **Execution**: executed-green
- **Command**: `npm test -- --run --reporter=json --outputFile=/tmp/phase04a-final.json`
- **Results artifact**: `/tmp/phase04a-final.json`
- **Baseline**: 535 passed, 0 failed (`/tmp/phase04a-baseline.json`)
- **Final**: 610 passed, 0 failed
- **New tests added**: 75
- **Affected suites run**: full frontend Vitest suite; `uv run pytest --no-cov tests/test_narration_templates.py tests/test_script_service.py tests/test_game_setup_validation.py --junitxml=/tmp/phase04a-backend-nocov.xml`
- **Regressions**: None

Additional verification passed with `npm run lint` and `npm run build`. `npm run test:coverage` passed. The `src/engine/` aggregate in `yourwolf-frontend/coverage/lcov.info` reports 98.89% lines/statements, 98.70% branches, and 100% functions. The default-coverage backend command also ran 157 tests with zero test failures but exited on its 64.15% targeted-run aggregate coverage, so the backend regression result above uses the no-coverage runner.

## Review and Fix Loop

- **Resolved review agents**: None yet
- **Review findings**: None yet
- **Fix rounds**: 0
- **Carry-forward findings**: None
- **Fallback**: None

## Deviations from Plan

- The local engine contract import uses `./types.ts` because the existing ESLint boundary pattern `**/types` also matches the same-directory `./types` specifier. A temporary probe confirmed the intended React and transport restrictions remain active.

## Gaps

- `types.ts` contains erased interfaces, so its individual v8 row is zero at runtime. The `src/engine/` aggregate exceeds the required 90% lines, branches, functions, and statements.
- No runtime caller exists by design. Feature 04b owns engine integration.

## Reviewer Focus Areas

- `yourwolf-frontend/src/engine/templates.ts` — compare each branch and frozen literal against `yourwolf-backend/app/services/narration/templates.py`.
- `yourwolf-frontend/src/engine/types.ts` — confirm readonly nested containers and domain-only type imports.
- `yourwolf-frontend/src/test/engine/templates.test.ts` — confirm expected strings remain independent from production dispatch and duration constants.
- `yourwolf-frontend/eslint.config.js` — note that the temporary forbidden-import probe rejected both React and `src/types` imports.
