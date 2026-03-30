# Phase 2.5: Named Exports Migration

**Status**: Complete
**Depends on**: Phase 02 (Game Facilitation)
**Estimated complexity**: Small
**Cross-references**: `yourwolf-frontend/AGENTS.md` (TypeScript style section)

## Objective

Migrate all React components from default exports to named exports, aligning with the Google TypeScript Style Guide and the project's frontend style conventions.

## Scope

### In Scope
- Convert 8 files from `export default` to named exports
- Update all corresponding import statements
- Verify build, test suite, and manual rendering

### Out of Scope
- Any functional changes to components
- New component creation
- Test additions beyond verifying existing tests pass

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Export Migration | Convert all `export default` to named exports across 8 files | Single batch refactor |

## Technical Context

- Files migrated: `Header.tsx`, `Sidebar.tsx`, `RoleCard.tsx`, `Layout.tsx`, `Home.tsx`, `Roles.tsx`, `routes.tsx`, `App.tsx`
- Migration order followed dependency graph: leaf components → layout → pages → routes → app
- Style guide: `yourwolf-frontend/docs/STYLE_GUIDE.md`

## Dependencies & Risks

- **Dependency**: All Phase 02 frontend code stable
- **Risk**: Minimal — purely mechanical refactor with immediate test validation

## Success Criteria

- [x] No `export default` statements remain in `src/**/*.tsx`
- [x] All imports use named import syntax
- [x] `npm run build` succeeds
- [x] `npm run test` passes

## QA Considerations

- No UI changes — build + test pass is sufficient verification

## Notes for Feature - Decomposer

Single-feature phase. Batch in dependency order (leaf → root) to avoid intermediate breakage.
