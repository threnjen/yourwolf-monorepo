# PHASE_04A Execution Manifest

## Phase Source

- Phase document: `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md`
- Run mode: `revalidation`
- Project discovery context: not provided
- Phase discovery context: not provided
- Last validation commit: `989a3591b57b4d341286b55d295415af5d1af6a4`
- Scheduling rule: Features execute one at a time. Read and write sets support revalidation and never authorize concurrent builds.

## Phase-Level Discovery

| Property | Value |
|---|---|
| Tech stack | TypeScript 5.3, Vite 5.4, Vitest 2.1 with v8 coverage; Python 3.14 reference implementation |
| Test runner | `cd yourwolf-frontend && npm test -- --run` |
| Test baseline | Frontend `executed-green` at `ae43d4f`: 629 total, 629 passed, 0 failed. Backend oracle `executed-green`: 185 total, 185 passed, 0 failed. Final unfiltered validation at `989a359`: frontend 679 total, 679 passed, 0 failed; backend 492 total, 492 passed, 0 failed. |
| Coverage baseline | `cd yourwolf-frontend && npm run test:coverage` passed after Feature 03. All `src/engine/` modules exceed the phase's 90% thresholds: at least 96.22% statements and lines, 92.85% branches, and 100% functions. |
| Lint | `cd yourwolf-frontend && npm run lint` passed with zero warnings on 2026-09-13. |
| Format | Not configured in `yourwolf-frontend/package.json`. |
| Build | `cd yourwolf-frontend && npm run build` passed on 2026-09-13. |
| Phase-scoped test pattern | `yourwolf-frontend/src/test/engine/**/*.test.ts`; `templates.test.ts`, `narration.test.ts`, `gameSetupValidation.test.ts`, and `gameSession.test.ts` exist. Separate module-focused files remain recommended instead of one consolidated file. |
| Allowed implementation scope | `yourwolf-frontend/src/engine/` and `yourwolf-frontend/src/test/engine/` only. Pipeline records and documentation are exempt. |

## Ordered Feature List

| Order | Feature | Status | Prerequisites | Sequential reason |
|---|---|---|---|---|
| 1 | `01-engine-types-templates` | complete | None | Establishes shared engine role, step, output, template, and duration contracts. |
| 2 | `02-narration-scripts-preview` | complete | `01-engine-types-templates` | Uses Feature 01 contracts and templates to assemble scripts, previews, sorting, and fixtures. |
| 3 | `03-game-session-state-machine` | complete | `01-engine-types-templates` | Uses Feature 01 role metadata. Its later order avoids shared `src/engine/` scope collisions with Feature 02, though no runtime dependency exists between Features 02 and 03. |

## Prerequisite Graph

```text
01-engine-types-templates
├── 02-narration-scripts-preview
└── 03-game-session-state-machine
```

The graph has no integration/bootstrap feature. Phase 04a deliberately creates unused, independently callable engine APIs and forbids caller wiring. Phase 04b owns runtime integration and end-to-end smoke testing.

## Feature Records

### 01-engine-types-templates

- `status`: `complete`
- `execution_order`: `1`
- `prerequisites`: `[]`
- `expected_read_set`:
  - `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md`
  - `docs/learnings/cross-phase-decisions.md`
  - `yourwolf-backend/app/services/narration/inputs.py`
  - `yourwolf-backend/app/services/narration/templates.py`
  - `yourwolf-backend/tests/test_narration_templates.py`
  - `yourwolf-frontend/src/domain/roleDraft.ts`
  - `yourwolf-frontend/src/domain/teams.ts`
  - `yourwolf-frontend/src/domain/abilitySteps.ts`
  - `yourwolf-frontend/eslint.config.js`
- `expected_write_set`:
  - `yourwolf-frontend/src/engine/**` for shared types and templates
  - `yourwolf-frontend/src/test/engine/**` for literal template parity tests
