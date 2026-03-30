# Phase 3: Role Builder MVP

**Status**: Complete
**Depends on**: Phase 02 (Game Facilitation)
**Estimated complexity**: Large
**Cross-references**: None

## Objective

Enable users to create custom roles by composing abilities from a predefined list, with a 4-step wizard UI, backend validation, draft persistence, and full-stack code quality audits.

## Scope

### In Scope
- Role Builder wizard (Basic Info → Abilities → Win Conditions → Review)
- Role validation service with dry-run endpoint and duplicate name detection
- Role CRUD ownership (ability step and win condition replacement, official role guards)
- Multi-copy role selection with dependency auto-selection in game setup
- Local draft storage (client-side persistence of work-in-progress roles)
- Narrator preview panel (live script preview as role is built)
- UI polish: team sorting, primary team toggle, ability step parameters, modifier/win condition labels
- Backend and frontend code audits
- Test audit (remove redundant tests, improve coverage)

### Out of Scope
- User accounts / auth (Phase 04)
- Publishing roles publicly (Phase 05)
- Conditional ability logic (IF/THEN/ELSE) (Phase 06)
- Audio narration (Phase 06)

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Role Builder Wizard | 4-step wizard with validation, debounced name check, step indicator | Frontend pages/components |
| 2 | Role Validation Service | `POST /api/roles/validate` and `GET /api/roles/check-name` endpoints | Backend service, schemas |
| 3 | Role CRUD Ownership | Full step/condition replacement on update, official role deletion guard, `creator_id` | Backend service |
| 4 | Role Card Copies & Dependencies | Multi-copy selection in game setup, auto-select dependent roles | Full-stack feature |
| 5 | Local Draft Storage | Client-side draft persistence using localStorage | Frontend hook |
| 6 | Narrator Preview | Live script preview panel in the role builder | Full-stack feature |
| 7 | UI Polish | Team sorting, labels, toggles, parameter display | Frontend components |
| 8 | Code Audits | Backend, frontend, and test quality audits | Refactoring |

## Technical Context

- Role service: `app/services/role_service.py` (validate_role, check_duplicate_name, get_warnings)
- Role schemas: `app/schemas/role.py` (RoleCreate, RoleUpdate, RoleValidationResponse, RoleNameCheckResponse)
- Role router: `app/routers/roles.py`
- Script service: `app/services/script_service.py` (preview_role_script)
- Frontend wizard: `src/pages/RoleBuilder.tsx`, `src/components/RoleBuilder/Wizard.tsx`
- Wizard steps: `src/components/RoleBuilder/steps/BasicInfoStep.tsx`, `AbilitiesStep.tsx`, `WinConditionsStep.tsx`, `ReviewStep.tsx`
- API clients: `src/api/roles.ts`, `src/api/abilities.ts`
- Hooks: `src/hooks/useAbilities.ts`
- Types: `src/types/role.ts`

## Dependencies & Risks

- **Dependency**: Phase 01 ability model and seed data; Phase 02 game setup for multi-copy selection
- **Risk**: Validation rules may evolve as more ability types are used; mitigated by the dry-run validation endpoint

## Success Criteria

- [x] User creates a custom role via the 4-step wizard
- [x] Validation endpoint catches invalid roles before save
- [x] Duplicate name detection works (case-insensitive)
- [x] Drafts persist across browser sessions
- [x] Narrator preview updates live as abilities are added
- [x] Custom roles work in game sessions
- [x] Backend ≥80% test coverage maintained

## QA Considerations

- Wizard UI requires manual QA: step navigation, validation states, draft recovery
- Narrator preview accuracy must be verified against script generator output
- QA docs exist in this folder

## Notes for Feature - Decomposer

Phase was decomposed into 13 features. The wizard (feature 1) and validation service (feature 2) are the core pair — most other features build on them. Code audits (features 11-13) were done last as cleanup. Detailed acceptance criteria per feature are in `PHASE_3_SUMMARY.md` (original format).
