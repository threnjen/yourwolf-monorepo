# Plan: Frontend Dead-Code Resolution & Test Structure

## Execution Metadata

- **Wave:** 5
- **Parallel safe:** no
- **Depends on:** 11-frontend-type-split
- **Key files modified:** `yourwolf-frontend/src/hooks/useDrafts.ts` (delete or wire — see AC1), `yourwolf-frontend/src/test/useDrafts.test.ts`, `yourwolf-frontend/src/api/roles.ts`, `yourwolf-frontend/src/api/games.ts`, `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx`, `yourwolf-frontend/src/hooks/useNameCheck.ts` [PROPOSED - name TBD] (new), all 33+ files under `yourwolf-frontend/src/test/` (relocation), ESLint config (remove the finding-2.4 exemption from feature 03)
- **Sequential reason:** relocates the entire test tree, which every prior frontend feature touches — must run after all other frontend features to avoid churn collisions.

Source: refactor audit findings 2.1 (M), 2.3, 2.4 (M), 1.1 (M), 1.2, restructuring items 4, 6, 11 in `dev/refactor-audit-frontend/refactor-audit-frontend-report.md`.

## A. Requirements & Traceability

Acceptance criteria:

- **AC1**: `hooks/useDrafts.ts` (orphaned — only its test imports it) is resolved. Default decision: **delete** hook + test (safest per decision framework; the drafts feature is unwired and unplanned in the roadmap). If the user has signaled the drafts feature is near-term, wire it instead — absent that signal, delete and record the deletion so it can be restored from git history.
- **AC2**: Dead API methods `rolesApi.listOfficial`, `rolesApi.getById` (`api/roles.ts` L30–L38), `gamesApi.list`, `gamesApi.delete` (`api/games.ts` L29–L37, L58–L60) are deleted with their tests. **Exception check**: Phase 04's integration map keeps `rolesApi` role CRUD on the backend and guts/wraps `api/games.ts` — deleting dead surface now is consistent with that; keep any method the Phase 04 doc explicitly names as retained — expander-verified: `gamesApi.delete` appears in the retained client list at `docs/phases/PHASE_04/PHASE_04_SUMMARY.md` L76, so **retain `gamesApi.delete`**; re-verify the other three against that doc before deleting.
- **AC3**: The layer violation in `BasicInfoStep.tsx` (L3, L101–L112) is fixed: the debounced name-availability check moves into a hook [PROPOSED - name TBD `useNameCheck`]; the component becomes a pure controlled component like its siblings; the ESLint exemption from feature 03 is removed so the boundary rule is violation-free.
- **AC4**: `src/test/` is restructured to mirror the source tree (e.g., `src/test/hooks/`, `src/test/pages/`, `src/test/components/`, `src/test/domain/`, `src/test/api/`, `src/test/utils/`) — mechanical moves, imports fixed, vitest config globs verified to still collect everything (test count before == after, minus tests deleted under AC1/AC2).
- **AC5**: Page-component naming is unified on the `Page`-suffix convention (`Home` → `HomePage`, `Roles` → `RolesPage`, per finding 1.2) including route registrations — OR recorded as rejected if churn outweighs value; default: do it, it's two files.
- **AC6**: Full suite passes GREEN — including repairing the 3 pre-existing failures in `src/test/useRoles.test.ts` (baseline-red tests upstream features were told to ignore; this final test-focused feature fixes them so the remediation ends on a green baseline). Lint passes with zero boundary exemptions (the AC3 exemption removal is conditional on the rule feature 03 actually ships — verify its final form at implementation time).

Non-goals: no `@/` alias adoption or barrels (deferred, audit item 15); no styling consolidation (audit 5.4 deferred); no `SelectableRoleCard`/facilitator-view extraction (audit 3.2/3.3 — deferred to Phase 04 scope, record as deferred).

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1–AC2 | hooks/api | Code-review evidence: orphan verification greps; suite green after deletion |
| AC3 | `useNameCheck`, `BasicInfoStep` | Existing `BasicInfoStep.test.tsx` (246 lines) as anchor; must-have new hook unit test — scenario, name [PROPOSED - name TBD] |
| AC4 | test tree | Test-count parity evidence (vitest reporter before/after) |
| AC5 | 2 pages + routes | Existing page tests; tsc |
| AC6 | package | Suite + lint output |

## B. Correctness & Edge Cases

- Before deleting any "dead" API method, re-grep the whole frontend (including tests and the Phase 04 doc) — deletion decisions must cite the grep.
- `useNameCheck` must preserve the exact debounce interval and race handling (stale-response ignoring) the component has today.
- Vitest include patterns: verify `src/test/**` subdirectories are matched (check `vite.config.ts`/`vitest` config).

## C. Consistency & Architecture Fit

- `useNameCheck` follows the existing `useFetch`/`useRoles` hook conventions.
- Test relocation should place domain-module tests (from features 03/06) into `src/test/domain/` establishing the pattern Phase 04's engine tests follow.

## D. Clean Design & Maintainability

Net-negative LOC feature. Nothing new except one small hook.

## E. Observability, Security, Operability

None affected. Rollback: revert (deletions recoverable from git).

## F. Test Plan

- Must-have: `useNameCheck` unit test (debounce + result states).
- Existing tests to update: `BasicInfoStep.test.tsx` (mock the hook or its api call at the new seam); every moved test's import paths.
- Evidence: test-count parity report; lint clean run.

## Stage 1: Dead code resolution
**Goal**: AC1, AC2
**Success Criteria**: Orphans and dead surface removed with grep evidence; suite green
**Status**: Not Started

## Stage 2: Layer-violation fix
**Goal**: AC3
**Success Criteria**: Boundary rule passes with no exemptions; BasicInfoStep tests green
**Status**: Not Started

## Stage 3: Test-tree restructure + naming
**Goal**: AC4–AC6
**Success Criteria**: Mirrored test layout; test-count parity; suite + lint green
**Status**: Not Started
