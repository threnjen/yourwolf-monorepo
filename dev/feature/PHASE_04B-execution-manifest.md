# PHASE_04B Execution Manifest

## Phase Source

- Phase document: `docs/phases/PHASE_04B/PHASE_04B_SUMMARY.md`
- Run mode: `revalidate`
- Project discovery context: `docs/phases/DISCOVERY_CONTEXT.md`
- Phase discovery context: `docs/phases/PHASE_04B/PHASE_04B_DISCOVERY_CONTEXT.md`
- Last validation revision: `a2dab69b0b55f87f06dc3c62843bde28310ed28b`
- Manifest status: `complete` for the Phase - Execute feature pipeline. All four feature reviews are approved with no unresolved findings. Manual browser QA remains pending by the explicit `qa: no` choice.
- Branch: `phase/phase-04b-engine-frontend-integration`
- QA choice: `no` for the optional Phase - Execute QA pipeline. The phase-required manual QA document remains implementation scope.
- Scheduling rule: Features execute one at a time. Read and write sets support revalidation and never authorize concurrent builds.

## Environment State

| Property | Value |
|---|---|
| Tech stack | Frontend: React 18, TypeScript 5.3, Vite 5.4, Vitest 2.1 with jsdom and V8 coverage, axios 1.6. Backend reference: Python 3.14, FastAPI, pytest under `uv`. |
| Working tree | Phase branch at `32ee8a7`, pre-existing untracked baseline artifacts under `dev/test-results/`. No source changes were present when planning started. |
| Frontend test runner | From `yourwolf-frontend`: `npm run test:coverage -- --reporter=json --outputFile=../dev/test-results/PHASE_04B-baseline/frontend.json --coverage.reporter=text --coverage.reporter=json-summary --coverage.reportsDirectory=../dev/test-results/PHASE_04B-baseline/frontend-coverage` |
| Frontend test baseline | `executed-green`: 679 total, 679 passed, 0 failed. Artifact: `dev/test-results/PHASE_04B-baseline/frontend.json`. |
| Frontend coverage baseline | 80.57% lines/statements, 90.66% functions, and 94.26% branches. Artifact: `dev/test-results/PHASE_04B-baseline/frontend-coverage/coverage-summary.json`. |
| Backend test runner | From `yourwolf-backend`: `uv run pytest --junitxml=../dev/test-results/PHASE_04B-baseline/backend.xml` |
| Backend test baseline | `executed-green`: 492 total, 492 passed, 0 failed. Artifact: `dev/test-results/PHASE_04B-baseline/backend.xml`. Backend is read-only for this phase. |
| Lint | From `yourwolf-frontend`: `npm run lint` (`eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`). |
| Format | No frontend format script is configured in `yourwolf-frontend/package.json`. Match existing formatting. |
| Build | From `yourwolf-frontend`: `npm run build`. |
| Coverage gate | Global frontend lines, branches, functions, and statements each remain at least 80 percent. |

## Ordered Feature List

| Order | Feature | Status | Prerequisites | Sequential reason |
|---|---|---|---|---|
| 1 | `01-engine-adapters-session-store` | complete | None | Establishes the shared transport adapters, detail fetch, dependency conversion, draft conversion, and durable per-tab session boundary. |
| 2 | `02-local-game-flow` | complete | `01-engine-adapters-session-store` | Consumes every Feature 01 game-facing contract to replace creation, load, script, start, and advance call sites before deleting the games client. |
| 3 | `03-local-narrator-preview` | complete | `01-engine-adapters-session-store`, `02-local-game-flow` | Consumes Feature 01's draft adapter and extends Feature 02's shared axios guard without weakening its no-games regression coverage. |
| 4 | `04-offline-flow-integration` | complete | `02-local-game-flow`, `03-local-narrator-preview` | Verifies the launchable combined application, produces the phase-required manual QA document, and reconciles the Phase summary after all runtime callers exist. |

## Prerequisite Graph

```text
01-engine-adapters-session-store ──> 02-local-game-flow
01-engine-adapters-session-store ──> 03-local-narrator-preview
02-local-game-flow ──> 03-local-narrator-preview
02-local-game-flow ──> 04-offline-flow-integration
03-local-narrator-preview ──> 04-offline-flow-integration
```

