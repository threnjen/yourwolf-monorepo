# Plan-Conformance Review: Narration Scripts and Preview

## Review scope

- Implementation record: `dev/feature/02-narration-scripts-preview/02-narration-scripts-preview-implementation.md`
- Plan: `dev/feature/02-narration-scripts-preview/02-narration-scripts-preview-plan.md`
- Implemented commit: `38b49f8`
- Review lane: `plan-conformance`
- Reviewer: `03c-reviewer-plan-conformance`

The review covers the feature source, focused tests, both parity fixtures, the
Feature 01 contracts and template tests, the Python narration builders and
oracles, seed defaults, and the phase verification manifest.

## Review record

The finding below was recorded before the repair. Its red evidence artifact
proves the regression assertion failed against the pre-repair fixture.

## Finding disposition

### Low — night fixture steps are not converted to the engine input shape

- `severity: low`
- `lane: plan-conformance`
- `evidence`: Before repair, the verified `EngineAbilityStepInput` contract
  contained only `ability_type`, `order`, `modifier`, `is_required`, and
  `parameters` (`yourwolf-frontend/src/engine/types.ts:5-11`). The fixture
  retained backend-only `condition_type` and `condition_params` at
  `yourwolf-frontend/src/test/engine/night-script.fixture.json:28-35`,
  `460-470`, and `538-548`. The fixture test cast through `unknown` without a
  runtime shape check (`yourwolf-frontend/src/test/engine/narration.test.ts:17-27`).
  The plan required conversion to the verified engine input shape
  (`02-narration-scripts-preview-tasks.md:18`).
- `reviewer: 03c-reviewer-plan-conformance`
- `disposition`: Fixed. The regression assertion at
  `yourwolf-frontend/src/test/engine/narration.test.ts:230-256` failed before
  repair with 13 total, 12 passed, and 1 failed in
  `/tmp/yourwolf-phase04a-feature02-red.xml`. Removing only those nine
  backend-only fixture lines made the focused suite pass with 13 total, 13
  passed, and 0 failed in `/tmp/yourwolf-phase04a-feature02-focused.xml`.
  The corrected fixture now contains only the engine role and step keys
  (`yourwolf-frontend/src/test/engine/night-script.fixture.json:2-42` and
  `450-466`).

No findings remain unfixed. No finding was filed outside the
`plan-conformance` lane.

## Acceptance-criteria evidence map after repair

