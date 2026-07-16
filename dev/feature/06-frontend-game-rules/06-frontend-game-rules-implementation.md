# Implementation Record: Frontend Pure Game-Rule Modules

## Summary

Extracted three families of game rules out of the React layer into pure `src/domain/` modules, and declared the `WakeOrderRouterState` router contract once in `src/types/routerState.ts`.

- `domain/roleSelection.ts` — role-dependency cascade select/remove/quantity rules (from `useGameSetup`)
- `domain/wakeOrder.ts` — waking-role collection, group construction, within-group shuffle (injectable RNG), flatten to `wake_order_sequence`, role-id expansion (from `WakeOrderResolution`)
- `domain/abilitySteps.ts` — step renumbering, modifier normalization, parameter coercion (from `AbilitiesStep`)

`useGameSetup` is now a thin adapter with no `react-router` dependency; `GameSetup.tsx` owns navigation. All three React files delegate to the domain rather than re-implementing. All modules are data-in/data-out with exported types, satisfy the feature-03 ESLint boundary (no React, no api/hooks/components/pages/styles imports), and carry no logging.

All three existing regression-anchor test files (`GameSetup.test.tsx`, `WakeOrderResolution.test.tsx`, `AbilitiesStep.test.tsx`) pass **completely unmodified** — no test file was edited in this feature.

## Sibling Features

Scanned all sibling feature titles in `dev/feature/`. Relevant to this work:

