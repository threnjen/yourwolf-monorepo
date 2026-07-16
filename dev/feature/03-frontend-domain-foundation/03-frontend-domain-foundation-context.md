# Context: Frontend Domain Module Foundation

## Key Files

### Files being changed

| File | Role | Change Type |
|------|------|-------------|
| `yourwolf-frontend/src/domain/teams.ts` [PROPOSED - name TBD] | Single-source `TEAMS` const array + derived `Team` type | Create |
| `yourwolf-frontend/src/domain/constants.ts` [PROPOSED - name TBD] | `MODIFIER_LABELS`, `ABILITY_CATEGORIES`, `STRING_TARGET_OPTIONS` | Create |
| `yourwolf-frontend/src/domain/roleDraft.ts` [PROPOSED - name TBD] | `createEmptyDraft()` factory | Create |
| `yourwolf-frontend/src/utils/format.ts` [PROPOSED - name TBD] | Relocated `capitalize()` | Create |
| `yourwolf-frontend/src/styles/theme.ts` | Remove `capitalize` (L52–54); derive `TEAM_COLORS` keys from `TEAMS`; keep design tokens only | Modify |
| `yourwolf-frontend/src/utils/roleSort.ts` | `TEAM_ORDER` (L3) derived from single source | Modify |
| `yourwolf-frontend/src/types/role.ts` | `Team` union (L1) becomes derived from `TEAMS` (values must stay identical) | Modify |
| `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Drop local `TEAMS` (L11); import from domain; update `capitalize` import | Modify |
| `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Import `ABILITY_CATEGORIES` (L18–24), `MODIFIER_LABELS` (L28–33), `STRING_TARGET_OPTIONS` (L126–139) from domain | Modify |
| `yourwolf-frontend/src/components/RoleBuilder/steps/ReviewStep.tsx` | Import `MODIFIER_LABELS` (L4–9) from domain; update `capitalize` import | Modify |
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | Import `createEmptyDraft` (currently L9–25) from domain | Modify |
| `yourwolf-frontend/src/components/RoleCard.tsx` | Update `capitalize` import | Modify |
| `yourwolf-frontend/src/pages/Roles.tsx` | Update `capitalize` import | Modify |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | Update `capitalize` import | Modify |
| `yourwolf-frontend/eslint.config.js` | Add `no-restricted-imports` boundary rules (flat config, ESLint 9 + typescript-eslint 8) | Modify |

### Read-only reference

