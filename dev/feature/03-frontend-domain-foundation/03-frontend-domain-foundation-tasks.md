# Tasks: Frontend Domain Module Foundation

## Stage 1: Domain directory + team single-source

- [ ] Create `src/domain/teams.ts` [PROPOSED - name TBD] with a `TEAMS` const array (`village, werewolf, vampire, alien, neutral` — exact values and order) and a derived `Team` type (AC1)
- [ ] Derive `Team` in `src/types/role.ts` from the single source without changing the API-facing string union values (AC1)
- [ ] Derive `TEAM_ORDER` in `src/utils/roleSort.ts` from `TEAMS`, preserving current order (AC1)
- [ ] Derive `TeamColor` / `TEAM_COLORS` keys in `src/styles/theme.ts` from `TEAMS` so tsc catches a missing color (AC1)
- [ ] Replace the local `TEAMS` array in `BasicInfoStep.tsx` (L11) with the domain import (AC1)
- [ ] Add a unit test verifying derived team order/colors cover exactly the `TEAMS` array (test names [PROPOSED - name TBD]) (AC1)
- [ ] Run `npx vitest run` and `npm run build`; confirm no new failures vs. baseline (3 pre-existing useRoles failures)

## Stage 2: Constants, factory, and util moves

- [ ] Define `MODIFIER_LABELS` once in the domain constants module; import it in `AbilitiesStep.tsx` and `ReviewStep.tsx`, deleting both local copies (AC2)
- [ ] Move `ABILITY_CATEGORIES` and `STRING_TARGET_OPTIONS` from `AbilitiesStep.tsx` to `src/domain/constants.ts` [PROPOSED - name TBD]; import them in `AbilitiesStep` with values unchanged (AC3)
- [ ] Move `createEmptyDraft()` from `pages/RoleBuilder.tsx` to `src/domain/roleDraft.ts` [PROPOSED - name TBD]; import it in the page (AC4)
- [ ] Move `capitalize()` from `styles/theme.ts` to `src/utils/format.ts` [PROPOSED - name TBD]; update all 5 importers (`RoleCard.tsx`, `ReviewStep.tsx`, `BasicInfoStep.tsx`, `Roles.tsx`, `GameSetup.tsx`) so `theme.ts` exports design tokens only (AC5)
- [ ] Update any existing tests (roleSort, BasicInfoStep, AbilitiesStep, ReviewStep, RoleBuilder, RoleCard, Roles, GameSetup) whose imports reference moved symbols
- [ ] Run `npx vitest run` and `npm run build`; confirm no new failures vs. baseline

## Stage 3: Import-boundary lint rule

- [ ] Add `no-restricted-imports` rules to `eslint.config.js` (flat config): files under `src/domain/` (and future `src/engine/`) must not import `react`, `src/api`, `src/hooks`, `src/components`, `src/pages`, or `src/styles` (AC6)
- [ ] Add rule: `src/components` must not import `src/api` directly (AC6)
- [ ] Exempt the existing violation in `BasicInfoStep.tsx` with a lint-disable/TODO referencing feature `12-frontend-dead-code-and-tests` (AC6)
- [ ] Capture lint evidence: run `npm run lint` clean, then demonstrate a deliberate boundary violation fails, then remove it (AC6)
- [ ] Run `npm run build` and `npx vitest run`; confirm build green and no new test failures vs. baseline (AC7)