- **03-frontend-domain-foundation (Wave 1, landed)** — consumed as-is: `src/domain/` directory, `constants.ts`, the ESLint boundary rule, and the `import type {X} from '../types/role'` precedent set by `domain/roleDraft.ts`. Nothing recreated.
- **08-frontend-abilities-step (Wave 3)** — will consume `domain/abilitySteps.ts` and shares `AbilitiesStep.tsx`. Signatures kept data-in/data-out with exported types (`AbilityStepSeed`, `IdFactory`) for that consumer. Deliberately did **not** decompose the component or extract `SortableTile` (feature 08's scope).
- **11-frontend-type-split (Wave 4)** — new domain modules import types from `src/types/role`, following the transitional seam 03 established. The new `src/types/routerState.ts` is a likely touchpoint for 11's transport/domain split.
- **12-frontend-dead-code-and-tests (Wave 5)** — owns the two pre-existing lint/tsc errors left untouched here.
- Features 04, 05, 07, 09, 10 are backend-only; `yourwolf-backend/` was not touched.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | roleSelection unit | Direct unit tests (no RTL): cascade add/remove/quantity | Complete | `src/domain/roleSelection.ts`, `src/hooks/useGameSetup.ts` | `yourwolf-frontend/src/test/roleSelection.test.ts` (25 tests); `yourwolf-frontend/src/test/GameSetup.test.tsx` (regression anchor, unmodified) | PENDING | PENDING |
| AC2 | AC2 | wakeOrder unit | Deterministic group/shuffle/flatten with injected RNG | Complete | `src/domain/wakeOrder.ts`, `src/pages/WakeOrderResolution.tsx` | `yourwolf-frontend/src/test/wakeOrder.test.ts` (28 tests); `yourwolf-frontend/src/test/WakeOrderResolution.test.tsx` (unmodified) | PENDING | PENDING |
| AC3 | AC3 | abilitySteps unit | Renumber/modifier/coercion rules | Complete | `src/domain/abilitySteps.ts`, `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | `yourwolf-frontend/src/test/abilitySteps.test.ts` (49 tests); `yourwolf-frontend/src/test/AbilitiesStep.test.tsx` (unmodified) | PENDING | PENDING |
| AC4 | AC4 | GameSetup page nav | Navigation assertions at page level | Complete | `src/hooks/useGameSetup.ts`, `src/pages/GameSetup.tsx` | `yourwolf-frontend/src/test/GameSetup.test.tsx:393-439` ("clicking Next navigates...") passes unmodified | PENDING | PENDING |
| AC5 | AC5 | tsc + code review | Shared type imported by producer and consumer | Complete | `src/types/routerState.ts`, `src/hooks/useGameSetup.ts`, `src/pages/WakeOrderResolution.tsx` | `yourwolf-frontend/src/types/routerState.ts`; `npx tsc --noEmit` clean except known baseline error | PENDING | PENDING |
| AC6 | AC6 | domain unit suites | New direct unit tests, no RTL | Complete | 3 new test files | `roleSelection.test.ts`, `wakeOrder.test.ts`, `abilitySteps.test.ts` — 102 tests total | PENDING | PENDING |
| AC7 | AC7 | full suite | No new failures vs. baseline | Complete | full suite | `npx vitest run` → 473 passed / 3 failed (same 3 pre-existing `useRoles.test.ts` failures) | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Cascade selection/removal extracted; hook is a thin adapter | Complete | `src/domain/roleSelection.ts`, `src/hooks/useGameSetup.ts` | Hook body dropped from ~65 lines of rules to 4 delegating calls. Reference-identity no-op returns preserved so React bails out of re-render exactly as before. |
| AC2 | Wake-group construction, shuffle, flatten extracted; `shuffleArray` moved out with injectable RNG | Complete | `src/domain/wakeOrder.ts`, `src/pages/WakeOrderResolution.tsx` | `shuffleArray` home = `domain/wakeOrder.ts` (see Deviations). RNG defaults to `Math.random`. |
| AC3 | Renumbering, modifier normalization, parameter coercion extracted | Complete | `src/domain/abilitySteps.ts`, `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | OR/IF modifier semantics and 1-based numbering preserved bit-for-bit; the three duplicated inline renumber-maps collapsed into one `renumberSteps`. |
| AC4 | `useGameSetup` no longer takes `NavigateFunction` or hardcodes the route | Complete | `src/hooks/useGameSetup.ts`, `src/pages/GameSetup.tsx` | Hook exposes `wakeOrderPayload: WakeOrderRouterState \| null` (null until `canStart`). Page owns `navigate`. No `react-router` import remains in the hook. |
| AC5 | `WakeOrderRouterState` declared once, shared by producer and consumer | Complete | `src/types/routerState.ts` | Local interface deleted from `WakeOrderResolution.tsx`; the `as` cast now reads the shared type. Hook's payload is typed by the same declaration, so producer/consumer drift is a compile error. |
| AC6 | New domain modules have direct unit tests | Complete | 3 new test files | 102 new tests, zero RTL, zero React imports. |
| AC7 | No new failures vs. baseline; UI behavior unchanged | Complete | — | 473 passed / 3 failed; the 3 are the known pre-existing `useRoles.test.ts` failures. No regression-anchor test file was edited. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/domain/roleSelection.ts` | Create | `buildRoleMap`, `countSelectedCards`, `removeRoleWithCascade`, `toggleRoleSelection`, `adjustRoleCount`; types `RoleCounts`, `RoleMap` | AC1 — cascade rules become engine-consumable |
| `yourwolf-frontend/src/domain/wakeOrder.ts` | Create | `shuffleArray` (injectable RNG), `collectWakingRoles`, `getWakeGroupKeys`, `buildGroupOrders`, `flattenWakeOrder`, `expandRoleIds`; types `WakingRole`, `RandomFn` | AC2 — wake-order rules + finding 1.4 |
| `yourwolf-frontend/src/domain/abilitySteps.ts` | Create | `renumberSteps`, `buildInitialParameters`, `getParameterType`, `coerceParameterValue`, `appendAbilityStep`, `removeStepAt`, `moveStepUp`, `moveStepDown`, `setStepModifier`, `setStepParameter`; types `AbilityStepSeed`, `IdFactory` | AC3 — step rules for feature 08 + Phase 04 |
| `yourwolf-frontend/src/types/routerState.ts` | Create | Single `WakeOrderRouterState` declaration | AC5 — finding 4.1 minimum fix |
| `yourwolf-frontend/src/hooks/useGameSetup.ts` | Modify | Rules delegated to `domain/roleSelection`; dropped `NavigateFunction` param, `react-router` import and `handleNext`; added `wakeOrderPayload` | AC1, AC4 |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | Modify | Local `handleNext` navigates with `wakeOrderPayload`; `useGameSetup(roles)` | AC4 — finding 4.3 |
| `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` | Modify | Deleted local `WakeOrderRouterState`, `WakingRole`, `shuffleArray`; delegates to `domain/wakeOrder`; imports shared type | AC2, AC5 |
| `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Modify | Six handlers delegate to `domain/abilitySteps`; added `schemaFor`/`updateSteps` helpers | AC3 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-frontend/src/test/roleSelection.test.ts` | Create | 25 tests: map build, card counting, toggle (default_count, deselect, requires auto-select, multi-copy default, absent dependency, recommends ignored, already-selected dependency), cascade (one-way, unrelated roles), quantity (max reject, min removal + cascade, unknown role, unselected-as-0), immutability | AC1, AC6 |
| `yourwolf-frontend/src/test/wakeOrder.test.ts` | Create | 28 tests: shuffle (empty/single/multiset/determinism/immutability/`Math.random` default), waking-role collection (positive wake_order only, dedupe, count<=0, absent ids, sort, projection), group keys, group orders (within-group-only shuffle, determinism), flatten (ascending, order preservation, missing keys), role-id expansion | AC2, AC6 |
| `yourwolf-frontend/src/test/abilitySteps.test.ts` | Create | 49 tests: renumber (1-based, first='none', none→and promotion, or/if preserved), initial parameters, parameter type lookup, coercion (int fallback/clamp, array parse/filter, passthrough), append, remove, move up/down (incl. no-op identity), modifier set, parameter set (merge, isolation), immutability throughout | AC3, AC6 |

Regression anchors `GameSetup.test.tsx`, `WakeOrderResolution.test.tsx`, `AbilitiesStep.test.tsx` were **not modified** and pass as-is.

## Test Results

- **Baseline**: 371 passed, 3 failed (37 files; 3 pre-existing failures in `src/test/useRoles.test.ts`) — re-confirmed before implementation
- **Final**: 473 passed, 3 failed (same 3 pre-existing `useRoles.test.ts` failures)
- **New tests added**: 102 (25 + 28 + 49)
- **Regressions**: None
- **Typecheck**: `npx tsc --noEmit` → only the known pre-existing `Wizard.test.tsx(242): TS6133 'rerender' unused` (feature 12 owns)
- **Lint**: `npm run lint` → 2 pre-existing errors, both in files untouched by this feature (`useRoles.ts` unknown-rule `react-hooks/exhaustive-deps`; `Wizard.test.tsx` unused `rerender`). No new lint errors; `npx eslint src/domain` is clean, confirming the feature-03 boundary rule passes.

## Deviations from Plan

- **`shuffleArray` home**: plan listed `src/utils/` as a "verify" candidate. Placed in `src/domain/wakeOrder.ts` instead — the context Discovery Delta explicitly left this to the implementer, and it is used only by the wake-order rules, which Phase 04's engine will consume as one unit. Moving it to `src/utils/` would split one rule across two modules for no caller benefit.
- **`AbilitiesStep` extraction scope slightly wider than AC3's literal L307–L384**: also extracted `handleAddAbility`'s step construction (`appendAbilityStep` + `buildInitialParameters`, component L275–L298) and `handleRemoveStep` (L300–L305). Both apply the *same* modifier-normalization rule named by AC3, and leaving them inline would have left the rule duplicated in the component — defeating the AC. No behavior change.
- **`appendAbilityStep` takes an injectable `IdFactory`** (defaults to `crypto.randomUUID`), mirroring the plan's injectable-RNG decision so step creation is unit-testable. `domain/roleDraft.ts` from feature 03 calls `crypto.randomUUID()` directly; this is a superset of that precedent, not a conflict.
- **No test file needed modification for AC4.** The plan anticipated moving navigation assertions to page level, but `GameSetup.test.tsx` already mocks `useNavigate` and renders the page, so the existing assertion covers page-owned navigation unchanged.

## Gaps

- **`location.state` mechanism retained** — deferred per plan non-goals (audit rates replacement High risk; Phase 04 owns it when the engine constructs sessions). `WakeOrderRouterState` remains a compile-time-only contract: the consumer's `as` cast is unvalidated at runtime, so malformed router state would still fail late. AC5 is the audit's stated *minimum* fix, and this is its known residual.
- **`SortableTile` not extracted** — deferred to feature 08 / Phase 04 per non-goals.
- **Component-level decomposition of `AbilitiesStep` not done** — feature 08's scope.
- 3 pre-existing `useRoles.test.ts` failures and 2 pre-existing lint/tsc errors left untouched (out of scope; feature 12).

## Reviewer Focus Areas

- **Behavior preservation in `domain/abilitySteps.ts` move no-ops** — `moveStepUp`/`moveStepDown` signal "no move" by returning the *same array reference*, and `AbilitiesStep.tsx` checks `steps === draft.ability_steps` before calling `onChange`. This deliberately preserves the original early-return-without-`onChange`; a naive delegation would have fired a spurious `onChange` with a new draft object. Unreachable via UI today (buttons are disabled at the ends) but load-bearing for feature 08.
- **`toggleRoleSelection` / `adjustRoleCount` return `counts` unchanged (same reference) for unknown roles and max-count rejection** — this preserves React's `useState` bail-out. Verify the identity contract is intact if these are refactored.
- **`useGameSetup.wakeOrderPayload` is `null` until `canStart`** (`src/hooks/useGameSetup.ts:54-60`) — replaces `handleNext`'s `if (!canStart) return;` guard. Confirm the readiness signal is the right shape for Phase 04.
- **`collectWakingRoles` dedupe-then-lookup ordering** (`src/domain/wakeOrder.ts:38-50`) — `seen.add(roleId)` happens *before* the role-exists check, so an id absent from `roles` still marks as seen. This mirrors the original exactly; it is only observable with duplicate keys, which `Object.entries` cannot produce.
- **`src/types/routerState.ts` home** — router state is a UI transport concern, so it went to `src/types/` (per the plan's candidate) rather than `src/domain/`, keeping the domain free of routing concepts. Confirm this is where feature 11's type split expects it.
