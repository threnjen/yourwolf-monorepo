# PHASE_05A Execution Manifest

## Phase Source

- Phase document: `docs/phases/PHASE_05A/PHASE_05A_SUMMARY.md`
- Run mode: `revalidate`
- Project discovery context: `docs/phases/DISCOVERY_CONTEXT.md`
- Phase discovery context: `docs/phases/PHASE_05A/PHASE_05A_DISCOVERY_CONTEXT.md`
- Last validation revision: `25f2ca8422b9e2eca34811429912285ed21878bf`
- Manifest status: `complete` for the Phase - Execute feature pipeline. All five feature reviews are approved with no unresolved findings. Manual browser QA remains pending by the explicit `qa: no` choice.
- Branch: `phase/phase-05a-local-catalog-and-store`
- QA choice: `no` for optional consolidated automated QA. Record that optional stage as `skipped` and exclude it from the all-approved calculation. Phase-required automated tests passed, and every row in `docs/phases/PHASE_05A/PHASE_05A_QA.md` remains pending.
- Scheduling rule: Features execute one at a time. Read and write sets support revalidation and never authorize concurrent builds.

## Model Route Preflight

| Tier | Requested Model | User Override | Resolved Route | Resolution Status |
|---|---|---|---|---|
| low | `gpt-5.6-luna` | none | `gpt-5.6-luna` | `unverified` |
| medium | `gpt-5.6-luna` | none | `gpt-5.6-luna` | `unverified` |
| high | `gpt-5.6-sol` | none | `gpt-5.6-sol` | `unverified` |

Codex does not report the effective child runtime route, so every feature records `resolved_model_status: unverified`.

## Environment State

| Property | Value |
|---|---|
| Tech stack | Backend: Python 3.14, FastAPI, SQLAlchemy, pytest under `uv`. Frontend: React 18, TypeScript 5.3, Vite 5.4, Vitest 2.1 with jsdom and V8 coverage. Phase additions: exact-pinned `idb` and `fake-indexeddb`. |
| Working tree | HEAD `c124fb8e5b366333722586bba7e94752e1394a82`. Pre-existing user changes: modified `docs/learnings/cross-phase-decisions.md`, untracked `dev/research/`, and baseline artifacts under `dev/feature/PHASE_05A-baseline/`. Preserve them. |
| Backend test runner | From `yourwolf-backend`: `uv run pytest --junitxml=../dev/feature/PHASE_05A-baseline/backend-pytest.xml` |
| Backend test baseline | `executed-green`: 492 total, 492 passed, 0 failed. Artifact: `dev/feature/PHASE_05A-baseline/backend-pytest.xml`. |
| Frontend test runner | From `yourwolf-frontend`: `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/PHASE_05A-baseline/frontend-vitest.xml` |
| Frontend test baseline | `executed-green`: 685 total, 685 passed, 0 failed. Artifact: `dev/feature/PHASE_05A-baseline/frontend-vitest.xml`. |
| Backend lint | From `yourwolf-backend`: `uv run mypy app` |
| Backend format | From `yourwolf-backend`: `uv run black --check app tests` and `uv run isort --check-only app tests` |
| Frontend lint | From `yourwolf-frontend`: `npm run lint` |
| Frontend format | No format script is configured in `yourwolf-frontend/package.json`; match existing formatting. |
| Frontend build | From `yourwolf-frontend`: `npm run build` |
| Coverage gate | Backend and frontend enforce at least 80 percent coverage. Frontend thresholds cover lines, branches, functions, and statements. |

## Phase-to-Feature Fidelity

| Phase Deliverable | Feature | Departure |
|---|---|---|
| Seed data files | `01-seed-data-files` | None |
| Repository interface and IndexedDB implementation | `02-indexeddb-repositories` | None |
| Bootstrap and catalog reads | `03-catalog-bootstrap` | None |
| Game snapshot on the repository | `04-game-snapshot-repository` | None |
| Local role save and manual QA | `05-local-role-save-and-qa` | None; the final feature explicitly carries the Integration Feature Rule's combined launch and smoke proof. |

No requirement was moved, deferred, renamed, reordered, split, merged, or delayed. The refined phase's suggested order matches verified runtime prerequisites.

## Ordered Feature List

