# 01 Domain Role Validation

## A. Requirements & Traceability

### Acceptance Criteria

- **AC1:** A pure module under `yourwolf-frontend/src/domain/` accepts a `RoleDraft` and an active ability catalog, then returns a result structurally compatible with `ValidationResult`: `is_valid`, `errors`, and `warnings`.
- **AC2:** The domain validator preserves the backend `validate_role` rule order and exact messages for the trimmed two-character minimum, first step by lowest order requiring modifier `none`, invalid or inactive ability types in step order, duplicate step-order precedence over gap reporting, at least one win condition, and exactly one primary win condition with the count reported above one.
- **AC3:** The validator adds the deliberate frontend-only rule for a trimmed name longer than 50 characters. This error remains distinct from backend-message parity because Pydantic rejects that case before `validate_role` runs.
- **AC4:** The same module returns the three `get_warnings` messages in backend order: more than five ability steps, steps with `wake_order` set to `null`, and combined `copy_role` plus `change_to_team` steps.
- **AC5:** The module declares its own minimal ability input shape and result shape. It imports nothing from `src/types/`, `src/data/`, `src/hooks/`, React, or the UI layers.
- **AC6:** The existing `hasRoleNameCollision` behavior becomes reusable outside `RoleBuilder.tsx`: it trims and compares names case-insensitively across every supplied local role, including private roles, and retains the local message `Name is already taken`. The existing page-local definition remains until Feature 2 swaps the callers.
- **AC7:** The shared domain contract exposes the validation and collision behavior required by `02-builder-name-check-rewiring`. Final exported names other than the existing `hasRoleNameCollision` name are `[PROPOSED - name TBD]` and must be recorded in implementation notes.
- **AC8:** A literal frontend oracle transcribes the Phase summary's included backend classes and messages. Its header lists the excluded HTTP/database classes and the deliberate frontend-only divergences.
- **AC9:** The oracle header records `TestRoleRulePrecedence` as Feature 2 caller-composition coverage. This feature does not add or claim a combined validation-and-collision API.

### Non-Goals

- Do not change backend code, backend tests, API contracts, `src/engine/`, the ability catalog shape, or seed data.
- Do not rewire `RoleBuilder.tsx`, `useNameCheck`, or `BasicInfoStep.tsx` in this feature.
- Do not delete the HTTP client or Axios in this feature.
- Do not add edit-flow exclude-own-id behavior.

### Traceability

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1-AC5, AC7 | New module under `yourwolf-frontend/src/domain/` `[PROPOSED - name TBD]`, `yourwolf-frontend/src/domain/roleDraft.ts`, `yourwolf-backend/app/services/role_validation.py` | Must-have automated test; code-review evidence only |
| AC6 | `yourwolf-frontend/src/pages/RoleBuilder.tsx` as the source of existing `hasRoleNameCollision`; new pure domain home `[PROPOSED - name TBD]` | Must-have automated test |
| AC8-AC9 | `yourwolf-backend/tests/test_role_validation.py`, `yourwolf-backend/tests/test_role_validation_module.py`, new suite under `yourwolf-frontend/src/test/domain/` `[PROPOSED - name TBD]` | Must-have automated test |

## B. Correctness & Edge Cases

- Preserve error order when one draft violates several rules. Preserve per-step invalid-ability reporting order.
- Sort only for identifying the first step and comparing order sequences. Do not silently reorder the draft.
- Treat an empty step list as valid for step-specific rules. The win-condition requirement still applies.
- Treat inactive and absent ability types identically, using the backend invalid-active-ability message.
- Report the duplicate-order message instead of the gap message when both conditions hold.
- Count every primary win condition and include the actual count above one.
- Base name length rules on the trimmed value. A collision is also trim- and case-insensitive.
- Keep warnings non-blocking. `is_valid` depends on errors only.
- No retries, timeouts, concurrency, or idempotent writes apply because this feature is pure and synchronous.
- Return complete deterministic results for every call. Do not throw for a normal invalid draft.

