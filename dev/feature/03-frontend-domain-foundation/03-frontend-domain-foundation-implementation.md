# Implementation Record: Frontend Domain Module Foundation

## Summary

Created the `src/domain/` pure-TypeScript landing zone that Phase 04's engine will build on, and moved duplicated domain vocabulary into it. The five teams are now stated exactly once in `src/domain/teams.ts`, with `Team`, `TEAM_ORDER`, and `TEAM_COLORS` keys all derived from that single array. `MODIFIER_LABELS` (previously duplicated across two components), `ABILITY_CATEGORIES`, and `STRING_TARGET_OPTIONS` live in `src/domain/constants.ts`; `createEmptyDraft()` lives in `src/domain/roleDraft.ts`; `capitalize()` moved to `src/utils/format.ts`, leaving `styles/theme.ts` as design tokens only. An ESLint `no-restricted-imports` boundary rule in the flat `eslint.config.js` enforces domain purity from day one.

This was a constants-and-derivation refactor: no game-rule logic, behavior, or transport values changed.

## Sibling Features

Scanned all 11 sibling feature directories (titles/overviews only).

- **`06-frontend-game-rules` (Wave 2)** — will move game-rule *logic* into the `src/domain/` layer created here. Kept module layout flat and additive so logic modules can land alongside `teams.ts`/`constants.ts` without restructuring.
- **`08-frontend-abilities-step` (Wave 3)** — decomposes `AbilitiesStep`. This feature *shrinks* that component by removing three local constant blocks, which should reduce conflict surface rather than add to it.
- **`11-frontend-type-split` (Wave 4)** — will split `types/role.ts`. Kept the change there to a single derive-and-re-export of `Team`; `StepModifier` and `RoleDraft` were deliberately left in place for feature 11.
- **`12-frontend-dead-code-and-tests` (Wave 5)** — owns the exempted `BasicInfoStep → src/api` violation (tracked by TODO), the 3 pre-existing `useRoles.test.ts` failures, and the pre-existing `Wizard.test.tsx` lint/tsc error (see Gaps).
- **Shared modules touched that siblings will also modify**: `src/types/role.ts` (feature 11), `src/components/RoleBuilder/steps/AbilitiesStep.tsx` (feature 08), `src/components/RoleBuilder/steps/BasicInfoStep.tsx` (feature 12).
- No backend files touched; `yourwolf-backend/` untouched entirely.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 (single-source teams) | [PROPOSED - name TBD] → `domain/teams single source` | Unit test asserting derived team order/colors cover exactly `TEAMS` | Done | `src/domain/teams.ts`, `src/types/role.ts`, `src/utils/roleSort.ts`, `src/styles/theme.ts`, `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | `yourwolf-frontend/src/test/teams.test.ts`, `yourwolf-frontend/src/test/roleSort.test.ts` | PENDING | PENDING |
| AC2 | AC2 (MODIFIER_LABELS once) | `domain/constants MODIFIER_LABELS` | Existing AbilitiesStep/ReviewStep component tests | Done | `src/domain/constants.ts`, `AbilitiesStep.tsx`, `ReviewStep.tsx` | `yourwolf-frontend/src/test/domainConstants.test.ts`, `src/test/AbilitiesStep.test.tsx`, `src/test/ReviewStep.test.tsx` | PENDING | PENDING |
| AC3 | AC3 (categories + target options) | `domain/constants ABILITY_CATEGORIES`, `domain/constants STRING_TARGET_OPTIONS` | Existing AbilitiesStep tests + value-preservation unit tests | Done | `src/domain/constants.ts`, `AbilitiesStep.tsx` | `yourwolf-frontend/src/test/domainConstants.test.ts`, `src/test/AbilitiesStep.test.tsx` | PENDING | PENDING |
| AC4 | AC4 (createEmptyDraft) | `domain/roleDraft createEmptyDraft` | Existing RoleBuilder page tests | Done | `src/domain/roleDraft.ts`, `src/pages/RoleBuilder.tsx` | `yourwolf-frontend/src/test/roleDraft.test.ts`, `src/test/RoleBuilder.test.tsx` | PENDING | PENDING |
| AC5 | AC5 (capitalize relocation) | `utils/format capitalize` | Existing component tests + tsc | Done | `src/utils/format.ts`, `src/styles/theme.ts`, `RoleCard.tsx`, `BasicInfoStep.tsx`, `Roles.tsx`, `GameSetup.tsx` | `yourwolf-frontend/src/test/format.test.ts`, `src/test/RoleCard.test.tsx`, `src/test/Roles.test.tsx`, `src/test/GameSetup.test.tsx` | PENDING | PENDING |
| AC6 | AC6 (import boundary rule) | n/a (lint evidence) | Lint run output showing rule active + deliberate violation failing | Done | `yourwolf-frontend/eslint.config.js`, `BasicInfoStep.tsx` (exemption) | `yourwolf-frontend/eslint.config.js` (lines with `no-restricted-imports`); evidence transcript in "AC6 Lint Evidence" below | PENDING | PENDING |
| AC7 | AC7 (build + no new test failures) | n/a (suite + build) | Full vitest suite + `npm run build` | Partial | whole package | `npx vitest run` output: 371 passed / 3 failed (pre-existing); `npm run build` blocked by pre-existing error — see Gaps | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | `src/domain/` exists with single-source `TEAMS` + derived `Team`; `TEAM_ORDER`, `TeamColor` keys, and BasicInfoStep `TEAMS` all derive from it | Done | `src/domain/teams.ts`, `src/types/role.ts`, `src/utils/roleSort.ts`, `src/styles/theme.ts`, `BasicInfoStep.tsx` | Five teams now stated exactly once. `TEAM_COLORS: Record<TeamColor, string>` with `TeamColor = Team` means tsc fails if a color is missing. Order and string values preserved byte-for-byte. |
| AC2 | `MODIFIER_LABELS` defined once; both components import it | Done | `src/domain/constants.ts`, `AbilitiesStep.tsx`, `ReviewStep.tsx` | Both local copies deleted. Also co-located the adjacent `MODIFIERS` array (context Discovery Delta called this optional/in-spirit). |
| AC3 | `ABILITY_CATEGORIES` and `STRING_TARGET_OPTIONS` moved to domain constants | Done | `src/domain/constants.ts`, `AbilitiesStep.tsx` | Values preserved exactly and pinned by unit tests, since `AbilitiesStep.test.tsx` asserts on rendered option values. `AbilityCategory` interface moved with them. |
| AC4 | `createEmptyDraft()` moved to a domain module; page imports it | Done | `src/domain/roleDraft.ts`, `src/pages/RoleBuilder.tsx` | Named `domain/roleDraft.ts` per the context table's proposed name. |
| AC5 | `capitalize()` moved to `src/utils/format.ts`; all importers updated; theme is tokens-only | Done | `src/utils/format.ts`, `src/styles/theme.ts`, `RoleCard.tsx`, `BasicInfoStep.tsx`, `Roles.tsx`, `GameSetup.tsx` | **4** importers, not 5 — see Deviations. `theme.ts` now exports only `theme`, `TeamColor`, `TEAM_COLORS`, `Theme`. |
| AC6 | ESLint import-boundary rule via `no-restricted-imports` in flat config; BasicInfoStep violation exempted with tracked TODO | Done | `eslint.config.js`, `BasicInfoStep.tsx` | Rule verified firing on all three restricted categories (react, styles, api). Exemption references feature `12-frontend-dead-code-and-tests`. |
| AC7 | `npm run build` passes; vitest shows no new failures vs. baseline | Partial | whole package | Test half fully met: 371 passed / 3 failed, same 3 pre-existing `useRoles` failures, zero regressions. Build half **cannot be met literally** — `npm run build` was already red at clean baseline. See Gaps. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/domain/teams.ts` | Create | `TEAMS` const array (`village, werewolf, vampire, alien, neutral`) + derived `Team` type; comment documents order-is-semantic and transport-facing values | AC1 — single source of truth; landing zone for Phase 04 engine |
| `yourwolf-frontend/src/domain/constants.ts` | Create | `AbilityCategory` interface, `ABILITY_CATEGORIES`, `STRING_TARGET_OPTIONS`, `MODIFIERS`, `MODIFIER_LABELS` | AC2, AC3 — de-duplicate domain vocabulary |
| `yourwolf-frontend/src/domain/roleDraft.ts` | Create | `createEmptyDraft()` factory | AC4 — co-locate factory with the domain concept |
| `yourwolf-frontend/src/utils/format.ts` | Create | `capitalize()` | AC5 — theme becomes design-tokens-only |
| `yourwolf-frontend/src/types/role.ts` | Modify | `Team` union replaced by `import type {Team} from '../domain/teams'` + `export type {Team}` re-export | AC1 — derive without changing transport values; re-export keeps all existing importers working |
| `yourwolf-frontend/src/utils/roleSort.ts` | Modify | `TEAM_ORDER` now `readonly Team[] = TEAMS` instead of a literal array | AC1 — derive; order preserved |
| `yourwolf-frontend/src/styles/theme.ts` | Modify | `TeamColor` is now `Team`; imports type from domain; `capitalize()` removed | AC1, AC5 — tsc catches a missing team color; tokens only |
| `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Modify | Local `TEAMS` array deleted → domain import; `capitalize` import repointed; eslint-disable + TODO added for the api import | AC1, AC5, AC6 |
| `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Modify | Local `AbilityCategory`, `ABILITY_CATEGORIES`, `MODIFIERS`, `MODIFIER_LABELS`, `STRING_TARGET_OPTIONS` deleted → domain imports | AC2, AC3 |
| `yourwolf-frontend/src/components/RoleBuilder/steps/ReviewStep.tsx` | Modify | Local `MODIFIER_LABELS` deleted → domain import; unused `StepModifier` type import dropped | AC2 |
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | Modify | Local `createEmptyDraft()` deleted → domain import | AC4 |
| `yourwolf-frontend/src/components/RoleCard.tsx` | Modify | `capitalize` import repointed to `utils/format` | AC5 |
| `yourwolf-frontend/src/pages/Roles.tsx` | Modify | `capitalize` import repointed to `utils/format` | AC5 |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | Modify | `capitalize` import repointed to `utils/format` | AC5 |
| `yourwolf-frontend/eslint.config.js` | Modify | Added `UI_LAYERS` const, `layerPatterns()` helper, and two `no-restricted-imports` config blocks (domain/engine purity; components↛api) | AC6 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-frontend/src/test/teams.test.ts` | Create | 4 tests: canonical order stated once; `TEAM_ORDER` covers exactly `TEAMS` in order; `TEAM_COLORS` keys cover exactly `TEAMS`; every team maps to a hex token | AC1 |
| `yourwolf-frontend/src/test/domainConstants.test.ts` | Create | 5 tests: `MODIFIER_LABELS` exact values; every `MODIFIERS` entry labelled; `ABILITY_CATEGORIES` exact shape; unique category ids; `STRING_TARGET_OPTIONS` exact order | AC2, AC3 |
| `yourwolf-frontend/src/test/roleDraft.test.ts` | Create | 3 tests: documented empty defaults; fresh id per call; matching ISO `created_at`/`updated_at` | AC4 |
| `yourwolf-frontend/src/test/format.test.ts` | Create | 4 tests: capitalizes first char; already-capitalized unchanged; empty string; does not lowercase remainder | AC5 |

No existing test files required modification — no existing test imported a moved symbol from its old location (`roleSort.test.ts` imports `TEAM_ORDER` from `utils/roleSort`, which still exports it).

## Test Results

- **Baseline**: 355 passed, 3 failed (34 files: 1 failed, 29 passed) — all 3 failures in `src/test/useRoles.test.ts`, pre-existing and owned by feature 12. Re-confirmed by running the suite before any code change.
- **Final**: 371 passed, 3 failed — the same 3 `useRoles.test.ts` failures, unchanged.
- **New tests added**: 16 (4 teams + 5 domain constants + 3 roleDraft + 4 format). 355 + 16 = 371 confirms every new test passes and nothing regressed.
- **Regressions**: None.

### AC6 Lint Evidence

`npm run lint` at clean baseline → **2 errors** (both pre-existing):
- `src/hooks/useRoles.ts:21` — `Definition for rule 'react-hooks/exhaustive-deps' was not found`
- `src/test/Wizard.test.tsx:242` — `'rerender' is assigned a value but never used`

`npm run lint` with the boundary rule added, **before** the exemption → **3 errors** (the 2 above plus the rule correctly catching the known violation):
```
src/components/RoleBuilder/steps/BasicInfoStep.tsx
  3:1  error  '../../../api/roles' import is restricted from being used by a pattern.
              src/components must not import src/api directly — use a hook from src/hooks
              no-restricted-imports