| Order | Feature | Status | Prerequisites | Model Tier | Sequential Reason |
|---|---|---|---|---|---|
| 1 | `01-seed-data-files` | complete | None | low | Creates the canonical JSON ability source and frontend seed copies used by the data layer. |
| 2 | `02-indexeddb-repositories` | complete | `01-seed-data-files` | high | Consumes both seed files and establishes every repository, record, id, metadata, and transaction contract. |
| 3 | `03-catalog-bootstrap` | complete | `02-indexeddb-repositories` | high | Consumes repository and bootstrap contracts to wire the provider, app gate, test helper, and catalog reads. |
| 4 | `04-game-snapshot-repository` | complete | `02-indexeddb-repositories`, `03-catalog-bootstrap` | medium | Uses `GameRepository`, the provider, and render helper to replace synchronous session storage safely. |
| 5 | `05-local-role-save-and-qa` | complete | `02-indexeddb-repositories`, `03-catalog-bootstrap`, `04-game-snapshot-repository` | medium | Uses the complete local data stack, changes builder persistence, and verifies all phase features together. |

## Prerequisite Graph

```text
01-seed-data-files ──> 02-indexeddb-repositories
02-indexeddb-repositories ──> 03-catalog-bootstrap
02-indexeddb-repositories ──> 04-game-snapshot-repository
03-catalog-bootstrap ──> 04-game-snapshot-repository
02-indexeddb-repositories ──> 05-local-role-save-and-qa
03-catalog-bootstrap ──> 05-local-role-save-and-qa
04-game-snapshot-repository ──> 05-local-role-save-and-qa
```

The graph orders eligibility only. Phase - Execute builds one feature at a time.

Revalidation Round 5 settled in one graph pass at `25f2ca8`: Feature 05 completed with no future feature or downstream dependent left to mark stale. No prerequisite edge or execution order changed, so the five-feature schedule and Phase - Execute feature loop are complete.

## Feature Records

### 01-seed-data-files

- `status`: `complete`
- `execution_order`: `1`
- `prerequisites`: `[]`
- `expected_read_set`:
  - `docs/phases/PHASE_05A/PHASE_05A_SUMMARY.md`
  - `yourwolf-backend/app/seed/abilities.py`
  - `yourwolf-backend/app/seed/roles.py`
  - `yourwolf-backend/app/seed/data/roles.json`
  - `yourwolf-backend/tests/test_seed.py`
  - `yourwolf-frontend/package.json`
- `expected_write_set`:
  - `yourwolf-backend/app/seed/abilities.py`
  - `yourwolf-backend/app/seed/data/abilities.json`
  - `yourwolf-backend/tests/test_seed.py`
  - `yourwolf-frontend/src/data/seed/roles.json`
  - `yourwolf-frontend/src/data/seed/abilities.json`
  - `yourwolf-frontend/src/test/data/seed_parity.test.ts`
  - `yourwolf-frontend/src/test/data/node_modules.d.ts`
  - `yourwolf-frontend/package.json`
  - `yourwolf-frontend/package-lock.json`
- `plan_revision`: `1`
- `last_validation_commit`: `d511d733d8ba2809717d439044cf9582b28ed1cc`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `implementation_result`: `complete`
- `implementation_commit`: `e9bd482`
- `review_commit`: `d511d73`
- `review_verdict`: `Approved`
- `fix_round_count`: `1`
- `unfixed_findings`: `none`
- `verification_assets`:
  - Selection delta at `dev/feature/01-seed-data-files/01-seed-data-files-delta.md`.
  - Implementation record at `dev/feature/01-seed-data-files/01-seed-data-files-implementation.md`.
  - Approved review at `dev/feature/01-seed-data-files/01-seed-data-files-review.md`; one repair round, no unfixed findings.
  - Backend focused seed result at `dev/feature/01-seed-data-files/backend-seed-repair.xml`: 45 total, 45 passed, 0 failed.
  - Frontend focused parity result at `dev/feature/01-seed-data-files/frontend-seed-parity-repair.xml`: 3 total, 3 passed, 0 failed.
  - Backend integration gate at `dev/feature/01-seed-data-files/backend-integration-gate.xml`: 503 total, 503 passed, 0 failed.
  - Frontend integration gate at `dev/feature/01-seed-data-files/frontend-integration-gate.xml`: 688 total, 688 passed, 0 failed.
  - `npm run seed:refresh`, frontend lint and build, and scoped backend Black and isort checks: executed-green in implementation and review evidence.