The graph orders eligibility only. Phase - Execute builds one feature at a time.

## Feature Records

### 01-engine-adapters-session-store

- `status`: `complete`
- `execution_order`: `1`
- `prerequisites`: `[]`
- `expected_read_set`:
  - `docs/phases/PHASE_04B/PHASE_04B_SUMMARY.md`
  - `docs/phases/DISCOVERY_CONTEXT.md`
  - `docs/phases/PHASE_04B/PHASE_04B_DISCOVERY_CONTEXT.md`
  - `docs/learnings/project-learnings.md`
  - `docs/learnings/cross-phase-decisions.md`
  - `yourwolf-backend/app/schemas/role.py`
  - `yourwolf-frontend/src/types/transport.ts`
  - `yourwolf-frontend/src/domain/roleDraft.ts`
  - `yourwolf-frontend/src/engine/types.ts`
  - `yourwolf-frontend/src/engine/gameSession.ts`
  - `yourwolf-frontend/src/engine/gameSetupValidation.ts`
  - `yourwolf-frontend/src/api/roles.ts`
  - `yourwolf-frontend/src/test/api/roles.api.test.ts`
- `expected_write_set`:
  - `yourwolf-frontend/src/adapters/role_adapters.ts`
  - `yourwolf-frontend/src/storage/game_session_storage.ts`
  - `yourwolf-frontend/src/api/roles.ts`
  - `yourwolf-frontend/src/test/api/roles.api.test.ts`
  - `yourwolf-frontend/src/test/adapters/role_adapters.test.ts`
  - `yourwolf-frontend/src/test/storage/game_session_storage.test.ts`
- `plan_revision`: `2`
- `last_validation_commit`: `c3cb981ddcd19ee357f5ee23efc6a7d3e7a587e3`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `implementation_result`: `complete`
- `implementation_commit`: `9e207b3`
- `review_commit`: `c3cb981`
- `review_verdict`: `Approved`
- `fix_round_count`: `1`
- `unfixed_findings`: `none`
- `verification_assets`:
  - Selection delta at `dev/feature/01-engine-adapters-session-store/01-engine-adapters-session-store-delta.md`.
  - Implementation record at `dev/feature/01-engine-adapters-session-store/01-engine-adapters-session-store-implementation.md`.
  - Approved review at `dev/feature/01-engine-adapters-session-store/01-engine-adapters-session-store-review.md`; one repair round, no unfixed findings.
  - Adapter tests at `yourwolf-frontend/src/test/adapters/role_adapters.test.ts`.
  - Storage tests at `yourwolf-frontend/src/test/storage/game_session_storage.test.ts`.
  - Roles-client tests at `yourwolf-frontend/src/test/api/roles.api.test.ts`.
  - Orchestrator affected result at `dev/test-results/01-engine-adapters-session-store/orchestrator/affected.json`: 167 total, 167 passed, 0 failed.
  - Orchestrator full result at `dev/test-results/01-engine-adapters-session-store/orchestrator/full.json`: 690 total, 690 passed, 0 failed.
  - Orchestrator coverage at `dev/test-results/01-engine-adapters-session-store/orchestrator/coverage/coverage-summary.json`: 80.85% lines/statements, 91.25% functions, and 93.75% branches.
  - `npm run lint` and `npm run build`: executed-green in orchestrator validation.

### 02-local-game-flow

