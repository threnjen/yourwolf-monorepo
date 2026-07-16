# Plan: Frontend Pure Game-Rule Modules

## Execution Metadata

- **Wave:** 2
- **Parallel safe:** yes
- **Depends on:** 03-frontend-domain-foundation
- **Key files modified:** `yourwolf-frontend/src/domain/roleSelection.ts` [PROPOSED - name TBD] (new), `yourwolf-frontend/src/domain/wakeOrder.ts` [PROPOSED - name TBD] (new), `yourwolf-frontend/src/domain/abilitySteps.ts` [PROPOSED - name TBD] (new), `yourwolf-frontend/src/hooks/useGameSetup.ts`, `yourwolf-frontend/src/pages/WakeOrderResolution.tsx`, `yourwolf-frontend/src/pages/GameSetup.tsx` (verify), `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx`, `yourwolf-frontend/src/utils/` (shuffleArray home, verify), shared router-state type module [PROPOSED - name TBD], `yourwolf-frontend/src/test/GameSetup.test.tsx` (verify), `yourwolf-frontend/src/test/WakeOrderResolution.test.tsx` (verify), `yourwolf-frontend/src/test/AbilitiesStep.test.tsx` (verify)
- **Sequential reason:** runtime dependency on 03 (domain directory, constants, ESLint boundary rule); shares `AbilitiesStep.tsx` with upstream 03. Parallel-safe within Wave 2.

Source: refactor audit findings 5.1 (High, ENGINE), 4.1, 4.3, 1.4 and restructuring item 8 in `dev/refactor-audit-frontend/refactor-audit-frontend-report.md`. This is the direct Phase 04 enabler — the engine must not re-implement logic trapped in React files.

## A. Requirements & Traceability

Acceptance criteria:

- **AC1**: Role-dependency cascade selection/removal logic (`hooks/useGameSetup.ts` L38–L103) is extracted into a pure domain module; the hook becomes a thin adapter over pure functions (input: current selection + role metadata; output: next selection).
- **AC2**: Wake-group construction, within-group shuffle, and flattening to `wake_order_sequence` (`pages/WakeOrderResolution.tsx` L41–L48, L93–L126, L156–L164) are extracted into a pure domain module; `shuffleArray` moves out of the page (finding 1.4) with an injectable RNG parameter so tests are deterministic.
- **AC3**: Ability-step renumbering and modifier-normalization rules (`AbilitiesStep.tsx` L307–L384) plus parameter coercion (int/array parsing) are extracted into a pure domain module; the component calls it.
- **AC4**: `useGameSetup` no longer receives a `NavigateFunction` or hardcodes `'/games/new/wake-order'` (finding 4.3): it exposes state + a readiness signal/payload, and the page owns navigation.
- **AC5**: The `WakeOrderRouterState` contract (finding 4.1, minimum fix) is declared once in a shared module imported by both producer (`useGameSetup`/`GameSetup`) and consumer (`WakeOrderResolution`); the `as` cast on the consumer side reads from the shared type.
- **AC6**: New domain modules have direct unit tests (no React Testing Library required) covering cascade add/remove, group/shuffle/flatten determinism with injected RNG, and renumber/modifier rules.
- **AC7**: All existing page/component tests pass — meaning no new failures versus baseline (3 pre-existing failures in `src/test/useRoles.test.ts` are known and out of scope); observable UI behavior is unchanged.

Non-goals: no visual/component decomposition of `AbilitiesStep` (feature 08); no replacement of the `location.state` mechanism with context/sessionStorage (audit rates it High risk — deferred to Phase 04 when the engine owns session construction; record as deferred); `SortableTile` extraction deferred to feature 08's component pass or Phase 04.

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1 | `domain/roleSelection.ts`, `useGameSetup.ts` | Must-have new unit tests + existing `GameSetup.test.tsx` (485 lines) as regression anchor |
| AC2 | `domain/wakeOrder.ts`, `WakeOrderResolution.tsx` | Must-have new unit tests + existing `WakeOrderResolution.test.tsx` |
| AC3 | `domain/abilitySteps.ts`, `AbilitiesStep.tsx` | Must-have new unit tests + existing `AbilitiesStep.test.tsx` |
| AC4 | `useGameSetup.ts`, `GameSetup.tsx` | Existing tests to update (navigation assertions move to page tests) |
| AC5 | shared type module, 2 pages | tsc; code-review evidence |
| AC6–AC7 | domain + suite | New tests; full suite |

## B. Correctness & Edge Cases

- Cascade logic: removing a role that others depend on, adding a role whose dependency is absent, quantity changes — enumerate current behaviors from `GameSetup.test.tsx` before extraction; behavior must be preserved bit-for-bit.
- Shuffle: only within groups; group order preserved; flattening yields the exact `wake_order_sequence` shape the backend expects.
- Step renumbering: preserve the OR-modifier semantics and 1-based/0-based numbering exactly as the current component does.
- Injectable RNG must default to `Math.random` in production paths.

## C. Consistency & Architecture Fit

- Domain modules are pure TS, enforced by the ESLint boundary rule from feature 03.
- **Cross-feature API**: feature 08 will consume `domain/abilitySteps.ts`, and Phase 04's engine consumes all three modules — keep function signatures data-in/data-out with exported types.

## D. Clean Design & Maintainability

Extract, don't redesign: function-per-operation mirroring what the React code does today. Resist adding engine features early.

## E. Observability, Security, Operability

No logging in pure domain modules (test-sensitive hot paths — audit's "no new normal-path logs" guidance applies). Rollback: revert.

## F. Test Plan

- Must-have: unit tests per AC6 (scenarios above; test file names [PROPOSED - name TBD], placed per the test-structure convention current at implementation time).
- Existing tests to update: `GameSetup.test.tsx` navigation assertions (AC4); any test reaching into moved internals.
- Refactor note: the three existing large test files are the regression anchors; they must pass unmodified except where they asserted on implementation details that moved.

## Stage 1: roleSelection extraction
**Goal**: AC1, AC4
**Success Criteria**: Hook is an adapter; unit + page tests green
**Status**: Not Started

## Stage 2: wakeOrder extraction + shared router-state type
**Goal**: AC2, AC5
**Success Criteria**: Deterministic unit tests; page tests green
**Status**: Not Started

## Stage 3: abilitySteps extraction
**Goal**: AC3, AC6, AC7
**Success Criteria**: Component delegates to domain; full suite green
**Status**: Not Started
