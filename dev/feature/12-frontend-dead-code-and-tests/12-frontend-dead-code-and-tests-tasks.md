# Tasks: Frontend Dead-Code Resolution & Test Structure

## Stage 1: Dead code resolution (AC1, AC2)

- [x] Capture pre-change baseline: run `npx vitest run` and record total test count and pass/fail (note: 3 pre-existing failures in `src/test/useRoles.test.ts` at expansion time — confirm whether upstream features fixed them; if not, flag before proceeding since AC6 requires a green suite)
  - Actual baseline **524 passed / 3 failed (527 tests, 41 files)** — plan's recorded `355/358` was stale. Build and lint were also RED (not recorded in plan). The 3 failures were NOT fixed upstream; fixed here under AC6.
- [x] Re-grep whole frontend + Phase 04 doc for `useDrafts`; cite grep, then delete `src/hooks/useDrafts.ts` and `src/test/useDrafts.test.ts`; record deletion (recoverable from git history)
  - Grep: only importer was its own test. Deleted both; recoverable from parent `cf60b31`.
- [x] Re-grep for `rolesApi.listOfficial` / `rolesApi.getById`; cite grep, delete both from `src/api/roles.ts` and remove their cases from `src/test/roles.api.test.ts`
- [x] Remove `listOfficial`/`getById` entries from `vi.mock` factories in `src/test/useRoles.test.ts` (incl. typed mock fields L19–L20), `RoleBuilder.test.tsx`, `routes.test.tsx`, `BasicInfoStep.test.tsx`
- [x] Re-grep for `gamesApi.list`; cite grep, delete from `src/api/games.ts` and remove its tests from `src/test/games.api.test.ts`
  - Cascade: also removed orphaned `createMockGameListItem` from `mocks.ts`.
- [x] Verify `gamesApi.delete` against `docs/phases/PHASE_04/PHASE_04_SUMMARY.md` (L76 lists game "delete" as an existing client method — possible retained surface); delete only if not retained, and record the decision either way
  - **RETAINED.** Decision + evidence caveat recorded in implementation record (Deviation 3): L76 is a descriptive inventory, not the retention contract the directive claims — but retention is the conservative call.
- [x] Run suite; confirm green (modulo documented pre-existing failures) and record new test count for parity math
  - **508 passed / 0 failed** (527 − 19 deleted).

## Stage 2: Layer-violation fix (AC3)

- [x] Create `src/hooks/useNameCheck.ts` `[PROPOSED - name TBD]` following `useFetch`/`useRoles` conventions; preserve exact behavior: 500ms debounce, requestId stale-response guard, catch→`idle`, `NameStatus` states (`idle`/`checking`/`available`/`taken`), calling `rolesApi.checkName`
  - Name confirmed as `useNameCheck`; `NameStatus` now exported from the hook.
- [x] Refactor `src/components/RoleBuilder/steps/BasicInfoStep.tsx` to use the hook; remove the direct `rolesApi` import (L3) and the in-component effect (~L95–L115) so it is a pure controlled component like its siblings
- [x] Write the must-have unit test for the new hook (debounce timing + result states, stale-response ignoring) — test name `[PROPOSED - name TBD]`
  - `src/test/hooks/useNameCheck.test.ts` — 11 tests, written Red-first.
- [x] Update `src/test/BasicInfoStep.test.tsx` to mock the hook or the api call at the new seam; keep all 246-line anchor scenarios green
  - **No changes needed**: the `rolesApi` module mock seam survived the extraction, so all 4 anchor name-check tests pass unchanged (strong behavior-preservation evidence). Only dead mock fields were trimmed.
- [x] Remove the feature-03 ESLint boundary exemption from `eslint.config.js` (if feature 03 added one — none exists at expansion time); confirm the boundary rule passes with zero exemptions via `npm run lint`
  - Feature 03 shipped the rule; the exemption lived in `BasicInfoStep.tsx` (not the config) as an `eslint-disable` + TODO naming this feature. Both removed. Boundary rule passes with **zero exemptions**.

## Stage 3: Test-tree restructure + naming (AC4, AC5, AC6)

- [x] Create mirrored test layout: `src/test/hooks/`, `src/test/pages/`, `src/test/components/`, `src/test/domain/`, `src/test/api/`, `src/test/utils/`; move all test files accordingly (domain-module tests from features 03/06 → `src/test/domain/`); keep `setup.ts` path consistent with `vite.config.ts` `setupFiles` (update config if moved)
  - 40 files moved; deep mirroring incl. `components/RoleBuilder/steps/`. `setup.ts`/`mocks.ts` kept at test root, so **no config change needed**. All 5 feature-08 files relocated.
- [x] Fix all relative imports in moved tests (including `mocks.ts` references) — mechanical moves only, no behavior changes
  - Specifiers rewritten by resolving each against its original dir and re-deriving from the new dir (correct by construction, not `../` counting).
- [x] Verify vitest collection: config in `vite.config.ts` has no explicit `include` (defaults collect subdirs); confirm test count after == count before minus AC1/AC2 deletions, and record the parity evidence (vitest reporter before/after)
  - **EXACT PARITY: 535 → 535, name-set diff clean (zero missing, zero added), 42 files collected.**
- [x] Rename `Home` → `HomePage` and `Roles` → `RolesPage` (files `src/pages/Home.tsx`, `src/pages/Roles.tsx`, exports, and route registrations in `src/routes.tsx` L2–L3, L12, L14); update their tests — or record AC5 as rejected with rationale
  - Done (not rejected). Test files renamed to match; `describe` blocks updated.
- [x] Run `tsc`, full suite, and `npm run lint`; confirm suite passes and lint is clean with zero boundary exemptions (AC6)
  - **535 passed / 0 failed; lint exit 0; `npm run build` PASS.**
- [x] Record deferred items in implementation notes: `@/` alias/barrels (audit 15), styling consolidation (audit 5.4), `SelectableRoleCard`/facilitator-view extraction (audit 3.2/3.3)
  - Recorded under *Gaps* item 5.

## Added scope (orchestrator direction — not in original plan)

- [x] **AC7** Repair RED build: `Wizard.test.tsx(242) TS6133 'rerender' unused` → removed genuinely-unused binding. `npm run build` PASS.
- [x] **AC8** Install + wire the entirely-absent `react-hooks` ESLint plugin (`eslint-plugin-react-hooks@^5.2.0`, `recommended-latest`). Fallout: **zero violations**, verified by deliberate-violation probe rather than trusting the green. Kept the load-bearing `useRoles.ts` disable (verified it suppresses a real warning). Nothing disabled to reach green.
- [x] **AC9** Fix feature-07 422 UX regression: new `src/api/errors.ts` reads pydantic 422 detail arrays + domain-error string details; `RoleBuilder.tsx` surfaces real field messages instead of "Validation service unavailable". Directive's 1-char scenario proven unreachable (`Wizard.tsx:96` gate); shipped test uses the reachable over-long-name path.
- [x] Update stale docs falsified by these changes (`CODEBASE_CONTEXT.md`, `ARCHITECTURE.md`), incl. `types/role.ts` staleness inherited from feature 11.
