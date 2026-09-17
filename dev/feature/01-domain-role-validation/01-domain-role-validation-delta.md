# 01 Domain Role Validation Selection Delta

## Key Files

| File | Verified symbols or role | Selection effect |
|---|---|---|
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | `hasRoleNameCollision` at lines 17-22; `RoleBuilderPage` owns collision/validation composition | Move the helper logic into the new pure module without changing this caller in Feature 1. |
| `yourwolf-frontend/src/domain/roleDraft.ts` | `RoleDraft`, `AbilityStepDraft`, `WinConditionDraft` | Reuse `RoleDraft`; keep validation inputs inside the domain layer. |
| `yourwolf-frontend/eslint.config.js` | Pure-layer import boundary for `src/domain/**` | The new module may not import React, API, hook, page, style, or transport modules. |
| `yourwolf-backend/app/services/role_validation.py` | `check_duplicate_name`, `validate_role`, `get_warnings` | Literal source for backend order and messages. The database duplicate query is replaced by the local helper. |
| `yourwolf-backend/tests/test_role_validation.py` | Six test classes and 38 tests | Oracle source. Included and excluded classes match the Phase summary. |
| `yourwolf-backend/tests/test_role_validation_module.py` | Five test classes and 12 tests | Oracle source. `TestRoleRulePrecedence` is caller-composition coverage for Feature 2. |
| `yourwolf-frontend/src/domain/roleValidation.ts` | Selected new pure module path | Follows existing camel-case domain filenames such as `roleDraft.ts`, `abilitySteps.ts`, and `roleSelection.ts`. |
| `yourwolf-frontend/src/test/domain/roleValidation.test.ts` | Selected new literal oracle path | Mirrors the selected source basename and the existing `src/test/domain/*.test.ts` convention. |

## Current Constraints

- Preserve the backend rule order and literal message order from `validate_role`: trimmed lower name bound; first-step modifier; invalid or inactive abilities in draft order; duplicate-order message before the gap message; then win-condition rules.
- Preserve the three literal warning messages and their order from `get_warnings`.
- Preserve exactly two documented divergences: the frontend-only trimmed 50-character upper-bound error and `Name is already taken` for local collisions.
- Keep the backend, `src/engine/`, ability catalog shape, seed data, callers, HTTP client, and Axios unchanged.
- Keep the expected write boundary to `yourwolf-frontend/src/domain/roleValidation.ts` and `yourwolf-frontend/src/test/domain/roleValidation.test.ts`.
- Do not add edit-only exclude-own-id behavior. Local collision checks include private and official roles.
- Keep normal invalid drafts non-throwing, deterministic, and synchronous. Add no logging or metrics.

## Verification Assets

- Focused suite from `yourwolf-frontend`: `npm test -- --run src/test/domain/roleValidation.test.ts`.
- Full frontend suite from `yourwolf-frontend`: `npm test -- --run`.
- Coverage gate from `yourwolf-frontend`: `npm run test:coverage` with 80 percent thresholds for lines, branches, functions, and statements.
- Static gates from `yourwolf-frontend`: `npm run lint` and `npm run build`.
- Backend literal sources: `yourwolf-backend/app/services/role_validation.py`, `yourwolf-backend/tests/test_role_validation.py`, and `yourwolf-backend/tests/test_role_validation_module.py`.
- Phase baseline remains 715 passing frontend tests and 503 passing backend tests.

## Discoveries

| Finding | Evidence | Impact | Action |
|---|---|---|---|
| The page-local collision helper exists with the planned trim and case-insensitive behavior. | `RoleBuilder.tsx:17-22`; graph finds `RoleBuilderPage` as its only caller. | Validates AC6 and the shared-helper extraction. | Preserve `hasRoleNameCollision` and its boolean contract in `roleValidation.ts`; leave the page-local copy until Feature 2. |
| Collision precedence is observable caller composition, not a standalone pure-rule behavior. | `RoleBuilderPage` currently short-circuits on collision at lines 63-68. The Phase summary assigns the combined length-versus-collision result to the builder, and Feature 2 AC3 pins it. | Original AC9 would force a combined API with no Feature 1 caller or falsely claim coverage by testing separate helpers. | Patch AC9 and its test mapping to record `TestRoleRulePrecedence` as Feature 2 coverage. |
| Backend rule symbols and order match the plan. | `role_validation.py` defines `check_duplicate_name` at line 27, `validate_role` at line 49, and `get_warnings` at line 133. | Validates the oracle source and exact ordering claim. | Transcribe literal messages. Do not derive expectations from Python at test runtime. |
| Backend oracle class counts match the Phase transcription map. | `test_role_validation.py`: 16, 4, 4, 5, 5, and 4 tests by listed class. `test_role_validation_module.py`: 3, 3, 1, 3, and 2 tests. | Confirms 38 plus 12 source tests and the documented included/excluded split. | Include the domain-mappable classes. List HTTP/database exclusions and the Feature 2 precedence handoff in the oracle header. |
| The selected filenames follow current frontend conventions. | Domain sources use camel-case concern names. Domain tests mirror those names with `.test.ts`. Neither selected path exists at the validation commit. | Resolves both `[PROPOSED - name TBD]` paths for implementation. | Create only `roleValidation.ts` and `roleValidation.test.ts`. |

## Plan Patch

Plan revision 2 corrects AC9 and its test mapping. Verified source and the Phase summary place collision precedence in `RoleBuilderPage`, which Feature 2 rewires and tests. No other plan content changed.

## Selection Result

- Validation commit: `e4dba344e1790d990f88ab27d50a1a3ae25814a6`
- Status: Ready for implementation
- Prerequisites: None
