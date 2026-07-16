# Context: Frontend Dead-Code Resolution & Test Structure

## Key Files

### Files being changed

| File | Role | Change Type |
|------|------|-------------|
| `yourwolf-frontend/src/hooks/useDrafts.ts` | Orphaned hook (verified: only `src/test/useDrafts.test.ts` imports it) | Delete (AC1 default) |
| `yourwolf-frontend/src/test/useDrafts.test.ts` | Test for orphaned hook | Delete (AC1) |
| `yourwolf-frontend/src/api/roles.ts` | Contains dead `listOfficial` (L30) and `getById` (L35); `checkName` (L45) is the seam for the new hook | Modify (delete dead methods) |
| `yourwolf-frontend/src/api/games.ts` | Contains dead `list` (L29) and `delete` (L58) | Modify (delete dead methods) |
| `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Layer violation: imports `rolesApi` directly (L3), debounced `checkName` call inside component effect (~L95–L115, 500ms debounce, requestId race guard) | Modify (extract to hook) |
| `yourwolf-frontend/src/hooks/useNameCheck.ts` `[PROPOSED - name TBD]` | New hook housing debounce + race-safe name-availability check | Create |
| `yourwolf-frontend/src/test/**` (33 files incl. `mocks.ts`, `setup.ts`) | Flat test tree | Modify (relocate into mirrored subdirs) |
| `yourwolf-frontend/src/test/roles.api.test.ts`, `games.api.test.ts`, `useRoles.test.ts`, `RoleBuilder.test.tsx`, `routes.test.tsx`, `BasicInfoStep.test.tsx` | Mock/test `listOfficial`/`getById` in `vi.mock` factories | Modify (remove dead-method mocks/tests) |
| `yourwolf-frontend/src/pages/Home.tsx`, `src/pages/Roles.tsx` | Page-suffix rename targets (AC5) | Modify (rename to `HomePage`/`RolesPage`) |
| `yourwolf-frontend/src/routes.tsx` | Imports/registers `Home` (L2, L12) and `Roles` (L3, L14) | Modify (rename imports) |
| `yourwolf-frontend/eslint.config.js` | Boundary rule/exemption removal target (see Discovery Delta) | Modify (conditional) |

### Read-only references

| File | Role |
|------|------|
| `yourwolf-frontend/vite.config.ts` | Vitest config lives here (no separate vitest config file); `setupFiles: './src/test/setup.ts'`; coverage excludes `src/test/`; no explicit `include` glob, so default `**/*.{test,spec}.*` picks up subdirectories — verify parity anyway |
| `docs/phases/PHASE_04/PHASE_04_SUMMARY.md` | Retention contract for API methods (L36, L57–L64, L76) |
| `dev/refactor-audit-frontend/refactor-audit-frontend-report.md` | Source audit findings 2.1, 2.3, 2.4, 1.1, 1.2 |
| `yourwolf-frontend/src/hooks/useFetch.ts`, `useRoles.ts` | Hook conventions for `useNameCheck` |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| Orphan status of `useDrafts.ts` verified: only importer is its own test | AC1 delete decision confirmed safe | None |
| Dead-method grep verified: `listOfficial`/`getById` appear only in `api/roles.ts` and test `vi.mock` factories (`useRoles.test.ts` also declares typed mock fields at L19–L20); `gamesApi.list`/`gamesApi.delete` appear only in `api/games.ts` and `games.api.test.ts`. Live consumers of `gamesApi` (`WakeOrderResolution.tsx`, `useGame.ts`, `GameFacilitator.tsx`) use other methods | Deletions confirmed safe; test mock factories must be trimmed alongside | Add tasks |
| Phase 04 retention check done: PHASE_04_SUMMARY L36 retains `rolesApi.create()`, `validate()`, roles-list endpoint; L57–L61 names `gamesApi.create/start/getById/getNightScript/advancePhase` as migration targets (keep); L76 mentions game delete — but the plan's AC2 targets are not in the retained set. `gamesApi.delete` appears in Phase 04's "game create/start/advance/script/delete" list (L76); Implementer must re-verify `gamesApi.delete` against Phase 04 before deleting — possible retained surface | AC2 exception check partially contradicts plan for `gamesApi.delete` | Warning to Decomposer / implementer re-verifies |
| Current `eslint.config.js` has NO boundary rule and NO feature-03 exemption (only recommended configs + no-unused-vars). Feature 12 runs in Wave 5 after feature 03, which is expected to add them; if feature 03 did not add an exemption, AC3's "remove exemption" step is a no-op | AC3 ESLint step is conditional on feature 03's actual output | Verify at implementation time |
| Test baseline is RED: 3 pre-existing failures in `src/test/useRoles.test.ts` ("fetches roles with visibility on mount", "calls list without visibility", "refetches when visibility changes") — likely fallout from an earlier wave feature | AC6 "full suite passes" requires either fixing these or confirming an upstream feature fixes them first; test-count parity math must account for them | Warning to Decomposer |
| `BasicInfoStep.tsx` debounce verified: 500ms `setTimeout`, `nameCheckIdRef` requestId race guard, catch→`idle`; seam API is `rolesApi.checkName()` returning `{is_available}` | Confirms plan's AC3 behavior-preservation requirements with concrete values | None |
| No `.github/learnings/` directory exists | No learnings to apply | None |
| Vitest config is embedded in `vite.config.ts` (no `vitest.config.*`); no explicit test `include`, defaults collect nested dirs | AC4 glob verification simplified; coverage `exclude: ['src/test/']` already covers subdirs | None |
| No format/prettier script in `package.json`; lint is `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0` | `--report-unused-disable-directives` will itself flag a stale exemption comment | None |

## Architectural Decisions

- **Delete over wire** for `useDrafts` (AC1): drafts feature is unwired and unplanned; git history preserves it. Record the deletion in implementation notes.
- **Hook extraction** (AC3): move debounce + race handling into `useNameCheck` `[PROPOSED - name TBD]` following `useFetch`/`useRoles` conventions, making `BasicInfoStep` a pure controlled component like sibling steps.
- **Mirror-the-source test layout** (AC4): `src/test/{hooks,pages,components,domain,api,utils}/`; domain-module tests from features 03/06 go to `src/test/domain/`, establishing the pattern for Phase 04 engine tests.
- **Page-suffix naming** (AC5): default is to do it (two files); may be recorded as rejected only if churn outweighs value.
- Net-negative LOC feature; only new code is the one small hook + its test.

## Constraints

- Every deletion decision must cite a fresh whole-frontend grep (including tests and the Phase 04 doc).
- Keep any API method Phase 04 explicitly retains (`rolesApi.create`, `rolesApi.validate`, roles-list endpoint, `gamesApi.create/start/getById/getNightScript/advancePhase`; re-verify `gamesApi.delete`).
- `useNameCheck` must preserve the exact 500ms debounce and stale-response (requestId) race handling.
- Test relocation is mechanical: moves + import fixes only; test count before == after minus AC1/AC2 deletions.
- Lint must pass with zero boundary exemptions (`--max-warnings 0`).

## Scope Boundaries

- No `@/` alias adoption or barrel files (audit item 15, deferred) — even though vite already defines the `@` alias.
- No styling consolidation (audit 5.4, deferred).
- No `SelectableRoleCard`/facilitator-view extraction (audit 3.2/3.3 — deferred to Phase 04; record as deferred).
- Do not touch live `gamesApi` consumers (`WakeOrderResolution.tsx`, `useGame.ts`, `GameFacilitator.tsx`) beyond what AC2 deletions require (nothing, per grep).
- Do not change `checkName` API behavior or backend contract.

## Relationships to Sibling Plans

- **Depends on:** `11-frontend-type-split` (Wave 5, not parallel-safe).
- Must run **after all other frontend features** (03, 06, 08, 11): it relocates the entire test tree that every prior frontend feature touches.
- The feature-03 ESLint boundary exemption (audit finding 2.4) is created upstream and removed here.
- `src/test/domain/` layout established here is the pattern Phase 04 engine tests will follow.

## Suggested Implementation Order

Last frontend feature of the phase (Wave 5). Within the feature: Stage 1 (dead code) → Stage 2 (layer violation) → Stage 3 (test-tree restructure + naming), matching the plan.

## Environment State

| Property | Value |
|----------|-------|
| Tech Stack | React 18 + TypeScript + Vite (frontend workspace `yourwolf-frontend/`) |
| Test Runner | `npx vitest run` (from `yourwolf-frontend/`; config in `vite.config.ts`, jsdom, globals) |
| Test Baseline | 355 passed, 3 failed (all in `src/test/useRoles.test.ts`) across 30 files / 358 tests — captured 2026-07-16 |
| Lint | `npm run lint` (`eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`) |
| Format | Not configured |

## Relevant Learnings

None applicable (`.github/learnings/` does not exist).