### 02-indexeddb-repositories

- `status`: `complete`
- `execution_order`: `2`
- `prerequisites`: `[01-seed-data-files]`
- `expected_read_set`:
  - `dev/feature/01-seed-data-files/01-seed-data-files-implementation.md`
  - `dev/feature/01-seed-data-files/01-seed-data-files-review.md`
  - `yourwolf-frontend/src/data/seed/roles.json`
  - `yourwolf-frontend/src/data/seed/abilities.json`
  - `yourwolf-frontend/src/types/transport.ts`
  - `yourwolf-frontend/src/types/game.ts`
  - `yourwolf-frontend/src/domain/roleDraft.ts`
  - `yourwolf-frontend/src/storage/game_session_storage.ts`
  - `yourwolf-frontend/eslint.config.js`
  - `yourwolf-frontend/vite.config.ts`
- `expected_write_set`:
  - `yourwolf-frontend/src/data/`
  - Data-layer tests under `[PROPOSED - name TBD]`
  - `yourwolf-frontend/eslint.config.js`
  - `yourwolf-frontend/src/test/setup.ts`
  - `yourwolf-frontend/package.json`
  - `yourwolf-frontend/package-lock.json`
- `plan_revision`: `1`
- `last_validation_commit`: `7c03fdaa866d8e70d0e710d90ea33c13ca67e22c`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `implementation_result`: `complete`
- `implementation_commit`: `0cf39a2`
- `review_commit`: `7c03fda`
- `review_verdict`: `Approved`
- `fix_round_count`: `1`
- `unfixed_findings`: `none`
- `revalidation_evidence`: `Round 2 confirmed all nine acceptance criteria at review commit 7c03fda. The public src/data/index.ts surface exports createIndexedDbRepositories, IndexedDbRepositories, RoleRepository, AbilityRepository, GameRepository, MetadataRepository, createCustomRole, GameSnapshot, and isGameSnapshot. The approved repair pass strengthened snapshot-row validation, deterministic dependency collision rejection, rollback evidence, seed conversion coverage, and reseed coverage without changing the prerequisite graph.`
- `verification_assets`:
  - Selection delta at `dev/feature/02-indexeddb-repositories/02-indexeddb-repositories-delta.md`.
  - Implementation record at `dev/feature/02-indexeddb-repositories/02-indexeddb-repositories-implementation.md`.
  - Approved review at `dev/feature/02-indexeddb-repositories/02-indexeddb-repositories-review.md`; one repair round, no unfixed findings.
  - Frontend focused data result at `dev/feature/02-indexeddb-repositories/review-data-repair.xml`: 16 total, 16 passed, 0 failed.
  - Frontend integration gate at `dev/feature/02-indexeddb-repositories/frontend-integration-gate.xml`: 701 total, 701 passed, 0 failed.
  - Backend integration gate at `dev/feature/02-indexeddb-repositories/backend-integration-gate.xml`: 503 total, 503 passed, 0 failed.
  - Frontend lint, build, exact dependency resolution, and deliberate boundary probes: executed-green in implementation and review evidence.

### 03-catalog-bootstrap

- `status`: `complete`
- `execution_order`: `3`
- `prerequisites`: `[02-indexeddb-repositories]`
- `expected_read_set`:
  - `dev/feature/02-indexeddb-repositories/02-indexeddb-repositories-implementation.md`
  - `dev/feature/02-indexeddb-repositories/02-indexeddb-repositories-review.md`
  - `yourwolf-frontend/src/data/`
  - `yourwolf-frontend/src/App.tsx`
  - `yourwolf-frontend/src/routes.tsx`
  - `yourwolf-frontend/src/hooks/useFetch.ts`
  - `yourwolf-frontend/src/hooks/useRoles.ts`
  - `yourwolf-frontend/src/hooks/useAbilities.ts`
  - `yourwolf-frontend/src/pages/WakeOrderResolution.tsx`
  - `yourwolf-frontend/src/adapters/role_adapters.ts`
  - `yourwolf-frontend/src/test/setup.ts`