- `plan_revision`: `1`
- `last_validation_commit`: `bd6187073de968fee3533c1b441a97db268fe8bc`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `implementation_result`: `complete`
- `implementation_commit`: `02fd12d`
- `review_agent`: `z-reviewer-plan-conformance`
- `review_commit`: `bd61870`
- `review_verdict`: `Approved`
- `fix_round_count`: `1`
- `carry_forward_findings`: `none`
- `validation_evidence`:
  - Frontend `executed-green`: `npm test -- --run --reporter=json --outputFile=/tmp/phase04a-orchestrator-feature01.json`; 616 total, 616 passed, 0 failed.
  - Backend oracle `executed-green`: `uv run pytest --no-cov tests/test_narration_templates.py tests/test_script_service.py tests/test_game_setup_validation.py --junitxml=/tmp/phase04a-orchestrator-feature01-backend.xml`; 157 total, 157 passed, 0 failed.

### 02-narration-scripts-preview

- `status`: `complete`
- `execution_order`: `2`
- `prerequisites`: `[01-engine-types-templates]`
- `expected_read_set`:
  - `dev/feature/01-engine-types-templates/01-engine-types-templates-implementation.md`
  - `dev/feature/01-engine-types-templates/reviews/03c-reviewer-plan-conformance-report.md`
  - `yourwolf-frontend/src/engine/types.ts`
  - `yourwolf-frontend/src/engine/templates.ts`
  - `yourwolf-backend/app/services/narration/script_builder.py`
  - `yourwolf-backend/app/services/script_service.py`
  - `yourwolf-backend/tests/test_script_service.py`
  - `yourwolf-backend/app/seed/data/roles.json`
  - `yourwolf-frontend/src/domain/wakeOrder.ts`
- `expected_write_set`:
  - `yourwolf-frontend/src/engine/**` for narration assembly and ordering
  - `yourwolf-frontend/src/test/engine/**` for narration tests and two parity fixtures
- `plan_revision`: `2`
- `last_validation_commit`: `ae43d4f11a0207c590f78bae07a8520ca1b04b2b`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `implementation_result`: `complete`
- `implementation_commit`: `38b49f8`
- `review_agent`: `z-reviewer-plan-conformance`
- `review_commit`: `ae43d4f`
- `review_verdict`: `Approved`
- `fix_round_count`: `1`
- `carry_forward_findings`: `none`
- `validation_evidence`:
  - Frontend `executed-green`: `npm test -- --run --reporter=junit --outputFile=/tmp/phase04a-orchestrator-feature02.xml`; 629 total, 629 passed, 0 failed.
  - Backend oracle `executed-green`: `uv run pytest --no-cov tests/test_narration_templates.py tests/test_narration_script_builder.py tests/test_script_service.py tests/test_game_setup_validation.py --junitxml=/tmp/phase04a-orchestrator-feature02-backend.xml`; 185 total, 185 passed, 0 failed.

### 03-game-session-state-machine

- `status`: `complete`
- `execution_order`: `3`
- `prerequisites`: `[01-engine-types-templates]`
- `expected_read_set`:
  - `dev/feature/01-engine-types-templates/01-engine-types-templates-implementation.md`
  - `dev/feature/01-engine-types-templates/reviews/03c-reviewer-plan-conformance-report.md`
  - `dev/feature/02-narration-scripts-preview/02-narration-scripts-preview-implementation.md`
  - `dev/feature/02-narration-scripts-preview/reviews/03c-reviewer-plan-conformance-report.md`
  - `yourwolf-frontend/src/engine/types.ts`
  - `yourwolf-frontend/src/engine/narration.ts`
  - `yourwolf-frontend/src/test/engine/narration.test.ts`
  - `yourwolf-backend/app/services/game_setup_validation.py`
  - `yourwolf-backend/app/services/game_service.py`
  - `yourwolf-backend/app/models/game_session.py`
  - `yourwolf-backend/app/models/role.py`
  - `yourwolf-backend/app/models/role_dependency.py`
  - `yourwolf-backend/app/schemas/game.py`
  - `yourwolf-backend/tests/test_game_setup_validation.py`