- `status`: `complete`
- `execution_order`: `2`
- `prerequisites`: `[01-engine-adapters-session-store]`
- `expected_read_set`:
  - `dev/feature/01-engine-adapters-session-store/01-engine-adapters-session-store-implementation.md`
  - `dev/feature/01-engine-adapters-session-store/01-engine-adapters-session-store-review.md`
  - `yourwolf-frontend/src/adapters/role_adapters.ts`
  - `yourwolf-frontend/src/storage/game_session_storage.ts`
  - `yourwolf-frontend/src/api/roles.ts`
  - `yourwolf-frontend/src/pages/WakeOrderResolution.tsx`
  - `yourwolf-frontend/src/hooks/useGame.ts`
  - `yourwolf-frontend/src/pages/GameFacilitator.tsx`
  - `yourwolf-frontend/src/domain/wakeOrder.ts`
  - `yourwolf-frontend/src/engine/gameSession.ts`
  - `yourwolf-frontend/src/engine/narration.ts`
  - `yourwolf-frontend/src/types/routerState.ts`
  - `yourwolf-frontend/src/types/game.ts`
  - `yourwolf-frontend/src/api/games.ts`
  - `yourwolf-frontend/src/test/setup.ts`
  - `yourwolf-frontend/src/test/mocks.ts`
- `expected_write_set`:
  - `yourwolf-frontend/src/pages/WakeOrderResolution.tsx`
  - `yourwolf-frontend/src/hooks/useGame.ts`
  - `yourwolf-frontend/src/pages/GameFacilitator.tsx`
  - `yourwolf-frontend/src/types/routerState.ts`
  - `yourwolf-frontend/src/types/game.ts`
  - `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx`
  - `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx`
  - `yourwolf-frontend/src/test/hooks/useGame.test.ts`
  - `yourwolf-frontend/src/test/routes.test.tsx`
  - `yourwolf-frontend/src/test/setup.ts`
  - `yourwolf-frontend/src/test/mocks.ts`
  - Delete `yourwolf-frontend/src/api/games.ts`
  - Delete `yourwolf-frontend/src/test/api/games.api.test.ts`
- `plan_revision`: `1`
- `last_validation_commit`: `e634b3b5852979cdd22dca54a9225d3f208abb1a`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `revalidation_evidence`: `Round 1 confirmed Feature 01 exports adaptRoleToEngine, adaptDependenciesToEngine, rolesApi.getById, GameSnapshot, saveGameSnapshot, and loadGameSnapshot with the planned engine and storage shapes. The prerequisite edge and execution order remain valid.`
- `implementation_result`: `complete`
- `implementation_commit`: `9d76a83`
- `review_commit`: `e634b3b`
- `review_verdict`: `Approved`
- `fix_round_count`: `1`
- `unfixed_findings`: `none`
- `verification_assets`:
  - Selection delta at `dev/feature/02-local-game-flow/02-local-game-flow-delta.md`.
  - Implementation record at `dev/feature/02-local-game-flow/02-local-game-flow-implementation.md`.
  - Approved review at `dev/feature/02-local-game-flow/02-local-game-flow-review.md`; one repair round, no unfixed findings.
  - Feature 01 adapter tests at `yourwolf-frontend/src/test/adapters/role_adapters.test.ts`.
  - Feature 01 storage tests at `yourwolf-frontend/src/test/storage/game_session_storage.test.ts`.
  - Feature 01 roles-client tests at `yourwolf-frontend/src/test/api/roles.api.test.ts`.
  - Completed wake-order page tests at `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx`.
  - Completed local game hook tests at `yourwolf-frontend/src/test/hooks/useGame.test.ts`.
  - Completed facilitator tests at `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx`.
  - Completed route and no-games guard tests at `yourwolf-frontend/src/test/routes.test.tsx`.
  - Existing Phase 04a night-script fixture at `yourwolf-frontend/src/test/engine/night-script.fixture.json`.
  - Shared axios stub at `yourwolf-frontend/src/test/setup.ts`.
  - Orchestrator affected result at `dev/test-results/02-local-game-flow/orchestrator/affected.json`: 230 total, 230 passed, 0 failed.
  - Orchestrator full result at `dev/test-results/02-local-game-flow/orchestrator/full.json`: 686 total, 686 passed, 0 failed.
  - Orchestrator coverage at `dev/test-results/02-local-game-flow/orchestrator/coverage/coverage-summary.json`: 92.2% lines/statements, 93.07% functions, and 94.47% branches.
  - `npm run lint` and `npm run build`: executed-green in orchestrator validation.

### 03-local-narrator-preview

