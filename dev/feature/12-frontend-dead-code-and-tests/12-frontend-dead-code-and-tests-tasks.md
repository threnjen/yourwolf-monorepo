# Tasks: Frontend Dead-Code Resolution & Test Structure

## Stage 1: Dead code resolution (AC1, AC2)

- [ ] Capture pre-change baseline: run `npx vitest run` and record total test count and pass/fail (note: 3 pre-existing failures in `src/test/useRoles.test.ts` at expansion time — confirm whether upstream features fixed them; if not, flag before proceeding since AC6 requires a green suite)
- [ ] Re-grep whole frontend + Phase 04 doc for `useDrafts`; cite grep, then delete `src/hooks/useDrafts.ts` and `src/test/useDrafts.test.ts`; record deletion (recoverable from git history)
- [ ] Re-grep for `rolesApi.listOfficial` / `rolesApi.getById`; cite grep, delete both from `src/api/roles.ts` and remove their cases from `src/test/roles.api.test.ts`
- [ ] Remove `listOfficial`/`getById` entries from `vi.mock` factories in `src/test/useRoles.test.ts` (incl. typed mock fields L19–L20), `RoleBuilder.test.tsx`, `routes.test.tsx`, `BasicInfoStep.test.tsx`
- [ ] Re-grep for `gamesApi.list`; cite grep, delete from `src/api/games.ts` and remove its tests from `src/test/games.api.test.ts`
- [ ] Verify `gamesApi.delete` against `docs/phases/PHASE_04/PHASE_04_SUMMARY.md` (L76 lists game "delete" as an existing client method — possible retained surface); delete only if not retained, and record the decision either way
- [ ] Run suite; confirm green (modulo documented pre-existing failures) and record new test count for parity math

## Stage 2: Layer-violation fix (AC3)

- [ ] Create `src/hooks/useNameCheck.ts` `[PROPOSED - name TBD]` following `useFetch`/`useRoles` conventions; preserve exact behavior: 500ms debounce, requestId stale-response guard, catch→`idle`, `NameStatus` states (`idle`/`checking`/`available`/`taken`), calling `rolesApi.checkName`
- [ ] Refactor `src/components/RoleBuilder/steps/BasicInfoStep.tsx` to use the hook; remove the direct `rolesApi` import (L3) and the in-component effect (~L95–L115) so it is a pure controlled component like its siblings
- [ ] Write the must-have unit test for the new hook (debounce timing + result states, stale-response ignoring) — test name `[PROPOSED - name TBD]`
- [ ] Update `src/test/BasicInfoStep.test.tsx` to mock the hook or the api call at the new seam; keep all 246-line anchor scenarios green
- [ ] Remove the feature-03 ESLint boundary exemption from `eslint.config.js` (if feature 03 added one — none exists at expansion time); confirm the boundary rule passes with zero exemptions via `npm run lint`

## Stage 3: Test-tree restructure + naming (AC4, AC5, AC6)

- [ ] Create mirrored test layout: `src/test/hooks/`, `src/test/pages/`, `src/test/components/`, `src/test/domain/`, `src/test/api/`, `src/test/utils/`; move all test files accordingly (domain-module tests from features 03/06 → `src/test/domain/`); keep `setup.ts` path consistent with `vite.config.ts` `setupFiles` (update config if moved)
- [ ] Fix all relative imports in moved tests (including `mocks.ts` references) — mechanical moves only, no behavior changes
- [ ] Verify vitest collection: config in `vite.config.ts` has no explicit `include` (defaults collect subdirs); confirm test count after == count before minus AC1/AC2 deletions, and record the parity evidence (vitest reporter before/after)
- [ ] Rename `Home` → `HomePage` and `Roles` → `RolesPage` (files `src/pages/Home.tsx`, `src/pages/Roles.tsx`, exports, and route registrations in `src/routes.tsx` L2–L3, L12, L14); update their tests — or record AC5 as rejected with rationale
- [ ] Run `tsc`, full suite, and `npm run lint`; confirm suite passes and lint is clean with zero boundary exemptions (AC6)
- [ ] Record deferred items in implementation notes: `@/` alias/barrels (audit 15), styling consolidation (audit 5.4), `SelectableRoleCard`/facilitator-view extraction (audit 3.2/3.3)
