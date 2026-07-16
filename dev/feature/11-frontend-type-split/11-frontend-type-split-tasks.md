# Tasks: Frontend Transport/Domain Type Split

## Stage 1: Split and re-home types

- [x] Verify upstream state: confirm `src/domain/` modules created by features 03/06/08 (actual names) and whether feature 03's ESLint boundary rule landed; record actual names replacing `[PROPOSED - name TBD]` placeholders — actual: `teams.ts`, `constants.ts`, `roleDraft.ts`, `roleSelection.ts`, `wakeOrder.ts`, `abilitySteps.ts`; 03's rule landed (`no-restricted-imports`, domain block)
- [x] Capture fresh test/tsc baseline after upstream features (note pre-existing `useRoles.test.ts` failures if still present) — 524 passed / 3 failed; tsc: 1 pre-existing error; lint: 2 pre-existing errors (all feature 12's)
- [x] Create transport types module (`src/types/transport.ts` — renamed from proposed `api.ts`, see implementation record deviation #2) holding server DTO shapes: `Role`, `RoleListItem`, `Ability`, `RoleDependency`, `AbilityStep`, `WinCondition`, `ValidationResult`, `NameCheckResult`, `NarratorPreviewAction`, `NarratorPreviewResponse` (+ `Visibility`) (AC1)
- [x] Re-home draft types (`RoleDraft`, `AbilityStepDraft`, `WinConditionDraft`) into `src/domain/roleDraft.ts`, colocated with `createEmptyDraft()` from feature 03 (AC1)
- [x] Resolve degenerate aliases: `AbilityStepDraft = AbilityStep` bare alias and `WinConditionDraft` structural duplicate — made real distinct types with documented intent, justified by `api/roles.ts` dropping `id` from the payload (AC2)
- [x] Decide and implement the home for shared scalars (`Team`, `Visibility`, `StepModifier`): `Team` from `domain/teams`, `StepModifier` moved to `domain/roleDraft`, `Visibility` transport-only; import direction is transport→domain only
- [x] Verify `types/game.ts` does not block AC3; leave untouched otherwise (verified: no domain module imports it; untouched)
- [x] Document any latent field-shape drift surfaced by the split in the implementation record — `WinConditionDraft.condition_params` optional vs payload `| null`, already handled by `?? null`; recorded, no casts

## Stage 2: Importer migration + boundary proof

- [x] Update source importers (19 files incl. `types/routerState.ts`): `api/roles.ts`, `api/abilities.ts`, `Wizard.tsx` + step components + `NarratorPreview.tsx`, `RoleCard.tsx`, `pages/RoleBuilder.tsx`, hooks, `styles/shared.ts`, `utils/roleSort.ts` — each pulls transport vs domain types from the correct module (AC4)
- [x] Ensure wizard prop types (`Wizard.tsx` and steps) follow the domain draft types (AC3/AC4)
- [x] Confirm `draftToPayload`/`draftToPreviewPayload` in `api/roles.ts` remain the only transport↔domain meeting point (AC3) — confirmed; 3 other files import both modules but hold the shapes as parallel unconverted state (recorded as a gap)
- [x] Verify domain modules (from 03/06) import zero transport types — import-graph check (AC3); required declaring `SelectableRole`/`WakeCandidateRole` projections to remove the `RoleListItem` DTO dependency
- [x] Extend feature 03's ESLint boundary rule to forbid domain→transport type imports (AC3) — switched domain block to `@typescript-eslint/no-restricted-imports` so `import type` is covered; mutation-tested
- [x] Update test importers (17 files incl. `test/mocks.ts`) — import-line churn only, no behavior/assertion changes (AC5); verified by empty non-import diff
- [x] Run `npm run build` (tsc) — passes with no new `as` casts or `any`-bridging; cast count 43→43 (AC4)
- [x] Run `npx vitest run` — 524 passed / 3 failed, matching baseline exactly; behavior unmodified (AC5)
- [x] Run `npm run lint` — back to the 2 pre-existing baseline errors; boundary rule fires correctly (mutation-verified)
- [x] Record deferred items (barrel/alias adoption, runtime-fix temptations) in the implementation record
