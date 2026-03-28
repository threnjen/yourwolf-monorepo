# Tasks: Primary Team Role Toggle (Issue 002)

## Stage 1: Type & Data Layer

- [ ] **1.1** Add `is_primary_team_role: boolean` to `RoleDraft` interface in `yourwolf-frontend/src/types/role.ts`
- [ ] **1.2** Add `is_primary_team_role: boolean` to `RoleListItem` interface in `yourwolf-frontend/src/types/role.ts`
- [ ] **1.3** Add `is_primary_team_role: false` to `createEmptyDraft()` in `yourwolf-frontend/src/pages/RoleBuilder.tsx`
- [ ] **1.4** Add `is_primary_team_role: boolean` to `RoleCreatePayload` interface in `yourwolf-frontend/src/api/roles.ts`
- [ ] **1.5** Add `is_primary_team_role: draft.is_primary_team_role` to `draftToPayload()` in `yourwolf-frontend/src/api/roles.ts`
- [ ] **1.6** Add `is_primary_team_role: false` to `createMockDraft()` in `yourwolf-frontend/src/test/mocks.ts`
- [ ] **1.7** Verify TypeScript compiles with no errors

## Stage 2: UI — Conditional Toggle

- [ ] **2.1** Update `handleTeamChange` in `BasicInfoStep.tsx` to auto-clear `is_primary_team_role` to `false` when team is `'village'` or `'neutral'`
- [ ] **2.2** Add `handlePrimaryTeamRoleChange(checked: boolean)` handler in `BasicInfoStep.tsx`
- [ ] **2.3** Add conditional checkbox rendering after team selector when team is not village/neutral, with `aria-label="Primary team role"`
- [ ] **2.4** Add helper text below checkbox: "Primary team roles are required when any role of this team is included in a game"
- [ ] **2.5** Verify toggle appears/disappears correctly by manual inspection or running tests

## Stage 3: Tests

- [ ] **3.1** Add `describe('primary team role toggle')` block to `BasicInfoStep.test.tsx`
- [ ] **3.2** Test: renders toggle for werewolf team
- [ ] **3.3** Test: hides toggle for village team
- [ ] **3.4** Test: hides toggle for neutral team
- [ ] **3.5** Test: checking toggle calls `onChange` with `is_primary_team_role: true`
- [ ] **3.6** Test: switching to village clears `is_primary_team_role` to `false`
- [ ] **3.7** Run full test suite — all tests pass
