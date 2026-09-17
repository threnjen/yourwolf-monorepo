# 03 HTTP Removal and Offline Verification

## A. Requirements & Traceability

### Acceptance Criteria

- **AC1:** `yourwolf-frontend/src/api/` and the three suites under `yourwolf-frontend/src/test/api/` no longer exist. No frontend source or test imports them.
- **AC2:** `axios` is absent from `yourwolf-frontend/package.json` and `yourwolf-frontend/package-lock.json`, with the lockfile synchronized through npm.
- **AC3:** The Axios forbidden-request mock is removed from `yourwolf-frontend/src/test/setup.ts`, and its direct assertions and API mocks are removed from `yourwolf-frontend/src/test/routes.test.tsx`.
- **AC4:** `VITE_API_URL` is absent from `yourwolf-frontend/.env.example`, `yourwolf-frontend/README.md`, and `yourwolf-frontend/src/vite-env.d.ts`. The frontend README no longer documents `src/api/` or Axios. Root README backend URL documentation remains unchanged.
- **AC5:** `NameCheckResult` is removed from `yourwolf-frontend/src/types/transport.ts`. Its header and `yourwolf-frontend/src/domain/roleDraft.ts` comments no longer point to `src/api/roles.ts`. No other type is renamed or relocated.
- **AC6:** `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` contains a browser-level automated test that renders the builder, edits a draft to trigger validation and name checking, and proves that neither `fetch` nor `XMLHttpRequest` issues a request.
- **AC7:** `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx` replaces its Axios method-list assertion with the same fetch/XMLHttpRequest proof mechanism.
- **AC8:** `docs/phases/PHASE_05B/PHASE_05B_QA.md` contains executable manual rows for backend-offline startup, each user-reachable validation error and warning, 51-character guidance, official and private case-variant collisions, and a successful save. It maps validation states that shipped controls prevent to automated evidence instead of inventing browser steps. All manual rows remain pending until executed.
- **AC9:** The frontend application builds and launches with Features 1 and 2 wired together. The role builder validates, checks names, previews, and saves locally while the backend is stopped.
- **AC10:** Full frontend tests, 80-percent coverage thresholds, lint, build, dependency checks, zero-network proof, and unchanged-scope checks all pass. The backend baseline remains green because the phase changes no backend files.
- **AC11:** `yourwolf-frontend/src/engine/` and `yourwolf-frontend/src/data/seed/` remain unchanged.

### Non-Goals

- Do not remove or modify backend validation and name-check endpoints.
- Do not remove root README backend URL documentation.
- Do not change role validation semantics, repositories, engine behavior, or seed catalogs.
- Do not execute manual QA in this feature. The user selected `qa: no`; create the required checklist with pending rows.
- Do not address Phase 05a's unrelated pending browser rows.

### Traceability

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1-AC3 | `yourwolf-frontend/src/api/`, `yourwolf-frontend/src/test/api/`, `yourwolf-frontend/src/test/setup.ts`, `yourwolf-frontend/src/test/routes.test.tsx` | Code-review evidence only; existing test to update |
| AC2, AC4-AC5 | `yourwolf-frontend/package.json`, `yourwolf-frontend/package-lock.json`, `yourwolf-frontend/.env.example`, `yourwolf-frontend/README.md`, `yourwolf-frontend/src/vite-env.d.ts`, `yourwolf-frontend/src/types/transport.ts`, `yourwolf-frontend/src/domain/roleDraft.ts` | Code-review evidence only; must-have automated test |
| AC6-AC7 | `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`, `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx`, `yourwolf-frontend/src/test/test_utils.tsx` | Must-have automated test |
| AC8 | `docs/phases/PHASE_05B/PHASE_05B_QA.md` | Manual QA check |
| AC9-AC11 | `yourwolf-frontend/src/pages/RoleBuilder.tsx`, `yourwolf-frontend/src/domain/roleValidation.ts`, `yourwolf-frontend/src/hooks/useNameCheck.ts`, unchanged `yourwolf-frontend/src/engine/` and `yourwolf-frontend/src/data/seed/` | Must-have automated test; code-review evidence only; manual QA check |

## B. Correctness & Edge Cases

- Install both network spies before rendering. Fail on any attempted request, not only a known URL.
- Exercise enough builder interaction to pass both debounces and reach local validation plus name status.
- Restore global browser APIs after each test so the proof cannot leak into unrelated suites.
- Ensure removing Axios mocks does not leave tests depending on accidental module hoisting or inert assertions.
- Confirm lockfile removal deletes Axios and dependencies that npm no longer needs without hand-editing the lockfile.
- Preserve all non-API transport types and backend documentation.
- Keep manual steps executable with shipped controls and local seed data. State the route, action, visible result, and absence of network traffic.
- Do not create manual rows that require impossible draft states. The UI blocks navigation for names shorter than two characters, forces the first modifier to `none`, renumbers step order, permits one primary condition, and supplies only catalog abilities. It also maps a cleared wake-order input to `0`, so steps plus `wake_order: null` cannot be built through the UI. A valid local catalog cannot contain the one-character role needed to combine a length error with a collision.
- Treat no observed request as insufficient unless the test proves the relevant builder paths executed.