- `expected_write_set`:
  - `yourwolf-frontend/src/context/repository_context.tsx`
  - `yourwolf-frontend/src/test/test_utils.tsx`
  - `yourwolf-frontend/src/test/context/repository_context.test.tsx`
  - `yourwolf-frontend/src/App.tsx`
  - `yourwolf-frontend/src/hooks/useRoles.ts`
  - `yourwolf-frontend/src/hooks/useAbilities.ts`
  - `yourwolf-frontend/src/pages/WakeOrderResolution.tsx`
  - `yourwolf-frontend/src/test/setup.ts`
  - `yourwolf-frontend/src/test/App.test.tsx`
  - `yourwolf-frontend/src/test/routes.test.tsx`
  - Delete `yourwolf-frontend/src/test/hooks/useRoles.test.ts`
  - `yourwolf-frontend/src/test/hooks/useRoles.test.tsx`
  - Delete `yourwolf-frontend/src/test/hooks/useAbilities.test.ts`
  - `yourwolf-frontend/src/test/hooks/useAbilities.test.tsx`
  - `yourwolf-frontend/src/test/pages/RolesPage.test.tsx`
  - `yourwolf-frontend/src/test/pages/GameSetup.test.tsx`
  - `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx`
- `plan_revision`: `1`
- `last_validation_commit`: `0c8e39d03ea0f94853942c3b7401ff9dff3cdb0d`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `implementation_result`: `complete`
- `implementation_commit`: `a6c22c8`
- `review_commit`: `0c8e39d`
- `review_verdict`: `Approved`
- `fix_round_count`: `1`
- `unfixed_findings`: `none`
- `revalidation_evidence`: `Round 3 confirmed all eight acceptance criteria at review commit 0c8e39d. RepositoryProvider and useRepositories live in src/context/repository_context.tsx. createRepositoryTestContext and renderWithRepositories live in src/test/test_utils.tsx and provide unique bootstrapped databases with explicit close/delete cleanup. The reviewed Axios guard rejects catalog GET paths while preserving /roles/validate and /roles/check-name. The approved repair pass resolved five findings without changing downstream contracts or the prerequisite graph.`
- `verification_assets`:
  - Selection delta at `dev/feature/03-catalog-bootstrap/03-catalog-bootstrap-delta.md`.
  - Implementation record at `dev/feature/03-catalog-bootstrap/03-catalog-bootstrap-implementation.md`.
  - Approved review at `dev/feature/03-catalog-bootstrap/03-catalog-bootstrap-review.md`; one repair round, no unfixed findings.
  - Frontend focused review result at `dev/feature/03-catalog-bootstrap/frontend-review-focused.xml`: 147 total, 147 passed, 0 failed.
  - Frontend integration gate at `dev/feature/03-catalog-bootstrap/frontend-integration-gate.xml`: 707 total, 707 passed, 0 failed.
  - Backend integration gate at `dev/feature/03-catalog-bootstrap/backend-integration-gate.xml`: 503 total, 503 passed, 0 failed.
  - Frontend lint, build, and `git diff --check`: executed-green in implementation and review evidence.

### 04-game-snapshot-repository

- `status`: `complete`
- `execution_order`: `4`
- `prerequisites`: `[02-indexeddb-repositories, 03-catalog-bootstrap]`
- `expected_read_set`:
  - `dev/feature/02-indexeddb-repositories/02-indexeddb-repositories-implementation.md`
  - `dev/feature/02-indexeddb-repositories/02-indexeddb-repositories-review.md`
  - `dev/feature/03-catalog-bootstrap/03-catalog-bootstrap-implementation.md`
  - `dev/feature/03-catalog-bootstrap/03-catalog-bootstrap-review.md`
  - `yourwolf-frontend/src/data/`
  - `yourwolf-frontend/src/context/repository_context.tsx`
  - `yourwolf-frontend/src/test/test_utils.tsx`
  - `yourwolf-frontend/src/test/setup.ts`
  - `yourwolf-frontend/src/storage/game_session_storage.ts`
  - `yourwolf-frontend/src/hooks/useGame.ts`
  - `yourwolf-frontend/src/pages/WakeOrderResolution.tsx`
  - `yourwolf-frontend/src/pages/GameFacilitator.tsx`