- `expected_write_set`:
  - `yourwolf-frontend/src/engine/**` for setup validation and session transitions
  - `yourwolf-frontend/src/test/engine/**` for setup and state-machine tests
- `plan_revision`: `3`
- `last_validation_commit`: `989a3591b57b4d341286b55d295415af5d1af6a4`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `implementation_result`: `complete`
- `implementation_commit`: `2e6fb65`
- `review_agent`: `z-reviewer-plan-conformance`
- `review_commit`: `989a359`
- `review_verdict`: `Approved`
- `fix_round_count`: `1`
- `carry_forward_findings`: `none`
- `validation_evidence`:
  - Frontend `executed-green`: `npm test -- --run --reporter=junit --outputFile=/tmp/phase04a-orchestrator-final-feature-frontend.xml`; 679 total, 679 passed, 0 failed.
  - Backend `executed-green`: `uv run pytest --junitxml=/tmp/phase04a-orchestrator-final-feature-backend.xml`; 492 total, 492 passed, 0 failed.

## Expected Bundle Files

| Feature | Lightweight plan | Context | Tasks |
|---|---|---|---|
| `01-engine-types-templates` | `dev/feature/01-engine-types-templates/01-engine-types-templates-plan.md` | `dev/feature/01-engine-types-templates/01-engine-types-templates-context.md` | `dev/feature/01-engine-types-templates/01-engine-types-templates-tasks.md` |
| `02-narration-scripts-preview` | `dev/feature/02-narration-scripts-preview/02-narration-scripts-preview-plan.md` | `dev/feature/02-narration-scripts-preview/02-narration-scripts-preview-context.md` | `dev/feature/02-narration-scripts-preview/02-narration-scripts-preview-tasks.md` |
| `03-game-session-state-machine` | `dev/feature/03-game-session-state-machine/03-game-session-state-machine-plan.md` | `dev/feature/03-game-session-state-machine/03-game-session-state-machine-context.md` | `dev/feature/03-game-session-state-machine/03-game-session-state-machine-tasks.md` |

## Verification Assets

### New automated assets

- `yourwolf-frontend/src/test/engine/templates.test.ts`: verified Feature 01 template oracle, contract, boundary, and inherited-name regression tests.
- `yourwolf-frontend/src/test/engine/narration.test.ts`: verified ordering, assembly, modifiers, filtering, duration, preview, and fixture-shape cases.
- `yourwolf-frontend/src/test/engine/gameSession.test.ts`: verified create, start, advance, immutability, and injected-id cases.
- `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts`: verified setup validation oracle, including the 32 Python cases and explicit null handling.
- `yourwolf-frontend/src/test/engine/night-script.fixture.json`: verified Python-generated 30-role script parity data.
- `yourwolf-frontend/src/test/engine/preview.fixture.json`: verified Python-generated 30-role preview parity data.

### Existing shared verification assets

- `yourwolf-frontend/vite.config.ts`: existing Vitest and global coverage configuration; read only.
- `yourwolf-frontend/eslint.config.js`: existing `src/engine/**` import boundary; read only and probe-tested.
- `yourwolf-backend/tests/test_narration_templates.py`: literal 67-case source oracle; read only.
- `yourwolf-backend/tests/test_script_service.py`: assembly source behavior; read only.
- `yourwolf-backend/tests/test_game_setup_validation.py`: 32-case setup source oracle; read only.

### Manual QA

- None. The phase has no UI changes or callers. Phase 04b owns end-to-end manual game-flow and preview checks.

## Fidelity Record