## C. Consistency & Architecture Fit

- Follow the pure-domain dependency direction enforced by `yourwolf-frontend/eslint.config.js`.
- Reuse `RoleDraft` from `yourwolf-frontend/src/domain/roleDraft.ts` and declare the minimal ability input locally.
- Treat `yourwolf-backend/app/services/role_validation.py` as the message and ordering source. Use its tests only as literal transcription evidence.
- Preserve the existing `hasRoleNameCollision` semantics in a shared pure-layer home. Feature 2 removes the temporary page-local copy when it rewires the callers.
- Cross-feature contract: Feature 2 must be able to consume one pure validation entry point, one collision helper, and one structurally compatible validation result without importing transport types into the domain. Exported names are `[PROPOSED - name TBD]` except the verified existing `hasRoleNameCollision`.
- Deliberate deviations are limited to the frontend 50-character error and the local `Name is already taken` collision message.

## D. Clean Design & Maintainability

- Keep one new rule evaluator and one shared collision helper. The verified page-local collision helper may coexist only until Feature 2 imports the shared helper.
- Keep backend parity rules visibly ordered so a later change does not reorder user-facing output accidentally.
- Keep test expectations as literals. Do not compute expected messages from the implementation under test.
- Keep it clean: no transport adapter, no repository access, no React state, and no framework abstraction.

## E. Completeness: Observability, Security, Operability

- **Observability:** Add no logs or metrics. A pure validator returns all diagnosable information in its result.
- **Security:** Treat draft and catalog values as boundary inputs. Return validation errors without executing parameters or trusting catalog activity.
- **Runbook:** Run the focused domain oracle, frontend lint, build, and full coverage suite. Roll back the new module and its oracle together. Monitor later parity changes through literal oracle failures.

## F. Test Plan

- AC1-AC5: transcribe `TestValidateRole`, `TestValidateRoleModule`, `TestRoleNameLengthBounds`, `TestGetWarnings`, and `TestGetWarningsModule` as literal table and scenario assertions.
- AC6: map `TestCheckDuplicateName` and `TestCheckDuplicateNameModule` onto the local collision behavior. Exclude edit-only own-id scenarios.
- AC9: record `TestRoleRulePrecedence` as Feature 2 coverage because the observable precedence belongs to `RoleBuilderPage` when it combines domain errors with a local collision.
- AC8: list `TestValidateEndpoint`, `TestCheckNameEndpoint`, and `TestCreateValidateAgreement` as excluded HTTP/database coverage in the oracle header.
- Test maintenance note: this adds a pure contract without rewiring callers. No existing frontend test should be weakened. Feature 2 owns caller test updates, and Feature 3 owns HTTP-suite deletion.
- High-value checks:
  1. Given one draft that violates several rules, when validation runs, then errors and warnings match backend ordering and literal messages.
  2. Given duplicate and gapped step orders, when validation runs, then only the duplicate-order message appears for that rule.
  3. Given absent and inactive catalog entries, when validation runs, then each affected step reports the invalid-active-ability message in draft order.
  4. Given a trimmed 51-character name, when validation runs, then the frontend-only upper-bound error appears.
  5. Given official and private local roles with case and whitespace variants, when collision checking runs, then both collide and retain `Name is already taken`.
- Use literal draft and ability fixtures. Do not derive expectations from `role_validation.py` at test runtime.
- Stage 0 is not required. The baseline frontend suite has 715 passing tests, and the configured coverage gate is 80 percent across lines, branches, functions, and statements.

## Stage 1: Pure Validation Contract
**Goal**: Add the domain validation, warning, and local collision behavior without callers.
**Success Criteria**: AC1-AC7 pass and the pure-layer lint boundary remains active.
**Status**: Not Started

## Stage 2: Literal Parity Oracle
**Goal**: Pin rule messages, ordering, edge cases, exclusions, and deliberate divergences with independent literals.
**Success Criteria**: AC8-AC9 pass, and the focused and full frontend suites stay green.
**Status**: Not Started