## C. Consistency & Architecture Fit

- Use npm as the dependency and lockfile authority.
- Follow the existing browser integration-test conventions under `yourwolf-frontend/src/test/integration/`.
- Replace the obsolete Axios-specific guard with browser-platform request boundaries: `fetch` and `XMLHttpRequest`.
- Keep transport types that still describe retained backend contracts. Remove only the phase-named dead type.
- This is the required final integration feature. It verifies the application launches and the validation, name-check, preview, and repository-save paths operate together without HTTP.

## D. Clean Design & Maintainability

- Delete the dead transport implementation and its tests instead of preserving wrappers with no callers.
- Share one no-network proof mechanism between the existing builder page suite and the updated Phase 05a smoke test when that reuse stays test-local and cohesive.
- No shared fetch/XMLHttpRequest guard exists. Add the smallest shared guard to the existing `yourwolf-frontend/src/test/test_utils.tsx` utility instead of creating another test-support module. Its symbol name is `[PROPOSED - name TBD]`.
- Avoid production instrumentation for a test-only network assertion.
- Keep it clean: no replacement HTTP abstraction, no compatibility shim, and no unused environment declaration.

## E. Completeness: Observability, Security, Operability

- **Observability:** The automated no-network assertion and visible validation/status states replace Axios request-guard diagnostics. Add no production logs.
- **Security:** Removing Axios reduces dependency surface. Retain local input validation and the pre-save duplicate recheck.
- **Runbook:** Run focused integration and builder suites, `npm test -- --run`, `npm run test:coverage`, `npm run lint`, and `npm run build`. Verify no API imports, Axios entries, or frontend `VITE_API_URL` references remain. Roll back deletions and dependency changes together. Use `docs/phases/PHASE_05B/PHASE_05B_QA.md` for later human acceptance.

## F. Test Plan

- AC1-AC5: use source, dependency, and environment absence checks plus TypeScript build evidence. Do not replace deleted API unit tests with tests for nonexistent code.
- AC6: extend `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`. Render the builder, edit a draft and name, advance both debounces, assert local validation and name-status output, then assert zero calls through both browser request APIs.
- AC7: update the Phase 05a smoke test to use the same browser-boundary spies and retain its existing local catalog, game, and role-save coverage.
- AC8: review every manual row for reachable controls and exact visible results. Leave every manual status pending. Record the lower name bound, first-step modifier, absent/inactive ability, duplicate/gapped order, multiple-primary, steps-with-null-wake-order warning, and length-plus-collision cases in an automated-evidence matrix because current controls prevent those visible draft states.
- AC9-AC11: run the complete frontend gate and compare `src/engine/` plus `src/data/seed/` against the feature baseline.
- Test impact note: delete the three API suites because their implementation is deleted. Update route/setup/smoke tests so they no longer assert Axios behavior. Retain all Feature 1 and Feature 2 tests. Manual coverage remains required for browser rendering but is not executed under `qa: no`.
- High-value checks:
  1. Given the backend is unavailable, when the builder renders and a valid draft is edited, then validation and name status settle without any browser request.
  2. Given the same flow, when `fetch` is instrumented, then its call count remains zero after both debounces settle.
  3. Given the same flow, when `XMLHttpRequest` is instrumented, then no instance sends a request.
  4. Given the API directory and Axios dependency are removed, when TypeScript, lint, and all tests run, then no orphaned import remains.
  5. Given all three features are present, when the app launches and a valid role saves, then the local catalog receives it and navigation completes without the backend.
- Reuse `createRepositoryTestContext` and `renderWithRepositories` from `yourwolf-frontend/src/test/test_utils.tsx` for isolated IndexedDB state.
- Reuse the new test-local browser-boundary guard from `yourwolf-frontend/src/test/test_utils.tsx` in both zero-network suites. Restore `fetch` and `XMLHttpRequest` after each test.
- Stage 0 is not required. The latest prerequisite gate has 741 passing frontend tests, and the configured coverage gate is 80 percent.

## Stage 1: Delete Dead Transport Surface
**Goal**: Remove the frontend HTTP client, Axios, obsolete tests, request guard, environment keys, and dead transport references.
**Success Criteria**: AC1-AC5 pass with a synchronized lockfile and clean TypeScript build.
**Status**: Not Started

## Stage 2: Automated Offline Proof
**Goal**: Prove the builder and Phase 05a smoke flow use neither browser request API.
**Success Criteria**: AC6-AC7 pass and each test proves its local path executed.
**Status**: Not Started

## Stage 3: Integrated Launch and Manual QA Handoff
**Goal**: Verify all phase features together and provide an executable pending manual checklist.
**Success Criteria**: AC8-AC11 pass, the application launches, and all automated gates are green.
**Status**: Not Started
