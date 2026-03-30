# Phase 3.5: Narrator Preview Fixes

**Status**: Complete
**Depends on**: Phase 03 (Role Builder MVP)
**Estimated complexity**: Small
**Cross-references**: None

## Objective

Fix two bugs preventing the narrator preview panel from working and add the 5 missing ability instruction templates so all 15 ability types produce narrator text.

## Scope

### In Scope
- Fix preview endpoint rejecting requests with 422 (schema too strict for preview use case)
- Fix `wake_order == 0` not treated as non-waking
- Add instruction templates for 5 missing ability types: `change_to_team`, `perform_as`, `perform_immediately`, `stop`, `random_num_players`
- Create lightweight `PreviewScriptRequest` schema
- Regression tests for both bugs
- Unit tests for all new templates

### Out of Scope
- Distinct "preview unavailable" vs. "does not wake" UI state
- Audio narration preview
- Multi-role game script preview
- Conditional step rendering (IF/THEN prefix display)

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Preview Endpoint Fix | New `PreviewScriptRequest` schema with relaxed constraints | Backend schema, endpoint |
| 2 | Wake Order Zero Fix | Treat `wake_order == 0` as non-waking in preview and full script | Backend service |
| 3 | Missing Templates | 5 new instruction templates for all ability types | Backend service |

## Technical Context

- Preview endpoint: `app/routers/roles.py` (`POST /api/roles/preview-script`)
- Script service: `app/services/script_service.py` (`preview_role_script`, `_generate_step_instruction`)
- Schemas: `app/schemas/role.py` (new `PreviewScriptRequest`)
- Frontend: `src/pages/RoleBuilder.tsx` (preview API call in `Promise.allSettled`)
- Affected roles: Doppelganger, Paranormal Investigator, Blob, Apprentice Seer (and similar)

## Dependencies & Risks

- **Dependency**: Phase 03 narrator preview implementation must exist
- **Risk**: Minimal — targeted bug fixes with no schema migrations or infrastructure changes

## Success Criteria

- [x] Preview shows instructions once user enters name and sets `wake_order > 0`
- [x] Preview works before description is filled in
- [x] `wake_order == 0` shows "does not wake up" in preview
- [x] All 15 ability types produce non-None instruction text
- [x] Full game script (`generate_night_script`) also handles `wake_order == 0` correctly

## QA Considerations

- Manual QA needed for preview panel behavior during wizard interaction
- QA docs exist in this folder

## Notes for Feature - Decomposer

Three tightly coupled fixes that share the same service file. Could be decomposed into preview-endpoint-fix and missing-templates as two features, which is how it was actually done.
