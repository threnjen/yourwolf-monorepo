# Plan: Frontend Transport/Domain Type Split

## Execution Metadata

- **Wave:** 4
- **Parallel safe:** yes
- **Depends on:** 08-frontend-abilities-step
- **Key files modified:** `yourwolf-frontend/src/types/role.ts`, `yourwolf-frontend/src/types/api.ts` [PROPOSED - name TBD] (new), domain type module(s) under `yourwolf-frontend/src/domain/` [PROPOSED - name TBD], ~12 importers of `types/role.ts` (pages, hooks, api, components, domain modules from 03/06), `yourwolf-frontend/src/types/game.ts` (verify)
- **Sequential reason:** shares `AbilitiesStep.tsx` (and other importers) with upstream 06/08 — runs after component decomposition settles so type-import churn lands once. Parallel-safe within Wave 4 (frontend files disjoint from 09/10 backend files).

Source: refactor audit finding 6.1 (Medium, ENGINE), restructuring item 9 in `dev/refactor-audit-frontend/refactor-audit-frontend-report.md`. Answers Phase 04's question "which types does the engine own?"

## A. Requirements & Traceability

Acceptance criteria:

- **AC1**: `src/types/role.ts` (L43–L66 and surroundings) is split: server DTO shapes (`Role`, `RoleListItem`, `Ability`, and other API response types) live in a transport types module; UI/domain draft types (`RoleDraft`, `AbilityStepDraft`, `WinConditionDraft`) live with the domain layer.
- **AC2**: Degenerate aliases are resolved: `AbilityStepDraft = AbilityStep` (bare alias) and `WinConditionDraft` (structural duplicate of `WinCondition`) are either made real distinct types with documented intent or collapsed to the one canonical type — no aliases that merely restate another type.
- **AC3**: Domain modules (from features 03/06) import zero transport types; the api layer's mapping functions (`draftToPayload`/`draftToPreviewPayload` in `api/roles.ts` L88–L147 — the audit's positive pattern 5.3) remain the only place transport and domain shapes meet.
- **AC4**: All importers updated — expander-verified count is 30 files (18 source + 12 test), larger than the audit's ~12 estimate but mechanical; `tsc` (build) passes with no `any`-bridging or type assertions added to paper over the split.
- **AC5**: Full vitest suite passes unmodified in behavior (type-only churn in test imports is expected).

Non-goals: no runtime behavior changes whatsoever (type-only feature, plus import-line edits); no barrel/alias adoption (audit item 15, deferred — record as deferred); `types/game.ts` reorganization only if it blocks AC3 (verify; otherwise untouched).

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1–AC2 | type modules | Code-review evidence + tsc |
| AC3 | domain + api layers | Code-review evidence: import graph check; ESLint boundary rule from 03 extended to forbid domain→transport imports if expressible |
| AC4–AC5 | all importers | tsc + existing suite (audit: "Type-only; tsc catches breaks") |

## B. Correctness & Edge Cases

- Field-shape drift risk: if `RoleDraft` and transport payloads share field names with different optionality, splitting may surface latent errors — fix by honest typing, not casts; surface genuinely contradictory shapes in the implementation record.
- The wizard passes drafts through `Wizard.tsx`/steps — ensure prop types follow the domain types.

## C. Consistency & Architecture Fit

- Directly mirrors Phase 04's planned type surface (`RoleInput`, `AbilityStepInput` engine types); place domain types where the engine will import them.
- Extend the feature-03 lint boundary if the plugin supports type-import restriction; otherwise code-review enforcement.

## D. Clean Design & Maintainability

Types move, code doesn't. Any temptation to "fix" runtime code found along the way goes to the implementation record as a note, not a change.

## E. Observability, Security, Operability

None affected. Rollback: revert.

## F. Test Plan

- Evidence is compile-level: tsc build + suite green.
- Code-review evidence: no new `as` casts introduced (grep diff), domain imports clean.
- Manual QA: none needed beyond suite (no runtime change).

## Stage 1: Split and re-home types
**Goal**: AC1, AC2
**Success Criteria**: Two coherent type modules; degenerate aliases resolved
**Status**: Not Started

## Stage 2: Importer migration + boundary proof
**Goal**: AC3–AC5
**Success Criteria**: tsc + suite green; domain layer transport-free
**Status**: Not Started
