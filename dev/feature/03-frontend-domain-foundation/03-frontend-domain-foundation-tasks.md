# Tasks: Frontend Domain Module Foundation

## Stage 1: Domain directory + team single-source

- [x] Create `src/domain/teams.ts` with a `TEAMS` const array (`village, werewolf, vampire, alien, neutral` — exact values and order) and a derived `Team` type (AC1)
- [x] Derive `Team` in `src/types/role.ts` from the single source without changing the API-facing string union values (AC1)
- [x] Derive `TEAM_ORDER` in `src/utils/roleSort.ts` from `TEAMS`, preserving current order (AC1)
- [x] Derive `TeamColor` / `TEAM_COLORS` keys in `src/styles/theme.ts` from `TEAMS` so tsc catches a missing color (AC1)
- [x] Replace the local `TEAMS` array in `BasicInfoStep.tsx` (L11) with the domain import (AC1)
- [x] Add a unit test verifying derived team order/colors cover exactly the `TEAMS` array — `src/test/teams.test.ts`, suite `domain/teams single source` (AC1)
- [x] Run `npx vitest run` and `npm run build`; confirm no new failures vs. baseline (3 pre-existing useRoles failures) — tests confirmed; build blocked by a pre-existing `Wizard.test.tsx` tsc error present at clean baseline (see implementation record, Gaps)

## Stage 2: Constants, factory, and util moves

- [x] Define `MODIFIER_LABELS` once in the domain constants module; import it in `AbilitiesStep.tsx` and `ReviewStep.tsx`, deleting both local copies (AC2)
- [x] Move `ABILITY_CATEGORIES` and `STRING_TARGET_OPTIONS` from `AbilitiesStep.tsx` to `src/domain/constants.ts`; import them in `AbilitiesStep` with values unchanged (AC3)
- [x] Move `createEmptyDraft()` from `pages/RoleBuilder.tsx` to `src/domain/roleDraft.ts`; import it in the page (AC4)
- [x] Move `capitalize()` from `styles/theme.ts` to `src/utils/format.ts`; update all importers (`RoleCard.tsx`, `BasicInfoStep.tsx`, `Roles.tsx`, `GameSetup.tsx`) so `theme.ts` exports design tokens only (AC5) — 4 importers, not 5: `ReviewStep.tsx` was a grep false positive (CSS `textTransform: 'capitalize'`)
- [x] Update any existing tests whose imports reference moved symbols — none required updating; no existing test imported a moved symbol from its old location
- [x] Run `npx vitest run` and `npm run build`; confirm no new failures vs. baseline

## Stage 3: Import-boundary lint rule

- [x] Add `no-restricted-imports` rules to `eslint.config.js` (flat config): files under `src/domain/` (and future `src/engine/`) must not import `react`, `src/api`, `src/hooks`, `src/components`, `src/pages`, or `src/styles` (AC6)
- [x] Add rule: `src/components` must not import `src/api` directly (AC6)
- [x] Exempt the existing violation in `BasicInfoStep.tsx` with a lint-disable/TODO referencing feature `12-frontend-dead-code-and-tests` (AC6)
- [x] Capture lint evidence: rule shown firing on `BasicInfoStep` before exemption, and on a deliberate 3-category violation in `src/domain/teams.ts` (reverted) — see implementation record, "AC6 Lint Evidence". Note: `npm run lint` is not clean at baseline (2 pre-existing errors); my changes add zero net lint errors
- [x] Run `npm run build` and `npx vitest run`; confirm build green and no new test failures vs. baseline (AC7) — tests: 371 passed / 3 pre-existing failures, zero regressions. Build: **not green**, blocked by pre-existing `Wizard.test.tsx` error outside this feature's scope (feature 12 owns it)
