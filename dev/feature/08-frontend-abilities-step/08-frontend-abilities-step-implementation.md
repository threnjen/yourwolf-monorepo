# Implementation Record: AbilitiesStep Component Decomposition

## Summary

Decomposed the 492-line (440 post-feature-06) `AbilitiesStep.tsx` god component into a 160-line composing container plus three focused presentational components: `AbilityPalette`, `StepList` (+ `ReadOnlyStepList`), and `StepParameterInputs`. All five ACs are complete.

This was **component decomposition only** — rule extraction was already done by feature 06, which left `AbilitiesStep` delegating to `domain/abilitySteps`. Those delegating handlers were moved verbatim; no rule logic was authored, changed, or relocated into the new components.

The regression anchor `src/test/AbilitiesStep.test.tsx` is **byte-for-byte unmodified** and still passes all 29 tests — the strongest available evidence of zero behavioral drift. Three new per-seam unit test files add 46 tests on top, exercising the extracted components in isolation.

## Sibling Features

Scanned all 12 feature directories (title lines only).

- **06-frontend-game-rules (Wave 2, upstream)** — created `src/domain/abilitySteps.ts` and had already refactored `AbilitiesStep` to delegate to it. Started from post-06 state as required. Did **not** modify the domain module (owned by 06).
- **07-backend-validation-consolidation (Wave 3, parallel)** — backend only, disjoint. `yourwolf-backend/` was not touched; backend files appearing in `git status` are feature 07's concurrent work.
- **11-frontend-type-split (Wave 4, downstream)** — will split `src/types/role.ts`. My new components import `RoleDraft`/`AbilityStepDraft`/`StepModifier`/`Ability` from `types/role`, matching existing sibling-step convention, so 11 can retarget them uniformly. No new interface shapes were invented that would conflict.
- **12-frontend-dead-code-and-tests (Wave 5, downstream)** — owns the 3 pre-existing `useRoles.test.ts` failures, the `Wizard.test.tsx` TS6133 build error, and the absent `react-hooks` eslint plugin. All left untouched per instruction. Feature 12 also owns test structure and may choose to consolidate my new test files.

