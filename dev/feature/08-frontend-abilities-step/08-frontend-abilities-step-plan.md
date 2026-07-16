# Plan: AbilitiesStep Component Decomposition

## Execution Metadata

- **Wave:** 3
- **Parallel safe:** yes
- **Depends on:** 06-frontend-game-rules
- **Key files modified:** `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx`, `yourwolf-frontend/src/components/RoleBuilder/steps/AbilityPalette.tsx` [PROPOSED - name TBD] (new), `yourwolf-frontend/src/components/RoleBuilder/steps/StepParameterInputs.tsx` [PROPOSED - name TBD] (new), `yourwolf-frontend/src/components/RoleBuilder/steps/StepList.tsx` [PROPOSED - name TBD] (new), `yourwolf-frontend/src/test/AbilitiesStep.test.tsx`, `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx` (verify)
- **Sequential reason:** shares `AbilitiesStep.tsx` with upstream 06-frontend-game-rules and consumes the `domain/abilitySteps` module 06 creates. Parallel-safe within Wave 3 (disjoint from 07).

Source: refactor audit findings 3.1 (High), 3.4 and restructuring item 12 in `dev/refactor-audit-frontend/refactor-audit-frontend-report.md`.

## A. Requirements & Traceability

Acceptance criteria:

- **AC1**: The 492-line `AbilitiesStep.tsx` is decomposed into focused components: the ability-category palette with tab state (currently ~L18–L145), the schema-driven dynamic parameter form (`StepParameterInputs`, currently L148–L227 — note this name already exists as an inner component; promoting it to its own file preserves the name), and the step-list rendering. `AbilitiesStep` remains as the composing container.
- **AC2**: All business rules (add/remove/move/renumber, modifier normalization, parameter coercion) are calls into `domain/abilitySteps` from feature 06 — no rule logic remains in any of the presentational components.
- **AC3**: `AbilitiesStep.tsx` and each extracted component are each under ~200 lines; the container is primarily composition.
- **AC4**: `src/test/AbilitiesStep.test.tsx` (455 lines) is split along the same seams — palette rendering tests, parameter-form tests, step-list/interaction tests — with no loss of assertions (test count equal or higher).
- **AC5**: Wizard flow behavior is unchanged: vitest suite shows no new failures versus baseline (3 pre-existing failures in `src/test/useRoles.test.ts` are known and out of scope); the Role Builder wizard step renders and operates identically.

Non-goals: no visual redesign; no changes to `ReviewStep`/`BasicInfoStep`; no changes to domain logic (owned by 06); `disabled`-state messaging behavior preserved as-is.

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1, AC3 | new component files | Code-review evidence (line counts, responsibilities) |
| AC2 | components + domain | Code-review evidence: grep shows no rule logic in components |
| AC4 | split test files | Existing tests to update/split; assertion-count comparison |
| AC5 | wizard flow | Existing suite + manual QA: walk the Role Builder wizard |

## B. Correctness & Edge Cases

- The dynamic form interprets JSON-schema-like `properties` for each ability type — including int coercion, array inputs, and `STRING_TARGET_OPTIONS` selects; every input type currently rendered must keep rendering (enumerate from the existing test file before splitting).
- Tab state and selected-category behavior on add/remove must not reset unexpectedly (controlled-state ownership stays in the container).
- Props contracts between container and children should be typed narrowly (pass step data + callbacks, not whole draft objects, where feasible without behavior change).

## C. Consistency & Architecture Fit

- Sibling steps (`BasicInfoStep`, `ReviewStep`) are the pattern: controlled components receiving values + change callbacks.
- Component files live beside the existing step files under `components/RoleBuilder/steps/`.

## D. Clean Design & Maintainability

Decomposition only. If a piece can't be extracted without changing behavior, extract less — behavior parity outranks file-size targets.

## E. Observability, Security, Operability

No logging, no security surface. Rollback: revert.

## F. Test Plan

- Existing tests to update: split `AbilitiesStep.test.tsx` into per-component files; keep one integration-style test of the composed step.
- Manual QA: create a role with abilities of at least 3 categories, edit parameters of each input kind, reorder/remove steps, confirm review step shows the result.

## Stage 1: Extract parameter form and palette
**Goal**: AC1 (two of three extractions), AC2
**Success Criteria**: Components compile and render; container composes; suite green
**Status**: Not Started

## Stage 2: Extract step list + test split
**Goal**: AC1 complete, AC3–AC5
**Success Criteria**: Line targets met; tests split with no assertion loss; manual QA pass
**Status**: Not Started
