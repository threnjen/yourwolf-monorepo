# Execution Manifest: Refactor Audit Remediation

**Phase documents (source of truth):**
- `dev/refactor-audit-backend/refactor-audit-backend-report.md`
- `dev/refactor-audit-frontend/refactor-audit-frontend-report.md`

**Ordering note:** This remediation derives from two audit reports rather than a single Phase document. Feature order follows each report's "Recommended Restructuring Priority" (quick wins → important restructurings → major reorganizations), interleaved so the independent backend and frontend chains run in parallel waves. One report-priority deviation: seed-data extraction (backend item 10, a "major reorganization") runs in Wave 2 because its file scope is nearly disjoint from everything else and it only needs the lazy database wiring from `02-backend-config-database`.

## Feature List (ordered)

1. `01-backend-schema-surface`
2. `02-backend-config-database`
3. `03-frontend-domain-foundation`
4. `04-backend-domain-exceptions`
5. `05-backend-seed-data`
6. `06-frontend-game-rules`
7. `07-backend-validation-consolidation`
8. `08-frontend-abilities-step`
9. `09-backend-service-validators`
10. `10-backend-narration-package`
11. `11-frontend-type-split`
12. `12-frontend-dead-code-and-tests`

## Feature Table

| Feature | Wave | Parallel Safe | Depends On | Key Files Modified | Sequential Reason |
|---|---|---|---|---|---|
| `01-backend-schema-surface` | 1 | yes | none | `app/schemas/__init__.py`, `app/schemas/ability.py`, `app/schemas/role.py`, `tests/test_schemas.py` (verify) | n/a |
| `02-backend-config-database` | 1 | yes | none | `app/config.py`, `app/database.py`, `app/models/base.py` [PROPOSED] (new), all 8 `app/models/*`, `app/main.py` (verify), `app/seed/__init__.py` (verify), `tests/conftest.py` | n/a |
| `03-frontend-domain-foundation` | 1 | yes | none | `src/domain/*` (new), `src/utils/format.ts` (new), `src/styles/theme.ts`, `src/utils/roleSort.ts`, `src/components/RoleBuilder/steps/{BasicInfoStep,AbilitiesStep,ReviewStep}.tsx`, `src/pages/RoleBuilder.tsx`, ESLint config | n/a |
| `04-backend-domain-exceptions` | 2 | yes | `02-backend-config-database` | `app/exceptions.py` [PROPOSED] (new), `app/main.py`, `app/routers/{games,roles}.py`, `app/services/{game_service,role_service}.py`, router tests (verify) | shares `app/main.py` with upstream `02-backend-config-database` |
| `05-backend-seed-data` | 2 | yes | `02-backend-config-database` | `app/seed/roles.py`, `app/seed/data/roles.json` [PROPOSED] (new), `app/seed/abilities.py` (verify), `tests/test_seed.py` | runtime dependency on 02's lazy engine accessors |
| `06-frontend-game-rules` | 2 | yes | `03-frontend-domain-foundation` | `src/domain/{roleSelection,wakeOrder,abilitySteps}.ts` [PROPOSED] (new), `src/hooks/useGameSetup.ts`, `src/pages/{WakeOrderResolution,GameSetup}.tsx`, `src/components/RoleBuilder/steps/AbilitiesStep.tsx`, shared router-state type [PROPOSED], page tests (verify) | shares `AbilitiesStep.tsx` with upstream `03-frontend-domain-foundation` |
| `07-backend-validation-consolidation` | 3 | yes | `04-backend-domain-exceptions` | `app/routers/games.py`, `app/services/{game_service,role_service}.py`, `app/schemas/role.py`, `tests/test_games_router.py`, `tests/test_game_service.py`, `tests/test_roles.py` (verify) | shares routers/services with upstream `04-backend-domain-exceptions`; raises its exception types |
| `08-frontend-abilities-step` | 3 | yes | `06-frontend-game-rules` | `src/components/RoleBuilder/steps/AbilitiesStep.tsx` + new `{AbilityPalette,StepParameterInputs,StepList}.tsx` [PROPOSED], `src/test/AbilitiesStep.test.tsx`, `Wizard.tsx` (verify) | shares `AbilitiesStep.tsx` with upstream `06-frontend-game-rules`; consumes `domain/abilitySteps` |
| `09-backend-service-validators` | 4 | yes | `07-backend-validation-consolidation` | `app/services/{game_setup_validation,role_validation}.py` [PROPOSED] (new), `app/services/{game_service,role_service}.py`, paginate helper [PROPOSED] (new), `tests/test_game_service.py`, new validation test files [PROPOSED] | shares `game_service.py`/`role_service.py` with upstream `07-backend-validation-consolidation` |
| `10-backend-narration-package` | 4 | yes | `04-backend-domain-exceptions` | `app/services/narration/*` [PROPOSED] (new), `app/services/script_service.py`, `app/routers/{games,roles}.py`, `app/schemas/{game,role}.py` (verify), `tests/test_script_service.py` (split) | shares `routers/games.py` with upstream 04/07 (Waves 2–3) |
| `11-frontend-type-split` | 4 | yes | `08-frontend-abilities-step` | `src/types/role.ts`, `src/types/api.ts` [PROPOSED] (new), domain type modules, ~12 importers, `src/types/game.ts` (verify) | shares component/importer files with upstream 06/08 |
| `12-frontend-dead-code-and-tests` | 5 | no | `11-frontend-type-split` | `src/hooks/useDrafts.ts` (delete/wire), `src/api/{roles,games}.ts`, `src/components/RoleBuilder/steps/BasicInfoStep.tsx`, `src/hooks/useNameCheck.ts` [PROPOSED] (new), all `src/test/**` (relocation), ESLint config | relocates the entire test tree touched by every prior frontend feature; must run last |