- `status`: `complete`
- `execution_order`: `3`
- `prerequisites`: `[01-engine-adapters-session-store, 02-local-game-flow]`
- `expected_read_set`:
  - `dev/feature/01-engine-adapters-session-store/01-engine-adapters-session-store-implementation.md`
  - `dev/feature/01-engine-adapters-session-store/01-engine-adapters-session-store-review.md`
  - `yourwolf-frontend/src/adapters/role_adapters.ts`
  - `dev/feature/02-local-game-flow/02-local-game-flow-implementation.md`
  - `dev/feature/02-local-game-flow/02-local-game-flow-review.md`
  - `yourwolf-frontend/src/pages/RoleBuilder.tsx`
  - `yourwolf-frontend/src/api/roles.ts`
  - `yourwolf-frontend/src/engine/narration.ts`
  - `yourwolf-frontend/src/types/transport.ts`
  - `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`
  - `yourwolf-frontend/src/test/api/roles.api.test.ts`
  - `yourwolf-frontend/src/test/setup.ts`
  - `yourwolf-frontend/src/test/routes.test.tsx`
- `expected_write_set`:
  - `yourwolf-frontend/src/pages/RoleBuilder.tsx`
  - `yourwolf-frontend/src/api/roles.ts`
  - `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`
  - `yourwolf-frontend/src/test/api/roles.api.test.ts`
  - `yourwolf-frontend/src/test/setup.ts`
  - `yourwolf-frontend/src/test/routes.test.tsx`
- `plan_revision`: `1`
- `last_validation_commit`: `0a28deb7a7360cbffc095d76e04fef5a0210f33c`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `revalidation_evidence`: `Round 1 confirmed rolesApi.previewScript and its two client tests remain available for planned deletion, while rolesApi.validate and Feature 01's adaptDraftToEngine remain unchanged. Feature 02 introduced rejectGamesRequest and route-level guard assertions in shared test files, so Feature 03 now requires Feature 02 and must extend those assets without weakening the /games guard. Round 2 confirmed the added edge changes no execution order.`
- `implementation_result`: `complete`
- `implementation_commit`: `0a28deb`
- `review_commit`: `none — the approved review required no repair commit`
- `review_verdict`: `Approved`
- `fix_round_count`: `0`
- `unfixed_findings`: `none`
- `verification_assets`:
  - Selection delta at `dev/feature/03-local-narrator-preview/03-local-narrator-preview-delta.md`.
  - Implementation record at `dev/feature/03-local-narrator-preview/03-local-narrator-preview-implementation.md`.
  - Approved review at `dev/feature/03-local-narrator-preview/03-local-narrator-preview-review.md`; zero repair rounds and no unfixed findings.
  - Feature 01 adapter tests at `yourwolf-frontend/src/test/adapters/role_adapters.test.ts`.
  - Feature 02 implementation and approved review at `dev/feature/02-local-game-flow/`.
  - Existing role-builder tests at `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`.
  - Existing roles client tests at `yourwolf-frontend/src/test/api/roles.api.test.ts`.
  - Existing Phase 04a preview fixture at `yourwolf-frontend/src/test/engine/preview.fixture.json`.
  - Shared axios no-games guard at `yourwolf-frontend/src/test/setup.ts` and its regression assertions at `yourwolf-frontend/src/test/routes.test.tsx`.
  - Orchestrator affected result at `dev/test-results/03-local-narrator-preview/orchestrator/affected.json`: 126 total, 126 passed, 0 failed.
  - Orchestrator full result at `dev/test-results/03-local-narrator-preview/orchestrator/full.json`: 685 total, 685 passed, 0 failed.
  - Orchestrator coverage at `dev/test-results/03-local-narrator-preview/orchestrator/coverage/coverage-summary.json`: 92.32% lines/statements, 93.01% functions, and 94.46% branches.
  - `npm run lint` and `npm run build`: executed-green in orchestrator validation.

### 04-offline-flow-integration