```

`npm run lint` **after** the tracked exemption → back to the same **2 pre-existing errors**. Because lint runs with `--report-unused-disable-directives`, the directive being accepted proves it is actively suppressing a real violation rather than sitting dead.

Deliberate violation added to `src/domain/teams.ts` (then reverted) proves all three restricted categories fire:
```
src/domain/teams.ts
  11:1  error  'react' import is restricted ... must stay pure TypeScript — no React imports
  12:1  error  '../styles/theme' import is restricted ... Dependencies point inward
  13:1  error  '../api/roles' import is restricted ... Dependencies point inward
✖ 3 problems (3 errors, 0 warnings)
```
`npx eslint src/domain/` after revert: clean.

## Deviations from Plan

1. **`capitalize` has 4 importers, not 5.** The context Discovery Delta claimed 5, listing `ReviewStep.tsx`. `ReviewStep.tsx` never imported the function — its only match is the CSS value `textTransform: 'capitalize'` on line 44, a grep false positive. Actual importers: `RoleCard.tsx`, `BasicInfoStep.tsx`, `Roles.tsx`, `GameSetup.tsx`. The plan's original "~4 importers" estimate was correct. All 4 updated; verified zero remaining `capitalize` imports from `styles/theme`.

2. **`MODIFIERS` array moved alongside `MODIFIER_LABELS`.** Not strictly required by AC2, but flagged as optional/in-spirit by the context Discovery Delta. Moved because it is domain vocabulary that must stay in lockstep with the labels; the unit test now pins that every `MODIFIERS` entry has a label.

3. **`MODIFIER_LABELS` placed in `domain/constants.ts`, not literally "next to the modifier type".** AC2's wording suggests co-locating with `StepModifier`, but `StepModifier` lives in `types/role.ts`, and splitting that file is an explicit non-goal (feature 11). Followed the context Key Files table, which assigns `MODIFIER_LABELS` to `domain/constants.ts`. Safest default: no `types/role.ts` restructuring beyond the required `Team` derivation.

4. **`react-dom` included in the domain React restriction** alongside `react`, which AC6 names alone. Trivial extension, squarely within AC6's stated intent ("keep every module pure TypeScript (no React imports)").

## Gaps

1. **AC7's build half cannot be satisfied — pre-existing, outside declared scope.** `npm run build` (`tsc && vite build`) fails at *clean baseline*, before any of my changes, with:
   ```
   src/test/Wizard.test.tsx(242,13): error TS6133: 'rerender' is declared but its value is never read.
   ```
   Verified by stashing all my work and rebuilding. This is the **same** defect as the second pre-existing lint error. The plan anticipated a red *test* baseline but assumed a green build; that assumption is wrong.

   I did **not** fix it. `src/test/Wizard.test.tsx` is not in this feature's declared Key Files, and an unused variable in a test file is squarely `12-frontend-dead-code-and-tests` territory. Per scope discipline, I left it.

   **My code compiles cleanly**: `npx tsc --noEmit` reports this one error and nothing else — no error touches any file I created or modified. The fix is a one-line change (prefix `_rerender` or drop the binding) whenever the owning feature runs.

2. **`npm run lint` is not clean**, and the Stage 3 task "run `npm run lint` clean" cannot be met literally, for the same reason: 2 pre-existing errors at baseline (`useRoles.ts` references the `react-hooks/exhaustive-deps` rule, but `eslint-plugin-react-hooks` is not registered in the flat config; plus the `Wizard.test.tsx` unused var). My changes add **zero** net lint errors. Both are feature 12's domain. Notably the `react-hooks` error means that plugin's rules are silently not enforced repo-wide — worth surfacing to whoever owns feature 12.

3. No ledger infrastructure exists in this repo (no `ledger-events.jsonl` / `dev/ledger*`), so the two pre-existing blockers above are recorded here rather than as ledger rows. This was an initial implementation pass, not a remediation turn.

## Reviewer Focus Areas

- **`src/types/role.ts` `Team` re-export** — a bare `export type {Team} from '../domain/teams'` would re-export without binding `Team` locally, breaking the ~4 interfaces in that file that use it. Implemented as `import type` + `export type {Team}` so both work. Worth confirming this is the pattern feature 11 wants to inherit.
- **`TEAM_ORDER` widened to `readonly Team[]`** (`src/utils/roleSort.ts:3`) — necessary because `TEAMS` is `as const`. `.indexOf()` and `.length` still typecheck, and `roleSort.test.ts` passes unchanged, but any future caller wanting to mutate `TEAM_ORDER` would now fail to compile. That is intended, but it is a public-API type change.
- **ESLint `layerPatterns()` glob strategy** (`eslint.config.js`) — matches `**/{layer}` and `**/{layer}/**` against the raw import string so it catches any relative depth (`../api/roles`, `../../../styles/theme`). This is path-string matching, not resolved-module matching; it would not catch an alias import if one is ever introduced. No aliases are configured today.
- **`src/styles/theme.ts` now imports from `src/domain/`** — direction is styles → domain, which the boundary rule permits (domain must not import styles, not the reverse). Confirm this is the intended dependency direction for Phase 04.
- **Constant values are pinned by exact-equality tests** (`domainConstants.test.ts`) — deliberate, because `AbilitiesStep.test.tsx` asserts on rendered option values and these constants are transport-adjacent. Reviewers should expect these tests to be intentionally brittle.