Shared module touched by siblings: `src/domain/constants.ts` (read-only consumption only).

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | Decompose into focused components | Per-seam unit suites | Component renders in isolation via RTL | Complete | `steps/AbilityPalette.tsx`, `steps/StepList.tsx`, `steps/StepParameterInputs.tsx`, `steps/AbilitiesStep.tsx` | `src/test/AbilityPalette.test.tsx`, `src/test/StepList.test.tsx`, `src/test/StepParameterInputs.test.tsx` | PENDING | PENDING |
| AC2 | Rules delegated to `domain/abilitySteps` | Grep evidence + isolation tests | No coercion/renumbering in components | Complete | `steps/AbilitiesStep.tsx` (sole importer of `domain/abilitySteps`) | Grep in "Reviewer Focus Areas"; `src/test/StepList.test.tsx` "reports the index/raw value" tests | PENDING | PENDING |
| AC3 | Each file under ~200 lines | Line-count evidence | `wc -l` | Complete | all four `steps/*.tsx` | 160 / 104 / 158 / 120 lines (see Files Changed) | PENDING | PENDING |
| AC4 | Test split along seams, no assertion loss | Test-count comparison | 29 baseline → 75 total | Complete | 3 new test files + unmodified anchor | `src/test/AbilitiesStep.test.tsx` (unmodified), 3 new files | PENDING | PENDING |
| AC5 | Wizard flow unchanged, no new failures | Full vitest suite | 520 passed / 3 pre-existing failed | Complete | `Wizard.tsx` unchanged (verified) | Full-suite output; `git status` shows `Wizard.tsx` not modified | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | 492-line component decomposed into palette / parameter form / step list, container composes | Complete | `AbilityPalette.tsx`, `StepParameterInputs.tsx`, `StepList.tsx`, `AbilitiesStep.tsx` | `StepParameterInputs` kept its name per plan. `ReadOnlyStepList` co-located in `StepList.tsx` for the disabled-state list. |
| AC2 | All business rules are `domain/abilitySteps` calls; no rule logic in presentational components | Complete | `AbilitiesStep.tsx` | Only the container imports `domain/abilitySteps`. Children import only readonly `domain/constants`. Two judgement calls documented under Deviations. |
| AC3 | Each file under ~200 lines; container primarily composition | Complete | all four | 160 / 104 / 158 / 120. Container is early-returns + 7 handlers + composition. |
| AC4 | Test file split along seams, no loss of assertions, count equal or higher | Complete | 3 new test files | 29 → 75 tests (+46). Zero assertions removed. Satisfied by **addition**, not relocation — see Deviations. |
| AC5 | Wizard flow unchanged; no new failures vs baseline | Complete | none (verification only) | 474→520 passed, 3 failed both before and after (same pre-existing `useRoles` tests). `Wizard.tsx` untouched; `AbilitiesStep` props contract unchanged. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Modify | 440 → **160** lines. Now: `useAbilities` wiring, `activeCategory` state, error/disabled early returns, 7 handlers delegating to `domain/abilitySteps`, and composition. All palette/list/param JSX and styles removed. | AC1, AC3 — container becomes composition only |
| `yourwolf-frontend/src/components/RoleBuilder/steps/AbilityPalette.tsx` | Create | **104** lines. Category tabs, ability grid, loading/empty states, tab+palette styles, `getTabStyles`. Owns the category→types→filter derivation (presentational, not domain-owned). | AC1 — palette seam |
| `yourwolf-frontend/src/components/RoleBuilder/steps/StepParameterInputs.tsx` | Create | **120** lines. Inner component promoted verbatim with its props interface and param styles. Reports raw uncoerced values. | AC1 — parameter-form seam; name preserved per plan |
| `yourwolf-frontend/src/components/RoleBuilder/steps/StepList.tsx` | Create | **158** lines. Exports `StepList` (order, modifier select, move/remove, embedded param form) and `ReadOnlyStepList` (name-only, disabled state). Shared step styles. | AC1 — step-list seam; both list renderings share styles in one file |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-frontend/src/test/AbilitiesStep.test.tsx` | **Unmodified** | Untouched (confirmed absent from `git status`). 29 tests still pass. | Regression anchor / integration-style composed test (AC4, AC5) |
| `yourwolf-frontend/src/test/StepParameterInputs.test.tsx` | Create | 18 tests: enum select, `STRING_TARGET_OPTIONS` select, integer input (value / schema-default / 1 fallback, min=1), array comma-join, empty-schema and unknown-type no-render, required/optional labels, `param-{index}-{key}` id namespacing, raw-value emission. | AC1, AC4 — every input kind from the context Discovery Delta |
| `yourwolf-frontend/src/test/AbilityPalette.test.tsx` | Create | 11 tests: all 5 tabs, category-change reporting, active-category filtering, ability click payload, loading precedence over empty, empty states, unrecognised category. | AC1, AC4 |
| `yourwolf-frontend/src/test/StepList.test.tsx` | Create | 17 tests: order/name rendering, first-step modifier hidden, `Then:` label, modifier options exclude `none`, index-based move/remove/modifier/param reporting, move-up disabled on first, move-down disabled on last, `schemaFor` resolution, plus `ReadOnlyStepList` renders no controls. | AC1, AC4 |

## Test Results

- **Baseline**: 474 passed, 3 failed (all `src/test/useRoles.test.ts`, pre-existing, owned by feature 12)
- **Final**: 520 passed, 3 failed (the identical 3 `useRoles.test.ts` tests)
- **New tests added**: 46 (18 + 11 + 17)
- **Regressions**: None. Same 3 failures before and after. `npx tsc --noEmit` shows only the pre-existing `Wizard.test.tsx(242) TS6133`. `npx eslint .` shows only the 2 pre-existing errors. No new failures, type errors, or lint errors.

## Deviations from Plan

1. **AC4 satisfied by addition, not relocation.** The plan says "split `AbilitiesStep.test.tsx` ... keep one integration-style test of the composed step". I kept the anchor **entirely unmodified** and added three per-seam test files alongside it. Rationale: the orchestrator explicitly preferred the anchor stay unmodified as drift evidence, and moving tests out of it would strictly weaken that evidence while risking assertion loss. The AC's measurable bar is met and exceeded — per-seam files exist, count went 29→75 (≥ baseline), zero assertions lost, and the anchor remains the integration-style composed test. **Safest default chosen.** If a reviewer requires physical relocation, the seams are already aligned so tests can be moved mechanically.

2. **`ReadOnlyStepList` is a second export in `StepList.tsx`** rather than a `readOnly` prop on `StepList`. Rationale: a `readOnly` flag would force all seven interactive callbacks to become optional, weakening the type contract for the common path. Two small components sharing file-local styles is simpler and behavior-identical. Plan/context only required the disabled-state rendering be preserved in `StepList`, which it is.

3. **Two presentation-vs-rule judgement calls left as-is** (behavior parity outranks purity, plan §D; hardening the domain module is out of scope):
   - `StepParameterInputs` keeps the integer display fallback `?? (prop.default) ?? 1`. This mirrors `buildInitialParameters` but is a *display* fallback for an absent value, not a stored rule. Removing it would change rendering.
   - `StepList` keeps `MODIFIERS.filter((m) => m !== 'none')`. Arguably a rule ("`none` isn't user-selectable"), but `domain/abilitySteps` exports no selectable-modifier list and I must not modify it. Both existed verbatim at baseline.

4. **Minor style dedup in the container**: the two disabled-state banners now share a `bannerStyles` const spread with a per-banner `color`, and the two `<h4>` headings share `headingStyles`. Resulting style objects are property-for-property identical to baseline.

## Gaps

None blocking. Two notes:

- **Manual QA not performed** (tasks Stage 2, AC5): I cannot drive a browser in this environment. Covered by proxy: the unmodified 29-test anchor exercises the composed step including all three disabled-state branches, wake-order gating, add/remove/reorder, and every parameter input kind; `Wizard.tsx` is unchanged and `AbilitiesStep`'s props contract is identical. A human should still walk the wizard.
- **The container's `moveStepUp`/`moveStepDown` no-op guards are not directly unit-tested** at the container level, because the buttons that would trigger them are `disabled` (that disabled state *is* now pinned in `StepList.test.tsx`). The guards were moved **verbatim** and reference-identity is pinned by feature 06's `toBe()` domain tests. See Reviewer Focus Areas.

## Reviewer Focus Areas

- **Reference-identity / spurious-`onChange` constraint (highest priority).** The critical constraint was that `domain/abilitySteps` signals no-ops by returning the same array reference, and `AbilitiesStep` relies on it. I introduced **no memoization** (`React.memo`/`useMemo`/`useCallback`) anywhere, and `handleMoveUp`/`handleMoveDown` retain their `if (steps === draft.ability_steps) return;` guards verbatim in the container — see `AbilitiesStep.tsx:100-110`. Children are unmemoized, so inline callbacks are safe. Worth confirming no guard was dropped: all 7 handlers are unchanged from post-06 state.
- **UI-layer guards around the domain's known sharp edges.** Per instruction I did not harden `domain/abilitySteps`. The guards that live in the UI are preserved: the two no-op reference checks, `disabled={index === 0}` / `disabled={index === steps.length - 1}` (note this now reads `steps.length` from the `StepList` prop rather than `draft.ability_steps.length` — same array, same value), and `index > 0` gating the modifier select. `handleParameterChange`'s unguarded `draft.ability_steps[stepIndex]` read is baseline behavior, unchanged.
- **AC2 grep evidence**: `grep -nE "parseInt|isNaN|\.split\(|renumber|crypto\.randomUUID" AbilityPalette.tsx StepList.tsx StepParameterInputs.tsx` returns only CSS false positives (`border: 'none'`, `1px solid`). Only `AbilitiesStep.tsx` imports `domain/abilitySteps`; children import only readonly `domain/constants`.
- **Category filtering moved into `AbilityPalette`** (`AbilityPalette.tsx:68-69`). Confirm this reads as presentation rather than a rule — `domain/roleSelection.ts` has no ability-palette filtering, so it is not domain-owned, and it makes the palette self-contained.
- **Deviation 1 (AC4 by addition)** is the one place I consciously diverged from the plan's literal wording. Confirm the reasoning holds or direct me to physically relocate the anchor's tests.