- `expected_write_set`:
  - `yourwolf-frontend/src/data/`
  - `yourwolf-frontend/src/hooks/useGame.ts`
  - `yourwolf-frontend/src/pages/WakeOrderResolution.tsx`
  - `yourwolf-frontend/src/pages/GameFacilitator.tsx`
  - `yourwolf-frontend/src/test/hooks/useGame.test.ts`
  - `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx`
  - `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx`
  - `yourwolf-frontend/src/test/routes.test.tsx`
  - Delete `yourwolf-frontend/src/storage/game_session_storage.ts`
  - Delete `yourwolf-frontend/src/test/storage/game_session_storage.test.ts`
- `plan_revision`: `1`
- `last_validation_commit`: `e1a72c2aa84b5d9c8fae2aa68c2d56881e026f71`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `implementation_result`: `complete`
- `implementation_commit`: `2711232`
- `review_commit`: `e1a72c2`
- `review_verdict`: `Approved`
- `fix_round_count`: `1`
- `unfixed_findings`: `none`
- `revalidation_evidence`: `Round 4 confirmed all eight acceptance criteria at review commit e1a72c2. useGame and useNightScript read through repositories.games, WakeOrderResolutionPage awaits the initial snapshot write before navigation, and GameFacilitatorContent awaits start and advance writes before refetching. The canonical GameSnapshot guard remains in src/data, missing or corrupt rows preserve null semantics, and source search found no sessionStorage, game_session_storage, saveGameSnapshot, or loadGameSnapshot references. The approved repair pass closed four lifecycle and guard-coverage findings without changing the prerequisite graph.`
- `verification_assets`:
  - Selection delta at `dev/feature/04-game-snapshot-repository/04-game-snapshot-repository-delta.md`.
  - Implementation record at `dev/feature/04-game-snapshot-repository/04-game-snapshot-repository-implementation.md`.
  - Approved review at `dev/feature/04-game-snapshot-repository/04-game-snapshot-repository-review.md`; one repair round, no unfixed findings.
  - Frontend integration gate at `dev/feature/04-game-snapshot-repository/frontend-integration-gate.xml`: 709 total, 709 passed, 0 failed.
  - Backend integration gate at `dev/feature/04-game-snapshot-repository/backend-integration-gate.xml`: 503 total, 503 passed, 0 failed.
  - Frontend lint, build, and exact forbidden-reference search: executed-green in implementation and review evidence.

### 05-local-role-save-and-qa

- `status`: `complete`
- `execution_order`: `5`
- `prerequisites`: `[02-indexeddb-repositories, 03-catalog-bootstrap, 04-game-snapshot-repository]`
- `expected_read_set`:
  - `dev/feature/02-indexeddb-repositories/02-indexeddb-repositories-implementation.md`
  - `dev/feature/02-indexeddb-repositories/02-indexeddb-repositories-review.md`
  - `dev/feature/03-catalog-bootstrap/03-catalog-bootstrap-implementation.md`
  - `dev/feature/03-catalog-bootstrap/03-catalog-bootstrap-review.md`
  - `dev/feature/04-game-snapshot-repository/04-game-snapshot-repository-implementation.md`
  - `dev/feature/04-game-snapshot-repository/04-game-snapshot-repository-review.md`
  - `yourwolf-frontend/src/data/`
  - `yourwolf-frontend/src/context/repository_context.tsx`
  - `yourwolf-frontend/src/test/test_utils.tsx`
  - `yourwolf-frontend/src/pages/RoleBuilder.tsx`
  - `yourwolf-frontend/src/hooks/useNameCheck.ts`
  - `yourwolf-frontend/src/api/roles.ts`
  - `yourwolf-frontend/src/pages/RolesPage.tsx`
  - `yourwolf-frontend/src/pages/GameSetup.tsx`
  - `yourwolf-frontend/src/test/setup.ts`
  - `docs/phases/PHASE_04B/PHASE_04B_QA.md`
