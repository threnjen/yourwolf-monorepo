# Tasks: Frontend Transport/Domain Type Split

## Stage 1: Split and re-home types

- [ ] Verify upstream state: confirm `src/domain/` modules created by features 03/06/08 (actual names) and whether feature 03's ESLint boundary rule landed; record actual names replacing `[PROPOSED - name TBD]` placeholders
- [ ] Capture fresh test/tsc baseline after upstream features (note pre-existing `useRoles.test.ts` failures if still present)
- [ ] Create transport types module (`src/types/api.ts` [PROPOSED - name TBD]) holding server DTO shapes: `Role`, `RoleListItem`, `Ability`, `RoleDependency`, `AbilityStep`, `WinCondition`, `ValidationResult`, `NameCheckResult`, `NarratorPreviewAction`, `NarratorPreviewResponse` (AC1)
- [ ] Re-home draft types (`RoleDraft`, `AbilityStepDraft`, `WinConditionDraft`) into the domain layer module (e.g., `src/domain/roleDraft.ts` [PROPOSED - name TBD]), colocated with `createEmptyDraft()` from feature 03 (AC1)
- [ ] Resolve degenerate aliases: `AbilityStepDraft = AbilityStep` bare alias and `WinConditionDraft` structural duplicate of `WinCondition` — make distinct types with documented intent or collapse to one canonical type (AC2)
- [ ] Decide and implement the home for shared scalars (`Team`, `Visibility`, `StepModifier`): `Team` from feature 03's domain single-source; ensure import direction is transport→domain, never domain→transport
- [ ] Verify `types/game.ts` does not block AC3; leave untouched otherwise (record verification)
- [ ] Document any latent field-shape drift surfaced by the split (optionality mismatches between `RoleDraft` and payloads) in the implementation record — fix by honest typing, no casts

## Stage 2: Importer migration + boundary proof

- [ ] Update source importers (18 files): `api/roles.ts`, `api/abilities.ts`, `components/RoleBuilder/Wizard.tsx` + 4 step components + `NarratorPreview.tsx`, `RoleCard.tsx`, `pages/RoleBuilder.tsx`, `pages/WakeOrderResolution.tsx`, hooks (`useAbilities`, `useDrafts`, `useGameSetup`, `useRoles`), `styles/shared.ts`, `utils/roleSort.ts` — each pulls transport vs domain types from the correct module (AC4)
- [ ] Ensure wizard prop types (`Wizard.tsx` and steps) follow the domain draft types (AC3/AC4)
- [ ] Confirm `draftToPayload`/`draftToPreviewPayload` in `api/roles.ts` remain the only transport↔domain meeting point (AC3)
- [ ] Verify domain modules (from 03/06) import zero transport types — import-graph check (AC3)
- [ ] Extend feature 03's ESLint boundary rule to forbid domain→transport type imports if expressible (e.g., `@typescript-eslint/no-restricted-imports`); otherwise record code-review enforcement (AC3)
- [ ] Update test importers (12 files incl. `test/mocks.ts`) — import-line churn only, no behavior/assertion changes (AC5)
- [ ] Run `npm run build` (tsc) — passes with no new `as` casts or `any`-bridging; grep the diff for `as ` / `any` as evidence (AC4)
- [ ] Run `npx vitest run` — suite matches or improves on baseline; behavior unmodified (AC5)
- [ ] Run `npm run lint` — clean, boundary rule fires correctly if extended
- [ ] Record deferred items (barrel/alias adoption, any runtime-fix temptations) in the implementation record
