# Implementation Record: Frontend Transport/Domain Type Split

## Summary

`src/types/role.ts` is gone. Server DTO shapes now live in `src/types/transport.ts`; the UI/editing draft types (`RoleDraft`, `AbilityStepDraft`, `WinConditionDraft`) and the `StepModifier` scalar live in `src/domain/roleDraft.ts` alongside `createEmptyDraft()`. The dependency now points strictly inward — `types/transport.ts` imports `Team`/`StepModifier` from `src/domain`, and `src/domain` imports nothing from `src/types`. The ESLint domain boundary rule was upgraded to the typescript-eslint variant so it catches `import type`, and extended to forbid `domain → types`; it was mutation-tested to confirm it fires.

Type-only feature as chartered: zero runtime statements changed. Every non-`import` line in the 17 touched test files is byte-identical to baseline, and the cast count is unchanged at 43 (no `as` casts or `any`-bridging added).

**Feature 12's three baseline items were left strictly alone** (3 `useRoles.test.ts` failures, `Wizard.test.tsx` TS6133, 2 lint errors incl. the absent `react-hooks` plugin). All three gates match baseline exactly.

## Sibling Features

Scanned all 11 sibling feature directories (first 5 lines of each plan only).

- **03-frontend-domain-foundation** — created `src/domain/`, `TEAMS`/`Team`, `createEmptyDraft()`, and the ESLint boundary rule this feature extends. Its reviewer left an explicit recommendation for this feature; see *Deviations* #1.
- **06-frontend-game-rules** — contributed `roleSelection.ts`, `wakeOrder.ts`, `constants.ts`, `abilitySteps.ts`, `types/routerState.ts`. Two of those domain modules were the real AC3 violation; see *Contradictions Surfaced*.
- **08-frontend-abilities-step** — split `AbilitiesStep.tsx` into a container plus `AbilityPalette.tsx`/`StepList.tsx`/`StepParameterInputs.tsx`. All were accounted for as importers (`StepParameterInputs.tsx` imports no role types, so it needed no change).
- **09/10 (backend)** — ran in parallel; `yourwolf-backend/` untouched.
- **12-frontend-dead-code-and-tests** — owns all three baseline failures. Not touched.

