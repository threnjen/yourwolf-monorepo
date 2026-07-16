# Tasks: Frontend Pure Game-Rule Modules

## Stage 1: roleSelection extraction (AC1, AC4)

- [ ] Verify feature 03 prerequisites are in place: `src/domain/` exists and the ESLint boundary rule is active
- [ ] Enumerate current cascade behaviors from `GameSetup.test.tsx` (add with missing dependency, cascade removal of dependents, quantity changes) before extracting
- [ ] Extract role-dependency cascade selection/removal logic from `hooks/useGameSetup.ts` (L38–L103) into a pure domain module `src/domain/roleSelection.ts` [PROPOSED - name TBD] with data-in/data-out signatures (current selection + role metadata → next selection) and exported types
- [ ] Rewrite `useGameSetup` as a thin adapter over the pure functions
- [ ] Remove the `NavigateFunction` parameter and hardcoded `'/games/new/wake-order'` from `useGameSetup`; expose state + a readiness signal/payload instead
- [ ] Move navigation into `GameSetup.tsx` (page owns `navigate`)
- [ ] Write direct unit tests (no RTL) for cascade add/remove/quantity behaviors [PROPOSED - name TBD]
- [ ] Update `GameSetup.test.tsx` navigation assertions to page level; confirm the rest of the file passes unmodified
- [ ] Run lint and full test suite; no new failures vs. baseline (3 pre-existing `useRoles.test.ts` failures excluded)

## Stage 2: wakeOrder extraction + shared router-state type (AC2, AC5)

- [ ] Extract wake-group construction, within-group shuffle, and flattening to `wake_order_sequence` from `pages/WakeOrderResolution.tsx` (L41–L48, L93–L126, L156–L164) into `src/domain/wakeOrder.ts` [PROPOSED - name TBD]
- [ ] Move `shuffleArray` out of the page (audit finding 1.4) with an injectable RNG parameter defaulting to `Math.random`; implementer records the final home
- [ ] Verify shuffle occurs only within groups, group order is preserved, and the flattened output matches the `wake_order_sequence?: string[]` shape in `src/types/game.ts`
- [ ] Declare `WakeOrderRouterState` once in a shared module [PROPOSED - name TBD]; import it in both producer (`useGameSetup`/`GameSetup.tsx`) and consumer (`WakeOrderResolution.tsx`); the consumer's `as` cast (L82) reads the shared type; delete the local interface (L26)
- [ ] Write deterministic direct unit tests for group/shuffle/flatten using an injected RNG [PROPOSED - name TBD]
- [ ] Confirm `WakeOrderResolution.test.tsx` passes; run `tsc` (via `npm run build` or `npx tsc --noEmit`) for the shared-type contract

## Stage 3: abilitySteps extraction (AC3, AC6, AC7)

- [ ] Extract ability-step renumbering and modifier-normalization rules from `AbilitiesStep.tsx` (L307–L384) plus parameter coercion (int/array parsing) into `src/domain/abilitySteps.ts` [PROPOSED - name TBD]; component delegates to it
- [ ] Preserve OR-modifier semantics and 1-based/0-based numbering exactly as the current component
- [ ] Keep signatures data-in/data-out with exported types — feature 08 and Phase 04 engine will consume this module
- [ ] Write direct unit tests for renumber/modifier/coercion rules [PROPOSED - name TBD]
- [ ] Confirm `AbilitiesStep.test.tsx` passes unmodified except assertions on moved internals
- [ ] Verify no React imports in domain modules and ESLint boundary rule passes; no logging added to domain modules
- [ ] Run full suite (`npx vitest run`) and lint; verify no new failures vs. baseline (355 passed / 3 pre-existing failures)
