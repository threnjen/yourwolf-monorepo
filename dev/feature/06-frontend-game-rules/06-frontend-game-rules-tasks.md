# Tasks: Frontend Pure Game-Rule Modules

## Stage 1: roleSelection extraction (AC1, AC4)

- [x] Verify feature 03 prerequisites are in place: `src/domain/` exists and the ESLint boundary rule is active
- [x] Enumerate current cascade behaviors from `GameSetup.test.tsx` (add with missing dependency, cascade removal of dependents, quantity changes) before extracting
- [x] Extract role-dependency cascade selection/removal logic from `hooks/useGameSetup.ts` (L38–L103) into a pure domain module `src/domain/roleSelection.ts` with data-in/data-out signatures (current selection + role metadata → next selection) and exported types
- [x] Rewrite `useGameSetup` as a thin adapter over the pure functions
- [x] Remove the `NavigateFunction` parameter and hardcoded `'/games/new/wake-order'` from `useGameSetup`; expose state + a readiness signal/payload instead (`wakeOrderPayload`)
- [x] Move navigation into `GameSetup.tsx` (page owns `navigate`)
- [x] Write direct unit tests (no RTL) for cascade add/remove/quantity behaviors — `src/test/roleSelection.test.ts` (25 tests)
- [x] Update `GameSetup.test.tsx` navigation assertions to page level; confirm the rest of the file passes unmodified — no edit needed: the file already mocks `useNavigate` and renders the page, so it passes entirely unmodified
- [x] Run lint and full test suite; no new failures vs. baseline (3 pre-existing `useRoles.test.ts` failures excluded)

## Stage 2: wakeOrder extraction + shared router-state type (AC2, AC5)

- [x] Extract wake-group construction, within-group shuffle, and flattening to `wake_order_sequence` from `pages/WakeOrderResolution.tsx` (L41–L48, L93–L126, L156–L164) into `src/domain/wakeOrder.ts`
- [x] Move `shuffleArray` out of the page (audit finding 1.4) with an injectable RNG parameter defaulting to `Math.random`; final home recorded as `src/domain/wakeOrder.ts` (see implementation record Deviations)
- [x] Verify shuffle occurs only within groups, group order is preserved, and the flattened output matches the `wake_order_sequence?: string[]` shape in `src/types/game.ts`
- [x] Declare `WakeOrderRouterState` once in a shared module — `src/types/routerState.ts`; imported by producer (`useGameSetup`/`GameSetup.tsx`) and consumer (`WakeOrderResolution.tsx`); the consumer's `as` cast reads the shared type; local interface deleted
- [x] Write deterministic direct unit tests for group/shuffle/flatten using an injected RNG — `src/test/wakeOrder.test.ts` (28 tests)
- [x] Confirm `WakeOrderResolution.test.tsx` passes; run `tsc` (`npx tsc --noEmit`) for the shared-type contract

## Stage 3: abilitySteps extraction (AC3, AC6, AC7)

- [x] Extract ability-step renumbering and modifier-normalization rules from `AbilitiesStep.tsx` (L307–L384) plus parameter coercion (int/array parsing) into `src/domain/abilitySteps.ts`; component delegates to it
- [x] Preserve OR-modifier semantics and 1-based/0-based numbering exactly as the current component
- [x] Keep signatures data-in/data-out with exported types — feature 08 and Phase 04 engine will consume this module
- [x] Write direct unit tests for renumber/modifier/coercion rules — `src/test/abilitySteps.test.ts` (49 tests)
- [x] Confirm `AbilitiesStep.test.tsx` passes unmodified except assertions on moved internals — passes fully unmodified
- [x] Verify no React imports in domain modules and ESLint boundary rule passes; no logging added to domain modules
- [x] Run full suite (`npx vitest run`) and lint; verify no new failures vs. baseline — 473 passed / 3 failed (same 3 pre-existing)