- `status`: `complete`
- `execution_order`: `4`
- `prerequisites`: `[02-local-game-flow, 03-local-narrator-preview]`
- `expected_read_set`:
  - `dev/feature/01-engine-adapters-session-store/01-engine-adapters-session-store-implementation.md`
  - `dev/feature/01-engine-adapters-session-store/01-engine-adapters-session-store-review.md`
  - `dev/feature/02-local-game-flow/02-local-game-flow-implementation.md`
  - `dev/feature/02-local-game-flow/02-local-game-flow-review.md`
  - `dev/feature/03-local-narrator-preview/03-local-narrator-preview-implementation.md`
  - `dev/feature/03-local-narrator-preview/03-local-narrator-preview-review.md`
  - `yourwolf-frontend/src/routes.tsx`
  - `yourwolf-frontend/src/pages/WakeOrderResolution.tsx`
  - `yourwolf-frontend/src/pages/GameFacilitator.tsx`
  - `yourwolf-frontend/src/hooks/useGame.ts`
  - `yourwolf-frontend/src/storage/game_session_storage.ts`
  - `yourwolf-frontend/src/pages/RoleBuilder.tsx`
  - `yourwolf-frontend/src/test/setup.ts`
  - `yourwolf-frontend/src/test/routes.test.tsx`
  - `yourwolf-frontend/src/test/hooks/useGame.test.ts`
  - `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx`
  - `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx`
  - `yourwolf-frontend/src/test/engine/night-script.fixture.json`
  - `yourwolf-frontend/src/test/engine/preview.fixture.json`
  - `docs/phases/PHASE_04B/PHASE_04B_SUMMARY.md`
- `expected_write_set`:
  - `docs/phases/PHASE_04B/PHASE_04B_QA.md`
  - `docs/phases/PHASE_04B/PHASE_04B_SUMMARY.md`
  - `docs/phases/PROJECT_ROADMAP.md`
  - Affected existing tests only when combined-flow verification exposes a missing assertion.
- `plan_revision`: `2`
- `last_validation_commit`: `a2dab69b0b55f87f06dc3c62843bde28310ed28b`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `revalidation_evidence`: `After Feature 03, round 1 confirmed RoleBuilder uses adaptDraftToEngine and buildPreview locally, rolesApi.validate remains server-backed, the preview client surface is absent, and the shared axios guard rejects both /games and /roles/preview-script. The completed local game-flow tests still cover stored creation, transition, refresh, missing data, warnings, and write failures. Both direct prerequisites are complete. The prerequisite graph and order remain unchanged, so the stale set emptied in round 1.`
- `implementation_result`: `complete`
- `implementation_commit`: `9448ae9`
- `review_commit`: `a2dab69`
- `review_verdict`: `Approved`
- `fix_round_count`: `1`
- `unfixed_findings`: `none`
- `manual_qa_status`: `pending — explicitly not executed because the user selected qa: no`
- `verification_assets`:
  - Selection delta at `dev/feature/04-offline-flow-integration/04-offline-flow-integration-delta.md`.
  - Implementation record at `dev/feature/04-offline-flow-integration/04-offline-flow-integration-implementation.md`.
  - Approved review at `dev/feature/04-offline-flow-integration/04-offline-flow-integration-review.md`; one documentation repair round and no unresolved findings.
  - Completed Feature 01 adapter, storage, and roles-client suites.
  - Completed Feature 02 local-flow suites and orchestrator artifacts under `dev/test-results/02-local-game-flow/orchestrator/`.
  - All focused assets from Features 01-03, including `dev/test-results/03-local-narrator-preview/orchestrator/affected.json` with 126 passing tests.
  - `dev/test-results/03-local-narrator-preview/orchestrator/full.json`: current full frontend result with 685 passing tests.
  - `yourwolf-frontend/src/test/setup.ts` implemented no-games and no-preview guards.
  - Phase 04a night-script and preview fixtures.
  - Confirmed manual QA path at `docs/phases/PHASE_04B/PHASE_04B_QA.md`, with execution status kept distinct from checklist presence.
  - Phase summary reconciliation at `docs/phases/PHASE_04B/PHASE_04B_SUMMARY.md` through `phase-doc-sync`.
  - Orchestrator focused result at `dev/test-results/04-offline-flow-integration/orchestrator/affected.json`: 229 total, 229 passed, 0 failed.
  - Orchestrator full frontend result at `dev/test-results/04-offline-flow-integration/orchestrator/full.json`: 685 total, 685 passed, 0 failed.
  - Orchestrator coverage at `dev/test-results/04-offline-flow-integration/orchestrator/coverage/coverage-summary.json`: 92.32% lines/statements, 93.01% functions, and 94.46% branches.
  - Orchestrator backend result at `dev/test-results/04-offline-flow-integration/orchestrator/backend.xml`: 492 total, 492 passed, 0 failed.
  - `npm run lint` and `npm run build`: executed-green in orchestrator validation.