- `expected_write_set`:
  - `yourwolf-frontend/src/pages/RoleBuilder.tsx`
  - `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`
  - `yourwolf-frontend/src/test/pages/RolesPage.test.tsx`
  - `yourwolf-frontend/src/test/pages/GameSetup.test.tsx`
  - `yourwolf-frontend/src/test/routes.test.tsx`
  - `yourwolf-frontend/src/test/setup.ts`
  - Affected data and integration tests at `[PROPOSED - name TBD]`
  - `docs/phases/PHASE_05A/PHASE_05A_QA.md`
- `plan_revision`: `1`
- `last_validation_commit`: `25f2ca8422b9e2eca34811429912285ed21878bf`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `implementation_result`: `complete`
- `implementation_commit`: `090b698`
- `review_commit`: `25f2ca8`
- `review_verdict`: `Approved`
- `fix_round_count`: `1`
- `unfixed_findings`: `none`
- `manual_qa_status`: `pending — explicitly not executed because the user selected qa: no`
- `revalidation_evidence`: `Round 5 confirmed all eight acceptance criteria at review commit 25f2ca8. The builder performs local case-insensitive collision checks before retained server validation and name checks, writes complete private records through repositories.roles.put, and exposes saved roles through repository-backed consumers. The combined provider smoke reaches Game Over with no Axios calls. The review repair closed all five findings. The final integration gates report 715/715 frontend tests with 92.27% line coverage and 503/503 backend tests. No future feature or downstream dependent remains, every prerequisite is complete, and no reorder, split, merge, delay, or prerequisite change is required.`
- `verification_assets`:
  - Plan at `dev/feature/05-local-role-save-and-qa/05-local-role-save-and-qa-plan.md`.
  - Selection delta at `dev/feature/05-local-role-save-and-qa/05-local-role-save-and-qa-delta.md`.
  - Implementation record at `dev/feature/05-local-role-save-and-qa/05-local-role-save-and-qa-implementation.md`.
  - Approved review at `dev/feature/05-local-role-save-and-qa/05-local-role-save-and-qa-review.md`; one repair round, no unfixed findings.
  - Frontend integration gate at `dev/feature/05-local-role-save-and-qa/frontend-integration-gate.xml`: 715 total, 715 passed, 0 failed; 92.27% line coverage.
  - Backend integration gate at `dev/feature/05-local-role-save-and-qa/backend-integration-gate.xml`: 503 total, 503 passed, 0 failed.
  - Frontend lint, build, `git diff --check`, and exact forbidden-endpoint searches: executed-green in implementation and review evidence.
  - Manual checklist at `docs/phases/PHASE_05A/PHASE_05A_QA.md`: present with all 32 numbered rows pending.

## Expected Lifecycle Artifacts

| Feature | Lightweight Plan | Selection Delta |
|---|---|---|
| `01-seed-data-files` | `dev/feature/01-seed-data-files/01-seed-data-files-plan.md` | `dev/feature/01-seed-data-files/01-seed-data-files-delta.md` |
| `02-indexeddb-repositories` | `dev/feature/02-indexeddb-repositories/02-indexeddb-repositories-plan.md` | `dev/feature/02-indexeddb-repositories/02-indexeddb-repositories-delta.md` |
| `03-catalog-bootstrap` | `dev/feature/03-catalog-bootstrap/03-catalog-bootstrap-plan.md` | `dev/feature/03-catalog-bootstrap/03-catalog-bootstrap-delta.md` |
| `04-game-snapshot-repository` | `dev/feature/04-game-snapshot-repository/04-game-snapshot-repository-plan.md` | `dev/feature/04-game-snapshot-repository/04-game-snapshot-repository-delta.md` |
| `05-local-role-save-and-qa` | `dev/feature/05-local-role-save-and-qa/05-local-role-save-and-qa-plan.md` | `dev/feature/05-local-role-save-and-qa/05-local-role-save-and-qa-delta.md` |

Initial mode creates only plans and this manifest. It creates no delta, context, or task file.

## Verification Assets

### Baseline Artifacts

- Backend command: `uv run pytest --junitxml=../dev/feature/PHASE_05A-baseline/backend-pytest.xml`
- Backend artifact: `dev/feature/PHASE_05A-baseline/backend-pytest.xml` — 492 total, 492 passed, 0 failed.
- Frontend command: `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/PHASE_05A-baseline/frontend-vitest.xml`
- Frontend artifact: `dev/feature/PHASE_05A-baseline/frontend-vitest.xml` — 685 total, 685 passed, 0 failed.