| AC | Status | Exact evidence |
|----|--------|----------------|
| AC1 | complete | `yourwolf-frontend/src/engine/narration.ts:121-155` assembles opening, role blocks, closing, and a separate duration sum. `yourwolf-frontend/src/test/engine/narration.test.ts:160-182` asserts unique role assembly, dense orders, no-wake boundaries, and exact duration. The Python split is `yourwolf-backend/app/services/narration/script_builder.py:87-128` and `171-180`. |
| AC2 | complete | `narration.ts:33-55` filters non-positive wake orders, de-duplicates ids, and sorts by wake order then name. `narration.test.ts:61-83` asserts ties, null/zero filtering, and the empty custom-sequence default path. |
| AC3 | complete | `narration.ts:58-76` maps sequence ids with last-write-wins positions, puts named roles first, and applies deterministic fallback sorting to unnamed roles. `narration.test.ts:61-101` asserts unknown ids, repeated ids, named-first ordering, unnamed fallback ordering, and empty sequences. |
| AC4 | complete | `narration.ts:80-118` sorts steps, skips `undefined` instructions before duration lookup, keeps wake/close actions, and derives the player-action flag from `is_required` or `or`. The template owns OR text and inherited-name guards in `yourwolf-frontend/src/engine/templates.ts:197-215`. `narration.test.ts:103-158` asserts dense output, OR behavior, optional steps, no-step roles, and `constructor`, `toString`, and `__proto__` skips with no duration. |
| AC5 | complete | `narration.ts:158-180` applies the null/zero wake guard, maps role actions, and appends one exact second-wake header. `narration.test.ts:184-216` asserts both second-wake types, one header, sequential order, and null/zero empty previews. The surrounding Python guard and builder are `yourwolf-backend/app/services/script_service.py:129-147` and `yourwolf-backend/app/services/narration/script_builder.py:131-168`. |
| AC6 | complete | `yourwolf-frontend/src/test/engine/night-script.fixture.json:2-837` contains 30 converted roles and a complete 28-role custom sequence, with static expected arrays at `839-2327`. `narration.test.ts:258-264` compares default and custom TypeScript output to the committed fixture. An independent Python check against `build_night_script_actions` reported `default_fixture_match=True` and `custom_fixture_match=True`. |
| AC7 | complete | `yourwolf-frontend/src/test/engine/preview.fixture.json:1-590` contains all 30 named previews, including empty `Villager` and `Tanner` entries at lines `2` and `42`. `narration.test.ts:266-273` runs `buildPreview` for every fixture role and asserts 30 fixture keys and both empty results. The independent Python check reported no preview mismatches. |
| AC8 | complete | Seed conversion uses the loader defaults shown in `yourwolf-backend/app/seed/roles.py:303-347`; the fixture contains 30 matching role names, deterministic `role-<normalized-name>` ids, and only the verified engine keys. The independent Python provenance check reported `seed_count=30`, `fixture_count=30`, `role_names_match=True`, and `engine_role_shape=True`, and reproduced both fixture outputs from the Python builders. `rg --files yourwolf-frontend/src/test/engine` found no committed generator. |
| AC9 | complete | The engine remains pure through imports at `yourwolf-frontend/src/engine/narration.ts:1-6`; no caller or configuration files changed in this feature. Integrated frontend Vitest is `executed-green`: `npm test -- --run --reporter=junit --outputFile=/tmp/yourwolf-phase04a-feature02-integrated.xml`, artifact `/tmp/yourwolf-phase04a-feature02-integrated.xml`, total 629, passed 629, failed 0. Coverage Vitest is `executed-green`: `npm run test:coverage -- --reporter=junit --outputFile=/tmp/yourwolf-phase04a-feature02-coverage.xml`, artifact `/tmp/yourwolf-phase04a-feature02-coverage.xml`, total 629, passed 629, failed 0. The `src/engine/` coverage row reports 98.8% statements, 96.92% branches, 100% functions, and 98.8% lines. `npm run lint` and `npm run build` both exited 0. The backend narration oracle is `executed-green`: `uv run pytest --no-cov tests/test_narration_templates.py tests/test_narration_script_builder.py tests/test_script_service.py --junitxml=/tmp/yourwolf-phase04a-feature02-backend.xml`, artifact `/tmp/yourwolf-phase04a-feature02-backend.xml`, total 153, passed 153, failed 0. The broader manifest backend oracle is also `executed-green`: `uv run pytest --no-cov tests/test_narration_templates.py tests/test_narration_script_builder.py tests/test_script_service.py tests/test_game_setup_validation.py --junitxml=/tmp/yourwolf-phase04a-feature02-backend-all.xml`, artifact `/tmp/yourwolf-phase04a-feature02-backend-all.xml`, total 185, passed 185, failed 0. |

## Verification summary

- Review was recorded before repair, and the active regression failed before
  the fixture cleanup.
- The focused narration suite is `executed-green`: command
  `npm test -- --run src/test/engine/narration.test.ts --reporter=junit --outputFile=/tmp/yourwolf-phase04a-feature02-focused.xml`, artifact
  `/tmp/yourwolf-phase04a-feature02-focused.xml`, total 13, passed 13, failed
  0.
- The integrated frontend suite is `executed-green`: command
  `npm test -- --run --reporter=junit --outputFile=/tmp/yourwolf-phase04a-feature02-integrated.xml`, artifact
  `/tmp/yourwolf-phase04a-feature02-integrated.xml`, total 629, passed 629,
  failed 0.
- The backend narration oracle is `executed-green`: command
  `uv run pytest --no-cov tests/test_narration_templates.py tests/test_narration_script_builder.py tests/test_script_service.py --junitxml=/tmp/yourwolf-phase04a-feature02-backend.xml`, artifact
  `/tmp/yourwolf-phase04a-feature02-backend.xml`, total 153, passed 153,
  failed 0.
- The broader manifest backend oracle is `executed-green`: command
  `uv run pytest --no-cov tests/test_narration_templates.py tests/test_narration_script_builder.py tests/test_script_service.py tests/test_game_setup_validation.py --junitxml=/tmp/yourwolf-phase04a-feature02-backend-all.xml`, artifact
  `/tmp/yourwolf-phase04a-feature02-backend-all.xml`, total 185, passed 185,
  failed 0.
- Regressions: None.

## Final verdict

Approved after one review-and-repair round. The single plan-conformance
finding was fixed with a failing-then-passing fixture-shape assertion and a
minimal static-data cleanup. All acceptance criteria are complete, and the
authoritative frontend and backend suites are green.