## Expected Lifecycle Artifacts

| Feature | Lightweight plan | Selection delta |
|---|---|---|
| `01-engine-adapters-session-store` | `dev/feature/01-engine-adapters-session-store/01-engine-adapters-session-store-plan.md` | `dev/feature/01-engine-adapters-session-store/01-engine-adapters-session-store-delta.md` |
| `02-local-game-flow` | `dev/feature/02-local-game-flow/02-local-game-flow-plan.md` | `dev/feature/02-local-game-flow/02-local-game-flow-delta.md` |
| `03-local-narrator-preview` | `dev/feature/03-local-narrator-preview/03-local-narrator-preview-plan.md` | `dev/feature/03-local-narrator-preview/03-local-narrator-preview-delta.md` |
| `04-offline-flow-integration` | `dev/feature/04-offline-flow-integration/04-offline-flow-integration-plan.md` | `dev/feature/04-offline-flow-integration/04-offline-flow-integration-delta.md` |

Initial mode creates only plans and this manifest. It creates no delta, context, or task file.

## Verification Assets

### Baseline artifacts

- `dev/test-results/PHASE_04B-baseline/frontend.json`: 679 total, 679 passed, 0 failed.
- `dev/test-results/PHASE_04B-baseline/backend.xml`: 492 total, 492 passed, 0 failed.
- `dev/test-results/PHASE_04B-baseline/frontend-coverage/coverage-summary.json`: verified global coverage comparison source.

### Existing shared assets

- `yourwolf-frontend/vite.config.ts`: Vitest, jsdom, V8 coverage, and global 80 percent thresholds.
- `yourwolf-frontend/eslint.config.js`: engine/domain import boundaries and React hook enforcement.
- `yourwolf-frontend/src/test/setup.ts`: global axios replacement. It rejects forbidden game and preview requests.
- `yourwolf-frontend/src/test/engine/night-script.fixture.json`: Phase 04a script parity fixture.
- `yourwolf-frontend/src/test/engine/preview.fixture.json`: Phase 04a preview parity fixture.
- `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx`: creation and custom order seam.
- `yourwolf-frontend/src/test/hooks/useGame.test.ts`: game and script hook seam.
- `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx`: phase view and transition seam.
- `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`: debounce, validation, and preview seam.
- `yourwolf-frontend/src/test/api/roles.api.test.ts`: role HTTP client seam.
- `yourwolf-frontend/src/test/routes.test.tsx`: application route seam.

### Phase-scoped test pattern

- Existing affected tests: `yourwolf-frontend/src/test/{api,hooks,pages}/**/*.test.{ts,tsx}` plus `yourwolf-frontend/src/test/routes.test.tsx` and relevant `src/test/engine/` fixture suites.
- Implemented pure-boundary tests: `yourwolf-frontend/src/test/adapters/role_adapters.test.ts` and `yourwolf-frontend/src/test/storage/game_session_storage.test.ts`.
- Full phase gate: all frontend tests and coverage through the Environment State command.

### Manual QA

- `docs/phases/PHASE_04B/PHASE_04B_QA.md` covers the full game flow, refresh in every phase, offline completion, network inspection, missing-game behavior, warnings, and local narrator preview.
- Checklist creation belongs to Feature 04. Actual human execution remains explicitly unverified unless performed.

## Fidelity Record