### Existing Shared Assets

- `yourwolf-backend/tests/test_seed.py`: backend seed loading, validation, idempotency, and error seams.
- `yourwolf-frontend/vite.config.ts`: jsdom, V8 coverage, and global 80 percent thresholds.
- `yourwolf-frontend/eslint.config.js`: pure-layer import boundary to extend to `src/data/`.
- `yourwolf-frontend/src/test/setup.ts`: global Axios guard and future `fake-indexeddb/auto` setup.
- `yourwolf-frontend/src/test/adapters/role_adapters.test.ts`: local full-record compatibility seam.
- `yourwolf-frontend/src/test/storage/game_session_storage.test.ts`: existing snapshot shape, guard, and absence semantics to migrate.
- Existing hook and page suites for roles, abilities, game, wake order, facilitator, builder, roles page, game setup, app, and routes.

### Phase-Scoped Test Pattern

- Backend affected pattern: `yourwolf-backend/tests/test_seed.py`.
- Frontend affected pattern: `yourwolf-frontend/src/test/{data,hooks,pages,adapters,storage}/**/*.test.{ts,tsx}` plus `yourwolf-frontend/src/test/{App,routes}.test.tsx`; the concrete seed parity suite is `yourwolf-frontend/src/test/data/seed_parity.test.ts`.
- Full backend gate: the backend baseline command from `yourwolf-backend`.
- Full frontend gate: the frontend baseline command from `yourwolf-frontend`, plus `npm run lint` and `npm run build`.

### Durable Checkpoints

- After Feature 01: canonical JSON loads, copied seeds match, and the mutation check proves drift detection.
- After Feature 02: repository contracts, atomic reseed, stable ids, pure-layer lint, and fake IndexedDB tests pass.
- After Feature 03: the app bootstrap gate and every catalog read work without catalog HTTP calls.
- After Feature 04: persistent snapshot reopen tests pass and no source file uses `sessionStorage`.
- After Feature 05: local role save and the combined offline game smoke pass; the manual QA document exists with pending rows.

## Concrete Names Requiring Implementation Choice

The plans intentionally label these unverified names `[PROPOSED - name TBD]`:

- Data-layer test paths.
- Integration test path.

The implementer records the final idiomatic names in the implementation record.

## Revalidation History

### After `05-local-role-save-and-qa`

- Validation revision: `25f2ca8422b9e2eca34811429912285ed21878bf`.
- Implementation commit: `090b698`. Review repair commit: `25f2ca8`.
- Reviewer verdict: Approved after one repair round. No unresolved finding remains.
- Round 1 confirmed Feature 05's local role save, current name-status gate, combined offline smoke, and manual checklist against the implementation and review evidence.
- The frontend integration gate passed 715 of 715 tests with 92.27% line coverage. The backend integration gate passed 503 of 503 tests.
- Optional consolidated automated QA is `skipped` by the explicit `qa: no` choice and is excluded from the all-approved calculation.
- Manual browser QA remains pending. Its pending status does not create an unresolved review finding or block the Phase - Execute feature loop.
- Broad documentation and Phase summary changes remain uncommitted for the later documentation gate. They do not change this feature graph.
- No future feature or downstream dependent remains. The stale set is empty, the order remains 1 → 2 → 3 → 4 → 5, and the graph settled in round 1 within the five-round bound.

## Quality Checklist Result

- All five phase deliverables retain their original order and feature mapping. No fidelity departure was introduced during final revalidation.
- Every feature has a complete status, settled prerequisites, a plan revision, a validation commit, a non-stale reason, and a resolved model status.
- The final numbered feature provides the required integration smoke and manual QA document.
- All five feature reviews are approved, every recorded repair finding is resolved, and the all-approved implementation input is satisfied.
- Optional consolidated automated QA is excluded from all-approved because the user selected `qa: no`.
- Manual browser QA remains visibly pending and is not represented as executed evidence.
- The prerequisite graph is acyclic and settled. No feature remains eligible, planned, or stale.
- This manifest retains the ordered feature list, prerequisite graph, expected lifecycle artifacts, Environment State, and Verification Assets.
- No applicable Quality Checklist item remains unsatisfied.
