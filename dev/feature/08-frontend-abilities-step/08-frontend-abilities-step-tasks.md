# Tasks: AbilitiesStep Component Decomposition

## Stage 1: Extract parameter form and palette

- [ ] Verify feature 06 (frontend-game-rules) is merged; re-read the current `AbilitiesStep.tsx` and confirm `src/domain/abilitySteps.ts` exists with its exported rule functions
- [ ] Enumerate every input kind currently rendered by the dynamic parameter form (string+enum select, plain-string `STRING_TARGET_OPTIONS` select, integer number input with min-1/default seeding, comma-separated array text input) and confirm each is covered in `AbilitiesStep.test.tsx` before splitting
- [ ] Promote the inner `StepParameterInputs` component (with its props interface, `STRING_TARGET_OPTIONS`, and its param styles) into `components/RoleBuilder/steps/StepParameterInputs.tsx` [PROPOSED - name TBD], unchanged in behavior
- [ ] Extract the ability-category palette (category tabs, `ABILITY_CATEGORIES`, tab/palette styles, loading/empty states) into `components/RoleBuilder/steps/AbilityPalette.tsx` [PROPOSED - name TBD]; tab state (`activeCategory`) remains owned by the container and is passed down as value + callback (AC1)
- [ ] Confirm all business rules (add/remove/move/renumber, modifier normalization, parameter coercion) are delegated to `domain/abilitySteps` — no rule logic in `AbilityPalette` or `StepParameterInputs`; grep components for coercion/renumbering logic (AC2)
- [ ] Type new props contracts narrowly (step data + callbacks, not whole `RoleDraft`) where feasible without behavior change
- [ ] Compile, run `npx vitest run` — no new failures vs baseline (355 pass / 3 pre-existing `useRoles` failures)

## Stage 2: Extract step list + test split

- [ ] Extract step-list rendering (order label, modifier select with `MODIFIER_LABELS`, move up/down and remove buttons, embedded `StepParameterInputs`) into `components/RoleBuilder/steps/StepList.tsx` [PROPOSED - name TBD]; preserve the disabled-state read-only list rendering (AC1)
- [ ] Reduce `AbilitiesStep.tsx` to a composing container: `useAbilities` wiring, tab state, error/disabled early returns, and callbacks into `domain/abilitySteps` (AC2, AC3)
- [ ] Verify `AbilitiesStep.tsx` and each extracted component are under ~200 lines; container is primarily composition (AC3)
- [ ] Verify no rule logic remains in any presentational component (grep evidence for review) (AC2)
- [ ] Record baseline assertion/test count of `AbilitiesStep.test.tsx`, then split it along the same seams: palette rendering tests, parameter-form tests, step-list/interaction tests, keeping one integration-style test of the composed step (AC4)
- [ ] Confirm split test count is equal or higher than baseline with no assertion loss (AC4)
- [ ] Verify `Wizard.tsx` requires no changes and the wizard step renders identically; run full vitest suite — no new failures (AC5)
- [ ] Run `npm run lint` in `yourwolf-frontend/` — zero warnings
- [ ] Manual QA: create a role with abilities from at least 3 categories, edit parameters of each input kind, reorder/remove steps, confirm review step shows the result; also verify disabled-state messaging with wake_order 0/null (AC5)