| Phase requirement | Feature mapping | Departure |
|---|---|---|
| Deliverable 1: adapters, store, and role detail fetch | `01-engine-adapters-session-store` | None. |
| Deliverable 2: local game flow and games client deletion | `02-local-game-flow` | None. |
| Deliverable 3: local narrator preview | `03-local-narrator-preview` | None. |
| Manual QA document, Phase summary reconciliation, and combined runtime proof | `04-offline-flow-integration` | Split from the three suggested implementation features. The separate final feature satisfies the Integration Feature Rule and keeps documentation and combined-flow verification after both runtime branches exist. Phase summary reconciliation was added by the caller's `phase-doc-sync` requirement so completed work is not left described as planned. |
| Suggested order: adapters/store → local game flow → local preview | Execution order 1 → 2 → 3 | Runtime behavior remains independent, but Feature 02 established the shared no-games axios guard and its route regression. Feature 03 now names Feature 02 as a scheduling prerequisite so its no-preview extension preserves that contract. The stated order does not change. |
| Final launchable integration task | `04-offline-flow-integration` after Features 02 and 03 | Added as the final numbered feature because the three runtime features must work together in the application. |
| Transport `Role` fields | Feature 01 preserves the existing `Role`, `RoleListItem` supplies counts, primary-team status, and dependencies | The project discovery statement that `Role` should gain fields is superseded by `PHASE_04B_DISCOVERY_CONTEXT.md` and the Phase document. This is a documented correction, not phase drift. |
| Offline manual-QA timing | Feature 04 stops the backend only after `GET /roles/{id}` detail fetches succeed and the local session is stored | Clarifies conflicting phase text. The explicit Start Game detail-fetch requirement makes completion impossible if the backend stops immediately after only the list response. The detail-fetch contract governs. |
| Backend remains unchanged | All features | None. Backend tests are baseline evidence only. |
| Optional QA pipeline | Not scheduled | None. The user selected `qa: no`, phase-required test maintenance and the manual QA document remain acceptance work. |
| Roadmap synchronization | `04-offline-flow-integration` | `docs/phases/PROJECT_ROADMAP.md` joined the actual write set during `phase-doc-sync` because Phase 04b's visible status changed from Planned to In Progress. This was documentation synchronization, not added product scope. |
| Manual combined-flow execution | `04-offline-flow-integration` | The plan supplied an executable checklist, but browser, Network-panel, backend-offline, and storage-failure rows remain pending by the explicit `qa: no` choice. Automated integration evidence is green, and no document claims manual execution. |

No product requirement was deferred beyond PHASE_04B, renamed as established, reordered, merged, or delayed. The only split is the final integration/manual-QA feature recorded above. Manual checklist execution remains pending by the explicit `qa: no` choice.

## Proposed Names

None. The caller confirmed `docs/phases/PHASE_04B/PHASE_04B_QA.md`, and Feature 04 introduces no planned production symbol.

## Revalidation History

### After `01-engine-adapters-session-store`

- Validation revision: `c3cb981ddcd19ee357f5ee23efc6a7d3e7a587e3`.
- Implementation commit: `9e207b3`. Review commit: `c3cb981`.
- Round 1 revalidated `02-local-game-flow`, `03-local-narrator-preview`, and downstream `04-offline-flow-integration` against the implemented adapter, storage, and role-detail contracts.
- The stale set emptied in round 1. The prerequisite graph and execution order did not change, so the schedule settled within the five-round bound.

### After `02-local-game-flow`

- Validation revision: `e634b3b5852979cdd22dca54a9225d3f208abb1a`.
- Implementation commit: `9d76a83`. Review commit: `e634b3b`.
- Round 1 revalidated `03-local-narrator-preview` against the unchanged roles client and the implemented shared no-games guard. It added `02-local-game-flow` as a prerequisite because Feature 03 modifies `src/test/setup.ts` and now must preserve Feature 02's `rejectGamesRequest` contract and route-level regression assertions.
- Round 1 also revalidated `04-offline-flow-integration` against the completed local session flow and confirmed the games client, dedicated suite, game mocks, and `gamesApi` references are absent.
- Round 2 propagated the new `02-local-game-flow` to `03-local-narrator-preview` edge through Feature 04. Feature 04's direct prerequisites remained unchanged, the stale set emptied, and execution order stayed 1 → 2 → 3 → 4.
- The graph settled in round 2 within the five-round bound.

