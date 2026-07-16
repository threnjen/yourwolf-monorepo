# Context: AbilitiesStep Component Decomposition

## Key Files

### Files Being Changed

| File | Role | Change Type |
|------|------|-------------|
| `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` | 492-line step component; becomes the composing container | Modify |
| `yourwolf-frontend/src/components/RoleBuilder/steps/AbilityPalette.tsx` [PROPOSED - name TBD] | Category tabs + ability button grid (currently ~L18–L61 constants/styles, L229–L240 tab styles, L388–L418 render) | Create |
| `yourwolf-frontend/src/components/RoleBuilder/steps/StepParameterInputs.tsx` [PROPOSED - name TBD] | Schema-driven dynamic parameter form; promotes the existing inner `StepParameterInputs` component (L141–L227) plus `STRING_TARGET_OPTIONS` (L126–L139) to its own file | Create |
| `yourwolf-frontend/src/components/RoleBuilder/steps/StepList.tsx` [PROPOSED - name TBD] | Step-list rendering: order, modifier select, move/remove buttons, per-step parameter form (currently L420–L488, plus disabled-state list L287–L302) | Create |
| `yourwolf-frontend/src/test/AbilitiesStep.test.tsx` | 455-line test file; split along component seams, keep one integration-style composed test | Modify/Split |

### Read-Only Reference Files

| File | Role |
|------|------|
| `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx` | Consumer of `AbilitiesStep` (195 lines); verify unchanged behavior only |
| `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Pattern reference: controlled component receiving values + change callbacks |
| `yourwolf-frontend/src/components/RoleBuilder/steps/ReviewStep.tsx` | Pattern reference |
| `yourwolf-frontend/src/types/role.ts` | `RoleDraft`, `AbilityStepDraft`, `StepModifier` types |
| `yourwolf-frontend/src/hooks/useAbilities.ts` | Abilities data source used by the container |
| `yourwolf-frontend/src/styles/theme.ts`, `yourwolf-frontend/src/styles/shared.ts` | `theme`, `selectStyles` used by all extracted components |
| `yourwolf-frontend/src/domain/abilitySteps.ts` [created by feature 06] | Business rules module the components must call into (AC2) |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| `yourwolf-frontend/src/domain/` does not yet exist; `domain/abilitySteps.ts` is created by upstream feature 06 (Wave 2). Feature 06's plan confirms the cross-feature API contract ("feature 08 will consume `domain/abilitySteps.ts`... data-in/data-out with exported types") | AC2 is blocked until 06 lands; this matches the plan's declared dependency | None — dependency already declared; Implementer must verify 06 is merged first |
| Verified line references in plan are accurate: `AbilitiesStep.tsx` is 492 lines; inner `StepParameterInputs` is L148–L227 (interface at L141); palette/tab region matches ~L18–L145; test file is 455 lines | Plan traceability is sound | None |
| Business-rule logic currently inline in the container: `handleAddAbility` (integer-default seeding, initial modifier `none`/`and`), `handleRemoveStep`/`handleMoveUp`/`handleMoveDown` (renumber + modifier normalization, L332–L353), `handleParameterChange` (int coercion clamped ≥1, comma-split array parse, L362–L384) | These are exactly the rules AC2 requires to be delegated to `domain/abilitySteps`; after 06 the container may already delegate — the Implementer should diff against post-06 state, not this snapshot | Add task: reconcile with post-06 container state |
| Dynamic form input kinds enumerated from source: string+enum select, plain string select via `STRING_TARGET_OPTIONS`, integer number input (min 1, default seeding), array-as-comma-text input; unknown types render nothing | Satisfies plan section B requirement to enumerate input types before splitting | Recorded here; add to test-split checklist |
| Disabled state (`wake_order === 0 || null`) has three branches: info banner, warning banner when steps exist, and a read-only greyed step list. Error state from `useAbilities` short-circuits the whole component | Extraction seams must preserve these early returns in the container | Constraint noted below |
| Test baseline has 3 pre-existing failures in `src/test/useRoles.test.ts` (unrelated to this feature); `AbilitiesStep.test.tsx` passes | "Suite green" success criteria should be read as "no new failures vs baseline" | Accepted risk / noted in Environment State |
| No `.github/learnings/` directory exists | No learnings to apply | None |

No contradictions with the plan were found.

## Architectural Decisions

- **Decomposition only; behavior parity outranks file-size targets** (plan §D). If a piece can't be extracted without changing behavior, extract less.
- **Container owns state**: `activeCategory` tab state and all draft mutations stay in `AbilitiesStep`; children are presentational, receiving values + callbacks — matching the `BasicInfoStep`/`ReviewStep` controlled-component pattern.
- **`StepParameterInputs` keeps its name**: it already exists as an inner component; promotion to its own file preserves the name (so it is effectively verified, only the file path is new).
- **Narrow props contracts**: pass step data + callbacks, not whole `RoleDraft` objects, where feasible without behavior change (plan §B).
- **Business rules live in `domain/abilitySteps`** (feature 06): add/remove/move/renumber, modifier normalization, parameter coercion. Components call in; no rule logic remains in presentational components (AC2).

## Constraints

- All extracted components live beside existing step files in `components/RoleBuilder/steps/`.
- `AbilitiesStep.tsx` and each extracted component must each be under ~200 lines (AC3).
- Test split must have **no loss of assertions** — test count equal or higher (AC4).
- Wizard flow behavior must be byte-for-byte identical in effect: disabled-state messaging, error banner, empty-state copy, tab persistence across add/remove (AC5, plan §B).
- Do not modify `domain/abilitySteps` — domain logic is owned by feature 06.

## Scope Boundaries

- No visual redesign; styles move with their components but do not change.
- No changes to `ReviewStep`, `BasicInfoStep`, or `WinConditionsStep`.
- No changes to `Wizard.tsx` beyond verification (read-only).
- `disabled`-state messaging behavior preserved exactly as-is, including the warning branch for roles with steps but no wake order.
- No changes to `useAbilities`, types, or API layer.
- Do not fix the pre-existing `useRoles.test.ts` failures (out of scope).

## Relationships to Sibling Plans

- **Depends on 06-frontend-game-rules** (Wave 2): creates `src/domain/abilitySteps.ts` and touches both `AbilitiesStep.tsx` and `AbilitiesStep.test.tsx`. Feature 08 must start from the post-06 state of both files.
- **Parallel-safe within Wave 3** (disjoint from 07-backend-validation-consolidation).
- Source: refactor audit findings 3.1 (High), 3.4 and restructuring item 12 in `dev/refactor-audit-frontend/refactor-audit-frontend-report.md`.

## Suggested Implementation Order

1. Wait for 06-frontend-game-rules to merge; re-read `AbilitiesStep.tsx` for its post-06 shape.
2. Stage 1: extract `StepParameterInputs` and `AbilityPalette`.
3. Stage 2: extract `StepList`, then split the test file.

## Environment State

| Property | Value |
|----------|-------|
| Tech Stack | React 18 + TypeScript 5.3, Vite 5 (frontend workspace `yourwolf-frontend/`) |
| Test Runner | `npx vitest run` (from `yourwolf-frontend/`; also `npm test` for watch mode) |
| Test Baseline | 355 passed, 3 failed (all in `src/test/useRoles.test.ts`, pre-existing/unrelated) — captured 2026-07-16 |
| Lint | `npm run lint` (eslint, `--max-warnings 0`) |
| Format | Not configured (no prettier config detected) |

## Relevant Learnings

None applicable (`.github/learnings/` does not exist).