| Phase requirement | Feature mapping | Departure |
|---|---|---|
| Deliverable 1: engine types and templates | `01-engine-types-templates` | None |
| Deliverable 2: script generator and preview | `02-narration-scripts-preview` | None |
| Deliverable 3: game session state machine | `03-game-session-state-machine` | None |
| Suggested order: 1 → 2 → 3 | Execution order 1 → 2 → 3 | None |
| Feature 3 depends on Feature 1 and not Feature 2 | Graph edges from 01 to 02 and 03 | None |
| Engine-boundary guards for domain editing helpers | Feature 01 conditional AC8 | No helper is required by the current engine scope. The plan forbids speculative wrappers but requires guards if implementation introduces a direct call. |
| Runtime integration | Deferred to Phase 04b | Not a phase departure. Phase 04a explicitly forbids callers and declares no user-visible change. |

No requirement was moved, deferred beyond its stated phase, renamed as established, reordered, split, merged, or delayed.

## Revalidation Triggers

- All scheduled revalidation triggers are satisfied. No future feature or downstream dependent remains in Phase 04a.

## Revalidation History

### After 01-engine-types-templates

- Fixed point reached in one round at `bd6187073de968fee3533c1b441a97db268fe8bc`.
- Rewrote `02-narration-scripts-preview` to consume the verified `EngineRoleInput`, `EngineAbilityStepInput`, `NarratorAction`, `NarratorPreviewAction`, `buildWakeInstruction`, `buildStepInstruction`, and `getStepDuration` contracts. The rewrite assigns `OR` prefixing to `buildStepInstruction`, prevents assembly from duplicating it, and adds direct inherited object-property names to unknown-step test scope because review commit `bd61870` hardened that boundary.
- Rewrote `03-game-session-state-machine` to consume the verified `EngineRoleInput` role metadata fields and marked its cross-feature contract resolved.
- No feature was reordered, split, merged, or delayed. The prerequisite graph remains `01 → 02` and `01 → 03`; Feature 03 still has no runtime dependency on Feature 02.

### After 02-narration-scripts-preview

- Fixed point reached in one round at `ae43d4f11a0207c590f78bae07a8520ca1b04b2b`.
- Revalidated `03-game-session-state-machine` against `src/engine/narration.ts`, the narration tests and fixtures, and the unchanged reviewed `EngineRoleInput` contract in `src/engine/types.ts`.
- No substantive plan rewrite was required. Only plan metadata changed because Feature 02 did not claim the then-proposed `gameSession.ts` or `gameSetupValidation.ts` modules, change Feature 03's acceptance criteria, or introduce a runtime dependency.
- No feature was reordered, split, merged, or delayed. The prerequisite graph remains `01 → 02` and `01 → 03`; Feature 03 still depends only on Feature 01.

### After 03-game-session-state-machine

- Fixed point reached in one round at `989a3591b57b4d341286b55d295415af5d1af6a4`.
- Marked Feature 03 complete from implementation commit `2e6fb65` and approved review commit `989a359` after one fix round with no carry-forward findings.
- No future feature or downstream dependent exists, so no plan rewrite was required.
- No feature was reordered, split, merged, or delayed. The prerequisite graph remains `01 → 02` and `01 → 03`; all three feature records are complete.
- Final unfiltered validation was green: frontend 679/679 and backend 492/492.

## Quality Checklist Result

- All phase requirements are represented by numbered acceptance criteria and explicit non-goals.
- Each plan maps acceptance criteria to code areas and evidence categories.
- All concrete names are verified. Feature 01 names were validated at `bd61870`, Feature 02 narration assets at `ae43d4f`, and Feature 03 session assets at `989a359`.
- Feature 01 contains the shared public contracts required downstream.
- Edge cases, exact error behavior, operability, security, and test impact are covered.
- The existing frontend baseline exceeds 50 percent, so no Stage 0 test-bootstrap prerequisite is required.
- The integration check is satisfied as not applicable: Phase 04a forbids runtime wiring and Phase 04b owns it.
- The manifest includes every required feature field, ordered graph, bundle files, and verification assets.
- No checklist item remains unsatisfied.
