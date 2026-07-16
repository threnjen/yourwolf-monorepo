# Context: Frontend Pure Game-Rule Modules

## Key Files

### Files Being Changed

| File | Role | Change Type |
|------|------|-------------|
| `yourwolf-frontend/src/domain/roleSelection.ts` [PROPOSED - name TBD] | Pure role-dependency cascade logic (extracted from `useGameSetup`) | Create |
| `yourwolf-frontend/src/domain/wakeOrder.ts` [PROPOSED - name TBD] | Wake-group construction, within-group shuffle (injectable RNG), flatten to `wake_order_sequence` | Create |
| `yourwolf-frontend/src/domain/abilitySteps.ts` [PROPOSED - name TBD] | Step renumbering, modifier normalization, parameter coercion | Create |
| `yourwolf-frontend/src/hooks/useGameSetup.ts` | Becomes thin adapter; drop `NavigateFunction` param (currently imported L2, used L13, navigates L107) | Modify |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | Takes over navigation to `/games/new/wake-order`; imports shared router-state type | Modify |
| `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` | Delegate to `domain/wakeOrder`; remove local `shuffleArray` (L41) and local `WakeOrderRouterState` interface (L26); cast at L82 uses shared type | Modify |
| `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Delegate renumber/normalize/coercion to `domain/abilitySteps` | Modify |
| Shared router-state type module [PROPOSED - name TBD] | Single declaration of `WakeOrderRouterState` imported by producer and consumer (candidate home: `src/types/`) | Create |
| `yourwolf-frontend/src/test/GameSetup.test.tsx` | Regression anchor (485 lines); navigation assertions move to page-level (AC4) | Modify (minimal) |
| `yourwolf-frontend/src/test/WakeOrderResolution.test.tsx` | Regression anchor | Verify / minimal update |
| `yourwolf-frontend/src/test/AbilitiesStep.test.tsx` | Regression anchor | Verify / minimal update |
| New domain unit test files [PROPOSED - name TBD] | Direct unit tests for the three domain modules (no RTL) | Create |

### Read-Only Reference Files

| File | Role |
|------|------|
| `yourwolf-frontend/src/types/game.ts` | Declares `wake_order_sequence?: string[]` (L14) — the backend shape the flatten output must match |
| `yourwolf-frontend/src/utils/roleSort.ts` + `src/test/roleSort.test.ts` | Existing pure-module + direct-unit-test pattern to mirror |
| `dev/refactor-audit-frontend/refactor-audit-frontend-report.md` | Source audit findings 5.1, 4.1, 4.3, 1.4, restructuring item 8 |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| `src/domain/` does not exist yet and `eslint.config.js` contains no domain boundary rule — dependency 03-frontend-domain-foundation is not yet implemented | This feature must not start until 03 lands (Wave 1); plan already declares the dependency | None — confirms wave ordering |
| `WakeOrderRouterState` currently declared locally in `WakeOrderResolution.tsx` L26 and cast at L82 exactly as the plan describes | Validates AC5 | None |
| `useGameSetup.ts` verified: `NavigateFunction` import (L2), param (L13), hardcoded `navigate('/games/new/wake-order', ...)` (L107); cascade logic starts ~L38 | Validates AC1/AC4 line references | None |
| `shuffleArray` verified local to `WakeOrderResolution.tsx` (L41, used L123); not in `src/utils/` | Plan's "shuffleArray home, verify" in `src/utils/` — it does not exist there yet; move target is the new `domain/wakeOrder.ts` (or utils, implementer's call) | Implementer chooses final home; record in implementation notes |
| Test baseline has 3 pre-existing failures in `src/test/useRoles.test.ts` (unrelated to this feature) | AC7 "all existing tests pass" should read as "no new failures vs. baseline" | Accepted risk — do not fix in this feature |
| `src/utils/` currently contains only `roleSort.ts`, an existing pure-function-with-direct-unit-test pattern (`roleSort.test.ts`) | Naming/test pattern precedent for new domain modules | Follow this pattern |
| No phase-scoped test directory pattern found; all tests live flat in `src/test/` | New domain unit tests go in `src/test/` per convention | None |
| No contradictions requiring Decomposer attention beyond the notes above | — | — |

## Architectural Decisions

- **Extract, don't redesign** — domain modules mirror function-per-operation what the React code does today. No engine features added early (those belong to Phase 04).
- **Pure TS domain modules** — data-in/data-out with exported types; no React imports; enforced by the ESLint boundary rule delivered by feature 03.
- **Injectable RNG** in `wakeOrder` shuffle, defaulting to `Math.random` in production, so unit tests are deterministic.
- **Navigation ownership moves to the page** (AC4): the hook exposes state + a readiness signal/payload; `GameSetup.tsx` calls `navigate`. Decouples the hook from react-router.
- **Single shared `WakeOrderRouterState` declaration** imported by both producer and consumer; the `as` cast remains but reads from the shared type (minimum fix per audit finding 4.1).
- **No logging** in domain modules — test-sensitive hot paths; audit's "no new normal-path logs" guidance applies.

## Constraints

- Behavior must be preserved bit-for-bit: cascade add/remove/quantity behaviors, group order, OR-modifier semantics, 1-based/0-based numbering exactly as current code.
- Flatten output must match the exact `wake_order_sequence: string[]` shape in `src/types/game.ts`.
- Existing large test files (`GameSetup.test.tsx`, `WakeOrderResolution.test.tsx`, `AbilitiesStep.test.tsx`) are regression anchors — pass unmodified except where they asserted on moved implementation details (e.g., navigation assertions).
- Function signatures must stay data-in/data-out with exported types — downstream consumers are feature 08 (`domain/abilitySteps`) and Phase 04's engine (all three modules).

## Scope Boundaries

- No visual/component decomposition of `AbilitiesStep` (feature 08).
- Do not replace the `location.state` mechanism with context/sessionStorage — audit rates it High risk; deferred to Phase 04. Record as deferred.
- `SortableTile` extraction deferred to feature 08 or Phase 04.
- Do not touch backend code or the 3 pre-existing `useRoles.test.ts` failures.
- Do not modify `-plan.md` documents.

## Relationships to Sibling Plans

- **Depends on 03-frontend-domain-foundation** (Wave 1): provides `src/domain/` directory, constants, and the ESLint boundary rule. Also shares `AbilitiesStep.tsx` with 03.
- **08-frontend-abilities-step** (Wave 3) depends on this feature and consumes `domain/abilitySteps.ts`; it also shares `AbilitiesStep.tsx`.
- Phase 04's engine consumes all three domain modules.

## Suggested Implementation Order

Wave 2, after 03-frontend-domain-foundation. Parallel-safe within Wave 2. Internally: Stage 1 (roleSelection + hook navigation removal) → Stage 2 (wakeOrder + shared router-state type) → Stage 3 (abilitySteps).

## Environment State

| Property | Value |
|----------|-------|
| Tech Stack | React 18 + TypeScript + Vite (yourwolf-frontend), Vitest + React Testing Library, @dnd-kit |
| Test Runner | `npx vitest run` (in `yourwolf-frontend/`) |
| Test Baseline | 355 passed, 3 failed (all in `src/test/useRoles.test.ts`, pre-existing/unrelated) — captured 2026-07-16 |
| Lint | `npm run lint` (`eslint . --ext ts,tsx --max-warnings 0`) |
| Format | Not configured (no standalone format script) |

## Relevant Learnings

None applicable — no `.github/learnings/` directory exists in this repository.