| File | Role |
|------|------|
| `yourwolf-frontend/src/test/*.test.tsx` | Existing tests for roleSort, BasicInfoStep, AbilitiesStep, ReviewStep, RoleBuilder, RoleCard, Roles, GameSetup — update imports only if they reference moved symbols |
| `dev/refactor-audit-frontend/refactor-audit-frontend-report.md` | Source audit findings 4.2, 4.4, 4.5, 5.2, 1.3, 6.3; restructuring items 1, 3, 7, 10 |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| No `.eslintrc*` exists; the repo uses **flat config** `eslint.config.js` (ESLint 9, typescript-eslint 8, no import-boundaries plugin installed) | AC6 must be implemented via `no-restricted-imports` in flat config, or a new plugin dependency | Implementer uses `no-restricted-imports` with `files:` scoping unless a plugin is justified |
| `capitalize` importers verified: `RoleCard.tsx`, `ReviewStep.tsx`, `BasicInfoStep.tsx`, `Roles.tsx`, `GameSetup.tsx` — that's **5** importers, not ~4 (plus definition in `theme.ts`) | Slightly larger AC5 scope | Update all 5 importers |
| All plan line references verified accurate (`TEAM_ORDER` roleSort L3, `TeamColor` theme L42, `TEAMS` BasicInfoStep L11, `MODIFIER_LABELS` duplication, `createEmptyDraft` RoleBuilder L9–25) | Plan validated | None |
| `AbilitiesStep.tsx` also has a local `MODIFIERS: StepModifier[]` array (L26) adjacent to `MODIFIER_LABELS` | Natural candidate to co-locate in domain constants (or derive labels' keys) while moving MODIFIER_LABELS | Implementer may move it; optional, in-spirit |
| Test baseline is **not green**: 3 pre-existing failures in `src/test/useRoles.test.ts` (unrelated to this feature) | AC7 "full vitest suite pass" cannot be met literally against current baseline | Interpret AC7 as "no new failures vs. baseline"; flag to Decomposer |
| `src/test/AbilitiesStep.test.tsx` references `STRING_TARGET_OPTIONS` behavior in comments and asserts option rendering | Test may need import updates if it references moved symbols; assertions on rendered options must keep passing | Preserve exact option values |
| `.github/learnings/` does not exist | No learnings to apply | None |
| No Prettier/format command configured | Environment State records Not configured | None |

## Architectural Decisions

- **Single-source teams**: `TEAMS` as a `const` array with `Team` derived via `typeof TEAMS[number]`; `TEAM_ORDER` and `TEAM_COLORS` keys derive from it so tsc catches drift. API-facing string values must remain identical (`'village' | 'werewolf' | 'vampire' | 'alien' | 'neutral'`, in that order — ordering is semantic for sorting).
- **`src/domain/` as pure TypeScript layer**: no imports from `react`, `src/api`, `src/hooks`, `src/components`, `src/pages`, `src/styles` — this is the landing zone for Phase 04's engine; the lint rule enforces purity from day one.
- **Constants-and-derivation only**: no game-rule logic moves in this feature (Wave 2 / feature 06).
- **`capitalize` relocation** keeps `styles/theme.ts` design-tokens-only.

## Constraints

- `Team` in `types/role.ts` is transport-facing: derive, do not rename or reorder values.
- Preserve exact current team order in the single source (`village, werewolf, vampire, alien, neutral`).
- ESLint runs with `--max-warnings 0`; boundary rules must not break existing lint.
- The known boundary violation in `BasicInfoStep` (imports `src/api` directly, audit finding 2.4) must be **exempted** with a lint-disable/TODO referencing feature `12-frontend-dead-code-and-tests` — do not fix it here.

## Scope Boundaries

- No extraction of game-rule logic (feature `06-frontend-game-rules`).
- No splitting of `types/role.ts` (feature `11-frontend-type-split`).
- No component decomposition.
- Do not fix the BasicInfoStep → api import violation (feature `12-frontend-dead-code-and-tests`).
- Do not touch the pre-existing `useRoles.test.ts` failures.

## Relationships to Sibling Plans

- Wave 1, parallel safe, no dependencies.
- `06-frontend-game-rules` (Wave 2) will move logic into the `src/domain/` layer this feature creates.
- `11-frontend-type-split` will split `types/role.ts` later; keep changes there minimal.
- `12-frontend-dead-code-and-tests` fixes the exempted BasicInfoStep import violation.
- Phase 04's engine depends on the `src/domain/` layout established here.

## Suggested Implementation Order

Stages 1 → 2 → 3 as written in the plan (teams single-source, then constant/factory/util moves, then lint boundary rule).

## Environment State

| Property | Value |
|----------|-------|
| Tech Stack | React 18 + TypeScript + Vite (yourwolf-frontend package); ESLint 9 flat config + typescript-eslint 8 |
| Test Runner | `npx vitest run` (in `yourwolf-frontend/`; script: `npm test` = watch mode) |
| Test Baseline | 355 passed, 3 failed (all in `src/test/useRoles.test.ts`, pre-existing) — captured 2026-07-16 |
| Lint | `npm run lint` (eslint, `--max-warnings 0`) |
| Format | Not configured |
| Build | `npm run build` (tsc + vite build) |

## Relevant Learnings

None applicable (`.github/learnings/` does not exist).
