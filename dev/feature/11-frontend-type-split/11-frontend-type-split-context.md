# Context: Frontend Transport/Domain Type Split

## Key Files

### Files being changed

| File | Role | Change Type |
|------|------|-------------|
| `yourwolf-frontend/src/types/role.ts` | Current mixed transport + draft type module (123 lines). Transport DTOs: `Role`, `RoleListItem`, `Ability`, `RoleDependency`, `ValidationResult`, `NameCheckResult`, `NarratorPreviewAction`, `NarratorPreviewResponse`, `AbilityStep`, `WinCondition`. Draft types: `AbilityStepDraft` (L43, bare alias of `AbilityStep`), `WinConditionDraft` (L45–L51, structural duplicate of `WinCondition`), `RoleDraft` (L53–L66). Shared scalars: `Team`, `Visibility`, `StepModifier` | Modify (slim to transport-only, or replace with new module) |
| `yourwolf-frontend/src/types/api.ts` [PROPOSED - name TBD] | New transport/DTO types module | Create |
| `yourwolf-frontend/src/domain/*` [PROPOSED - name TBD] | Domain draft types module (e.g., `domain/roleDraft.ts`). Directory is created by feature 03 (prerequisite wave); it does not exist yet at plan-expansion time | Create/Modify |
| `yourwolf-frontend/src/api/roles.ts` | Contains `draftToPayload` (L88) and `draftToPreviewPayload` (L131) — the only sanctioned transport↔domain meeting point (verified present) | Modify (imports) |
| `yourwolf-frontend/src/api/abilities.ts` | Imports from `types/role` | Modify (imports) |
| `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx` + `steps/AbilitiesStep.tsx`, `steps/BasicInfoStep.tsx`, `steps/ReviewStep.tsx`, `steps/WinConditionsStep.tsx`, `NarratorPreview.tsx` | Wizard passes drafts through props; prop types must follow domain types | Modify (imports/prop types) |
| `yourwolf-frontend/src/components/RoleCard.tsx`, `src/pages/RoleBuilder.tsx`, `src/pages/WakeOrderResolution.tsx` | Importers | Modify (imports) |
| `yourwolf-frontend/src/hooks/useAbilities.ts`, `useDrafts.ts`, `useGameSetup.ts`, `useRoles.ts` | Importers | Modify (imports) |
| `yourwolf-frontend/src/styles/shared.ts`, `src/utils/roleSort.ts` | Importers | Modify (imports) |
| `yourwolf-frontend/src/test/*.tsx|*.ts` (12 files incl. `mocks.ts`) | Test importers — type-only import churn expected, behavior unmodified | Modify (imports only) |
| `yourwolf-frontend/eslint.config.js` | Boundary rule extension (if feature 03's rule lands and supports type-import restriction) | Modify (conditional) |

### Read-only reference files

| File | Role |
|------|------|
| `yourwolf-frontend/src/types/game.ts` | Verify only; reorganize only if it blocks AC3. Importers: `test/mocks.ts`, `ScriptReader.tsx`/test, `useGame.ts`, `api/games.ts`, `pages/GameFacilitator.tsx` — disjoint from role.ts importers, so likely untouched |
| `dev/refactor-audit-frontend/refactor-audit-frontend-report.md` | Source audit (finding 6.1, restructuring item 9, positive pattern 5.3) |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| Importer count is higher than plan's "~12": 30 files import `types/role` — 18 source files + 12 test files | AC4/AC5 scope is larger but mechanical; test files are import-churn only per AC5 | Tasks sized accordingly; no plan contradiction |
| `src/domain/` does not exist yet — features 03/06/08 (upstream waves) have not been implemented at expansion time | Expected: this feature runs in Wave 4 after 03/06/08. Implementer must re-verify domain module names created by 03 (e.g., `domain/roleDraft.ts` [PROPOSED - name TBD]) before re-homing draft types | Add verification task at Stage 1 start |
| `eslint.config.js` currently has no `no-restricted-imports`/boundary rule; feature 03 AC6 introduces it. No import-boundaries plugin installed (only `@eslint/js` + `typescript-eslint`) | AC3 boundary enforcement via lint depends on 03's rule existing; `no-restricted-imports` can restrict type imports (TS-ESLint `@typescript-eslint/no-restricted-imports` supports `allowTypeImports`) — extension is expressible | Extend 03's rule if present; otherwise code-review evidence per plan |
| `AbilityStepDraft = AbilityStep` bare alias and `WinConditionDraft` structural duplicate of `WinCondition` confirmed at `types/role.ts` L43, L45–L51 | Validates AC2 | None |
| `draftToPayload`/`draftToPreviewPayload` confirmed in `api/roles.ts`; local payload interfaces (`RoleCreatePayload`, `PreviewScriptPayload`) already live privately in that file | Validates AC3's meeting-point pattern; these payload types may stay file-local or move to transport module | Implementer decision, record in implementation record |
| Shared scalars `Team`, `Visibility`, `StepModifier` used by both transport and draft types; feature 03 AC1 moves `Team` to a domain `TEAMS` const | Split must decide home for shared scalars — after 03, `Team` should come from `src/domain/`; transport module re-exports or imports it (transport→domain import direction is allowed; the forbidden direction is domain→transport) | Add explicit task |
| Pre-existing test failures: `src/test/useRoles.test.ts` — 3 failures (baseline, unrelated to this feature) | AC5 "suite passes" must be read against this baseline unless upstream features fix it first | Accepted baseline; re-verify after 03/06/08 land |
| `types/game.ts` importers are fully disjoint from `types/role.ts` importers | Confirms non-goal: game.ts likely untouched | None |

## Architectural Decisions

- **Transport/domain split**: server DTO shapes go to a transport types module; UI/domain draft types go with the domain layer (`src/domain/`), mirroring Phase 04's planned engine type surface (`RoleInput`, `AbilityStepInput`). Domain types placed where the engine will import them.
- **Single meeting point**: `draftToPayload`/`draftToPreviewPayload` in `api/roles.ts` remain the only place transport and domain shapes meet (audit positive pattern 5.3).
- **Degenerate aliases**: either become real distinct types with documented intent or collapse to one canonical type — no restated aliases.
- **Honest typing**: field-shape drift between drafts and payloads is fixed by honest typing, never casts; contradictory shapes get surfaced in the implementation record.

## Constraints

- **Type-only feature**: no runtime behavior changes whatsoever (types move plus import-line edits). Any runtime fix temptation goes to the implementation record as a note, not a change.
- No new `as` casts or `any`-bridging to paper over the split (AC4; verified by grep of diff).
- `tsc` (via `npm run build`) and full vitest suite must pass (against the recorded baseline).
- No barrel/alias adoption (audit item 15) — record as deferred.
- No new logging/observability. Rollback: revert.

## Scope Boundaries

- `yourwolf-frontend/src/types/game.ts` — verify only; reorganize only if it blocks AC3, otherwise untouched.
- Backend (`yourwolf-backend`) — untouched; parallel-safe with 09/10 (disjoint files).
- Barrel files / path aliases — explicitly deferred (audit item 15).
- Runtime code in any importer — imports and prop type annotations only.
- Test behavior — test import lines may change; assertions and behavior must not.

## Relationships to Sibling Plans

- **Depends on `08-frontend-abilities-step`** (Wave dependency): shares `AbilitiesStep.tsx` and other importers with 06/08 — runs after component decomposition settles so type-import churn lands once.
- **`03-frontend-domain-foundation`**: creates `src/domain/` and the ESLint boundary rule (its AC6) this feature extends; also moves `Team` single-sourcing and `createEmptyDraft()` into domain — coordinate draft-type homing with the module 03 created.
- **`06-frontend-game-rules`**: contributes domain modules that must import zero transport types (AC3).
- **Phase 04**: this split answers "which types does the engine own?"; domain types are the engine's future import surface.

## Suggested Implementation Order

Wave 4, after 08 (and transitively 03/06). Parallel-safe within Wave 4 alongside 09/10 (backend). Within this feature: Stage 1 (split/re-home types) then Stage 2 (importer migration + boundary proof).

## Environment State

| Property | Value |
|----------|-------|
| Tech Stack | TypeScript 5.3 + React 18 + Vite 5 (frontend workspace `yourwolf-frontend/`) |
| Test Runner | `npx vitest run` (from `yourwolf-frontend/`) |
| Test Baseline | 355 passed, 3 failed (`src/test/useRoles.test.ts`), 30 files — captured 2026-07-16, pre-upstream-features |
| Build/Typecheck | `npm run build` (runs `tsc && vite build`) |
| Lint | `npm run lint` (`eslint . --ext ts,tsx --max-warnings 0`, flat config `eslint.config.js`) |
| Format | Not configured |

## Relevant Learnings

None applicable (`.github/learnings/` does not exist).
