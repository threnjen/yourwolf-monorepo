# Plan: Frontend Domain Module Foundation

## Execution Metadata

- **Wave:** 1
- **Parallel safe:** yes
- **Depends on:** none
- **Key files modified:** `yourwolf-frontend/src/domain/teams.ts` [PROPOSED - name TBD] (new), `yourwolf-frontend/src/domain/constants.ts` [PROPOSED - name TBD] (new), `yourwolf-frontend/src/utils/format.ts` [PROPOSED - name TBD] (new), `yourwolf-frontend/src/styles/theme.ts`, `yourwolf-frontend/src/utils/roleSort.ts`, `yourwolf-frontend/src/types/role.ts`, `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx`, `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx`, `yourwolf-frontend/src/components/RoleBuilder/steps/ReviewStep.tsx`, `yourwolf-frontend/src/pages/RoleBuilder.tsx`, `yourwolf-frontend/.eslintrc`/`eslint.config.*` (verify), ~4 `capitalize` importers
- **Sequential reason:** n/a

Source: refactor audit findings 4.2 (M, ENGINE), 4.4, 4.5 (M, ENGINE), 5.2, 1.3, 6.3, and restructuring items 1, 3, 7, 10 in `dev/refactor-audit-frontend/refactor-audit-frontend-report.md`. This feature creates the `src/domain/` landing zone Phase 04's engine will build on.

## A. Requirements & Traceability

Acceptance criteria:

- **AC1**: A `src/domain/` directory exists with a single-source team definition: a `TEAMS` const array with derived `Team` type. `TEAM_ORDER` (`utils/roleSort.ts` L3), `TeamColor` keys (`styles/theme.ts` L42), and the `TEAMS` list in `BasicInfoStep.tsx` L11 are all derived from or replaced by it — the five teams are stated exactly once.
- **AC2**: `MODIFIER_LABELS` (duplicated in `AbilitiesStep.tsx` L28–L33 and `ReviewStep.tsx` L4–L9) is defined once in the domain layer next to the modifier type; both components import it.
- **AC3**: `ABILITY_CATEGORIES` and `STRING_TARGET_OPTIONS` (`AbilitiesStep.tsx` L18–L24, L126–L139) move to a domain constants module; `AbilitiesStep` imports them.
- **AC4**: `createEmptyDraft()` (`pages/RoleBuilder.tsx` L9–L25) moves to a domain module next to the `RoleDraft` type concept (e.g., `domain/roleDraft.ts` [PROPOSED - name TBD]); the page imports it.
- **AC5**: `capitalize()` moves from `styles/theme.ts` L52–L54 to `src/utils/format.ts` [PROPOSED - name TBD]; all 5 importers updated (expander-verified count); `styles/theme.ts` exports design tokens only.
- **AC6**: An ESLint import-boundary rule enforces (via `no-restricted-imports` in the flat `eslint.config.js` — ESLint 9 flat config is what the repo uses; no boundaries plugin is installed and none should be added): files under `src/domain/` (and future `src/engine/`) must not import from `react`, `src/api`, `src/hooks`, `src/components`, `src/pages`, or `src/styles`; and `src/components` must not import `src/api` directly. The existing violation in `BasicInfoStep` (finding 2.4) is exempted with a tracked TODO or lint-disable referencing feature `12-frontend-dead-code-and-tests`, which fixes it.
- **AC7**: `npm run build` (tsc) passes and the vitest suite shows no new failures versus baseline (baseline is NOT green: 3 pre-existing failures in `src/test/useRoles.test.ts` — do not chase them in this feature).

Non-goals: no extraction of game-rule *logic* (that is `06-frontend-game-rules`); no splitting of `types/role.ts` (that is `11-frontend-type-split`); no component decomposition.

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1 | `domain/teams.ts`, theme, roleSort, BasicInfoStep | Must-have automated test: single-source teams derivations — scenario, names [PROPOSED - name TBD]; existing roleSort/RoleCard/BasicInfoStep tests |
| AC2–AC4 | domain constants/factory modules + importers | Existing component tests (AbilitiesStep, ReviewStep, RoleBuilder) |
| AC5 | `utils/format.ts` + 4 importers | Existing component tests; tsc |
| AC6 | ESLint config | Code-review evidence: lint run output showing rule active and a deliberate violation failing |
| AC7 | whole package | Existing suite + build |

## B. Correctness & Edge Cases

- `Team` type in `types/role.ts` L1 is a transport-facing type — AC1 must keep the API-facing string union values identical; derive rather than rename.
- Team *ordering* is semantic (`TEAM_ORDER` drives sorting) — preserve the exact current order in the single source.
- `TEAM_COLORS` keys must stay in sync — derive keys from `TEAMS` so tsc catches a missing color.

## C. Consistency & Architecture Fit

- Naming and layout should anticipate Phase 04: `src/domain/` is the engine's dependency layer; keep every module pure TypeScript (no React imports) from day one — the ESLint rule enforces this.
- Follow existing kebab/camel file naming in `src/utils/`.

## D. Clean Design & Maintainability

Constants-and-derivation only; no logic changes. Resist the temptation to also move logic — that's Wave 2.

## E. Observability, Security, Operability

No logging, no security surface. Rollback: revert; purely internal moves.

## F. Test Plan

- Must-have: unit test that derived team order/colors cover exactly the `TEAMS` array (scenario; names [PROPOSED - name TBD]).
- Existing tests to update: imports in `roleSort`, `BasicInfoStep`, `AbilitiesStep`, `ReviewStep`, `RoleBuilder` tests if they reference moved symbols.
- Evidence for AC6: lint output demonstrating the boundary rule fires.

## Stage 1: Domain directory + team single-source
**Goal**: AC1 complete
**Success Criteria**: Five teams defined once; all derivations compile; suite passes
**Status**: Not Started

## Stage 2: Constants, factory, and util moves
**Goal**: AC2–AC5 complete
**Success Criteria**: No duplicated domain vocab; theme is tokens-only; suite passes
**Status**: Not Started

## Stage 3: Import-boundary lint rule
**Goal**: AC6, AC7 complete
**Success Criteria**: Boundary rule active in CI lint; build and tests green
**Status**: Not Started
