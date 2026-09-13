# Implementation Record: Narration Scripts and Preview

## Summary

Implemented the Phase 04a pure TypeScript narration engine. The module provides deterministic wake ordering, role/night script assembly, preview section headers, and duration summing. Static fixtures generated from the Python narration builders cover all 30 seed roles, including empty previews for Villager and Tanner.

Selected public names: `sortWakingRoles`, `buildRoleScript`,
`buildNightScript`, `buildPreview`, and `totalDurationSeconds`.

## Sibling Features

Feature 01 (`01-engine-types-templates`) supplies the engine types and templates consumed here. Feature 03 (`03-game-session-state-machine`) is independent at runtime and remains the next shared-engine feature. No sibling-owned files were changed.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | narration assembly | Opening, unique role blocks, closing, duration sum | Complete | `src/engine/narration.ts` | `src/test/engine/narration.test.ts` | 38b49f8 | PENDING |
| AC2 | AC2 | default ordering | Positive wake orders, null/zero filtering, name tie-break | Complete | `src/engine/narration.ts` | `src/test/engine/narration.test.ts` | 38b49f8 | PENDING |
| AC3 | AC3 | custom ordering | Unknown ids, repeated ids, named-first and unnamed fallback | Complete | `src/engine/narration.ts` | `src/test/engine/narration.test.ts` | 38b49f8 | PENDING |
| AC4 | AC4 | role assembly | Dense orders, unknown inherited names, OR and required flags | Complete | `src/engine/narration.ts` | `src/test/engine/narration.test.ts` | 38b49f8 | PENDING |
| AC5 | AC5 | preview assembly | Wake guard, copied-role header, sequential output | Complete | `src/engine/narration.ts` | `src/test/engine/narration.test.ts` | 38b49f8 | PENDING |
| AC6 | AC6 | night fixture parity | Default and complete custom parity for all 30 seed roles | Complete | `src/test/engine/night-script.fixture.json` | `src/test/engine/narration.test.ts` | 38b49f8 | PENDING |
| AC7 | AC7 | preview fixture parity | All 30 seed-role previews and empty non-waking previews | Complete | `src/test/engine/preview.fixture.json` | `src/test/engine/narration.test.ts` | 38b49f8 | PENDING |
| AC8 | AC8 | fixture provenance | One-time Python builder generation with deterministic ids/order | Complete | `src/test/engine/night-script.fixture.json`, `src/test/engine/preview.fixture.json` | Backend narration builders and committed fixtures | 38b49f8 | PENDING |
| AC9 | AC9 | verification suite | Full tests, lint, build, coverage, import boundary | Complete | All four feature files | `/tmp/yourwolf-phase04a-feature02-integrated.xml`, `/tmp/yourwolf-phase04a-feature02-coverage.xml` | 38b49f8 | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Build ordered night scripts and exact duration sums | Complete | `yourwolf-frontend/src/engine/narration.ts` | Separate `buildNightScript` and `totalDurationSeconds` preserve the Python split. |
| AC2 | Deterministic default wake ordering | Complete | `yourwolf-frontend/src/engine/narration.ts` | Positive wake orders only, ties compare names. |
| AC3 | Deterministic custom wake ordering | Complete | `yourwolf-frontend/src/engine/narration.ts` | Last repeated sequence position wins. |
| AC4 | Role action assembly and unknown-step handling | Complete | `yourwolf-frontend/src/engine/narration.ts` | Template owns OR text and unknown-step guard. |
| AC5 | Preview assembly and copied-role section header | Complete | `yourwolf-frontend/src/engine/narration.ts` | Null/zero wake orders return empty arrays. |
| AC6 | Night parity fixture | Complete | `yourwolf-frontend/src/test/engine/night-script.fixture.json` | Default and reversed complete custom sequence included. |
| AC7 | Preview parity fixture | Complete | `yourwolf-frontend/src/test/engine/preview.fixture.json` | Villager and Tanner are empty. |
| AC8 | Python fixture provenance | Complete | `src/test/engine/*.fixture.json` | Throwaway generator removed after generation. |
| AC9 | Edge evidence and quality gates | Complete | `src/test/engine/narration.test.ts` | Frontend suite, lint, build, and coverage all green. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/engine/narration.ts` | Added | Pure sorting, role/night assembly, preview mapping, and duration functions | Implements AC1–AC5 and the engine boundary in AC9 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-frontend/src/test/engine/narration.test.ts` | Added | 13 focused unit, fixture-shape, and fixture-parity tests | AC1–AC9 |
| `yourwolf-frontend/src/test/engine/night-script.fixture.json` | Added | Python-generated 30-role inputs and default/custom expected actions | AC6, AC8 |
| `yourwolf-frontend/src/test/engine/preview.fixture.json` | Added | Python-generated expected previews for all 30 roles | AC7, AC8 |

## Test Results

- **Execution**: executed-green
- **Command**: `cd yourwolf-frontend && npm test -- --run --reporter=junit --outputFile=/tmp/yourwolf-phase04a-feature02-integrated.xml`
- **Results artifact**: `/tmp/yourwolf-phase04a-feature02-integrated.xml`
- **Baseline**: 616 passed, 0 failed, from `/tmp/yourwolf-frontend-phase04a-baseline.xml`
- **Final**: 629 passed, 0 failed
- **New tests added**: 13
- **Affected suites run**: `src/test/engine/templates.test.ts`, `src/test/engine/narration.test.ts`, frontend integrated suite, backend narration/setup oracle suites (185 passed, 0 failed in `/tmp/yourwolf-phase04a-feature02-backend-all.xml`), lint, build, coverage
- **Regressions**: None

Additional gates:

- `cd yourwolf-frontend && npm run lint` — executed-green, zero warnings.
- `cd yourwolf-frontend && npm run build` — executed-green.
- `cd yourwolf-frontend && npm run test:coverage -- --reporter=junit --outputFile=/tmp/yourwolf-phase04a-feature02-coverage.xml` — executed-green, 629 passed, 0 failed. `src/engine/` coverage: 98.8% statements, 96.92% branches, 100% functions, 98.8% lines.
- `cd yourwolf-backend && uv run pytest --no-cov tests/test_narration_templates.py tests/test_narration_script_builder.py tests/test_script_service.py tests/test_game_setup_validation.py --junitxml=/tmp/yourwolf-phase04a-feature02-backend-all.xml` — executed-green, 185 passed, 0 failed.

## Review and Fix Loop

- **Resolved review agents**: `03c-reviewer-plan-conformance`
- **Review findings**: One low finding, fixed by removing backend-only condition metadata from the static engine fixture and adding a fixture-shape regression assertion.
- **Fix rounds**: 1
- **Carry-forward findings**: None
- **Fallback**: None

## Unfixed findings

None.

## Deviations from Plan

None. The preview fixture applies the planned service-boundary guard by storing empty arrays for null/zero wake-order roles, although the pure Python builder itself accepts a role without wake-order metadata.

## Gaps

None.

## Reviewer Focus Areas

- `sortWakingRoles` custom sequence map — verify last-position behavior and unnamed fallback ordering.
- `buildRoleScript` unknown-step branch — verify duration lookup is skipped after template rejection.
- `buildPreview` wake-order guard and single copied-role header.
- Static fixture provenance and independence from TypeScript production output.