### After `03-local-narrator-preview`

- Validation revision: `0a28deb7a7360cbffc095d76e04fef5a0210f33c`.
- Implementation commit: `0a28deb`. Review verdict: Approved. No repair commit was created.
- Round 1 revalidated `04-offline-flow-integration` against the implemented local preview caller, the retained server validation call, and the combined `/games` plus `/roles/preview-script` shared guard.
- Round 1 confirmed Features 02 and 03 are complete, Feature 04's direct prerequisites and order remain valid, and its verification assets match current source and tests.
- The caller-confirmed QA path and `phase-doc-sync` requirement revised Feature 04's plan and documentation write set. They did not change a prerequisite edge.
- The stale set emptied in round 1. The graph settled within the five-round bound, and Feature 04 became eligible for selection.

### After `04-offline-flow-integration`

- Validation revision: `a2dab69b0b55f87f06dc3c62843bde28310ed28b`.
- Implementation commit: `9448ae9`. Review repair commit: `a2dab69`.
- Reviewer verdict: Approved after one bounded documentation repair pass. No unresolved finding remains.
- Round 1 confirmed the repair changed documentation and planning records only. It corrected executable checklist details and synchronized the Phase summary while preserving all runtime contracts and prerequisite edges.
- Orchestrator verification passed 229 focused frontend tests, 685 full frontend tests, and 492 backend tests. Coverage remained 92.32% lines/statements, 93.01% functions, and 94.46% branches. Lint and build were green.
- The actual documentation write set includes `docs/phases/PROJECT_ROADMAP.md` because `phase-doc-sync` synchronized the visible Phase 04b status. This fidelity departure changes no feature prerequisite or product scope.
- Manual browser QA and the optional consolidated QA pipeline remain unexecuted by the explicit `qa: no` choice. This pending external verification does not create an unresolved review finding.
- No future feature remains. The stale set is empty, the order remains 1 → 2 → 3 → 4, and the schedule settled in round 1 within the five-round bound.

## Revalidation Triggers

- Feature 01 completion revalidates Features 02 and 03 against the implemented adapter, storage, and `rolesApi.getById` contracts, then revalidates Feature 04 transitively if prerequisite edges change.
- Feature 02 completion revalidates Feature 03 for shared `src/test/setup.ts` and roles-client test scope, then revalidates Feature 04 against the actual local game flow.
- Feature 03 completion revalidates Feature 04 against the actual preview caller and shared axios guard.
- Any changed engine public contract, storage snapshot shape, route path, or shared axios stub marks every dependent feature stale.
- Revalidation continues to a fixed point, with at most five graph rounds per completed feature.

## Quality Checklist Result

- All Phase 04b requirements are represented by numbered, testable acceptance criteria and explicit non-goals.
- Every plan contains a complete acceptance-criteria traceability table using the required evidence taxonomy.
- Verified concrete names cite existing paths and symbols. Feature 04's QA path is caller-confirmed, and speculative test method names are omitted.
- Feature 01 owns the cross-feature adapter, role-fetch, dependency, draft, and storage contracts required downstream.
- Edge cases cover nullable transport values, corrupt storage, detail-fetch failure, write failure, refresh, malformed router state, warnings, unknown game ids, and stale preview work.
- Test maintenance explicitly covers every affected existing suite and the deleted games client test.
- The executed frontend baseline exceeds 50 percent coverage and all 679 tests pass, so no Stage 0 test prerequisite is required.
- Observability, security, rollback, and operability decisions appear in every plan.
- The final numbered feature is an integration task whose criteria require a launchable combined application and human-verifiable smoke path.
- All four feature reviews are Approved, all repair findings are resolved, and the all-approved implementation input is satisfied.
- Manual browser QA remains visibly pending and is not represented as executed evidence.
- This manifest contains the ordered feature list, prerequisite graph, expected plan and delta files, every required feature field, Environment State, and Verification Assets.
- No Quality Checklist item remains unsatisfied.
