# Tasks: AbilitiesStep Component Decomposition

## Stage 1: Extract parameter form and palette

- [x] Verify feature 06 (frontend-game-rules) is merged; re-read the current `AbilitiesStep.tsx` and confirm `src/domain/abilitySteps.ts` exists with its exported rule functions
- [x] Enumerate every input kind currently rendered by the dynamic parameter form (string+enum select, plain-string `STRING_TARGET_OPTIONS` select, integer number input with min-1/default seeding, comma-separated array text input) and confirm each is covered in `AbilitiesStep.test.tsx` before splitting
- [x] Promote the inner `StepParameterInputs` component (with its props interface, `STRING_TARGET_OPTIONS`, and its param styles) into `components/RoleBuilder/steps/StepParameterInputs.tsx`, unchanged in behavior
- [x] Extract the ability-category palette (category tabs, `ABILITY_CATEGORIES`, tab/palette styles, loading/empty states) into `components/RoleBuilder/steps/AbilityPalette.tsx`; tab state (`activeCategory`) remains owned by the container and is passed down as value + callback (AC1)
- [x] Confirm all business rules (add/remove/move/renumber, modifier normalization, parameter coercion) are delegated to `domain/abilitySteps` — no rule logic in `AbilityPalette` or `StepParameterInputs`; grep components for coercion/renumbering logic (AC2)
- [x] Type new props contracts narrowly (step data + callbacks, not whole `RoleDraft`) where feasible without behavior change
- [x] Compile, run `npx vitest run` — no new failures vs baseline (3 pre-existing `useRoles` failures)

## Stage 2: Extract step list + test split

- [x] Extract step-list rendering (order label, modifier select with `MODIFIER_LABELS`, move up/down and remove buttons, embedded `StepParameterInputs`) into `components/RoleBuilder/steps/StepList.tsx`; preserve the disabled-state read-only list rendering (AC1) — exported as `ReadOnlyStepList` in the same file
- [x] Reduce `AbilitiesStep.tsx` to a composing container: `useAbilities` wiring, tab state, error/disabled early returns, and callbacks into `domain/abilitySteps` (AC2, AC3)
- [x] Verify `AbilitiesStep.tsx` and each extracted component are under ~200 lines; container is primarily composition (AC3) — 160 / 104 / 158 / 120
- [x] Verify no rule logic remains in any presentational component (grep evidence for review) (AC2)
- [x] Record baseline assertion/test count of `AbilitiesStep.test.tsx` (29), then split it along the same seams: palette rendering tests, parameter-form tests, step-list/interaction tests, keeping one integration-style test of the composed step (AC4) — satisfied by adding three per-seam files and keeping the anchor unmodified as the integration test; see Deviation 1 in the implementation record
- [x] Confirm split test count is equal or higher than baseline with no assertion loss (AC4) — 29 → 75, zero assertions removed
- [x] Verify `Wizard.tsx` requires no changes and the wizard step renders identically; run full vitest suite — no new failures (AC5)
- [x] Run lint in `yourwolf-frontend/` — no new errors (2 pre-existing errors remain, owned by feature 12)
- [ ] Manual QA: create a role with abilities from at least 3 categories, edit parameters of each input kind, reorder/remove steps, confirm review step shows the result; also verify disabled-state messaging with wake_order 0/null (AC5) — **requires a human; not performable in this environment.** Covered by proxy via the unmodified 29-test anchor.