Shared modules a later feature will also edit: `src/test/Wizard.test.tsx` and `src/hooks/useRoles.ts` (feature 12's baseline items) — this feature changed only their import lines.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | Split transport vs draft types | — | Code-review evidence + tsc | Done | `src/types/transport.ts`, `src/domain/roleDraft.ts` | `yourwolf-frontend/src/types/transport.ts`, `yourwolf-frontend/src/domain/roleDraft.ts` (`src/types/role.ts` deleted) | PENDING | PENDING |
| AC2 | Degenerate aliases resolved | — | Code-review evidence + tsc | Done | `src/domain/roleDraft.ts`, `src/types/transport.ts` | `yourwolf-frontend/src/domain/roleDraft.ts:11-45` (documented intent), `yourwolf-frontend/src/api/roles.ts:88-115` (id dropped / `?? null`) | PENDING | PENDING |
| AC3 | Domain imports zero transport types; single meeting point | — | Import-graph check + ESLint boundary rule | Done | `src/domain/*.ts`, `eslint.config.js` | `yourwolf-frontend/eslint.config.js:9-11,36-72`; `grep -rn "types/" src/domain/` → empty | PENDING | PENDING |
| AC4 | All importers updated; tsc clean; no casts | — | `npm run build` (tsc) + grep diff | Done | 36 importers + `src/types/routerState.ts` | `npx tsc --noEmit` → baseline-only error; cast count 43→43 | PENDING | PENDING |
| AC5 | Full vitest suite unmodified in behavior | — | `npx vitest run` | Done | 17 test files (import lines only) | `npx vitest run` → 524 passed / 3 failed (= baseline); non-import test diff empty | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Transport DTOs in a transport module; draft types with the domain | Done | `src/types/transport.ts` (new), `src/domain/roleDraft.ts`, `src/types/role.ts` (deleted) | Module named `transport.ts`, not the proposed `api.ts` — see *Deviations* #2 (name was `[PROPOSED - name TBD]`). |
| AC2 | Degenerate aliases resolved | Done | `src/domain/roleDraft.ts` | Took the "real distinct types with documented intent" branch. Justified by hard evidence, not assertion — see below. |
| AC3 | Domain imports zero transport types; api/roles.ts the only meeting point | Done | all 6 `src/domain/*.ts`, `eslint.config.js` | Required real work: two domain modules consumed the `RoleListItem` DTO. Fixed by domain-owned projections, no casts. |
| AC4 | All importers updated; tsc passes; no `any`/assertion bridging | Done | 36 importers | Actual count 36 source+test files importing role types (+`routerState.ts`), vs the briefed 30 / plan's ~12. |
| AC5 | Full vitest suite passes, behavior unmodified | Done | 17 test files | 524 passed / 3 failed — identical to baseline. Non-import test diff is empty. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `src/types/role.ts` | Delete | Removed (123 lines) | Split into `types/transport.ts` + `domain/roleDraft.ts` (AC1). |
| `src/types/transport.ts` | Create | The 10 server DTOs + `Visibility`; imports `Team`/`StepModifier` from domain | Transport module (AC1); inverted dependency (AC3). |
| `src/domain/roleDraft.ts` | Modify | Added `StepModifier`, `AbilityStepDraft`, `WinConditionDraft`, `RoleDraft` with intent docs; kept `createEmptyDraft()` | Re-home draft types beside their factory (AC1/AC2). |
| `src/domain/roleSelection.ts` | Modify | Dropped `RoleListItem` import; added `SelectableRole` + `RoleDependencyRule`; `buildRoleMap` made generic | Domain must not import transport DTOs (AC3). Generic keeps callers' full type — lossless. |
| `src/domain/wakeOrder.ts` | Modify | Dropped `RoleListItem` import; added `WakeCandidateRole`; `Team` now from `./teams` | AC3. Extends the projection pattern `WakingRole` already used in this file. |
| `src/domain/abilitySteps.ts` | Modify | Import moved to `./roleDraft` | AC3. |
| `src/domain/constants.ts` | Modify | Import moved to `./roleDraft` | AC3. |
| `src/types/routerState.ts` | Modify | `./role` → `./transport` | Importer missed by the `types/role` grep (sibling-relative path); caught by tsc. |
| `src/api/roles.ts` | Modify | Imports split across transport/domain | AC4. Remains the sole meeting point. |
| `src/api/abilities.ts` | Modify | Import line | AC4. |
| `src/components/RoleBuilder/{Wizard,NarratorPreview}.tsx`, `steps/{AbilitiesStep,AbilityPalette,BasicInfoStep,ReviewStep,StepList,WinConditionsStep}.tsx`, `RoleCard.tsx` | Modify | Import lines only; wizard prop types now resolve to domain drafts | AC4/AC3. |
| `src/hooks/{useAbilities,useDrafts,useGameSetup,useRoles}.ts` | Modify | Import lines | AC4. |
| `src/pages/RoleBuilder.tsx` | Modify | Import lines (`RoleDraft` merged into the existing `createEmptyDraft` import) | AC4. |
| `src/styles/shared.ts`, `src/utils/roleSort.ts` | Modify | `Team` now from `domain/teams` | AC4. |
| `eslint.config.js` | Modify | Domain block switched to `@typescript-eslint/no-restricted-imports` (catches `import type`); added `TRANSPORT_LAYERS` group | AC3 boundary enforcement. |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `src/test/mocks.ts` | Modify | Import split three ways | AC5 |
| `src/test/{AbilitiesStep,AbilitiesStepNoOpContract,GameSetup,NarratorPreview,ReviewStep,RoleCard,StepList,WakeOrderResolution,WinConditionsStep,Wizard}.test.tsx` | Modify | Import lines only | AC5 |
| `src/test/{abilitySteps,roleSelection,roleSort,roles.api,useDrafts,useRoles}.test.ts` | Modify | Import lines only | AC5 |

No test file had an assertion, behavior, or non-import line changed — verified by an empty non-`import` diff across `src/test/`.

## Test Results

- **Baseline**: 524 passed, 3 failed (`src/test/useRoles.test.ts`) — 41 files. tsc: 1 error (`Wizard.test.tsx(242)` TS6133). Lint: 2 errors.
- **Final**: 524 passed, 3 failed — identical, same 3 tests. tsc: same 1 baseline error at the same line 242. Lint: same 2 errors.
- **New tests added**: 0 — deliberate. This is a type-only feature; the compile-level gates (tsc) and the ESLint boundary rule *are* the tests. Red-Green was driven through the boundary rule (see *Reviewer Focus* #1). A vitest test re-checking the import graph would duplicate the linter.
- **Regressions**: None. All 3 baseline failures, the tsc error, and both lint errors are feature 12's and were left untouched.

## Contradictions Surfaced (plan section B: "field-shape drift ... surface in the record")

1. **`RoleListItem` (a transport DTO) was being consumed by two domain modules** — `roleSelection.ts` and `wakeOrder.ts` (introduced by feature 06). This was the only genuine AC3 violation; the rest was mechanical. Fixed by **honest typing, no casts**: each module now declares the narrow shape it actually reads (`SelectableRole`/`RoleDependencyRule`, `WakeCandidateRole`). TypeScript's structural typing means the API's `RoleListItem` satisfies these with no conversion, cast, or runtime change at any call site. This extends a pattern feature 06 had already established in `wakeOrder.ts` itself (`WakingRole` is described in its own docstring as "projected down to what the ordering needs").
2. **Draft vs transport optionality drift — real, and already correctly handled.** `WinConditionDraft.condition_params` is optional; the create payload requires an explicit `Record | null`. `api/roles.ts:110` already normalizes with `?? null`. No change needed; noting it as the exact drift the plan predicted.

## Deviations from Plan

1. **Retired the `types/role.ts` `Team` re-export seam instead of keeping it** (feature 03's reviewer recommended keeping it). Their *substantive* recommendation — invert the dependency so `domain/` imports nothing from `types/` — is fully implemented. Their reason for keeping the seam was explicit: *"If feature 11 instead deletes the re-export outright, it must rewrite every `Team` importer in one commit — mechanical, but wide and conflict-prone."* That wide rewrite **is this feature's AC4 mandate**, so the seam's purpose (deferring the rewrite out of Wave 1) is now spent. Keeping it would also have meant `types/role.ts` surviving as a pure pass-through re-export surface next to the real transport module — i.e. a barrel file, which is an explicit non-goal of this plan. The `import type` + `export type` construct they flagged is moot: no file re-exports `Team` now; `types/transport.ts` imports it directly for its own 2 interfaces.
2. **Transport module named `types/transport.ts`, not the proposed `types/api.ts`.** The plan marked this `[PROPOSED - name TBD]`. `api.ts` is not viable: the existing components boundary rule restricts the glob `**/api`, which **matches the specifier `../../types/api`** — naming it `api.ts` made lint fail in 5 component files that legitimately import DTOs. This was caught by the lint gate, not guessed. `transport.ts` also removes a real human ambiguity with the `src/api/` HTTP layer and matches the plan's own vocabulary ("transport types module", "transport DTOs").
3. **`StepModifier` homed in `domain/roleDraft.ts`.** It cannot live in `domain/abilitySteps.ts` (which imports `AbilityStepDraft` from `roleDraft.ts` — that would be circular). Placing it beside the draft interface that uses it is the only non-circular home short of a new single-type module. Consequence: `types/transport.ts` imports a scalar from a module named `roleDraft` — slightly odd to read, flagged here for the reviewer.
4. **Importer count was 36, not 30 or ~12.** Fully mechanical; no plan contradiction.

## Deferred

- **Barrel files / path aliases** (audit item 15) — deferred per non-goal. Recorded as still open.
- **`RoleCreatePayload`/`PreviewScriptPayload` stay file-local in `api/roles.ts`.** The context left this to the implementer. They are request shapes used by exactly one function each and never imported; moving them to `types/transport.ts` would widen their visibility for no caller benefit. Reversible if a second consumer appears.
- **`types/game.ts` untouched** — verified it does not block AC3 (no domain module imports it; its importers remain disjoint from the role-type importers).

## Runtime-Fix Temptations (noted, not acted on — plan section D)

1. `useGameSetup.ts:28` recomputes `buildRoleMap(roles)` via `useMemo`, but `roles` is a fresh array identity on each fetch — the memo may be doing little. Out of scope (runtime).
2. `WakeOrderResolution.tsx` reads router state through a cast that `routerState.ts` itself documents as "a compile-time agreement, not a guarantee" — an unvalidated boundary. Pre-existing; a real (if low-severity) soundness gap, but validating it is a runtime change.
3. The 3 `useRoles.test.ts` failures and the `Wizard.test.tsx` unused `rerender` are feature 12's; left untouched by instruction.

## Gaps

- **AC3's "only place transport and domain shapes meet" is satisfied for *conversion*, but 4 files import from both modules**: `api/roles.ts` (the sanctioned mapper) plus `Wizard.tsx`, `ReviewStep.tsx`, `RoleBuilder.tsx`. The latter three hold a `RoleDraft` and a `ValidationResult`/`NarratorPreviewResponse` as *parallel, unconverted* state — a response DTO displayed alongside the draft being edited. No mapping between the layers occurs there, so `draftToPayload`/`draftToPreviewPayload` remain the only conversion point. Recording this because "import from both" and "shapes meet" are not the same test, and a reviewer grepping for the former will find 4 hits.
- The ESLint boundary rule protects `src/domain` and `src/engine` only. Nothing prevents a *future* transport type from importing a domain type cyclically (`types → domain → types`); tsc would tolerate a type-level cycle. Not expressible in the current rule set without an import-graph plugin (not installed; adding one is out of scope).

## Reviewer Focus Areas

- **`eslint.config.js:36-72` — the rule swap.** The domain block moved from base `no-restricted-imports` to `@typescript-eslint/no-restricted-imports` (base turned `'off'` to avoid double-reporting) specifically because the base rule's `import type` handling is what let DTOs leak into the domain. Verify the swap didn't weaken the pre-existing React/UI-layer restrictions. Red-Green evidence: with the rule added, lint flagged all 5 offending domain files; after the split, 0. Mutation-tested afterward by re-adding a `types/transport` import to `wakeOrder.ts` — rule fired; file restored by file-copy (no git state touched).
- **`src/domain/roleSelection.ts:1-40` — `buildRoleMap` is now generic (`<T extends SelectableRole>`).** This is the one non-trivial type change. Rationale: a non-generic version returning `Record<string, SelectableRole>` would silently narrow what callers get back from the map. The generic keeps the caller's exact type while the rules read only the projected fields. Confirm this is the right call vs. simply narrowing (no current caller reads beyond `SelectableRole`, so narrowing would also compile — the generic is future-proofing, and could reasonably be argued down).
- **`src/domain/roleDraft.ts:11-45` — AC2's "distinct types" branch.** Please check I justified rather than asserted: `api/roles.ts:99-113` **drops `id`** from both `ability_steps` and `win_conditions` when building the payload, so draft `id` (a `crypto.randomUUID()` editing key from `appendAbilityStep`) and transport `id` (server PK) are genuinely different fields that happen to share a name and type. The interfaces remain structurally identical today, so TS will not catch drift between them — that is accepted and documented, not overlooked.
- **Deviation #1 (dropping the seam) contradicts feature 03's reviewer.** Reasoning is above; worth a second opinion since it was an explicit hand-off recommendation.
- **Blank-line integrity across the 36 mechanically-rewritten importers.** My first migration pass had a regex bug (`\s*$` ate the blank line after each import block). I caught it via a line-number shift in the tsc baseline error (242→241), restored all 35 files from `git show 3627df9:` (read-only) and re-ran with a corrected regex; the error returned to line 242, confirming byte-level parity. Worth a spot-check that no file lost formatting.