## Execution Schedule

- **Wave 1 (parallel):** `01-backend-schema-surface`, `02-backend-config-database`, `03-frontend-domain-foundation`
- **Wave 2 (parallel):** `04-backend-domain-exceptions`, `05-backend-seed-data`, `06-frontend-game-rules`
- **Wave 3 (parallel):** `07-backend-validation-consolidation`, `08-frontend-abilities-step`
- **Wave 4 (parallel):** `09-backend-service-validators`, `10-backend-narration-package`, `11-frontend-type-split`
- **Wave 5 (sequential):** `12-frontend-dead-code-and-tests`

Backend features live entirely under `yourwolf-backend/`; frontend features under `yourwolf-frontend/` — the two chains never share files, which is what makes each wave's cross-package parallelism safe. Within each package, waves are strictly sequential because consecutive features share service/router/component files.

**Integration feature:** none required. This is a refactor of an already-runnable application; every feature's acceptance criteria require the existing entry points, full test suites, and (where noted) smoke boots to stay green. No new runtime wiring is introduced.

## Expected Bundle Files

Each `dev/feature/[0N-name]/` directory contains:
- `[0N-name]-plan.md`
- `[0N-name]-context.md`
- `[0N-name]-tasks.md`

## Deferred Items (recorded, not scheduled)

- Backend: services returning transport DTOs (audit 4.3) and ORM→DTO mapping standardization (cross-cutting #3) — deferred until a non-HTTP consumer exists.
- Backend: barrel-usage convention for services/routers (6.2) — accepted as-is.
- Frontend: `location.state` handoff replacement (4.1 full fix, High risk) — deferred to Phase 04 when the engine owns game-session construction.
- Frontend: `@/` alias + per-layer barrels (item 15), styling consolidation (5.4), `SelectableRoleCard`/facilitator-view extraction (3.2/3.3) — deferred to Phase 04 or later.

## Verification Assets

### New Test Files

| Path | Associated Feature(s) | Purpose |
|---|---|---|
| Domain-module unit tests under `src/test/` [PROPOSED - names TBD] | `03-frontend-domain-foundation`, `06-frontend-game-rules` | Direct pure-function coverage: team derivations, cascade selection, wake-order grouping/shuffle, step renumbering |
| `tests/test_role_validation.py` [PROPOSED - name TBD] and game-setup validation tests | `09-backend-service-validators` | Relocated + focused validator coverage |
| Split of `tests/test_script_service.py` into ~3 files [PROPOSED - names TBD] | `10-backend-narration-package` | Template / builder / preview-adapter seams; parity oracle for the Phase 04 TS port |
| `useNameCheck` hook test [PROPOSED - name TBD] | `12-frontend-dead-code-and-tests` | Debounce and race behavior at the new seam |
| Strengthened `tests/test_seed.py` | `05-backend-seed-data` | Seed equality + referential integrity (audit flags current coverage as weak) |

### Existing Test Files Updated By Multiple Features

| Path | Associated Feature(s) | Purpose |
|---|---|---|
| `yourwolf-backend/tests/conftest.py` | `02-backend-config-database` (rewrite), all backend features (consume) | Env-hack removal; shared fixtures |
| `yourwolf-backend/tests/test_game_service.py` | `07`, `09` | Rule relocation then validator extraction |
| `yourwolf-backend/tests/test_games_router.py` | `04`, `07` | Exception mapping then validation relocation |
| `yourwolf-frontend/src/test/AbilitiesStep.test.tsx` | `03`, `06`, `08` (split), `12` (relocation) | Regression anchor for the AbilitiesStep chain |
| `yourwolf-frontend/src/test/GameSetup.test.tsx`, `WakeOrderResolution.test.tsx` | `06`, `12` (relocation) | Cascade/wake-order behavior anchors |

### Manual QA Checklist

- [ ] Backend: `docker compose up`, seed a fresh database, verify 30 roles listed and one night script generates identically to pre-refactor output for the same role set (features 02, 05, 10)
- [ ] Backend: invalid game start returns 404 vs 400 exactly as before (feature 04)
- [ ] Frontend: full Role Builder wizard walk — create a role with abilities from ≥3 categories, edit every parameter input kind, reorder/remove steps, preview narrator script (features 03, 06, 08, 11)
- [ ] Frontend: game setup → wake order review → facilitator flow end-to-end with dependency-cascading roles (features 06, 12)
- [ ] Lint passes with the import-boundary rule active and zero exemptions after feature 12
