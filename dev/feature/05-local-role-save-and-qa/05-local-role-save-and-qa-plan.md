# 05 Local Role Save and QA

## A. Requirements & Traceability

### Acceptance Criteria

- **AC1:** Before any server call, `RoleBuilderPage` compares the draft name with every local role case-insensitively. A collision with an official or custom role shows the existing name-taken message and performs no write.
- **AC2:** The builder still calls `rolesApi.validate` and `rolesApi.checkName` for the two server-backed checks retained until Phase 05B.
- **AC3:** After both server checks pass, the builder maps the draft to the Phase 05A local role shape and writes it with `RoleRepository.put`, `crypto.randomUUID()`, `visibility` `private`, `is_locked` false, zero counters, an empty dependency list, the specified count defaults, and timestamps.
- **AC4:** A local write failure shows the error, keeps the draft visible, and performs no server role creation.
- **AC5:** A saved custom role appears immediately in the roles list and game setup without a reload. `yourwolf-frontend/src/test/setup.ts` rejects `POST /roles` while preserving all earlier guards.
- **AC6:** The complete app launches with the seed catalog, bootstrap gate, catalog reads, persistent game snapshots, and local role save operating together through one repository provider.
- **AC7:** Automated smoke coverage proves a full game can complete without any `/api/v1` request when the builder is not used. Global frontend coverage remains at least 80 percent.
- **AC8:** `docs/phases/PHASE_05A/PHASE_05A_QA.md` covers first launch, backend-stopped full game, custom-role visibility, close and reopen at every phase, complete-view reopen, two-tab refresh behavior, seed-version reseed, and the dev-versus-production origin note. Every manual row remains pending until a human or browser-capable runner records it.

### Non-Goals

- Do not port draft validation or the server name check; Phase 05B owns them.
- Do not delete Axios or the remaining transport types.
- Do not add editing, deletion, export, import, sync, Tauri, or live cross-tab behavior.
- Do not execute manual QA in this feature; the user selected `qa: no` for the optional Phase - Execute QA run.

### Traceability

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1-AC4 | `yourwolf-frontend/src/pages/RoleBuilder.tsx`, `yourwolf-frontend/src/hooks/useNameCheck.ts`, `yourwolf-frontend/src/data/` | Existing test to update; must-have automated test |
| AC5 | `yourwolf-frontend/src/pages/RolesPage.tsx`, `yourwolf-frontend/src/pages/GameSetup.tsx`, `yourwolf-frontend/src/test/setup.ts` | Existing test to update |
| AC6-AC7 | `yourwolf-frontend/src/App.tsx`, routes and end-to-end component seams | Must-have automated test |
| AC8 | `docs/phases/PHASE_05A/PHASE_05A_QA.md` | Manual QA check; code-review evidence only |

## B. Correctness & Edge Cases

- Normalize only for comparison. Preserve the validated draft name in the stored role.
- Run the local collision check before validation or name-check HTTP calls.
- Do not persist when either server check fails or the server is unreachable.
- Keep the draft and current wizard state after a failed local write.
- Refresh repository-backed consumers after a successful put so the role appears without a page reload.
- Manual steps must use shipped seed defaults and actual controls, per `docs/learnings/review-learnings.md`.

## C. Consistency & Architecture Fit

- Reuse the Feature 02 local record conversion rules and `RoleRepository` contract.
- Reuse Feature 03's provider and shared render helper.
- Keep `rolesApi.validate`, `rolesApi.checkName`, `ValidationResult`, and `NameCheckResult` until Phase 05B.
- Remove only the `rolesApi.create` call path; do not broaden the HTTP cleanup.
- This final feature is the required integration task. It verifies launch, combined runtime operation, and observable smoke behavior across Features 01-04.

## D. Clean Design & Maintainability

- Keep one draft-to-local-record conversion path and one local name comparison.
- Avoid write-through to the server or dual ids.
- Do not duplicate seed defaults inside the page if Feature 02 exposes a cohesive conversion responsibility.
- Keep it clean: local check first, retained server checks second, one local put last, one integration checklist.

## E. Completeness: Observability, Security, Operability

- **Observability:** Reuse the visible builder error state. Add no normal-path logs.
- **Security:** No secrets enter IndexedDB. Preserve server boundary validation until Phase 05B replaces it locally.
- **Runbook:** Run the focused builder and catalog suites, combined smoke test, full frontend coverage, lint, and build. Use `PHASE_05A_QA.md` for manual verification. Roll back the builder save migration as one unit without changing repository data.

## F. Test Plan

- AC1-AC5: update builder, roles page, game setup, routes, and Axios-guard tests.
- AC6-AC7: run a combined application smoke test through first launch and a complete game with forbidden network calls.
- AC8: review the manual checklist against actual routes, controls, seed counts, and network expectations.
- High-value checks:
  1. Given an official role with the same name in different case, when Save is clicked, then the name-taken message appears before any HTTP call or write.
  2. Given a local custom-name collision, when Save is clicked, then nothing is persisted.
  3. Given valid server checks, when local put succeeds, then a private UUID-backed role appears in both roles and setup without reload.
  4. Given local put rejection, when save runs, then the draft remains and no `POST /roles` occurs.
  5. Given a seeded fresh app and no backend, when a game runs through complete and reopens, then all catalog and snapshot behavior works without `/api/v1` traffic.
- Reuse Feature 03's render helper, Feature 02 repository fixtures, and existing RoleBuilder, RolesPage, GameSetup, route, and game-flow tests.
- This changes builder persistence and integrates every phase feature. Existing server-validation and name-check tests remain required, while create-call assertions must become no-POST assertions.
- Stage 0 is not required because the baseline suite exists and the global frontend coverage gate is 80 percent.

## Stage 1: Local Builder Save
**Goal**: Replace server role creation with collision-safe local persistence while retaining the two required server checks.
**Success Criteria**: AC1-AC5 pass.
**Status**: Not Started

## Stage 2: Integrated Runtime and Manual QA Document
**Goal**: Prove the phase features launch and operate together, then document executable manual acceptance steps.
**Success Criteria**: AC6-AC8 pass and the manual checklist remains honestly pending.
**Status**: Not Started
